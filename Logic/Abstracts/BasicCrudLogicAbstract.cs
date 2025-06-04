using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Threading.Tasks;
using DAL.Interfaces;
using EfCoreRepository.Interfaces;
using Logic.Interfaces;
using Models.Entities;
using Models.Interfaces;

namespace Logic.Abstracts;

public abstract class BasicCrudLogicAbstract<T> : IBasicCrudLogic<T> where T : class, IEntity, new()
{
    protected abstract IBasicCrud<T> Repository();
        
    protected abstract IApiEventService ApiEventService();

    public async Task<IEnumerable<T>> GetAll(int year)
    {
        return this switch
        {
            BasicCrudLogicAbstract<Driver> driverLogic => (await driverLogic.GetAll(filters: x => x.Year == year)).Cast<T>(),
            BasicCrudLogicAbstract<Host> hostLogic => (await hostLogic.GetAll(filters: x => x.Year == year)).Cast<T>(),
            BasicCrudLogicAbstract<Student> studentLogic => (await studentLogic.GetAll(filters: x => x.Year == year)).Cast<T>(),
            BasicCrudLogicAbstract<Event> eventLogic => (await eventLogic.GetAll(filters: x => x.Year == year)).Cast<T>(),
            BasicCrudLogicAbstract<Location> locationLogic => (await locationLogic.GetAll(filters: x => x.Year == year)).Cast<T>(),
            BasicCrudLogicAbstract<LocationMapping> locationMappingLogic => (await locationMappingLogic.GetAll(filters: x => x.Year == year)).Cast<T>(),
            BasicCrudLogicAbstract<User> userLogic => (await userLogic.GetAll()).Cast<T>(),
            _ => new List<T>()
        };
    }

    /// <summary>
    /// Call forwarding
    /// </summary>
    /// <param name="sortBy"></param>
    /// <param name="sortByModifier"></param>
    /// <param name="descending"></param>
    /// <param name="filters"></param>
    /// <returns></returns>
    public virtual async Task<IEnumerable<T>> GetAll(string sortBy = null, bool? descending = null, Func<object, string, object> sortByModifier = null, params Expression<Func<T, bool>>[] filters)
    {
        var result = await Repository().GetAll<T>(filters);

        await ApiEventService().RecordEvent($"Queried all {typeof(T).Name}");

        if (string.IsNullOrEmpty(sortBy))
        {
            return result;
        }

        var property = typeof(T).GetProperties()
            .Where(x => x.CanRead && x.CanWrite)
            .FirstOrDefault(x => x.Name.Equals(sortBy, StringComparison.OrdinalIgnoreCase));

        if (property == null)
        {
            return result;
        }

        var propertyAccessFunc = ToLambda(property, sortByModifier).Compile();

        if (!descending.HasValue || !descending.Value)
        {
            return result.OrderBy(propertyAccessFunc).ToList();
        }

        return result.OrderByDescending(propertyAccessFunc).ToList();
    }
        
    private static Expression<Func<T, object>> ToLambda(PropertyInfo propertyInfo, Func<object, string, object> sortByModifier = null)
    {
        var parameter = Expression.Parameter(typeof(T));
        var property = Expression.Property(parameter, propertyInfo);
        Expression propAsObject = Expression.Convert(property, typeof(object));

        if (sortByModifier != null)
        {
            propAsObject = Expression.Invoke(Expression.Constant(sortByModifier), propAsObject, Expression.Constant(propertyInfo.Name));
        }

        return Expression.Lambda<Func<T, object>>(propAsObject, parameter);            
    }

    /// <summary>
    /// Call forwarding
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    public virtual async Task<T> Get(int id)
    {
        var result =  await Repository().Get(id);
            
        await ApiEventService().RecordEvent($"Queried ID: {id} of {typeof(T).Name}");

        return result;
    }

    /// <summary>
    /// Call forwarding
    /// </summary>
    /// <param name="instance"></param>
    /// <returns></returns>
    public virtual async Task<T> Save(T instance)
    {
        var result = await Repository().Save(instance);
         
        await ApiEventService().RecordEvent($"Save new {typeof(T).Name} => {instance}");

        return result;
    }

    /// <summary>
    /// Call forwarding
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    public virtual async Task<T> Delete(int id)
    {
        var result =await Repository().Delete(id);
            
        await ApiEventService().RecordEvent($"Delete {typeof(T).Name} with ID: {id}");

        return result;
    }

    /// <summary>
    /// Call forwarding
    /// </summary>
    /// <param name="id"></param>
    /// <param name="updatedInstance"></param>
    /// <returns></returns>
    public virtual async Task<T> Update(int id, T updatedInstance)
    {
        var result = await Repository().Update(id, updatedInstance);
            
        await ApiEventService().RecordEvent($"Update {typeof(T).Name} with ID: {id} => {updatedInstance}");

        return result;
    }

    /// <summary>
    /// Call forwarding
    /// </summary>
    /// <param name="id"></param>
    /// <param name="modifyAction"></param>
    /// <returns></returns>
    public virtual async Task<T> Update(int id, Action<T> modifyAction)
    {
        var result = await Repository().Update(id, modifyAction);;
            
        await ApiEventService().RecordEvent($"Updated {typeof(T).Name} with ID: {id} => {result}");

        return result;
    }

    public async Task<int> Count(Expression<Func<T, bool>> filter)
    {
        return await Repository().Count([filter]);
    }
}