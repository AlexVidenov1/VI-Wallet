using Microsoft.EntityFrameworkCore;

namespace WebAPI.Data
{
	public class ApplicationDbContext : DbContext
	{
		public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
			: base(options)
		{ }

		// Add DbSets for your entities
	}
}
