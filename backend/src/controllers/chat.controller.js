import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// Get or create a conversation between current user and another user
export const getOrCreateConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ message: "Please provide otherUserId." });
    }

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: "Invalid otherUserId." });
    }

    if (currentUserId.toString() === otherUserId) {
      return res.status(400).json({ message: "Cannot create conversation with yourself." });
    }

    // Verify the other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if user is student and other user is advisor (or vice versa)
    const isStudent = req.user.role === "student";
    const isOtherAdvisor = otherUser.role === "advisor" || otherUser.role === "fye_teacher" || otherUser.role === "peer_mentor";
    const isOtherStudent = otherUser.role === "student";
    const isCurrentAdvisor = req.user.role === "advisor" || req.user.role === "fye_teacher" || req.user.role === "peer_mentor";

    // Allow: student-advisor, student-mentor, student-fye_teacher, advisor-student, mentor-student, fye_teacher-student
    if (!((isStudent && isOtherAdvisor) || (isCurrentAdvisor && isOtherStudent))) {
      return res.status(403).json({ 
        message: "Conversations are only allowed between students and advisors/mentors." 
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, otherUserId] },
    }).populate("participants", "fullName email role");

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [currentUserId, otherUserId],
        unreadCount: new Map([
          [currentUserId.toString(), 0],
          [otherUserId.toString(), 0],
        ]),
      });
      await conversation.populate("participants", "fullName email role");
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Get or create conversation error:", error.message);
    return res.status(500).json({ message: "Server error while creating conversation." });
  }
};

// Get all conversations for the current user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "fullName email role")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    // Format conversations with other participant info
    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );
      
      // Handle Map serialization - convert to object if needed
      let unread = 0;
      if (conv.unreadCount instanceof Map) {
        unread = conv.unreadCount.get(userId.toString()) || 0;
      } else if (conv.unreadCount && typeof conv.unreadCount === 'object') {
        // If it's already an object (from MongoDB)
        unread = conv.unreadCount[userId.toString()] || 0;
      }

      return {
        _id: conv._id,
        otherParticipant: {
          _id: otherParticipant._id,
          fullName: otherParticipant.fullName,
          email: otherParticipant.email,
          role: otherParticipant.role,
        },
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: unread,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      conversations: formattedConversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error.message);
    return res.status(500).json({ message: "Server error while fetching conversations." });
  }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversationId." });
    }

    // Verify user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied." });
    }

    // Get messages
    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "fullName email role")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    // Reset unread count for this user
    // Handle Map initialization if needed
    if (!conversation.unreadCount) {
      conversation.unreadCount = new Map();
    }
    if (!(conversation.unreadCount instanceof Map)) {
      conversation.unreadCount = new Map(Object.entries(conversation.unreadCount || {}));
    }
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    return res.status(200).json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      page,
      limit,
    });
  } catch (error) {
    console.error("Get messages error:", error.message);
    return res.status(500).json({ message: "Server error while fetching messages." });
  }
};

// Send a message (REST endpoint - Socket.io will also handle this)
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;

    if (!conversationId || !content) {
      return res.status(400).json({ message: "Please provide conversationId and content." });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversationId." });
    }

    // Verify user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === senderId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied." });
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content: content.trim(),
    });

    await message.populate("sender", "fullName email role");

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();

    // Increment unread count for the other participant
    const otherParticipantId = conversation.participants.find(
      (p) => p.toString() !== senderId.toString()
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

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Send message error:", error.message);
    return res.status(500).json({ message: "Server error while sending message." });
  }
};

// Get available advisors/mentors for a student
export const getAvailableAdvisors = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role === "student") {
      // Get assigned advisor and mentor, plus all available advisors/mentors
      const [assignedAdvisor, assignedMentor, allAdvisors, allMentors, allFyeTeachers] = await Promise.all([
        user.advisor ? User.findById(user.advisor).select("fullName email role school") : null,
        user.mentor ? User.findById(user.mentor).select("fullName email role school") : null,
        User.find({ role: "advisor" }).select("fullName email role school"),
        User.find({ role: "peer_mentor" }).select("fullName email role school"),
        User.find({ role: "fye_teacher" }).select("fullName email role school"),
      ]);

      const available = [
        ...(assignedAdvisor ? [assignedAdvisor] : []),
        ...(assignedMentor ? [assignedMentor] : []),
        ...allAdvisors,
        ...allMentors,
        ...allFyeTeachers,
      ];

      // Remove duplicates
      const uniqueAvailable = available.filter(
        (item, index, self) => index === self.findIndex((t) => t._id.toString() === item._id.toString())
      );

      return res.status(200).json({
        success: true,
        advisors: uniqueAvailable,
      });
    } else if (user.role === "advisor" || user.role === "peer_mentor" || user.role === "fye_teacher") {
      // Get assigned students
      const students = await User.find({
        $or: [
          { advisor: userId },
          { mentor: userId },
        ],
        role: "student",
      }).select("fullName email role school major classification");

      return res.status(200).json({
        success: true,
        students,
      });
    } else {
      return res.status(403).json({ message: "Access denied." });
    }
  } catch (error) {
    console.error("Get available advisors error:", error.message);
    return res.status(500).json({ message: "Server error while fetching advisors." });
  }
};

