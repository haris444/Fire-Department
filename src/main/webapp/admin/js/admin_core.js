// admin_core.js - Common functionality shared across all admin modules

// Global variables
const contentArea = document.getElementById('adminContentArea');
const navLinks = document.querySelectorAll('nav ul li a');
const logoutButton = document.getElementById('logoutBtn');

// AJAX Helper - Used by all modules
function makeAdminAjaxRequest(url, method, data, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("X-Session-Token", getSessionToken());

    if (method === 'POST' && data) {
        xhr.setRequestHeader("Content-Type", "application/json");
    }

    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                callback(null, JSON.parse(xhr.responseText));
            } catch (e) {
                callback(new Error('Invalid JSON response'), null);
            }
        } else if (xhr.status === 401 || xhr.status === 403) {
            redirectToLogin();
        } else {
            callback(new Error('Request failed: ' + xhr.status), null);
        }
    };

    xhr.onerror = () => callback(new Error('Network error'), null);

    if (method === 'POST' && data) {
        xhr.send(JSON.stringify(data));
    } else {
        xhr.send(null);
    }
}

// Table building utilities
function buildTable(headers, rows) {
    return `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}

function buildRow(cells) {
    return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
}

function buildOptions(items, valueField, labelFunction) {
    if (!items || items.length === 0) return '<option value="">No items found</option>';

    return items.map(item =>
        `<option value="${item[valueField] || ''}">${labelFunction(item)}</option>`
    ).join('');
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
function loadSection(sectionName) {
    contentArea.innerHTML = templates[sectionName] || '<div class="content-section"><h2>Section not found</h2></div>';

    switch (sectionName) {
        case 'dashboard':
            if (typeof loadDashboard === 'function') loadDashboard();
            break;
        case 'incidents':
            if (typeof loadIncidents === 'function') loadIncidents();
            break;
        case 'users':
            if (typeof loadUsers === 'function') loadUsers();
            break;
        case 'assignments':
            if (typeof loadAssignments === 'function') loadAssignments();
            break;
        case 'messages':
            if (typeof loadMessages === 'function') loadMessages();
            break;
    }
}

// Initialization
function initAdminPanel() {
    if (!getSessionToken()) {
        redirectToLogin();
        return;
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => logoutAdmin());
    }

    navLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            loadSection(event.target.dataset.section);
        });
    });

    loadSection('dashboard');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initAdminPanel);