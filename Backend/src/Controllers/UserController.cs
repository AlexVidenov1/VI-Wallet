using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ViWallet.Services;

[Route("api/user")]
[ApiController]
[Authorize]
public class UserController : ControllerBase
{
    private readonly UserService _userService;

    public UserController(UserService userService)
    {
        _userService = userService;
    }

    [HttpGet("profile")]
    public IActionResult GetUserProfile()
    {
        var userName = User.Identity.Name;
        return Ok(new { message = $"Hello, {userName}! Welcome to VIWallet." });
    }

    [HttpGet("role")]
    public async Task<IActionResult> GetUserRole()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized("User ID not found in token.");
        }
        int userId = int.Parse(userIdClaim);

        string role = await _userService.GetCurrentRoleAsync(userId);
        return Ok(new { role });
    }
}
