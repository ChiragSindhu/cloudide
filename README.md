# ☁️ Cloud Python Compiler

A complete Cloud IDE for executing Python code in isolated Docker containers.

## Features

- 🚀 Execute Python code in isolated Docker containers
- 🔒 Secure execution with resource limits (CPU, Memory, Network)
- 📊 Real-time execution monitoring
- 🐛 Live debug dashboard with WebSocket updates
- 📝 Execution logs and metrics
- ⚡ Fast and responsive UI
- 🎯 Simple architecture (FastAPI + Redis + Docker)

## Architecture

Browser → FastAPI → Redis → Docker Container → Isolated Python Execution

## Tech Stack

**Backend:**
- Python 3.12+
- FastAPI
- Uvicorn
- Redis
- Docker SDK

**Frontend:**
- HTML5
- CSS3
- Vanilla JavaScript

**Infrastructure:**
- Docker
- Docker Compose
- Redis

## Quick Start

### Prerequisites

- Docker
- Docker Compose

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cloud-ide

Build and start services:
Bash

docker-compose up --build
Access the application:
IDE: http://localhost:8000
Debug Dashboard: http://localhost:8000/debug
API Docs: http://localhost:8000/docs
Usage
Main IDE
Write Python code in the editor
Click "Execute" or press Ctrl+Enter
View output, errors, and logs in real-time
Check execution information in the Info tab
Debug Dashboard
Access http://localhost:8000/debug to monitor:

System metrics (total, active, completed, failed executions)
Active executions with elapsed time
Real-time event stream
Backend activity
Security
Code execution is completely isolated:

✅ Separate Docker container per execution
✅ No network access
✅ Memory limit: 256MB
✅ CPU limit: 1 core
✅ Execution timeout: 30 seconds
✅ No access to host filesystem
✅ No access to Redis or FastAPI
✅ Non-root user inside container
API Endpoints
Execute Code
http

POST /api/execute
Content-Type: application/json

{
  "code": "print('Hello, World!')"
}
Get Execution Status
http

GET /api/execution/{execution_id}
Get Execution Logs
http

GET /api/execution/{execution_id}/logs
Get Metrics
http

GET /api/metrics
WebSocket Debug Stream
text

ws://localhost:8000/ws/debug
Development
Project Structure
text

cloud-ide/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   └── websocket/           # WebSocket handlers
├── frontend/
│   ├── index.html           # Main IDE
│   ├── debug.html           # Debug dashboard
│   ├── styles.css           # Styling
│   ├── app.js               # IDE logic
│   └── debug.js             # Dashboard logic
├── runner/
│   └── Dockerfile           # Python execution environment
└── docker-compose.yml       # Orchestration
Extending
To add more Python packages to the runner:

Edit runner/requirements.txt
Rebuild: docker-compose build runner
Restart: docker-compose up -d
Resource Limits
Each execution has the following limits:

Max Runtime: 30 seconds
Memory: 256 MB
CPU: 1 core
Network: Disabled
Processes: 100
Monitoring
All events are logged to Redis and broadcast via WebSocket:

Execution Created
Container Created
Container Started
Execution Started
Execution Completed
Container Removed
Execution Failed
Execution Timeout
Troubleshooting
Container creation fails
Ensure Docker socket is accessible:

Bash

ls -la /var/run/docker.sock
Redis connection error
Check Redis is running:

Bash

docker-compose ps redis
docker-compose logs redis
Runner image not found
Build the runner image:

Bash

docker-compose build runner
License
MIT License

Contributing
Contributions are welcome! Please open an issue or submit a pull request.

Authors
Cloud IDE Team

text


---

## Usage Instructions

### 1. Setup

Create the project structure and save all files:

```bash
mkdir -p cloud-ide/{backend/{routes,services,websocket},frontend,runner}
cd cloud-ide
2. Build and Run
Bash

# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d

# View logs
docker-compose logs -f backend
3. Access
Main IDE: http://localhost:8000
Debug Dashboard: http://localhost:8000/debug
API Documentation: http://localhost:8000/docs
4. Test
Write Python code in the editor and execute. Monitor the debug dashboard to see real-time backend activity.

5. Stop
Bash

docker-compose down
