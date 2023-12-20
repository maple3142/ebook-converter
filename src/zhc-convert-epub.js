const path = require('path')
const tmp = require('tmp-promise')
const globby = require('globby')
const cvtFile = require('./zhc-convert-text')
const zipDir = require('./zip-dir')
const cp = require('child_process')

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
		cp.spawn('unzip', ['-oq', filePath, '-d', dir], { stdio: 'ignore' })
			.on('close', code => {
				if (code !== 0) rej(new Error('unzip failed'))
				else res()
			})
			.on('error', rej)
	})
	const files = (await globby('**/*.{htm,html,xhtml,ncx,opf}', { cwd: dir })).map(f => path.join(dir, f))
	await Promise.all(files.map(f => cvtFile(f, { type: config.type })))
	await zipDir(dir, config.dest || filePath)
	await cleanup()
}
