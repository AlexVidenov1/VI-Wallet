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
        : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Card> Cards { get; set; }
        public DbSet<Currency> Currencies { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<LogEntry> LogEntries { get; set; }  // log/journal table

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure the one-to-many relationship for transactions.
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
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            // Inspect ChangeTracker for entries that are Added or Modified.
            var entries = ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

            foreach (var entry in entries)
            {
                // We record the table name and the operation performed.
                var tableName = entry.Metadata.GetTableName();
                var operation = entry.State == EntityState.Added ? "INSERT" : "UPDATE";

                // You can further enhance this logic by extracting key values or auditing specific columns
                var logEntry = new LogEntry
                {
                    TableName = tableName,
                    OperationType = operation,
                    OperationDate = DateTime.UtcNow
                };

                // Add log entry – this adds it to ChangeTracker, so it’s also saved when SaveChangesAsync is invoked
                LogEntries.Add(logEntry);
            }

            // Call the base method to save changes including log entries
            return await base.SaveChangesAsync(cancellationToken);
        }
    }
}