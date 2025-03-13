using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Route("api/user")]
[ApiController]
[Authorize]
public class UserController : ControllerBase
{
    [HttpGet("profile")]
    public IActionResult GetUserProfile()
    {
        var userName = User.Identity.Name;
        return Ok(new { message = $"Hello, {userName}! Welcome to VIWallet." });
    }
}
