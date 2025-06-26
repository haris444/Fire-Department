const contentArea = document.getElementById('volunteerContentArea');
const navLinks = document.querySelectorAll('nav ul li a');
const logoutButton = document.getElementById('logoutBtn');
const welcomeMsg = document.getElementById('welcomeVolunteerMsg');

function makeVolunteerAjaxRequest(url, method, data, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("X-User-Session-Token", getUserSessionToken());

    if (method === 'POST' && data) {
        xhr.setRequestHeader("Content-Type", "application/json");
    }

    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const jsonData = JSON.parse(xhr.responseText);
                callback(null, jsonData);
            } catch (e) {
                callback(new Error('Invalid JSON response from server.'), null);
            }
        } else if (xhr.status === 401 || xhr.status === 403) {
            redirectToUserLogin();
        } else {
            callback(new Error(`Request failed with status: ${xhr.status}`), null);
        }
    };

    xhr.onerror = function() {
        callback(new Error('A network error occurred.'), null);
    };

    xhr.send(data ? JSON.stringify(data) : null);
}

function showMessage(message, type) {
    const existingMessage = document.querySelector('.temp-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageElement = document.createElement('div');
    messageElement.className = `temp-message ${type}-message`;
    messageElement.textContent = message;
    messageElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
        padding: 15px;
        border-radius: 5px;
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;

    document.body.appendChild(messageElement);

    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, 5000);
}

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return 'N/A';
    try {
        const date = new Date(dateTimeStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
        return dateTimeStr;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function loadVolunteerSection(sectionName) {
    contentArea.innerHTML = volunteerTemplates[sectionName] || '<div class="content-section"><h2>Section not found</h2></div>';

    switch (sectionName) {
        case 'profile':
            if (typeof loadVolunteerProfileSection === 'function') loadVolunteerProfileSection();
            break;
        case 'incidents':
            if (typeof loadIncidentsSection === 'function') loadIncidentsSection();
            break;
        case 'messages':
            if (typeof loadMessagesSection === 'function') loadMessagesSection();
            break;
    }
}

function initVolunteerPanel() {
    if (!getUserSessionToken()) {
        redirectToUserLogin();
        return;
    }

    if (welcomeMsg) {
        welcomeMsg.textContent = `Welcome, Volunteer ${getLoggedInUsername()}!`;
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => logoutUser());
    }

    navLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const sectionName = event.target.dataset.section;
            loadVolunteerSection(sectionName);
        });
    });

    loadVolunteerSection('profile');
}

document.addEventListener('DOMContentLoaded', initVolunteerPanel);