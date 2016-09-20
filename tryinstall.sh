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
