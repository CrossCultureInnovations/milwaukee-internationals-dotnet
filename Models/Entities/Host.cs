using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Models.Interfaces;

namespace Models.Entities;

public class Host : IPerson, IYearlyEntity
{
    [Key]
    public int Id { get; set; }
        
    public string Email { get; set; }
        
    public string Phone { get; set; }
        
    public string Fullname { get; set; }
        
    public string Address { get; set; }
        
    public List<Driver> Drivers { get; set; } = [];
        
    /// <summary>
    /// Indicates the year in which host attended the tour
    /// </summary>
    public int Year { get; set; }

    public override string ToString()
    {
        return ((IEntity)this).ToJsonString();
    }
}