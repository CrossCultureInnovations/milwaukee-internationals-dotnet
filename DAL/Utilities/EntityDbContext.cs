using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Models.Entities;
using static DAL.Utilities.ConnectionStringUtility;

namespace DAL.Utilities;

public sealed class EntityDbContext: IdentityDbContext<User, IdentityRole<int>, int>, IDesignTimeDbContextFactory<EntityDbContext>
{
    public DbSet<Student> Students { get; set; }
                
    public DbSet<Driver> Drivers { get; set; }
        
    public DbSet<Host> Hosts { get; set; }
        
    public DbSet<Event> Events { get; set; }
        
    public DbSet<Location> Locations { get; set; }
    
    public DbSet<GlobalConfigs> GlobalConfigs { get; set; }

    public EntityDbContext() { }

    /// <inheritdoc />
    /// <summary>
    /// Constructor that will be called by startup.cs
    /// </summary>
    /// <param name="optionsBuilderOptions"></param>
    // ReSharper disable once SuggestBaseTypeForParameter
    public EntityDbContext(DbContextOptions<EntityDbContext> optionsBuilderOptions) : base(optionsBuilderOptions)
    {
        Database.EnsureCreated();
    }
        
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
            
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(EntityDbContext).Assembly);
    }

    /// <summary>
    ///     This is used for DB migration locally
    /// </summary>
    /// <param name="args"></param>
    /// <returns></returns>
    public EntityDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .AddEnvironmentVariables()
            .Build();

        var options = new DbContextOptionsBuilder<EntityDbContext>()
            .UseNpgsql(ConnectionStringUrlToPgResource(configuration.GetValue<string>("DATABASE_URL")))
            .Options;

        return new EntityDbContext(options);
    }
}