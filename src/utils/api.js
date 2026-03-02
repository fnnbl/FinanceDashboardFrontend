const BASE_URL = '/api/v1'

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { ...options.headers }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || `HTTP ${response.status}`)
  }
  return response.json()
}

export async function register(userData) {
  return request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })
}

export async function login(credentials) {
  const body = new URLSearchParams({
    username: credentials.email,
    password: credentials.password,
  })
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || `HTTP ${response.status}`)
  }
  return response.json()
}

export async function getCurrentUser() {
  return request('/auth/me')
}

export async function logout() {
  return request('/auth/logout', { method: 'POST' })
}

// Plans
export async function getPlans() {
  return request('/plans')
}

export async function createPlan(data) {
  return request('/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}
