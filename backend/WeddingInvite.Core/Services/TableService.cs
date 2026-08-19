using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class TableService : ITableService
    {
        private readonly ITableRepository _tableRepo;
        private readonly IGuestRepository _guestRepo;
        private readonly IEventRepository _eventRepo;

        public TableService(
            ITableRepository tableRepo,
            IGuestRepository guestRepo,
            IEventRepository eventRepo)
        {
            _tableRepo = tableRepo;
            _guestRepo = guestRepo;
            _eventRepo = eventRepo;
        }

        public async Task<TableDto?> GetByIdAsync(int id)
        {
            var table = await _tableRepo.GetByIdAsync(id);
            return table == null ? null : MapToDto(table);
        }

        public async Task<IEnumerable<TableDto>> GetByEventIdAsync(int eventId)
        {
            var tables = await _tableRepo.GetByEventIdAsync(eventId);
            return tables.Select(MapToDto);
        }

        public async Task<TableDto> CreateAsync(CreateTableDto dto)
        {
            var evt = await _eventRepo.GetByIdAsync(dto.EventId);
            if (evt == null)
                throw new KeyNotFoundException($"Event with ID {dto.EventId} not found");

            if (string.IsNullOrWhiteSpace(dto.TableName))
                throw new ArgumentException("Table name is required");

            if (dto.Capacity < 1)
                throw new ArgumentException("Capacity must be at least 1");

            var table = new Table
            {
                EventId = dto.EventId,
                TableName = dto.TableName.Trim(),
                Capacity = dto.Capacity,
                SortOrder = dto.SortOrder,
            };

            var created = await _tableRepo.CreateAsync(table);
            return MapToDto(created);
        }

        public async Task<TableDto> UpdateAsync(int id, UpdateTableDto dto)
        {
            var table = await _tableRepo.GetByIdAsync(id);
            if (table == null)
                throw new KeyNotFoundException($"Table with ID {id} not found");

            if (string.IsNullOrWhiteSpace(dto.TableName))
                throw new ArgumentException("Table name is required");

            if (dto.Capacity < 1)
                throw new ArgumentException("Capacity must be at least 1");

            table.TableName = dto.TableName.Trim();
            table.Capacity = dto.Capacity;
            table.SortOrder = dto.SortOrder;

            var updated = await _tableRepo.UpdateAsync(table);
            return MapToDto(updated);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _tableRepo.DeleteAsync(id);
        }

        public async Task AssignGuestAsync(int tableId, int guestId)
        {
            var table = await _tableRepo.GetByIdAsync(tableId);
            if (table == null)
                throw new KeyNotFoundException($"Table with ID {tableId} not found");

            var guest = await _guestRepo.GetByIdAsync(guestId);
            if (guest == null)
                throw new KeyNotFoundException($"Guest with ID {guestId} not found");

            if (guest.EventId != table.EventId)
                throw new InvalidOperationException("Guest and table must belong to the same event");

            guest.TableId = tableId;
            await _guestRepo.UpdateAsync(guest);
        }

        public async Task UnassignGuestAsync(int guestId)
        {
            var guest = await _guestRepo.GetByIdAsync(guestId);
            if (guest == null)
                throw new KeyNotFoundException($"Guest with ID {guestId} not found");

            guest.TableId = null;
            await _guestRepo.UpdateAsync(guest);
        }

        private TableDto MapToDto(Table table)
        {
            return new TableDto
            {
                TableId = table.TableId,
                EventId = table.EventId,
                TableName = table.TableName,
                Capacity = table.Capacity,
                SortOrder = table.SortOrder,
                GuestCount = table.Guests.Where(g => g.IsAttending).Sum(g => g.NumberOfAttendees),
                Guests = table.Guests.Select(g => new TableGuestDto
                {
                    GuestId = g.GuestId,
                    GuestName = g.GuestName,
                    NumberOfAttendees = g.NumberOfAttendees,
                }).ToList(),
            };
        }
    }
}
