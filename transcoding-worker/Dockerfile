FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy worker script
COPY worker.ts ./

# Run the worker
CMD ["npx", "tsx", "worker.ts"]
