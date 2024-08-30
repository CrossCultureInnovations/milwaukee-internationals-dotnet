using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using DAL.Interfaces;
using EfCoreRepository.Interfaces;
using Logic.Abstracts;
using Logic.Interfaces;
using Models.Entities;
using Models.Enums;
using Models.ViewModels;
using static Logic.Utilities.RegistrationUtility;

namespace Logic;

public class DriverLogic : BasicCrudLogicAbstract<Driver>, IDriverLogic
{
    private readonly IBasicCrud<Driver> _dal;
    private readonly IConfigLogic _configLogic;
    private readonly IApiEventService _apiEventService;

    public DriverLogic(IEfRepository repository, IConfigLogic configLogic, IApiEventService apiEventService)
    {
        _dal = repository.For<Driver>();
        _configLogic = configLogic;
        _apiEventService = apiEventService;
    }

    /// <summary>
    /// Make sure display ID is not null or empty
    /// </summary>
    /// <param name="instance"></param>
    /// <returns></returns>
    public override async Task<Driver> Save(Driver instance)
    {
        // If role is navigator then capacity is 0
        if (instance.Role == RolesEnum.Navigator)
        {
            instance.Capacity = 0;
        }

        // Normalize phone number
        instance.Phone = NormalizePhoneNumber(instance.Phone);

        var count = await _dal.Count(x => x.Year == DateTime.Now.Year);

        // Set the year
        instance.Year = DateTime.UtcNow.Year;

        instance.DisplayId = GenerateDisplayId(instance, count);
        
        instance.RegisteredOn = DateTimeOffset.Now;

        // Save the instance
        var retVal = await base.Save(instance);

        return retVal;
    }

    public override async Task<Driver> Update(int id, Driver driver)
    {
        // If role is navigator then capacity is 0
        if (driver.Role == RolesEnum.Navigator)
        {
            driver.Capacity = 0;
        }

        // Update only subset of properties
        return await base.Update(id, x =>
        {
            x.DisplayId = driver.DisplayId;
            x.Fullname = driver.Fullname;
            x.Email = driver.Email;
            x.Phone = driver.Phone;
            x.Role = driver.Role;
            x.Capacity = driver.Capacity;
            x.HaveChildSeat = driver.HaveChildSeat;
            x.RequireNavigator = driver.RequireNavigator;
            x.Navigator = driver.Navigator;
        });
    }

    public async Task<Driver> DriverLogin(DriverLoginViewModel driverLoginViewModel)
    {
        var driver = await _dal.Get(x => 
            x.DisplayId == driverLoginViewModel.DriverId &&
            x.Email == driverLoginViewModel.Email &&
            x.Year == DateTime.Now.Year);

        return driver;
    }

    protected override IBasicCrud<Driver> Repository()
    {
        return _dal;
    }

    protected override IApiEventService ApiEventService()
    {
        return _apiEventService;
    }

    public override async Task<IEnumerable<Driver>> GetAll(string sortBy = null, bool? descending = null, Func<object, string, object> sortByModifier = null, params Expression<Func<Driver, bool>>[] filters)
    {
        var globalConfigs = await _configLogic.ResolveGlobalConfig();
        
        Expression<Func<Driver, bool>> yearFilterExpr = x => x.Year == globalConfigs.YearValue;

        return await base.GetAll(sortBy, descending, SortByModifierFunc, new[] { yearFilterExpr}.Concat(filters).ToArray());

        object SortByModifierFunc(object value, string prop)
        {
            if (prop == nameof(Driver.DisplayId) && value is string displayId)
            {
                return int.Parse(displayId.Split("-").Last());
            }

            return value;
        }
    }
}