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
}, { timestamps: true }); // Adds createdAt and updatedAt fields

// Indexes for better query performance
storySchema.index({ title: 1 });
storySchema.index({ category: 1 });

module.exports = mongoose.model("Story", storySchema);