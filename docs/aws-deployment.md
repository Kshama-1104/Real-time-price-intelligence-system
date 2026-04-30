# AWS Deployment Guide

This project is designed to run locally with Docker Compose and move cleanly to an AWS setup.

## Recommended Architecture

```text
Internet
  |
Application Load Balancer
  |
Public subnet: EC2 instance running Nginx + Node API container
  |
Private subnets:
  - RDS PostgreSQL
  - ElastiCache Redis
  - Optional worker/collector instances

S3:
  - Static frontend build artifacts
  - Price import/export files
  - Log archives
```

## AWS Services

| Need | AWS Service | Notes |
| --- | --- | --- |
| Compute | EC2 | Start with one `t3.small` or `t3.medium`; scale later with Auto Scaling Group |
| Database | RDS PostgreSQL | Enable automated backups, encryption, and private subnet placement |
| Cache | ElastiCache Redis | Use private subnet and security group access only from EC2 |
| Static assets | S3 | Store frontend build or exports; optionally serve through CloudFront |
| Access control | IAM | Use least-privilege EC2 role for S3 and CloudWatch access |
| Network | VPC | Public subnet for ALB/EC2, private subnets for RDS and Redis |
| Logs | CloudWatch | Ship Docker and Nginx logs with the CloudWatch agent |
| Secrets | SSM Parameter Store or Secrets Manager | Store DB password, JWT secret, and Redis credentials |

## EC2 Bootstrap

Install Docker and Docker Compose plugin:

```bash
sudo yum update -y
sudo yum install -y docker git
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user
mkdir -p ~/apps
```

Clone the repo on EC2:

```bash
cd ~/apps
git clone https://github.com/Kshama-1104/Real-time-price-intelligence-system.git
cd Real-time-price-intelligence-system
cp .env.example .env
```

Update `.env` with RDS and ElastiCache values:

```bash
DB_HOST=<rds-endpoint>
DB_NAME=price_intelligence
DB_USER=<rds-user>
DB_PASSWORD=<rds-password>
DB_SSL=true
REDIS_HOST=<elasticache-endpoint>
CORS_ORIGIN=https://your-domain.com
```

Run the stack:

```bash
docker compose up -d --build
```

## Security Groups

- ALB: allow inbound `80` and `443` from the internet.
- EC2: allow inbound `80` only from ALB security group, and `22` only from your IP or through SSM Session Manager.
- RDS: allow inbound `5432` only from EC2 security group.
- Redis: allow inbound `6379` only from EC2 security group.

## CI/CD Secrets

Configure these in GitHub repository settings:

```text
EC2_HOST=<public-ec2-dns-or-ip>
EC2_USER=ec2-user
EC2_SSH_KEY=<private-key>
EC2_APP_PATH=/home/ec2-user/apps/Real-time-price-intelligence-system
```

## Production Hardening Checklist

- Replace default Grafana credentials.
- Put RDS and Redis in private subnets.
- Enable RDS backups and deletion protection.
- Store secrets in SSM Parameter Store or Secrets Manager.
- Use HTTPS with ACM certificates on an Application Load Balancer.
- Forward Nginx and app logs to CloudWatch.
- Add CloudWatch alarms for CPU, memory, RDS connections, Redis evictions, and 5xx responses.
- Restrict GitHub Actions deploy access to protected `main` branch.
