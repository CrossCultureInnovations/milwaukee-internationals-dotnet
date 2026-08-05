using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using DAL.Interfaces;
using DAL.Utilities;
using Microsoft.EntityFrameworkCore;
using Models.Entities;
using Models.ViewModels;

namespace DAL;

public class ConfigLogic(EntityDbContext dbContext) : IConfigLogic
{
    /// <summary>
    /// This is the year when milwaukee-internationals started
    /// </summary>
    private const int StartYear = 2017; // DO-NOT CHANGE!

    private static readonly PropertyInfo[] ConfigProperties = typeof(GlobalConfigModel)
        .GetProperties(BindingFlags.Instance | BindingFlags.Public)
        .Where(property => property.CanRead && property.CanWrite)
        .ToArray();

    public async Task<GlobalConfigModel> ResolveGlobalConfig()
    {
        var rows = await dbContext.GlobalConfigs.AsNoTracking().ToListAsync();
        var values = rows.ToDictionary(row => row.Key, row => row.Value, StringComparer.Ordinal);
        var configs = new GlobalConfigModel();

        foreach (var property in ConfigProperties)
        {
            if (values.TryGetValue(property.Name, out var value))
            {
                property.SetValue(configs, ParseValue(property.PropertyType, value));
            }
        }

        return configs;
    }

    public async Task SetGlobalConfig(GlobalConfigModel globalConfigs)
    {
        var rows = await dbContext.GlobalConfigs.ToDictionaryAsync(row => row.Key, StringComparer.Ordinal);

        foreach (var property in ConfigProperties)
        {
            var value = FormatValue(property.GetValue(globalConfigs));
            if (rows.TryGetValue(property.Name, out var row))
            {
                row.Value = value;
            }
            else
            {
                dbContext.GlobalConfigs.Add(new GlobalConfigs
                {
                    Key = property.Name,
                    Value = value
                });
            }
        }

        await dbContext.SaveChangesAsync();
    }

    public IEnumerable<int> GetYears()
    {
        var currentYear = StartYear;
        while (currentYear <= DateTimeOffset.Now.Year)
        {
            yield return currentYear;
            currentYear++;
        }
    }

    private static object ParseValue(Type type, string value)
    {
        if (type == typeof(string)) return value;
        if (type == typeof(bool)) return bool.Parse(value);
        if (type == typeof(int)) return int.Parse(value, CultureInfo.InvariantCulture);
        if (type == typeof(DateTimeOffset)) return DateTimeOffset.Parse(value, CultureInfo.InvariantCulture, DateTimeStyles.AllowWhiteSpaces);

        throw new NotSupportedException($"Global config type '{type.Name}' is not supported.");
    }

    private static string FormatValue(object value)
    {
        return value switch
        {
            null => string.Empty,
            DateTimeOffset dateTimeOffset => dateTimeOffset.ToString("O", CultureInfo.InvariantCulture),
            IFormattable formattable => formattable.ToString(null, CultureInfo.InvariantCulture),
            _ => value.ToString()
        };
    }
}