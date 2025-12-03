# MaBiS Formula API - Deployment Guide

## Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Deployment-Optionen](#deployment-optionen)
3. [Option 1: AWS (Empfohlen)](#option-1-aws-empfohlen)
4. [Option 2: Azure](#option-2-azure)
5. [Option 3: Budget-Lösung (DigitalOcean)](#option-3-budget-lösung-digitalocean)
6. [Domain-Integration (one.com)](#domain-integration-onecom)
7. [SSL/TLS-Zertifikate](#ssltls-zertifikate)
8. [Monitoring & Wartung](#monitoring--wartung)

---

## Übersicht

Das MaBiS Formula API System besteht aus:
- **Frontend**: React SPA (statische Dateien)
- **Backend**: Python Flask API
- **Anforderungen**: Docker-Unterstützung, HTTPS, Skalierbarkeit

Da **one.com** nur PHP-Hosting anbietet, benötigen wir einen Cloud-Provider der Docker-Container unterstützt.

---

## Deployment-Optionen

### Vergleich

| Kriterium | AWS | Azure | DigitalOcean |
|-----------|-----|-------|--------------|
| **Kosten/Monat** | ~$25-50 | ~$30-60 | ~$15-30 |
| **Setup-Komplexität** | Mittel | Mittel | Niedrig |
| **Skalierbarkeit** | Exzellent | Exzellent | Gut |
| **Deutsche Rechenzentren** | ✅ Frankfurt | ✅ Frankfurt | ✅ Frankfurt |
| **Compliance (DSGVO)** | ✅ | ✅ | ✅ |
| **Best für** | Enterprise | Enterprise | Startups/KMU |

### Empfehlung

**Für 50Hertz/Produktivbetrieb: AWS** (Frankfurt-Region)
- Enterprise-Grade
- Deutsche Rechenzentren
- Compliance-konform
- Etabliert im Energiesektor

**Für POC/Demo: DigitalOcean**
- Einfaches Setup
- Niedrige Kosten
- Docker-native

---

## Option 1: AWS (Empfohlen)

### Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud (eu-central-1 - Frankfurt)    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                     Route 53 (DNS)                         │ │
│  │  • formulas.ihredomain.de  →  ALB                          │ │
│  │  • SSL/TLS Certificate (ACM)                               │ │
│  └──────────────────────────┬────────────────────────────────┘ │
│                             │                                  │
│  ┌──────────────────────────▼────────────────────────────────┐ │
│  │       Application Load Balancer (ALB)                      │ │
│  │  • HTTPS Termination                                       │ │
│  │  • Health Checks                                           │ │
│  │  • Auto Scaling Integration                                │ │
│  └───────────────┬──────────────────┬─────────────────────────┘ │
│                  │                  │                          │
│  ┌───────────────▼────────┐  ┌──────▼──────────────┐          │
│  │  ECS Service: Frontend │  │ ECS Service: Backend│          │
│  │  (Fargate)             │  │ (Fargate)           │          │
│  │                        │  │                     │          │
│  │  • 2-3 Tasks           │  │ • 2-3 Tasks         │          │
│  │  • Nginx + React SPA   │  │ • Python Flask API  │          │
│  │  • Auto Scaling        │  │ • Auto Scaling      │          │
│  └────────────────────────┘  └──────┬──────────────┘          │
│                                     │                          │
│  ┌──────────────────────────────────▼─────────────────────┐   │
│  │              RDS PostgreSQL (Multi-AZ)                  │   │
│  │  • db.t3.micro (Start)                                  │   │
│  │  • Automated Backups                                    │   │
│  │  • Encryption at Rest                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              CloudWatch (Monitoring)                     │   │
│  │  • Logs                                                  │   │
│  │  • Metrics                                               │   │
│  │  • Alarms                                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### AWS Services

| Service | Zweck | Kosten/Monat |
|---------|-------|--------------|
| **ECS Fargate** | Container Runtime | ~$15-30 |
| **Application Load Balancer** | Load Balancing + SSL | ~$16 |
| **RDS PostgreSQL** | Database (t3.micro) | ~$15 |
| **Route 53** | DNS Management | ~$0.50 |
| **ACM** | SSL Certificate | Kostenlos |
| **CloudWatch** | Monitoring & Logs | ~$5-10 |
| **ECR** | Container Registry | ~$2 |
| | **Total** | **~$53-73** |

### Setup-Schritte: AWS

#### 1. AWS Account & VPC Setup

```bash
# AWS CLI installieren
brew install awscli  # macOS
# oder: pip install awscli

# AWS konfigurieren
aws configure
# AWS Access Key ID: [Ihr Key]
# AWS Secret Access Key: [Ihr Secret]
# Default region: eu-central-1  # Frankfurt
# Default output format: json
```

#### 2. ECR (Container Registry) erstellen

```bash
# ECR Repositories erstellen
aws ecr create-repository \
    --repository-name mabis-formula-api \
    --region eu-central-1

aws ecr create-repository \
    --repository-name mabis-formula-frontend \
    --region eu-central-1

# Login zu ECR
aws ecr get-login-password --region eu-central-1 | \
docker login --username AWS --password-stdin \
<YOUR_ACCOUNT_ID>.dkr.ecr.eu-central-1.amazonaws.com
```

#### 3. Docker Images bauen und pushen

```bash
# Backend Image
docker build -t mabis-formula-api:latest .
docker tag mabis-formula-api:latest \
    <YOUR_ACCOUNT_ID>.dkr.ecr.eu-central-1.amazonaws.com/mabis-formula-api:latest
docker push <YOUR_ACCOUNT_ID>.dkr.ecr.eu-central-1.amazonaws.com/mabis-formula-api:latest

# Frontend Image
docker build -t mabis-formula-frontend:latest ./frontend
docker tag mabis-formula-frontend:latest \
    <YOUR_ACCOUNT_ID>.dkr.ecr.eu-central-1.amazonaws.com/mabis-formula-frontend:latest
docker push <YOUR_ACCOUNT_ID>.dkr.ecr.eu-central-1.amazonaws.com/mabis-formula-frontend:latest
```

#### 4. RDS PostgreSQL erstellen

```bash
aws rds create-db-instance \
    --db-instance-identifier mabis-formula-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.3 \
    --master-username mabisadmin \
    --master-user-password <SECURE_PASSWORD> \
    --allocated-storage 20 \
    --vpc-security-group-ids <YOUR_SECURITY_GROUP> \
    --backup-retention-period 7 \
    --multi-az \
    --region eu-central-1
```

#### 5. ECS Cluster & Services erstellen

**Option A: AWS Console (Empfohlen für Erstnutzer)**

1. Gehen Sie zu **ECS Console** → Create Cluster
2. Cluster Type: **Networking only** (Fargate)
3. Cluster name: `mabis-formula-cluster`

**Option B: AWS CLI**

```bash
# ECS Cluster erstellen
aws ecs create-cluster \
    --cluster-name mabis-formula-cluster \
    --region eu-central-1

# Task Definitions erstellen (siehe task-definition.json unten)
aws ecs register-task-definition \
    --cli-input-json file://backend-task-definition.json

aws ecs register-task-definition \
    --cli-input-json file://frontend-task-definition.json

# ECS Services erstellen
aws ecs create-service \
    --cluster mabis-formula-cluster \
    --service-name mabis-backend \
    --task-definition mabis-backend:1 \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_IDS>],securityGroups=[<SG_ID>],assignPublicIp=ENABLED}"
```

**backend-task-definition.json:**
```json
{
  "family": "mabis-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "mabis-api",
      "image": "<YOUR_ACCOUNT_ID>.dkr.ecr.eu-central-1.amazonaws.com/mabis-formula-api:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DB_HOST",
          "value": "<RDS_ENDPOINT>"
        },
        {
          "name": "DB_NAME",
          "value": "mabis_formulas"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:eu-central-1:<ACCOUNT>:secret:mabis-db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mabis-backend",
          "awslogs-region": "eu-central-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

#### 6. Application Load Balancer erstellen

```bash
# ALB erstellen
aws elbv2 create-load-balancer \
    --name mabis-formula-alb \
    --subnets <SUBNET_ID_1> <SUBNET_ID_2> \
    --security-groups <SG_ID> \
    --scheme internet-facing \
    --type application \
    --region eu-central-1

# Target Groups erstellen
aws elbv2 create-target-group \
    --name mabis-backend-tg \
    --protocol HTTP \
    --port 8000 \
    --vpc-id <VPC_ID> \
    --target-type ip \
    --health-check-path /health

aws elbv2 create-target-group \
    --name mabis-frontend-tg \
    --protocol HTTP \
    --port 80 \
    --vpc-id <VPC_ID> \
    --target-type ip

# Listeners erstellen (nach SSL-Zertifikat-Setup)
aws elbv2 create-listener \
    --load-balancer-arn <ALB_ARN> \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=<ACM_CERT_ARN> \
    --default-actions Type=forward,TargetGroupArn=<FRONTEND_TG_ARN>
```

#### 7. Auto Scaling konfigurieren

```bash
# Auto Scaling Target registrieren
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --scalable-dimension ecs:service:DesiredCount \
    --resource-id service/mabis-formula-cluster/mabis-backend \
    --min-capacity 2 \
    --max-capacity 10

# Scaling Policy erstellen (CPU-basiert)
aws application-autoscaling put-scaling-policy \
    --service-namespace ecs \
    --scalable-dimension ecs:service:DesiredCount \
    --resource-id service/mabis-formula-cluster/mabis-backend \
    --policy-name cpu-scale-out \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

**scaling-policy.json:**
```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleOutCooldown": 60,
  "ScaleInCooldown": 180
}
```

### Infrastructure as Code (Optional - Terraform)

**terraform/main.tf:**
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-central-1"
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "mabis-formula-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["eu-central-1a", "eu-central-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = false
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "mabis-formula-cluster"
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier           = "mabis-formula-db"
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.t3.micro"
  allocated_storage    = 20
  storage_encrypted    = true

  db_name  = "mabis_formulas"
  username = "mabisadmin"
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  multi_az               = true

  skip_final_snapshot = false
  final_snapshot_identifier = "mabis-formula-final-snapshot"
}

# ALB
resource "aws_lb" "main" {
  name               = "mabis-formula-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
}

# ... weitere Ressourcen
```

**Deploy mit Terraform:**
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

---

## Option 2: Azure

### Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│              Azure Cloud (West Europe - Amsterdam)              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   Azure DNS Zone                           │ │
│  │  • formulas.ihredomain.de  →  App Gateway                  │ │
│  └──────────────────────────┬────────────────────────────────┘ │
│                             │                                  │
│  ┌──────────────────────────▼────────────────────────────────┐ │
│  │         Application Gateway (WAF)                          │ │
│  │  • SSL Termination                                         │ │
│  │  • Path-based Routing                                      │ │
│  └───────────────┬──────────────────┬─────────────────────────┘ │
│                  │                  │                          │
│  ┌───────────────▼────────┐  ┌──────▼──────────────┐          │
│  │  Container Instance:   │  │ Container Instance: │          │
│  │  Frontend              │  │ Backend             │          │
│  │                        │  │                     │          │
│  │  • Nginx + React       │  │ • Python Flask      │          │
│  │  • Auto Scale          │  │ • Auto Scale        │          │
│  └────────────────────────┘  └──────┬──────────────┘          │
│                                     │                          │
│  ┌──────────────────────────────────▼─────────────────────┐   │
│  │       Azure Database for PostgreSQL                     │   │
│  │  • Flexible Server (Burstable)                          │   │
│  │  • Geo-Redundant Backup                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            Azure Monitor + Log Analytics                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Azure Services & Kosten

| Service | Zweck | Kosten/Monat |
|---------|-------|--------------|
| **Container Instances** | Container Runtime | ~$20-40 |
| **Application Gateway** | Load Balancing + WAF | ~$20 |
| **PostgreSQL Flexible** | Database (Burstable) | ~$15 |
| **Azure DNS** | DNS Management | ~$0.50 |
| **Key Vault** | Secrets Management | ~$0.03 |
| **Monitor** | Monitoring & Logs | ~$5-10 |
| | **Total** | **~$60-85** |

### Setup-Schritte: Azure

```bash
# Azure CLI installieren
brew install azure-cli  # macOS

# Login
az login

# Resource Group erstellen
az group create \
    --name mabis-formula-rg \
    --location westeurope

# Container Registry erstellen
az acr create \
    --resource-group mabis-formula-rg \
    --name mabisformulas \
    --sku Basic

# Images bauen und pushen
az acr build \
    --registry mabisformulas \
    --image mabis-formula-api:latest \
    --file Dockerfile .

az acr build \
    --registry mabisformulas \
    --image mabis-formula-frontend:latest \
    --file frontend/Dockerfile ./frontend

# PostgreSQL erstellen
az postgres flexible-server create \
    --resource-group mabis-formula-rg \
    --name mabis-formula-db \
    --location westeurope \
    --admin-user mabisadmin \
    --admin-password <SECURE_PASSWORD> \
    --sku-name Standard_B1ms \
    --version 15 \
    --storage-size 32

# Container Instances deployen
az container create \
    --resource-group mabis-formula-rg \
    --name mabis-backend \
    --image mabisformulas.azurecr.io/mabis-formula-api:latest \
    --cpu 1 \
    --memory 1 \
    --registry-login-server mabisformulas.azurecr.io \
    --registry-username <ACR_USERNAME> \
    --registry-password <ACR_PASSWORD> \
    --ports 8000 \
    --environment-variables \
        DB_HOST=<POSTGRES_HOST> \
        DB_NAME=mabis_formulas
```

---

## Option 3: Budget-Lösung (DigitalOcean)

### Vorteile
- ✅ Einfachstes Setup
- ✅ Niedrigste Kosten (~$15-20/Monat)
- ✅ Docker-native (App Platform)
- ✅ Frankfurt-Rechenzentrum verfügbar

### Setup-Schritte: DigitalOcean

#### 1. Account erstellen & doctl installieren

```bash
# DigitalOcean CLI installieren
brew install doctl  # macOS

# Authentifizieren
doctl auth init
```

#### 2. App Platform verwenden (Einfachster Weg)

**Option A: Web UI (Empfohlen)**

1. Gehe zu **DigitalOcean Console** → App Platform
2. Klicke "Create App"
3. Verbinde GitHub Repository
4. DigitalOcean erkennt automatisch:
   - `Dockerfile` für Backend
   - `frontend/Dockerfile` für Frontend
5. Konfiguriere:
   - **Backend**: Port 8000, $10/Monat
   - **Frontend**: Port 80, $5/Monat
   - **PostgreSQL**: Managed Database, $15/Monat
6. Deploy!

**Option B: App Spec (YAML)**

```yaml
# .do/app.yaml
name: mabis-formula-api
region: fra
services:
  - name: backend
    source:
      repo_path: /
      branch: main
    dockerfile_path: Dockerfile
    http_port: 8000
    instance_count: 1
    instance_size_slug: basic-xxs
    health_check:
      http_path: /health
    envs:
      - key: DB_HOST
        scope: RUN_TIME
        value: ${db.HOSTNAME}
      - key: DB_NAME
        scope: RUN_TIME
        value: ${db.DATABASE}
      - key: DB_PASSWORD
        scope: RUN_TIME
        value: ${db.PASSWORD}
        type: SECRET

  - name: frontend
    source:
      repo_path: /frontend
      branch: main
    dockerfile_path: Dockerfile
    http_port: 80
    instance_count: 1
    instance_size_slug: basic-xxs
    routes:
      - path: /

databases:
  - name: db
    engine: PG
    version: "15"
    size: db-s-1vcpu-1gb
    num_nodes: 1
```

**Deploy:**
```bash
doctl apps create --spec .do/app.yaml
```

#### 3. Droplet (Alternative - Manuelle Kontrolle)

```bash
# Droplet erstellen
doctl compute droplet create mabis-formula \
    --image docker-20-04 \
    --size s-2vcpu-2gb \
    --region fra1 \
    --ssh-keys <YOUR_SSH_KEY_ID>

# SSH in Droplet
ssh root@<DROPLET_IP>

# Docker Compose Setup
git clone <YOUR_REPO>
cd PythonBerechnungsformelnAPI
docker compose up -d
```

### Kosten-Übersicht: DigitalOcean

| Service | Spezifikation | Kosten/Monat |
|---------|---------------|--------------|
| App Platform Backend | Basic XXS (512MB RAM) | $5 |
| App Platform Frontend | Basic XXS (512MB RAM) | $5 |
| Managed PostgreSQL | 1GB RAM, 10GB Storage | $15 |
| | **Total** | **$25** |

**Alternative Droplet:**
- 2 vCPU, 2GB RAM, 60GB SSD: $18/Monat
- PostgreSQL selbst gehostet: Kostenlos (im Droplet)
- **Total: $18/Monat**

---

## Domain-Integration (one.com)

### DNS-Konfiguration

Da Sie eine Domain bei **one.com** haben, müssen Sie DNS-Records anlegen:

#### Für AWS Route 53

1. **AWS Route 53 Hosted Zone erstellen**
   ```bash
   aws route53 create-hosted-zone \
       --name formulas.ihredomain.de \
       --caller-reference $(date +%s)
   ```

2. **Bei one.com: Nameserver ändern**
   - Login bei one.com
   - Domain Management → DNS Settings
   - Nameserver auf AWS Route 53 Nameserver ändern:
     ```
     ns-123.awsdns-12.com
     ns-456.awsdns-34.net
     ns-789.awsdns-56.org
     ns-012.awsdns-78.co.uk
     ```

#### Für DigitalOcean

1. **DigitalOcean DNS verwenden**
   ```bash
   doctl compute domain create formulas.ihredomain.de
   ```

2. **Bei one.com: A-Record anlegen**
   - Typ: `A`
   - Name: `formulas` (oder `@` für root domain)
   - Wert: `<DROPLET_IP>` oder `<APP_PLATFORM_IP>`
   - TTL: 3600

3. **Wildcard SSL (optional)**
   - Typ: `CNAME`
   - Name: `*.formulas`
   - Wert: `formulas.ihredomain.de`

---

## SSL/TLS-Zertifikate

### Option 1: Let's Encrypt (Kostenlos)

**Mit Certbot (auf Droplet):**
```bash
# Certbot installieren
apt install certbot python3-certbot-nginx

# Zertifikat generieren
certbot --nginx -d formulas.ihredomain.de

# Auto-Renewal testen
certbot renew --dry-run
```

### Option 2: AWS Certificate Manager (Kostenlos)

```bash
# Zertifikat anfordern
aws acm request-certificate \
    --domain-name formulas.ihredomain.de \
    --validation-method DNS \
    --region eu-central-1

# DNS-Validierung in Route 53 eintragen (automatisch via Console)
```

### Option 3: DigitalOcean Managed Certificates

- Automatisch in App Platform integriert
- Kostenlos
- Auto-Renewal

---

## Monitoring & Wartung

### CloudWatch (AWS) Setup

```bash
# Log Group erstellen
aws logs create-log-group \
    --log-group-name /ecs/mabis-formula \
    --region eu-central-1

# Alarm erstellen (hohe CPU)
aws cloudwatch put-metric-alarm \
    --alarm-name mabis-high-cpu \
    --alarm-description "Alert when CPU > 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2
```

### Azure Monitor Setup

```bash
# Log Analytics Workspace
az monitor log-analytics workspace create \
    --resource-group mabis-formula-rg \
    --workspace-name mabis-logs

# Application Insights
az monitor app-insights component create \
    --app mabis-formula-insights \
    --location westeurope \
    --resource-group mabis-formula-rg
```

### Health Check Endpoints

Alle Plattformen sollten diese Endpoints überwachen:

- **Backend**: `GET /health` → 200 OK
- **Frontend**: `GET /` → 200 OK
- **Database**: Connection Test

---

## Empfehlung & Entscheidungsmatrix

### Für 50Hertz / Produktionsumgebung

**Empfehlung: AWS ECS Fargate**

✅ **Vorteile:**
- Enterprise-Grade Reliability
- Deutsche Rechenzentren (Frankfurt)
- DSGVO-konform
- Etabliert in kritischen Infrastrukturen
- Umfassende Monitoring-Tools
- Skaliert bis 10.000+ Anfragen/Sekunde

❌ **Nachteile:**
- Höherer Preis (~$50-70/Monat)
- Komplexeres Setup
- Lernkurve

### Für POC / Demo / Präsentation

**Empfehlung: DigitalOcean App Platform**

✅ **Vorteile:**
- Einfachstes Setup (< 30 Minuten)
- Niedrigste Kosten (~$25/Monat)
- GitHub-Integration
- Auto-Deploy bei Push
- Perfekt für Demos

❌ **Nachteile:**
- Nicht Enterprise-Grade
- Begrenzte Skalierung

### Budget-bewusste Startphase

**Empfehlung: DigitalOcean Droplet**

- $18/Monat für alles
- Manuelle Kontrolle
- Gut für MVP/Beta

---

## Quick Start: DigitalOcean (Einfachster Weg)

```bash
# 1. DigitalOcean Account erstellen
# 2. doctl installieren
brew install doctl
doctl auth init

# 3. App erstellen (via Web UI oder YAML)
doctl apps create --spec .do/app.yaml

# 4. DNS bei one.com konfigurieren
# A-Record: formulas → <APP_IP>

# 5. SSL wird automatisch konfiguriert

# 6. Fertig! System läuft unter:
# https://formulas.ihredomain.de
```

**Zeit bis Live: ~30-60 Minuten**

---

## Support & Troubleshooting

### Häufige Probleme

1. **Container startet nicht**
   - Check Logs: `docker compose logs`
   - Health Check: `curl http://localhost:8000/health`

2. **CORS Errors**
   - Überprüfen Sie `VITE_API_BASE_URL` Environment Variable
   - Backend CORS-Header prüfen

3. **Database Connection Failed**
   - Security Groups/Firewall prüfen
   - Connection String validieren

4. **SSL Certificate Errors**
   - DNS Propagation warten (bis zu 48h)
   - Certificate Status prüfen

### Kontakte

- **AWS Support**: Über AWS Console
- **Azure Support**: Über Azure Portal
- **DigitalOcean**: support.digitalocean.com
- **one.com DNS**: support.one.com

---

## Zusammenfassung

| Kriterium | AWS | Azure | DigitalOcean |
|-----------|-----|-------|--------------|
| **Best für** | Produktion | Produktion | POC/Demo |
| **Setup-Zeit** | 2-4 Stunden | 2-4 Stunden | 30-60 Min |
| **Kosten/Monat** | $50-70 | $60-85 | $18-25 |
| **Skalierbarkeit** | +++++ | +++++ | +++ |
| **Komplexität** | Hoch | Hoch | Niedrig |
| **Empfehlung** | ✅ Produktion | ✅ Produktion | ✅ Start/Demo |

**Finale Empfehlung für Sie:**

1. **Start mit DigitalOcean App Platform** für schnelle Demo/POC
2. **Migration zu AWS ECS** wenn 50Hertz produktiv gehen will
3. **Domain bleibt bei one.com**, nur DNS-Records ändern sich

**Nächster Schritt:** DigitalOcean Account erstellen und App Platform testen!
