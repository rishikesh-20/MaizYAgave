# MaizYAgave Backend

FastAPI app that relays Lyria RealTime PCM audio to the browser over `/ws/music`.

## Run

```bash
pip install -e .
uvicorn app.main:app --reload --port 8000
```

Requires `GEMINI_API_KEY` in the repo root `.env` or `backend/.env`.
