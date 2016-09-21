echo "try to docker run"
docker run -d -p 9000:9000 -v $(pwd)/electricface/:/electricface -t -i --name faceserver grimmer0125/openface-nostartdemo bash -c "/electricface/src/run.sh"
