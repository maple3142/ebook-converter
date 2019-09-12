const path = require('path')
const fs = require('fs-extra')
const express = require('express')
const multer = require('multer')
const rateLimit = require('./ratelimit')
const cvtEpub = require('../src/convert-epub')
const cvtText = require('../src/convert-text')

const app = express()
app.use('/static', express.static(path.join(__dirname, 'static')))
const uplDir = path.join(__dirname, 'uploads')
const upload = multer({ dest: uplDir })

const index = path.join(__dirname, './index.html')
app.get('/', (req, res) => {
	res.sendFile(index)
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
app.post('/convert-epub', rateLimit, upload.single('epub'), async (req, res) => {
	if (req.file.mimetype !== 'application/epub+zip') {
		return res.send('檔案並非 epub 類型')
	}
	const newName = appendFileName(req.file.originalname, '-converted')
	await cvtEpub(req.file.path, {
		type: req.body.type
	})
	await downloadFile(res, newName, req.file.path)
	await fs.unlink(req.file.path)
})
app.post('/convert-txt', rateLimit, upload.single('txt'), async (req, res) => {
	if (req.file.mimetype !== 'text/plain') {
		return res.send('檔案並非 txt 類型')
	}
	const newName = appendFileName(req.file.originalname, '-converted')
	await cvtText(req.file.path, {
		type: req.body.type
	})
	await downloadFile(res, newName, req.file.path)
	await fs.unlink(req.file.path)
})

const PORT = process.env.PORT || 8763
app.listen(PORT, () => console.log(`Server is listening at http://localhost:${PORT}`))
