#!/bin/bash


# function die { echo $1; exit 42; }

WEBSOCKET_PORT=9000

# the path where the scripr exist
cd $(dirname $0)

trap 'kill $(jobs -p)' EXIT

cat <<EOF

Starting the Electron-WebSocket server on port $WEBSOCKET_PORT.

Access the demo through the HTTP server in your browser.
If you're running on the same computer outside of Docker, use http://localhost:$HTTP_PORT
If you're running on the same computer with Docker, find the IP
address of the Docker container and use http://<docker-ip>:$HTTP_PORT.
If you're running on a remote computer, find the IP address
and use http://<remote-ip>:$HTTP_PORT.

WARNING: Chromium refuses to connect to the insecure WebSocket server
if you are running a remote or Docker deployment.
We have posted a workaround to forward traffic through localhost
using ncat at http://cmusatyalab.github.io/openface/demo-1-web/.
Track our progress on fixing this at:
https://github.com/cmusatyalab/openface/issues/75.


EOF

WEBSOCKET_LOG='/tmp/openface.websocket.log'
printf "WebSocket Server: Logging to '%s'\n\n" $WEBSOCKET_LOG

cd ../../ # Root OpenFace directory.
./demos/web/electron-server.py --port $WEBSOCKET_PORT 2>&1 | tee $WEBSOCKET_LOG &

wait
