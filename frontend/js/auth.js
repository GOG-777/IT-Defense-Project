// Password toggle functionality
function initializePasswordToggles() {
    const toggleButtons = document.querySelectorAll('.password-toggle');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializePasswordToggles();
});

// Check if already logged in
if (isLoggedIn() && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) {
    const user = getUser();
    if (user.role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

// Login Form Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                showMessage(data.error || 'Login failed', 'error');
                return;
            }
            
            // Save token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Show success message
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect based on role
            setTimeout(() => {
                if (data.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1000);
            
        } catch (error) {
            showMessage('Network error. Please try again.', 'error');
            console.error('Login error:', error);
        }
    });
}

// Registration Form Handler
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const studentId = document.getElementById('studentId').value.trim();
        const level = document.getElementById('level').value;
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        console.log('Form values:', { fullName, email, studentId, level, phone, password });
        
        // Validate passwords match
        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters long', 'error');
            return;
        }

        // Validate level is selected
        if (!level) {
            showMessage('Please select your level', 'error');
            return;
        }
        
        try {
            const requestBody = {
                email: email,
                password: password,
                full_name: fullName,
                student_id: studentId,
                level: parseInt(level),
                phone: phone
            };
            
            console.log('Sending request:', requestBody);
            
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            console.log('Response:', data);
            
            if (!response.ok) {
                showMessage(data.error || 'Registration failed', 'error');
                return;
            }
            
            // Save token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showMessage('Registration successful! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } catch (error) {
            showMessage('Network error. Please try again.', 'error');
            console.error('Registration error:', error);
        }
    });
}

// Enhanced message display function
function showMessage(message, type) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');

    // Hide both messages first
    if (errorDiv) errorDiv.classList.add('hidden');
    if (successDiv) successDiv.classList.add('hidden');

    if (type === 'error') {
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
            
            // Auto-hide error after 5 seconds
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 5000);
        }
    } else {
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.classList.remove('hidden');
        }
    }
}

// Legacy function for compatibility (if needed elsewhere)
function showError(elementId, message) {
    showMessage(message, 'error');
}

function showSuccess(elementId, message) {
    showMessage(message, 'success');
}