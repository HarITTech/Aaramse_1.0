FROM node:20-slim

# Set environment variables
ENV NODE_ENV=production

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
# Using npm ci because it's faster and more reliable for production builds
RUN npm ci --only=production

# Copy app source
COPY . .

# Create uploads directory (ensure it has correct permissions if needed)
RUN mkdir -p uploads

# Expose the port the app runs on
EXPOSE 5000

# Run the app
CMD [ "node", "server.js" ]