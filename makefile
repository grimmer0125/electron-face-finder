run:
	npm run dev &
	./scripts/docker-stop.sh & ./scripts/docker-start-dev.sh
