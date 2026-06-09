FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json .
RUN npm install -g @nestjs/cli
COPY . .
RUN npm install
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000 1812 161/udp
CMD ["node", "dist/main"]