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
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

FROM nginx:1.27-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
