using System.IO.Compression;
using System.Text;
using System.Text.Json;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class EventExportService : IEventExportService
    {
        private readonly IEventRepository _eventRepo;
        private readonly IUserRepository _userRepo;
        private readonly ITemplateService _templateService;
        private readonly IGuestService _guestService;
        private readonly IWishService _wishService;
        private readonly ITableService _tableService;
        private readonly IItineraryService _itineraryService;
        private readonly ITemplateConfigService _templateConfigService;
        private readonly IPhotoRepository _photoRepo;

        private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

        public EventExportService(
            IEventRepository eventRepo,
            IUserRepository userRepo,
            ITemplateService templateService,
            IGuestService guestService,
            IWishService wishService,
            ITableService tableService,
            IItineraryService itineraryService,
            ITemplateConfigService templateConfigService,
            IPhotoRepository photoRepo)
        {
            _eventRepo = eventRepo;
            _userRepo = userRepo;
            _templateService = templateService;
            _guestService = guestService;
            _wishService = wishService;
            _tableService = tableService;
            _itineraryService = itineraryService;
            _templateConfigService = templateConfigService;
            _photoRepo = photoRepo;
        }

        public async Task<byte[]?> BuildExportZipAsync(int eventId)
        {
            var evt = await _eventRepo.GetByIdAsync(eventId);
            if (evt == null) return null;

            using var ms = new MemoryStream();
            using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, leaveOpen: true))
            {
                var template = await _templateService.GetByIdAsync(evt.TemplateId);
                var owner = await _userRepo.GetByEventIdAsync(eventId); // couple admin; PasswordHash excluded below

                await WriteJsonEntryAsync(zip, "wedding.json", new
                {
                    evt.EventId,
                    evt.Slug,
                    evt.EventType,
                    evt.Name1,
                    evt.Name2,
                    evt.EventTitle,
                    evt.EventDate,
                    evt.Venue,
                    evt.VenueAddress,
                    evt.IsActive,
                    evt.IsRsvpOpen,
                    evt.CreatedDate,
                    TemplateName = template?.TemplateName,
                    OwnerEmail = owner?.Email,
                    ExportedAt = DateTime.UtcNow,
                });

                var config = await _templateConfigService.GetConfigAsync(eventId);
                await WriteJsonEntryAsync(zip, "config.json", config);

                var guests = (await _guestService.GetByEventIdAsync(eventId, null, null)).ToList();
                WriteCsvEntry(zip, "guests.csv",
                    ["Name", "Email", "Phone", "Side", "Attending", "Number of Guests", "Song Request", "RSVP Date", "Table"],
                    guests.Select(g => new object?[]
                    {
                        g.GuestName, g.Email, g.PhoneNumber, g.GuestSide,
                        g.IsAttending ? "Yes" : "No", g.NumberOfAttendees, g.SongRequest,
                        g.RespondedDate, g.TableName,
                    }));

                var wishes = await _wishService.GetByEventIdAsync(eventId);
                WriteCsvEntry(zip, "wishes.csv",
                    ["Guest Name", "Message", "Date"],
                    wishes.Select(w => new object?[] { w.GuestName, w.Message, w.CreatedDate }));

                var itinerary = await _itineraryService.GetByEventIdAsync(eventId);
                WriteCsvEntry(zip, "itinerary.csv",
                    ["Order", "Label", "Detail"],
                    itinerary.OrderBy(i => i.SortOrder).Select(i => new object?[] { i.SortOrder, i.Label, i.Detail }));

                var tables = await _tableService.GetByEventIdAsync(eventId);
                WriteCsvEntry(zip, "seating.csv",
                    ["Table", "Capacity", "Guest", "Number of Guests"],
                    tables.OrderBy(t => t.SortOrder).SelectMany(t =>
                        t.Guests.Count > 0
                            ? t.Guests.Select(g => new object?[] { t.TableName, t.Capacity, g.GuestName, g.NumberOfAttendees })
                            : [[t.TableName, t.Capacity, "", ""]]));

                var photos = (await _photoRepo.GetAllByEventIdAsync(eventId)).ToList();
                var manifestRows = new List<object?[]>();
                foreach (var p in photos)
                {
                    var fileIncluded = false;
                    if (File.Exists(p.FilePath))
                    {
                        var sub = p.UploadedBy == PhotoUploaderRole.Couple ? "couple" : "guest";
                        var entry = zip.CreateEntry($"photos/{sub}/{p.FileName}", CompressionLevel.Optimal);
                        using var entryStream = entry.Open();
                        using var fileStream = File.OpenRead(p.FilePath);
                        await fileStream.CopyToAsync(entryStream);
                        fileIncluded = true;
                    }
                    manifestRows.Add(new object?[]
                    {
                        p.PhotoId, p.FileName, p.UploadedBy, p.GuestName, p.Caption,
                        p.TemplateSlot, p.IsApproved, p.CreatedDate, fileIncluded,
                    });
                }
                WriteCsvEntry(zip, "photos-manifest.csv",
                    ["PhotoId", "FileName", "UploadedBy", "GuestName", "Caption", "TemplateSlot", "IsApproved", "CreatedDate", "FileIncluded"],
                    manifestRows);

                if (config.TryGetValue("music.url", out var musicUrl) && !string.IsNullOrWhiteSpace(musicUrl))
                {
                    var audioPath = Path.Combine("wwwroot", musicUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                    if (File.Exists(audioPath))
                    {
                        var entry = zip.CreateEntry($"audio/{Path.GetFileName(audioPath)}", CompressionLevel.Optimal);
                        using var entryStream = entry.Open();
                        using var fileStream = File.OpenRead(audioPath);
                        await fileStream.CopyToAsync(entryStream);
                    }
                }
            }

            return ms.ToArray();
        }

        private static async Task WriteJsonEntryAsync(ZipArchive zip, string name, object value)
        {
            var entry = zip.CreateEntry(name, CompressionLevel.Optimal);
            using var entryStream = entry.Open();
            await JsonSerializer.SerializeAsync(entryStream, value, JsonOptions);
        }

        private static void WriteCsvEntry(ZipArchive zip, string name, string[] headers, IEnumerable<object?[]> rows)
        {
            var sb = new StringBuilder();
            sb.AppendLine(string.Join(",", headers.Select(CsvCell)));
            foreach (var row in rows)
                sb.AppendLine(string.Join(",", row.Select(CsvCell)));

            var entry = zip.CreateEntry(name, CompressionLevel.Optimal);
            using var entryStream = entry.Open();
            using var writer = new StreamWriter(entryStream, Encoding.UTF8);
            writer.Write(sb.ToString());
        }

        /// <summary>Quotes every cell and escapes embedded quotes ("" per RFC 4180) — guest-authored
        /// text (names, messages, song requests) can contain commas/quotes/newlines.</summary>
        private static string CsvCell(object? value)
        {
            var text = value switch
            {
                null => "",
                DateTime dt => dt.ToString("yyyy-MM-dd HH:mm:ss"),
                bool b => b ? "Yes" : "No",
                _ => value.ToString() ?? "",
            };
            return $"\"{text.Replace("\"", "\"\"")}\"";
        }
    }
}
