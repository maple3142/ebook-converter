const xf = require('xfetch-js')

/**
 * valid values of converter
 * 'Simplified', 'Traditional', 'China', 'Hongkong', 'Taiwan', 'WikiSimplified', 'WikiTraditional'
 * For others, please see https://docs.zhconvert.org/api/convert/#必填
 */
module.exports = async (text, converter) => {
	const result = await xf
		.post('https://api.zhconvert.org/convert', {
			json: {
				text,
				converter
			}
		})
		.json()
	return result.data.text
}
