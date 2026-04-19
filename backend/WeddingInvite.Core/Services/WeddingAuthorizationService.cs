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
    public class WeddingAuthorizationService : IWeddingAuthorizationService
    {
        private readonly IUserRepository _userRepo;
        
        public WeddingAuthorizationService(IUserRepository userRepo)
        {
            _userRepo = userRepo;
        }
        
        public async Task<bool> CanAccessWeddingAsync(string userEmail, int weddingId)
        {
            Console.WriteLine($"[AUTH] Checking access for email: '{userEmail}' to wedding: {weddingId}");

            if (string.IsNullOrEmpty(userEmail))
                return false;

            var user = await _userRepo.GetByEmailAsync(userEmail);
            if (user == null)
                return false;

            // Super admins can access any wedding
            if (user.Role == UserRoles.SuperAdmin)
                return true;

            // Couple admins can only access their own wedding
            if (user.Role == UserRoles.CoupleAdmin)
                return user.WeddingId == weddingId;

            return false;
        }
        
        public async Task<bool> IsSuperAdminAsync(string userEmail)
        {
            if (string.IsNullOrEmpty(userEmail))
                return false;

            var user = await _userRepo.GetByEmailAsync(userEmail);
            return user?.Role == UserRoles.SuperAdmin;
        }
        
        public async Task<int?> GetUserWeddingIdAsync(string userEmail)
        {
            if (string.IsNullOrEmpty(userEmail))
                return null;

            var user = await _userRepo.GetByEmailAsync(userEmail);
            return user?.WeddingId;
        }
    }
}