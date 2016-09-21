run:
	npm run debug &
	./scripts/docker-stop.sh & ./scripts/docker-start-debug.sh
