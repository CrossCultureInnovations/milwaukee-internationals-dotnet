using System;
using System.ComponentModel.DataAnnotations;

namespace Models.Entities;

public class GlobalConfigs
{
    // we should only have single row of global id in database
    [Key]
    public int Id { get; set; }
    
    [Display(Name = "Current Year Context for Viewing")]
    public int YearValue { get; set; }
        
    [Display(Name = "Ad-Hoc Event Feature")]
    public bool EventFeature { get; set; }

    [Display(Name = "Email Test Mode")]
    public bool EmailTestMode { get; set; }

    [Display(Name = "SMS Test Mode")]
    public bool SmsTestMode { get; set; }
        
    [Display(Name = "Website Theme")]
    public string Theme { get; set; }
        
    [Display(Name = "Disallow registration of duplicate students")]
    public bool DisallowDuplicateStudents { get; set; }

    [Display(Name = "Record API events")]
    public bool RecordApiEvents { get; set; }

    [Display(Name = "Display QR code in student email")]
    public bool QrInStudentEmail { get; set; }

    [Display(Name = "Max upper limit of students for this year")]
    [Range(150, 300)]
    public int MaxLimitStudentSeats { get; set; }
        
    [Display(Name = "Time of the tour (CST Zone)")]
    public DateTime TourDate { get; set; }
    
    [Display(Name = "Student arrival time for hosts (CST Zone)")]
    public DateTime ArrivalTimeForHost { get; set; }

    [Display(Name = "Address of the tour")]
    public string TourAddress { get; set; }     
        
    [Display(Name = "Location of the tour")]
    public string TourLocation { get; set; }
    
    [Display(Name = "Location Wizard Feature")]
    public bool LocationWizardFeature { get; set; }
    
    [Display(Name = "Email sender on behalf (double check with mailjet)")]
    public string EmailSenderOnBehalf { get; set; }
}