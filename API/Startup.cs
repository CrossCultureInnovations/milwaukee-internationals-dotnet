using System;
using System.Net;
using System.Reflection;
using System.Text;
using API.Extensions;
using API.Middlewares;
using API.Utilities;
using Microsoft.AspNetCore.SignalR;
using DAL.Interfaces;
using DAL.ServiceApi;
using DAL.Utilities;
using EfCoreRepository.Extensions;
using Mailjet.Client;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MlkPwgen;
using Models.Constants;
using Models.Entities;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using OwaspHeaders.Core.Extensions;
using OwaspHeaders.Core.Models;
using Scrutor;
using WebMarkupMin.AspNetCore6;
using static DAL.Utilities.ConnectionStringUtility;

namespace API;

public class Startup
{
    private readonly IConfigurationRoot _configuration;

    private readonly IWebHostEnvironment _env;

    public Startup(IWebHostEnvironment env)
    {
        _env = env;

        var builder = new ConfigurationBuilder()
            .SetBasePath(env.ContentRootPath)
            .AddJsonFile("appsettings.json", true, true)
            .AddJsonFile($"appsettings.{env.EnvironmentName}.json", true)
            .AddJsonFile("secureHeaderSettings.json", true, true)
            .AddEnvironmentVariables();

        _configuration = builder.Build();
    }

    /// <summary>
    /// This method gets called by the runtime. Use this method to add services to the container.
    /// For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
    /// </summary>
    /// <param name="services"></param>
    /// <returns></returns>
    public void ConfigureServices(IServiceCollection services)
    {
        // If environment is localhost, then enable CORS policy, otherwise no cross-origin access
        services.AddCors(options => options.AddPolicy("CorsPolicy", builder => builder
            .WithOrigins(_configuration.GetSection("TrustedSpaUrls").Get<string[]>())
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()));
            
        // https://stackoverflow.com/a/70304966/1834787
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

        services.AddWebMarkupMin()
            .AddHtmlMinification()
            .AddXmlMinification()
            .AddHttpCompression();

        services.AddOptions();

        // Add our Config object so it can be injected
        services.Configure<SecureHeadersMiddlewareConfiguration>(
            _configuration.GetSection("SecureHeadersMiddlewareConfiguration"));

        services.AddLogging();
            
        services.Configure<JwtSettings>(_configuration.GetSection("JwtSettings"));

        services.AddRouting(options =>
        {
            options.LowercaseUrls = true;
        });

        services.AddSession(options =>
        {
            // Set a short timeout for easy testing.
            options.IdleTimeout = TimeSpan.FromMinutes(50);
            options.Cookie.HttpOnly = true;
            options.Cookie.Name = ApiConstants.AuthenticationSessionCookieName;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        });

        services.AddSignalR(config =>
        {
            config.MaximumReceiveMessageSize = 10 * 1024 * 1024; // 10 mega-bytes
            config.StreamBufferCapacity = 50;
            config.EnableDetailedErrors = true;
        }).AddNewtonsoftJsonProtocol();

        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo { Title = "Milwaukee-Internationals-API", Version = "v1" });
        });

        services.AddMvc(x =>
            {
                x.ModelValidatorProviders.Clear();

                // Not need to have https
                x.RequireHttpsPermanent = false;

                // Allow anonymous for localhost
                if (_env.IsDevelopment())
                {
                    x.Filters.Add<AllowAnonymousFilter>();
                }

                x.Filters.Add<PreventAuthenticatedActionFilter>();
            })
            .AddViewOptions(x => { x.HtmlHelperOptions.ClientValidationEnabled = true; })
            .AddNewtonsoftJson(x =>
            {
                x.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
                x.SerializerSettings.Converters.Add(new StringEnumConverter());
            }).AddRazorPagesOptions(x => { x.Conventions.ConfigureFilter(new IgnoreAntiforgeryTokenAttribute()); });

        services.AddWebMarkupMin(opt =>
            {
                opt.AllowMinificationInDevelopmentEnvironment = true;
                opt.AllowCompressionInDevelopmentEnvironment = true;
            })
            .AddHtmlMinification()
            .AddHttpCompression();

        services.AddSingleton<CacheBustingUtility>();

        services.AddTransient<ISmsService>(ctx => new SmsService(
            _configuration.GetRequiredValue<string>("TELNYX_AUTH_TOKEN"),
            _configuration.GetRequiredValue<string>("TELNYX_SENDER_PHONE_NUMBER"),
            ctx.GetRequiredService<IConfigLogic>(),
            ctx.GetRequiredService<ILogger<SmsService>>()));

        // Initialize the email jet client
        services.AddTransient<IMailjetClient>(ctx => new MailjetClient(
            Environment.GetEnvironmentVariable("MAIL_JET_KEY"),
            Environment.GetEnvironmentVariable("MAIL_JET_SECRET"))
        );

        services.AddDbContext<EntityDbContext>(opt =>
        {
            if (_env.IsDevelopment())
            {
                opt.EnableDetailedErrors();
                opt.EnableSensitiveDataLogging();

                opt.UseSqlite(_configuration.GetValue<string>("ConnectionStrings:Sqlite"));
            }
            else
            {
                var postgresConnectionString =
                    ConnectionStringUrlToPgResource(_configuration.GetValue<string>("DATABASE_URL")
                                                    ?? throw new Exception("DATABASE_URL is null"));
                opt.UseNpgsql(postgresConnectionString);
            }
        });

        services.AddIdentity<User, IdentityRole<int>>(x =>
            {
                x.User.RequireUniqueEmail = true; 
                x.Lockout.AllowedForNewUsers = true;
                x.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(2);
                x.Lockout.MaxFailedAccessAttempts = 3;
            })
            .AddEntityFrameworkStores<EntityDbContext>()
            .AddRoles<IdentityRole<int>>()
            .AddDefaultTokenProviders();

        var jwtSetting = _configuration
            .GetSection("JwtSettings")
            .Get<JwtSettings>();

        // Random JWT key
        jwtSetting.Key = PasswordGenerator.Generate(length: 100, allowed: Sets.Alphanumerics);

        services.AddSingleton(jwtSetting);
            
        services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(x =>
        {
            x.Cookie.MaxAge = TimeSpan.FromHours(3);
            x.LoginPath = new PathString("/Identity/login");
            x.LogoutPath = new PathString("/Identity/logout");
            x.SlidingExpiration = true;
        }).AddJwtBearer(config =>
        {
            config.RequireHttpsMetadata = false;
            config.SaveToken = true;

            config.TokenValidationParameters = new TokenValidationParameters
            {
                ValidIssuer = jwtSetting.Issuer,
                ValidAudience = jwtSetting.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSetting.Key))
            };
        });

        services.AddEfRepository<EntityDbContext>(opt => opt.Profile(Assembly.Load("Dal")));

        services.AddScoped<IUserIdProvider, CustomUserIdProvider>();
        
        services.Scan(scan => scan
            .FromAssemblies(Assembly.Load("API"), Assembly.Load("Logic"), Assembly.Load("DAL"))
            .AddClasses() // to register
            .UsingRegistrationStrategy(RegistrationStrategy.Skip) // 2. Define how to handle duplicates
            .AsImplementedInterfaces() // 2. Specify which services they are registered as
            .WithTransientLifetime()); // 3. Set the lifetime for the services
    }

    /// <summary>
    /// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    /// </summary>
    /// <param name="app"></param>
    public void Configure(IApplicationBuilder app)
    {
        // Add SecureHeadersMiddleware to the pipeline
        app.UseSecureHeadersMiddleware(_configuration.Get<SecureHeadersMiddlewareConfiguration>());

        app.UseCors("CorsPolicy");

        if (_env.IsDevelopment())
        {
            // Enable middleware to serve generated Swagger as a JSON endpoint.
            app.UseSwagger();

            // Enable middleware to serve swagger-ui (HTML, JS, CSS, etc.), 
            // specifying the Swagger JSON endpoint.
            app.UseSwaggerUI(c => { c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1"); });
        }
        else
        {
            app.UseWebMarkupMin();
        }

        // Not necessary for this workshop but useful when running behind kubernetes
        app.UseForwardedHeaders(new ForwardedHeadersOptions
        {
            // Read and use headers coming from reverse proxy: X-Forwarded-For X-Forwarded-Proto
            // This is particularly important so that HttpContent.Request.Scheme will be correct behind a SSL terminating proxy
            ForwardedHeaders = ForwardedHeaders.XForwardedFor |
                               ForwardedHeaders.XForwardedProto
        });

        app.Use(async (context, next) =>
        {
            await next();
                
            if (context.Response.IsFailure())
            {
                var apiEventServiceCtx = context.RequestServices.GetRequiredService<IApiEventService>();
                var exHandlerFeature = context.Features.Get<IExceptionHandlerFeature>();
                var exception = exHandlerFeature?.Error;

                var statusCodeEnum = (HttpStatusCode)context.Response.StatusCode;
                await apiEventServiceCtx.RecordEvent($"Failure with status code: {statusCodeEnum.ToString()} / {context.Response.StatusCode} route: [{context.Request.Method}] {context.Request.GetDisplayUrl()} => {exception?.Message}");
                    
                context.Request.Path = $"/Error/{context.Response.StatusCode}";
                await next();
            }
        });

        // Use wwwroot folder as default static path
        app.UseDefaultFiles()
            .UseHttpsRedirection()
            .UseEnableRequestRewind()
            .UseStaticFiles()
            .UseCookiePolicy()
            .UseSession()
            .UseRouting()
            .UseAuthentication()
            .UseAuthorization()
            .UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapHub<MessageHub>("/hub");
                endpoints.MapHub<LogHub>("/log");
            });

        Console.WriteLine("Application Started!");
    }
}
