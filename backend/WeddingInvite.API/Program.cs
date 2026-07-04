using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.RateLimiting;
using WeddingInvite.API;
using WeddingInvite.Data;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Core.Services;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Centralized error handling → structured logs + RFC-7807 ProblemDetails
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Repositories
builder.Services.AddScoped<IWeddingRepository, WeddingRepository>();
builder.Services.AddScoped<IGuestRepository, GuestRepository>();
builder.Services.AddScoped<IWishRepository, WishRepository>();
builder.Services.AddScoped<IFeatureRepository, FeatureRepository>();
builder.Services.AddScoped<IWeddingFeatureRepository, WeddingFeatureRepository>();
builder.Services.AddScoped<IPhotoRepository, PhotoRepository>();
builder.Services.AddScoped<ITemplateRepository, TemplateRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>(); // ADD THIS
builder.Services.AddScoped<IPackageRepository, PackageRepository>();
builder.Services.AddScoped<ITemplateConfigRepository, TemplateConfigRepository>();
builder.Services.AddScoped<ITableRepository, TableRepository>();
builder.Services.AddScoped<IItineraryRepository, ItineraryRepository>();

// Services
builder.Services.AddScoped<IWeddingService, WeddingService>();
builder.Services.AddScoped<IGuestService, GuestService>();
builder.Services.AddScoped<IWishService, WishService>();
builder.Services.AddScoped<IFeatureService, FeatureService>();
builder.Services.AddScoped<IWeddingFeatureService, WeddingFeatureService>();
builder.Services.AddScoped<IPhotoService, PhotoService>();
builder.Services.AddScoped<ITemplateService, TemplateService>();
builder.Services.AddScoped<IPackageService, PackageService>();
builder.Services.AddScoped<IAuthService, AuthService>(); // ADD THIS
builder.Services.AddScoped<IWeddingAuthorizationService, WeddingAuthorizationService>(); // ✅ RENAMED
builder.Services.AddScoped<ITemplateConfigService, TemplateConfigService>();
builder.Services.AddScoped<ITableService, TableService>();
builder.Services.AddScoped<IItineraryService, ItineraryService>();

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

// ── Secret hygiene: fail fast on a missing/weak/leaked signing key ──────────────
// The old default key was committed to source control; never allow it to sign tokens.
const string LeakedDefaultKey = "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
if (secretKey == LeakedDefaultKey)
{
    throw new InvalidOperationException(
        "JwtSettings:SecretKey is set to the old committed default. Set a fresh secret via " +
        "the JWT_SECRET env var (JwtSettings__SecretKey) before starting.");
}
if (string.IsNullOrWhiteSpace(secretKey) || Encoding.UTF8.GetByteCount(secretKey) < 32)
{
    if (builder.Environment.IsDevelopment())
    {
        // Dev convenience: generate an ephemeral key so `dotnet run` works with no setup.
        // Tokens won't survive a restart — acceptable locally, never in production.
        secretKey = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(48));
        Console.WriteLine("⚠️  JwtSettings:SecretKey not configured — using an ephemeral dev key. " +
                          "Set JWT_SECRET for stable sessions.");
    }
    else
    {
        throw new InvalidOperationException(
            "JwtSettings:SecretKey is missing or shorter than 32 bytes. " +
            "Set a strong secret via the JWT_SECRET env var (JwtSettings__SecretKey).");
    }
}

// Write the resolved key back so token generation (AuthService reads IConfiguration)
// and validation below share one source of truth — critical for the dev ephemeral key.
builder.Configuration["JwtSettings:SecretKey"] = secretKey;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!)),
        ClockSkew = TimeSpan.Zero,
        NameClaimType = ClaimTypes.Name, // ✅ This tells JWT where to find the name
        RoleClaimType = ClaimTypes.Role // ✅ This tells JWT where to find the role
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            context.Token = context.Request.Cookies["token"]; // ✅ Make sure this matches
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// CORS
var corsOrigin = builder.Configuration["CorsOrigin"] ?? "http://localhost:3000";
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(corsOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Rate limiting — throttle credential endpoints per client IP to blunt brute force.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));
});

var app = builder.Build();

// Auto-apply migrations on startup (creates DB on first run)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// Configure the HTTP request pipeline.
app.UseExceptionHandler(); // first: convert unhandled exceptions → logged ProblemDetails

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles(); // ADD THIS - Must be before UseRouting
app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication(); // ADD THIS - Must be before UseAuthorization
app.UseAuthorization();
app.MapControllers();
app.Run();