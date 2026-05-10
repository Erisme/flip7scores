# 🚀 Guide de Déploiement NAS Synology (Template)

Ce guide documente la procédure pour déployer et maintenir une application Docker sur un NAS Synology de manière sécurisée.

> **Note :** Remplacez les valeurs entre `{{ }}` par les informations spécifiques à votre projet actuel.

## 📋 Prérequis sur le NAS
1. **Container Manager** (Docker) installé.
2. **Accès SSH activé** (Panneau de configuration > Terminal & SNMP).
3. **Dossier de destination** : `/volume1/docker/{{SLUG_DU_PROJET}}`

---

## 🔐 1. Configuration de la Sécurité (Zéro Hardcoding)
Ne stockez jamais vos identifiants dans le code source.

### Configuration Locale (PC → NAS)
Créez un fichier `.env.deploy` (ignoré par Git) à la racine de votre projet :
```env
NAS_USER="votre_utilisateur"
NAS_HOST="votre_nas.synology.me"
NAS_PORT="52222"
NAS_DIR="/volume1/docker/{{SLUG_DU_PROJET}}"
```

### Configuration CI/CD (GitHub Actions)
Ajoutez ces **Secrets** dans `Settings > Secrets and variables > Actions` :
- `NAS_HOST` : Votre adresse DDNS.
- `NAS_USER` : Votre utilisateur SSH.
- `NAS_PORT` : Votre port SSH.
- `NAS_DEPLOY_PATH` : `/volume1/docker/{{SLUG_DU_PROJET}}`
- `SSH_PRIVATE_KEY` : Votre clé privée SSH.

---

## 🚀 2. Méthodes de Déploiement

### Option A : Déploiement via GitHub Actions
Le workflow `.github/workflows/deploy.yml` automatisera le build et la mise à jour sur le NAS à chaque push sur `main`.

### Option B : Déploiement via Script Local
Utilisez le script `deploy.sh` configuré pour charger `.env.deploy` :
```bash
./deploy.sh
```

---

## 🛠️ 3. Commandes Utiles (SSH)

### Vérifier l'état
```bash
cd {{NAS_DEPLOY_PATH}}
docker compose ps
```

### Consulter les logs
```bash
docker logs -f {{NOM_CONTAINER_APP}}
```

### Redémarrage complet
```bash
docker compose up -d --force-recreate
```

---

## 🌐 4. Accès & Réseau
- **Port local** : `{{PORT_PROJET}}` (défini dans `docker-compose.yml`).
- **URL Interne** : `http://IP_DU_NAS:{{PORT_PROJET}}`
- **URL Externe** : `https://{{NOM_DU_PROJET}}.{{VOTRE_DDNS}}.synology.me` (via Reverse Proxy).

---

## 💾 5. Persistance des données
Les données persistantes doivent être mappées dans des volumes Docker :
- Volume : `{{NOM_VOLUME_DATA}}`
- Emplacement physique : `/var/lib/docker/volumes/{{SLUG_DU_PROJET}}_{{NOM_VOLUME_DATA}}/_data/`
