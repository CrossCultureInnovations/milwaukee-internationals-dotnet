using System.Linq;
using EfCoreRepository.Interfaces;
using Microsoft.EntityFrameworkCore;
using Models.Entities;

namespace DAL.Profiles
{
    public class HostProfile : IEntityProfile<Host, int>
    {
        public Host Update(Host entity, Host dto)
        {
            entity.Fullname = dto.Fullname;
            entity.Email = dto.Email;
            entity.Phone = dto.Phone;
            entity.Address = dto.Address;

            return entity;
        }

        public IQueryable<Host> Include<TQueryable>(TQueryable queryable) where TQueryable : IQueryable<Host>
        {
            return queryable
                .Include(x => x.Drivers)
                .ThenInclude(x => x.Students)
                .OrderBy(x => x.Fullname);
        }
    }
}