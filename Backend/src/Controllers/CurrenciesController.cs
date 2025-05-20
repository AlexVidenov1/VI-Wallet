// Controllers/CurrenciesController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ViWallet.Data;

[Authorize]
[ApiController]
[Route("api/[controller]")]          // -->  /api/Currencies
public class CurrenciesController : ControllerBase
{
    private readonly AppDbContext _ctx;
    public CurrenciesController(AppDbContext ctx) => _ctx = ctx;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _ctx.Currencies
                             .Select(c => new CurrencyDto
                             {
                                 Id = c.CurrencyId,
                                 Code = c.Code,
                                 Name = c.Name
                             })
                             .ToListAsync();
        return Ok(list);
    }

    public record CurrencyDto
    {
        public int Id { get; init; }
        public string Code { get; init; } = null!;
        public string Name { get; init; } = null!;
    }
}