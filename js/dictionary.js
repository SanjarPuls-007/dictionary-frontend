// const API_BASE_URL = 'http://localhost:5050'
const API_BASE_URL = 'https://dictionary-app-qnt7.onrender.com'

const token = localStorage.getItem('token')

// Redirect to login if token not found
if (!token) {
	window.location.href = '../index.html'
}

const headers = {
	'Content-Type': 'application/json',
	Authorization: `Bearer ${token}`,
}

let currentPage = 1
let currentFilter = 'all'
let currentSearch = ''

// Fetch Dictionaries
async function fetchDictionaries(page = 1) {
	currentPage = page
	let url = `${API_BASE_URL}/dictionary/get-all?page=${page}&limit=10`
	if (currentFilter !== 'all') url += `&type=${currentFilter}`
	if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`

	const res = await fetch(url, { headers })
	const json = await res.json()
	if (json.success) {
		renderDictionaries(json.data, json.pagination.totalCount, page)
	}
}

// Render Table
function renderDictionaries(data, total, page) {
	const tbody = document.getElementById('dictionaryList')
	tbody.innerHTML = ''

	data.forEach((item, index) => {
		const tr = document.createElement('tr')
		tr.innerHTML = `
      <td>${(page - 1) * 10 + index + 1}</td>
      <td>${item.name} 
			${item.type ? ` <i style="color:gray;">(${item.type})</i>` : ''}</td>
			<td>${item.desc || 'No description'}</td>
      <td><img src="${
				item.image
			}" alt="Image" style="width: 80px; height: 80px;" /></td>
      <td>
        <button onclick="openDictionaryModal('edit', '${
					item._id
				}')">Tahrirlash</button>
        <button onclick="deleteDictionary('${item._id}')">O'chirish</button>
      </td>
    `
		tbody.appendChild(tr)
	})

	renderPagination(total, page)
}

// Render Pagination
function renderPagination(total, currentPage) {
	const container = document.getElementById('pagination')
	container.innerHTML = ''
	const totalPages = Math.ceil(total / 10)

	for (let i = 1; i <= totalPages; i++) {
		const btn = document.createElement('button')
		btn.textContent = i
		btn.className = i === currentPage ? 'active' : ''
		btn.onclick = () => fetchDictionaries(i)
		container.appendChild(btn)
	}
}

// Open Modal
async function openDictionaryModal(mode, id = '') {
	const modal = document.getElementById('dictionaryModal')
	modal.classList.add('show')
	document.getElementById('modalTitle').textContent =
		mode === 'edit' ? "Lug'atni tahrirlash" : "Lug'at qo'shish"
	document.getElementById('dictionaryForm').reset()
	document.getElementById('dictionaryId').value = ''
	document.getElementById('existingImageContainer').classList.add('hidden')
	document.getElementById('dictionaryImage').classList.remove('hidden')

	if (mode === 'edit') {
		const res = await fetch(`${API_BASE_URL}/dictionary/get-by-id/${id}`, {
			headers,
		})
		const json = await res.json()

		if (json.success) {
			const dic = json.data
			document.getElementById('dictionaryId').value = dic._id
			document.getElementById('dictionaryName').value = dic.name
			document.getElementById('dictionaryDescription').value = dic.desc || ''
			document.querySelector(
				`input[name="dictionaryType"][value="${dic.type}"]`
			).checked = true

			if (dic.image) {
				document
					.getElementById('existingImageContainer')
					.classList.remove('hidden')
				document.getElementById('existingImagePreview').src = dic.image
				document.getElementById('dictionaryImage').classList.add('hidden')
			}
		}
	}
}

// Close Modal
document.getElementById('cancelModalBtn').onclick = () => {
	document.getElementById('dictionaryModal').classList.remove('show')
}

// Delete Dictionary
async function deleteDictionary(id) {
	if (!confirm('Are you sure you want to delete this dictionary?')) return

	const res = await fetch(`${API_BASE_URL}/dictionary/delete/${id}`, {
		method: 'DELETE',
		headers,
	})

	const json = await res.json()
	if (json.success) {
		alert('✅ Dictionary deleted successfully.')
		fetchDictionaries(currentPage)
	} else {
		alert('❌ Error deleting dictionary.')
	}
}

// Delete Image
document.getElementById('deleteImageBtn').onclick = async () => {
	// Rasm mavjud emas: preview'ni yashiramiz, file inputni ko‘rsatamiz
	document.getElementById('existingImageContainer').classList.add('hidden')
	document.getElementById('dictionaryImage').classList.remove('hidden')
	// Rasm mavjud: mavjud rasmni ko‘rsatamiz, file inputni yashiramiz
	document.getElementById('existingImagePreview').src = dic.image
	document.getElementById('existingImageContainer').classList.remove('hidden')
	document.getElementById('dictionaryImage').classList.add('hidden')
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

// Save (Add or Edit)
document.getElementById('dictionaryForm').onsubmit = async e => {
	e.preventDefault()

	const id = document.getElementById('dictionaryId').value
	const name = document.getElementById('dictionaryName').value
	const type = document.querySelector(
		'input[name="dictionaryType"]:checked'
	)?.value
	const desc = document.getElementById('dictionaryDescription').value
	const file = document.getElementById('dictionaryImage').files[0]

	const body = { name, type, desc }

	if (file) {
		const image_url = await uploadImageFile(file)
		if (!image_url) {
			alert("❌ Rasm yuklanmadi. Ma'lumot saqlanmadi.")
			return
		}
		body.image = image_url
	}

	const url = id
		? `${API_BASE_URL}/dictionary/update/${id}`
		: `${API_BASE_URL}/dictionary/add`

	try {
		const res = await fetch(url, {
			method: id ? 'PUT' : 'POST',
			headers,
			body: JSON.stringify(body),
		})

		const json = await res.json()

		if (json.success) {
			alert(id ? "✅ Ma'lumot tahrirlandi!" : "✅ Ma'lumot qo‘shildi!")
			document.getElementById('dictionaryModal').classList.remove('show')
			fetchDictionaries(currentPage)
		} else {
			alert('❌ Xatolik: ' + (json.message || "Ma'lumot saqlanmadi."))
		}
	} catch (err) {
		alert('❌ Server xatoligi: ' + err.message)
	}
}

// Search & Filter
document.getElementById('searchInput').oninput = e => {
	currentSearch = e.target.value
	fetchDictionaries(1)
}

document.getElementById('typeFilter').onchange = e => {
	currentFilter = e.target.value
	fetchDictionaries(1)
}

// Add Button
document.getElementById('addDictionaryBtn').onclick = () =>
	openDictionaryModal('add')

// Initial Load
window.onload = () => {
	fetchDictionaries()
}
