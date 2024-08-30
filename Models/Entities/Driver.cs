using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Models.Enums;
using Models.Interfaces;
using ObjectHashing;
using ObjectHashing.Interfaces;
using ObjectHashing.Models;

namespace Models.Entities;

public class Driver : ObjectHash<Driver>, IPerson, IYearlyEntity
{
    [Key]
    public int Id { get; set; }
        
    [Display(Name="Email")]
    public string Email { get; set; }
        
    [Display(Name="Phone")]
    public string Phone { get; set; }

    [Display(Name="Fullname")]
    public string Fullname { get; set; }
        
    public string DisplayId { get; set; }
        
    [Display(Name = "Capacity")]
        
    [Range(1, 7)]
    public int Capacity { get; set; } = 1;
        
    [Display(Name="Require Navigator")]
    public bool RequireNavigator { get; set; } = true;
        
    [Display(Name="Navigator fullname")]
    public string Navigator { get; set; }
        
    [Display(Name="Role")]
    public RolesEnum Role { get; set; }
        
    public List<Student> Students { get; set; } = new();

    public int? HostRefId { get; set; }

    public Host Host { get; set; }
        
    public bool IsPresent { get; set; }
        
    [Display(Name = "Have a child seat available")]
    public bool HaveChildSeat { get; set; }
        
    /// <summary>
    /// Indicates the year in which driver attended the tour
    /// </summary>
    public int Year { get; set; }

    public DateTimeOffset RegisteredOn { get; set; }

    protected override void ConfigureObjectSha(IConfigureObjectHashConfig<Driver> config)
    {
        config
            .Algorithm(HashAlgorithm.Md5)
            .Property(x => x.Email)
            .Property(x => x.Phone)
            .Property(x => x.Id)
            .Property(x => x.Fullname)
            .DefaultSerialization()
            .Build();
    }

    public override string ToString()
    {
        return ((IEntity)this).ToJsonString();
    }
}