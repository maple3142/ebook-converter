const xf = require('xfetch-js')

const SECRET_KEY = process.env.HCAPTCHA_SECRET_KEY
if (!SECRET_KEY) {
	console.info(
		'HCaptcha verification is disabled due to the lack of HCAPTCHA_SECRET_KEY'
	)
}
module.exports = async (req, res, next) => {
	if (!SECRET_KEY) return next()
	const { captcha } = req.body
	if (!captcha) {
		return res.status(400).send('沒有通過 Captcha 測試')
	}
	const resp = await xf
		.post('https://hcaptcha.com/siteverify', {
			urlencoded: {
				secret: SECRET_KEY,
				response: captcha
			}
		})
		.json()
	if (resp.success) {
		return next()
	} else {
		return res.status(400).send('沒有通過 Captcha 測試')
	}
}
