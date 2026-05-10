#!/bin/bash
set -e

# Charger les variables depuis .env.deploy si le fichier existe
if [ -f .env.deploy ]; then
  export $(grep -v '^#' .env.deploy | xargs)
fi

# Vérification des variables requises
if [ -z "$NAS_USER" ] || [ -z "$NAS_HOST" ] || [ -z "$NAS_PORT" ] || [ -z "$NAS_DIR" ]; then
  echo "❌ Erreur : Variables NAS_USER, NAS_HOST, NAS_PORT ou NAS_DIR non définies."
  echo "Créez un fichier .env.deploy (voir .env.deploy.example) ou définissez-les dans votre environnement."
  exit 1
fi

NAS="$NAS_USER@$NAS_HOST"
DOCKER="/var/packages/ContainerManager/target/usr/bin/docker"

echo "==> Build du front React..."
npm run build

echo "==> Création de l'archive..."
tar --exclude=.git --exclude=node_modules \
  -czf /tmp/flip7scores.tar.gz -C .. flip7scores

echo "==> Envoi sur le NAS..."
scp -O -P $NAS_PORT /tmp/flip7scores.tar.gz $NAS:~/flip7scores.tar.gz

echo "==> Déploiement sur le NAS..."
ssh -p $NAS_PORT $NAS "
  cd ~ &&
  tar -xzf flip7scores.tar.gz &&
  mkdir -p $NAS_DIR &&
  cp -r flip7scores/* $NAS_DIR/ &&
  rm -rf flip7scores flip7scores.tar.gz &&
  cd $NAS_DIR &&
  $DOCKER compose up -d --build --no-deps app
"

rm /tmp/flip7scores.tar.gz
echo ""
echo "✅ Déploiement terminé → http://$NAS_HOST:8082"
