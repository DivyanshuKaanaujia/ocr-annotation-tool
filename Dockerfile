# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p New_ocr Old_ocr images

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
