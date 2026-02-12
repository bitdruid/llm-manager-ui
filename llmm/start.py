import uvicorn

if __name__ == "__main__":
    uvicorn.run("llmm:sio_llmm", host="0.0.0.0", port=5000, reload=True)
