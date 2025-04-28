using System;
using System.ComponentModel.DataAnnotations;

namespace ViWallet.Models
{
    public class LogEntry
    {
        [Key]
        public int LogEntryId { get; set; }

        [Required]
        public string TableName { get; set; } = string.Empty;

        [Required]
        public string OperationType { get; set; } = string.Empty;

        public DateTime OperationDate { get; set; } = DateTime.UtcNow;
    }
}