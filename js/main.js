// /assets/js/main.js

// const API_BASE = 'http://localhost:5050' // kerakli holatga moslashtiring
const API_BASE = 'https://dictionary-app-qnt7.onrender.com'

// Signup
const signupForm = document.getElementById('signupForm')
if (signupForm) {
	signupForm.addEventListener('submit', async e => {
		e.preventDefault()

		const reg_key = document.getElementById('reg_key').value
		const name = document.getElementById('name').value
		const phone = document.getElementById('phone').value
		const password = document.getElementById('password').value

		try {
			const res = await fetch(`${API_BASE}/user/signup-admin`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reg_key, name, phone, password }),
			})

			const data = await res.json()
			if (res.ok && data.success) {
				alert('Admin user created successfully')
				window.location.href = '../index.html'
			} else {
				alert(data.message || 'Xatolik yuz berdi')
			}
		} catch (err) {
			alert('Tarmoqda xatolik')
		}
	})
}

// Login
const loginForm = document.getElementById('loginForm')
if (loginForm) {
	loginForm.addEventListener('submit', async e => {
		e.preventDefault()

		const phone = document.getElementById('phone').value
		const password = document.getElementById('password').value

		try {
			const res = await fetch(`${API_BASE}/user/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phone, password }),
			})

			const data = await res.json()
			if (res.ok && data.data.token) {
				localStorage.setItem('token', data.data.token)
				window.location.href = '../pages/dictionary.html'
			} else {
				alert(data.message || 'Login yoki parol noto‘g‘ri')
			}
		} catch (err) {
			alert('Tarmoqda xatolik')
		}
	})
}
