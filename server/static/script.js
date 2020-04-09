// remember selected option
const selects = document.querySelectorAll('select')
for (let i = 0; i < selects.length; i++) {
	const select = selects[i]
	if (!select.id) continue
	select.addEventListener('change', () => {
		localStorage.setItem(select.id, select.value)
	})
	if (localStorage.getItem(select.id) !== null) {
		select.value = localStorage.getItem(select.id)
	}
}

function hcaptchaLoaded() {
	const widgetID = hcaptcha.render('hcaptcha-container', {
		sitekey: '3db6bb9f-c378-486d-acdf-7a3c61ad9a7f'
	})
	const forms = document.querySelectorAll('.file-form')
	for (let i = 0; i < forms.length; i++) {
		const form = forms[i]
		form.addEventListener('submit', e => {
			if (form.elements.file.files.length === 0) {
				e.preventDefault()
				return alert('沒有選擇要上傳的檔案')
			}
			const code = hcaptcha.getResponse(widgetID)
			if (!code) {
				e.preventDefault()
				return alert('沒有通過 Captcha 測試')
			}
			form.elements.captcha.value = code
		})
	}
}

const uid = localStorage.getItem('uid') || Math.random() + '.' + Math.random()
localStorage.setItem('uid', uid)
navigator.sendBeacon(
	'https://www.google-analytics.com/collect',
	new URLSearchParams({
		v: 1,
		tid: 'UA-108821694-3',
		cid: uid,
		t: 'pageview',
		dp: encodeURIComponent(location.pathname)
	}).toString()
)
