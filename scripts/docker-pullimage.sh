if [[ "$(docker images -q grimmer0125/openface-nostartdemo:latest 2> /dev/null)" == "" ]]; then
  # do something
  echo "try to pull docker image"
  docker pull grimmer0125/openface-nostartdemo
fi
