using Microsoft.EntityFrameworkCore;
using WeddingInvite.Core.Services;
using WeddingInvite.Data;
using WeddingInvite.Data.Repositories;

var builder = WebApplication.CreateBuilder(args);

// ========== ADD SERVICES TO CONTAINER ==========

// Add Controllers
builder.Services.AddControllers();

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// ========== EXISTING REPOSITORIES ==========
builder.Services.AddScoped<IWeddingRepository, WeddingRepository>();
builder.Services.AddScoped<IGuestRepository, GuestRepository>();
builder.Services.AddScoped<IWishRepository, WishRepository>();

// ========== NEW REPOSITORIES (ADD THESE) ==========
builder.Services.AddScoped<IFeatureRepository, FeatureRepository>();
builder.Services.AddScoped<IWeddingFeatureRepository, WeddingFeatureRepository>();
builder.Services.AddScoped<IPhotoRepository, PhotoRepository>();

// ========== EXISTING SERVICES ==========
builder.Services.AddScoped<IWeddingService, WeddingService>();
builder.Services.AddScoped<IGuestService, GuestService>();
builder.Services.AddScoped<IWishService, WishService>();

// ========== NEW SERVICES (ADD THESE) ==========
builder.Services.AddScoped<IFeatureService, FeatureService>();
builder.Services.AddScoped<IWeddingFeatureService, WeddingFeatureService>();
builder.Services.AddScoped<IPhotoService, PhotoService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJS", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ========== BUILD THE APP ==========
var app = builder.Build();

// ========== CONFIGURE HTTP REQUEST PIPELINE ==========

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Serve static files (for photo uploads)
app.UseStaticFiles(); // ADD THIS LINE

app.UseCors("AllowNextJS");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();