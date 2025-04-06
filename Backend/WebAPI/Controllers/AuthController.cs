//using Core.Domain.Entities;
//using Core.DTOs;
//using Microsoft.AspNetCore.Identity;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.IdentityModel.Tokens;
//using System.IdentityModel.Tokens.Jwt;
//using System.Security.Claims;
//using System.Text;


//[Route("api/auth")]
//[ApiController]
//public class AuthController : ControllerBase
//{
//    private readonly UserManager<ApplicationUser> _userManager;
//    private readonly SignInManager<ApplicationUser> _signInManager;
//    private readonly IConfiguration _configuration;
//}

//public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, IConfiguration configuration)
//{
//    _userManager = userManager;
//    _signInManager = signInManager;
//    _configuration = configuration;
//}

//[HttpPost("register")]
//public async Task<IActionResult> Register([FromBody] RegisterDto model)
//{
//    var userExists = await _userManager.FindByNameAsync(model.Email);
//    if userExists != null
//        return StatusCode(StatusCodes.Status500InternalServerError, new Response { Status = "Error", Message = "User already exists!" });
    
//    var user = new ApplicationUser()
//    {
//        UserName = model.Email
//        Email = model.Email,
//        FullName = model.FullName
//        WalletAddress = model.WalletAddress || null,
//        SecurityStamp = Guid.NewGuid().ToString(),
//    };

//    var result = await _userManager.CreateAsync(user, model.Password);
//    if (!result.Succeeded)
//        return StatusCode(StatusCodes.Status500InternalServerError, new Response { Status = "Error", Message = "User creation failed! Please check user details and try again." });
//}

//[HttpPost("login")]
//public async Task <IActionResult> Login([FromBody] LoginDto model)
//{
//    var user = await _userManager.FindByEmailAsync(model.Email);
//    if (user == null || !(await _userManager.CheckPasswordAsync(user, model.password)))
//        return Unauthorized(new Response { Status = "Error", Message = "Invalid credentials" });

//    var authClaims = new List<Claim>
//    {
//        new Claim(ClaimTypes.Name, user.Email),
//        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
//    };

//    var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Key"]));
//    var token = new JwtSecurityToken(
//        issuer: _configuration["JWT:Issuer"],
//        audience: _configuration["JWT:Audience"],
//        expires: DateTime.Now.AddHours(3),
//        claims: authClaims,
//        signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
//    );

//    return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
//}

using Microsoft.AspNetCore.Mvc;

namespace WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        // Constructor and methods go here

        public AuthController()
        {
            // Constructor implementation
        }

        [HttpPost("login")]
        public IActionResult Login()
        {
            // Logic for login goes here
            return Ok();
        }

        [HttpPost("register")]
        public IActionResult Register()
        {
            // Logic for register goes here
            return Ok();
        }
    }
}s
