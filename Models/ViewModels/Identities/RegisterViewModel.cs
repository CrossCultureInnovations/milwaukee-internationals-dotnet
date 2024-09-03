using System.ComponentModel.DataAnnotations;
using Models.Validations;

namespace Models.ViewModels.Identities;

/// <summary>
///     Register view model
/// </summary>
public class RegisterViewModel
{
    [Required]
    [Phone]
    [DataType(DataType.PhoneNumber)]
    [PhoneNumberValidation]
    public string PhoneNumber { get; set; }

    [Required]
    [MinLength(4)]
    public string Fullname { get; set; }

    [Required]
    [MinLength(6)]
    public string Username { get; set; }
        
    [Required]
    [PasswordValidation]
    public string Password { get; set; }
        
    [Required]
    [PasswordValidation]
    public string ConfirmPassword { get; set; }
        
    [Required]
    [EmailAddress]
    public string Email { get; set; }
}