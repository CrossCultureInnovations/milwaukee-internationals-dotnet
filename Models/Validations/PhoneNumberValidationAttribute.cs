using System.ComponentModel.DataAnnotations;

namespace Models.Validations;

public class PhoneNumberValidationAttribute : RegularExpressionAttribute
{
    public PhoneNumberValidationAttribute() : base(@"^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$")
    {
        ErrorMessage = "Not a valid phone number";
    }
}