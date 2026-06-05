from typing import Literal

from pydantic import BaseModel, Field

ClientMessageType = Literal["start", "steer", "stop", "pause", "warm"]
ServerState = Literal[
    "connecting", "warming", "playing", "paused", "stopped", "error"
]


class ClientMessage(BaseModel):
    type: ClientMessageType
    prompt: str | None = None


class StatusMessage(BaseModel):
    type: Literal["status"] = "status"
    state: ServerState
    message: str | None = None
