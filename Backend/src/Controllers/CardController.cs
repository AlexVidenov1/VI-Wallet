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
    }

    public record CreateCardDto(int WalletId, string CardNumber, DateTime ExpirationDate);
}
