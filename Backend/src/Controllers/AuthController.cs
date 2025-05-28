using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using ViWallet.Data;
using ViWallet.Models;


namespace ViWallet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext dbContext, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (dto == null)
                return BadRequest("Невалидна дата на регистрация");

            if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Необходими са е-мейл и парола.");
            
            if (await _dbContext.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Е-мейла е вече регистриран");

            var viUserRoleId = await _dbContext.Roles
                               .Where(r => r.Name == "ViUser")
                               .Select(r => r.RoleId)
                               .FirstAsync();

            var eurId = await _dbContext.Currencies
            .Where(c => c.Code == "EUR")
            .Select(c => c.CurrencyId)
            .FirstAsync();

            var newUser = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = dto.Password,
                RoleId = viUserRoleId
            };

            _dbContext.Users.Add(newUser);
            await _dbContext.SaveChangesAsync();

            var wallet = new Wallet
            {
                Name = "EUR портфейл",
                CurrencyId = eurId,
                OwnerId = newUser.UserId,
                Balance = 0M
            };

            _dbContext.Wallets.Add(wallet);
            await _dbContext.SaveChangesAsync();

            return Ok("Потребителят е регистриран с портфейл в ЕВРО.");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _dbContext.Users
                .Include(u => u.Role) // Ensure Role is included
                .FirstOrDefaultAsync(u => u.Email == dto.Email && u.PasswordHash == dto.Password);

            if (user == null)
                return Unauthorized("Невалидни данни.");

            // Check subscription
            //var sub = await _dbContext.Subscriptions.FirstOrDefaultAsync(s => s.UserId == user.UserId);
            //if (sub == null)
            //{
            //    sub = new Subscription
            //    {
            //        UserId = user.UserId,
            //        PaidUntil = DateTime.UtcNow.AddMonths(1)
            //    };
            //    _dbContext.Subscriptions.Add(sub);
            //}
            //else
            //{
            //    sub.PaidUntil = sub.PaidUntil < DateTime.UtcNow
            //        ? DateTime.UtcNow.AddMonths(1)
            //        : sub.PaidUntil.AddMonths(1);
            //}

            // Update user role based on subscription
            //if (sub.PaidUntil > DateTime.UtcNow)
            //{
            //    var proViUserRoleId = await _dbContext.Roles
            //        .Where(r => r.Name == "ProViUser")
            //        .Select(r => r.RoleId)
            //        .FirstAsync();
            //    user.RoleId = proViUserRoleId;
            //}
            //else
            //{
            //    var viUserRoleId = await _dbContext.Roles
            //        .Where(r => r.Name == "ViUser")
            //        .Select(r => r.RoleId)
            //        .FirstAsync();
            //    user.RoleId = viUserRoleId;
            //}

            await _dbContext.SaveChangesAsync();
            await _dbContext.Entry(user).Reference(u => u.Role).LoadAsync();

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.Email),
                new Claim("FullName", user.FullName),
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Role, user.Role?.Name ?? "ViUser") // Default to "ViUser" if Role is null
            };

            var jwtSettings = _configuration.GetSection("Jwt");
            var key = jwtSettings["Key"];
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];

            if (string.IsNullOrEmpty(key))
                return StatusCode(500, "JWT Key is not configured.");

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var tokenDescriptor = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials
            );
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenString = tokenHandler.WriteToken(tokenDescriptor);

            return Ok(new { token = tokenString });
        }


    }

    // DTO classes for exchanging data.
    public class RegisterDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}