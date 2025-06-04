using System.Threading.Tasks;
using DAL.Interfaces;
using Logic.Interfaces;
using Models.Constants;
using Models.Entities;
using Flurl;

namespace Logic;

public class PasswordResetLogic(IEmailServiceApi emailServiceApi) : IPasswordResetLogic
{
    public async Task SendPasswordResetEmail(User user, string passwordResetToken)
    {
        var url = $"{ApiConstants.SiteUrl}/PasswordReset".AppendPathSegment(user.Id)
            .SetQueryParam("token", passwordResetToken).ToUri().AbsoluteUri;
            
        await emailServiceApi.SendEmailAsync([user.Email],
            "Password Reset Request Email - MilwaukeeInternationals.com", $@"
                    <p> Name: {user.Fullname}</p>
                    <p> Username: {user.UserName}</p>
                    <p> <a href=""{url}""> Password Reset Link </a></p>
                    <br />
                    <p> {url} </p>
                ");
    }
}