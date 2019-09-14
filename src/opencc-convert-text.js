const fs = require('fs-extra')
const opencc = require('node-opencc')
const iconv = require('iconv-lite')
const chardet = require('chardet')

/**
 * Config object:
 * {
 *   type: '',
 *   dest: null // default to filePath
 * }
 * Valid value of config.type: 'hongKongToSimplified', 'simplifiedToHongKong', 'simplifiedToTraditional', 'simplifiedToTaiwan', 'simplifiedToTaiwanWithPhrases',
 *   'traditionalToHongKong', 'traditionalToSimplified', 'traditionalToTaiwan', 'taiwanToSimplified', 'taiwanToSimplifiedWithPhrases'
 */
module.exports = async (filePath, config) => {
	const buf = await fs.readFile(filePath)
	if(typeof opencc[config.type] !== 'function'){
		throw new Error('Invalid config.type value.')
	}
	const text = iconv.decode(buf, chardet.detect(buf))
	const converted = opencc[config.type](text)
	return fs.writeFile(config.dest || filePath, converted, 'utf-8')
}
