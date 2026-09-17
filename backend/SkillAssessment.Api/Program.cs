using Microsoft.EntityFrameworkCore;
using SkillAssessment.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// ---------------------------------------------------------
// Connection string resolution:
//   1. Env vars (Aiven / Clever Cloud / any host)
//   2. Local dev → appsettings.json DefaultConnection
// ---------------------------------------------------------

string connectionString;

var addonHost = Environment.GetEnvironmentVariable("MYSQL_ADDON_HOST");

if (!string.IsNullOrWhiteSpace(addonHost))
{
    var addonPort     = Environment.GetEnvironmentVariable("MYSQL_ADDON_PORT") ?? "3306";
    var addonDb       = Environment.GetEnvironmentVariable("MYSQL_ADDON_DB");
    var addonUser     = Environment.GetEnvironmentVariable("MYSQL_ADDON_USER");
    var addonPassword = Environment.GetEnvironmentVariable("MYSQL_ADDON_PASSWORD");

    connectionString =
        $"Server={addonHost};" +
        $"Port={addonPort};" +
        $"Database={addonDb};" +
        $"User={addonUser};" +
        $"Password={addonPassword};" +
        "SslMode=Required;" +
        "Max Pool Size=20;";
}
else
{
    connectionString = builder.Configuration
        .GetConnectionString("DefaultConnection")!;
}

// ---------------------------------------------------------
// Hardcode the MySQL server version.
// DO NOT use ServerVersion.AutoDetect() — it opens a new
// connection per request and exhausts free-tier connection
// limits.
// ---------------------------------------------------------

var serverVersion = new MySqlServerVersion(new Version(8, 0, 36));

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, serverVersion));

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ---------------------------------------------------------
// Bind to PORT (must be done BEFORE builder.Build()).
// MonsterASP/Render/Clever Cloud inject PORT; locally it
// defaults to 5195.
// ---------------------------------------------------------

var port = Environment.GetEnvironmentVariable("PORT") ?? "5195";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var app = builder.Build();

app.UseCors("ReactPolicy");

app.UseAuthorization();

app.MapControllers();

app.Run();