// Session Token Management Functions
function storeSessionToken(token) {
    localStorage.setItem('adminSessionToken', token);
}

function getSessionToken() {
    return localStorage.getItem('adminSessionToken');
}

function clearSessionToken() {
    localStorage.removeItem('adminSessionToken');
}

// Redirection Functions
function redirectToLogin() {
    window.location.href = 'admin_login.html';
}

function redirectToPanel() {
    window.location.href = 'admin_panel.html';
}

// Login Logic for admin_login.html
function initializeLoginPage() {
    const loginForm = document.getElementById('adminLoginForm');
    const errorDiv = document.getElementById('loginErrorMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;

            const payload = {
                username: username,
                password: password
            };

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '../login', true);
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            const responseJson = JSON.parse(xhr.responseText);

                            if (responseJson.success === true) {
                                storeSessionToken(responseJson.sessionToken);
                                redirectToPanel();
                            } else {
                                showErrorMessage(responseJson.message || 'Login failed');
                            }
                        } catch (e) {
                            showErrorMessage('Invalid response from server');
                        }
                    } else {
                        showErrorMessage('Network error occurred');
                    }
                }
            };

            xhr.send(JSON.stringify(payload));
        });
    }

    function showErrorMessage(message) {
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }
}

// Logout Logic
function logoutAdmin() {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '../admin/logout', true);

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const responseJson = JSON.parse(xhr.responseText);
                    clearSessionToken();
                    redirectToLogin();
                } catch (e) {
                    clearSessionToken();
                    redirectToLogin();
                }
            } else {
                clearSessionToken();
                redirectToLogin();
            }
        }
    };

    xhr.send();
}

// Authentication Check for admin_panel.html
function checkAuthStatusForPanel() {
    if (!getSessionToken()) {
        redirectToLogin();
    }
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the login page
    if (document.getElementById('adminLoginForm')) {
        initializeLoginPage();
    }

    // Check if we're on the admin panel page
    if (document.getElementById('adminContentArea')) {
        checkAuthStatusForPanel();

        // Set up logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                logoutAdmin();
            });
        }
    }
});