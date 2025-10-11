module.exports = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        error: {
            message: `Cannot ${req.method} ${req.originalUrl}`,
            type: "not_found"
        }
    })
}