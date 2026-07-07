#!/usr/bin/env bash
#
# Safe, consistent SQLite backup with rotation.
#
# Uses `sqlite3 .backup` (not a raw file copy) so the snapshot is consistent even
# while the app is writing. Keeps the last N daily backups and prunes the rest.
#
# Usage:
#   ./backup-db.sh                    # uses defaults below
#   DB_PATH=/opt/wedding-app/data/db/wedding.db BACKUP_DIR=/opt/wedding-app/backups ./backup-db.sh
#
# Cron (daily at 03:00), on the VPS:
#   0 3 * * * DB_PATH=/opt/wedding-app/data/db/wedding.db BACKUP_DIR=/opt/wedding-app/backups /opt/wedding-app/scripts/backup-db.sh >> /var/log/wedding-backup.log 2>&1
#
set -euo pipefail

DB_PATH="${DB_PATH:-backend/WeddingInvite.API/wedding.db}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
RETENTION="${RETENTION:-14}"   # how many backups to keep

if [ ! -f "$DB_PATH" ]; then
  echo "ERROR: database not found at $DB_PATH" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
timestamp="$(date +%Y%m%d-%H%M%S)"
dest="$BACKUP_DIR/wedding-$timestamp.db"

# Consistent online backup, then gzip.
sqlite3 "$DB_PATH" ".backup '$dest'"
gzip -f "$dest"
echo "Backup written: ${dest}.gz"

# Prune: keep the newest $RETENTION, delete older.
ls -1t "$BACKUP_DIR"/wedding-*.db.gz 2>/dev/null | tail -n +"$((RETENTION + 1))" | while read -r old; do
  rm -f "$old"
  echo "Pruned old backup: $old"
done
