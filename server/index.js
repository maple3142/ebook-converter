const path = require('path')
const fs = require('fs-extra')
const express = require('express')
const multer = require('multer')
const cvtEpub = require('../src/convert-epub')
const cvtText = require('../src/convert-text')

const app = express()
const uplDir = path.join(__dirname, 'uploads')
const upload = multer({ dest: uplDir })

const index = path.join(__dirname, './index.html')
app.get('/', (req, res) => {
	res.sendFile(index)
})

const downloadFile = async (response, filePath, fileName) => {
	const { size } = await fs.stat(filePath)
	response.setHeader('Content-Size', size)
	response.setHeader('Content-Type', 'application/epub+zip')
	response.setHeader('Content-Transfer-Encoding', 'Binary')
	response.setHeader('Content-disposition', "attachment; filename*=UTF-8''" + encodeURIComponent(fileName))
	await new Promise((res, rej) => {
		// res is "resolve" of Promise, and response belongs to express
		fs.createReadStream(filePath)
			.pipe(response)
			.on('finish', res)
			.on('error', rej)
	})
}
const appendFileName = (originalName, text) => {
	const parts = originalName.split('.')
	const ext = parts.pop()
	const name = parts.join('.')
	return name + text + '.' + ext
}
app.post('/convert-epub', upload.single('epub'), async (req, res) => {
	if (req.file.mimetype !== 'application/epub+zip') {
		return res.send('檔案並非 epub 類型，而且照理來說你不應該看到這個訊息，因為 html 的 form 有限制類型')
	}
	const newName = appendFileName(req.file.originalname, '-converted')
	await cvtEpub(req.file.path, {
		type: req.body.type
	})
	await downloadFile(res, req.file.path, newName) // res.download is not reliable as it would corrupt file
	if (await fs.exists(req.file.path)) {
		fs.unlink(req.file.path)
	}
})
app.post('/convert-txt', upload.single('txt'), async (req, res) => {
	if (req.file.mimetype !== 'text/plain') {
		return res.send('檔案並非 txt 類型，而且照理來說你不應該看到這個訊息，因為 html 的 form 有限制類型')
	}
	const newName = appendFileName(req.file.originalname, '-converted')
	await cvtText(req.file.path, {
		type: req.body.type
	})
	downloadFile(res, req.file.path, newName) // res.download is not reliable as it would corrupt file
	if (await fs.exists(req.file.path)) {
		fs.unlink(req.file.path)
	}
})

const PORT = process.env.PORT || 8763
app.listen(PORT, () => console.log(`Server is listening at http://localhost:${PORT}`))
