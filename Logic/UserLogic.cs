using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using DAL.Interfaces;
using EfCoreRepository.Interfaces;
using Logic.Abstracts;
using Logic.Interfaces;
using Microsoft.AspNetCore.Identity;
using Models.Entities;
using Models.Enums;

namespace Logic;

public class UserLogic(IEfRepository repository, UserManager<User> userManager, IApiEventService apiEventService)
    : BasicCrudLogicAbstract<User>, IUserLogic
{
    private readonly IBasicCrud<User> _dal = repository.For<User>();

    public override async Task<User> Get(int id)
    {
        var user = await base.Get(id);
        
        var roles = await userManager.GetRolesAsync(user);

        user.UserRoleEnum = roles.Contains(UserRoleEnum.Admin.ToString())
            ? UserRoleEnum.Admin
            : UserRoleEnum.Basic;

        return user;
    }

    /// <summary>
    /// Update only the profile fields an account edit owns. Everything else on the
    /// Identity user — password hash, security stamp, lockout state — belongs to
    /// UserManager and must survive an edit untouched.
    /// </summary>
    public override Task<User> Update(int id, User user)
    {
        return base.Update(id, x =>
        {
            x.Fullname = user.Fullname;
            x.UserName = user.UserName;
            x.Email = user.Email;
            x.PhoneNumber = user.PhoneNumber;
            x.UserRoleEnum = user.UserRoleEnum;
            x.LastLoggedInDate = user.LastLoggedInDate;
            x.Enable = user.Enable;
        });
    }

    public async Task Disable(int id)
    {
        await _dal.Update(id, x => x.Enable = false);
    }

    public async Task Enable(int id)
    {
        await _dal.Update(id, x => x.Enable = true);
    }

    protected override IBasicCrud<User> Repository()
    {
        return _dal;
    }
        
    protected override IApiEventService ApiEventService()
    {
        return apiEventService;
    }

    public override async Task<IEnumerable<User>> GetAll(string sortBy = null, bool? descending = null, Func<object, string, object> sortByModifier = null, params Expression<Func<User, bool>>[] filters)
    {
        var users = (await base.GetAll(sortBy, descending, null, filters)).ToList();

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);

            user.UserRoleEnum = roles.Contains(UserRoleEnum.Admin.ToString())
                ? UserRoleEnum.Admin
                : UserRoleEnum.Basic;
        }

        return users;
    }
}