# Use an official Node.js runtime as the parent image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install project dependencies
RUN npm cache clean --force && npm install --legacy-peer-deps

# Copy the rest of the application source code
COPY . .

# Expose the port the frontend will run on
EXPOSE 3001

# Command to start the development server
CMD ["npm", "run", "dev", "--", "-p", "3001"]
