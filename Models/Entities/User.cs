using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;
using Models.Enums;
using Models.Interfaces;
using Newtonsoft.Json;

namespace Models.Entities;

public class User : IdentityUser<int>, IPerson
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [PersonalData]
    public override int Id { get; set; }

    public string Fullname { get; set; }
        
    [Display(Name = "User Role")]
    public UserRoleEnum UserRoleEnum { get; set; }

    public DateTimeOffset LastLoggedInDate { get; set; } = DateTimeOffset.Now;
        
    public bool Enable { get; set; }

    /// <summary>
    /// The user endpoints return this entity directly. These two are credential
    /// material, so they stay out of every payload in both directions: never read by
    /// a client, never set from one. ConcurrencyStamp is deliberately left alone —
    /// it is not a secret, and overriding it would drop the base class initializer
    /// that EF relies on for the optimistic concurrency token.
    /// </summary>
    [JsonIgnore]
    [System.Text.Json.Serialization.JsonIgnore]
    public override string PasswordHash { get; set; }

    [JsonIgnore]
    [System.Text.Json.Serialization.JsonIgnore]
    public override string SecurityStamp { get; set; }
}
