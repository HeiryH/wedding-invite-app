using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class WeddingAuthorizationService : IWeddingAuthorizationService
    {
        private readonly IUserRepository _userRepo;
        private readonly IWeddingRepository _weddingRepo;
        private readonly ILogger<WeddingAuthorizationService> _logger;

        public WeddingAuthorizationService(
            IUserRepository userRepo,
            IWeddingRepository weddingRepo,
            ILogger<WeddingAuthorizationService> logger)
        {
            _userRepo = userRepo;
            _weddingRepo = weddingRepo;
            _logger = logger;
        }

        public async Task<bool> CanAccessWeddingAsync(string userEmail, int weddingId)
        {
            _logger.LogDebug("Checking wedding access for {WeddingId}", weddingId);

            if (string.IsNullOrEmpty(userEmail))
                return false;

            var user = await _userRepo.GetByEmailAsync(userEmail);
            if (user == null)
                return false;

            if (user.Role == UserRoles.SuperAdmin)
                return true;

            if (user.Role == UserRoles.HostAdmin)
            {
                var wedding = await _weddingRepo.GetByIdAsync(weddingId);
                return wedding?.CreatedByUserId == user.UserId;
            }

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
