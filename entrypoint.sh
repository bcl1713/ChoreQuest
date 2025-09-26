#!/bin/sh
# ChoreQuest Docker Container Entrypoint
# Handles automatic database initialization and application startup

set -e

echo "🏰 ChoreQuest Container Starting..."

# Function to wait for database to be ready
wait_for_db() {
    echo "📡 Waiting for database to be ready..."

    # Parse DATABASE_URL to extract connection details
    if [ -n "$DATABASE_URL" ]; then
        # Extract host and port from DATABASE_URL
        # Format: postgresql://user:password@host:port/database
        DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
        DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')

        if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ]; then
            echo "⚠️  Could not parse DATABASE_URL, using default postgres:5432"
            DB_HOST="postgres"
            DB_PORT="5432"
        fi

        # Wait for database to accept connections
        timeout=60
        counter=0

        while ! nc -z "$DB_HOST" "$DB_PORT"; do
            counter=$((counter + 1))
            if [ $counter -gt $timeout ]; then
                echo "❌ Database connection timeout after ${timeout}s"
                exit 1
            fi
            echo "⏳ Waiting for database $DB_HOST:$DB_PORT... (${counter}s)"
            sleep 1
        done

        echo "✅ Database is ready!"
    else
        echo "⚠️  DATABASE_URL not set, skipping database wait"
    fi
}

# Function to run database migrations
run_migrations() {
    echo "🗄️  Running database migrations..."

    if npx prisma migrate deploy; then
        echo "✅ Database migrations completed successfully"
    else
        echo "❌ Database migration failed"
        exit 1
    fi
}

# Function to seed database if empty
seed_database() {
    echo "🌱 Checking if database seeding is needed..."

    # Check if this is a fresh database by looking for users
    if echo "SELECT COUNT(*) FROM users LIMIT 1;" | npx prisma db execute --stdin 2>/dev/null | grep -q "0"; then
        echo "📋 Database appears empty, running seed..."

        if npm run db:seed; then
            echo "✅ Database seeded successfully"
        else
            echo "⚠️  Database seeding failed, continuing anyway..."
        fi
    else
        echo "📋 Database has existing data, skipping seed"
    fi
}

# Function to start the application
start_app() {
    echo "🚀 Starting ChoreQuest application..."
    echo "🌐 Application will be available on port 3000"
    exec "$@"
}

# Main initialization flow
main() {
    echo "🔧 Starting ChoreQuest initialization..."

    # Validate required environment variables
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL environment variable is required"
        exit 1
    fi

    if [ -z "$JWT_SECRET" ]; then
        echo "❌ JWT_SECRET environment variable is required"
        exit 1
    fi

    # Wait for database to be ready
    wait_for_db

    # Run database migrations
    run_migrations

    # Seed database if needed
    seed_database

    # Start the application with passed arguments
    start_app "$@"
}

# Execute main function with all arguments
main "$@"