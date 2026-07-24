namespace WeddingInvite.Core.Services
{
    public interface IWeddingExportService
    {
        /// <summary>
        /// Builds a zip archive of everything belonging to a wedding — RSVPs, wishes, seating,
        /// itinerary, the full customization config, and every uploaded photo/audio file. Returns
        /// null when the wedding doesn't exist.
        /// </summary>
        Task<byte[]?> BuildExportZipAsync(int weddingId);
    }
}
