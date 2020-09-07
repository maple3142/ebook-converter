const path = require('path')
require('dotenv').config({
	path: path.join(__dirname, '../.env')
})
const fs = require('fs-extra')
const express = require('express')
const multer = require('multer')
const hcaptcha = require('./hcaptcha')
const openccCvtEpub = require('../src/opencc-convert-epub')
const openccCvtText = require('../src/opencc-convert-text')
const zhcCvtEpub = require('../src/zhc-convert-epub')
const zhcCvtText = require('../src/zhc-convert-text')

const DELETE_DELAY = 15 * 60 * 1000 // 15 mins
const app = express()
app.set('view engine', 'pug')
app.set('views', __dirname)
app.use('/static', express.static(path.join(__dirname, 'static')))
const uplDir = path.join(__dirname, 'uploads')
const upload = multer({ dest: uplDir })

app.get('/', (req, res) => {
	res.render('index')
})
const favicon = path.join(__dirname, '/static/favicon.ico')
app.get('/favicon.ico', (req, res) => {
	res.sendFile(favicon, {
		hcaptcha: !!process.env.HCAPTCHA_SECRET_KEY
	})
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
	const file = files[req.params.id]
	if (!file) {
		return res.status(404).send("File doesn't exist.")
	}
	if (!file.done) {
		return res.status(404).send("File is'n ready yet.")
	}
	downloadFile(
		res,
		appendFileName(file.originalName, '-converted'),
		file.path
	)
})
app.get('/info/:id', (req, res) => {
	const file = files[req.params.id]
	if (!file) {
		return res.status(404).send("File doesn't exist.")
	}
	res.render('info', { id: req.params.id, file })
})
app.post(
	'/opencc-convert-epub',
	upload.single('file'),
	hcaptcha,
	async (req, res) => {
		if (!req.file || req.file.mimetype !== 'application/epub+zip') {
			return res.send('檔案並非 epub 類型')
		}
		const file = (files[req.file.filename] = {
			originalName: req.file.originalname,
			path: req.file.path,
			generated: Date.now(),
			done: false
		})
		res.redirect(`/info/${req.file.filename}`)
		await openccCvtEpub(req.file.path, {
			type: {
				from: req.body['type-from'],
				to: req.body['type-to']
			}
		})
			.then(() => {
				file.done = true
				file.generated = Date.now()
			})
			.catch(() => {
				file.error = true
			})
		setTimeout(() => {
			delete files[req.file.filename]
			fs.unlink(req.file.path)
		}, DELETE_DELAY)
	}
)
app.post(
	'/opencc-convert-txt',
	upload.single('file'),
	hcaptcha,
	async (req, res) => {
		if (!req.file || req.file.mimetype !== 'text/plain') {
			return res.send('檔案並非 txt 類型')
		}
		const file = (files[req.file.filename] = {
			originalName: req.file.originalname,
			path: req.file.path,
			generated: Date.now(),
			done: false
		})
		res.redirect(`/info/${req.file.filename}`)
		await openccCvtText(req.file.path, {
			type: {
				from: req.body['type-from'],
				to: req.body['type-to']
			}
		})
			.then(() => {
				file.done = true
				file.generated = Date.now()
			})
			.catch(() => {
				file.error = true
			})
		setTimeout(() => {
			delete files[req.file.filename]
			fs.unlink(req.file.path)
		}, DELETE_DELAY)
	}
)
app.post(
	'/zhc-convert-epub',
	upload.single('file'),
	hcaptcha,
	async (req, res) => {
		if (!req.file || req.file.mimetype !== 'application/epub+zip') {
			return res.send('檔案並非 epub 類型')
		}
		const file = (files[req.file.filename] = {
			originalName: req.file.originalname,
			path: req.file.path,
			generated: Date.now(),
			done: false
		})
		res.redirect(`/info/${req.file.filename}`)
		await zhcCvtEpub(req.file.path, {
			type: req.body.type
		})
			.then(() => {
				file.done = true
				file.generated = Date.now()
			})
			.catch(() => {
				file.error = true
			})
		setTimeout(() => {
			delete files[req.file.filename]
			fs.unlink(req.file.path)
		}, DELETE_DELAY)
	}
)
app.post(
	'/zhc-convert-txt',
	upload.single('file'),
	hcaptcha,
	async (req, res) => {
		if (!req.file || req.file.mimetype !== 'text/plain') {
			return res.send('檔案並非 txt 類型')
		}
		const file = (files[req.file.filename] = {
			originalName: req.file.originalname,
			path: req.file.path,
			generated: Date.now(),
			done: false
		})
		res.redirect(`/info/${req.file.filename}`)
		await zhcCvtText(req.file.path, {
			type: req.body.type
		})
			.then(() => {
				file.done = true
				file.generated = Date.now()
			})
			.catch(() => {
				file.error = true
			})
		setTimeout(() => {
			delete files[req.file.filename]
			fs.unlink(req.file.path)
		}, DELETE_DELAY)
	}
)

const PORT = process.env.PORT || 8763
app.listen(PORT, () =>
	console.log(`Server is listening at http://localhost:${PORT}`)
)
