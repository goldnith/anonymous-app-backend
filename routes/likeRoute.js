// const express = require("express");
// const router = express.Router();
// const Story = require("../models/Story");

// // Like/Unlike a story
// router.post("/:storyId/:action", async (req, res) => {
//   try {
//     const { storyId, action } = req.params;
//     const { userId } = req.body;

//     if (!storyId || !userId) {
//       return res.status(400).json({ message: 'Missing required parameters' });
//     }

//     const story = await Story.findById(storyId);
//     if (!story) {
//       return res.status(404).json({ message: 'Story not found' });
//     }

//     if (action === 'like' && !story.likes.includes(userId)) {
//       story.likes.push(userId);
//     } else if (action === 'unlike') {
//       story.likes = story.likes.filter(id => id !== userId);
//     } else {
//       return res.status(400).json({ message: 'Invalid action' });
//     }
    
//     await story.save();
//     res.json({ 
//       likes: story.likes.length,
//       likedByUser: story.likes.includes(userId)
//     });
//   } catch (error) {
//     console.error('Like action error:', error);
//     res.status(500).json({ message: 'Error updating likes' });
//   }
// });

// // Get like status
// router.get("/:storyId/likes", async (req, res) => {
//   try {
//     const { storyId } = req.params;
//     const { userId } = req.query;

//     if (!storyId || !userId) {
//       return res.status(400).json({ message: 'Missing required parameters' });
//     }

//     const story = await Story.findById(storyId);
//     if (!story) {
//       return res.status(404).json({ message: 'Story not found' });
//     }

//     res.json({
//       likes: story.likes.length,
//       likedByUser: story.likes.includes(userId)
//     });
//   } catch (error) {
//     console.error('Get likes error:', error);
//     res.status(500).json({ message: 'Error fetching like status' });
//   }
// });

// module.exports = router;