using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using ViWallet.Data;

namespace ViWallet.Services
{
    public class UserService
    {
        private readonly AppDbContext _ctx;

        public UserService(AppDbContext ctx)
        {
            _ctx = ctx;
        }

        public async Task<string> GetCurrentRoleAsync(int userId)
        {
            var user = await _ctx.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == userId);
            return user?.Role?.Name ?? "ViUser";
        }
    }
}
