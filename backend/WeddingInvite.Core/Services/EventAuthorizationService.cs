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
    public class EventAuthorizationService : IEventAuthorizationService
    {
        private readonly IUserRepository _userRepo;
        private readonly IEventRepository _eventRepo;
        private readonly ILogger<EventAuthorizationService> _logger;

        public EventAuthorizationService(
            IUserRepository userRepo,
            IEventRepository eventRepo,
            ILogger<EventAuthorizationService> logger)
        {
            _userRepo = userRepo;
            _eventRepo = eventRepo;
            _logger = logger;
        }

        public async Task<bool> CanAccessEventAsync(string userEmail, int eventId)
        {
            _logger.LogDebug("Checking event access for {EventId}", eventId);

            if (string.IsNullOrEmpty(userEmail))
                return false;

            var user = await _userRepo.GetByEmailAsync(userEmail);
            if (user == null)
                return false;

            if (user.Role == UserRoles.SuperAdmin)
                return true;

            if (user.Role == UserRoles.HostAdmin)
            {
                var evt = await _eventRepo.GetByIdAsync(eventId);
                return evt?.CreatedByUserId == user.UserId;
            }

            if (user.Role == UserRoles.OrganizerAdmin)
                return user.EventId == eventId;

            return false;
        }

        public async Task<bool> IsSuperAdminAsync(string userEmail)
        {
            if (string.IsNullOrEmpty(userEmail))
                return false;

            var user = await _userRepo.GetByEmailAsync(userEmail);
            return user?.Role == UserRoles.SuperAdmin;
        }

        public async Task<int?> GetUserEventIdAsync(string userEmail)
        {
            if (string.IsNullOrEmpty(userEmail))
                return null;

            var user = await _userRepo.GetByEmailAsync(userEmail);
            return user?.EventId;
        }
    }
}
