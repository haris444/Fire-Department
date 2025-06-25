// user_core.js - Core functionality shared across all user modules

// Global variables
const contentArea = document.getElementById('userContentArea');
const navLinks = document.querySelectorAll('nav ul li a');
const logoutButton = document.getElementById('logoutBtn');
const welcomeUserMsg = document.getElementById('welcomeUserMsg');

// AJAX Helper - Used by all modules
function makeUserAjaxRequest(url, method, data, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("X-User-Session-Token", getUserSessionToken());

    if (method === 'POST' && data) {
        xhr.setRequestHeader("Content-Type", "application/json");
    }

    xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 201) {
            try {
                const jsonData = JSON.parse(xhr.responseText);
                callback(null, jsonData);
            } catch (e) {
                callback(new Error('Invalid JSON response'), null);
            }
        } else if (xhr.status === 401 || xhr.status === 403) {
            redirectToUserLogin();
        } else {
            callback(new Error('Request failed: ' + xhr.status), null);
        }
    };

    xhr.onerror = function() {
        callback(new Error('Network error'), null);
    };

    if (method === 'POST' && data) {
        xhr.send(JSON.stringify(data));
    } else {
        xhr.send(null);
    }
}

// Table building utilities
function buildUserTable(headers, rows) {
    return `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}

function buildUserRow(cells) {
    return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
}

// Utility functions
function showMessage(message, type) {
    contentArea.insertAdjacentHTML('afterbegin', `<div class="${type}-message">${message}</div>`);
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

// Main section loader - delegates to specific modules
function loadUserSection(sectionName) {
    contentArea.innerHTML = userTemplates[sectionName] || '<div class="content-section"><h2>Section not found</h2></div>';

    switch (sectionName) {
        case 'profile':
            if (typeof loadUserProfileSection === 'function') loadUserProfileSection();
            break;
        case 'submitIncident':
            if (typeof loadSubmitIncidentSection === 'function') loadSubmitIncidentSection();
            break;
        case 'viewIncidents':
            if (typeof loadViewIncidentsSection === 'function') loadViewIncidentsSection();
            break;
        case 'messages':
            if (typeof loadMessagesSection === 'function') loadMessagesSection();
            break;
    }
}

// Initialization Function
function initUserPanel() {
    if (!getUserSessionToken()) {
        redirectToUserLogin();
        return;
    }

    // Display welcome message
    if (welcomeUserMsg) {
        welcomeUserMsg.textContent = 'Welcome, ' + getLoggedInUsername() + '!';
    }

    // Logout button event listener
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            logoutUser();
        });
    }

    // Navigation links event listeners
    navLinks.forEach(function(link) {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const sectionName = event.target.dataset.section;
            loadUserSection(sectionName);
        });
    });

    // Load default section
    loadUserSection('profile');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initUserPanel);