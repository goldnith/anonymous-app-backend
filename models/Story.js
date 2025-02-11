const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  title: { type: String, required: true },
  story: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: [
      "funny",
      "awkward",
      "serious",
      "embarrassing", 
      "scary",
      "romantic",
      "mysterious",
      "confession",
      "lifechanging",
      "random",
      "heartwarming",
      "inspirational",
      "adventure",
      "childhood",
      "workplace",
      "family",
      "friendship",
      "school",
      "college",
      "travel"
    ], // Allowed categories
  },
  likeCount: { type: String, default: '0', set: v => v.toString() }, // Track total likes
  likedUsers: { type: [String], default: [] }, // Store user IDs who liked
}, { timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

storySchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'storyId'
});

// Virtual for comment count
storySchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'storyId',
  count: true
});

// Pre-find middleware to populate comment count
storySchema.pre('find', function() {
  this.populate('comments', '_id');
});

// Indexes for better query performance
storySchema.index({ title: 1 });
storySchema.index({ category: 1 });
storySchema.index({ 'comments._id': 1 });
storySchema.index({ createdAt: -1 });

module.exports = mongoose.model("Story", storySchema);