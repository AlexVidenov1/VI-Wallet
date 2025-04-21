using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using ViWallet.Data;
using ViWallet.Models;

namespace ViWallet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public TransactionsController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMoney([FromBody] SendMoneyDto dto)
        {
            // In a real scenario, you would have authentication so that you know who is the sender.
            // Here we assume sender ID is provided.
            var sender = await _dbContext.Users.FindAsync(dto.SenderId);
            var receiver = await _dbContext.Users.FindAsync(dto.ReceiverId);
            var currency = await _dbContext.Currencies.FindAsync(dto.CurrencyId);

            if (sender == null || receiver == null || currency == null)
                return BadRequest("Invalid sender, receiver or currency.");

            // Business logic (e.g., check balances) goes here.
            // For now, simply create a transaction record.
            var transaction = new Transaction
            {
                SenderId = sender.UserId,
                ReceiverId = receiver.UserId,
                CurrencyId = currency.CurrencyId,
                Amount = dto.Amount,
                TransactionDate = System.DateTime.UtcNow
            };

            _dbContext.Transactions.Add(transaction);
            await _dbContext.SaveChangesAsync();

            return Ok("Transaction successful");
        }
    }

    public class SendMoneyDto
    {
        public int SenderId { get; set; }
        public int ReceiverId { get; set; }
        public int CurrencyId { get; set; }
        public decimal Amount { get; set; }
    }
}