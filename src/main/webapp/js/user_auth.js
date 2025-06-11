// Session Token Management Functions
function storeUserSession(token, username) {
    localStorage.setItem('userSessionToken', token);
    localStorage.setItem('loggedInUsername', username);
}

function getUserSessionToken() {
    return localStorage.getItem('userSessionToken');
}

function getLoggedInUsername() {
    return localStorage.getItem('loggedInUsername');
}

function clearUserSession() {
    localStorage.removeItem('userSessionToken');
    localStorage.removeItem('loggedInUsername');
}

// Redirection Functions
function redirectToUserLogin() {
    window.location.href = 'login.html';
}

function redirectToUserPanel() {
    window.location.href = 'panel.html';
}

// Registration Logic for register.html
function initializeRegistrationPage() {
    const registerForm = document.getElementById('userRegisterForm');
    const messageDiv = document.getElementById('registerMessage');

    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();

            // CRITICAL: Determine registration type by checking which toggle button is active
            // This registrationType field is essential for UnifiedRegisterServlet to set user_type correctly
            const userToggle = document.getElementById('userToggle');
            const volunteerToggle = document.getElementById('volunteerToggle');
            let registrationType = 'user'; // default

            if (volunteerToggle && volunteerToggle.classList.contains('active')) {
                registrationType = 'volunteer';
            }

            // Collect form field values - registrationType is the key field for unified registration
            const formData = {
                registrationType: registrationType, // CRITICAL: This tells the servlet what user_type to set
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                firstname: document.getElementById('firstname').value,
                lastname: document.getElementById('lastname').value,
                birthdate: document.getElementById('birthdate').value,
                gender: document.getElementById('gender').value,
                afm: document.getElementById('afm').value,
                country: document.getElementById('country').value,
                address: document.getElementById('address').value,
                municipality: document.getElementById('municipality').value,
                prefecture: document.getElementById('prefecture').value,
                job: document.getElementById('job').value,
                telephone: document.getElementById('telephone').value,
                lat: document.getElementById('lat').value || null,
                lon: document.getElementById('lon').value || null
            };

            // UPDATED: Collect volunteer-specific fields only when registering as volunteer
            // These fields will be stored in the same User table but only populated for volunteers
            if (registrationType === 'volunteer') {
                formData.volunteer_type = document.getElementById('volunteer_type').value;
                formData.height = document.getElementById('height').value || null;
                formData.weight = document.getElementById('weight').value || null;
            }

            const confirmPassword = document.getElementById('confirmPassword').value;

            // Client-side validation
            if (!validateRegistrationForm(formData, confirmPassword, messageDiv, registrationType)) {
                return;
            }

            // AJAX POST to UnifiedRegisterServlet
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'register', true); // Maps to /register -> UnifiedRegisterServlet

            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 201) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            showSuccessMessage(messageDiv, 'Registration successful! Please login with your credentials.');
                            registerForm.reset();
                            // Reset toggle to default state
                            if (userToggle && volunteerToggle) {
                                userToggle.classList.add('active');
                                volunteerToggle.classList.remove('active');
                                document.getElementById('volunteerFields').style.display = 'none';
                            }
                        } catch (e) {
                            showSuccessMessage(messageDiv, 'Registration successful! Please login.');
                        }
                    } else if (xhr.status === 409) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            showErrorMessage(messageDiv, response.message || 'Username or email already exists.');
                        } catch (e) {
                            showErrorMessage(messageDiv, 'Username or email already exists.');
                        }
                    } else if (xhr.status === 500) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            showErrorMessage(messageDiv, response.message || 'Registration failed. Please try again.');
                        } catch (e) {
                            showErrorMessage(messageDiv, 'Registration failed. Please try again.');
                        }
                    } else {
                        showErrorMessage(messageDiv, 'Network error occurred. Please try again.');
                    }
                }
            };

            xhr.onerror = function() {
                showErrorMessage(messageDiv, 'Network error occurred. Please try again.');
            };

            xhr.send(JSON.stringify(formData));
        });
    }
}

// Login Logic for login.html
function initializeLoginPage() {
    const loginForm = document.getElementById('userLoginForm');
    const errorDiv = document.getElementById('loginErrorMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Basic validation
            if (!username || !password) {
                showErrorMessage(errorDiv, 'Please enter both username and password.');
                return;
            }

            const payload = {
                username: username,
                password: password
            };

            // AJAX POST to UserLoginServlet
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '../login', true);
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);

                            if (response.success === true) {
                                storeUserSession(response.sessionToken, response.username);
                                redirectToUserPanel();
                            } else {
                                showErrorMessage(errorDiv, response.message || 'Login failed');
                            }
                        } catch (e) {
                            showErrorMessage(errorDiv, 'Invalid response from server');
                        }
                    } else if (xhr.status === 401) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            showErrorMessage(errorDiv, response.message || 'Invalid credentials');
                        } catch (e) {
                            showErrorMessage(errorDiv, 'Invalid credentials');
                        }
                    } else {
                        showErrorMessage(errorDiv, 'Network error occurred');
                    }
                }
            };

            xhr.onerror = function() {
                showErrorMessage(errorDiv, 'Network error occurred');
            };

            xhr.send(JSON.stringify(payload));
        });
    }
}

// Logout Function (called from user_app.js)
function logoutUser() {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '../user/logout', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    clearUserSession();
                    redirectToUserLogin();
                } catch (e) {
                    clearUserSession();
                    redirectToUserLogin();
                }
            } else {
                // Even if logout fails on server, clear local session
                clearUserSession();
                redirectToUserLogin();
            }
        }
    };

    xhr.onerror = function() {
        // Even on network error, clear local session
        clearUserSession();
        redirectToUserLogin();
    };

    xhr.send();
}

// Registration Form Validation
function validateRegistrationForm(formData, confirmPassword, messageDiv, registrationType) {
    // Check required fields
    const requiredFields = ['username', 'email', 'password', 'firstname', 'lastname',
        'birthdate', 'gender', 'afm', 'country', 'address',
        'municipality', 'prefecture', 'job', 'telephone'];

    for (let field of requiredFields) {
        if (!formData[field] || formData[field].trim() === '') {
            showErrorMessage(messageDiv, `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
            return false;
        }
    }

    // UPDATED: Check volunteer-specific required fields
    // Only validate volunteer_type if registering as volunteer
    if (registrationType === 'volunteer') {
        if (!formData.volunteer_type || formData.volunteer_type.trim() === '') {
            showErrorMessage(messageDiv, 'Please select a volunteer type.');
            return false;
        }
    }

    // Check password match
    if (formData.password !== confirmPassword) {
        showErrorMessage(messageDiv, 'Passwords do not match.');
        return false;
    }

    // Basic password strength check
    if (formData.password.length < 6) {
        showErrorMessage(messageDiv, 'Password must be at least 6 characters long.');
        return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showErrorMessage(messageDiv, 'Please enter a valid email address.');
        return false;
    }

    // Validate telephone (basic check for numbers and common formats)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(formData.telephone)) {
        showErrorMessage(messageDiv, 'Please enter a valid telephone number.');
        return false;
    }

    // AFM validation (assuming Greek AFM format - 9 digits)
    const afmRegex = /^\d{9}$/;
    if (!afmRegex.test(formData.afm)) {
        showErrorMessage(messageDiv, 'AFM must be exactly 9 digits.');
        return false;
    }

    return true;
}

// Message Display Functions
function showErrorMessage(element, message) {
    element.textContent = message;
    element.className = 'error-message';
    element.style.display = 'block';
}

function showSuccessMessage(element, message) {
    element.textContent = message;
    element.className = 'success-message';
    element.style.display = 'block';
}

function showInfoMessage(element, message) {
    element.textContent = message;
    element.className = 'info-message';
    element.style.display = 'block';
}

// Authentication Check for user panel
function checkAuthStatusForPanel() {
    if (!getUserSessionToken() || !getLoggedInUsername()) {
        redirectToUserLogin();
    }
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', function() {
    // Add toggle logic for registration page
    const userToggle = document.getElementById('userToggle');
    const volunteerToggle = document.getElementById('volunteerToggle');
    const volunteerFields = document.getElementById('volunteerFields');

    if (userToggle && volunteerToggle && volunteerFields) {
        userToggle.addEventListener('click', function() {
            userToggle.classList.add('active');
            volunteerToggle.classList.remove('active');
            volunteerFields.style.display = 'none';
            // Remove required attribute from volunteer fields
            const volunteerTypeField = document.getElementById('volunteer_type');
            if (volunteerTypeField) {
                volunteerTypeField.removeAttribute('required');
            }
        });

        volunteerToggle.addEventListener('click', function() {
            volunteerToggle.classList.add('active');
            userToggle.classList.remove('active');
            volunteerFields.style.display = 'block';
            // Add required attribute to volunteer type field
            const volunteerTypeField = document.getElementById('volunteer_type');
            if (volunteerTypeField) {
                volunteerTypeField.setAttribute('required', 'required');
            }
        });
    }

    // Check if we're on the registration page
    if (document.getElementById('userRegisterForm')) {
        initializeRegistrationPage();
    }

    // Check if we're on the login page
    if (document.getElementById('userLoginForm')) {
        initializeLoginPage();
    }

    // Check if we're on the user panel page
    if (document.getElementById('userContentArea')) {
        checkAuthStatusForPanel();
    }
});