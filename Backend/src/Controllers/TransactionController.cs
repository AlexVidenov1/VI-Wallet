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
            if (dto.ReceiverId == senderId)
                return BadRequest("You cannot transfer to yourself.");

            var sWallet = await _ctx.Wallets
                .FirstOrDefaultAsync(w => w.OwnerId == senderId && w.CurrencyId == dto.CurrencyId);
            if (sWallet == null) return BadRequest("Sender has no wallet in that currency");

            if (sWallet.Balance < dto.Amount) return BadRequest("Insufficient funds");

            var receiverExists = await _ctx.Users.AnyAsync(u => u.UserId == dto.ReceiverId);
            if (!receiverExists) return BadRequest("Receiver does not exist.");

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

        public class SendMoneyDto
        {
            public int ReceiverId { get; set; }
            public int CurrencyId { get; set; }
            public decimal Amount { get; set; }
        }
    }
}
