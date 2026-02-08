const requireAuth = (req, res, next) => {
    // Check if session exists and has a userId
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
};

module.exports = { requireAuth };
