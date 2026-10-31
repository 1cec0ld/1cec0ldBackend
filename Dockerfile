# One Dockerfile for production (Dokku) and local dev (docker-compose).
# Production uses the defaults. docker-compose.yml passes NPM_OMIT="" so dev also
# gets devDependencies (nodemon); run.sh picks nodemon vs node from NODE_ENV.

# ---- 1) deps: install node_modules (full image has the toolchain for native modules like better-sqlite3)
FROM node:26-bookworm AS deps
WORKDIR /usr/src/app
ARG NPM_OMIT="--omit=dev"
COPY package*.json ./
RUN npm ci ${NPM_OMIT}

# ---- 2) runtime: slim image with node_modules + source
FROM node:26-bookworm-slim
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
# .dockerignore keeps secrets, node_modules and git metadata out of this copy.
COPY . .

EXPOSE 3000
CMD ["sh", "./run.sh"]
