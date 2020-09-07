const fs = require('fs-extra')
const OpenCC = require('opencc-js')
const iconv = require('iconv-lite')
const chardet = require('chardet')

/**
 * Config object:
 * {
 *   type: {
 *     from: '',
 *     to: ''
 *   },
 *   dest: null // default to filePath
 * }
 * Valid value of config.type.{from, to}: 't', 'tw', 'twp', 'hk', 'cn', 'jp'
 */
const allowedTypes = ['t', 'tw', 'twp', 'hk', 'cn', 'jp']
const converterCache = new Map()
const getConverter = async (from, to) => {
	const id = from + ':' + to
	if (converterCache.has(id)) {
		return converterCache
	}
	const cvt = await OpenCC.Converter(from, to)
	converterCache.set(id, cvt)
	return cvt
}
module.exports = async (filePath, config) => {
	const buf = await fs.readFile(filePath)
	if (
		typeof config.type !== 'object' ||
		!allowedTypes.includes(config.type.from) ||
		!allowedTypes.includes(config.type.to)
	) {
		throw new Error('Invalid config.type value.')
	}
	const text = iconv.decode(buf, chardet.detect(buf))
	const convert = await getConverter(config.type.from, config.type.to)
	const converted = convert(text)
	return fs.writeFile(config.dest || filePath, converted, 'utf-8')
}
