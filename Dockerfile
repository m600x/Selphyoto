FROM node:24-alpine AS build
WORKDIR /app
ARG COMMIT_HASH=dev
ENV COMMIT_HASH=${COMMIT_HASH}
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
