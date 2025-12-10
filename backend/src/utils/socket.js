import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

// Socket.io authentication middleware
export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    next(new Error("Authentication error: Invalid token"));
  }
};

// Initialize socket.io handlers
export const initializeSocket = (io) => {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.fullName} (${socket.userId})`);

    // Join room for user's conversations
    socket.join(`user:${socket.userId}`);

    // Join a specific conversation room
    socket.on("join_conversation", async (conversationId) => {
      try {
        // Verify user is a participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === socket.userId
        );

        if (!isParticipant) {
          socket.emit("error", { message: "Access denied" });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        socket.emit("joined_conversation", { conversationId });
      } catch (error) {
        console.error("Join conversation error:", error.message);
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    // Leave a conversation room
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle sending a message
    socket.on("send_message", async (data) => {
      try {
        const { conversationId, content } = data;

        if (!conversationId || !content || !content.trim()) {
          socket.emit("error", { message: "conversationId and content are required" });
          return;
        }

        // Verify user is a participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === socket.userId
        );

        if (!isParticipant) {
          socket.emit("error", { message: "Access denied" });
          return;
        }

        // Create message
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          content: content.trim(),
        });

        await message.populate("sender", "fullName email role");

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();

        // Increment unread count for the other participant
        const otherParticipantId = conversation.participants.find(
          (p) => p.toString() !== socket.userId
        );
        
        // Handle Map initialization if needed
        if (!conversation.unreadCount) {
          conversation.unreadCount = new Map();
        }
        if (!(conversation.unreadCount instanceof Map)) {
          conversation.unreadCount = new Map(Object.entries(conversation.unreadCount || {}));
        }
        
        const currentUnread = conversation.unreadCount.get(otherParticipantId.toString()) || 0;
        conversation.unreadCount.set(otherParticipantId.toString(), currentUnread + 1);

        await conversation.save();

        // Emit to all participants in the conversation room
        io.to(`conversation:${conversationId}`).emit("new_message", {
          message,
        });

        // Also notify the other participant if they're not in the room
        io.to(`user:${otherParticipantId}`).emit("conversation_updated", {
          conversationId,
          lastMessage: message,
        });
      } catch (error) {
        console.error("Send message error:", error.message);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle typing indicator
    socket.on("typing", (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit("user_typing", {
        userId: socket.userId,
        userName: socket.user.fullName,
        conversationId,
      });
    });

    socket.on("stop_typing", (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit("user_stopped_typing", {
        userId: socket.userId,
        conversationId,
      });
    });

    // Handle message read status
    socket.on("mark_read", async (data) => {
      try {
        const { conversationId } = data;

        // Mark all messages in conversation as read for this user
        await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: socket.userId },
            read: false,
          },
          {
            read: true,
            readAt: new Date(),
          }
        );

        // Reset unread count
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          // Handle Map initialization if needed
          if (!conversation.unreadCount) {
            conversation.unreadCount = new Map();
          }
          if (!(conversation.unreadCount instanceof Map)) {
            conversation.unreadCount = new Map(Object.entries(conversation.unreadCount || {}));
          }
          conversation.unreadCount.set(socket.userId, 0);
          await conversation.save();
        }

        // Notify other participant
        const otherParticipantId = conversation.participants.find(
          (p) => p.toString() !== socket.userId
        );
        io.to(`user:${otherParticipantId}`).emit("messages_read", {
          conversationId,
          userId: socket.userId,
        });
      } catch (error) {
        console.error("Mark read error:", error.message);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user?.fullName || socket.userId}`);
    });
  });
};

