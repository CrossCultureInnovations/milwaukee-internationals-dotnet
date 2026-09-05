using System;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Net;

namespace API;

/// <summary>
/// Main entry
/// </summary>
public class Program
{
    public static void Main(string[] args)
    {
        // This can be reviewed on Azure's application insights
        System.Diagnostics.Trace.TraceInformation("Application server starting");

        CreateHostBuilder(args).Build().Run();
    }

    private static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(webBuilder =>
            {
                var portConfig = Environment.GetEnvironmentVariable("PORT");
                if (string.IsNullOrEmpty(portConfig) || !int.TryParse(portConfig, out var port))
                {
                    port = 5005;
                }
                    
                webBuilder.ConfigureKestrel(serverOptions =>
                {
                    serverOptions.Listen(IPAddress.Any, port);
                }).UseStartup<Startup>();
            })
            .UseContentRoot(Directory.GetCurrentDirectory())
            .ConfigureLogging(logging => logging.SetMinimumLevel(LogLevel.Error))
            .ConfigureLogging((hostingContext, logging) =>
            {
                logging.AddConfiguration(hostingContext.Configuration.GetSection("Logging"));
                logging.AddConsole();
                logging.AddDebug();
                logging.AddEventSourceLogger();
            });
}