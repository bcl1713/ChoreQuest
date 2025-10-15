# Supabase Self-Hosted Docker Setup

This directory contains the official Supabase self-hosting setup for running Supabase in Docker containers.

## Quick Start

### 1. Configure Environment

```bash
cp .env.example .env
```

**IMPORTANT**: Edit `.env` and update the following:

1. **For Development/Testing**: The default keys in `.env.example` work together and can be used as-is for local testing.

2. **For Production**: You MUST generate your own secure keys:
   - Generate a new `JWT_SECRET` (40+ random characters)
   - Generate matching `ANON_KEY` and `SERVICE_ROLE_KEY` using that JWT secret
   - See [Supabase API Keys Generator](https://supabase.com/docs/guides/self-hosting/docker) for tools
   - Change `POSTGRES_PASSWORD`, `DASHBOARD_PASSWORD`, and other secrets

⚠️ **Why all three keys?** The `JWT_SECRET` is used to sign the `ANON_KEY` and `SERVICE_ROLE_KEY` tokens. If you change the JWT secret, you must regenerate the other keys or they won't work!

### 2. Start Supabase

```bash
docker compose up -d
```

Wait 30-60 seconds for all services to start and become healthy.

### 3. Verify Services

```bash
docker compose ps
```

All services should show as "healthy" or "running".

### 4. Access Supabase Studio

Open your browser to: `http://<your-host-or-ip>:8000`

**Default credentials:**
- Username: `supabase`
- Password: `this_password_is_insecure_and_should_be_updated`

⚠️ **IMPORTANT**:
- Change these credentials in production.
- Replace every `localhost` entry in `.env` (e.g. `SITE_URL`, `API_EXTERNAL_URL`, `SUPABASE_PUBLIC_URL`, `ADDITIONAL_REDIRECT_URLS`) with the host or IP that other devices will use, such as `http://192.168.x.x`.

## Getting API Credentials

Once Supabase Studio is running, you can find your API credentials:

1. Open Supabase Studio: `http://<your-host-or-ip>:8000`
2. Log in with default credentials
3. Go to **Project Settings** → **API**
4. Copy the following:
   - **API URL**: `http://<your-host-or-ip>:8000`
   - **anon/public key**: Starts with `eyJh...` (this is a JWT token)
   - **service_role key**: Also starts with `eyJh...` (this is a JWT token)

⚠️ **Important**: Use the "anon key" or "service_role key", NOT the "publishable key". The correct keys are JWT tokens (3 parts separated by dots, starting with `eyJ`).

## Using These Credentials with ChoreQuest

After Supabase is running and you have your credentials:

1. Go back to the ChoreQuest project root directory
2. Create `.env.production` from the template:
   ```bash
   cd ..
   cp .env.production.example .env.production
   ```
3. Edit `.env.production` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://<your-host-or-ip>:8000
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-studio>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-from-studio>
   ```
4. Build and deploy ChoreQuest (see main README.md)

## Service Endpoints

With default configuration:

- **Supabase Studio**: http://localhost:8000
- **Database**: localhost:5432 (PostgreSQL)
- **API Gateway**: http://localhost:8000
- **REST API**: http://localhost:8000/rest/v1/
- **Auth API**: http://localhost:8000/auth/v1/
- **Storage API**: http://localhost:8000/storage/v1/
- **Realtime**: http://localhost:8000/realtime/v1/

## Security Checklist (Production)

Before using in production, you MUST:

- [ ] **Generate new JWT_SECRET** (40+ characters) and matching ANON_KEY/SERVICE_ROLE_KEY
- [ ] Change default Studio username and password (`DASHBOARD_USERNAME`, `DASHBOARD_PASSWORD`)
- [ ] Change database password (`POSTGRES_PASSWORD`)
- [ ] Update all other secret keys (`SECRET_KEY_BASE`, `VAULT_ENC_KEY`)
- [ ] Configure SSL/TLS certificates for HTTPS
- [ ] Set up regular database backups
- [ ] Configure proper SMTP settings for email (if using email auth)
- [ ] Restrict network access to necessary ports only
- [ ] Keep Docker images updated regularly

⚠️ **Never use the default keys from `.env.example` in production!** They are publicly known and insecure.

## Stopping Supabase

```bash
docker compose down
```

To remove all data volumes (⚠️ THIS DELETES ALL DATA):

```bash
docker compose down -v
```

## Updating Supabase

```bash
docker compose pull
docker compose up -d
```

## Troubleshooting

### Services won't start

Check logs:
```bash
docker compose logs -f
```

### Can't connect to Supabase Studio

1. Verify all services are healthy: `docker compose ps`
2. Check Kong gateway logs: `docker compose logs kong`
3. Ensure port 8000 is not in use by another application

### Database connection errors

1. Check database logs: `docker compose logs db`
2. Verify database is healthy: `docker compose ps db`
3. Wait a bit longer - database initialization can take time

## Resources

- [Supabase Self-Hosting Documentation](https://supabase.com/docs/guides/self-hosting)
- [Supabase Docker Setup](https://supabase.com/docs/guides/self-hosting/docker)
