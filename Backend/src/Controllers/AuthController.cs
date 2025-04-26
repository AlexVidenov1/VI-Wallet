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
            if (await _dbContext.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email already registered.");

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
                Name = "EUR Wallet",
                CurrencyId = eurId,
                OwnerId = newUser.UserId,
                Balance = 0M
            };

            _dbContext.Wallets.Add(wallet);
            await _dbContext.SaveChangesAsync();

            return Ok("User registered with default EUR wallet");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(
                u => u.Email == dto.Email && u.PasswordHash == dto.Password
            );

            if (user == null)
                return Unauthorized("Invalid credentials");

            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Email),
            new Claim("FullName", user.FullName),
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString())
        };

            // Read JWT settings from configuration.
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = jwtSettings["Key"];
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // Create the token.
            var tokenDescriptor = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials
            );
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenString = tokenHandler.WriteToken(tokenDescriptor);

            // Return the token as JSON.
            return Ok(new { token = tokenString });
        }
    }

    // DTO classes for exchanging data.
    public class RegisterDto
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class LoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}