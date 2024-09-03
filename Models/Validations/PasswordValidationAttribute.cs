using System.ComponentModel.DataAnnotations;

namespace Models.Validations;

public class PasswordValidationAttribute : RegularExpressionAttribute
{
    public PasswordValidationAttribute(): base("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$")
    {
        ErrorMessage = "Password should contain lower and upper case alphanumeric characters + special character";
    }
}