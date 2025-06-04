using System.Threading.Tasks;
using Logic.Interfaces;
using Models.Entities;
using Models.ViewModels;

namespace Logic;

public class ProfileLogic(IUserLogic userLogic) : IProfileLogic
{
    public ProfileViewModel ResolveProfile(User user)
    {
        // Empty profile
        if (user == null)
        {
            return new ProfileViewModel();
        }
            
        return new ProfileViewModel
        {
            Id = user.Id,
            Fullname = user.Fullname,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Username = user.UserName,
            Role = user.UserRoleEnum
        };
    }

    public async Task UpdateUser(ProfileViewModel profile)
    {
        await userLogic.Update(profile.Id, user =>
        {
            user.Fullname = profile.Fullname;
            user.Email = profile.Email;
            user.PhoneNumber = profile.PhoneNumber;
        });
    }
}