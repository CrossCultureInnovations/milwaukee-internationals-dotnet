using System.ComponentModel.DataAnnotations;
using Models.Validations;

namespace Models.ViewModels.Identities;

public class ChangePasswordViewModel
{
    public int Id { get; set; }
    
    public string Fullname { get; set; }
    
    [Required]
    [PasswordValidation]
    public string Password { get; set; }
        
    [Required]
    [PasswordValidation]
    public string ConfirmPassword { get; set; }
}