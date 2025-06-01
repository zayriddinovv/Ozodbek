  // API Configuration
  const API_BASE_URL = 'http://localhost:5000/api';
  let currentUser = null;

  // Utility Functions
  function showAlert(elementId, message, type = 'error') {
  const alertElement = document.getElementById(elementId);
  alertElement.className = `alert alert-${type} show`;
  alertElement.textContent = message;
  setTimeout(() => {
  alertElement.classList.remove('show');
}, 5000);
}

  function hideAlert(elementId) {
  const alertElement = document.getElementById(elementId);
  alertElement.classList.remove('show');
}

  function showLoading(form) {
  const loading = form.querySelector('.loading');
  const button = form.querySelector('button[type="submit"]');
  loading.classList.remove('hidden');
  button.disabled = true;
}

  function hideLoading(form) {
  const loading = form.querySelector('.loading');
  const button = form.querySelector('button[type="submit"]');
  loading.classList.add('hidden');
  button.disabled = false;
}

  // Modal Functions
  function showModal(modalId) {
  document.getElementById(modalId).classList.add('active');
  document.body.style.overflow = 'hidden';
}

  function hideModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  document.body.style.overflow = 'auto';
  // Clear form data
  const form = document.querySelector(`#${modalId} form`);
  if (form) form.reset();
  // Hide alerts
  const alert = document.querySelector(`#${modalId} .alert`);
  if (alert) alert.classList.remove('show');
}

  // Page Navigation
  function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // Show selected page
  document.getElementById(pageId + 'Page').classList.add('active');

  // Update navigation
  document.querySelectorAll('.nav-links a').forEach(link => {
  link.classList.remove('active');
});

  if (pageId === 'home') {
  document.querySelector('.nav-links a[onclick*="home"]').classList.add('active');
} else if (pageId === 'services') {
  document.querySelector('.nav-links a[onclick*="services"]').classList.add('active');
} else if (pageId === 'contact') {
  document.querySelector('.nav-links a[onclick*="contact"]').classList.add('active');
}

  // Load dashboard data if needed
  if (pageId === 'dashboard' && currentUser) {
  loadDashboardData();
}
}

  // Authentication Functions
  async function login(email, password) {
  try {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
  'Content-Type': 'application/json',
},
  body: JSON.stringify({ email, password }),
});

  const data = await response.json();

  if (response.ok) {
  localStorage.setItem('token', data.token);
  currentUser = data.user;
  updateAuthUI();
  hideModal('loginModal');
  showAlert('loginAlert', 'Успешный вход!', 'success');
  return true;
} else {
  throw new Error(data.message);
}
} catch (error) {
  showAlert('loginAlert', error.message);
  return false;
}
}

  async function register(name, email, phone, password) {
  try {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
  method: 'POST',
  headers: {
  'Content-Type': 'application/json',
},
  body: JSON.stringify({ name, email, phone, password }),
});

  const data = await response.json();

  if (response.ok) {
  localStorage.setItem('token', data.token);
  currentUser = data.user;
  updateAuthUI();
  hideModal('registerModal');
  showAlert('registerAlert', 'Регистрация успешна!', 'success');
  return true;
} else {
  throw new Error(data.message);
}
} catch (error) {
  showAlert('registerAlert', error.message);
  return false;
}
}

  async function loadUserProfile() {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
  headers: {
  'Authorization': `Bearer ${token}`,
},
});

  const data = await response.json();

  if (response.ok) {
  currentUser = data.user;
  updateAuthUI();
  return true;
} else {
  localStorage.removeItem('token');
  return false;
}
} catch (error) {
  console.error('Error loading profile:', error);
  localStorage.removeItem('token');
  return false;
}
}

  async function updateProfile(name, phone) {
  const token = localStorage.getItem('token');
  try {
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
  method: 'PUT',
  headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
},
  body: JSON.stringify({ name, phone }),
});

  const data = await response.json();

  if (response.ok) {
  currentUser = data.user;
  updateAuthUI();
  hideModal('editProfileModal');
  showAlert('editProfileAlert', 'Профиль успешно обновлен!', 'success');
  return true;
} else {
  throw new Error(data.message);
}
} catch (error) {
  showAlert('editProfileAlert', error.message);
  return false;
}
}

  function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  updateAuthUI();
  showPage('home');
}

  function updateAuthUI() {
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const userMenu = document.getElementById('userMenu');

  if (currentUser) {
  loginBtn.classList.add('hidden');
  registerBtn.classList.add('hidden');
  userMenu.classList.remove('hidden');

  // Update user profile in dashboard
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userEmail').textContent = currentUser.email;
  document.getElementById('userPhone').textContent = currentUser.phone;
  document.getElementById('userWelcome').textContent = `Добро пожаловать, ${currentUser.name}!`;

  // Fill edit form
  document.getElementById('editName').value = currentUser.name;
  document.getElementById('editPhone').value = currentUser.phone;

  // Show admin features if user is admin
  if (currentUser.role === 'admin') {
  document.getElementById('adminStats').style.display = 'grid';
  document.getElementById('requestsTable').style.display = 'block';
  document.getElementById('userDashboard').style.display = 'none';
} else {
  document.getElementById('adminStats').style.display = 'none';
  document.getElementById('requestsTable').style.display = 'none';
  document.getElementById('userDashboard').style.display = 'block';
}
} else {
  loginBtn.classList.remove('hidden');
  registerBtn.classList.remove('hidden');
  userMenu.classList.add('hidden');
}
}

  // Contact Form Functions
  async function submitContactForm(formData) {
  try {
  const response = await fetch(`${API_BASE_URL}/contact`, {
  method: 'POST',
  headers: {
  'Content-Type': 'application/json',
},
  body: JSON.stringify(formData),
});

  const data = await response.json();

  if (response.ok) {
  showAlert('contactAlert', 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
  document.getElementById('contactForm').reset();
  return true;
} else {
  throw new Error(data.message);
}
} catch (error) {
  showAlert('contactAlert', error.message);
  return false;
}
}

  // Dashboard Functions
  async function loadDashboardData() {
  if (!currentUser || currentUser.role !== 'admin') return;

  const token = localStorage.getItem('token');
  try {
  const response = await fetch(`${API_BASE_URL}/contact`, {
  headers: {
  'Authorization': `Bearer ${token}`,
},
});

  const data = await response.json();

  if (response.ok) {
  updateStats(data.contacts);
  updateRequestsTable(data.contacts);
}
} catch (error) {
  console.error('Error loading dashboard data:', error);
}
}

  function updateStats(contacts) {
  const total = contacts.length;
  const newCount = contacts.filter(c => c.status === 'new').length;
  const inProgress = contacts.filter(c => c.status === 'in_progress').length;
  const completed = contacts.filter(c => c.status === 'completed').length;

  document.getElementById('totalRequests').textContent = total;
  document.getElementById('newRequests').textContent = newCount;
  document.getElementById('inProgressRequests').textContent = inProgress;
  document.getElementById('completedRequests').textContent = completed;
}

  function updateRequestsTable(contacts) {
  const tbody = document.getElementById('requestsTableBody');
  tbody.innerHTML = '';

  contacts.forEach(contact => {
  const row = document.createElement('tr');
  row.innerHTML = `
                    <td>${contact.name}</td>
                    <td>${contact.deviceModel}</td>
                    <td>${contact.problemDescription.substring(0, 50)}...</td>
                    <td><span class="status-badge status-${contact.status.replace('_', '')}">${getStatusText(contact.status)}</span></td>
                    <td>${new Date(contact.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-ghost" onclick="updateRequestStatus('${contact._id}', 'in_progress')" style="padding: 0.5rem;">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn btn-ghost" onclick="updateRequestStatus('${contact._id}', 'completed')" style="padding: 0.5rem;">
                            <i class="fas fa-check"></i>
                        </button>
                    </td>
                `;
  tbody.appendChild(row);
});
}

  function getStatusText(status) {
  const statusMap = {
  'new': 'Новая',
  'in_progress': 'В работе',
  'completed': 'Выполнена',
  'cancelled': 'Отменена'
};
  return statusMap[status] || status;
}

  async function updateRequestStatus(id, status) {
  const token = localStorage.getItem('token');
  try {
  const response = await fetch(`${API_BASE_URL}/contact/${id}`, {
  method: 'PUT',
  headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
},
  body: JSON.stringify({ status }),
});

  if (response.ok) {
  loadDashboardData();
}
} catch (error) {
  console.error('Error updating request status:', error);
}
}

  // Event Listeners
  document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  loadUserProfile();

  // Login form
  document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  hideAlert('loginAlert');
  showLoading(this);

  const formData = new FormData(this);
  const email = formData.get('email');
  const password = formData.get('password');

  await login(email, password);
  hideLoading(this);
});

  // Register form
  document.getElementById('registerForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  hideAlert('registerAlert');
  showLoading(this);

  const formData = new FormData(this);
  const name = formData.get('name');
  const email = formData.get('email');
  const phone = formData.get('phone');
  const password = formData.get('password');

  await register(name, email, phone, password);
  hideLoading(this);
});

  // Contact form
  document.getElementById('contactForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  hideAlert('contactAlert');
  showLoading(this);

  const formData = new FormData(this);
  const contactData = {
  name: formData.get('name'),
  email: formData.get('email'),
  phone: formData.get('phone'),
  deviceType: formData.get('deviceType'),
  deviceModel: formData.get('deviceModel'),
  problemDescription: formData.get('problemDescription'),
  urgency: formData.get('urgency'),
};

  await submitContactForm(contactData);
  hideLoading(this);
});

  // Edit profile form
  document.getElementById('editProfileForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  hideAlert('editProfileAlert');
  showLoading(this);

  const formData = new FormData(this);
  const name = formData.get('name');
  const phone = formData.get('phone');

  await updateProfile(name, phone);
  hideLoading(this);
});

  // Close modals on outside click
  document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', function(e) {
  if (e.target === this) {
  hideModal(this.id);
}
});
});

  // Header scroll effect
  window.addEventListener('scroll', function() {
  const header = document.querySelector('.header');
  if (window.scrollY > 100) {
  header.style.background = 'rgba(15, 15, 35, 0.98)';
} else {
  header.style.background = 'rgba(15, 15, 35, 0.95)';
}
});

  // Smooth animations on scroll
  const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

  const observer = new IntersectionObserver(function(entries) {
  entries.forEach(entry => {
  if (entry.isIntersecting) {
  entry.target.classList.add('fade-in');
}
});
}, observerOptions);

  document.querySelectorAll('.card, .feature-card').forEach(card => {
  observer.observe(card);
});
});

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
  // Escape key closes modals
  if (e.key === 'Escape') {
  document.querySelectorAll('.modal.active').forEach(modal => {
  hideModal(modal.id);
});
}
});
