#!/usr/bin/env bash
#
# Downloads the Supabase self-hosted "volumes" assets that are not tracked in git.
# These files include Kong configuration, Vector logging config, and the SQL
# bootstrap scripts that the official docker-compose stack expects.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VOLUMES_DIR="${ROOT_DIR}/volumes"

SUPABASE_REF="${SUPABASE_REF:-master}"
BASE_URL="https://raw.githubusercontent.com/supabase/supabase/${SUPABASE_REF}/docker/volumes"

declare -a FILES=(
  "api/kong.yml"
  "db/_supabase.sql"
  "db/jwt.sql"
  "db/logs.sql"
  "db/pooler.sql"
  "db/realtime.sql"
  "db/roles.sql"
  "db/webhooks.sql"
  "logs/vector.yml"
  "pooler/pooler.exs"
)

echo "Downloading Supabase volume assets from ref '${SUPABASE_REF}'..."

for REL_PATH in "${FILES[@]}"; do
  DEST_PATH="${VOLUMES_DIR}/${REL_PATH}"
  URL="${BASE_URL}/${REL_PATH}"

  mkdir -p "$(dirname "${DEST_PATH}")"

  echo "  - ${REL_PATH}"
  curl --fail --silent --show-error --location "${URL}" --output "${DEST_PATH}"
done

echo "Done. Files saved under ${VOLUMES_DIR}."
echo "You can now run 'docker compose up' in supabase-docker/."
