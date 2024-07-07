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
