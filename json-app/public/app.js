let isLogin = true;

const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const nameGroup = document.getElementById('name-group');
const submitBtn = document.getElementById('submit-btn');
const toggleAuth = document.getElementById('toggle-auth');
const toggleText = document.getElementById('toggle-text');
const authContainer = document.getElementById('auth-container');
const dashboard = document.getElementById('dashboard');
const userNameDisplay = document.getElementById('user-name-display');

// Automatically detect the current origin for the API
const API_BASE = window.location.origin;

toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    updateUI();
});

function updateUI() {
    if (isLogin) {
        authTitle.innerText = "Welcome Back";
        authSubtitle.innerText = "Enter your credentials to access your account";
        nameGroup.classList.add('hidden');
        submitBtn.querySelector('span').innerText = "Login";
        toggleText.innerHTML = `Don't have an account? <a href="#" id="toggle-auth">Create one</a>`;
    } else {
        authTitle.innerText = "Join Us Today";
        authSubtitle.innerText = "Create an account to start your journey";
        nameGroup.classList.remove('hidden');
        submitBtn.querySelector('span').innerText = "Register";
        toggleText.innerHTML = `Already have an account? <a href="#" id="toggle-auth">Login here</a>`;
    }
    // Re-bind listener after innerHTML change
    document.getElementById('toggle-auth').addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        updateUI();
    });
}

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = nameGroup.classList.contains('hidden') ? null : document.getElementById('name').value;

    const endpoint = isLogin ? '/api/login' : '/api/register';
    const body = isLogin ? { email, password } : { name, email, password };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
            showToast(data.message, 'success');
            if (isLogin) {
                localStorage.setItem('user', JSON.stringify(data.user));
                showDashboard(data.user.name);
            } else {
                isLogin = true;
                updateUI();
            }
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Server connection failed. Is the backend running?', 'error');
    }
});

function showDashboard(name) {
    authContainer.classList.add('hidden');
    dashboard.classList.remove('hidden');
    userNameDisplay.innerText = name;
}

function logout() {
    localStorage.removeItem('user');
    dashboard.classList.add('hidden');
    authContainer.classList.remove('hidden');
    showToast('Logged out successfully', 'success');
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

window.onload = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        showDashboard(user.name);
    }
};
