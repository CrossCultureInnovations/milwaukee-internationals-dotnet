using System.ComponentModel.DataAnnotations;
using Models.Validations;

namespace Models.ViewModels.Identities;

/// <summary>
///     Login view model
/// </summary>
public class LoginViewModel
{
    [Required]
    [MinLength(6)]
    public string Username { get; set; }
        
    [Required]
    [PasswordValidation]
    public string Password { get; set; }
}