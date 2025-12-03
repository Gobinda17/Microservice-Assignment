# Microservice-Assignment

Lightweight Node.js microservices demo for task routing, delivery, and logging.
Run locally with Docker Compose; services communicate over HTTP and use host MongoDB.

## Architecture overview
- 3 application services:
  - task-router-service (port 3001) — routes tasks to delivery & logging services.
  - delivery-service (port 3002) — handles delivery operations.
  - logging-service (port 4000) — persists/forwards logs.
- Infra:
  - Elasticsearch (9200) + Kibana (5601) for observability.
- Each service is an independent Node.js microservice with its own Dockerfile and environment.

## Communication method and reasoning
- Services communicate over HTTP (REST) using simple JSON endpoints.
  - Reason: simplicity, clear boundaries, easy local debugging and scaling.
- MongoDB is hosted on the Windows host (not in a container) to avoid using C: Docker volumes.
  - Containers reach host Mongo using host.docker.internal (Docker Desktop on Windows).
  - Use env var MONGODB_URI=mongodb://host.docker.internal:27017/comms_system
- Docker Compose ties services together for local integration.

## How to start (recommended)
From project root (where docker-compose.yml lives):
1. Ensure MongoDB is running on the host and listening on 127.0.0.1:27017 (or run with --bind_ip_all).
   - If you want DB files on another drive: mongod --dbpath "D:\mongo\data" --bind_ip_all
2. Build and start containers:
   - PowerShell (run in project root):
     cd "e:\Job_Assignment\MicroService-Assignment\Microservice-Assignment"
     docker compose up -d --build
3. Check logs / status:
   - docker compose ps
   - docker compose logs --tail=200 <service-name>

Alternative — run services individually (dev)
- Example for logging-service:
  cd services/logging-service
  npm install
  cp .env.example .env  # or edit .env to set MONGODB_URI to host.docker.internal
  npm start

## Environment notes
- Ensure each service's .env uses:
  MONGODB_URI=mongodb://host.docker.internal:27017/comms_system
- If you have an .env with localhost, update to host.docker.internal or remove to let compose env override.

## Example endpoints & payloads

1) Logging service
- Health:
  GET http://localhost:4000/health
  Response:
  { "status": "ok", "service": "logging-service" }

- Create log:
  POST http://localhost:4000/logging_service
  Body:
  {
    "level": "info",
    "message": "Order received",
    "meta": { "orderId": "1234" }
  }
  Expected: 200/201 with created log metadata (service-dependent).

2) Delivery service
- Create delivery (example):
  POST http://localhost:3002/delivery_service
  Body:
  {
    "recipient": "Alice",
    "address": "123 Main St",
    "taskId": "task-001"
  }
  Expected: 200/201 with { "status": "scheduled", "deliveryId": "..." }

3) Task Router (example)
- Route task:
  POST http://localhost:3001/route_task
  Body:
  {
    "taskType": "delivery",
    "payload": { ... }
  }
  Expected: proxied requests to delivery-service + a logging call.

(Adjust endpoints if your code uses different paths. See each service's src/routes for exact routes.)

## Postman collection
- Import the file `postman_collection.json` (in repo root) into Postman to get ready-made requests for health and basic operations.

## Troubleshooting
- "open Dockerfile: no such file or directory": ensure service folder contains a file named exactly `Dockerfile` (case-sensitive in build context) and run compose from project root.
- "Cannot find module '/app/index.js'": ensure your Dockerfile copies the service root (including index.js) or adjust CMD to point to your entry (e.g., `node src/index.js`).
- Mongo connection refused:
  - Ensure MongoDB is running on host and listening on 127.0.0.1.
  - Use MONGODB_URI with host.docker.internal in service env or .env.
  - If still refused, check Windows firewall and mongod bind IP settings.

## Minimal run checklist
1. MongoDB running on host.
2. .env values updated (MONGODB_URI to host.docker.internal).
3. Dockerfiles named `Dockerfile` and contain COPY of index/entrypoint.
4. From project root: docker compose up -d --build

# Environment variables (examples)

## Environment variables (per-service examples)
- Common
  - MONGO_URI — Mongo connection used by services (example: mongodb://host.docker.internal:27017/comms_system)
  - PORT — service HTTP port (example: 3001, 3002, 4000)
  - SERVICE_NAME — friendly name for logs

- task-router-service (.env)
  - PORT=3001
  - SERVICE_NAME=task-router-service
  - LOGGING_SERVICE_URL=http://logging-service:4000/logging_service
  - DELIVERY_SERVICE_URL=http://delivery-service:3002/delivery_service
  - MONGO_URI=mongodb://host.docker.internal:27017/comms_system

- delivery-service (.env)
  - PORT=3002
  - SERVICE_NAME=delivery-service
  - LOGGING_SERVICE_URL=http://logging-service:4000/logging_service
  - MONGO_URI=mongodb://host.docker.internal:27017/comms_system

- logging-service (.env)
  - PORT=4000
  - SERVICE_NAME=logging-service
  - ELASTICSEARCH_URL=http://host.docker.internal:9200
  - MONGO_URI=mongodb://host.docker.internal:27017/comms_system

Notes:
- Do NOT commit real credentials or secrets. Use a .env file (ignored by git) or Docker secrets for production.
- Adjust host (host.docker.internal) if deploying to a different environment.
