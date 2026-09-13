## Déploiement NAS Synology

- Hébergé sur le NAS Synology via Docker — variante **`single`**
- Déploiement local : `./deploy.sh` | CI/CD : GitHub Actions sur push `main`
- Processus complet pour tout assistant IA : skill `nas-deploy` → https://github.com/Erisme/nas-deploy-templates/blob/main/skills/nas-deploy/SKILL.md (installé localement dans `~/.agents/skills/nas-deploy/`)

### Source canonique de déploiement (OBLIGATOIRE)

Tous les fichiers de déploiement suivent le variant `single` du repo :
**https://github.com/Erisme/nas-deploy-templates**

| Fichier projet | Template de référence |
|---|---|
| `Dockerfile` | `templates/single/Dockerfile` |
| `docker-compose.yml` | `templates/single/docker-compose.yml` |
| `.github/workflows/deploy.yml` | `templates/single/github-workflow.yml` |
| `deploy.sh` | `templates/single/deploy.sh` |
| `.env.deploy.example` | `templates/common/.env.deploy.example` |
| `.gitignore` | `templates/common/.gitignore` |
| `nginx.conf` | `templates/single/nginx.conf` |
| `start.sh` | `templates/single/start.sh` |

### Règles pour tout assistant IA (Claude, Codex, Gemini, Cursor…) intervenant sur ce projet

1. Lire `SKILL.md` (lien ci-dessus) avant toute action de déploiement ; ne pas redemander le processus.
2. Avant de modifier un fichier de déploiement, consulter le template correspondant.
3. Vérifier la dérive : `~/.agents/skills/nas-deploy/scripts/check-template-drift.sh --variant single --slug flip7scores --port 8082 --container flip7scores-app --volume flip7-data`
4. Ne jamais diverger du template sans raison explicite liée au projet (la documenter ici).
5. Placeholders résolus pour ce projet :
   - `SLUG` = `flip7scores`
   - `IMAGE_NAME` = `erisme/flip7scores-app`
   - `CONTAINER_NAME` = `flip7scores-app`
   - `APP_PORT` = `8082`
   - `VOLUME_NAME` = `flip7-data`
6. Secrets GitHub : `NAS_HOST`, `NAS_USER`, `NAS_PORT`, `SSH_PRIVATE_KEY`, `ALLOWED_ORIGIN` (ou `AUTH_SECRET` en nextjs). Variable GitHub : `NAS_DIR=/volume1/docker/flip7scores`.
