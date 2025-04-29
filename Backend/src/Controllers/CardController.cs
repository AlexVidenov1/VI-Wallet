using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using ViWallet.Data;
using ViWallet.Models;
using ViWallet.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace ViWallet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CardController : ControllerBase
    {
        private readonly AppDbContext _ctx;
        private readonly UserService _userService;

        public CardController(AppDbContext ctx, UserService userService)
        {
            _ctx = ctx;
            _userService = userService;
        }

        [Authorize]
        [HttpPost("create")]
        public async Task<IActionResult> CreateCard([FromBody] CreateCardDto dto)
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var wallet = await _ctx.Wallets
                         .FirstOrDefaultAsync(w => w.WalletId == dto.WalletId && w.OwnerId == userId);
            if (wallet == null) return BadRequest("Wallet not found");

            int cardCount = await _ctx.Cards.CountAsync(c => c.WalletId == wallet.WalletId);
            string role = await _userService.GetCurrentRoleAsync(userId);
            int maxCards = role == "ProViUser" ? 3 : 1;

            if (cardCount >= maxCards)
                return BadRequest($"Limit reached: {maxCards} card(s) allowed for this wallet.");

            bool exists = await _ctx.Cards.AnyAsync(c => c.CardNumber == dto.CardNumber);
            if (exists) return BadRequest("Card number already exists.");

            var card = new Card
            {
                CardNumber = dto.CardNumber,
                ExpirationDate = dto.ExpirationDate,
                WalletId = wallet.WalletId
            };

            _ctx.Cards.Add(card);
            await _ctx.SaveChangesAsync();
            return Ok(card.CardId);
        }

       
        /* ----------  BLOCK / UNBLOCK  ---------- */
        // Admin can block/unblock any card; user only own cards
        [HttpPost("{id:int}/block")]
        public async Task<IActionResult> Block(int id, bool block = true)
        {
            var card = await _ctx.Cards
                .Include(c => c.Wallet)
                .FirstOrDefaultAsync(c => c.CardId == id);
            if (card == null) return NotFound();

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var userRole = await _ctx.Users
                                .Include(u => u.Role)
                                .Where(u => u.UserId == userId)
                                .Select(u => u.Role.Name)
                                .FirstAsync();

            if (userRole != "Admin" && card.Wallet.OwnerId != userId)
                return Forbid();

            card.IsBlocked = block;
            card.LastModified = DateTime.UtcNow;

            await _ctx.SaveChangesAsync();
            return Ok(block ? "Card blocked" : "Card unblocked");
        }

        [HttpPost("{id:int}/unblock")]
        public async Task<IActionResult> Unblock(int id)
        {
            var card = await _ctx.Cards
                .Include(c => c.Wallet)
                .FirstOrDefaultAsync(c => c.CardId == id);
            if (card == null) return NotFound();

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var userRole = await _ctx.Users
                                .Include(u => u.Role)
                                .Where(u => u.UserId == userId)
                                .Select(u => u.Role.Name)
                                .FirstAsync();

            // Only Admins or the card owner can unblock the card
            if (userRole != "Admin" && card.Wallet.OwnerId != userId)
                return Forbid();

            card.IsBlocked = false; // Unblock the card
            card.LastModified = DateTime.UtcNow;

            await _ctx.SaveChangesAsync();
            return Ok("Card unblocked");
        }

        [HttpPost("{id:int}/withdraw")]
        public async Task<IActionResult> Withdraw(int id, [FromBody] WithdrawDto dto)
        {
            if (dto.Amount <= 0) return BadRequest("Amount must be positive");

            var card = await _ctx.Cards
                            .Include(c => c.Wallet)
                            .ThenInclude(w => w.Currency) // Ensure Currency is included
                            .FirstOrDefaultAsync(c => c.CardId == id);
            if (card == null) return NotFound();

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (card.Wallet.OwnerId != userId) return Forbid();

            if (card.IsBlocked) return BadRequest("Card is blocked");

            if (card.Wallet.Balance < dto.Amount)
                return BadRequest("Insufficient wallet balance");

            card.Wallet.Balance -= dto.Amount;

            _ctx.LogEntries.Add(new LogEntry
            {
                TableName = "Cards",
                OperationType = "WITHDRAW",
                OperationDate = DateTime.UtcNow
            });

            await _ctx.SaveChangesAsync();

            // Handle null Currency or Currency.Code
            var currencyCode = card.Wallet.Currency?.Code ?? "Unknown Currency";
            return Ok($"Withdrew {dto.Amount} {currencyCode}");
        }

        [HttpGet("GetCards")]
        public async Task<IActionResult> GetCards()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var cards = await _ctx.Cards
                .Include(c => c.Wallet)
                .Where(c => c.Wallet.OwnerId == userId)
                .ToListAsync();
            return Ok(cards);
        }
    }
    public record CreateCardDto(int WalletId, string CardNumber, DateTime ExpirationDate);
    public record WithdrawDto(decimal Amount);
}

