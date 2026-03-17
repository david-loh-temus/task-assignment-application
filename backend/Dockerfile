FROM node:22-alpine AS base
WORKDIR /app
ENV HUSKY=0
COPY package*.json ./
RUN npm ci

FROM base AS build
COPY . .
RUN npm run build

FROM base AS dev
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV HUSKY=0
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/build ./build
EXPOSE 4000
CMD ["node", "build/index.js"]
