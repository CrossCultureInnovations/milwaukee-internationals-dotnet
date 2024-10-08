using System.ComponentModel.DataAnnotations;
using Models.Validations;

namespace Models.ViewModels.PasswordReset;

public class PasswordResetViewModel
{
    public int Id { get; set; }
        
    public string Token { get; set; }
      
    public string Username { get; set; }

    public string Email { get; set; }
        
    [Required]
    [PasswordValidation]
    public string Password { get; set; }

    [Required]
    [Display(Name = "Confirm Password")]
    [PasswordValidation]
    public string ConfirmPassword { get; set; }
}