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

    echo "try to download"
    cd $HOME/Downloads
    curl -o DockerMac.dmg https://download.docker.com/mac/stable/Docker.dmg

    # MOUNTPOINT="/Volumes/MountPoint"
    hdiutil attach DockerMac.dmg
    ditto -rsrc "/Volumes/Docker/Docker.app" /Applications/Docker.app
    hdiutil detach "/Volumes/Docker"
    rm DockerMac.dmg
    cd -
    echo "finish downloading"

    echo "try to open Docker"
    open -a Docker
    sleep 15
    echo "after 20s ..."
  fi
fi

if [[ "$(docker images -q grimmer0125/openface-nostartdemo:latest 2> /dev/null)" == "" ]]; then
  # do something
  echo "try to pull docker image"
  docker pull grimmer0125/openface-nostartdemo
fi
# echo "try to pull image"
# docker pull grimmer0125/openface-nostartdemo
# echo "after pulling"
