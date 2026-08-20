import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderType: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  },
  attachments: [{
    url: String,
    fileType: String
  }]
}, {
  timestamps: true
});

messageSchema.index({ conversationId: 1, timestamp: -1 });

messageSchema.methods.toClientFormat = function() {
  return {
    id: this._id,
    sender: this.senderType === 'admin' ? 'Prepvio' : 'CurrentUser',
    text: this.text,
    timestamp: this.timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }),
    avatar: this.senderType === 'admin' ? 'P' : 'U',
    read: this.read,
    createdAt: this.createdAt
  };
};

const Message = mongoose.model('Message', messageSchema);

export default Message;