using Microsoft.AspNetCore.Identity;

namespace Core.Domain.Entities
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; }
        public string WalletAddress { get; set; } // For crypto transactions
    }
}
