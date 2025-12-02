# High-Level Design (HLD)

## 1. Architectural diagram (preserved for Markdown preview)
Use the fenced code block below so the ASCII diagram renders correctly in the Markdown preview:

```

Client (UI / API consumer)
      |
      v
+---------------------+
| task-router-service |  (port 3001) — orchestrates tasks
+---------------------+
      |                \
      |                 \
      v                  v
+----------------+    +------------------+
| delivery-service|    | logging-service |
| (port 3002)     |    | (port 4000)     |
+----------------+    +------------------+
      |                      |
      |                      v
      |                +---------------+
      |                | MongoDB (host)|
      |                +---------------+

(optional) logging-service -> Elasticsearch (host:9200) -> Kibana (5601)

```

## 2. Components & responsibilities
- task-router-service — accepts tasks, decides destination (delivery or others), calls delivery-service, and logs events.
- delivery-service — handles delivery domain logic (scheduling, status).
- logging-service — persists logs to MongoDB and forwards/indexes to Elasticsearch for observability.
- Infrastructure — MongoDB runs on the Windows host (accessed from containers via host.docker.internal). Elasticsearch + Kibana run as containers.

## 3. Data flow (sequence)
1. Client POSTs task to task-router.
2. task-router validates and calls:
   - delivery-service (HTTP POST) with task payload.
   - logging-service (HTTP POST) with a log entry.
3. delivery-service processes the task and returns a result.
4. logging-service stores logs in MongoDB and optionally indexes to Elasticsearch.
5. task-router returns response to client.

## 4. Communication pattern and justification
- Pattern: synchronous HTTP/REST between services.
- Justification: simple to implement, easy local debugging, minimal infra for compose-based dev. For higher scale, asynchronous messaging should be considered.

## 5. Non-functional considerations
- Scalability: stateless services → horizontal scaling. Mongo/Elasticsearch scale separately.
- Reliability: use retries/backoff and idempotency for inter-service calls.
- Observability: expose /health endpoints; centralize logs in Mongo and index to Elasticsearch; use Kibana.
- Security: secure env vars and network in production; adopt TLS and auth.
- Persistence: MongoDB data on host (dbpath can be moved off C:).

## 6. Future improvements
- Introduce Redis for lightweight caching, rate limiting, and short-lived queues to reduce synchronous load.
- Introduce Kafka (or RabbitMQ) for asynchronous, decoupled event-driven flows (task events, retries, and audit trails) to improve resiliency and throughput.
- Add centralized service discovery, API gateway, and mTLS for production deployments.

## 7. Deployment notes
- Local: Docker Compose for services + Elasticsearch/Kibana; containers use host.docker.internal to reach host MongoDB.
- Prod: use orchestration (Kubernetes) and managed DB/streaming services; replace host.docker.internal with service hostnames and secure networking.

## 8. Failure modes & mitigations
- Mongo unreachable: services should retry or fail-fast; surface health as unhealthy.
- Downstream failures: task-router should return error or enqueue for retry depending on business needs.
- Indexing failures: logging-service should buffer and retry or fall back to Mongo-only persistence.

## 9. Summary
Simple HTTP microservice architecture for routing, delivery, and logging with a clear upgrade path to caching (Redis) and async messaging (Kafka) for future scale and resilience.