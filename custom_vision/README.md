# Build the Docker image
docker build -t myapp .

# Run the container
docker run -p 3000:3000 -p 8000:8000 myapp
