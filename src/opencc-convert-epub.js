const path = require('path')
const fs = require('fs-extra')
const tmp = require('tmp-promise')
const unzipper = require('unzipper')
const cvtFile = require('./opencc-convert-text')
const zipDir = require('./zip-dir')

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
	const { path: dir, cleanup } = await tmp.dir({ unsafeCleanup: true })
	await new Promise((res, rej) => {
		fs.createReadStream(filePath)
			.pipe(unzipper.Extract({ path: dir }))
			.on('close', res)
			.on('error', rej)
	})
	const textDir = path.join(dir, './OEBPS/Text')
	const hasTextDir = await fs.exists(textDir)
	if (!hasTextDir) {
		throw new Error('The file is not a EPUB file.')
	}
	const files = (await fs.readdir(textDir))
		.filter(name => name.endsWith('.xhtml'))
		.map(name => path.join(textDir, name))
	const toc1 = path.join(dir, './toc.ncx')
	if (await fs.exists(toc1)) {
		files.push(toc1)
	}
	const toc2 = path.join(dir, './OEBPS/toc.ncx')
	if (await fs.exists(toc2)) {
		files.push(toc2)
	}
	const meta = path.join(dir, './OEBPS/content.opf')
	if (await fs.exists(meta)) {
		files.push(meta)
	}
	await Promise.all(files.map(f => cvtFile(f, { type: config.type })))
	await zipDir(dir, config.dest || filePath)
	await cleanup()
}
