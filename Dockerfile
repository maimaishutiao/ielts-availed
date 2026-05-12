FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY dashboard/package*.json ./dashboard/
RUN cd dashboard && npm ci

COPY . .
RUN cd dashboard && npm run build

FROM node:20-alpine

WORKDIR /app

ENV HOME=/data
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dashboard/dist ./dashboard/dist
COPY scripts ./scripts
COPY docker/entrypoint.sh ./docker/entrypoint.sh
COPY docker/server.js ./docker/server.js

RUN chmod +x ./docker/entrypoint.sh

VOLUME ["/data"]
EXPOSE 8080

ENTRYPOINT ["./docker/entrypoint.sh"]
