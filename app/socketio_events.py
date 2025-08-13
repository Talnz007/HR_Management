# app/socketio_events.py
from app.socket import sio

async def emit_new_message(session_id: str, message_data: dict):
    room_name = f"chat_{session_id}"
    await sio.emit('new_chat_message', message_data, room=room_name)
