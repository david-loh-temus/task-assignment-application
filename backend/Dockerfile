FROM node:22-alpine AS base
WORKDIR /app
ENV HUSKY=0
COPY package*.json ./
RUN npm ci

FROM base AS build
COPY . .
# Ensure Prisma client is generated (needed for TS types) before compiling
# prisma generate only parses the schema for types, doesn't need actual DB connection
ENV DATABASE_URL=postgresql://localhost/dummy
RUN npm run prisma:generate
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

# Copy generated Prisma client files from the build stage into the production image.
# `prisma generate` writes runtime files into node_modules/.prisma and node_modules/@prisma/client
# Ensure these are present in production so `require('@prisma/client')` can load the generated client.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
EXPOSE 4000
CMD ["node", "build/index.js"]
