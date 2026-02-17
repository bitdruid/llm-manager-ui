#!/bin/bash

# LLM Manager UI - Local Start Script

cd "$(dirname "$0")"

# Default values
OLLAMA_HOST="localhost"
OLLAMA_PORT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            OLLAMA_HOST="$2"
            shift 2
            ;;
        -p|--port)
            OLLAMA_PORT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -h, --host HOST    Ollama server host (default: localhost)"
            echo "  -p, --port PORT    Ollama server port (optional)"
            echo "      --help         Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

OLLAMA_HOST="${OLLAMA_HOST#https://}"
OLLAMA_HOST="${OLLAMA_HOST#http://}"

# Set Ollama URL from arguments or environment
if [ -n "$OLLAMA_PORT" ]; then
    export OLLAMA_URL="${OLLAMA_URL:-http://$OLLAMA_HOST:$OLLAMA_PORT}"
else
    export OLLAMA_URL="${OLLAMA_URL:-http://$OLLAMA_HOST}"
fi

echo "Starting LLM Manager UI"
echo "Ollama URL: $OLLAMA_URL"
echo ""

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "Installing dependencies..."
    pip install -e .
else
    source venv/bin/activate
fi

# Run uvicorn from project root
uvicorn llmm:sio_llmm --host 0.0.0.0 --port 5000 --reload