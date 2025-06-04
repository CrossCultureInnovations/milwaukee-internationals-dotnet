using System.Threading.Tasks;
using DAL.Interfaces;
using Logic.Interfaces;
using Models.Constants;
using Models.Entities;
using Flurl;

namespace Logic;

public class PasswordResetLogic : IPasswordResetLogic
{
    private readonly IEmailServiceApi _emailServiceApi;

    public PasswordResetLogic(IEmailServiceApi emailServiceApi)
    {
        _emailServiceApi = emailServiceApi;
    }

    public async Task SendPasswordResetEmail(User user, string passwordResetToken)
    {
        var url = $"{ApiConstants.SiteUrl}/PasswordReset".AppendPathSegment(user.Id)
            .SetQueryParam("token", passwordResetToken).ToUri().AbsoluteUri;
            
        await _emailServiceApi.SendEmailAsync([user.Email],
            "Password Reset Request Email - MilwaukeeInternationals.com", $@"
                    <p> Name: {user.Fullname}</p>
                    <p> Username: {user.UserName}</p>
                    <p> <a href=""{url}""> Password Reset Link </a></p>
                    <br />
                    <p> {url} </p>
                ");
    }
}