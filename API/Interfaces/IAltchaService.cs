using System.Threading.Tasks;

namespace API.Interfaces;

public interface IAltchaService
{
    Task<bool> IsSatisfied(string payload);
}
