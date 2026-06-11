# Cloud IDE | Cloud Complier

A minimal, production-oriented Cloud IDE for executing Python/c/c++/java code inside isolated Docker containers on a virtual machine.

## Overview

Cloud Python Compiler is an educational virtualization and cloud execution project built with FastAPI, Uvicorn, Redis, Docker, HTML, CSS, and vanilla JavaScript. The system allows users to write Python code in a browser, execute it securely in a separate container, and observe execution results and backend activity in real time.

The design follows a simple and clear cloud architecture:

Browser -> FastAPI -> Redis -> Docker Runner -> Isolated Python Container -> Result and Logs

The main goal of the project is to demonstrate how container-based code execution works in a cloud environment without introducing unnecessary complexity. The project intentionally avoids databases, message brokers, orchestration platforms, and heavy infrastructure components.

## Key Goals

- Run every user request in a fresh Docker container
- Keep execution isolated from the FastAPI server
- Store live execution state and logs in Redis only
- Provide a real-time debug dashboard
- Enforce strict runtime, CPU, and memory limits
- Keep the codebase simple, readable, and easy to extend

## Core Features

- Browser-based Python editor
- One-container-per-execution model
- Real-time stdout and stderr capture
- Execution status tracking
- Live debug dashboard
- Runtime logs and event stream
- System metrics and worker monitoring
- Clean frontend built with HTML, CSS, and vanilla JavaScript
- Docker Compose based local deployment
- VM-friendly architecture for self-hosting

# Project Links

| Service               | URL                                    | Description                                    |
| --------------------- | -------------------------------------- | ---------------------------------------------- |
| Cloud Python Compiler | https://cloudide.webhop.me             | Main IDE for writing and executing Python code |
| Debug Dashboard       | https://cloudide.webhop.me/debug       | Real-time monitoring dashboard                 |
| API Documentation     | http://localhost:8000/docs             | Interactive Swagger/OpenAPI documentation      |
| OpenAPI Schema        | http://localhost:8000/openapi.json     | Raw OpenAPI specification                      |
| Health Check          | https://cloudide.webhop.me/health      | Backend health endpoint                        |
| Metrics API           | https://cloudide.webhop.me/api/metrics | Runtime metrics                                |
| Events API            | https://cloudide.webhop.me/api/events  | Recent backend events                          |
| Debug WebSocket       | ws://cloudide.webhop.me/ws/debug       | Live event stream                              |

---

# Author & Credits

| Field             | Details                                                             |
| ----------------- | ------------------------------------------------------------------- |
| Project Name      | Cloud Python Compiler                                               |
| Version           | 1.0.0                                                               |
| Author            | Chirag Sindhu                                                       |
| Technology Stack  | FastAPI, Redis, Docker, Uvicorn, HTML, CSS, JavaScript              |
| Architecture      | Containerized Cloud Execution Platform                              |
| Purpose           | Virtualization, Containerization, and Cloud Computing Demonstration |
| License           | MIT                                                                 |
| Hosting Platform  | Virtual Machine with Docker Compose                                 |
| Execution Model   | One Container Per Request                                           |
| Storage Layer     | Redis                                                               |
| API Specification | OpenAPI 3.1                                                         |

---

# Screenshots

## Main Cloud IDE

> Save screenshot as:

```text
docs/images/cloud-ide-home.png
```

![Main IDE](docs/images/cloud-ide-home.png)

The Cloud IDE allows users to write Python code, execute it inside isolated Docker containers, and view execution output in real time.

---

## Debug Dashboard

> Save screenshot as:

```text
docs/images/debug-dashboard.png
```

![Debug Dashboard](docs/images/debug-dashboard.png)

The Debug Dashboard provides real-time visibility into active executions, backend activity, execution logs, container lifecycle events, and system metrics.

---

## API Documentation

> Save screenshot as:

```text
docs/images/api-docs.png
```

![API Documentation](docs/images/api-docs.png)

Interactive OpenAPI documentation generated automatically by FastAPI.

---

# Container Security & Resource Limits

| Resource               | Limit                 |
| ---------------------- | --------------------- |
| Maximum Runtime        | 30 Seconds            |
| Memory Limit           | 256 MB                |
| CPU Limit              | 1 Core                |
| Network Access         | Disabled              |
| Filesystem             | Read Only             |
| User Privileges        | Non-root User         |
| Redis Access           | Blocked               |
| Docker Socket Access   | Blocked               |
| Host Filesystem Access | Blocked               |
| Container Lifecycle    | Created Per Execution |
| Cleanup Policy         | Automatic Removal     |

---

# Live Monitoring Features

| Feature              | Description                   |
| -------------------- | ----------------------------- |
| Active Executions    | Currently running code        |
| Completed Executions | Successful executions         |
| Failed Executions    | Runtime failures              |
| Timeout Executions   | Jobs exceeding runtime limits |
| Execution Logs       | Real-time stdout/stderr       |
| Event Stream         | Backend lifecycle events      |
| Container Monitoring | Creation and removal tracking |
| Metrics Dashboard    | System statistics             |
| Recent Executions    | Last 100 executions           |
| WebSocket Updates    | Live dashboard updates        |

---

# Available API Endpoints

| Method | Endpoint                 | Description               |
| ------ | ------------------------ | ------------------------- |
| POST   | /api/execute             | Execute Python code       |
| GET    | /api/execution/{id}      | Get execution details     |
| GET    | /api/execution/{id}/logs | Get execution logs        |
| GET    | /api/metrics             | Get runtime metrics       |
| GET    | /api/events              | Get recent backend events |
| POST   | /api/metrics/reset       | Reset metrics             |
| GET    | /health                  | Health check              |
| GET    | /debug                   | Debug dashboard           |
| GET    | /docs                    | Swagger UI                |
| GET    | /openapi.json            | OpenAPI schema            |
| WS     | /ws/debug                | Live event stream         |

---

# System Architecture

```text
Browser
   │
   ▼
FastAPI Application
   │
   ▼
Redis (State, Metrics, Logs)
   │
   ▼
Execution Service
   │
   ▼
Docker Engine
   │
   ▼
Isolated Python Container
   │
   ▼
Python Code Execution
   │
   ▼
Results + Logs + Metrics
```

---

# Execution Lifecycle

```text
User Clicks Execute
        │
        ▼
Create Execution ID
        │
        ▼
Store Metadata In Redis
        │
        ▼
Create Docker Container
        │
        ▼
Copy User Code
        │
        ▼
Start Execution
        │
        ▼
Stream Logs To Redis
        │
        ▼
Update Dashboard Via WebSocket
        │
        ▼
Capture Output & Metrics
        │
        ▼
Destroy Container
        │
        ▼
Store Final Status
```


## Architecture

The project is designed to run on a virtual machine with Docker installed.

### Request Flow

1. A user writes Python code in the browser.
2. The frontend sends the code to the FastAPI backend.
3. FastAPI creates a unique execution ID and stores metadata in Redis.
4. A dedicated Docker container is created for that execution.
5. The code is copied into the container.
6. The container runs the code in a restricted environment.
7. Stdout, stderr, and events are streamed back in real time.
8. Execution results are written to Redis.
9. The container is removed after completion or timeout.
10. The frontend receives the final status and logs.

### Isolation Model

Each execution runs in a fresh container. The code never runs inside the FastAPI process.

The container is restricted so it cannot:

- Access the FastAPI application internals
- Access Redis directly
- Access the host filesystem
- Access the Docker socket
- Communicate with internal services
- Open network connections

This makes the project a good example of containerized sandbox execution in a cloud environment.

## Tech Stack

### Backend

- Python 3.12+
- FastAPI
- Uvicorn
- Redis
- Docker SDK for Python
- Asyncio

### Frontend

- HTML
- Tailwind CSS
- Vanilla JavaScript

### Deployment

- Docker
- Images
- Image containers
- seperate docker containers
- Docker Compose
- Virtual machine hosting

## Execution Environment

A dedicated runner image is used for Python execution.

### Base Image

- python:3.12-slim

### Preinstalled Python Modules

The runner image is intended to support common built-in and standard-library-oriented Python workflows, including:

- collections
- heapq
- math
- itertools
- functools
- bisect
- statistics
- string
- random
- decimal
- fractions
- datetime
- time
- json
- re
- typing
- dataclasses
- queue
- threading
- multiprocessing
- pathlib
- hashlib
- base64

The runner image should remain lightweight and easy to update later.

## Resource Limits

Every execution container should use strict resource controls:

- Maximum runtime: 30 seconds
- Memory limit: 256 MB
- CPU limit: 1 core
- Network: disabled
- Filesystem: read-only where possible
- Non-root execution user
- Automatic container cleanup after completion

### Failure States

The system should map failures to clear execution states:

- TIMEOUT
- MEMORY_LIMIT_EXCEEDED
- RUNTIME_ERROR
- INTERNAL_ERROR

## Redis Usage

Redis is the only storage layer in the project.

No database is used, and no persistence beyond runtime is required.

### Stored Data

#### Execution Metadata
- execution_id
- status
- created_at
- started_at
- completed_at
- duration

#### Execution Logs
- stdout
- stderr
- events

#### Live Metrics
- total executions
- active executions
- completed executions
- failed executions
- timeout executions

#### Worker Status
- currently running jobs
- queue size
- recent errors

### Recommended Redis Structures

- Hashes for execution metadata
- Lists for ordered execution logs
- Streams for real-time events
- Simple counters for metrics

This keeps storage efficient and easy to reason about.

## Real-Time Debug Dashboard

The project includes a separate debug page at `/debug`.

The dashboard is intended for live operational visibility during development, testing, and demonstrations.

### Dashboard Capabilities

- Live server metrics
- Active execution list
- Current job status
- Execution timing
- Event stream updates
- Runtime error panel
- Recent execution history
- WebSocket-based real-time refresh

### Events to Display

- Execution Created
- Container Created
- Container Started
- Code Copied
- Execution Started
- Stdout Chunk
- Stderr Chunk
- Execution Completed
- Execution Failed
- Execution Timeout
- Container Removed

This makes it easier to understand how the backend behaves under load and how each execution moves through the system.

## Frontend UI

The frontend should remain simple and professional.

### Main IDE Page

The main page should include:

- Code editor
- Execute button
- Status display
- Stdout output panel
- Stderr output panel
- Execution time display
- Logs and runtime information

### Design Principles

- Clean layout
- Minimal distractions
- No frontend frameworks
- Fast loading
- Easy to understand for demos and learning

## API Endpoints

### Execute Code

`POST /api/execute`

Request body:

```json
{
  "code": "print('hello')"
}
```

Response:

```json
{
  "execution_id": "uuid"
}
```

### Get Execution Status

`GET /api/execution/{execution_id}`

Returns:

```json
{
  "status": "SUCCESS",
  "stdout": "...",
  "stderr": "...",
  "duration": 0.42
}
```

### Get Execution Logs

`GET /api/execution/{execution_id}/logs`

### Get Metrics

`GET /api/metrics`

Returns:

```json
{
  "active": 0,
  "completed": 0,
  "failed": 0,
  "timeout": 0
}
```

### Debug Events WebSocket

`/ws/debug`

Pushes live backend events to the debug dashboard in real time.

## Logging and Monitoring

Every major backend action should emit an event and write it to Redis.

### Example Events

- Execution created
- Container created
- Container started
- Code copied into container
- Execution started
- Stdout received
- Stderr received
- Execution completed
- Execution failed
- Execution timed out
- Container destroyed

This event-driven approach gives the project strong visibility without requiring additional infrastructure.

## Project Structure

```text
cloud-python-compiler/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── redis_manager.py
│   ├── websocket_manager.py
│   ├── routes/
│   ├── services/
│   └── execution/
├── frontend/
│   ├── index.html
│   ├── debug.html
│   ├── styles.css
│   ├── app.js
│   └── debug.js
├── runner/
│   └── Dockerfile
└── docker-compose.yml
```

## How It Works

### Backend

FastAPI receives user code, creates execution records, and coordinates the lifecycle of each request.

### Redis

Redis stores execution state, logs, event history, metrics, and worker status in memory.

### Docker Runner

The runner service creates one isolated container per execution, applies resource limits, and captures output.

### Frontend

The browser UI sends code to the backend and displays the final result, logs, and live system state.

## Deployment

The project is intended to run on a single virtual machine with Docker and Docker Compose.

### Typical Setup

- Install Docker
- Install Docker Compose
- Clone the project
- Build the runner image
- Start the services with Docker Compose
- Open the IDE in the browser
- Open the debug dashboard for live monitoring

## Security Notes

This project is designed for educational sandbox execution, not for untrusted public internet workloads without additional hardening.

Important protections include:

- Separate container per execution
- No shared process execution
- No network access
- No host filesystem access
- No Docker socket access from user code
- Strict runtime and memory constraints

For production internet-facing usage, additional hardening, auditing, and operational controls may be required.

## Educational Value

This project is useful for learning:

- Virtualization concepts
- Container isolation
- Cloud execution architecture
- Secure code runner design
- Real-time monitoring with WebSockets
- Redis-based state management
- Minimal service-oriented backend design

## Summary

Cloud Python Compiler demonstrates a clean and practical way to run Python code in the cloud using Docker-based isolation, FastAPI orchestration, and Redis-backed live state tracking. It is intentionally minimal, easy to understand, and well suited for virtualization and cloud computing demonstrations.

