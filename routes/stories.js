const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
// const Comment = require('../models/Comment');
const mongoose = require('mongoose');

// Get all stories
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const category = req.query.category;
    const sort = req.query.sort || 'date';

    // Build query
    let query = {};

    // Add search
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { story: new RegExp(search, 'i') }
      ];
    }

    // Add category filter
    if (category) {
      query.category = category;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Build sort object
    const sortObj = sort === 'likes' 
      ? { likeCount: -1 } 
      : { createdAt: -1 };

    // Execute query with pagination
    const stories = await Story
      .find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Story.countDocuments(query);

    res.json({
      success: true,
      stories,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching stories' 
    });
  }
});




router.post('/', async (req, res) => {
  try {
    const { title, story, category, authorName, authorDetails } = req.body;

    // Create a new story
    const newStory = new Story({ 
      title, 
      story, 
      category,
      authorName: authorName || 'Anonymous',
      authorDetails: authorDetails || ''
    });

    // Validate fields
    const validationError = newStory.validateSync();
    if (validationError) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationError.errors 
      });
    }
    await newStory.save();

    res.status(201).json({ message: 'Story created successfully!', story: newStory });
  } catch (err) {
    console.error('Story creation error:', err);
    res.status(500).json({ 
      message: 'Failed to create story', 
      error: err.message 
    });
  }
});

// Add a new route to get stories by author
router.get('/author/:authorName', async (req, res) => {
  try {
      const { authorName } = req.params;
      const stories = await Story.find({ 
          authorName: new RegExp(authorName, 'i')
      }).sort({ createdAt: -1 });

      res.json(stories);
  } catch (error) {
      console.error('Get stories by author error:', error);
      res.status(500).json({ 
          message: 'Error fetching stories by author',
          error: error.message 
      });
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

// Move the story route above the author route
router.get('/story/:id', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ 
        success: false, 
        message: 'Story not found' 
      });
    }
    // Return more specific data structure
    res.json({
      success: true,
      story: {
        ...story.toObject(),
        likeCount: story.likeCount || '0',
        likedUsers: story.likedUsers || []
      }
    });
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching story',
      error: error.message 
    });
  }
});


module.exports = router;