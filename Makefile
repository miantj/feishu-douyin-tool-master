.PHONY: venv, install, clean, help, build-frontend, run, dev, test

all: venv install
	@echo "Build success"

venv:
	python3 -m venv .venv

install:
	. .venv/bin/activate; pip3 install -r requirements.txt -i https://pypi.org/simple
	
clean:
	rm -rf .venv
	rm -rf .cache
	rm -rf .log
	rm -rf frontend/dist
	rm -rf frontend/node_modules
	find ./data -name "*.db" -type f -delete
	find . -depth -name "__pycache__" -type d -exec rm -rf {} \;

build-frontend:
	cd frontend && npm install && npm run build

module ?= ''
test: venv install
	. .venv/bin/activate; python3 test/main.py -m $(module)

port ?= 8080
run: venv install build-frontend
	. .venv/bin/activate; .venv/bin/uvicorn --host 0.0.0.0 --port $(port) main:app

dev: venv install
	. .venv/bin/activate; .venv/bin/uvicorn --host 0.0.0.0 --port $(port) --reload main:app

help:
	@echo "Available targets:"
	@echo "  venv           Create a virtual environment"
	@echo "  install        Install dependencies"
	@echo "  build-frontend Build frontend dist files"
	@echo "  clean          Remove all build artifacts、venv、 cache、logs and database"
	@echo "  test           Run test cases"
	@echo "  run            Build frontend and run the application"
	@echo "  dev            Run the application in development mode with reload"
