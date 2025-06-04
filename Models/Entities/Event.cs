using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Models.Interfaces;

namespace Models.Entities;

public class Event : IYearlyEntity
{
    [Key]
    public int Id { get; set; }
        
    public string Name { get; set; }
        
    public string Description { get; set; }
        
    public DateTime DateTime { get; set; } = DateTime.Today.AddDays(1);
        
    public string Address { get; set; }
        
    /// <summary>
    /// List of Event Student Relationships
    /// </summary>
    public List<EventStudentRelationship> Students { get; set; } = [];
        
    /// <summary>
    /// Indicates the year in which driver attended the tour
    /// </summary>
    public int Year { get; set; }
        
    public override string ToString()
    {
        return ((IEntity)this).ToJsonString();
    }
}