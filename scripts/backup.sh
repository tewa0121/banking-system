#!/bin/bash

# Database backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="../database/backups"
DB_NAME="banking_db"
DB_USER="root"
DB_PASSWORD="root"
DB_HOST="localhost"
DB_PORT="8889"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Create backup
mysqldump -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

echo "✅ Backup created: backup_$DATE.sql"