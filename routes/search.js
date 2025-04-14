const express = require('express');
const router = express.Router();
const Story = require('../models/Story');

// Search endpoint with multiple filters
router.get('/', async (req, res) => {
    const { q, category, type, storyId, date, filter, exact } = req.query;

    try {
        let searchQuery = {};
        
        // Handle specific story search
        if (storyId) {
            searchQuery._id = storyId;
        }

        // Handle text search
        if (q) {
            searchQuery.$or = [
                { title: exact ? q : new RegExp(q, 'i') },
                { story: exact ? q : new RegExp(q, 'i') },
                { category: exact ? q : new RegExp(q, 'i') }
            ];
        }

        // Handle category filter
        if (category) {
            searchQuery.category = category;
        }

        // Handle date filter
        if (date) {
            searchQuery.createdAt = { $gte: new Date(date) };
        }

        // Execute search with pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const results = await Story.find(searchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Story.countDocuments(searchQuery);

        res.status(200).json({
            success: true,
            count: results.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: results
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Search failed',
            error: error.message 
        });
    }
});

module.exports = router;