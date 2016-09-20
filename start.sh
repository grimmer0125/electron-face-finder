docker stop faceserver
docker rm faceserver
echo "try to docker run"
docker run -d -p 9000:9000 -v $(pwd)/electricface/:/demo -t -i --name faceserver grimmer0125/openface-nostartdemo bash -c "/demo/src/run.sh"
