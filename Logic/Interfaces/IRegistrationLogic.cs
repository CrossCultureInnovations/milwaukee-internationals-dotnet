using System.Threading.Tasks;
using Models.Entities;

namespace Logic.Interfaces;

public interface IRegistrationLogic
{
    Task RegisterDriver(Driver driver);

    Task RegisterStudent(Student student);
        
    Task<bool> IsRegisterStudentOpen();

    Task<bool> IsRegisterDriverOpen();
        
    Task RegisterHost(Host host);

    Task RegisterEvent(Event @event);
    
    Task RegisterLocation(Location location);

    Task SendStudentEmail(Student student);
    
    Task SendDriverEmail(Driver driver);
    
    Task SendHostEmail(Host host);

    Task SendDriverSms(Driver driver);

    Task SendStudentSms(Student student);
    
    Task SendHostSms(Host host);
}
