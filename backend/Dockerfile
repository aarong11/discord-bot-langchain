FROM node:18.19.0-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./
COPY .nvmrc ./

# Install all dependencies (including dev dependencies for building)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Remove dev dependencies to reduce image size
RUN yarn install --production --frozen-lockfile

# Create necessary directories
RUN mkdir -p data temp

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["yarn", "start"]