using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ViWallet.Models;

namespace ViWallet.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        /* ----------  DbSets  ---------- */
        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles => Set<Role>();          //  ← NEW
        public DbSet<Card> Cards => Set<Card>();
        public DbSet<Currency> Currencies => Set<Currency>();
        public DbSet<Transaction> Transactions => Set<Transaction>();
        public DbSet<LogEntry> LogEntries => Set<LogEntry>();

        /* ----------  Model config  ---------- */
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            /* Transactions: two self-FKs */
            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Sender)
                .WithMany(u => u.SentTransactions)
                .HasForeignKey(t => t.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Receiver)
                .WithMany(u => u.ReceivedTransactions)
                .HasForeignKey(t => t.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            /* Decimal precisions */
            modelBuilder.Entity<Currency>()
                .Property(c => c.ExchangeRate)
                .HasPrecision(18, 6);

            modelBuilder.Entity<Transaction>()
                .Property(t => t.Amount)
                .HasPrecision(18, 2);

            /* ----------  NEW: Role config  ---------- */
            modelBuilder.Entity<Role>()
                .HasIndex(r => r.Name)
                .IsUnique();

            var seedTime = new DateTime(2024, 04, 26, 0, 0, 0, DateTimeKind.Utc);

            modelBuilder.Entity<Role>().HasData(
                new Role { RoleId = 1, Name = "Admin", LastModified = seedTime },
                new Role { RoleId = 2, Name = "ViUser", LastModified = seedTime },
                new Role { RoleId = 3, Name = "ProViUser", LastModified = seedTime }
            );

            /* (optional) unique e-mail for Users */
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
        }

        /* ----------  Audit / journal  ---------- */
        public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

            foreach (var entry in entries)
            {
                LogEntries.Add(new LogEntry
                {
                    TableName = entry.Metadata.GetTableName()!,
                    OperationType = entry.State == EntityState.Added ? "INSERT" : "UPDATE",
                    OperationDate = DateTime.UtcNow
                });
            }

            return await base.SaveChangesAsync(ct);
        }
    }
}