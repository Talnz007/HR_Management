# Use an official Node.js runtime as the parent image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only package files first to leverage caching
COPY package*.json ./

# Install project dependencies with retries & no peer dep issues
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm install --legacy-peer-deps --network-timeout=100000

# Copy the rest of the app source code
COPY . .

# Create a non-root user and set permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

# Switch to non-root user for security
USER nextjs

# Expose the port
EXPOSE 3001

# Start the development server
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3001"]
