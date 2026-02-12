FROM python:3.13-slim

COPY llmm /llmm/llmm
COPY pyproject.toml /llmm/pyproject.toml
COPY requirements.txt /llmm/requirements.txt

RUN pip install /llmm

WORKDIR /llmm/llmm

CMD [ "uvicorn", "llmm:sio_llmm", "--host", "0.0.0.0", "--port", "5000" ]