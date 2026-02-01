const adminLogin = document.getElementById('admin-login');
const adminDashboard = document.getElementById('admin-dashboard');
const adminLoginForm = document.getElementById('admin-login-form');
const userTableBody = document.getElementById('user-table-body');

const API_BASE = window.location.origin;
let adminToken = sessionStorage.getItem('adminToken');

if (adminToken) {
    showAdminDashboard();
}

adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;

    try {
        const response = await fetch(`${API_BASE}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (response.ok) {
            sessionStorage.setItem('adminToken', data.token);
            adminToken = data.token;
            showAdminDashboard();
            showToast('Access granted', 'success');
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Server error during admin login', 'error');
    }
});

async function showAdminDashboard() {
    adminLogin.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    fetchUsers();
}

async function fetchUsers() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/users`, {
            headers: { 'Authorization': adminToken }
        });

        if (response.ok) {
            const users = await response.json();
            renderTable(users);
        } else {
            adminLogout();
        }
    } catch (err) {
        showToast('Failed to fetch user database', 'error');
    }
}

function renderTable(users) {
    userTableBody.innerHTML = users.length ? users.map(user => `
        <tr>
            <td>#${user.id.toString().slice(-4)}</td>
            <td style="font-weight: 700;">${user.name}</td>
            <td>${user.email}</td>
            <td style="color: var(--text-muted);">${new Date(user.createdAt).toLocaleDateString()}</td>
            <td><span class="status-badge">Active</span></td>
        </tr>
    `).join('') : '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">Database is empty</td></tr>';
}

function adminLogout() {
    sessionStorage.removeItem('adminToken');
    adminDashboard.classList.add('hidden');
    adminLogin.classList.remove('hidden');
    showToast('Admin session ended', 'success');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : 'alert-circle';
    toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
