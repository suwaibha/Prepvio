import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'pending'],
    default: 'active'
  }
}, {
  timestamps: true
});

conversationSchema.methods.getConversationId = function() {
  return `conv_${this.userId}`;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;