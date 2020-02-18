const path = require('path')
const fs = require('fs-extra')
const tmp = require('tmp-promise')
const unzipper = require('unzipper')
const cvtFile = require('./zhc-convert-text')
const zipDir = require('./zip-dir')

/**
 * Config object:
 * {
 *   type: '',
 *   dest: null // default to filePath
 * }
 * Valid value of config.type: 'Simplified', 'Traditional', 'China', 'Hongkong', 'Taiwan', 'WikiSimplified', 'WikiTraditional'
 */
module.exports = async (filePath, config) => {
	const { path: dir, cleanup } = await tmp.dir({ unsafeCleanup: true })
	await new Promise((res, rej) => {
		fs.createReadStream(filePath)
			.pipe(unzipper.Extract({ path: dir }))
			.on('close', res)
			.on('error', rej)
	})
	const files = (
		await globby('**/*.{htm,html,xhtml,ncx,opf}', { cwd: dir })
	).map(f => path.join(dir, f))
	await Promise.all(files.map(f => cvtFile(f, { type: config.type })))
	await zipDir(dir, config.dest || filePath)
	await cleanup()
}
