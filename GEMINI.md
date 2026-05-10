# Mandats de Sécurité et Développement

Ce fichier contient les règles fondamentales pour ce projet. Tout agent IA intervenant sur ce repo DOIT s'y conformer strictement.

## 🛡️ Sécurité des Données (Zéro Hardcoding)
- **Interdiction stricte** de coder en dur : adresses IP, domaines privés (ex: `.synology.me`), noms d'utilisateurs, ports SSH, ou clés secrètes.
- **Gestion des Environnements** :
  - Utiliser `.env` pour le runtime (API/App).
  - Utiliser `.env.deploy` pour les scripts de déploiement.
  - Toujours fournir un fichier `.env.example` ou `.env.deploy.example` avec des valeurs factices.
- **Validation Git** : Toujours vérifier que les fichiers `.env*` sont listés dans `.gitignore` avant toute création.

## 🚀 Méthodologie de Déploiement
- **Scripts Génériques** : Les scripts comme `deploy.sh` doivent charger leurs variables depuis un fichier local non commité.
- **GitHub Actions** : Utiliser exclusivement les `secrets.*` pour les déploiements CI/CD.
- **Audit Proactif** : Avant chaque commit ou déploiement, l'IA doit vérifier l'absence de fuites avec :
  `grep -rE "([0-9]{1,3}\.){3}[0-9]{1,3}|(host|user|pass|secret|key|port|nas|token)" .`

## 🛠️ Workflow de Nettoyage
Si une donnée sensible est détectée dans l'historique :
1. Extraire la donnée vers un fichier `.env`.
2. Remplacer par une variable dans le code.
3. Purger l'historique Git via une branche orpheline ou un outil de nettoyage de repo (BFG).

---
*Note : La sécurité du NAS et des accès privés est la priorité absolue du projet.*
