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

namespace Logic;

public class StatsLogic : IStatsLogic
{
    private readonly IConfigLogic _configLogic;
    private readonly IBasicCrud<Student> _studentDal;
    private readonly IBasicCrud<Driver> _driverDal;
    private readonly IBasicCrud<Host> _hostDal;

    public StatsLogic(IEfRepository repository, IConfigLogic configLogic)
    {
        _configLogic = configLogic;
        _studentDal = repository.For<Student>();
        _driverDal = repository.For<Driver>();
        _hostDal = repository.For<Host>();
    }
    
    public async Task<List<StatsViewModel>> GetStats()
    {
        var result = new List<StatsViewModel>();
        var countryDistribution = await GetCountryDistribution();
        
        foreach (var year in _configLogic.GetYears())
        {
            var students = (await _studentDal.GetAll<Student>(filterExprs: [
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
        
        foreach (var year in _configLogic.GetYears())
        {
            var countDrivers = await _driverDal.Count([x => x.Year == year && x.Role == RolesEnum.Driver]);

            if (countDrivers <= 0) continue;

            var countryDistributionForYear = (await _studentDal.GetAll<Student>(filterExprs: [x => x.Year == year]))
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