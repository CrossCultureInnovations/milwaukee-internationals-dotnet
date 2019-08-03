﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DAL.Interfaces;
using Logic.Abstracts;
using Logic.Interfaces;
using Models.Constants;
using Models.Entities;
using static Logic.Utilities.DisplayIdUtility;

namespace Logic
{
    public class StudentLogic : BasicCrudLogicAbstract<Student>, IStudentLogic
    {
        private readonly IStudentDal _studentDal;

        /// <summary>
        /// Constructor dependency injection
        /// </summary>
        /// <param name="studentDal"></param>
        public StudentLogic(IStudentDal studentDal)
        {
            _studentDal = studentDal;
        }

        /// <summary>
        /// Returns instance of student DAL
        /// </summary>
        /// <returns></returns>
        protected override IBasicCrudDal<Student> GetBasicCrudDal()
        {
            return _studentDal;
        }

        /// <summary>
        /// Make sure display ID is not null or empty
        /// </summary>
        /// <param name="instance"></param>
        /// <returns></returns>
        public override async Task<Student> Save(Student instance)
        {
            instance.DisplayId = "Null";

            // Set the year
            instance.Year = DateTime.UtcNow.Year;

            var count = (await base.GetAll()).Count(x => x.Year == DateTime.UtcNow.Year);

            instance.DisplayId = GenerateDisplayId(instance, count);
            
            // Save student
            var retVal = await base.Save(instance);

            return retVal;
        }
        
        public override async Task<IEnumerable<Student>> GetAll()
        {
            return (await base.GetAll()).Where(x => x.Year == YearContext.YearValue);
        }
    }
}