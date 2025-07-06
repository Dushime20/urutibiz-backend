# Communication System API Documentation

## Overview
The communication system provides RESTful endpoints for:
- User-to-user conversations and messages
- Support ticket management and messaging
- AI chat logs for support and automation

All endpoints are under `/communication`.

---

## Conversations

### Start a Conversation
**POST** `/communication/conversations`
```json
{
  "participant_1_id": "user-uuid-1",
  "participant_2_id": "user-uuid-2",
  "subject": "Booking Inquiry",
  "booking_id": "booking-uuid"
}
```

### Get a Conversation
**GET** `/communication/conversations/:id`

### Get User Conversations
**GET** `/communication/conversations/user/:userId`

### Archive a Conversation
**PATCH** `/communication/conversations/:id/archive`

### Block a Conversation
**PATCH** `/communication/conversations/:id/block`

---

## Messages

### Send a Message
**POST** `/communication/messages`
```json
{
  "conversation_id": "conversation-uuid",
  "sender_id": "user-uuid",
  "message_type": "text",
  "content": "Hello!"
}
```

### Get a Message
**GET** `/communication/messages/:id`

### Get Messages in a Conversation
**GET** `/communication/messages/conversation/:conversationId`

### Mark Message as Read
**PATCH** `/communication/messages/:id/read`

### Flag a Message
**PATCH** `/communication/messages/:id/flag`

### Edit a Message
**PATCH** `/communication/messages/:id/edit`
```json
{
  "content": "Edited message text"
}
```

---

## Support Tickets

### Create a Ticket
**POST** `/communication/tickets`
```json
{
  "user_id": "user-uuid",
  "subject": "Payment Issue",
  "description": "I have a problem with my payment.",
  "category": "payment",
  "priority": "high"
}
```

### Get a Ticket
**GET** `/communication/tickets/:id`

### Get User Tickets
**GET** `/communication/tickets/user/:userId`

### Update a Ticket
**PATCH** `/communication/tickets/:id`
```json
{
  "status": "pending",
  "priority": "urgent"
}
```

### Assign a Ticket
**PATCH** `/communication/tickets/:id/assign`
```json
{
  "assigned_to": "staff-uuid"
}
```

### Resolve a Ticket
**PATCH** `/communication/tickets/:id/resolve`
```json
{
  "resolution": "Issue resolved."
}
```

---

## Support Ticket Messages

### Add a Ticket Message
**POST** `/communication/ticket-messages`
```json
{
  "ticket_id": "ticket-uuid",
  "sender_id": "user-uuid",
  "message": "Here is more info.",
  "attachments": ["url1", "url2"]
}
```

### Get Ticket Messages
**GET** `/communication/ticket-messages/ticket/:ticketId`

---

## AI Chat Logs

### Log an AI Chat
**POST** `/communication/ai-chat-logs`
```json
{
  "user_id": "user-uuid",
  "session_id": "session-uuid",
  "user_message": "How do I reset my password?",
  "ai_response": "Click the reset link on the login page.",
  "intent_detected": "password_reset",
  "confidence_score": 0.98
}
```

### Get AI Chat Logs by Session
**GET** `/communication/ai-chat-logs/session/:sessionId`

### Get AI Chat Logs by User
**GET** `/communication/ai-chat-logs/user/:userId`

---

## Notes
- All endpoints return `{ success, data }` or `{ success, message }`.
- Use authentication middleware as needed.
- See `communication.types.ts` for all field definitions.

---

**UrutiBiz Communication System** — Modern, scalable, and AI-ready messaging and support platform.
