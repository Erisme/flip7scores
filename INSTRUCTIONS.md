# Universal AI Instructions & Skills

This document defines the specialized "Skills" and "Rules" for any LLM (Gemini, Claude, GPT, etc.) working on this repository.

## 🎯 Global Rules
1. **Context Priority**: Always read `GEMINI.md` and `NAS_DEPLOYMENT.md` upon initialization.
2. **Security Sandbox**: No hardcoding of private network details (NAS IPs, `.synology.me` domains).
3. **Tool Preference**: Use `grep` to audit for leaks before proposing any code modification.

## ⚡ Specialized Skills

### Skill: [SecureDeployment]
**Description**: Safely deploy the application to the Synology NAS.
**Workflow**:
1. Check for the existence of `.env.deploy`.
2. Verify that `deploy.sh` is generic (uses variables).
3. Execute `./deploy.sh` and monitor the output for errors.
4. Confirm successful deployment via logs if possible.

### Skill: [HistoryPurge]
**Description**: Clean sensitive data from Git history.
**Workflow**:
1. Move sensitive values to `.env`.
2. Replace values in code with `process.env` or variables.
3. Create an orphan branch: `git checkout --orphan temp_branch`.
4. Commit all files: `git add -A && git commit -m "chore: security hardening"`.
5. Reset main: `git branch -D main && git branch -m main`.
6. **Warning**: Prompt the user to `git push -f origin main`.

### Skill: [EnvironmentConfig]
**Description**: Manage project variables without leaks.
**Workflow**:
1. Never modify `.env` files directly if they contain secrets.
2. Update `.env.example` or `.env.deploy.example` whenever a new variable is needed.
3. Remind the user to update their local (ignored) `.env` files.

## 📁 Directory Structure & Roles
- `/src`: Frontend React (TypeScript).
- `/server`: Backend Node.js (API for NAS data sync).
- `/deploy.sh`: Local deployment script.
- `docker-compose.yml`: Container orchestration (App + API).
