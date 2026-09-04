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
using static Logic.Utilities.RegistrationUtility;

namespace Logic;

public class StudentLogic(IEfRepository repository, IConfigLogic configLogic, IApiEventService apiEventService)
    : BasicCrudLogicAbstract<Student>, IStudentLogic
{
    private readonly IBasicCrud<Student> _dal = repository.For<Student>();


    /// <inheritdoc />
    /// <summary>
    /// Make sure display ID is not null or empty
    /// </summary>
    /// <param name="student"></param>
    /// <returns></returns>
    public override async Task<Student> Save(Student student)
    {
        var allStudents = (await GetAll(DateTime.UtcNow.Year)).ToList();

        await ThrowIfDuplicate(student, allStudents);

        // Normalize phone number
        student.Phone = NormalizePhoneNumber(student.Phone);

        // Set the year
        student.Year = DateTime.UtcNow.Year;
        student.RegisteredOn = DateTimeOffset.Now;

        var count = allStudents.Count;

        // This will ensure there is never two drivers with the same number
        while (true)
        {
            var displayIdCandidate = GenerateDisplayId(student, count);

            if (allStudents.All(x => x.DisplayId != displayIdCandidate))
            {
                student.DisplayId = displayIdCandidate;
                break;
            }

            count++;
        }

        // If student is not a family then family size should be zero
        if (!student.IsFamily)
        {
            student.FamilySize = 0;
        }
            
        // Save student
        var retVal = await base.Save(student);

        return retVal;
    }

    /// <inheritdoc />
    /// <summary>
    /// Edit student
    /// </summary>
    /// <param name="id"></param>
    /// <param name="student"></param>
    /// <returns></returns>
    public override async Task<Student> Update(int id, Student student)
    {
        await ThrowIfDuplicate(student, (await GetAll(DateTime.UtcNow.Year)).Where(x => x.Id != id).ToList());

        // Update only subset of properties
        return await base.Update(id, x =>
        {
            x.Fullname = student.Fullname;

            // Not every client round trips the display ID, so never blank out an existing one
            if (!string.IsNullOrWhiteSpace(student.DisplayId))
            {
                x.DisplayId = student.DisplayId;
            }

            x.Email = student.Email;
            x.Phone = NormalizePhoneNumber(student.Phone);
            x.University = student.University;
            x.Major = student.Major;
            x.Country = student.Country;
            x.Interests = student.Interests;
            x.IsFamily = student.IsFamily;
            x.KosherFood = student.KosherFood;

            // Family size and child seat only mean something for a family
            x.FamilySize = student.IsFamily ? student.FamilySize : 0;
            x.NeedCarSeat = student.IsFamily && student.NeedCarSeat;
        });
    }

    /// <summary>
    /// Reject a student whose name and email already belong to another student this year
    /// </summary>
    private async Task ThrowIfDuplicate(Student student, IEnumerable<Student> otherStudents)
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        if (!globalConfigs.DisallowDuplicateStudents)
        {
            return;
        }

        if (otherStudents.Any(x =>
                string.Equals(x.Fullname, student.Fullname, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(x.Email, student.Email, StringComparison.OrdinalIgnoreCase)))
        {
            throw new Exception("Student already registered");
        }
    }

    protected override IBasicCrud<Student> Repository()
    {
        return _dal;
    }
        
    protected override IApiEventService ApiEventService()
    {
        return apiEventService;
    }

    public override async Task<IEnumerable<Student>> GetAll(string sortBy = null, bool? descending = null, Func<object, string, object> sortByModifier = null, params Expression<Func<Student, bool>>[] filters)
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        Expression<Func<Student, bool>> yearFilterExpr = x => x.Year == globalConfigs.YearValue;
        
        return await base.GetAll(sortBy, descending, SortByModifierFunc, new[] { yearFilterExpr}.Concat(filters).ToArray());
        
        object SortByModifierFunc(object value, string prop)
        {
            if (prop == nameof(Student.DisplayId) && value is string displayId)
            {
                return int.Parse(displayId.Split("-").Last());
            }

            return value;
        }
    }
}