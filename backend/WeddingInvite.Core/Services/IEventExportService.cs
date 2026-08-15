namespace WeddingInvite.Core.Services
{
    public interface IEventExportService
    {
        /// <summary>
        /// Builds a zip archive of everything belonging to an event — RSVPs, wishes, seating,
        /// itinerary, the full customization config, and every uploaded photo/audio file. Returns
        /// null when the event doesn't exist.
        /// </summary>
        Task<byte[]?> BuildExportZipAsync(int eventId);
    }
}
