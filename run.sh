#!/bin/sh
# Container entrypoint. `exec` so node receives Docker's SIGTERM directly.
echo "NODE_ENV=${NODE_ENV:-<unset>}"
if [ "$NODE_ENV" = "development" ]; then
  # --conditions development: make Node resolve react-router to the same (development)
  # build that Vite loads. Otherwise two copies load and React Router rejects the
  # RouterContextProvider from server/app.ts ("Invalid `context` value").
  export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--conditions=development"
  exec ./node_modules/.bin/nodemon server.js
else
  exec node server.js
fi
