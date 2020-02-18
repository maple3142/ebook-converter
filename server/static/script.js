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
