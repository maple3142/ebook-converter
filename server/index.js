#!/usr/bin/env node
const path = require('path')
const fs = require('fs-extra')
const express = require('express')
const multer = require('multer')
const hcaptcha = require('./hcaptcha')
const openccCvtEpub = require('../src/opencc-convert-epub')
const openccCvtText = require('../src/opencc-convert-text')
const zhcCvtEpub = require('../src/zhc-convert-epub')
const zhcCvtText = require('../src/zhc-convert-text')

const DELETE_DELAY = 5 * 60 * 1000 // 5 mins
const app = express()
app.set('view engine', 'pug')
app.set('views', __dirname)
app.use('/static', express.static(path.join(__dirname, 'static')))
const uplDir = path.join(__dirname, 'uploads')
const upload = multer({
	dest: uplDir,
	fileFilter: (req, file, cb) => {
		// fix: https://github.com/expressjs/multer/pull/1102
		file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
		cb(null, true)
	}
})

app.get('/', (req, res) => {
	res.set('Cache-control', 'public, max-age=3600')
	res.render('index', {
		hcaptcha: typeof process.env.HCAPTCHA_SECRET_KEY !== 'undefined'
	})
})
const favicon = path.join(__dirname, '/static/favicon.ico')
app.get('/favicon.ico', (req, res) => {
	res.set('Cache-control', 'public, max-age=3600')
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
		fs.createReadStream(filePath).pipe(res).on('finish', resolve).on('error', reject)
	)
}
const files = Object.create(null)
function addDeleteTask(fileId) {
	console.log(`Adding ${fileId} for deletion...`)
	setTimeout(() => {
		console.log(`Deleting ${fileId} ...`)
		const file = files[fileId]
		delete files[fileId]
		fs.unlink(file.path).catch(err => {
			console.log(`Deleting ${fileId} error: ${err}`)
		})
	}, DELETE_DELAY)
}
app.get('/files/:id', (req, res) => {
	const file = files[req.params.id]
	if (!file) {
		return res.status(404).send('找不到檔案')
	}
	if (!file.done) {
		return res.status(404).send('檔案還沒準備完成')
	}
	downloadFile(res, appendFileName(file.originalName, '-converted'), file.path)
})
app.get('/info/:id', (req, res) => {
	res.set('Cache-control', 'no-cache, no-store, must-revalidate')
	const file = files[req.params.id]
	if (!file) {
		return res.render('info', { file: null })
	}
	res.render('info', { id: req.params.id, file })
})
app.post('/opencc-convert-epub', upload.single('file'), hcaptcha, async (req, res) => {
	if (!req.file || req.file.mimetype !== 'application/epub+zip') {
		return res.send('檔案並非 epub 類型')
	}
	const fileId = req.file.filename
	const file = (files[fileId] = {
		originalName: req.file.originalname,
		path: req.file.path,
		generated: Date.now(),
		done: false
	})
	res.redirect(`/info/${fileId}`)
	await openccCvtEpub(file.path, {
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
	addDeleteTask(fileId)
})
app.post('/opencc-convert-txt', upload.single('file'), hcaptcha, async (req, res) => {
	if (!req.file || req.file.mimetype !== 'text/plain') {
		return res.send('檔案並非 txt 類型')
	}
	const fileId = req.file.filename
	const file = (files[fileId] = {
		originalName: req.file.originalname,
		path: req.file.path,
		generated: Date.now(),
		done: false
	})
	res.redirect(`/info/${fileId}`)
	await openccCvtText(file.path, {
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
	addDeleteTask(fileId)
})
app.post('/zhc-convert-epub', upload.single('file'), hcaptcha, async (req, res) => {
	if (!req.file || req.file.mimetype !== 'application/epub+zip') {
		return res.send('檔案並非 epub 類型')
	}
	const fileId = req.file.filename
	const file = (files[fileId] = {
		originalName: req.file.originalname,
		path: req.file.path,
		generated: Date.now(),
		done: false
	})
	res.redirect(`/info/${fileId}`)
	await zhcCvtEpub(file.path, {
		type: req.body.type
	})
		.then(() => {
			file.done = true
			file.generated = Date.now()
		})
		.catch(() => {
			file.error = true
		})
	addDeleteTask(fileId)
})
app.post('/zhc-convert-txt', upload.single('file'), hcaptcha, async (req, res) => {
	if (!req.file || req.file.mimetype !== 'text/plain') {
		return res.send('檔案並非 txt 類型')
	}
	const fileId = req.file.filename
	const file = (files[fileId] = {
		originalName: req.file.originalname,
		path: req.file.path,
		generated: Date.now(),
		done: false
	})
	res.redirect(`/info/${fileId}`)
	await zhcCvtText(file.path, {
		type: req.body.type
	})
		.then(() => {
			file.done = true
			file.generated = Date.now()
		})
		.catch(() => {
			file.error = true
		})
	addDeleteTask(fileId)
})

const PORT = process.env.PORT || 8763
const srv = app.listen(PORT, '0.0.0.0', () =>
	console.log(`Server is listening at http://localhost:${PORT}`, srv.address())
)
