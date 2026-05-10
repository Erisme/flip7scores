#!/bin/sh
# Démarre l'API Node.js en arrière-plan
node /app/api/index.js &
# Démarre nginx au premier plan
nginx -g 'daemon off;'
