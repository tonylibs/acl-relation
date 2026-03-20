#!/bin/sh
set -e

FGA_API_URL="${FGA_API_URL:-http://openfga:8080}"
MODEL_FGA="${MODEL_FGA:-/config/model.fga}"
export FGA_API_URL

echo "Waiting for OpenFGA to be ready at ${FGA_API_URL}..."
until fga store list 2>/dev/null; do
  echo "  OpenFGA not ready yet, retrying in 3s..."
  sleep 3
done
echo "OpenFGA is ready."

echo "Creating store and writing model from ${MODEL_FGA}..."
fga store create --name acl-store --model "${MODEL_FGA}"

echo "Store created and authorization model written successfully."
