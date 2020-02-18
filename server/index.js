const path = require('path')
const fs = require('fs-extra')
const express = require('express')
const multer = require('multer')
const rateLimit = require('./ratelimit')
const openccCvtEpub = require('../src/opencc-convert-epub')
const openccCvtText = require('../src/opencc-convert-text')
const zhcCvtEpub = require('../src/zhc-convert-epub')
const zhcCvtText = require('../src/zhc-convert-text')

const app = express()
app.set('view engine', 'pug')
app.set('views', __dirname)
app.use('/static', express.static(path.join(__dirname, 'static')))
const uplDir = path.join(__dirname, 'uploads')
const upload = multer({ dest: uplDir })

const index = path.join(__dirname, './index.html')
app.get('/', (req, res) => {
	res.render('index')
})
const favicon = path.join(__dirname, '/static/favicon.ico')
app.get('/favicon.ico', (req, res) => {
	res.sendFile(favicon)
})

const appendFileName = (originalName, text) => {
	const parts = originalName.split('.')
	const ext = parts.pop()
	const name = parts.join('.')
	return name + text + '.' + ext
}
const downloadFile = async (res, fileName, filePath) => {
	const { size } = await fs.stat(filePath)
	res.setHeader('Content-Length', size)
	res.setHeader('X-File-Name', encodeURIComponent(fileName))
	res.attachment(fileName).type('epub')
	return new Promise((resolve, reject) =>
		fs
			.createReadStream(filePath)
			.pipe(res)
			.on('finish', resolve)
			.on('error', reject)
	)
}
const files = {}
app.get('/files/:id', (req, res) => {
	const { id } = req.params
	if (!(id in files)) {
		return res.status(404).send("File doesn't exist.")
	}
	const file = files[id]
	downloadFile(
		res,
		appendFileName(file.originalName, '-converted'),
		file.path
	)
})
app.get('/info/:id', (req, res) => {
	const { id } = req.params
	if (!(id in files)) {
		return res.status(404).send("File doesn't exist.")
	}
	res.render('info', { id, file: files[id] })
})
app.post(
	'/opencc-convert-epub',
	rateLimit,
	upload.single('epub'),
	async (req, res) => {
		if (req.file.mimetype !== 'application/epub+zip') {
			return res.send('檔案並非 epub 類型')
		}
		await openccCvtEpub(req.file.path, {
			type: req.body.type
		})
		files[req.file.filename] = {
			originalName: req.file.originalname,
			path: req.file.path,
			generated: Date.now()
		}
		res.redirect(`/info/${req.file.filename}`)
	}
)
app.post(
	'/opencc-convert-txt',
	rateLimit,
	upload.single('txt'),
	async (req, res) => {
		if (req.file.mimetype !== 'text/plain') {
			return res.send('檔案並非 txt 類型')
		}
		await openccCvtText(req.file.path, {
			type: req.body.type
		})
		files[req.file.filename] = {
			originalName: req.file.originalname,
			path: req.file.path,
			generated: Date.now()
		}
		res.redirect(`/info/${req.file.filename}`)
	}
)
app.post(
	'/zhc-convert-epub',
	rateLimit,
	upload.single('epub'),
	async (req, res) => {
		if (req.file.mimetype !== 'application/epub+zip') {
			return res.send('檔案並非 epub 類型')
		}
		await zhcCvtEpub(req.file.path, {
			type: req.body.type
		})
		files[req.file.filename] = {
			originalName: req.file.originalname,
			path: req.file.path,
			generated: Date.now()
		}
		res.redirect(`/info/${req.file.filename}`)
	}
)
app.post(
	'/zhc-convert-txt',
	rateLimit,
	upload.single('txt'),
	async (req, res) => {
		if (req.file.mimetype !== 'text/plain') {
			return res.send('檔案並非 txt 類型')
		}
		await zhcCvtText(req.file.path, {
			type: req.body.type
		})
		files[req.file.filename] = {
			originalName: req.file.originalname,
			path: req.file.path,
			generated: Date.now()
		}
		res.redirect(`/info/${req.file.filename}`)
	}
)

setInterval(() => {
	const now = Date.now()
	for (const [key, value] of Object.entries(files)) {
		if (value.generated - now >= 15 * 60 * 1000) {
			// delete the file after 15 minutes
			delete files[key]
			fs.unlink(value.path)
		}
	}
}, 60 * 1000) // runs every minutes

const PORT = process.env.PORT || 8763
app.listen(PORT, () =>
	console.log(`Server is listening at http://localhost:${PORT}`)
)
