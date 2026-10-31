#!/bin/sh
# Container entrypoint. `exec` so node receives Docker's SIGTERM directly.
echo "NODE_ENV=${NODE_ENV:-<unset>}"
if [ "$NODE_ENV" = "development" ]; then
  exec ./node_modules/.bin/nodemon server.js
else
  exec node server.js
fi
