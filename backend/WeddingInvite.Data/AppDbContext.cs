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
        // You can query these like: _context.Events.Where(...)
        public DbSet<Event> Events { get; set; } = null!;
        public DbSet<Guest> Guests { get; set; } = null!;
        public DbSet<Wish> Wishes { get; set; } = null!;
        public DbSet<Feature> Features { get; set; } = null!;
        public DbSet<EventFeature> EventFeatures { get; set; } = null!;
        public DbSet<Photo> Photos { get; set; } = null!;
        public DbSet<Template> Templates { get; set; } = null!; // Table name: Templates
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Package> Packages { get; set; } = null!;
        public DbSet<PackageFeature> PackageFeatures { get; set; } = null!;
        public DbSet<EventTemplateConfig> TemplateConfigs { get; set; } = null!;
        public DbSet<TemplateConfigDefault> TemplateConfigDefaults { get; set; } = null!;
        public DbSet<Table> Tables { get; set; } = null!;
        public DbSet<ItineraryItem> ItineraryItems { get; set; } = null!;
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; } = null!;
        public DbSet<LandingContentItem> LandingContent { get; set; } = null!;
        public DbSet<LandingSection> LandingSections { get; set; } = null!;
        public DbSet<LandingItem> LandingItems { get; set; } = null!;


        // Configure database schema
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Event configuration
            modelBuilder.Entity<Event>(entity =>
            {
                entity.HasKey(e => e.EventId); // Primary key

                entity.Property(e => e.Slug)
                    .IsRequired() // Cannot be null
                    .HasMaxLength(100); // Max 100 characters

                entity.HasIndex(e => e.Slug)
                    .IsUnique(); // No two events can have same slug

                entity.Property(e => e.Domain)
                    .HasMaxLength(253); // max DNS hostname length

                // Custom domains must be globally unique, but many events have none (null).
                entity.HasIndex(e => e.Domain)
                    .IsUnique()
                    .HasFilter("[Domain] IS NOT NULL");

                entity.Property(e => e.EventType)
                    .IsRequired()
                    .HasMaxLength(20)
                    .HasDefaultValue("WEDDING");

                entity.Property(e => e.Name1)
                    .HasMaxLength(100);

                entity.Property(e => e.Name2)
                    .HasMaxLength(100);

                entity.Property(e => e.EventTitle)
                    .HasMaxLength(200);

                entity.Property(e => e.Venue)
                    .HasMaxLength(200);

                entity.Property(e => e.VenueAddress)
                    .HasMaxLength(500);

                entity.HasOne(e => e.Template)
               .WithMany(t => t.Events)
               .HasForeignKey(e => e.TemplateId)
               .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.CreatedBy)
               .WithMany()
               .HasForeignKey(e => e.CreatedByUserId)
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

                entity.Property(e => e.GuestSide)
                    .HasMaxLength(20);

                entity.Property(e => e.SongRequest)
                    .HasMaxLength(200);

                // Define relationship: Guest belongs to Event
                entity.HasOne(e => e.Event)
                    .WithMany(ev => ev.Guests)
                    .HasForeignKey(e => e.EventId)
                    .OnDelete(DeleteBehavior.Cascade); // Delete guests if event deleted
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
                entity.HasOne(e => e.Event)
                    .WithMany(ev => ev.Wishes)
                    .HasForeignKey(e => e.EventId)
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

            // EventFeature configuration
            modelBuilder.Entity<EventFeature>(entity =>
            {
                entity.HasKey(e => e.EventFeatureId);

                // Composite unique index (one feature per event)
                entity.HasIndex(e => new { e.EventId, e.FeatureId })
                    .IsUnique();

                // Relationships
                entity.HasOne(e => e.Event)
                    .WithMany(ev => ev.EventFeatures)
                    .HasForeignKey(e => e.EventId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Feature)
                    .WithMany(f => f.EventFeatures)
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
                    IsActive = true,
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
                entity.HasOne(e => e.Event)
                    .WithMany(ev => ev.Photos)
                    .HasForeignKey(e => e.EventId)
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

                entity.Property(e => e.EventTypes)
                    .IsRequired()
                    .HasMaxLength(100)
                    .HasDefaultValue("WEDDING");
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
                    Tier = "BASIC",
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
                    Tier = "PREMIUM",
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
                    Tier = "PREMIUM",
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
                    Tier = "PREMIUM",
                    SortOrder = 4,
                    CreatedDate = new DateTime(2026, 3, 27, 0, 0, 0, DateTimeKind.Utc)
                },
                new Template
                {
                    TemplateId = 6,
                    TemplateName = "Fairy Garden",
                    TemplateCode = "fairy-garden",
                    Description = "Enchanted fairy garden with glowing 3D fireflies, falling petals, and immersive forest scenes",
                    PrimaryColor = "#f7c6d7",
                    SecondaryColor = "#a8d5a2",
                    ComponentPath = "Template6",
                    IsActive = true,
                    IsPremium = true,
                    Tier = "PREMIUM",
                    SortOrder = 6,
                    CreatedDate = new DateTime(2026, 5, 19, 0, 0, 0, DateTimeKind.Utc)
                },
                new Template
                {
                    TemplateId = 7,
                    TemplateName = "Roman Garden",
                    TemplateCode = "roman-garden",
                    Description = "Sepia line-engraved Roman garden with parallax scenes, a sideways-panning ceremony colonnade, and an expanding RSVP seating chart",
                    PrimaryColor = "#3D3833",
                    SecondaryColor = "#C9BFAE",
                    ComponentPath = "Template7",
                    IsActive = true,
                    IsPremium = true,
                    Tier = "PRO",
                    SortOrder = 7,
                    CreatedDate = new DateTime(2026, 7, 13, 0, 0, 0, DateTimeKind.Utc)
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

                    entity.HasOne(e => e.Event)
                        .WithMany()
                        .HasForeignKey(e => e.EventId)
                        .OnDelete(DeleteBehavior.SetNull);
                }
            );

            // Password reset token configuration
            modelBuilder.Entity<PasswordResetToken>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TokenHash).IsRequired().HasMaxLength(128);
                entity.HasIndex(e => e.TokenHash);
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

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

            // Packages ARE the tier definitions (BASIC / PREMIUM / PRO) — see TierEntitlements and
            // IPackageRepository.TierIncludesFeatureAsync. Exactly these 3 rows; PackageService
            // rejects creating/deleting any others. Edited at /super-admin/packages.
            modelBuilder.Entity<Package>().HasData(
                new Package
                {
                    PackageId = 1,
                    PackageName = "Basic",
                    PackageCode = "BASIC",
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
                },
                // Deliberately NOT PackageId 3: real deployments (this one included) can already
                // have super-admin-created packages occupying ids right after the original 2-row
                // seed (e.g. an ad-hoc "TEST" package at id 3) — a HasData seed with a colliding
                // explicit key throws a UNIQUE-constraint error and crashes the app on migrate.
                // 1000+ is a deliberately wide gap past anything auto-increment could plausibly
                // reach from manual package creation.
                new Package
                {
                    PackageId = 1000,
                    PackageName = "Pro",
                    PackageCode = "PRO",
                    Description = "Everything in Premium, plus your own custom domain",
                    Price = 199,
                    IsActive = true,
                    SortOrder = 3,
                    CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            // Seed package features: FREE = RSVP+WISHES, PREMIUM = + PHOTO_BOOTH+SEATING,
            // PRO = + CUSTOM_DOMAIN. Explicit membership per tier (no rank cascading), matching
            // how this table already worked before PRO existed.
            modelBuilder.Entity<PackageFeature>().HasData(
                // Free package
                new PackageFeature { PackageFeatureId = 1, PackageId = 1, FeatureId = 4 }, // RSVP
                new PackageFeature { PackageFeatureId = 2, PackageId = 1, FeatureId = 5 }, // WISHES
                // Premium package
                new PackageFeature { PackageFeatureId = 3, PackageId = 2, FeatureId = 1 }, // PHOTO_BOOTH
                new PackageFeature { PackageFeatureId = 4, PackageId = 2, FeatureId = 4 }, // RSVP
                new PackageFeature { PackageFeatureId = 5, PackageId = 2, FeatureId = 5 }, // WISHES
                new PackageFeature { PackageFeatureId = 6, PackageId = 2, FeatureId = 6 }, // SEATING
                // Pro package — same wide-gap reasoning as PackageId 1000 above, since a wedding
                // could equally already have manually-added PackageFeature rows past id 6.
                new PackageFeature { PackageFeatureId = 1000, PackageId = 1000, FeatureId = 1 }, // PHOTO_BOOTH
                new PackageFeature { PackageFeatureId = 1001, PackageId = 1000, FeatureId = 3 }, // CUSTOM_DOMAIN
                new PackageFeature { PackageFeatureId = 1002, PackageId = 1000, FeatureId = 4 }, // RSVP
                new PackageFeature { PackageFeatureId = 1003, PackageId = 1000, FeatureId = 5 }, // WISHES
                new PackageFeature { PackageFeatureId = 1004, PackageId = 1000, FeatureId = 6 }  // SEATING
            );

            // Table (seating) configuration
            modelBuilder.Entity<Table>(entity =>
            {
                entity.HasKey(e => e.TableId);

                entity.Property(e => e.TableName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.HasOne(e => e.Event)
                    .WithMany()
                    .HasForeignKey(e => e.EventId)
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

                entity.HasOne(e => e.Event)
                    .WithMany(ev => ev.ItineraryItems)
                    .HasForeignKey(e => e.EventId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // EventTemplateConfig configuration
            modelBuilder.Entity<EventTemplateConfig>(entity =>
            {
                entity.HasKey(e => e.EventTemplateConfigId);

                entity.Property(e => e.ConfigKey)
                    .IsRequired()
                    .HasMaxLength(100);

                // 4000 so a serialized stage layout blob (t7.layout.*) fits. No migration accompanies
                // this: SQLite stores every string column as TEXT regardless of length, so the store
                // model is unchanged. It's enforced by TemplateConfigPolicy.Validate, and the cap will
                // start mattering at the DB level if we move to Postgres.
                entity.Property(e => e.ConfigValue)
                    .IsRequired()
                    .HasMaxLength(4000);

                entity.HasIndex(e => new { e.EventId, e.ConfigKey })
                    .IsUnique();

                entity.HasOne(e => e.Event)
                    .WithMany()
                    .HasForeignKey(e => e.EventId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // TemplateConfigDefault configuration — the per-template "starting design" bag.
            // Same shape/constraints as EventTemplateConfig, keyed by TemplateId instead.
            modelBuilder.Entity<TemplateConfigDefault>(entity =>
            {
                entity.HasKey(e => e.TemplateConfigDefaultId);

                entity.Property(e => e.ConfigKey)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.ConfigValue)
                    .IsRequired()
                    .HasMaxLength(4000);

                entity.HasIndex(e => new { e.TemplateId, e.ConfigKey })
                    .IsUnique();

                entity.HasOne(e => e.Template)
                    .WithMany()
                    .HasForeignKey(e => e.TemplateId)
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
                    EventId = null,
                    Tier = "BASIC",
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
