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

// router.get("/:storyId", async (req, res) => {
//   try {
//     const { storyId } = req.params;
    
//     if (!storyId) {
//       return res.status(400).json({ message: 'Story ID is required' });
//     }

//     const comments = await Comment.find({ 
//       storyId,
//       parentId: null // Only get top-level comments
//     })
//     .populate({
//       path: 'replies',
//       options: { sort: { createdAt: -1 } }
//     })
//     .sort({ createdAt: -1 });

//     res.json(comments);
//   } catch (error) {
//     console.error('Get comments error:', error);
//     res.status(500).json({ message: 'Error fetching comments' });
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

router.post('/:commentId/reply', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId, content } = req.body;

    // Validate request
    if (!userId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Find parent comment
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: 'Parent comment not found'
      });
    }

    // Create reply
    const reply = new Comment({
      storyId: parentComment.storyId,
      userId,
      content,
      parentId: commentId
    });

    const savedReply = await reply.save();

    // Update parent comment with reply reference
    await Comment.findByIdAndUpdate(
      commentId,
      { $push: { replies: savedReply._id } }
    );

    res.status(201).json({
      success: true,
      data: savedReply
    });

  } catch (error) {
    console.error('Reply creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating reply',
      error: error.message
    });
  }
});

// Get replies for a comment
router.get('/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId)
      .populate({
        path: 'replies',
        options: { sort: { createdAt: -1 } }
      });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.json({
      success: true,
      data: comment.replies
    });

  } catch (error) {
    console.error('Fetch replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching replies',
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