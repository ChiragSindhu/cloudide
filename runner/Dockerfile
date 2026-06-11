FROM python:3.12-slim

# Install commonly used packages (all are standard library, no installation needed)
# But we can install any additional packages here if needed in future

# Create a non-root user
RUN useradd -m -u 1000 runner

# Set working directory
WORKDIR /workspace

# Switch to non-root user
USER runner

# Default command (will be overridden)
CMD ["python", "--version"]