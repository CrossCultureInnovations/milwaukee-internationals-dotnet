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