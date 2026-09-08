using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using WeddingInvite.Core.Constants;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Utilities;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepo;
        private readonly IConfiguration _configuration;
        private readonly IPasswordResetTokenRepository _resetTokenRepo;
        private readonly IEmailService _emailService;
        private readonly IEventRepository _eventRepo;
        private readonly IPackageRepository _packageRepo;
        private readonly IEventFeatureRepository _eventFeatureRepo;

        public AuthService(
            IUserRepository userRepo,
            IConfiguration configuration,
            IPasswordResetTokenRepository resetTokenRepo,
            IEmailService emailService,
            IEventRepository eventRepo,
            IPackageRepository packageRepo,
            IEventFeatureRepository eventFeatureRepo)
        {
            _userRepo = userRepo;
            _configuration = configuration;
            _resetTokenRepo = resetTokenRepo;
            _emailService = emailService;
            _eventRepo = eventRepo;
            _packageRepo = packageRepo;
            _eventFeatureRepo = eventFeatureRepo;
        }

        public async Task<LoginResponseDto> LoginAsync(LoginDto loginDto)
        {
            // Find user by email
            var user = await _userRepo.GetByEmailAsync(loginDto.Email);
            if (user == null)
                throw new UnauthorizedAccessException("Invalid email or password");

            // Verify password
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash);
            if (!isPasswordValid)
                throw new UnauthorizedAccessException("Invalid email or password");

            // Check account is active
            if (!user.IsActive)
                throw new UnauthorizedAccessException("Account is disabled. Please contact your administrator.");

            // Generate JWT token
            var token = GenerateJwtToken(user.Email, user.Role, user.EventId, user.Tier);

            return new LoginResponseDto
            {
                Token = token,
                Email = user.Email,
                Role = user.Role,
                EventId = user.EventId,
                Tier = user.Tier
            };
        }

        public async Task<LoginResponseDto> RegisterCoupleAsync(RegisterCoupleDto registerDto)
        {
            // Check if email already exists
            var existingUser = await _userRepo.GetByEmailAsync(registerDto.Email);
            if (existingUser != null)
                throw new ArgumentException("Email already registered");

            // Hash password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

            // Create user
            var user = new User
            {
                Email = registerDto.Email,
                PasswordHash = passwordHash,
                Role = UserRoles.OrganizerAdmin,
                EventId = registerDto.EventId,
                CreatedDate = DateTime.UtcNow
            };

            var createdUser = await _userRepo.CreateAsync(user);

            // Generate JWT token
            var token = GenerateJwtToken(createdUser.Email, createdUser.Role, createdUser.EventId, createdUser.Tier);

            return new LoginResponseDto
            {
                Token = token,
                Email = createdUser.Email,
                Role = createdUser.Role,
                EventId = createdUser.EventId,
                Tier = createdUser.Tier
            };
        }

        public async Task<UserDto> CreateOrganizerAdminForEventAsync(int eventId, string email, string password)
        {
            // Check if email already exists
            var existingUser = await _userRepo.GetByEmailAsync(email);
            if (existingUser != null)
                throw new ArgumentException("Email already registered");

            // Hash password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

            // Create user
            var user = new User
            {
                Email = email,
                PasswordHash = passwordHash,
                Role = UserRoles.OrganizerAdmin,
                EventId = eventId,
                CreatedDate = DateTime.UtcNow
            };

            var created = await _userRepo.CreateAsync(user);
            return MapToDto(created);
        }

        public async Task<UserDto?> GetOrganizerAdminAsync(int eventId)
        {
            var user = await _userRepo.GetByEventIdAsync(eventId);
            return user == null ? null : MapToDto(user);
        }

        public async Task<UserDto> CreateHostAdminAsync(string email, string password)
        {
            var existing = await _userRepo.GetByEmailAsync(email);
            if (existing != null)
                throw new ArgumentException("Email already registered");

            var user = new User
            {
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                Role = UserRoles.HostAdmin,
                EventId = null,
                CreatedDate = DateTime.UtcNow
            };

            var created = await _userRepo.CreateAsync(user);
            return MapToDto(created);
        }

        public async Task<IEnumerable<UserDto>> GetAllHostAdminsAsync()
        {
            var users = await _userRepo.GetAllByRoleAsync(UserRoles.HostAdmin);
            return users.Select(MapToDto);
        }

        public async Task<UserDto> SetActiveAsync(int userId, bool isActive)
        {
            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null)
                throw new KeyNotFoundException($"User {userId} not found");

            user.IsActive = isActive;
            var updated = await _userRepo.UpdateAsync(user);
            return MapToDto(updated);
        }

        public async Task<UserDto> SetTierAsync(int userId, string tier)
        {
            var valid = new[] { "BASIC", "PREMIUM", "PRO" };
            if (!valid.Contains(tier.ToUpper()))
                throw new ArgumentException($"Invalid tier '{tier}'. Must be BASIC, PREMIUM, or PRO.");

            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null)
                throw new KeyNotFoundException($"User {userId} not found");

            user.Tier = tier.ToUpper();
            var updated = await _userRepo.UpdateAsync(user);

            if (updated.EventId.HasValue)
            {
                // Upgrading to a paid tier publishes the (previously private) free-tier event
                // so the couple can share it and collect real RSVPs.
                if (TierEntitlements.Rank(updated.Tier) >= TierEntitlements.Rank(TierEntitlements.Premium))
                {
                    var evt = await _eventRepo.GetByIdAsync(updated.EventId.Value);
                    if (evt != null && !evt.IsPublic)
                    {
                        evt.IsPublic = true;
                        await _eventRepo.UpdateAsync(evt);
                    }
                }

                // The Access tab's tier picker used to only change User.Tier — the wedding's own
                // EventFeature toggles never moved, so a couple upgraded to PRO still had every
                // PRO feature off until someone remembered to flip each one on the Features tab —
                // and, in the other direction, a downgrade left everything the old tier had
                // unlocked switched on forever. Turning tier up now turns on everything newly
                // included; turning it down revokes anything no longer included, even if it was
                // on. A feature within the *new* tier that the couple had already turned off stays
                // off — only the entitlement ceiling is enforced, not their own choices under it.
                await TierFeatureSync.SyncEnabledFeaturesAsync(updated.EventId.Value, updated.Tier, _packageRepo, _eventFeatureRepo);
            }

            return MapToDto(updated);
        }

        public async Task ResetPasswordAsync(int userId, string newPassword)
        {
            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null)
                throw new KeyNotFoundException($"User {userId} not found");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _userRepo.UpdateAsync(user);
        }

        public async Task RequestPasswordResetAsync(string email, string resetLinkBase)
        {
            var user = await _userRepo.GetByEmailAsync(email);
            // Silently no-op for unknown emails so we don't leak which addresses have accounts.
            if (user == null || !user.IsActive) return;

            // Raw token goes in the email link; only its hash is persisted.
            var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
                .Replace('+', '-').Replace('/', '_').TrimEnd('=');

            await _resetTokenRepo.InvalidateAllForUserAsync(user.UserId);
            await _resetTokenRepo.CreateAsync(new PasswordResetToken
            {
                UserId = user.UserId,
                TokenHash = HashToken(rawToken),
                ExpiresAt = DateTime.UtcNow.AddHours(1),
            });

            var link = $"{resetLinkBase}?token={Uri.EscapeDataString(rawToken)}";
            var html = $@"<p>We received a request to reset your ODDSTUDIO password.</p>
<p><a href=""{link}"">Reset your password</a> — this link expires in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>";
            await _emailService.SendAsync(user.Email, "Reset your ODDSTUDIO password", html);
        }

        public async Task ResetPasswordWithTokenAsync(string token, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 6)
                throw new ArgumentException("Password must be at least 6 characters.");

            var reset = await _resetTokenRepo.GetActiveByHashAsync(HashToken(token));
            if (reset == null)
                throw new UnauthorizedAccessException("This reset link is invalid or has expired.");

            reset.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _userRepo.UpdateAsync(reset.User);
            await _resetTokenRepo.MarkUsedAsync(reset);
            await _resetTokenRepo.InvalidateAllForUserAsync(reset.UserId);
        }

        private static string HashToken(string rawToken)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
            return Convert.ToHexString(bytes);
        }

        public async Task DeleteUserAsync(int userId)
        {
            var deleted = await _userRepo.DeleteAsync(userId);
            if (!deleted)
                throw new KeyNotFoundException($"User {userId} not found");
        }

        private static UserDto MapToDto(User user) => new UserDto
        {
            UserId = user.UserId,
            Email = user.Email,
            Role = user.Role,
            EventId = user.EventId,
            IsActive = user.IsActive,
            Tier = user.Tier,
            CreatedDate = user.CreatedDate
        };

        public string GenerateJwtToken(string email, string role, int? eventId, string tier = "BASIC")
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];
            var expiryMinutes = int.Parse(jwtSettings["ExpiryMinutes"] ?? "60");

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.Name, email), // ✅ ADD THIS - This is what User.Identity.Name reads
                new Claim("Tier", string.IsNullOrWhiteSpace(tier) ? "BASIC" : tier),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            // Add eventId claim if exists
            if (eventId.HasValue)
            {
                claims.Add(new Claim("WeddingId", eventId.Value.ToString()));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}