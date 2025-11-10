# Deployment Guide - Hetzner Ubuntu Server

This guide walks you through deploying the Hacktogone 2025 Python applications (carbon-data-rag, scoring-api, and eleven_agent_acceuil) on a Hetzner Ubuntu server using Docker and Caddy.

## Prerequisites

- **Hetzner Server**: Fresh Ubuntu instance (4GB RAM, 2 vCPUs recommended)
- **Domain Names**: Three subdomains configured with DNS A records pointing to your server IP
  - `rag.yourdomain.com` - Carbon Data RAG API
  - `scoring.yourdomain.com` - Scoring API (Streamlit)
  - `accueil.yourdomain.com` - Accueil Agent (future)
- **ChromaDB Data**: Local ChromaDB database from `carbon-data-rag/data/chroma_db/` (~43MB)

## Table of Contents

1. [Initial Server Setup](#1-initial-server-setup)
2. [Install Docker & Docker Compose](#2-install-docker--docker-compose)
3. [Clone Repository](#3-clone-repository)
4. [Transfer ChromaDB Data](#4-transfer-chromadb-data)
5. [Configure Environment](#5-configure-environment)
6. [Configure Domains](#6-configure-domains)
7. [Deploy Services](#7-deploy-services)
8. [Verify Deployment](#8-verify-deployment)
9. [Maintenance & Operations](#9-maintenance--operations)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Initial Server Setup

### Connect to Your Server

```bash
ssh root@YOUR_SERVER_IP
```

### Update System

```bash
apt update && apt upgrade -y
```

### Create Non-Root User (Recommended)

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 2. Install Docker & Docker Compose

### Install Docker

```bash
# Install required packages
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

---

## 3. Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone repository (replace with your repo URL)
git clone https://github.com/yourusername/hacktogone2025.git
cd hacktogone2025
```

---

## 4. Transfer ChromaDB Data

You need to transfer your local ChromaDB data to the server. Choose one of the methods below:

### Method 1: Using SCP (from your local machine)

```bash
# From your local machine (not the server)
cd /path/to/local/hacktogone2025

# Create tarball of ChromaDB data
tar czf chromadb_backup.tar.gz -C carbon-data-rag/data chroma_db

# Transfer to server
scp chromadb_backup.tar.gz deploy@YOUR_SERVER_IP:~/
```

Then on the server:

```bash
# Extract to temporary location
mkdir -p ~/chromadb_temp
tar xzf ~/chromadb_backup.tar.gz -C ~/chromadb_temp

# We'll mount this into Docker later
```

### Method 2: Using rsync (from your local machine)

```bash
# From your local machine
rsync -avz carbon-data-rag/data/chroma_db/ deploy@YOUR_SERVER_IP:~/chromadb_temp/
```

### Method 3: Regenerate on Server (if data not available)

If you don't have the ChromaDB data, you can regenerate it on the server (~30 min):

```bash
# Transfer DEFRA Excel file
scp carbon-data-rag/data/defra_2024.xlsx deploy@YOUR_SERVER_IP:~/hacktogone2025/carbon-data-rag/data/

# On the server
cd ~/hacktogone2025/carbon-data-rag
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python src/ingest.py
```

---

## 5. Configure Environment

### Create Environment File

```bash
cd ~/hacktogone2025

# Copy template
cp .env.example .env

# Edit environment variables
nano .env
```

Add your API keys:

```bash
ELEVENLABS_API_KEY=your_actual_api_key_here
```

---

## 6. Configure Domains

### Update Caddyfile

Edit the Caddyfile to use your actual domain names:

```bash
nano Caddyfile
```

Replace `yourdomain.com` with your actual domain:

```caddy
# Example:
rag.example.com {
    reverse_proxy carbon-rag:8000
    # ...
}

scoring.example.com {
    reverse_proxy scoring-api:8501
    # ...
}
```

### Configure DNS

In your domain registrar or DNS provider, add these A records:

```
rag.yourdomain.com       A    YOUR_SERVER_IP
scoring.yourdomain.com   A    YOUR_SERVER_IP
accueil.yourdomain.com   A    YOUR_SERVER_IP
```

Wait a few minutes for DNS propagation (check with `dig rag.yourdomain.com`).

---

## 7. Deploy Services

### Option A: Using deploy.sh Script (Recommended)

```bash
# Make script executable
chmod +x deploy.sh

# Start services
./deploy.sh start
```

### Option B: Manual Docker Compose

```bash
# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### Mount ChromaDB Data

Before first deployment, you need to populate the ChromaDB volume:

```bash
# Create and populate the volume
docker volume create hacktogone2025_chromadb-data

# Copy data from temp directory to volume
docker run --rm -v hacktogone2025_chromadb-data:/data -v ~/chromadb_temp:/backup alpine sh -c "cp -r /backup/* /data/"

# Verify
docker run --rm -v hacktogone2025_chromadb-data:/data alpine ls -la /data
```

Now start services:

```bash
./deploy.sh start
```

---

## 8. Verify Deployment

### Check Service Status

```bash
./deploy.sh status
# or
docker-compose ps
```

All services should show "Up" status.

### Test Endpoints

#### Carbon RAG API

```bash
# Local
curl http://localhost:8000/

# Public (after DNS propagation)
curl https://rag.yourdomain.com/
curl https://rag.yourdomain.com/stats
```

#### Scoring API

Visit in browser:
- Local: http://localhost:8501
- Public: https://scoring.yourdomain.com

#### API Documentation

- Local: http://localhost:8000/docs
- Public: https://rag.yourdomain.com/docs

### Check Logs

```bash
# All services
./deploy.sh logs

# Specific service
docker-compose logs -f carbon-rag
docker-compose logs -f scoring-api
docker-compose logs -f caddy
```

### Verify SSL Certificates

```bash
# Check Caddy certificates
docker exec caddy caddy list-certificates

# Test HTTPS
curl -I https://rag.yourdomain.com
```

---

## 9. Maintenance & Operations

### View Logs

```bash
./deploy.sh logs
```

### Restart Services

```bash
./deploy.sh restart
```

### Stop Services

```bash
./deploy.sh stop
```

### Update Code

```bash
cd ~/hacktogone2025
git pull origin main
./deploy.sh restart
```

### Backup ChromaDB Data

```bash
# Create backup
./deploy.sh backup

# Backups stored in ./backups/ directory
ls -lh ./backups/
```

### Restore ChromaDB Data

```bash
./deploy.sh restore ./backups/chromadb_backup_YYYYMMDD_HHMMSS.tar.gz
```

### Monitor Resources

```bash
# Docker stats
docker stats

# Disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

---

## 10. Troubleshooting

### Services Not Starting

```bash
# Check logs
docker-compose logs

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Port Conflicts

```bash
# Check what's using ports
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :8000
sudo lsof -i :8501

# Stop conflicting services
sudo systemctl stop nginx  # if nginx is installed
```

### SSL Certificate Issues

```bash
# Check Caddy logs
docker-compose logs caddy

# Common issues:
# - DNS not propagated yet (wait 5-10 minutes)
# - Firewall blocking ports 80/443
# - Domain not pointing to correct IP
```

### ChromaDB Data Not Found

```bash
# Verify volume exists
docker volume ls | grep chromadb

# Inspect volume
docker run --rm -v hacktogone2025_chromadb-data:/data alpine ls -la /data

# If empty, restore from backup or re-transfer data
```

### Out of Memory

```bash
# Check memory usage
free -h
docker stats

# Restart services to free memory
./deploy.sh restart
```

### Cannot Access from Browser

1. Check firewall: `sudo ufw status`
2. Verify DNS: `dig rag.yourdomain.com`
3. Test locally first: `curl http://localhost:8000`
4. Check Caddy logs: `docker-compose logs caddy`

---

## Service Architecture

```
┌─────────────────────────────────────────────────┐
│                  Internet                        │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │  Caddy (443)  │  Auto-SSL, Reverse Proxy
            └───────┬───────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │ RAG    │ │Scoring │ │Accueil │
    │ :8000  │ │ :8501  │ │ :8002  │
    └────┬───┘ └────────┘ └────────┘
         │
         ▼
    ┌────────────┐
    │  ChromaDB  │  Persistent Volume
    │   Volume   │
    └────────────┘
```

---

## Environment Specifications

- **Server**: Ubuntu 22.04 LTS (Hetzner)
- **RAM**: 4GB minimum
- **CPU**: 2 vCPUs minimum
- **Disk**: 20GB minimum (ChromaDB + Docker images)
- **Docker**: 24.0+
- **Docker Compose**: 2.20+

---

## Security Considerations

1. **Firewall**: Only ports 22, 80, 443 open
2. **SSL**: Automatic via Caddy + Let's Encrypt
3. **CORS**: Configure production CORS in Caddyfile
4. **Secrets**: Store in .env file (never commit)
5. **Updates**: Regularly update packages and Docker images
6. **Backups**: Automate ChromaDB backups (cron job)

### Example Backup Cron Job

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd ~/hacktogone2025 && ./deploy.sh backup > /dev/null 2>&1
```

---

## Next Steps

1. **Monitoring**: Set up monitoring (Grafana, Prometheus)
2. **Logging**: Centralize logs (Loki, ELK stack)
3. **CI/CD**: Automate deployments with GitHub Actions
4. **Scaling**: Add load balancer if traffic increases
5. **Accueil Agent**: Convert to FastAPI and uncomment in configs

---

## Support

For issues or questions:
- Check [Troubleshooting](#10-troubleshooting) section
- Review Docker logs: `./deploy.sh logs`
- Consult project documentation: [CLAUDE.md](CLAUDE.md)

---

**Deployment completed! Your services should now be accessible at:**
- https://rag.yourdomain.com
- https://scoring.yourdomain.com
