.PHONY: all build clean run test install uninstall

# Variables
BINARY_NAME=voice-to-text
MODEL_DIR=vosk-model-small-en-us-0.15
MODEL_ZIP=$(MODEL_DIR).zip
MODEL_URL=https://alphacephei.com/vosk/models/$(MODEL_ZIP)

all: build

build:
	@echo "Building $(BINARY_NAME)..."
	go build -o $(BINARY_NAME) main.go
	@echo "Build complete!"

clean:
	@echo "Cleaning build files..."
	rm -f $(BINARY_NAME)
	@echo "Clean complete!"

run: build
	@echo "Running $(BINARY_NAME)..."
	./$(BINARY_NAME)

test:
	@echo "Running tests..."
	go test -v ./...

# Download and extract Vosk model
download-model:
	@echo "Downloading Vosk model..."
	@if [ ! -f "$(MODEL_ZIP)" ]; then \
		wget $(MODEL_URL); \
	else \
		echo "Model zip already exists."; \
	fi
	@if [ ! -d "$(MODEL_DIR)" ]; then \
		echo "Extracting model..."; \
		unzip $(MODEL_ZIP); \
	else \
		echo "Model directory already exists."; \
	fi

# Install system dependencies (Ubuntu/Debian)
install-deps:
	@echo "Installing system dependencies..."
	sudo apt-get update
	sudo apt-get install -y portaudio19-dev libportaudiocpp0
	@echo "Please also install Vosk library manually from https://github.com/alphacep/vosk-api/releases"

# Install to system paths
install: build
	@echo "Installing $(BINARY_NAME) to /usr/local/bin..."
	sudo cp $(BINARY_NAME) /usr/local/bin/
	@echo "Installation complete!"

uninstall:
	@echo "Uninstalling $(BINARY_NAME)..."
	sudo rm -f /usr/local/bin/$(BINARY_NAME)
	@echo "Uninstallation complete!"

# Show help
help:
	@echo "Available commands:"
	@echo "  make build          - Build the application"
	@echo "  make clean          - Clean build files"
	@echo "  make run            - Build and run the application"
	@echo "  make test           - Run tests"
	@echo "  make download-model - Download and extract Vosk model"
	@echo "  make install-deps   - Install system dependencies (Ubuntu/Debian)"
	@echo "  make install        - Install to /usr/local/bin"
	@echo "  make uninstall      - Remove from /usr/local/bin"
	@echo "  make help           - Show this help message"