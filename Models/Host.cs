﻿using System.ComponentModel.DataAnnotations;
using Models.Interfaces;

namespace Models
{
    public class Host : IPerson
    {
        [Key]
        public int Id { get; set; }
        
        public string Email { get; set; }
        
        public string Phone { get; set; }
        
        public string Fullname { get; set; }
        
        public string Address { get; set; }
    }
}