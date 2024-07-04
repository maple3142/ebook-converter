#!/usr/bin/env node
const path = require('path')
const fs = require('fs-extra')
const express = require('express')
const multer = require('multer')
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
	},
	limits: {
		fileSize: 64 * 1024 * 1024 // 64MB
	}
})

app.get('/', (req, res) => {
	res.set('Cache-control', 'public, max-age=3600')
	res.render('index')
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
function performDelete(file) {
	console.log(`Deleting ${file.id} ...`)
	delete files[file.id]
	fs.unlink(file.path).catch(err => {
		console.log(`Deleting ${file.id} error: ${err}`)
	})
}
function addDeleteTask(file) {
	console.log(`Schedule ${file.id} for deletion...`)
	setTimeout(() => {
		performDelete(file)
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
const handleFileMiddleware = type => [
	upload.single('file'),
	(req, res, next) => {
		if (!req.file || req.file.mimetype !== type) {
			if (req.file) {
				fs.unlink(req.file.path, () => {})
			}
			return res.type('text').send(`檔案類型並非 ${type}`)
		}
		const fileId = req.file.filename
		req.file = files[fileId] = {
			originalName: req.file.originalname,
			path: req.file.path,
			generated: Date.now(),
			done: false,
			id: fileId
		}
		res.redirect(`/info/${fileId}`)
		next()
	}
]
const handleTaskCompletion = (file, task) =>
	task
		.then(() => {
			console.log(`Conversion of ${file.id} done`)
			file.done = true
			file.generated = Date.now()
			addDeleteTask(file)
		})
		.catch(() => {
			console.log(`Conversion of ${file.id} failed`)
			file.error = true
			setTimeout(() => {
				performDelete(file)
			}, 10 * 1000) // so that the user can see the error message (by redirecting to /info/:id)
		})
app.post('/opencc-convert-epub', handleFileMiddleware('application/epub+zip'), (req, res) => {
	const { file } = req
	const task = openccCvtEpub(file.path, {
		type: {
			from: req.body['type-from'],
			to: req.body['type-to']
		}
	})
	handleTaskCompletion(file, task)
})
app.post('/opencc-convert-txt', handleFileMiddleware('text/plain'), (req, res) => {
	const { file } = req
	const task = openccCvtText(file.path, {
		type: {
			from: req.body['type-from'],
			to: req.body['type-to']
		}
	})
	handleTaskCompletion(file, task)
})
app.post('/zhc-convert-epub', handleFileMiddleware('application/epub+zip'), (req, res) => {
	const { file } = req
	const task = zhcCvtEpub(file.path, {
		type: req.body.type
	})
	handleTaskCompletion(file, task)
})
app.post('/zhc-convert-txt', handleFileMiddleware('text/plain'), (req, res) => {
	const { file } = req
	const task = zhcCvtText(file.path, {
		type: req.body.type
	})
	handleTaskCompletion(file, task)
})

const PORT = process.env.PORT || 8763
const srv = app.listen(PORT, '0.0.0.0', () =>
	console.log(`Server is listening at http://localhost:${PORT}`, srv.address())
)
