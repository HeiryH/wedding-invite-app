using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class TableRepository : ITableRepository
    {
        private readonly AppDbContext _context;

        public TableRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Table?> GetByIdAsync(int id)
        {
            return await _context.Tables
                .Include(t => t.Guests)
                .FirstOrDefaultAsync(t => t.TableId == id);
        }

        public async Task<IEnumerable<Table>> GetByWeddingIdAsync(int weddingId)
        {
            return await _context.Tables
                .Include(t => t.Guests)
                .Where(t => t.WeddingId == weddingId)
                .OrderBy(t => t.SortOrder)
                .ThenBy(t => t.TableName)
                .ToListAsync();
        }

        public async Task<Table> CreateAsync(Table table)
        {
            _context.Tables.Add(table);
            await _context.SaveChangesAsync();
            return table;
        }

        public async Task<Table> UpdateAsync(Table table)
        {
            _context.Tables.Update(table);
            await _context.SaveChangesAsync();
            return table;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var table = await _context.Tables.FindAsync(id);
            if (table == null) return false;

            _context.Tables.Remove(table);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
