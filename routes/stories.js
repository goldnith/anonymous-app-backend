const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
// const Comment = require('../models/Comment');
const mongoose = require('mongoose');

// Get all stories
router.get('/', async (req, res) => {
    try {
        const stories = await Story.find();
        res.json(stories);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});




router.post('/', async (req, res) => {
    try {
      const { title, story, category } = req.body;
  
      // Create a new story
      const newStory = new Story({ title, story, category });
      await newStory.save();
  
      res.status(201).json({ message: 'Story created successfully!', story: newStory });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to create story', error: err.message });
    }
  });


  // Like/Unlike a story
  router.post("/:storyId/:action", async (req, res) => {
    try {
      const { storyId, action } = req.params;
      const { userId } = req.body;
  
      if (!storyId || !userId) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }
  
      const story = await Story.findById(storyId);
      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }
  
      if (action === 'like' && !story.likedUsers.includes(userId)) {
        story.likedUsers.push(userId);
        story.likeCount = story.likedUsers.length.toString();
      } else if (action === 'unlike') {
        story.likedUsers = story.likedUsers.filter(id => id !== userId);
        story.likeCount = story.likedUsers.length.toString();
      } else {
        return res.status(400).json({ message: 'Invalid action' });
      }
      
      await story.save();
      res.json({ 
        likeCount: story.likeCount,
        likedByUser: story.likedUsers.includes(userId)
      });
    } catch (error) {
      console.error('Like action error:', error);
      res.status(500).json({ message: 'Error updating likes' });
    }
  });
  
  // Get like status
  router.get("/:storyId/likes", async (req, res) => {
    try {
      const { storyId } = req.params;
      const { userId } = req.query;
  
      if (!storyId || !userId) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }
  
      const story = await Story.findById(storyId);
      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }
  
      res.json({
        likeCount: story.likedUsers.length,
        likedByUser: story.likedUsers.includes(userId)
      });
    } catch (error) {
      console.error('Get likes error:', error);
      res.status(500).json({ message: 'Error fetching like status' });
    }
  });

  

// // Get comments for a story
// router.get("/:storyId/comments", async (req, res) => {
//   try {
//     const { storyId } = req.params;
    
//     if (!storyId) {
//       return res.status(400).json({ message: 'Story ID is required' });
//     }

//     const story = await Story.findById(storyId);
//     if (!story) {
//       return res.status(404).json({ message: 'Story not found' });
//     }

//     const comments = await Comment.find({ storyId }).sort({ createdAt: -1 });
//     res.json(comments);
//   } catch (error) {
//     console.error('Get comments error:', error);
//     res.status(500).json({ message: 'Error fetching comments' });
//   }
// });

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
// router.post("/:storyId/comments", async (req, res) => {
//   try {
//     const { storyId } = req.params;
//     const { userId, content } = req.body;

//     // Validate storyId format
//     if (!mongoose.Types.ObjectId.isValid(storyId)) {
//       return res.status(400).json({ 
//         message: 'Invalid story ID',
//         received: storyId 
//       });
//     }

//     // Create comment with validated fields
//     const comment = new Comment({
//       storyId: mongoose.Types.ObjectId(storyId),
//       userId,
//       content: content.trim()
//     });

//     const savedComment = await comment.save();
//     res.status(201).json(savedComment);
    
//   } catch (error) {
//     console.error('Comment creation error:', error);
//     res.status(500).json({
//       message: 'Error creating comment',
//       error: error.message
//     });
//   }
// });


// // Delete a comment
// router.delete('/:storyId/comments/:commentId', async (req, res) => {
//   try {
//     const { commentId } = req.params;
//     const { userId } = req.body;

//     const comment = await Comment.findOne({ _id: commentId, userId });
//     if (!comment) {
//       return res.status(404).json({ message: 'Comment not found or unauthorized' });
//     }

//     await comment.remove();
//     res.json({ message: 'Comment deleted successfully' });
//   } catch (error) {
//     console.error('Delete comment error:', error);
//     res.status(500).json({ message: 'Error deleting comment' });
//   }
// });

// Get comment count for a story
router.get("/:storyId/count", async (req, res) => {
  try {
    const { storyId } = req.params;
    
    const count = await Comment.countDocuments({ storyId });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching comment count',
      error: error.message
    });
  }
});


module.exports = router;