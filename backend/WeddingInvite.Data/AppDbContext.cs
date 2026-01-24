using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace WeddingInvite.Data
{
    // DbContext = Your connection to the database
    // Think of it as a "database session"
    public class AppDbContext : DbContext
    {
        // Constructor - receives configuration from Program.cs
        public AppDbContext(DbContextOptions<AppDbContext> options) 
            : base(options)
        {
        }
        
        // DbSet = A table in your database
        // You can query these like: _context.Weddings.Where(...)
        public DbSet<Wedding> Weddings { get; set; } = null!;
        public DbSet<Guest> Guests { get; set; } = null!;
        public DbSet<Wish> Wishes { get; set; } = null!;

        public DbSet<Feature> Features { get; set; } = null!;
        public DbSet<WeddingFeature> WeddingFeatures { get; set; } = null!;
        public DbSet<Photo> Photos { get; set; } = null!;
        
        // Configure database schema
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Wedding configuration
            modelBuilder.Entity<Wedding>(entity =>
            {
                entity.HasKey(e => e.WeddingId); // Primary key
                
                entity.Property(e => e.CoupleName)
                    .IsRequired() // Cannot be null
                    .HasMaxLength(100); // Max 100 characters
                
                entity.HasIndex(e => e.CoupleName)
                    .IsUnique(); // No two weddings can have same couple name
                
                entity.Property(e => e.BrideName)
                    .IsRequired()
                    .HasMaxLength(100);
                
                entity.Property(e => e.GroomName)
                    .IsRequired()
                    .HasMaxLength(100);
                
                entity.Property(e => e.Venue)
                    .HasMaxLength(200);
                
                entity.Property(e => e.VenueAddress)
                    .HasMaxLength(500);
            });
            
            // Guest configuration
            modelBuilder.Entity<Guest>(entity =>
            {
                entity.HasKey(e => e.GuestId);
                
                entity.Property(e => e.GuestName)
                    .IsRequired()
                    .HasMaxLength(100);
                
                entity.Property(e => e.Email)
                    .HasMaxLength(200);
                
                entity.Property(e => e.BrideOrGroomSide)
                    .HasMaxLength(20);
                
                entity.Property(e => e.SongRequest)
                    .HasMaxLength(200);
                
                // Define relationship: Guest belongs to Wedding
                entity.HasOne(e => e.Wedding)
                    .WithMany(w => w.Guests)
                    .HasForeignKey(e => e.WeddingId)
                    .OnDelete(DeleteBehavior.Cascade); // Delete guests if wedding deleted
            });
            
            // Wish configuration
            modelBuilder.Entity<Wish>(entity =>
            {
                entity.HasKey(e => e.WishId);
                
                entity.Property(e => e.GuestName)
                    .IsRequired()
                    .HasMaxLength(100);
                
                entity.Property(e => e.Message)
                    .IsRequired()
                    .HasMaxLength(1000);
                
                // Define relationship
                entity.HasOne(e => e.Wedding)
                    .WithMany(w => w.Wishes)
                    .HasForeignKey(e => e.WeddingId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

             // Feature configuration
            modelBuilder.Entity<Feature>(entity =>
            {
                entity.HasKey(e => e.FeatureId);
                
                entity.Property(e => e.FeatureCode)
                    .IsRequired()
                    .HasMaxLength(50);
                
                entity.HasIndex(e => e.FeatureCode)
                    .IsUnique();
                
                entity.Property(e => e.FeatureName)
                    .IsRequired()
                    .HasMaxLength(100);
                
                entity.Property(e => e.Description)
                    .HasMaxLength(500);
            });
            
            // WeddingFeature configuration
            modelBuilder.Entity<WeddingFeature>(entity =>
            {
                entity.HasKey(e => e.WeddingFeatureId);
                
                // Composite unique index (one feature per wedding)
                entity.HasIndex(e => new { e.WeddingId, e.FeatureId })
                    .IsUnique();
                
                // Relationships
                entity.HasOne(e => e.Wedding)
                    .WithMany(w => w.WeddingFeatures)
                    .HasForeignKey(e => e.WeddingId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.Feature)
                    .WithMany(f => f.WeddingFeatures)
                    .HasForeignKey(e => e.FeatureId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            
            // Photo configuration
            modelBuilder.Entity<Photo>(entity =>
            {
                entity.HasKey(e => e.PhotoId);
                
                entity.Property(e => e.GuestName)
                    .IsRequired()
                    .HasMaxLength(100);
                
                entity.Property(e => e.FileName)
                    .IsRequired()
                    .HasMaxLength(255);
                
                entity.Property(e => e.FilePath)
                    .IsRequired()
                    .HasMaxLength(500);
                
                entity.Property(e => e.ContentType)
                    .HasMaxLength(50);
                
                entity.Property(e => e.Caption)
                    .HasMaxLength(500);
                
                // Relationship
                entity.HasOne(e => e.Wedding)
                    .WithMany(w => w.Photos)
                    .HasForeignKey(e => e.WeddingId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Seed initial features
            modelBuilder.Entity<Feature>().HasData(
                new Feature
                {
                    FeatureId = 1,
                    FeatureCode = "PHOTO_BOOTH",
                    FeatureName = "Photo Booth",
                    Description = "Allow guests to upload and share photos from the wedding",
                    IsPremium = true,
                    IsActive = true,
                    SortOrder = 1,
                    CreatedDate = DateTime.UtcNow
                },
                new Feature
                {
                    FeatureId = 2,
                    FeatureCode = "E_GIFTS",
                    FeatureName = "E-Gifts Registry",
                    Description = "Online gift registry with payment links",
                    IsPremium = true,
                    IsActive = false, // Not implemented yet
                    SortOrder = 2,
                    CreatedDate = DateTime.UtcNow
                },
                new Feature
                {
                    FeatureId = 3,
                    FeatureCode = "CUSTOM_DOMAIN",
                    FeatureName = "Custom Domain",
                    Description = "Use your own domain name (e.g., johnandmary.wedding)",
                    IsPremium = true,
                    IsActive = false, // Not implemented yet
                    SortOrder = 3,
                    CreatedDate = DateTime.UtcNow
                },
                new Feature
                {
                    FeatureId = 4,
                    FeatureCode = "RSVP",
                    FeatureName = "RSVP Management",
                    Description = "Guest RSVP and attendance tracking",
                    IsPremium = false, // Free feature
                    IsActive = true,
                    SortOrder = 0,
                    CreatedDate = DateTime.UtcNow
                },
                new Feature
                {
                    FeatureId = 5,
                    FeatureCode = "WISHES",
                    FeatureName = "Wishes & Guestbook",
                    Description = "Guests can leave wishes and messages",
                    IsPremium = false, // Free feature
                    IsActive = true,
                    SortOrder = 0,
                    CreatedDate = DateTime.UtcNow
                }
            );
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.ConfigureWarnings(w =>
                w.Ignore(RelationalEventId.PendingModelChangesWarning));
        }
    }
}