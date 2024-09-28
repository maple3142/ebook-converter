const path = require('path')
const tmp = require('tmp-promise')
const globby = require('globby')
const cvtFile = require('./opencc-convert-text')
const zipDir = require('./zip-dir')
const cp = require('child_process')

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
module.exports = async (filePath, config) => {
	const { path: dir, cleanup } = await tmp.dir({ unsafeCleanup: true })
	try {
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
	} finally {
		await cleanup()
	}
}
