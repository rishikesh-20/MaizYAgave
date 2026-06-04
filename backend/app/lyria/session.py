"""Lyria RealTime session wrapper."""

from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Awaitable, Callable
from contextlib import AbstractAsyncContextManager
from typing import Any

from google import genai
from google.genai import types

from app.config import get_settings

logger = logging.getLogger(__name__)

MODEL = "models/lyria-realtime-exp"
PROMPT_THROTTLE_SEC = 0.25


def _extract_pcm(message: Any) -> bytes | None:
    server_content = getattr(message, "server_content", None)
    if not server_content:
        return None
    chunks = getattr(server_content, "audio_chunks", None)
    if not chunks:
        return None
    if isinstance(chunks, list):
        if not chunks:
            return None
        chunk = chunks[0]
    else:
        chunk = chunks
    data = getattr(chunk, "data", None)
    if data is None and isinstance(chunk, (bytes, bytearray)):
        return bytes(chunk)
    if isinstance(data, (bytes, bytearray)):
        return bytes(data)
    return None


class LyriaSession:
    """Manages one Lyria RealTime connection and audio pump."""

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key
        self._client = genai.Client(
            api_key=api_key,
            http_options={"api_version": "v1alpha"},
        )
        self._connect_cm: AbstractAsyncContextManager[Any] | None = None
        self._session: Any = None
        self._pump_task: asyncio.Task[None] | None = None
        self._active = False
        self._last_prompt_at = 0.0

    @property
    def is_active(self) -> bool:
        return self._active and self._session is not None

    async def start(
        self,
        prompt: str,
        on_chunk: Callable[[bytes], Awaitable[None]],
        on_error: Callable[[str], Awaitable[None]],
    ) -> None:
        if self.is_active:
            await self.stop()

        self._connect_cm = self._client.aio.live.music.connect(model=MODEL)
        self._session = await self._connect_cm.__aenter__()
        self._active = True
        self._pump_task = asyncio.create_task(
            self._pump_audio(on_chunk, on_error),
            name="lyria-audio-pump",
        )
        await self._set_prompt(prompt)
        await self._session.set_music_generation_config(
            config=types.LiveMusicGenerationConfig(temperature=1.0)
        )
        await self._session.play()

    async def steer(self, prompt: str) -> None:
        if not self.is_active:
            raise RuntimeError("No active Lyria session")
        await self._set_prompt(prompt)

    async def stop(self) -> None:
        self._active = False
        if self._pump_task and not self._pump_task.done():
            self._pump_task.cancel()
            try:
                await self._pump_task
            except asyncio.CancelledError:
                pass
        self._pump_task = None

        session = self._session
        self._session = None
        if session is not None:
            try:
                if hasattr(session, "stop"):
                    await session.stop()
            except Exception as exc:  # noqa: BLE001
                logger.warning("Lyria stop: %s", exc)

        if self._connect_cm is not None:
            try:
                await self._connect_cm.__aexit__(None, None, None)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Lyria disconnect: %s", exc)
            self._connect_cm = None

    async def _set_prompt(self, text: str) -> None:
        now = time.monotonic()
        elapsed = now - self._last_prompt_at
        if elapsed < PROMPT_THROTTLE_SEC:
            await asyncio.sleep(PROMPT_THROTTLE_SEC - elapsed)
        self._last_prompt_at = time.monotonic()
        await self._session.set_weighted_prompts(
            prompts=[types.WeightedPrompt(text=text.strip(), weight=1.0)]
        )

    async def _pump_audio(
        self,
        on_chunk: Callable[[bytes], Awaitable[None]],
        on_error: Callable[[str], Awaitable[None]],
    ) -> None:
        assert self._session is not None
        try:
            while self._active:
                async for message in self._session.receive():
                    if not self._active:
                        break
                    pcm = _extract_pcm(message)
                    if pcm:
                        await on_chunk(pcm)
                await asyncio.sleep(1e-6)
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001
            logger.exception("Lyria audio pump failed")
            await on_error(str(exc))


def create_lyria_session() -> LyriaSession:
    settings = get_settings()
    api_key = settings.require_api_key()
    return LyriaSession(api_key=api_key)
