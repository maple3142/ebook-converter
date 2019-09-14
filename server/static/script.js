// remember selected option
const selects = document.querySelectorAll('select')
for (const select of selects) {
	if (!select.id) continue
	select.addEventListener('change', () => {
		localStorage.setItem(select.id, select.value)
	})
	if (localStorage.getItem(select.id) !== null) {
		select.value = localStorage.getItem(select.id)
	}
}

// upload progress
if ('download' in document.createElement('a')) {
	const forms = document.querySelectorAll('.file-form')
	for (const form of forms) {
		const prog = document.createElement('progress')
		prog.max = 100
		prog.value = 0
		const label = document.createElement('span')
		label.style.marginLeft = '1px'
		form.appendChild(prog)
		form.appendChild(label)

		form.addEventListener('submit', e => {
			e.preventDefault()
			const data = new FormData(form)
			const xhr = new XMLHttpRequest()
			xhr.open(form.method, form.action)
			xhr.responseType = 'blob'
			xhr.upload.addEventListener('progress', e => {
				label.textContent = '上傳中...'
				if (!e.lengthComputable) return
				const val = (e.loaded / e.total) * 100
				prog.value = val
				if (Math.abs(val - 100) < Number.EPSILON) {
					label.textContent = '處理中...'
				}
			})
			xhr.addEventListener('progress', e => {
				label.textContent = '下載中...'
				if (!e.lengthComputable) return
				const val = (e.loaded / e.total) * 100
				prog.value = val
			})
			xhr.addEventListener('load', () => {
				label.textContent = '下載完成'
				prog.value = 100
				const fname = decodeURIComponent(xhr.getResponseHeader('X-File-Name'))
				const a = document.createElement('a')
				a.href = URL.createObjectURL(xhr.response)
				a.download = fname
				document.body.appendChild(a)
				a.click()
				URL.revokeObjectURL(a.href)
				a.remove()
			})
			xhr.send(data)
		})
	}
}
