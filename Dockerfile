FROM node:22-alpine AS frontend-builder
 
WORKDIR /frontend
 
COPY Frontend/package.json Frontend/package-lock.json ./
RUN npm ci
 
COPY Frontend/ ./

# Set up the environment for the build
ENV NODE_ENV=production

# Install Vite and other build tools
RUN npm install -g vite

RUN npm run build:docker
 
# Stage 2: Base build stage
FROM python:3.13-slim AS builder
 
# Create the app directory
RUN mkdir /app
 
# Set the working directory
WORKDIR /app
 
# Set environment variables to optimize Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1 
 
# Upgrade pip and install dependencies
RUN pip install --upgrade pip 
 
# Copy the requirements file first (better caching)
COPY requirements.txt /app/
 
# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
 
# Stage 3: Production stage
FROM python:3.13-slim
 
RUN useradd -m -r appuser && \
   mkdir /app && \
   chown -R appuser /app
 
RUN apt-get update && apt-get install -y default-mysql-client && rm -rf /var/lib/apt/lists/*
 
# Copy the Python dependencies from the builder stage
COPY --from=builder /usr/local/lib/python3.13/site-packages/ /usr/local/lib/python3.13/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/
 
# Set the working directory
WORKDIR /app
 
# Copy application code
COPY --chown=appuser:appuser . .
 
# Copy built frontend assets into the image (will be copied to the shared static volume at runtime)
COPY --from=frontend-builder /frontend/dist /app/frontend_dist
 
# Set environment variables to optimize Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1 
 
# Switch to non-root user
USER appuser
 
# Expose the application port
EXPOSE 8001

RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]