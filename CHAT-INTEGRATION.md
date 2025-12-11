# Chat Integration Guide

This document explains how the chat system is integrated with the frontend using Axios and Socket.io.

## Architecture Overview

The chat system uses a **hybrid approach**:
- **REST API (Axios)** for initial data loading and fallback operations
- **Socket.io** for real-time messaging and live updates

## Axios Configuration

The Axios instance is configured in `frontend/lib/api.ts`:

```typescript
const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Features:
- ✅ Automatic token injection from localStorage
- ✅ Automatic redirect to login on 401 errors
- ✅ Request/response interceptors for error handling

## Chat API Endpoints (REST)

All chat endpoints are available via `chatAPI` in `frontend/lib/api.ts`:

### 1. Get Conversations
```typescript
chatAPI.getConversations()
// GET /api/chat/conversations
// Returns: { success: boolean, conversations: Conversation[] }
```

### 2. Get or Create Conversation
```typescript
chatAPI.getOrCreateConversation(otherUserId: string)
// POST /api/chat/conversations
// Body: { otherUserId: string }
// Returns: { success: boolean, conversation: Conversation }
```

### 3. Get Messages
```typescript
chatAPI.getMessages(conversationId: string, page?: number, limit?: number)
// GET /api/chat/conversations/:conversationId/messages
// Returns: { success: boolean, messages: Message[], page, limit }
```

### 4. Send Message (REST Fallback)
```typescript
chatAPI.sendMessage(conversationId: string, content: string)
// POST /api/chat/messages
// Body: { conversationId: string, content: string }
// Returns: { success: boolean, message: Message }
```

### 5. Get Available Advisors/Students
```typescript
chatAPI.getAvailableAdvisors()
// GET /api/chat/available
// Returns: { success: boolean, advisors: User[] } or { success: boolean, students: User[] }
```

## Socket.io Integration

Socket.io client is configured in `frontend/lib/socket.ts`:

```typescript
import { getSocket, initializeSocket } from '../../lib/socket';

// Initialize connection (reuses existing if available)
const socket = initializeSocket();

// Get existing socket
const socket = getSocket();
```

### Socket Events

#### Client → Server:
- `join_conversation` - Join a conversation room
- `leave_conversation` - Leave a conversation room
- `send_message` - Send a message in real-time
- `typing` - Indicate user is typing
- `stop_typing` - Stop typing indicator
- `mark_read` - Mark messages as read

#### Server → Client:
- `new_message` - New message received
- `conversation_updated` - Conversation updated (new message, etc.)
- `user_typing` - Other user is typing
- `user_stopped_typing` - Other user stopped typing
- `messages_read` - Messages were read by other participant

## Frontend Components

### 1. BottomNav (`frontend/components/layout/BottomNav.tsx`)
- Shows unread message count badge on Chat icon
- Updates in real-time via Socket.io
- Refreshes every 30 seconds as fallback

### 2. Chat Page (`frontend/app/(main)/chat/page.tsx`)
- Lists all conversations
- Uses `chatAPI.getConversations()` to load data
- Real-time updates via Socket.io
- Clicking a conversation opens ChatWindow

### 3. ChatWindow (`frontend/components/chat/ChatWindow.tsx`)
- Real-time chat interface
- Uses Socket.io for instant messaging
- Falls back to REST API if socket unavailable
- Shows typing indicators
- Auto-scrolls to latest message

### 4. New Conversation Page (`frontend/app/(main)/chat/new/page.tsx`)
- Lists available advisors/students
- Uses `chatAPI.getAvailableAdvisors()`
- Creates conversation via `chatAPI.getOrCreateConversation()`

## Data Flow

### Loading Conversations:
1. Component mounts → `chatAPI.getConversations()` (Axios)
2. Socket.io connects → Listens for `conversation_updated` events
3. Real-time updates → Automatically refreshes conversation list

### Sending Messages:
1. User types message → Socket.io `send_message` event (preferred)
2. If socket unavailable → Falls back to `chatAPI.sendMessage()` (Axios)
3. Server broadcasts → Other participants receive via Socket.io

### Unread Counts:
1. BottomNav loads → `chatAPI.getConversations()` (Axios)
2. Calculates total unread → Sums `unreadCount` from all conversations
3. Real-time updates → Socket.io `new_message` event updates count
4. Periodic refresh → Every 30 seconds as backup

## Authentication

Both Axios and Socket.io use JWT tokens:

### Axios:
- Token stored in `localStorage.getItem('token')`
- Automatically added to `Authorization: Bearer <token>` header
- Interceptor handles 401 errors (redirects to login)

### Socket.io:
- Token passed in connection auth: `socket.io({ auth: { token } })`
- Server validates token on connection
- Invalid token → Connection rejected

## Error Handling

### Axios Errors:
- Network errors → Console error, user-friendly message
- 401 errors → Auto-redirect to `/login`
- Other errors → Displayed in UI

### Socket.io Errors:
- Connection errors → Console warning, falls back to REST
- Authentication errors → Redirect to login
- Message send errors → User notification, retry option

## Usage Examples

### Example 1: Load Conversations
```typescript
import { chatAPI } from '../../lib/api';

const loadConversations = async () => {
  try {
    const response = await chatAPI.getConversations();
    setConversations(response.conversations);
  } catch (error) {
    console.error('Failed to load conversations:', error);
  }
};
```

### Example 2: Send Message via Socket
```typescript
import { getSocket } from '../../lib/socket';

const socket = getSocket();
if (socket) {
  socket.emit('send_message', { conversationId, content });
} else {
  // Fallback to REST
  await chatAPI.sendMessage(conversationId, content);
}
```

### Example 3: Listen for Real-time Updates
```typescript
import { getSocket, initializeSocket } from '../../lib/socket';

useEffect(() => {
  const socket = initializeSocket();
  if (socket) {
    socket.on('new_message', (data) => {
      // Handle new message
      setMessages(prev => [...prev, data.message]);
    });
    
    return () => {
      socket.off('new_message');
    };
  }
}, []);
```

## Testing the Integration

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Login**: Use student or advisor account
4. **Navigate to Chat**: Click Chat in bottom navigation
5. **Start Conversation**: Click "Start a new conversation"
6. **Send Message**: Type and send a message
7. **Check Real-time**: Open in two browsers to test real-time updates

## Troubleshooting

### Messages not sending:
- Check browser console for errors
- Verify Socket.io connection (check Network tab)
- Verify JWT token in localStorage
- Check backend logs for errors

### Unread count not updating:
- Verify Socket.io connection
- Check if `conversation_updated` events are received
- Check browser console for errors

### Conversations not loading:
- Verify backend is running
- Check network tab for API calls
- Verify JWT token is valid
- Check CORS settings in backend

## Summary

✅ **Axios** handles all REST API calls (loading, creating, fetching)
✅ **Socket.io** handles real-time messaging and updates
✅ **BottomNav** shows unread count badge
✅ **Chat pages** fully integrated with backend
✅ **Error handling** and fallbacks in place
✅ **Authentication** via JWT tokens

The chat system is fully functional and ready to use!

