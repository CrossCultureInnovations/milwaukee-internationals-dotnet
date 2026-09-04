using EfCoreRepository;
using Models.Entities;

namespace DAL.Profiles;

public class LocationProfile : EntityProfile<Location>
{
    public LocationProfile()
    {
        // Coordinates are excluded so the edit form, which does not send them, cannot
        // null out a geocoded or hand-corrected pin. They are written through
        // LocationLogic and the coordinates endpoint instead.
        MapAll(location => location.Year, location => location.Latitude, location => location.Longitude);
    }
}