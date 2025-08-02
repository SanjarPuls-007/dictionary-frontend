document.addEventListener('DOMContentLoaded', () => {
	// const API_BASE_URL = 'http://localhost:5050'
	const API_BASE_URL = 'https://dictionary-app-qnt7.onrender.com'

	const token = localStorage.getItem('token')

	if (!token) {
		window.location.href = '../login.html'
	}

	const headers = { Authorization: `Bearer ${token}` }

	// Form & dropdowns
	const wordInput = document.getElementById('wordInput')
	const descriptionInput = document.getElementById('descriptionInput')
	const dictionarySelect = document.getElementById('dictionarySelect')
	const sectionSelect = document.getElementById('sectionSelect')
	const categorySelect = document.getElementById('categorySelect')
	const existingImage = document.getElementById('existingImage')

	// Filters
	const dictionaryFilter = document.getElementById('dictionaryFilter')
	const sectionFilter = document.getElementById('sectionFilter')
	const categoryFilter = document.getElementById('categoryFilter')
	const searchInput = document.getElementById('searchInput')

	// Modal & buttons
	const wordForm = document.getElementById('wordForm')
	const modal = document.getElementById('wordModal')
	const modalTitle = document.getElementById('modalTitle')
	const imageUpload = document.getElementById('imageUpload')
	const existingImageContainer = document.getElementById(
		'existingImageContainer'
	)
	const uploadInputContainer = document.getElementById('uploadInputContainer')
	const deleteImageBtn = document.getElementById('deleteImageBtn')
	const addWordBtn = document.getElementById('addWordBtn')
	const closeModalBtn = document.getElementById('closeModalBtn')

	const tableBody = document.getElementById('wordsTableBody')
	const pagination = document.getElementById('pagination')
	const alertContainer = document.getElementById('alertContainer')

	let allWords = []
	let dictionaries = [],
		sections = [],
		categories = []

	let currentPage = 1
	const itemsPerPage = 10
	let editingId = null
	let imageUrl = ''

	// Word detail modal elements
	const wordDetailModal = document.getElementById('wordDetailModal')
	const closeDetailModalBtn = document.getElementById('closeDetailModalBtn')

	const detailWord = document.getElementById('detailWord')
	const detailDesc = document.getElementById('detailDesc')
	const detailDictionary = document.getElementById('detailDictionary')
	const detailSection = document.getElementById('detailSection')
	const detailCategory = document.getElementById('detailCategory')
	const detailImage = document.getElementById('detailImage')

	// Show word detail modal
	window.showWordDetails = id => {
		const word = allWords.find(w => w._id === id)
		if (!word) return

		detailWord.textContent = word.name || ''
		detailDesc.textContent = word.desc || '—'
		detailDictionary.textContent = `${word.related_dic?.name || ''} (${
			word.related_dic?.type || ''
		})`
		detailSection.textContent = word.related_sec?.name || ''
		detailCategory.textContent = word.related_cat?.name || ''
		detailImage.src = word.image || ''
		wordDetailModal.classList.remove('hidden')
	}

	closeDetailModalBtn.onclick = () => wordDetailModal.classList.add('hidden')

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
		dictionaryFilter.innerHTML =
			'<option value="all">Barcha lug\'atlar</option>'
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
	async function fetchCategories(sectionId = '', target = 'both') {
		let url = sectionId
			? `${API_BASE_URL}/category/by-section/${sectionId}`
			: `${API_BASE_URL}/category/get-all`

		const res = await fetch(url, { headers })
		const json = await res.json()
		if (json.success) {
			categories = json.data
			populateCategories(target)
		}
	}

	function populateCategories(target = 'both') {
		if (target === 'both' || target === 'filter') {
			categoryFilter.innerHTML =
				'<option value="all">Barcha kategoriyalar</option>'
			categories.forEach(c => {
				const opt = new Option(c.name, c._id)
				categoryFilter.appendChild(opt)
			})
		}

		if (target === 'both' || target === 'select') {
			categorySelect.innerHTML = '<option value="">Kategoriya tanlang</option>'
			categories.forEach(c => {
				const opt = new Option(c.name, c._id)
				categorySelect.appendChild(opt)
			})
		}
	}

	//Fetch Words
	async function fetchWords() {
		try {
			const res = await fetch(`${API_BASE_URL}/words/get-all`, { headers })
			const data = await res.json()
			allWords = data.data || []
			renderTable() // ← Jadvalni yangilashni unutmang!
		} catch (error) {
			console.error('Xatolik:', error)
		}
	}

	//Render Table
	function renderTable() {
		const search = searchInput.value.toLowerCase()
		let filtered = allWords.filter(w => w.name.toLowerCase().includes(search))

		const dicFilter = dictionaryFilter.value
		const secFilter = sectionFilter.value
		const catFilter = categoryFilter.value

		if (dicFilter !== 'all') {
			filtered = filtered.filter(w => w.related_dic?._id === dicFilter)
		}
		if (secFilter !== 'all') {
			filtered = filtered.filter(w => w.related_sec?._id === secFilter)
		}
		if (catFilter !== 'all') {
			filtered = filtered.filter(w => w.related_cat?._id === catFilter)
		}

		tableBody.innerHTML = ''
		const start = (currentPage - 1) * itemsPerPage
		const pageData = filtered.slice(start, start + itemsPerPage)

		pageData.forEach((word, index) => {
			const tr = document.createElement('tr')
			tr.innerHTML = `
        <td>${start + index + 1}</td>
        <td><span class="clickable" onclick="showWordDetails('${word._id}')">${
				word.name
			}</span></td>
        <td>${word.related_dic?.name || ''} (${
				word.related_dic?.type || ''
			})</td>
        <td>${word.related_sec?.name || ''}</td>
        <td>${word.related_cat?.name || ''}</td>
        <td><img src="${word.image}" alt="" width="40" /></td>
        <td>
          <button onclick="openModal('edit', '${word._id}')">Tahrirlash</button>
          <button onclick="deleteWord('${word._id}')">O'chirish</button>
        </td>`

			tableBody.appendChild(tr)
		})
		renderPagination(filtered.length)
	}

	//Render Pagination
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
			mode === 'edit' ? "So'zni tahrirlash" : "Yangi so'z qo'shish"
		wordForm.reset()
		existingImageContainer.classList.add('hidden')
		uploadInputContainer.classList.remove('hidden')
		imageUpload.value = ''
		editingId = null
		if (mode === 'edit') {
			const word = allWords.find(w => w._id === id)

			wordInput.value = word.name
			descriptionInput.value = word.desc
			dictionarySelect.value = word.related_dic._id
			await fetchSections(word.related_dic._id)
			sectionSelect.value = word.related_sec._id
			await fetchCategories(word.related_sec._id)
			categorySelect.value = word.related_cat._id
			editingId = id
			if (word.image) {
				existingImageContainer.classList.remove('hidden')
				existingImage.src = word.image
				uploadInputContainer.classList.add('hidden')
			}
		}
	}

	closeModalBtn.onclick = () => modal.classList.add('hidden')
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

	//
	dictionarySelect.onchange = async () => {
		const dicId = dictionarySelect.value
		await fetchSections(dicId)
	}
	sectionSelect.onchange = async () => {
		const secId = sectionSelect.value
		await fetchCategories(secId)
	}

	// Submit
	wordForm.addEventListener('submit', async e => {
		e.preventDefault()
		const name = wordInput.value.trim()
		const desc = descriptionInput.value.trim()
		const dic = dictionarySelect.value
		const sec = sectionSelect.value
		const cat = categorySelect.value
		const image = imageUpload.files[0]

		if (!name) return showAlert('Word is required', 'error')
		const body = {
			name,
			desc,
			related_dic: dic,
			related_sec: sec,
			related_cat: cat,
		}

		if (image) {
			const image_url = await uploadImageFile(image)
			if (!image_url) {
				showAlert(false, "❌ Rasm yuklanmadi. Ma'lumot saqlanmadi.")
				return
			}
			body.image = image_url
		}

		const url = editingId
			? `${API_BASE_URL}/words/update/${editingId}`
			: `${API_BASE_URL}/words/add`
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

			const result = await res.json()
			if (result.success) {
				showAlert(true, editingId ? 'Updated' : 'Added') // ✅ to‘g‘ri
				modal.classList.add('hidden')
				await fetchWords()
			} else {
				showAlert(false, result.message || 'Failed')
			}
		} catch (err) {
			showAlert(false, err.message)
		}
	})

	function showAlert(success, msg) {
		alertContainer.textContent = msg
		alertContainer.classList.remove('hidden')
		alertContainer.classList.toggle('success', success)
		alertContainer.classList.toggle('error', !success)
		setTimeout(() => alertContainer.classList.add('hidden'), 3000)
	}

	window.deleteWord = async id => {
		const confirmDelete = confirm('Are you sure you want to delete?')
		if (!confirmDelete) return

		await fetch(`${API_BASE_URL}/words/delete/${id}`, {
			method: 'DELETE',
			headers,
		})
		showAlert(true, 'Deleted')
		await fetchWords()
	}

	// Init
	addWordBtn.onclick = () => openModal('add')
	searchInput.oninput = () => renderTable()
	dictionaryFilter.onchange = async () => {
		currentPage = 1
		await fetchSections(dictionaryFilter.value)
	}

	sectionFilter.onchange = async () => {
		currentPage = 1
		await fetchCategories(sectionFilter.value)
	}

	window.openModal = openModal
	fetchDictionaries()
	fetchSections()
	fetchCategories()
	window.fetchWords = fetchWords // Expose for debugging
	fetchWords()
	renderTable()
})
