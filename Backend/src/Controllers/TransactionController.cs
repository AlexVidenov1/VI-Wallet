using OfficeOpenXml;
using System.IO;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using ViWallet.Data;
using ViWallet.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace ViWallet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController : ControllerBase
    {
        private readonly AppDbContext _ctx;

        public TransactionsController(AppDbContext ctx)
        {
            _ctx = ctx;
        }

        [Authorize]
        [HttpPost("send")]
        public async Task<IActionResult> Send([FromBody] SendMoneyDto dto)
        {
            if (dto.Amount <= 0)
                return BadRequest("Amount must be a positive number.");

            
            var senderId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var sWallet = await _ctx.Wallets
                .FirstOrDefaultAsync(w => w.OwnerId == senderId && w.CurrencyId == dto.CurrencyId);
            if (sWallet == null) return BadRequest("Sender has no wallet in that currency");

            if (sWallet.Balance < dto.Amount) return BadRequest("Insufficient funds");

            var receiverExists = await _ctx.Users.AnyAsync(u => u.UserId == dto.ReceiverId);
            if (!receiverExists) return BadRequest("Receiver does not exist.");
            if (dto.ReceiverId == senderId)
                return BadRequest("You cannot transfer to yourself.");

            var rWallet = await _ctx.Wallets
                .FirstOrDefaultAsync(w => w.OwnerId == dto.ReceiverId && w.CurrencyId == dto.CurrencyId);

            if (rWallet == null)
            {
                rWallet = new Wallet
                {
                    Name = "Auto " + dto.CurrencyId,
                    CurrencyId = dto.CurrencyId,
                    OwnerId = dto.ReceiverId,
                    Balance = 0M
                };
                _ctx.Wallets.Add(rWallet);
                await _ctx.SaveChangesAsync();
            }

            // move money
            sWallet.Balance -= dto.Amount;
            rWallet.Balance += dto.Amount;

            _ctx.Transactions.Add(new Transaction
            {
                SenderId = senderId,
                ReceiverId = dto.ReceiverId,
                CurrencyId = dto.CurrencyId,
                Amount = dto.Amount,
                TransactionDate = DateTime.UtcNow
            });

            await _ctx.SaveChangesAsync();
            return Ok("Done");
        }

        [HttpGet("my-transactions/export")]
        public async Task<IActionResult> ExportMyTransactions()
        {

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var transactions = await _ctx.Transactions
                .Where(t => t.SenderId == userId || t.ReceiverId == userId)
                .Include(t => t.Currency)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();

            using var package = new ExcelPackage();
            var ws = package.Workbook.Worksheets.Add("Transactions");

            // Header
            ws.Cells[1, 1].Value = "Date";
            ws.Cells[1, 2].Value = "Amount";
            ws.Cells[1, 3].Value = "Currency";
            ws.Cells[1, 4].Value = "Type";
            ws.Cells[1, 5].Value = "Counterparty";

            // Data
            for (int i = 0; i < transactions.Count; i++)
            {
                var t = transactions[i];
                ws.Cells[i + 2, 1].Value = t.TransactionDate.ToString("yyyy-MM-dd HH:mm");
                ws.Cells[i + 2, 2].Value = t.Amount;
                ws.Cells[i + 2, 3].Value = t.Currency.Code;
                ws.Cells[i + 2, 4].Value = t.SenderId == userId ? "Sent" : "Received";
                ws.Cells[i + 2, 5].Value = t.SenderId == userId ? t.ReceiverId.ToString() : t.SenderId.ToString();
            }

            ws.Cells[ws.Dimension.Address].AutoFitColumns();

            var stream = new MemoryStream(package.GetAsByteArray());
            stream.Position = 0;
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "transactions.xlsx"
            );
        }


        /* ----------  1.  LIST  ---------- */
        [ApiController]
        [Route("api/admin/transactions")]
        [Authorize(Roles = "Admin")]
        public class AdminTransactionsController : ControllerBase
        {
            private readonly AppDbContext _ctx;

            public AdminTransactionsController(AppDbContext ctx)
            {
                _ctx = ctx;
            }

            [HttpGet]
            public async Task<IActionResult> ListTransactions(int page = 1, int pageSize = 10)
            {
                var data = await _ctx.Transactions
                    .Include(t => t.Currency)
                    .OrderByDescending(t => t.TransactionDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(t => new
                    {
                        t.TransactionId,
                        t.SenderId,
                        t.ReceiverId,
                        Currency = t.Currency.Code,
                        t.Amount,
                        t.TransactionDate,
                        t.IsReverted
                    })
                    .ToListAsync();

                return Ok(data);
            }
        }


        /* ----------  2.  REVERT  ---------- */
        [HttpPost("{id:int}/revert")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Revert(int id)
        {
            var tx = await _ctx.Transactions.FindAsync(id);
            if (tx == null) return NotFound();
            if (tx.IsReverted) return BadRequest("Already reverted.");

            // wallets
            var senderWallet = await _ctx.Wallets
                .FirstOrDefaultAsync(w => w.OwnerId == tx.SenderId && w.CurrencyId == tx.CurrencyId);
            var receiverWallet = await _ctx.Wallets
                .FirstOrDefaultAsync(w => w.OwnerId == tx.ReceiverId && w.CurrencyId == tx.CurrencyId);

            if (receiverWallet == null || senderWallet == null)
                return BadRequest("Wallet missing; manual intervention required.");

            if (receiverWallet.Balance < tx.Amount)
                return BadRequest("Receiver balance insufficient to revert.");

            // reverse transfer
            receiverWallet.Balance -= tx.Amount;
            senderWallet.Balance += tx.Amount;

            tx.IsReverted = true;
            tx.RevertedBy = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            tx.RevertedAt = DateTime.UtcNow;

            // optional: journal entry
            _ctx.LogEntries.Add(new LogEntry
            {
                TableName = "Transactions",
                OperationType = "REVERT",
                OperationDate = DateTime.UtcNow
            });

            await _ctx.SaveChangesAsync();
            return Ok("Transaction reverted.");
        }

        /* ----------  3.  GET MY TRANSACTIONS  ---------- */
        [Authorize]
        [HttpGet("my-transactions")]
        public async Task<IActionResult> GetMyTransactions()
        {
            // Get the logged-in user's ID
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // Fetch transactions where the user is either the sender or the receiver
            var transactions = await _ctx.Transactions
                .Include(t => t.Currency)
                .Where(t => t.SenderId == userId || t.ReceiverId == userId)
                .OrderByDescending(t => t.TransactionDate)
                .Select(t => new
                {
                    t.TransactionId,
                    t.SenderId,
                    t.ReceiverId,
                    Currency = t.Currency.Code,
                    t.Amount,
                    t.TransactionDate,
                    t.IsReverted
                })
                .ToListAsync();

            return Ok(transactions);
        }

    }

    public class SendMoneyDto
        {
            public int ReceiverId { get; set; }
            public int CurrencyId { get; set; }
            public decimal Amount { get; set; }
        }
    
}