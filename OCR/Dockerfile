# Use Debian-based Node.js image
FROM node:20-slim

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for better caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the Vite default port
EXPOSE 5173

# Run the app in development mode
CMD ["npm", "run", "dev", "--", "--host"]
