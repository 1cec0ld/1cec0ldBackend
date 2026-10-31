# One Dockerfile for production (Dokku) and local dev (docker-compose).
# Production uses the defaults. docker-compose.yml passes NPM_OMIT="" so dev also
# gets devDependencies (Vite, nodemon); run.sh picks nodemon vs node from NODE_ENV.

# ---- 1) deps: runtime node_modules (full image has the toolchain for native modules like better-sqlite3)
FROM node:26-bookworm AS deps
WORKDIR /usr/src/app
ARG NPM_OMIT="--omit=dev"
COPY package*.json ./
RUN npm ci ${NPM_OMIT}

# ---- 2) builder: all dependencies, then the React Router build (build/client + build/server)
FROM node:26-bookworm AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- 3) runtime: slim image with runtime node_modules, source and build output
FROM node:26-bookworm-slim
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
# The whole source tree, not a file list: .dockerignore keeps secrets, node_modules,
# git metadata and build output out. Dev runs from this source through Vite.
COPY . .
COPY --from=builder /usr/src/app/build ./build

EXPOSE 3000
CMD ["sh", "./run.sh"]
