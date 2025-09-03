# app/socket.py
import socketio
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.chat import ChatMessage, ChatSession

# Create the socket.io server FIRST, before using it as decorator
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",  # allow React dev server
)
app = socketio.ASGIApp(sio)  # exported for uvicorn


@sio.event
async def connect(sid, environ, auth):
    """Handle client connection."""
    print(f"Client {sid} connected")

    # You can extract user info from auth token here if needed
    token = auth.get('token') if auth else None
    if token:
        # Store user info with socket ID for later use
        print(f"User authenticated with token: {token}")


@sio.event
async def join_chat_room(sid, data):
    """Join a chat room for real-time messaging."""
    try:
        session_id = data.get('session_id')
        user_id = data.get('user_id')

        if not session_id or not user_id:
            await sio.emit('error', {'message': 'Session ID and User ID required'}, room=sid)
            return

        # Join the room
        room_name = f"chat_{session_id}"
        await sio.enter_room(sid, room_name)
        print(f"Client {sid} joined room {room_name}")

        await sio.emit('joined_chat', {'session_id': session_id}, room=sid)

    except Exception as e:
        print(f"Error joining chat room: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)


@sio.event
async def leave_chat_room(sid, data):
    """Leave a chat room."""
    try:
        session_id = data.get('session_id')
        if session_id:
            room_name = f"chat_{session_id}"
            await sio.leave_room(sid, room_name)
            print(f"Client {sid} left room {room_name}")
            await sio.emit('left_chat', {'session_id': session_id}, room=sid)
    except Exception as e:
        print(f"Error leaving chat room: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)


@sio.event
async def typing_indicator(sid, data):
    """Handle typing indicators in chat."""
    try:
        session_id = data.get('session_id')
        user_name = data.get('user_name')
        is_typing = data.get('is_typing', False)

        if session_id:
            room_name = f"chat_{session_id}"
            await sio.emit('user_typing', {
                'user_name': user_name,
                'is_typing': is_typing
            }, room=room_name, skip_sid=sid)

    except Exception as e:
        print(f"Error handling typing indicator: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)


@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")


# NEW: Function to emit message from backend services
async def emit_new_message(session_id: str, message_data: dict):
    """Emit new message to all clients in the chat room."""
    try:
        room_name = f"chat_{session_id}"
        await sio.emit('new_chat_message', message_data, room=room_name)
        print(f"Emitted message to room {room_name}")
    except Exception as e:
        print(f"Error emitting message: {e}")
