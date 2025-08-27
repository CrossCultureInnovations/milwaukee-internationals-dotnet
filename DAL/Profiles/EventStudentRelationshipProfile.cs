using System.Linq;
using EfCoreRepository;
using Microsoft.EntityFrameworkCore;
using Models.Entities;

namespace DAL.Profiles;

public class EventStudentRelationshipProfile: EntityProfile<EventStudentRelationship>
{
    public EventStudentRelationshipProfile()
    {
        Map(x => x.EventId);
        Map(x => x.StudentId);
    }

    protected override IQueryable<EventStudentRelationship> Include<TQueryable>(TQueryable queryable)
    {
        return queryable
            .Include(x => x.Event)
            .Include(x => x.Student);
    }
}