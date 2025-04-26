using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ViWallet.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }
        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required, EmailAddress, MaxLength(200)]
        public string Email { get; set; }

        [Required]
        public string PasswordHash { get; set; } // Store a hashed password

        // Audit fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        // Append your student number to the column name
        [Column("LastModified_20118073")]
        public DateTime LastModified { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<Card> Cards { get; set; }
        public ICollection<Transaction> SentTransactions { get; set; }
        public ICollection<Transaction> ReceivedTransactions { get; set; }
    }

    public class Card
    {
        [Key]
        public int CardId { get; set; }

        [Required, MaxLength(20)]
        public string CardNumber { get; set; }

        [Required]
        public DateTime ExpirationDate { get; set; }

        // Foreign key: each card belongs to one user
        public int UserId { get; set; }
        public User Owner { get; set; }

        // Audit field
        [Column("LastModified_20118073")]
        public DateTime LastModified { get; set; } = DateTime.UtcNow;
    }

    public class Currency
    {
        [Key]
        public int CurrencyId { get; set; }

        [Required, MaxLength(3)]
        public string Code { get; set; }    // e.g., USD, EUR

        [Required, MaxLength(50)]
        public string Name { get; set; }    // e.g., Dollar, Euro

        // Optionally store the exchange rate against a base currency
        public decimal ExchangeRate { get; set; }

        // Audit field
        [Column("LastModified_20118073")]
        public DateTime LastModified { get; set; } = DateTime.UtcNow;
    }

    public class Transaction
    {
        [Key]
        public int TransactionId { get; set; }

        // Foreign keys for sender and receiver
        [Required]
        public int SenderId { get; set; }
        public User Sender { get; set; }

        [Required]
        public int ReceiverId { get; set; }
        public User Receiver { get; set; }

        // Currency in which the transaction is made
        [Required]
        public int CurrencyId { get; set; }
        public Currency Currency { get; set; }

        [Required]
        public decimal Amount { get; set; }

        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

        // Audit field
        [Column("LastModified_20118073")]
        public DateTime LastModified { get; set; } = DateTime.UtcNow;
    }
}