#!/bin/bash

DB_USER="tabsir2"
DB_NAME="simplechat"
DB_HOST="localhost" 
DB_PORT="5432"
BACKUP_DIR="/home/tabsir/a_projects/react-projects/sociamedia/simple-chat-backend/devFiles"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")  # Format: YYYYMMDD_HHMMSS
BACKUP_FILE="backup_$TIMESTAMP.sql"



# Execute the pg_dump command to create the backup
pg_dump -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -f "$BACKUP_DIR/$BACKUP_FILE" "$DB_NAME"

# Optional: Notify the user
echo "Backup of $DB_NAME created at $BACKUP_FILE"
