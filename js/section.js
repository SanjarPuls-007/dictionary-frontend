// /assets/js/main.js
// const API_BASE_URL = 'http://localhost:5050'
const API_BASE_URL = 'https://dictionary-app-qnt7.onrender.com'

const token = localStorage.getItem('token')

const headers = {
	Authorization: `Bearer ${token}`,
}

// DOM Elements
const tableBody = document.getElementById('sectionTableBody')
const dictionaryFilter = document.getElementById('dictionaryFilter')
const searchInput = document.getElementById('searchInput')
const pagination = document.getElementById('pagination')
const alertContainer = document.getElementById('alertContainer')
const modal = document.getElementById('sectionModal')
const modalTitle = document.getElementById('modalTitle')
const sectionForm = document.getElementById('sectionForm')
const sectionNameInput = document.getElementById('sectionName')
const dictionarySelect = document.getElementById('dictionarySelect')
const imageUpload = document.getElementById('imageUpload')
const existingImageContainer = document.getElementById('existingImageContainer')
const existingImage = document.getElementById('existingImage')
const deleteImageBtn = document.getElementById('deleteImageBtn')
const uploadInputContainer = document.getElementById('uploadInputContainer')

let allSections = [],
	dictionaries = [],
	currentPage = 1,
	itemsPerPage = 10,
	editingId = null

async function fetchDictionaries() {
	const res = await fetch(`${API_BASE_URL}/dictionary/get-all`, { headers })
	const data = await res.json()
	dictionaries = data.data
	populateDictionaries()
}

function populateDictionaries() {
	dictionaryFilter.innerHTML = `<option value="all">Barchasi</option>`
	dictionarySelect.innerHTML = `<option value="">Lug'atni tanlang</option>`
	dictionaries.forEach(d => {
		const label = `${d.name} (${d.type})` // Masalan: English (Modern)

		const option1 = document.createElement('option')
		option1.value = d._id
		option1.textContent = label
		dictionaryFilter.appendChild(option1)

		const option2 = document.createElement('option')
		option2.value = d._id
		option2.textContent = label
		dictionarySelect.appendChild(option2)
	})
}

async function fetchSections(dictionaryId = null) {
	let url =
		dictionaryId && dictionaryId !== 'all'
			? `${API_BASE_URL}/section/by-dictionary/${dictionaryId}`
			: `${API_BASE_URL}/section/get-all`

	const res = await fetch(url, { headers })
	const data = await res.json()
	allSections = data.data
	renderTable()
}

function renderTable() {
	const search = searchInput.value.toLowerCase()

	const filtered = allSections.filter(s =>
		s.name.toLowerCase().includes(search)
	)

	const start = (currentPage - 1) * itemsPerPage
	const paginated = filtered.slice(start, start + itemsPerPage)

	tableBody.innerHTML = ''
	paginated.forEach((s, i) => {
		const tr = document.createElement('tr')
		tr.innerHTML = `
			<td>${start + i + 1}</td>
			<td>${s.name}</td>
			<td>
  ${s.related_dic?.name || ''}
  ${
		s.related_dic?.type
			? ` <i style="color:gray;">(${s.related_dic.type})</i>`
			: ''
	}
</td>

			<td>${
				s.image
					? `<img src="${s.image}" class="thumb" style="width: 80px; height: 80px;" />`
					: ''
			}</td>
			<td>
				<button onclick="addCategory('${s._id}')">Kategoriya qo'shish</button>
				<button onclick="openModal('edit', '${s._id}')">Tahrirlash</button>
				<button onclick="deleteSection('${s._id}')">O'cirish</button>
			</td>
		`
		tableBody.appendChild(tr)
	})

	renderPagination(filtered.length)
}

async function addCategory(sectionId) {
	const section = allSections.find(s => s._id === sectionId)
	if (!section) {
		alert('❌ Bo‘lim topilmadi')
		return
	}

	const name = prompt('📝 Kategoriya nomini kiriting:')

	// related_dic obyekt bo‘lishi yoki _id bo‘lishi mumkin
	const dictionaryId =
		typeof section.related_dic === 'object'
			? section.related_dic._id
			: section.related_dic

	if (!dictionaryId || !section._id) {
		alert('❌ Dictionary yoki Section aniqlanmadi.')
		return
	}

	const body = {
		name: name.trim(),
		related_dic: dictionaryId,
		related_sec: section._id,
	}

	console.log(dictionaryId)
	console.log(section.related_dic)

	try {
		const res = await fetch(`${API_BASE_URL}/category/add`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		})

		const json = await res.json()

		if (json.success) {
			showAlert(true, '✅ Kategoriya muvaffaqiyatli qo‘shildi.')
		} else {
			showAlert(false, '❌ Xatolik: ' + (json.message || 'Saqlanmadi.'))
		}
	} catch (err) {
		showAlert(false, '❌ Server xatoligi: ' + err.message)
	}
}

function renderPagination(totalItems) {
	const pageCount = Math.ceil(totalItems / itemsPerPage)
	pagination.innerHTML = ''
	for (let i = 1; i <= pageCount; i++) {
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

async function openModal(mode, id = null) {
	modal.classList.remove('hidden')
	modalTitle.textContent =
		mode === 'edit' ? "Bo'limni tahrirlash" : "Bo'lim qo'shish"
	sectionForm.reset()
	existingImageContainer.classList.add('hidden')
	uploadInputContainer.classList.remove('hidden')
	imageUpload.value = ''
	editingId = null

	if (mode === 'edit') {
		const section = allSections.find(s => s._id === id)
		sectionNameInput.value = section.name
		dictionarySelect.value = section.related_dic._id
		editingId = id
		if (section.image) {
			existingImageContainer.classList.remove('hidden')
			existingImage.src = section.image
			uploadInputContainer.classList.add('hidden')
		}
	}
}

document.getElementById('cancelModalBtn').onclick = () =>
	modal.classList.add('hidden')
deleteImageBtn.onclick = () => {
	existingImageContainer.classList.add('hidden')
	uploadInputContainer.classList.remove('hidden')
}

// Upload Image
async function uploadImageFile(file) {
	const formData = new FormData()
	formData.append('image', file)

	const res = await fetch(`${API_BASE_URL}/upload`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` },
		body: formData,
	})

	const json = await res.json()
	if (json.success && json.file_path) return json.file_path
	else return ''
}

sectionForm.onsubmit = async e => {
	e.preventDefault()

	const name = sectionNameInput.value
	const related_dic = dictionarySelect.value
	const file = imageUpload.files[0]

	const body = { name, related_dic }

	if (file) {
		const image_url = await uploadImageFile(file)
		if (!image_url) {
			showAlert(false, "❌ Rasm yuklanmadi. Ma'lumot saqlanmadi.")
			return
		}
		body.image = image_url
	}

	const url = editingId
		? `${API_BASE_URL}/section/update/${editingId}`
		: `${API_BASE_URL}/section/add`
	const method = editingId ? 'PUT' : 'POST'

	try {
		const res = await fetch(url, {
			method,
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		})

		const json = await res.json()

		if (json.success) {
			showAlert(true, editingId ? '✅ Tahrirlandi!' : '✅ Qo‘shildi!')
			modal.classList.add('hidden')
			fetchSections(dictionaryFilter.value)
		} else {
			showAlert(false, '❌ Xatolik: ' + (json.message || 'Saqlanmadi.'))
		}
	} catch (err) {
		showAlert(false, '❌ Server xatoligi: ' + err.message)
	}
}

async function deleteSection(id) {
	if (!confirm('Are you sure?')) return
	const res = await fetch(`${API_BASE_URL}/section/delete/${id}`, {
		method: 'DELETE',
		headers,
	})
	const data = await res.json()
	showAlert(data.success, data.msg)
	fetchSections(dictionaryFilter.value)
}

function showAlert(success, msg) {
	alertContainer.textContent = msg
	alertContainer.classList.remove('hidden')
	alertContainer.classList.toggle('success', success)
	alertContainer.classList.toggle('error', !success)
	setTimeout(() => alertContainer.classList.add('hidden'), 3000)
}

document.getElementById('addSectionBtn').onclick = () => openModal('add')
searchInput.oninput = () => renderTable()
dictionaryFilter.onchange = () => {
	currentPage = 1
	fetchSections(dictionaryFilter.value)
}

if (!token) window.location.href = '../login.html'
fetchDictionaries()
fetchSections()
