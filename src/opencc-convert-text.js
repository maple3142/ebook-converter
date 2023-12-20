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
	const cvtPromise = OpenCC.Converter({ from, to })
	converterCache.set(id, cvtPromise)
	return cvtPromise
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
	const tmpfd = await fsp.open(filePath, 'r')
	const buf = Buffer.alloc(1024)
	tmpfd.read(buf, 0, 1024, 0)
	await tmpfd.close()
	const encoding = chardet.detect(buf)

	let cleanup = () => {}
	if (!config.dest) {
		config.dest = filePath + '.tmp'
		cleanup = () => fsp.rename(config.dest, filePath)
	}
	const stream = fs
		.createReadStream(filePath)
		.pipe(iconv.decodeStream(encoding))
		.pipe(
			new Transform({
				transform(chunk, encoding, done) {
					done(null, convert(chunk.toString()))
				}
			})
		)
		.pipe(fs.createWriteStream(config.dest, { encoding: 'utf-8' }))
	await new Promise((resolve, reject) => {
		stream.on('finish', resolve)
		stream.on('error', reject)
	})
	await cleanup()
}
