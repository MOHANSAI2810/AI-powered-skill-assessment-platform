using Microsoft.EntityFrameworkCore;
using SkillAssessment.Api.Data;
using SkillAssessment.Api.Models;
using SkillAssessment.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// ---------------------------------------------------------
// Connection string resolution:
//   1. Env vars (Aiven / Render / SmarterASP / any host)
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

// ---------------------------------------------------------
// AI summary service (Groq)
// ---------------------------------------------------------

var aiOptions = new AiOptions
{
    ApiKey  = Environment.GetEnvironmentVariable("GROQ_API_KEY") ?? "",
    BaseUrl = Environment.GetEnvironmentVariable("AI_BASE_URL")
                ?? "https://api.groq.com/openai/v1",
    Model   = Environment.GetEnvironmentVariable("AI_MODEL")
                ?? "llama-3.3-70b-versatile"
};

builder.Services.AddSingleton(aiOptions);
builder.Services.AddHttpClient<AiSummaryService>();

// ---------------------------------------------------------
// CORS
// ---------------------------------------------------------

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
// Listening URL
// ---------------------------------------------------------
// On Render/Docker, ASPNETCORE_URLS is set via the Dockerfile
// ENV directive → we skip the fallback.
// Locally, ASPNETCORE_URLS is not set → fall back to 5195.
// ---------------------------------------------------------

if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_URLS")))
{
    var port = Environment.GetEnvironmentVariable("PORT") ?? "5195";
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

var app = builder.Build();

app.UseCors("ReactPolicy");

app.UseAuthorization();

app.MapControllers();

app.Run();