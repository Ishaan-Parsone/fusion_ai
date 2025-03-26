# Use a slim Python image
FROM python:3.11.5-slim

# Set working directory
WORKDIR /app

# Install missing system dependencies, including Node.js and npm
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# Copy requirements file first
COPY backend/requirements.txt backend/

# Install uv
RUN pip install --no-cache-dir uv

# Install remaining dependencies
RUN uv pip install --no-cache-dir --system -r backend/requirements.txt

# Copy backend code
COPY backend /app/backend

# Set up Node.js for React
WORKDIR /app/frontend

# Copy package.json and install dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

# Copy frontend files
COPY frontend /app/frontend

# Set working directory back to app
WORKDIR /app

# Copy and use the entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose necessary ports
EXPOSE 4000 8001

# Run both services
CMD ["/app/entrypoint.sh"]
