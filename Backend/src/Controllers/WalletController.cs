using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using ViWallet.Data;
using ViWallet.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace ViWallet.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WalletsController : ControllerBase
    {
        private readonly AppDbContext _ctx;
        public WalletsController(AppDbContext ctx) => _ctx = ctx;

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateWalletNameDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var wallet = await _ctx.Wallets.FirstOrDefaultAsync(w => w.WalletId == id && w.OwnerId == userId);
            if (wallet == null) return NotFound();

            var new_name = dto.Name.Trim();
            if (string.IsNullOrWhiteSpace(new_name)) return BadRequest("Името не може да бъде празно.");
            if (new_name.Length > 50) return BadRequest("Името е твърде дълго.");
            if (new_name == wallet.Name) return BadRequest("Името не е променено.");
            if (await _ctx.Wallets.AnyAsync(w => w.OwnerId == userId && w.Name == new_name && w.WalletId != id))
                return BadRequest("Вече имате портфейл с това име! Моля изберете друго име.");

            var oldName = wallet.Name;
            wallet.Name = new_name;

            await _ctx.SaveChangesAsync();
            return Ok(new { wallet.WalletId, Name = wallet.Name });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateWalletDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var currency = await _ctx.Currencies.FindAsync(dto.CurrencyId);
            if (currency == null) return BadRequest("Невалидна валута.");

            var exists = await _ctx.Wallets
                          .AnyAsync(w => w.OwnerId == userId && w.CurrencyId == dto.CurrencyId);
            if (exists) return BadRequest("Вече имате портфейл в избраната валута.");
            if (string.IsNullOrWhiteSpace(dto.Name) || dto.Name.Length > 50)
                return BadRequest("Името не може да бъде празно или по-дълго от 50 букви/цифри.");
            if (await _ctx.Wallets.AnyAsync(w => w.OwnerId == userId && w.Name == dto.Name))
                return BadRequest("Портфейл с това име вече съществува.");
            if (dto.Name.Trim().Length == 0)
                return BadRequest("Името не може да бъде празно.");
            if (dto.CurrencyId == 0)
                return BadRequest("Моля, изберете валута.");

            var w = new Wallet
            {
                Name = dto.Name,
                CurrencyId = dto.CurrencyId,
                OwnerId = userId
            };
            _ctx.Wallets.Add(w);
            await _ctx.SaveChangesAsync();
            return Ok(w.WalletId);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var w = await _ctx.Wallets.FirstOrDefaultAsync(x => x.WalletId == id && x.OwnerId == userId);
            if (w == null) return NotFound();
            if (w.Balance != 0) return BadRequest("Портфейлът има наличност. Моля изтеглете наличността си или се обърнете към технитечки отдел.");
            if (await _ctx.Cards.AnyAsync(c => c.WalletId == w.WalletId))
                return BadRequest("Портфейлът има издадени карти. Моля, направете заявка за тяхното изтриване преди закриване на портфейл.");

                _ctx.Wallets.Remove(w);
            await _ctx.SaveChangesAsync();
            return NoContent();
        }
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var wallets = await _ctx.Wallets
                .Where(w => w.OwnerId == userId)
                .Select(w => new WalletDto
                {
                    WalletId = w.WalletId,
                    Name = w.Name,
                    Balance = w.Balance,
                    CurrencyCode = w.Currency.Code
                })
                .ToListAsync();
            return Ok(new WalletsDto { Wallets = wallets });
        }
        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var wallet = await _ctx.Wallets
                .Where(w => w.OwnerId == userId && w.WalletId == id)
                .Select(w => new WalletDto
                {
                    WalletId = w.WalletId,
                    Name = w.Name,
                    Balance = w.Balance,
                    CurrencyCode = w.Currency.Code
                })
                .FirstOrDefaultAsync();
            if (wallet == null) return NotFound("Портфейлът не е намерен.");
            if (wallet.Balance < 0)
                return BadRequest("Балансът по портфейл не може да бъде с отрицателна стойност.");
            if (string.IsNullOrWhiteSpace(wallet.CurrencyCode))
                return BadRequest("Валутата на портфейла не е зададена.");

            return Ok(wallet);
        }
    }
    public class CreateWalletDto
    {
        public string Name { get; set; } = null!;
        public int CurrencyId { get; set; }
    }
    public class WalletDto
    {
        public int WalletId { get; set; }
        public string Name { get; set; } = null!;
        public decimal Balance { get; set; }
        public string CurrencyCode { get; set; } = null!;
    }
    public class WalletsDto
    {
        public List<WalletDto> Wallets { get; set; } = new();
    }
    public class UpdateWalletNameDto
    {
        public string Name { get; set; } = null!;
    }
}
