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
    const detail = data.detail
    const message = Array.isArray(detail)
      ? detail.map((e) => `${e.loc?.at(-1) ?? '?'}: ${e.msg}`).join(', ')
      : detail || `HTTP ${response.status}`
    throw new Error(message)
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
  const response = await fetch(`${BASE_URL}/auth/token`, {
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
  // JWT ist stateless - kein Backend-Call nötig, Token wird nur lokal gelöscht
}

// Categories
export async function getCategories() {
  return request('/categories/')
}

export async function createCategory(data) {
  return request('/categories/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function updateCategory(categoryId, data) {
  return request(`/categories/${categoryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function deleteCategory(categoryId, reassignTo = null) {
  const url = reassignTo
    ? `/categories/${categoryId}?reassign_to=${reassignTo}`
    : `/categories/${categoryId}`
  const token = getToken()
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${BASE_URL}${url}`, { method: 'DELETE', headers })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const detail = data.detail
    const message = Array.isArray(detail)
      ? detail.map((e) => `${e.loc?.at(-1) ?? '?'}: ${e.msg}`).join(', ')
      : detail || `HTTP ${response.status}`
    throw new Error(message)
  }
}

// Budget Items
export async function getBudgetItems(planId) {
  return request(`/plans/${planId}/items/`)
}

export async function createBudgetItem(planId, data) {
  return request(`/plans/${planId}/items/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function updateBudgetItem(planId, itemId, data) {
  return request(`/plans/${planId}/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function deleteBudgetItem(planId, itemId) {
  const token = localStorage.getItem('token')
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`/api/v1/plans/${planId}/items/${itemId}`, {
    method: 'DELETE',
    headers,
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || `HTTP ${response.status}`)
  }
}

// Plans
export async function getPlans() {
  return request('/plans/')
}

export async function createPlan(data) {
  return request('/plans/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function updatePlan(planId, data) {
  return request(`/plans/${planId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function getPlan(planId) {
  return request(`/plans/${planId}`)
}

async function exportFile(url) {
  const token = localStorage.getItem('token')
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(url, { headers })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || `HTTP ${response.status}`)
  }
  return response.blob()
}

export async function exportPlanPDF(planId) {
  return exportFile(`/api/v1/plans/${planId}/export/pdf`)
}

export async function exportPlanExcel(planId) {
  return exportFile(`/api/v1/plans/${planId}/export/csv`)
}

export async function duplicatePlan(planId) {
  return request(`/plans/${planId}/duplicate`, { method: 'POST' })
}

export async function deletePlan(planId) {
  const token = localStorage.getItem('token')
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`/api/v1/plans/${planId}`, {
    method: 'DELETE',
    headers,
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || `HTTP ${response.status}`)
  }
}
