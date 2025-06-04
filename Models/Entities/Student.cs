using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Models.Interfaces;
using ObjectHashing;
using ObjectHashing.Interfaces;
using ObjectHashing.Models;

namespace Models.Entities;

public class Student : ObjectHash<Student>, IPerson, IYearlyEntity
{
    [Key]
    public int Id { get; set; }
        
    public string Fullname { get; set; }
        
    public string Major { get; set; }
        
    public string University { get; set; }
        
    public string Email { get; set; }
        
    public string Phone { get; set; }
        
    public string Country { get; set; }

    [Display(Name = "Tell us some of your interests")]
    public string Interests { get; set; }

    [Display(Name = "Family members joining you (not including yourself)")]
    public int FamilySize { get; set; } = 1;
        
    public string DisplayId { get; set; }
        
    [Display(Name="Need a child seat?")]
    public bool NeedCarSeat { get; set; }
        
    [Display(Name="Halal or Kosher food")]
    public bool KosherFood { get; set; }
        
    public bool IsPresent { get; set; }
        
    /// <summary>
    /// Optional
    /// </summary>
    public int? DriverRefId { get; set; }

    public Driver Driver { get; set; }
        
    [Display(Name = "Registering as a family?")]
    public bool IsFamily { get; set; }

    /// <summary>
    /// Indicates the year in which student attended the tour
    /// </summary>
    public int Year { get; set; }
        
    /// <summary>
    /// List of Event Student Relationships
    /// </summary>
    public List<EventStudentRelationship> Events { get; set; } = [];
        
    public DateTimeOffset RegisteredOn { get; set; }
    
    protected override void ConfigureObjectSha(IConfigureObjectHashConfig<Student> config)
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