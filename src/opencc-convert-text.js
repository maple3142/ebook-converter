const fs = require('fs')
const fsp = require('fs/promises')
const OpenCC = require('opencc-js')
const iconv = require('iconv-lite')
const chardet = require('chardet')
const { Transform } = require('stream')

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
		return converterCache.get(id)
	}
	const cvt = await OpenCC.Converter({ from, to })
	converterCache.set(id, cvt)
	return cvt
}
module.exports = async (filePath, config) => {
	if (
		typeof config.type !== 'object' ||
		!allowedTypes.includes(config.type.from) ||
		!allowedTypes.includes(config.type.to)
	) {
		throw new Error('Invalid config.type value.')
	}
	const convert = await getConverter(config.type.from, config.type.to)
	const fd = await fsp.open(filePath, 'r')
	const buf = Buffer.alloc(1024)
	fd.read(buf, 0, 1024, 0)
	const encoding = chardet.detect(buf)
	const stream = fd
		.createReadStream()
		.pipe(iconv.decodeStream(encoding))
		.pipe(
			new Transform({
				transform(chunk, encoding, done) {
					done(null, convert(chunk.toString()))
				}
			})
		)
		.pipe(
			fs.createWriteStream(config.dest || filePath, {
				encoding: 'utf-8'
			})
		)
	await new Promise((resolve, reject) => {
		stream.on('finish', resolve)
		stream.on('error', reject)
	})
	await fd.close()
}
