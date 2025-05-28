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
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<Card> Cards => Set<Card>();
        public DbSet<Currency> Currencies => Set<Currency>();
        public DbSet<Transaction> Transactions => Set<Transaction>();
        public DbSet<LogEntry> LogEntries => Set<LogEntry>();
        public DbSet<Wallet> Wallets => Set<Wallet>();
        public DbSet<Subscription> Subscriptions => Set<Subscription>();

        /* ----------  Model config  ---------- */
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<LogEntry>().ToTable("Log_20118073");

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

            modelBuilder.Entity<Currency>()
                .Property(c => c.ExchangeRate)
                .HasPrecision(18, 6);

            modelBuilder.Entity<Transaction>()
                .Property(t => t.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Role>()
                .HasIndex(r => r.Name)
                .IsUnique();

            modelBuilder.Entity<Wallet>()
                .HasOne(w => w.Owner)
                .WithMany(u => u.Wallets)
                .HasForeignKey(w => w.OwnerId);

            modelBuilder.Entity<Card>()
                .HasOne(c => c.Wallet)
                .WithMany(w => w.Cards)
                .HasForeignKey(c => c.WalletId);

            var seedTime = new DateTime(2024, 04, 26, 0, 0, 0, DateTimeKind.Utc);

            modelBuilder.Entity<Role>().HasData(
                new Role { RoleId = 1, Name = "Admin", LastModified = seedTime },
                new Role { RoleId = 2, Name = "ViUser", LastModified = seedTime },
                new Role { RoleId = 3, Name = "ProViUser", LastModified = seedTime }
            );

            modelBuilder.Entity<Currency>().HasData(
                new Currency { CurrencyId = 1, Code = "BGN", Name = "Lev", ExchangeRate = 1.9583M, LastModified = seedTime },
                new Currency { CurrencyId = 2, Code = "EUR", Name = "Euro", ExchangeRate = 1, LastModified = seedTime }
            );
            modelBuilder.Entity<LogEntry>().ToTable("Log_20118073");

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
        }

        /* ----------  Audit / journal  ---------- */
        public override async Task<int> SaveChangesAsync(
                     CancellationToken ct = default)
        {
            var pendingLogs = ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Added ||
                            e.State == EntityState.Modified)
                .Select(e => new LogEntry
                {
                    TableName = e.Metadata.GetTableName()!,
                    OperationType = e.State == EntityState.Added ? "INSERT" : "UPDATE",
                    OperationDate = DateTime.UtcNow
                })
                .ToList();

            if (pendingLogs.Count > 0)
                LogEntries.AddRange(pendingLogs);

            return await base.SaveChangesAsync(ct);
        }
    }
}
