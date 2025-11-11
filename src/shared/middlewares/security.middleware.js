const cors = require('cors')

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning'],
    credentials: false,
    maxAge: 86400
}

const securityMiddleware = cors(corsOptions)

module.exports = securityMiddleware

