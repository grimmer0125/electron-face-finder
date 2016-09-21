echo "try to docker run"
docker run -d -p 9000:9000 -v $(pwd)/mlserver/electricface/:/root/openface/electricface -t -i --name faceserver grimmer0125/openface-nostartdemo bash -c "/root/openface/electricface/src/run.sh"
