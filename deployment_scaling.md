# Deployment Scaling Strategy

## Overview

The application should be deployed in a way that supports multiple users at the same time, avoids downtime, and handles the extra workload created by the multi-agent system.

The main scaling goals are:

- Support concurrent users without slowing down the application.
- Scale backend services horizontally.
- Keep the React frontend and FastAPI backend independently deployable.
- Protect the system from failures in translation, summarization, recommendation, speech, or dataset services.
- Use health checks and load balancing to reduce downtime.

## Scalable Deployment Architecture

Recommended production structure:

```text
Users
  |
  v
Load Balancer
  |
  v
Multiple FastAPI Backend Instances
  |
  v
Business Layer / Multi-Agent System
  |
  v
Persistence Layer
  |
  v
Database / Dataset Storage
```

The load balancer receives user traffic and distributes requests across multiple backend containers. If one backend instance fails, traffic can continue through the remaining healthy instances.

## Horizontal Backend Scaling

The FastAPI backend should be designed as a stateless service. This means each backend instance should be able to process any request without depending on local session state.

Important principles:

- Do not store user session state only inside one backend container.
- Store shared data in the database or an external cache if needed.
- Keep dataset records available to every backend instance.
- Use health checks so unhealthy containers can be removed from traffic.
- Run more than one backend instance in production.

With the production compose file, backend replicas can be started behind the load balancer:

```bash
docker compose -f docker-compose.prod.yml up --build --scale backend=3
```

This starts multiple backend containers and routes traffic through Nginx.

## Multi-Agent Scaling

The Business Layer includes multiple agents:

- Translator Agent
- Summary Agent
- Recommender Agent

These agents can increase processing time because they may call APIs, process text, or search through dataset records. The system should account for this by separating lightweight requests from heavier agent workflows.

Recommended approach:

- Keep simple read requests fast, such as place search, metadata, and health checks.
- Use caching for repeated translations, summaries, recommendations, and dataset queries.
- Add timeouts for external API calls such as translation, speech-to-text, and text-to-speech.
- Return clear errors when an agent or external API is unavailable.
- Consider background workers for long-running agent tasks if responses become slow.
- Track agent latency separately so slow agents can be identified.

## Handling Concurrent Users

The application should support many users performing tasks at the same time, including:

- Searching places.
- Viewing map results.
- Requesting summaries.
- Asking for recommendations.
- Translating content.
- Using voice input and voice output.

To support concurrent users:

- Run multiple FastAPI backend instances.
- Use asynchronous request handling where external API calls are involved.
- Avoid loading and parsing the CSV dataset on every request.
- Load the dataset once at startup or store it in a database.
- Use database indexes for fields used in search and filtering.
- Limit large responses with pagination or result limits.

## Avoiding Downtime

The deployment should include safeguards that reduce downtime during failures or releases.

Recommended practices:

- Use load balancing in front of backend instances.
- Use health checks for backend containers.
- Deploy at least two backend instances in production.
- Use rolling deployments so one instance updates while others continue serving traffic.
- Keep frontend and backend deployments independent.
- Keep environment configuration outside the codebase.
- Validate the application through CI before delivery.

## Database and Dataset Availability

The Montreal public places dataset should not become a bottleneck.

Recommended practices:

- Import CSV data into a database for production use.
- Keep the original CSV as a source dataset, not the only runtime query mechanism.
- Store latitude and longitude values for map queries.
- Index commonly filtered fields such as borough, categories, activities, amenities, accessibility, and types.
- Plan for scheduled dataset refreshes rather than manually replacing files during active traffic.

## Monitoring and Reliability

The system should expose enough information to detect problems early.

Recommended monitoring:

- Backend health endpoint availability.
- Request count and response time.
- Error rate by endpoint.
- Agent processing time.
- External API failures.
- Dataset loading errors.
- Database query performance.
- Container restarts.

The existing `/api/health` route should be used by the load balancer and deployment platform to confirm that backend instances are ready to receive traffic.

## Production Compose Files

The repository includes:

- `docker-compose.yml` for simple local backend development.
- `docker-compose.prod.yml` for production-style scaling with Nginx and multiple backend replicas.
- `nginx/nginx.conf` for load balancing traffic to backend instances.

The production compose setup is a starting point. For a real production environment, the same principles can be moved to Kubernetes, Docker Swarm, AWS ECS, Azure Container Apps, Google Cloud Run, or another container orchestration platform.
