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
