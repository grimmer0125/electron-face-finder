# !/bin/bash

# todo: need to find a better way to check if docker is running directly

if docker info| grep -q moby; then
	echo "docker is running"
else
	echo "not install or not running"

  # try to launch
  open -a Docker
  sleep 10

  if docker info| grep -q moby; then
    echo "docker is running"
  else
  	echo "not installed yet"
    # download and install docer for mac
  fi
fi
