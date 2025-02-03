const express = require('express');
const router = express.Router();
const Story = require('../models/Story');

// Get all stories
router.get('/', async (req, res) => {
    try {
        const stories = await Story.find();
        res.json(stories);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new story
// router.post('/', async (req, res) => {
//     try {
//         const newStory = new Story(req.body);
//         const savedStory = await newStory.save();
//         res.status(201).json(savedStory);
//     } catch (error) {
//         res.status(500).json({ error: 'Error creating story' });
//     }
// });

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
  

module.exports = router;