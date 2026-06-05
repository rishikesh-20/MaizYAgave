"""WebSocket relay between browser and Lyria RealTime."""

from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.lyria.session import LyriaSession, create_lyria_session
from app.lyria.types import ClientMessage, StatusMessage

logger = logging.getLogger(__name__)
router = APIRouter()

# Loaded at connect time; playback starts only after the user generates.
WARM_PROMPT = (
    "Neutral electronic ambient bed, soft rhythm, minimal texture, 120 BPM"
)


async def _send_status(ws: WebSocket, state: str, message: str | None = None) -> None:
    payload = StatusMessage(state=state, message=message)  # type: ignore[arg-type]
    await ws.send_text(payload.model_dump_json())


class MusicWebSocketHandler:
    def __init__(self, websocket: WebSocket) -> None:
        self.websocket = websocket
        self.lyria: LyriaSession | None = None
        self._lock = asyncio.Lock()
        self._heard_audio = False

    def _reset_audio_gate(self) -> None:
        self._heard_audio = False

    async def _mark_warming(self, message: str = "Warming up…") -> None:
        self._reset_audio_gate()
        await _send_status(self.websocket, "warming", message)

    async def on_pcm_chunk(self, data: bytes) -> None:
        if not self._heard_audio:
            self._heard_audio = True
            await _send_status(self.websocket, "playing", "Streaming music.")
        await self.websocket.send_bytes(data)

    async def on_lyria_error(self, message: str) -> None:
        await _send_status(self.websocket, "error", message)

    async def _ensure_lyria(self) -> LyriaSession:
        if self.lyria is None:
            self.lyria = create_lyria_session()
        return self.lyria

    async def handle_warm(self) -> None:
        async with self._lock:
            lyria = await self._ensure_lyria()
            if lyria.is_connected:
                await _send_status(
                    self.websocket,
                    "stopped",
                    "Studio ready. Choose moods to generate.",
                )
                return

            await _send_status(
                self.websocket, "connecting", "Preparing studio…"
            )
            try:
                await lyria.warm(
                    WARM_PROMPT,
                    on_chunk=self.on_pcm_chunk,
                    on_error=self.on_lyria_error,
                )
                await _send_status(
                    self.websocket,
                    "stopped",
                    "Studio ready. Choose moods to generate.",
                )
            except Exception as exc:  # noqa: BLE001
                logger.exception("Failed to warm Lyria session")
                if self.lyria:
                    await self.lyria.stop()
                    self.lyria = None
                await _send_status(
                    self.websocket, "error", _format_start_error(exc)
                )

    async def handle_start(self, prompt: str) -> None:
        async with self._lock:
            prompt = prompt.strip()
            if not prompt:
                await _send_status(self.websocket, "error", "Prompt cannot be empty.")
                return

            lyria = await self._ensure_lyria()

            if lyria.is_connected:
                await self._mark_warming("Generating beats…")
                try:
                    await lyria.begin_generation(prompt)
                except Exception as exc:  # noqa: BLE001
                    logger.exception("Failed to begin generation on warm session")
                    await _send_status(
                        self.websocket, "error", _format_start_error(exc)
                    )
                return

            await _send_status(self.websocket, "connecting", "Connecting to Lyria…")
            try:
                await lyria.connect(
                    on_chunk=self.on_pcm_chunk,
                    on_error=self.on_lyria_error,
                )
                await lyria.prepare(prompt)
                await self._mark_warming("Warming up…")
                await lyria.begin_generation(prompt)
            except Exception as exc:  # noqa: BLE001
                logger.exception("Failed to start Lyria session")
                if self.lyria:
                    await self.lyria.stop()
                    self.lyria = None
                await _send_status(
                    self.websocket, "error", _format_start_error(exc)
                )

    async def handle_steer(self, prompt: str) -> None:
        async with self._lock:
            prompt = prompt.strip()
            if not prompt:
                await _send_status(self.websocket, "error", "Prompt cannot be empty.")
                return
            if not self.lyria or not self.lyria.is_connected:
                await _send_status(
                    self.websocket,
                    "error",
                    "No active session. Press Play first.",
                )
                return
            try:
                await self._mark_warming("Updating mix…")
                await self.lyria.steer(prompt)
            except Exception as exc:  # noqa: BLE001
                logger.exception("Steer failed")
                await _send_status(self.websocket, "error", f"Steer failed: {exc}")

    async def handle_stop(self) -> None:
        async with self._lock:
            if self.lyria:
                await self.lyria.stop()
                self.lyria = None
            self._reset_audio_gate()
            await _send_status(self.websocket, "stopped", "Playback stopped.")

    async def cleanup(self) -> None:
        if self.lyria:
            await self.lyria.stop()
            self.lyria = None


def _format_start_error(exc: Exception) -> str:
    detail = str(exc)
    if "API key not valid" in detail:
        return (
            "API key not valid. Set a valid GEMINI_API_KEY in .env "
            "(see .env.example)."
        )
    return f"Could not start music generation: {detail}"


@router.websocket("/ws/music")
async def music_websocket(websocket: WebSocket) -> None:
    await websocket.accept()
    handler = MusicWebSocketHandler(websocket)
    await _send_status(
        websocket, "stopped", "Click the DJ booth to choose moods and generate beats."
    )

    try:
        while True:
            raw = await websocket.receive()
            if raw.get("type") == "websocket.disconnect":
                break

            if "bytes" in raw and raw["bytes"]:
                continue

            text = raw.get("text")
            if not text:
                continue

            try:
                data = json.loads(text)
                msg = ClientMessage.model_validate(data)
            except Exception:  # noqa: BLE001
                await _send_status(websocket, "error", "Invalid message format.")
                continue

            if msg.type == "warm":
                await handler.handle_warm()
            elif msg.type == "start" and msg.prompt:
                await handler.handle_start(msg.prompt)
            elif msg.type == "steer" and msg.prompt:
                await handler.handle_steer(msg.prompt)
            elif msg.type == "stop":
                await handler.handle_stop()
            elif msg.type == "pause":
                await _send_status(websocket, "paused", "Pause not implemented in MVP.")
            else:
                await _send_status(websocket, "error", "Unknown or incomplete message.")

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    finally:
        await handler.cleanup()
