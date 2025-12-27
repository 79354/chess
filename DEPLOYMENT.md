# Deployment Guide – Chess Platform (AWS Production Architecture)

This document describes the production deployment architecture for the Chess Platform on AWS.  
The focus is on scalability, security, high availability, and real-time performance.

---

## 1. Architecture Overview

The system is deployed using a multi-tier AWS architecture with clear separation between frontend delivery, backend services, stateful components, and infrastructure security.
<img width="941" height="732" alt="inf" src="https://github.com/user-attachments/assets/98f4ee3a-fd2c-4c02-8136-7931c6d5c87a" />

---

## 2. Frontend Deployment

### Technology
- React (static build)
- Amazon S3
- Amazon CloudFront
- AWS Certificate Manager (ACM)

### Description
The React application is built into static assets and hosted in an S3 bucket.  
CloudFront is used as a global CDN to deliver the frontend with low latency.  
HTTPS is enforced using SSL/TLS certificates managed by ACM.  
Amazon Route 53 is used to map the custom domain to the CloudFront distribution.

---

## 3. Backend & Services

### Technology
- Amazon ECS (Fargate)
- Docker
- Application Load Balancer (ALB)
- Django (REST APIs + WebSockets)
- Celery Workers
- Celery Beat
- Chess Bot microservice

### Description
All backend services are containerized and deployed as ECS tasks running on Fargate.  
The Application Load Balancer handles incoming traffic and routes requests to the appropriate service using path-based routing.  
WebSocket traffic for real-time gameplay is supported through the ALB.

All ECS tasks run inside private subnets within a VPC.

---

## 4. State, Data & Messaging

### Persistent Storage
- Amazon RDS (PostgreSQL)

Used for:
- User accounts
- Game state and history
- Ratings and statistics

### In-Memory & Messaging
- Amazon ElastiCache (Redis)

Used for:
- WebSocket channel layers
- Celery task queues
- Real-time matchmaking

---

## 5. Security

### Secrets Management
- AWS Secrets Manager

Secrets stored include:
- Database credentials
- Django secret key
- OAuth credentials

Secrets are injected securely into ECS tasks at runtime.

### IAM
- Dedicated IAM task roles
- Least-privilege permissions
- No credentials stored in code or container images

### Networking
- Private subnets for ECS, RDS, and Redis
- Public subnets only for ALB and NAT Gateways
- Outbound internet access via NAT Gateways

---

## 6. Observability

### Logging
- Amazon CloudWatch Logs
  - Application logs
  - Container logs
  - Celery worker logs

### Metrics
- ECS service metrics
- ALB request and error metrics
- RDS performance metrics

---

## 7. DNS & Traffic Flow

### DNS
- Amazon Route 53

### Traffic Flow
User requests follow this path:

1. Client → Route 53  
2. Route 53 → CloudFront (Frontend assets)  
3. CloudFront → Application Load Balancer  
4. Application Load Balancer → ECS services  
5. ECS services → Redis / PostgreSQL  

HTTPS is enforced at all entry points.  
WebSocket connections are routed through the Application Load Balancer for real-time gameplay.

---

## 8. Deployment Summary

| Layer        | Technology |
|--------------|------------|
| Frontend     | React, S3, CloudFront |
| Backend      | Django, ECS Fargate |
| Messaging    | Redis (ElastiCache) |
| Database     | PostgreSQL (RDS) |
| Load Balancer| Application Load Balancer |
| Security     | IAM, Secrets Manager |
| Monitoring   | CloudWatch |
| DNS          | Route 53 |

---

## 9. Key Highlights

- Real-time gameplay using WebSockets
- Secure secret injection into ECS tasks
- CDN-based frontend delivery
- Service-to-service communication within a VPC
- Production-oriented AWS networking design
