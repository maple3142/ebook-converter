const fs = require('fs-extra')
const archiver = require('archiver')

module.exports = async (dir, dest) => {
	await new Promise((res, rej) => {
		const st = fs.createWriteStream(dest)
		const ar = archiver('zip', {
			zlib: { level: 9 }
		})
		ar.on('end', res)
		ar.on('error', rej)
		ar.pipe(st)
		ar.directory(dir, false)
		ar.finalize()
	})
}
