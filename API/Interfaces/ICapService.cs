using System.Threading.Tasks;

namespace API.Interfaces;

public interface ICapService
{
    Task<bool> IsSatisfied(string token);
}
