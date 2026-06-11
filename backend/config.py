import os

class Settings:
    # Redis
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB = int(os.getenv("REDIS_DB", 0))
    
    # Execution Limits
    MAX_EXECUTION_TIME = 30  # seconds
    MAX_MEMORY = "256m"
    MAX_CPU_COUNT = 1.0
    
    # Docker
    RUNNER_IMAGE = "python-runner:latest"
    DOCKER_NETWORK = "none"  # Disable network
    
    # Redis Keys
    EXECUTION_PREFIX = "execution:"
    LOGS_PREFIX = "logs:"
    METRICS_KEY = "metrics"
    ACTIVE_EXECUTIONS_KEY = "active_executions"
    EVENT_STREAM_KEY = "event_stream"
    
    # Retention
    MAX_LOG_ENTRIES = 1000
    MAX_EVENT_ENTRIES = 500
    EXECUTION_TTL = 3600  # 1 hour

settings = Settings()