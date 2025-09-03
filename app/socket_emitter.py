# app/socket_emitter.py
from app.socket import sio
import asyncio

async def emit_chat_message(session_id: str, message: dict):
    """Emits a message to the room."""
    room = f"chat_{session_id}"
    await sio.emit('new_chat_message', message, room=room)
