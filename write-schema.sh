#!/bin/sh
set -e

OPENFGA_API_URL="${OPENFGA_API_URL:-http://openfga:8080}"
MODEL_JSON="${MODEL_JSON:-/config/model.json}"

echo "Waiting for OpenFGA to be ready at ${OPENFGA_API_URL}..."
until curl -sf "${OPENFGA_API_URL}/healthz" > /dev/null 2>&1; do
  echo "  OpenFGA not ready yet, retrying in 3s..."
  sleep 3
done
echo "OpenFGA is ready."

echo "Creating store..."
STORE_RESPONSE=$(curl -sf -X POST "${OPENFGA_API_URL}/stores" \
  -H "Content-Type: application/json" \
  -d '{"name": "acl-store"}')

STORE_ID=$(echo "${STORE_RESPONSE}" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "${STORE_ID}" ]; then
  echo "ERROR: Failed to create store. Response: ${STORE_RESPONSE}"
  exit 1
fi
echo "Store created: ${STORE_ID}"

echo "Writing authorization model from ${MODEL_JSON}..."
MODEL_RESPONSE=$(curl -sf -X POST "${OPENFGA_API_URL}/stores/${STORE_ID}/authorization-models" \
  -H "Content-Type: application/json" \
  -d @"${MODEL_JSON}")

MODEL_ID=$(echo "${MODEL_RESPONSE}" | grep -o '"authorization_model_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "${MODEL_ID}" ]; then
  echo "ERROR: Failed to write authorization model. Response: ${MODEL_RESPONSE}"
  exit 1
fi

echo "Authorization model written successfully."
echo "  Store ID: ${STORE_ID}"
echo "  Model ID: ${MODEL_ID}"
