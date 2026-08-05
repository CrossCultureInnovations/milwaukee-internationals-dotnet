using System.ComponentModel.DataAnnotations;

namespace Models.Entities;

public class GlobalConfigs
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Key { get; set; }

    [Required]
    public string Value { get; set; }
}