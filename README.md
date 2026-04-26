<div align="center">

<img src="media/llm-manager-ui.png" width="120" alt="LLM Manager UI">

# LLM Manager UI

Web UI to manage Ollama LLM server models

![Python](https://img.shields.io/badge/python-%3E%3D3.13-blue?logo=python&logoColor=white)

<img src="media/example.png" width="666" alt="Example">
<img src="media/example2.png" width="666" alt="Example">
</div>


## Features

- View running models
- Lists all installed models
- Pull new models
- Update models (manually via update button)
- Delete old models
- Chat / Generate with any model

### Deploy
```bash
bash start.sh [options]
```
Options:
- `-h, --host HOST` - Ollama server host (default: localhost)
- `-p, --port PORT` - Ollama server port (default: 11434)
- `-b, --base-path PATH` - Public base path when hosting under a subdirectory (example: `/subdir1/app`)
- `--help` - Show help message

The script will:
- Create a Python virtual environment (if it doesn't exist)
- Install dependencies from requirements.txt
- Start the UI server on `http://localhost:5000`

### Docker
```bash
docker-compose up -d --build
```
- Change ENV in `docker-compose.yaml` if needed.
- `OLLAMA_URL` - URL of the Ollama server (default: `http://localhost:11434`)
- `BASE_PATH` - Public base path when hosting under a subdirectory (example: `/subdir1/app` for `http://example.com/subdir1/app`)
- `FIXED_MODELS` - Comma-separated models that should be pulled automatically when missing (default: empty)
  - Example: `llama3.2,mistral`
- `LOG_LEVEL` - Logging verbosity (default: `INFO`)
  - Options: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
  - `INFO` recommended for production (shows important operations without noise)
  - `DEBUG` for troubleshooting (shows all operations including frequent fetches)

**Access the UI** at `http://localhost:5000`

### Reverse proxy subpath

When the UI is published below a subpath, set `BASE_PATH` to the full public path:

```yaml
environment:
  - "BASE_PATH=/exampledir/app"
```

Don't forget to include for the location:
- proxy settings
- http connection upgrade for socket

## Contribution

Feel free to open issues or submit pull requests.
