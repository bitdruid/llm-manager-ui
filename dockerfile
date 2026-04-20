FROM python:3.13-slim

COPY llmm /llmm/llmm
COPY pyproject.toml /llmm/pyproject.toml
COPY requirements.txt /llmm/requirements.txt

RUN --mount=type=secret,id=pip_conf,target=/etc/pip.conf \
    if [ -f /etc/pip.conf ]; then \
    PIP_CONFIG_FILE=/etc/pip.conf pip install /llmm; \
    else \
    pip install /llmm; \
    fi

WORKDIR /llmm/llmm

CMD [ "uvicorn", "llmm:sio_llmm", "--host", "0.0.0.0", "--port", "5000" ]
