FROM node:18-alpine AS build
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "app.js"]
