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
using Models.ViewModels;

namespace Logic;

public class EventLogic : BasicCrudLogicAbstract<Event>, IEventLogic
{
    private readonly IBasicCrud<Event> _dal;
    private readonly IStudentLogic _studentLogic;
    private readonly IConfigLogic _configLogic;
    private readonly IApiEventService _apiEventService;

    public EventLogic(IEfRepository repository, IStudentLogic studentLogic, IConfigLogic configLogic, IApiEventService apiEventService)
    {
        _dal = repository.For<Event>();
        _studentLogic = studentLogic;
        _configLogic = configLogic;
        _apiEventService = apiEventService;
    }

    protected override IBasicCrud<Event> Repository()
    {
        return _dal;
    }
        
    protected override IApiEventService ApiEventService()
    {
        return _apiEventService;
    }

    public override async Task<IEnumerable<Event>> GetAll(string sortBy = null, bool? descending = null, Func<object, string, object> sortByModifier = null, params Expression<Func<Event, bool>>[] filters)
    {
        var globalConfigs = await _configLogic.ResolveGlobalConfig();

        Expression<Func<Event, bool>> yearFilterExpr = x => x.Year == globalConfigs.YearValue;

        return await base.GetAll(sortBy, descending, null, new[] {yearFilterExpr}.Concat(filters).ToArray());
    }

    public override Task<Event> Save(Event instance)
    {
        // Set year context
        instance.Year = DateTime.UtcNow.Year;
            
        return base.Save(instance);
    }

    /// <summary>
    /// Returns event info
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    public async Task<EventManagementViewModel> GetEventInfo(int id)
    {
        var @event = await Get(id);

        // Prevent potential null pointer exception
        @event.Students ??= new List<EventStudentRelationship>();

        return new EventManagementViewModel
        {
            Event = @event,
            AvailableStudents = (await _studentLogic.GetAll())
                .Where(x => @event.Students.All(y => y.Student != x))
        };
    }

    /// <summary>
    /// Assigns student to event
    /// </summary>
    /// <param name="eventId"></param>
    /// <param name="studentId"></param>
    /// <returns></returns>
    public async Task<bool> MapStudent(int eventId, int studentId)
    {
        // Gets the student by Id
        var student = await _studentLogic.Get(studentId);

        var eventOriginal = await Get(eventId);

        // Avoid adding duplicated
        if (eventOriginal.Students != null && eventOriginal.Students.Any(x => x.StudentId == studentId))
        {
            return false;
        }

        // Update the event
        await Update(eventId, @event =>
        {
            // Make sure it is not null or empty
            @event.Students ??= new List<EventStudentRelationship>();
                
            // Add student
            @event.Students.Add(new EventStudentRelationship
            {
                Event = @event,
                EventId = @event.Id,
                Student = student,
                StudentId = student.Id
            });
        });

        return true;
    }
        
    /// <summary>
    /// Removed student from an event
    /// </summary>
    /// <param name="eventId"></param>
    /// <param name="studentId"></param>
    /// <returns></returns>
    public async Task<bool> UnMapStudent(int eventId, int studentId)
    {
        var eventOriginal = await Get(eventId);

        // Avoid unnecessary remove
        if (eventOriginal.Students == null || eventOriginal.Students.Any(x => x.StudentId != studentId))
        {
            return false;
        }
            
        // Update the event
        await Update(eventId, @event =>
        {
            var item = @event.Students.FirstOrDefault(x => x.StudentId == studentId);

            if (item != null)
            {
                // Remove student
                @event.Students.Remove(item);
            }
        });

        return true;
    }

    public override async Task<Event> Update(int id, Event @event)
    {
        return await base.Update(id, x =>
        {
            x.Name = @event.Name;
            x.Address = @event.Address;
            x.Description = @event.Description;
            x.DateTime = @event.DateTime;
        });
    }
}