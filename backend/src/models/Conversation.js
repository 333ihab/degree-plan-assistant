import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    // For student-advisor conversations, we'll have exactly 2 participants
    // One student and one advisor
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    // Track unread messages per participant
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for efficient querying
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Method to get the other participant
conversationSchema.methods.getOtherParticipant = function (userId) {
  return this.participants.find(
    (p) => p.toString() !== userId.toString()
  );
};

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;

