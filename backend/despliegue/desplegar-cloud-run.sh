#!/usr/bin/env bash
# Despliega una imagen ya publicada en Artifact Registry en un servicio de Cloud Run (ADR-025, ADR-031).
# La nueva revision entra SIN trafico, se revisa /actuator/health y solo si responde se le pasa el trafico.
# Si falla, el trafico sigue en la revision anterior (vuelta atras automatica).
#
# Variables necesarias:
#   GCP_PROYECTO       id del proyecto de Google Cloud
#   GCP_REGION         region (us-east1)
#   GCP_INSTANCIA_SQL  nombre de la instancia de Cloud SQL (agrotrack-db)
#   ENTORNO            staging | prod
#   IMAGEN             imagen completa, por ejemplo us-east1-docker.pkg.dev/PROYECTO/agrotrack/backend:COMMIT
set -euo pipefail

: "${GCP_PROYECTO:?}" "${GCP_REGION:?}" "${GCP_INSTANCIA_SQL:?}" "${ENTORNO:?}" "${IMAGEN:?}"

SERVICIO="agrotrack-${ENTORNO}"
BASE_DATOS="agrotrack_${ENTORNO}"
CUENTA_BACKEND="agrotrack-backend@${GCP_PROYECTO}.iam.gserviceaccount.com"
URL_BD="jdbc:postgresql:///${BASE_DATOS}?cloudSqlInstance=${GCP_PROYECTO}:${GCP_REGION}:${GCP_INSTANCIA_SQL}&socketFactory=com.google.cloud.sql.postgres.SocketFactory"

# Secretos de Secret Manager entregados como variables de entorno (ADR-030)
SECRETOS="AGROTRACK_DB_CLAVE=${SERVICIO}-db-clave:latest,AGROTRACK_JWT_SECRETO=${SERVICIO}-jwt-secreto:latest"
# El secreto de origen solo existe cuando ya hay dominio con Cloudflare (ADR-027); sin el, el filtro no se exige
if gcloud secrets describe "${SERVICIO}-origen-secreto" --project="$GCP_PROYECTO" >/dev/null 2>&1; then
  SECRETOS="${SECRETOS},AGROTRACK_ORIGEN_SECRETO=${SERVICIO}-origen-secreto:latest"
fi

OPCIONES=(
  --project="$GCP_PROYECTO" --region="$GCP_REGION" --image="$IMAGEN"
  --service-account="$CUENTA_BACKEND"
  --set-env-vars="^@^SPRING_PROFILES_ACTIVE=prod@AGROTRACK_GCP_PROYECTO=${GCP_PROYECTO}@AGROTRACK_DB_USUARIO=${BASE_DATOS}@AGROTRACK_DB_URL=${URL_BD}"
  --set-secrets="$SECRETOS"
  --cpu=1 --memory=1Gi --min-instances=0 --max-instances=3
  --allow-unauthenticated
)

if gcloud run services describe "$SERVICIO" --project="$GCP_PROYECTO" --region="$GCP_REGION" >/dev/null 2>&1; then
  gcloud run deploy "$SERVICIO" "${OPCIONES[@]}" --no-traffic --tag=candidata
  URL=$(gcloud run services describe "$SERVICIO" --project="$GCP_PROYECTO" --region="$GCP_REGION" --format=json \
    | jq -r '.status.traffic[] | select(.tag == "candidata") | .url')
  PRIMERA_VEZ=no
else
  # Primer despliegue: Cloud Run no permite crear un servicio sin trafico
  gcloud run deploy "$SERVICIO" "${OPCIONES[@]}"
  URL=$(gcloud run services describe "$SERVICIO" --project="$GCP_PROYECTO" --region="$GCP_REGION" --format='value(status.url)')
  PRIMERA_VEZ=si
fi

echo "Revisando salud en ${URL}/actuator/health"
# El primer arranque de la JVM y las migraciones Flyway pueden tardar: se reintenta hasta ~2 minutos
if curl --fail --silent --show-error --retry 12 --retry-delay 10 --retry-all-errors --max-time 30 "${URL}/actuator/health"; then
  echo
  if [ "$PRIMERA_VEZ" = no ]; then
    gcloud run services update-traffic "$SERVICIO" --project="$GCP_PROYECTO" --region="$GCP_REGION" --to-latest
  fi
  echo "Desplegado: ${SERVICIO} con ${IMAGEN}"
else
  echo "La nueva revision no responde /actuator/health. El trafico sigue en la revision anterior." >&2
  exit 1
fi
