using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Models.Interfaces;
using ObjectHashing;
using ObjectHashing.Interfaces;
using ObjectHashing.Models;

namespace Models.Entities;

public class Location : ObjectHash<Location>, IYearlyEntity, IEqualityComparer<Location>
{
    [Key]
    public int Id { get; set; }
    
    public int Rank { get; set; }
    
    public int Year { get; set; }
    
    public string Name { get; set; }
    
    public string Address { get; set; }
    
    public string Description { get; set; }
    
    /// <summary>
    /// Geocoded position, null until the address has been resolved. Set automatically
    /// from the address and overridden manually by dragging the pin on the map.
    /// </summary>
    public double? Latitude { get; set; }
    
    public double? Longitude { get; set; }
    
    public List<LocationMapping> LocationMappingsSources { get; set; }
    
    public List<LocationMapping> LocationMappingsSinks { get; set; }

    public bool Equals(Location x, Location y)
    {
        if (ReferenceEquals(x, y)) return true;
        if (ReferenceEquals(x, null)) return false;
        if (ReferenceEquals(y, null)) return false;
        if (x.GetType() != y.GetType()) return false;
        return x.Id == y.Id && x.Year == y.Year && x.Name == y.Name;
    }

    public int GetHashCode(Location obj)
    {
        return HashCode.Combine(Id, Name);
    }

    protected override void ConfigureObjectSha(IConfigureObjectHashConfig<Location> config)
    {
        config
            .Algorithm(HashAlgorithm.Md5)
            .Property(x => x.Name)
            .Property(x => x.Id)
            .DefaultSerialization()
            .Build();
    }
}