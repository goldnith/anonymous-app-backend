const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  storyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
    required: [true, 'Story ID is required'],
    index: true
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    minlength: [1, 'Comment cannot be empty'],
    maxlength: [500, 'Comment is too long']
  }
}, {
  timestamps: true
});

// Add compound index for queries
commentSchema.index({ storyId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);