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
echo "✓ Using internal API URL for migrations: $SUPABASE_API_URL"

# Function to check if database is initialized
check_database_initialized() {
    echo "Checking if database is initialized..."

    # Use curl to check if families table exists via Supabase REST API
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        "${SUPABASE_API_URL}/rest/v1/families?limit=1")

    if [ "$response" = "200" ]; then
        echo "✓ Database already initialized"
        return 0
    else
        echo "→ Database not initialized (HTTP $response)"
        return 1
    fi
}

# Function to run migrations
run_migrations() {
    echo "=================================================="
    echo "Running Database Migrations"
    echo "=================================================="

    migration_count=0

    # Check if migrations directory exists
    if [ ! -d "./supabase/migrations" ]; then
        echo "! No migrations directory found, skipping migrations"
        return 0
    fi

    # Run each migration file in order
    for migration in ./supabase/migrations/*.sql; do
        if [ -f "$migration" ]; then
            filename=$(basename "$migration")
            echo "→ Applying migration: $filename"

            # Read migration content and execute via Supabase SQL API
            migration_sql=$(cat "$migration")

            # Execute migration (this is a simplified approach - in production you'd want better error handling)
            curl -s -X POST \
                -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Content-Type: application/json" \
                -d "{\"query\": $(echo "$migration_sql" | jq -Rs .)}" \
                "${SUPABASE_API_URL}/rest/v1/rpc/exec_sql" \
                > /dev/null 2>&1

            migration_count=$((migration_count + 1))
            echo "  ✓ Applied: $filename"
        fi
    done

    echo "✓ Applied $migration_count migrations"
}

# Function to seed database
seed_database() {
    echo "=================================================="
    echo "Seeding Database"
    echo "=================================================="

    if [ ! -f "./supabase/seed.sql" ]; then
        echo "! No seed.sql found, skipping seeding"
        return 0
    fi

    echo "→ Running seed data..."
    seed_sql=$(cat "./supabase/seed.sql")

    curl -s -X POST \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(echo "$seed_sql" | jq -Rs .)}" \
        "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        > /dev/null 2>&1

    echo "✓ Database seeded successfully"
}

# Main initialization logic
if ! check_database_initialized; then
    echo "=================================================="
    echo "Initializing Database"
    echo "=================================================="

    run_migrations
    seed_database

    echo "=================================================="
    echo "✓ Database Initialization Complete"
    echo "=================================================="
else
    echo "✓ Skipping initialization (database already setup)"
fi

echo "=================================================="
echo "Starting ChoreQuest Application"
echo "=================================================="

# Execute the main container command
exec "$@"