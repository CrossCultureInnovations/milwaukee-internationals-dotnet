using EfCoreRepository;
using Models.Entities;

namespace DAL.Profiles;

public class UserProfile :  EntityProfile<User>
{
    public UserProfile()
    {
        Map(x => x.Fullname);
        Map(x => x.UserName);
        Map(x => x.UserRoleEnum);
        Map(x => x.PhoneNumber);
        Map(x => x.Email);
        Map(x => x.LastLoggedInDate);
        Map(x => x.Enable);
    }
}