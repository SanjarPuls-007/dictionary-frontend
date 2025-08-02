// /assets/js/category.js
// const API_BASE_URL = 'http://localhost:5050'
const API_BASE_URL = 'https://dictionary-app-qnt7.onrender.com'

const token = localStorage.getItem('token')

if (!token) window.location.href = '../index.html'

const headers = {
	Authorization: `Bearer ${token}`,
	'Content-Type': 'application/json',
}

const categoryTableBody = document.getElementById('categoryTableBody')
const dictionaryFilter = document.getElementById('dictionaryFilter')
const sectionFilter = document.getElementById('sectionFilter')
const searchInput = document.getElementById('searchInput')
const pagination = document.getElementById('pagination')
const alertContainer = document.getElementById('alertContainer')

const modal = document.getElementById('categoryModal')
const modalTitle = document.getElementById('modalTitle')
const categoryForm = document.getElementById('categoryForm')
const categoryNameInput = document.getElementById('categoryName')
const dictionarySelect = document.getElementById('dictionarySelect')
const sectionSelect = document.getElementById('sectionSelect')

let allCategories = [],
	dictionaries = [],
	sections = []
let currentPage = 1,
	itemsPerPage = 10,
	editingId = null

// Fetch Dictionaries
async function fetchDictionaries() {
	const res = await fetch(`${API_BASE_URL}/dictionary/get-all`, { headers })
	const json = await res.json()
	if (json.success) {
		dictionaries = json.data
		populateDictionaries()
	}
}

function populateDictionaries() {
	dictionaryFilter.innerHTML = '<option value="all">Barcha lug\'atlar</option>'
	dictionarySelect.innerHTML = '<option value="">Lug\'atni tanlang</option>'

	dictionaries.forEach(d => {
		const label = `${d.name} - ${d.type ? `(${d.type})` : ''}`

		const opt1 = new Option(label, d._id)
		const opt2 = new Option(label, d._id)

		dictionaryFilter.appendChild(opt1)
		dictionarySelect.appendChild(opt2)
	})
}

// Fetch Sections
async function fetchSections(dictionaryId = '', target = 'both') {
	let url = dictionaryId
		? `${API_BASE_URL}/section/by-dictionary/${dictionaryId}`
		: `${API_BASE_URL}/section/get-all`

	const res = await fetch(url, { headers })
	const json = await res.json()
	if (json.success) {
		sections = json.data
		populateSections(target)
	}
}

function populateSections(target = 'both') {
	if (target === 'both' || target === 'filter') {
		sectionFilter.innerHTML = '<option value="all">Barcha bo\'limlar</option>'
		sections.forEach(s => {
			const opt = new Option(s.name, s._id)
			sectionFilter.appendChild(opt)
		})
	}

	if (target === 'both' || target === 'select') {
		sectionSelect.innerHTML = '<option value="">Bo\'limni tanlang</option>'
		sections.forEach(s => {
			const opt = new Option(s.name, s._id)
			sectionSelect.appendChild(opt)
		})
	}
}

// Fetch Categories
async function fetchCategories() {
	const res = await fetch(`${API_BASE_URL}/category/get-all`, { headers })
	const json = await res.json()
	if (json.success) {
		allCategories = json.data
		renderTable()
	}
}

function renderTable() {
	const search = searchInput.value.toLowerCase()
	let filtered = allCategories.filter(c =>
		c.name.toLowerCase().includes(search)
	)

	const dicFilter = dictionaryFilter.value
	const secFilter = sectionFilter.value

	if (dicFilter !== 'all') {
		filtered = filtered.filter(c => c.related_dic?._id === dicFilter)
	}
	if (secFilter !== 'all') {
		filtered = filtered.filter(c => c.related_sec?._id === secFilter)
	}

	const start = (currentPage - 1) * itemsPerPage
	const paginated = filtered.slice(start, start + itemsPerPage)

	categoryTableBody.innerHTML = ''

	paginated.forEach((c, i) => {
		const tr = document.createElement('tr')
		tr.innerHTML = `
      <td>${start + i + 1}</td>
      <td>${c.name}</td>
      <td>${c.related_sec?.name || ''}</td>
      <td>
  ${c.related_dic?.name || ''}
  ${
		c.related_dic?.type
			? ` <i style="color:gray;">(${c.related_dic.type})</i>`
			: ''
	}
</td>

      <td>
        <button onclick="openModal('edit', '${c._id}')">Tahrirlash</button>
        <button onclick="deleteCategory('${c._id}')">O'chirish</button>
      </td>
    `

		categoryTableBody.appendChild(tr)
	})

	renderPagination(filtered.length)
}

function renderPagination(total) {
	const pages = Math.ceil(total / itemsPerPage)
	pagination.innerHTML = ''
	for (let i = 1; i <= pages; i++) {
		const btn = document.createElement('button')
		btn.textContent = i
		if (i === currentPage) btn.classList.add('active')
		btn.onclick = () => {
			currentPage = i
			renderTable()
		}
		pagination.appendChild(btn)
	}
}

async function openModal(mode, id = '') {
	modal.classList.remove('hidden')
	modalTitle.textContent =
		mode === 'edit' ? 'Kategoriyani tahrirlash' : "Kategoriya qo'shish"
	categoryForm.reset()
	editingId = null
	if (mode === 'edit') {
		const cat = allCategories.find(c => c._id === id)
		categoryNameInput.value = cat.name
		dictionarySelect.value = cat.related_dic?._id || ''
		await fetchSections(cat.related_dic?._id)
		sectionSelect.value = cat.related_sec?._id || ''
		editingId = id
	}
}

document.getElementById('cancelModalBtn').onclick = () =>
	modal.classList.add('hidden')
document.getElementById('modalCloseBtn').onclick = () =>
	modal.classList.add('hidden')

dictionarySelect.onchange = async () => {
	const dicId = dictionarySelect.value
	await fetchSections(dicId)
}

categoryForm.onsubmit = async e => {
	e.preventDefault()
	const name = categoryNameInput.value
	const dictionaryId = dictionarySelect.value
	const sectionId = sectionSelect.value

	const body = { name, related_dic: dictionaryId, related_sec: sectionId }
	const url = editingId
		? `${API_BASE_URL}/category/update/${editingId}`
		: `${API_BASE_URL}/category/add`
	const method = editingId ? 'PUT' : 'POST'

	try {
		const res = await fetch(url, {
			method,
			headers,
			body: JSON.stringify(body),
		})

		const json = await res.json()
		if (json.success) {
			showAlert(true, editingId ? 'Updated!' : 'Added!')
			modal.classList.add('hidden')
			fetchCategories()
		} else {
			showAlert(false, json.message || 'Failed')
		}
	} catch (err) {
		showAlert(false, err.message)
	}
}

async function deleteCategory(id) {
	if (!confirm('Delete this category?')) return
	const res = await fetch(`${API_BASE_URL}/category/delete/${id}`, {
		method: 'DELETE',
		headers,
	})
	const json = await res.json()
	showAlert(json.success, json.message)
	fetchCategories()
}

function showAlert(success, msg) {
	alertContainer.textContent = msg
	alertContainer.classList.remove('hidden')
	alertContainer.classList.toggle('success', success)
	alertContainer.classList.toggle('error', !success)
	setTimeout(() => alertContainer.classList.add('hidden'), 3000)
}

searchInput.oninput = () => renderTable()
dictionaryFilter.onchange = () => {
	currentPage = 1
	renderTable()
}
sectionFilter.onchange = () => {
	currentPage = 1
	renderTable()
}
document.getElementById('addCategoryBtn').onclick = () => openModal('add')

fetchDictionaries()
fetchSections()
fetchCategories()
