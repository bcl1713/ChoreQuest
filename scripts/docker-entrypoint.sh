#!/bin/sh
# ChoreQuest Docker Entrypoint Script
# Handles automatic database initialization and migrations on container startup

set -e

echo "=================================================="
echo "ChoreQuest Container Starting"
echo "=================================================="

# Check if Supabase environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "ERROR: Required Supabase environment variables not set!"
    echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured."
    exit 1
fi

echo "✓ Supabase configuration detected: $NEXT_PUBLIC_SUPABASE_URL"

# Use internal URL for server-side API calls if available
SUPABASE_API_URL="${SUPABASE_INTERNAL_URL:-$NEXT_PUBLIC_SUPABASE_URL}"
echo "✓ Using internal API URL: $SUPABASE_API_URL"

# Extract database connection details from environment
DB_HOST="${DB_HOST:-supabase-db}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"
# DB_PASSWORD should be set via environment variable

# Function to ensure migrations tracking table exists
ensure_migrations_table() {
    echo "→ Ensuring migrations tracking table exists..."

    PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<-EOSQL 2>/dev/null
        CREATE SCHEMA IF NOT EXISTS supabase_migrations;
        CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
            version TEXT PRIMARY KEY,
            name TEXT,
            applied_at TIMESTAMPTZ DEFAULT NOW()
        );
EOSQL

    if [ $? -eq 0 ]; then
        echo "  ✓ Migrations tracking table ready"
        return 0
    else
        echo "  ! Could not access database, skipping migrations"
        return 1
    fi
}

# Function to check if a migration has been applied
migration_applied() {
    local version="$1"

    result=$(PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM supabase_migrations.schema_migrations WHERE version = '$version';" 2>/dev/null | tr -d '[:space:]')

    [ "$result" = "1" ]
}

# Function to mark migration as applied
mark_migration_applied() {
    local version="$1"
    local name="$2"

    PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
        "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('$version', '$name') ON CONFLICT (version) DO NOTHING;" >/dev/null 2>&1
}

# Function to run migrations using psql
run_migrations() {
    echo "=================================================="
    echo "Running Database Migrations"
    echo "=================================================="

    migration_count=0
    skipped_count=0

    # Check if migrations directory exists
    if [ ! -d "./supabase/migrations" ]; then
        echo "! No migrations directory found, skipping migrations"
        return 0
    fi

    # Ensure migrations tracking table exists
    if ! ensure_migrations_table; then
        echo "! Unable to connect to database, skipping migrations"
        return 0
    fi

    # Run each migration file in order
    for migration in $(ls -1 ./supabase/migrations/*.sql | sort); do
        if [ -f "$migration" ]; then
            filename=$(basename "$migration")
            # Extract version (timestamp or number prefix) from filename
            version=$(echo "$filename" | sed 's/^\([0-9_]*\).*/\1/')

            # Check if migration has already been applied
            if migration_applied "$version"; then
                skipped_count=$((skipped_count + 1))
                continue
            fi

            echo "→ Applying migration: $filename"

            # Execute migration directly with psql
            if PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration" 2>&1 | grep -v "NOTICE:"; then
                # Mark as applied
                mark_migration_applied "$version" "$filename"
                migration_count=$((migration_count + 1))
                echo "  ✓ Applied: $filename"
            else
                echo "  ✗ Failed: $filename"
                return 1
            fi
        fi
    done

    if [ $migration_count -eq 0 ]; then
        echo "✓ All migrations up to date (checked $skipped_count migrations)"
    else
        echo "✓ Applied $migration_count new migrations (skipped $skipped_count already applied)"
    fi
}

# Function to seed database using psql
seed_database() {
    echo "=================================================="
    echo "Seeding Database"
    echo "=================================================="

    if [ ! -f "./supabase/seed.sql" ]; then
        echo "! No seed.sql found, skipping seeding"
        return 0
    fi

    echo "→ Running seed data..."

    # Execute seed SQL directly with psql
    if PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "./supabase/seed.sql"; then
        echo "✓ Database seeded successfully"
    else
        echo "✗ Database seeding failed"
        return 1
    fi
}

# Main initialization logic
echo "=================================================="
echo "Database Setup"
echo "=================================================="

# Always check and run pending migrations
run_migrations

# Only seed if ENABLE_DB_BOOTSTRAP is explicitly enabled
BOOTSTRAP_ENABLED="${ENABLE_DB_BOOTSTRAP:-false}"
if [ "$BOOTSTRAP_ENABLED" = "true" ]; then
    echo "→ Database bootstrap enabled, checking for seed..."
    seed_database
else
    echo "→ Skipping seed (ENABLE_DB_BOOTSTRAP not set)"
fi

echo "=================================================="
echo "Starting ChoreQuest Application"
echo "=================================================="

# Execute the main container command
exec "$@"
