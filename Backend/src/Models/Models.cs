using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ViWallet.Models
{
    public class Role
    {
        [Key] public int RoleId { get; set; }

        [Required, MaxLength(30)]
        public string Name { get; set; } = null!;

        [Column("LastModified_20118073")]
        public DateTime LastModified { get; set; }

        public ICollection<User> Users { get; set; } = new HashSet<User>();
    }

    public class User
    {
        [Key] public int UserId { get; set; }

        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required, EmailAddress, MaxLength(200)]
        public string Email { get; set; } = null!;

        [Required]
        public string PasswordHash { get; set; } = null!;

        public int RoleId { get; set; }
        public Role Role { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("LastModified_20118073")]
        public DateTime LastModified { get; set; } = DateTime.UtcNow;

        public ICollection<Card> Cards { get; set; } = new HashSet<Card>();
        public ICollection<Wallet> Wallets { get; set; } = new HashSet<Wallet>();

        [InverseProperty(nameof(Transaction.Sender))]
        public ICollection<Transaction> SentTransactions { get; set; } = new HashSet<Transaction>();

        [InverseProperty(nameof(Transaction.Receiver))]
        public ICollection<Transaction> ReceivedTransactions { get; set; } = new HashSet<Transaction>();
    }

    public class Card
    {
        [Key] public int CardId { get; set; }

        [Required, MaxLength(20)]
        public string CardNumber { get; set; } = null!;

        [Required] public DateTime ExpirationDate { get; set; }

        public int WalletId { get; set; }
        public Wallet Wallet { get; set; } = null!;

        [Column("LastModified_20118073")]
        public DateTime LastModified { get; set; } = DateTime.UtcNow;
    }

    public class Currency
    {
        [Key] public int CurrencyId { get; set; }

        [Required, MaxLength(3)]
        public string Code { get; set; } = null!;

        [Required, MaxLength(50)]
        public string Name { get; set; } = null!;

        [Column(TypeName = "decimal(18,6)")]
        public decimal ExchangeRate { get; set; }

        [Column("LastModified_20118073")]
        public DateTime LastModified { get; set; } = DateTime.UtcNow;

        public ICollection<Transaction> Transactions { get; set; } = new HashSet<Transaction>();
    }

    public class Transaction
    {
        [Key] public int TransactionId { get; set; }

        public int SenderId { get; set; }
        [ForeignKey(nameof(SenderId)), InverseProperty(nameof(User.SentTransactions))]
        public User Sender { get; set; } = null!;

        public int ReceiverId { get; set; }
        [ForeignKey(nameof(ReceiverId)), InverseProperty(nameof(User.ReceivedTransactions))]
        public User Receiver { get; set; } = null!;

        public int CurrencyId { get; set; }
        public Currency Currency { get; set; } = null!;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

        [Column("LastModified_20118073")]
        public DateTime LastModified { get; set; } = DateTime.UtcNow;
    }

    public class Wallet
    {
        [Key] public int WalletId { get; set; }

        [Required, MaxLength(50)]
        public string Name { get; set; } = "Default";

        [Required] public int CurrencyId { get; set; }
        public Currency Currency { get; set; } = null!;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Balance { get; set; } = 0M;

        // owner
        public int OwnerId { get; set; }
        public User Owner { get; set; } = null!;

        [Column("LastModified_20118073")]
        public DateTime LastModified { get; set; } = DateTime.UtcNow;

        public ICollection<Card> Cards { get; set; } = new HashSet<Card>();
    }
}
