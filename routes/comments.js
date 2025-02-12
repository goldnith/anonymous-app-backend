const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');


// Get comments for a story
router.get("/:storyId", async (req, res) => {
  try {
    const { storyId } = req.params;
    
    if (!storyId) {
      return res.status(400).json({ message: 'Story ID is required' });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const comments = await Comment.find({ storyId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
});

// Add a comment
// router.post("/:storyId/comments", async (req, res) => {
//   try {
//     const { storyId } = req.params;
//     console.log('Story ID from URL:', storyId);
//     const { userId, content } = req.body;

//     console.log('Debug - Request:', {
//       storyId,
//       userId,
//       content,
//       body: req.body
//     });

//     // Input validation
//     if (!mongoose.Types.ObjectId.isValid(storyId)) {
//       return res.status(400).json({ 
//         message: 'Invalid story ID',
//         received: storyId 
//       });
//     }

//     if (!userId || !content) {
//       return res.status(400).json({
//         message: 'Missing required fields',
//         received: { userId, content }
//       });
//     }

//     // Find story
//     const story = await Story.findById(storyId);
//     if (!story) {
//       return res.status(404).json({ message: 'Story not found' });
//     }

//     // Create and save comment
//     const comment = new Comment({
//       storyId: mongoose.Types.ObjectId(storyId),
//       userId,
//       content: content.trim()
//     });

//     const savedComment = await comment.save();
//     console.log('Debug - Saved comment:', savedComment);

//     res.status(201).json(savedComment);
//   } catch (error) {
//     console.error('Comment creation error:', error);
//     res.status(500).json({
//       message: 'Error creating comment',
//       error: error.message
//     });
//   }
// });

// Add a comment
router.post('/:storyId', async (req, res) => {
  try {
    const { storyId } = req.params;
    const { userId, content } = req.body;

    // Validate request body
    if (!userId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create comment
    const comment = new Comment({
      storyId,
      userId,
      content
    });

    const savedComment = await comment.save();

    res.status(201).json({
      success: true,
      data: savedComment
    });

  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating comment',
      error: error.message
    });
  }
});




// Delete a comment
router.delete("/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    if (!commentId || !userId) {
      return res.status(400).json({ 
        message: 'Comment ID and User ID are required' 
      });
    }

    // Find and delete in one operation
    const result = await Comment.findOneAndDelete({ 
      _id: commentId, 
      userId: userId 
    });

    if (!result) {
      return res.status(404).json({ 
        message: 'Comment not found or unauthorized' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Comment deleted successfully' 
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: error.message
    });
  }
});

router.get("/:storyId/count", async (req, res) => {
  try {
    const { storyId } = req.params;
    const count = await Comment.countDocuments({ storyId });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comment count' });
  }
});


module.exports = router;