using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DAL.Interfaces;
using EfCoreRepository.Interfaces;
using Logic.Interfaces;
using Models.Entities;
using Models.Enums;
using Models.ViewModels;
using EfCoreRepository.Extensions;

namespace Logic;

public class StatsLogic(IEfRepository repository, IConfigLogic configLogic) : IStatsLogic
{
    private readonly IBasicCrud<Student> _studentDal = repository.For<Student>();
    private readonly IBasicCrud<Driver> _driverDal = repository.For<Driver>();
    private readonly IBasicCrud<Host> _hostDal = repository.For<Host>();

    public async Task<List<StatsViewModel>> GetStats()
    {
        var result = new List<StatsViewModel>();
        var countryDistribution = await GetCountryDistribution();
        
        foreach (var year in configLogic.GetYears())
        {
            var students = (await _studentDal.GetAll(filterExprs: [
                x => x.Year == year
            ])).ToList();
            
            var countDrivers = await _driverDal.Count(filterExprs: [
                x => x.Year == year && x.Role == RolesEnum.Driver
            ]);
            var countHosts = await _hostDal.Count([
                x => x.Year == year
            ]);
            var countDependents = students.Select(x => x.FamilySize).Sum();
            var countDistinctCountries = students.Select(x => x.Country.ToLower()).Distinct().Count();
            
            var currentYear = DateTime.Now.Year == year;
            var activeYear = countDrivers > 0;
            
            result.Add(new StatsViewModel
            {
                CountPresentStudents = students.Count(x => x.IsPresent),
                Year = year,
                CountDrivers = countDrivers,
                CountStudents = students.Count,
                CountHosts = countHosts,
                CountDependents = countDependents,
                CountDistinctCountries = countDistinctCountries,
                CurrentYear = currentYear,
                ActiveYear = activeYear,
                CountryDistribution = countryDistribution.GetValueOrDefault(year.ToString(), new Dictionary<string, int>())
            }); 
        }

        return result;
    }

    public async Task<Dictionary<string, Dictionary<string, int>>> GetCountryDistribution()
    {
        var result = new Dictionary<string, Dictionary<string, int>>();
        
        foreach (var year in configLogic.GetYears())
        {
            var countDrivers = await _driverDal.Count([x => x.Year == year && x.Role == RolesEnum.Driver]);

            if (countDrivers <= 0) continue;

            var countryDistributionForYear = (await _studentDal.GetAll(filterExprs: [x => x.Year == year]))
                .GroupBy(x => x.Country.ToLower())
                .ToDictionary(x => x.Key, x => x.Count());

            result[year.ToString()] = countryDistributionForYear;
        }
        
        var countryDistributionForAllYears = (await _studentDal.GetAll())
            .GroupBy(x => x.Country.ToLower())
            .ToDictionary(x => x.Key, x => x.Count());

        result["All"] = countryDistributionForAllYears;

        return result;
    }
}