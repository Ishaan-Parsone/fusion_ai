# Use Debian-based Python image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy only requirements first to optimize layer caching
COPY requirements.txt .

# Install uv and dependencies
RUN pip install uv && uv pip install --no-cache-dir --system -r requirements.txt

# Copy the rest of the application files
COPY . .

# Expose the Streamlit default port
EXPOSE 8501

# Run Streamlit app
CMD ["streamlit", "run", "app.py", "--server.port=8503", "--server.address=0.0.0.0"]
