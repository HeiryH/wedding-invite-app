using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepo;
        private readonly IConfiguration _configuration;

        public AuthService(IUserRepository userRepo, IConfiguration configuration)
        {
            _userRepo = userRepo;
            _configuration = configuration;
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
            var token = GenerateJwtToken(user.Email, user.Role, user.WeddingId);

            return new LoginResponseDto
            {
                Token = token,
                Email = user.Email,
                Role = user.Role,
                WeddingId = user.WeddingId
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
                Role = UserRoles.CoupleAdmin,
                WeddingId = registerDto.WeddingId,
                CreatedDate = DateTime.UtcNow
            };

            var createdUser = await _userRepo.CreateAsync(user);

            // Generate JWT token
            var token = GenerateJwtToken(createdUser.Email, createdUser.Role, createdUser.WeddingId);

            return new LoginResponseDto
            {
                Token = token,
                Email = createdUser.Email,
                Role = createdUser.Role,
                WeddingId = createdUser.WeddingId
            };
        }

        public async Task<UserDto> CreateCoupleAdminForWeddingAsync(int weddingId, string email, string password)
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
                Role = UserRoles.CoupleAdmin,
                WeddingId = weddingId,
                CreatedDate = DateTime.UtcNow
            };

            var created = await _userRepo.CreateAsync(user);
            return MapToDto(created);
        }

        public async Task<UserDto?> GetCoupleAdminAsync(int weddingId)
        {
            var user = await _userRepo.GetByWeddingIdAsync(weddingId);
            return user == null ? null : MapToDto(user);
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

        public async Task ResetPasswordAsync(int userId, string newPassword)
        {
            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null)
                throw new KeyNotFoundException($"User {userId} not found");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _userRepo.UpdateAsync(user);
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
            WeddingId = user.WeddingId,
            IsActive = user.IsActive,
            CreatedDate = user.CreatedDate
        };

        public string GenerateJwtToken(string email, string role, int? weddingId)
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
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            // Add weddingId claim if exists
            if (weddingId.HasValue)
            {
                claims.Add(new Claim("WeddingId", weddingId.Value.ToString()));
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