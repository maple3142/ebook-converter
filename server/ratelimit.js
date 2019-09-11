const { RateLimiterMemory } = require('rate-limiter-flexible')

const rateLimiter = new RateLimiterMemory({
	points: 1,
	duration: 5
})
const rateLimitMiddleWare = (req, res, next) =>
	rateLimiter
		.consume(req.ip)
		.then(() => next())
		.catch(() => res.status(429).send('Too Many Requests'))
module.exports = rateLimitMiddleWare
