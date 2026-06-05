# MaizYAgave

Welcome to the dance party!

MaizYAgave streams live instrumental music using [Google Lyria RealTime](https://ai.google.dev/gemini-api/docs/realtime-music-generation) (experimental). Enter a text prompt, press Play, and steer the sound by updating the prompt while music plays.

## Project structure

```
MaizYAgave/
├── backend/           # FastAPI + Lyria WebSocket relay
├── frontend/          # React (Vite) + Web Audio playback
├── docs/
│   └── VERIFICATION.md   # Browser test checklist (required for release)
├── .env.example
└── README.md
```

## Prerequisites

- Python 3.12+
- Node.js 20+
- A [Gemini API key](https://aistudio.google.com/apikey) with access to Lyria RealTime (`v1alpha`)

## Setup

1. Copy environment file and add your API key:

   ```bash
   cp .env.example .env
   # Edit .env and set GEMINI_API_KEY=...
   ```

2. Install and run the backend (uses a virtual environment in `backend/.venv`):

   ```bash
   cd backend
   python3.12 -m venv .venv   # or: python3 -m venv .venv
   .venv/bin/pip install -e .
   ./run.sh
   ```

   Or manually: `.venv/bin/uvicorn app.main:app --reload --port 8000`

3. Install and run the frontend (separate terminal):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open http://localhost:5173 — enter a prompt, click **Play**, then **Update sound** to steer while playing.

## Verification

Feature verification is tracked in [docs/VERIFICATION.md](docs/VERIFICATION.md). All core flows (V1–V5) must pass in a real browser before considering a release complete.

## Notes

- Lyria RealTime is **experimental** (`lyria-realtime-exp`, API `v1alpha`). Behavior and quotas may change.
- Output is **instrumental only** (no lyrics).
- After steering, the mix may take **5–10 seconds** to settle into the new style.
- The API key stays on the server; the browser only connects to the local FastAPI WebSocket relay.

## License

MIT — see [LICENSE](LICENSE).
