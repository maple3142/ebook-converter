const fs = require('fs-extra')
const zhc = require('./zhconvert')
const iconv = require('iconv-lite')
const chardet = require('chardet')

const TYPES = ['Simplified', 'Traditional', 'China', 'Hongkong', 'Taiwan', 'WikiSimplified', 'WikiTraditional']

/**
 * Config object:
 * {
 *   type: '',
 *   dest: null // default to filePath
 * }
 * Valid value of config.type: 'Simplified', 'Traditional', 'China', 'Hongkong', 'Taiwan', 'WikiSimplified', 'WikiTraditional'
 */
module.exports = async (filePath, config) => {
	const buf = await fs.readFile(filePath)
	if(!TYPES.includes(config.type)){
		throw new Error('Invalid config.type value.')
	}
	const text = iconv.decode(buf, chardet.detect(buf))
	const converted = await zhc(text, config.type)
	return fs.writeFile(config.dest || filePath, converted, 'utf-8')
}
