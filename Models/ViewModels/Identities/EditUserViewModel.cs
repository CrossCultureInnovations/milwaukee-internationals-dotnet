using System.ComponentModel.DataAnnotations;
using Models.Validations;

namespace Models.ViewModels.Identities;

public class EditUserViewModel
{
    public int Id { get; set; }

    [Required]
    [MinLength(4)]
    public string Fullname { get; set; }
    
    [Required]
    [EmailAddress]
    public string Email { get; set; }
    
    [Required]
    [Phone]
    [DataType(DataType.PhoneNumber)]
    [PhoneNumberValidation]
    public string PhoneNumber { get; set; }
}