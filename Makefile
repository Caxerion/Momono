.PHONY: dev build run install-py install-ui

dev:
	pwsh scripts/dev.ps1

install-py:
	cd server && python -m pip install -r requirements.txt

install-ui:
	cd ui && npm install

build: install-ui
	cd ui && npm run build

run:
	cd init && go run main.go
