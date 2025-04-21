using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

        public AuthController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            // Basic validation (in real apps use FluentValidation or similar)
            if (await _dbContext.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email already registered.");

            // For demo purposes, we use a very simple hash (DO NOT use in production)
            var newUser = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = dto.Password // Replace with proper hash
            };

            _dbContext.Users.Add(newUser);
            await _dbContext.SaveChangesAsync();

            return Ok("User registered");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            // For demo, compare plain text (in production use hashed passwords & salted comparisons)
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == dto.Email && u.PasswordHash == dto.Password);
            if (user == null)
                return Unauthorized("Invalid credentials");

            // Create and return a token (e.g., JWT) in a real application. Here we just return a message.
            return Ok("User logged in");
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
