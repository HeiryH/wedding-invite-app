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
        public DbSet<Template> Templates { get; set; } = null!; // Table name: Templates
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Package> Packages { get; set; } = null!;
        public DbSet<PackageFeature> PackageFeatures { get; set; } = null!;
        public DbSet<WeddingTemplateConfig> TemplateConfigs { get; set; } = null!;
        public DbSet<Table> Tables { get; set; } = null!;
        public DbSet<ItineraryItem> ItineraryItems { get; set; } = null!;


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

                entity.HasOne(e => e.Template)
               .WithMany(t => t.Weddings)
               .HasForeignKey(e => e.TemplateId)
               .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Package)
               .WithMany(p => p.Weddings)
               .HasForeignKey(e => e.PackageId)
               .OnDelete(DeleteBehavior.SetNull);
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
                },
                new Feature
                {
                    FeatureId = 6,
                    FeatureCode = "SEATING",
                    FeatureName = "Seating Management",
                    Description = "Assign guests to tables and manage seating arrangements",
                    IsPremium = true,
                    IsActive = true,
                    SortOrder = 4,
                    CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            // Photo configuration
            modelBuilder.Entity<Photo>(entity =>
            {
                entity.HasKey(e => e.PhotoId);

                entity.Property(e => e.GuestName)
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

                entity.Property(e => e.RejectionReason)
                    .HasMaxLength(500);

                entity.Property(e => e.UploadedBy)
                    .IsRequired()
                    .HasMaxLength(20)
                    .HasDefaultValue("GUEST");

                entity.Property(e => e.TemplateSlot)
                    .IsRequired(false);

                // Relationships
                entity.HasOne(e => e.Wedding)
                    .WithMany(w => w.Photos)
                    .HasForeignKey(e => e.WeddingId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.ApprovedBy)
                    .WithMany()
                    .HasForeignKey(e => e.ApprovedByUserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Template configuration
            modelBuilder.Entity<Template>(entity =>
            {
                entity.HasKey(e => e.TemplateId);

                entity.Property(e => e.TemplateName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.TemplateCode)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.HasIndex(e => e.TemplateCode)
                    .IsUnique();

                entity.Property(e => e.Description)
                    .HasMaxLength(500);

                entity.Property(e => e.PrimaryColor)
                    .HasMaxLength(20);

                entity.Property(e => e.SecondaryColor)
                    .HasMaxLength(20);

                entity.Property(e => e.ComponentPath)
                    .IsRequired()
                    .HasMaxLength(100);
            });

            // Seed templates
            modelBuilder.Entity<Template>().HasData(
                new Template
                {
                    TemplateId = 1,
                    TemplateName = "Classic Rose",
                    TemplateCode = "classic-rose",
                    Description = "Elegant rose and pink design with top navigation",
                    PrimaryColor = "#f43f5e",
                    SecondaryColor = "#ec4899",
                    ComponentPath = "Template1",
                    IsActive = true,
                    IsPremium = false,
                    SortOrder = 1,
                    CreatedDate = DateTime.UtcNow
                },
                new Template
                {
                    TemplateId = 2,
                    TemplateName = "Golden Elegance",
                    TemplateCode = "golden-elegance",
                    Description = "Luxurious yellow and gold single-page design with floating navigation",
                    PrimaryColor = "#eab308",
                    SecondaryColor = "#f59e0b",
                    ComponentPath = "Template2",
                    IsActive = true,
                    IsPremium = true,
                    SortOrder = 2,
                    CreatedDate = DateTime.UtcNow
                },
                new Template
                {
                    TemplateId = 3,
                    TemplateName = "Garden Romance",
                    TemplateCode = "garden-romance",
                    Description = "Botanical green theme with couple portrait and extra image slots",
                    PrimaryColor = "#16a34a",
                    SecondaryColor = "#86efac",
                    ComponentPath = "Template3",
                    IsActive = true,
                    IsPremium = true,
                    SortOrder = 3,
                    CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Template
                {
                    TemplateId = 4,
                    TemplateName = "Minimal Noir",
                    TemplateCode = "minimal-noir",
                    Description = "Clean cream and black editorial design with torn-paper dividers, live countdown, and timeline schedule",
                    PrimaryColor = "#1C1C1A",
                    SecondaryColor = "#8A8A80",
                    ComponentPath = "Template4",
                    IsActive = true,
                    IsPremium = true,
                    SortOrder = 4,
                    CreatedDate = new DateTime(2026, 3, 27, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            modelBuilder.Entity<User>(entity =>
                {
                    entity.HasKey(e => e.UserId);

                    entity.Property(e => e.Email)
                        .IsRequired()
                        .HasMaxLength(200);

                    entity.HasIndex(e => e.Email)
                        .IsUnique();

                    entity.Property(e => e.PasswordHash)
                        .IsRequired();

                    entity.Property(e => e.Role)
                        .IsRequired()
                        .HasMaxLength(50);

                    entity.HasOne(e => e.Wedding)
                        .WithMany()
                        .HasForeignKey(e => e.WeddingId)
                        .OnDelete(DeleteBehavior.SetNull);
                }
            );

            // Package configuration
            modelBuilder.Entity<Package>(entity =>
            {
                entity.HasKey(e => e.PackageId);

                entity.Property(e => e.PackageName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.HasIndex(e => e.PackageName)
                    .IsUnique();

                entity.Property(e => e.PackageCode)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.HasIndex(e => e.PackageCode)
                    .IsUnique();

                entity.Property(e => e.Description)
                    .HasMaxLength(500);

                entity.Property(e => e.Price)
                    .HasColumnType("decimal(18,2)");
            });

            // PackageFeature configuration (junction table)
            modelBuilder.Entity<PackageFeature>(entity =>
            {
                entity.HasKey(e => e.PackageFeatureId);

                entity.HasIndex(e => new { e.PackageId, e.FeatureId })
                    .IsUnique();

                entity.HasOne(e => e.Package)
                    .WithMany(p => p.PackageFeatures)
                    .HasForeignKey(e => e.PackageId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Feature)
                    .WithMany()
                    .HasForeignKey(e => e.FeatureId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Seed default packages
            modelBuilder.Entity<Package>().HasData(
                new Package
                {
                    PackageId = 1,
                    PackageName = "Starter",
                    PackageCode = "STARTER",
                    Description = "Basic wedding invitation with RSVP and guestbook",
                    Price = 0,
                    IsActive = true,
                    SortOrder = 1,
                    CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Package
                {
                    PackageId = 2,
                    PackageName = "Premium",
                    PackageCode = "PREMIUM",
                    Description = "Full-featured wedding invitation with photo booth, RSVP, and guestbook",
                    Price = 99,
                    IsActive = true,
                    SortOrder = 2,
                    CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            // Seed package features: Starter = RSVP (4) + WISHES (5), Premium = all active features
            modelBuilder.Entity<PackageFeature>().HasData(
                // Starter package
                new PackageFeature { PackageFeatureId = 1, PackageId = 1, FeatureId = 4 }, // RSVP
                new PackageFeature { PackageFeatureId = 2, PackageId = 1, FeatureId = 5 }, // WISHES
                // Premium package
                new PackageFeature { PackageFeatureId = 3, PackageId = 2, FeatureId = 1 }, // PHOTO_BOOTH
                new PackageFeature { PackageFeatureId = 4, PackageId = 2, FeatureId = 4 }, // RSVP
                new PackageFeature { PackageFeatureId = 5, PackageId = 2, FeatureId = 5 }, // WISHES
                new PackageFeature { PackageFeatureId = 6, PackageId = 2, FeatureId = 6 }  // SEATING
            );

            // Table (seating) configuration
            modelBuilder.Entity<Table>(entity =>
            {
                entity.HasKey(e => e.TableId);

                entity.Property(e => e.TableName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.HasOne(e => e.Wedding)
                    .WithMany()
                    .HasForeignKey(e => e.WeddingId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Guest → Table FK (nullable, SET NULL when table is deleted)
            modelBuilder.Entity<Guest>(entity =>
            {
                entity.HasOne(e => e.Table)
                    .WithMany(t => t.Guests)
                    .HasForeignKey(e => e.TableId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // ItineraryItem configuration
            modelBuilder.Entity<ItineraryItem>(entity =>
            {
                entity.HasKey(e => e.ItineraryItemId);

                entity.Property(e => e.Label)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.Detail)
                    .HasMaxLength(500);

                entity.HasOne(e => e.Wedding)
                    .WithMany(w => w.ItineraryItems)
                    .HasForeignKey(e => e.WeddingId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // WeddingTemplateConfig configuration
            modelBuilder.Entity<WeddingTemplateConfig>(entity =>
            {
                entity.HasKey(e => e.WeddingTemplateConfigId);

                entity.Property(e => e.ConfigKey)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.ConfigValue)
                    .IsRequired()
                    .HasMaxLength(1000);

                entity.HasIndex(e => new { e.WeddingId, e.ConfigKey })
                    .IsUnique();

                entity.HasOne(e => e.Wedding)
                    .WithMany()
                    .HasForeignKey(e => e.WeddingId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Seed Super Admin
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    UserId = 1,
                    Email = "admin@wedding-cms.com",
                    // Password: "Admin123!" (you can change this)
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    Role = UserRoles.SuperAdmin,
                    WeddingId = null,
                    CreatedDate = DateTime.UtcNow
                }
            );
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.ConfigureWarnings(w =>
                w.Ignore(RelationalEventId.PendingModelChangesWarning));
        }

        public override int SaveChanges()
        {
            Database.ExecuteSqlRaw("PRAGMA foreign_keys = ON;");
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            await Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = ON;", cancellationToken);
            return await base.SaveChangesAsync(cancellationToken);
        }
    }

}