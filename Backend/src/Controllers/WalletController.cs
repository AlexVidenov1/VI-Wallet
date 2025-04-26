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

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateWalletDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var currency = await _ctx.Currencies.FindAsync(dto.CurrencyId);
            if (currency == null) return BadRequest("Invalid currency");

            var exists = await _ctx.Wallets
                          .AnyAsync(w => w.OwnerId == userId && w.CurrencyId == dto.CurrencyId);
            if (exists) return BadRequest("Wallet in that currency already exists");

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
            if (w.Balance != 0) return BadRequest("Wallet not empty");

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
            if (wallet == null) return NotFound();
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
}
