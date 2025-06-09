// Global Variables/Selectors
const contentArea = document.getElementById('adminContentArea');
const navLinks = document.querySelectorAll('nav ul li a');
const logoutButton = document.getElementById('logoutBtn');

// Helper Function for Admin AJAX Requests
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
                const jsonData = JSON.parse(xhr.responseText);
                callback(null, jsonData);
            } catch (e) {
                callback(new Error('Invalid JSON response'), null);
            }
        } else if (xhr.status === 401 || xhr.status === 403) {
            redirectToLogin();
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

// Initialization Function
function initAdminPanel() {
    if (!getSessionToken()) {
        redirectToLogin();
        return;
    }

    // Logout button event listener
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            logoutAdmin();
        });
    }

    // Navigation links event listeners
    navLinks.forEach(function(link) {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const sectionName = event.target.dataset.section;
            loadSection(sectionName);
        });
    });

    // Load default section
    loadSection('dashboard');
}

// Main Content Loading Function
function loadSection(sectionName) {
    contentArea.innerHTML = '';

    switch (sectionName) {
        case 'dashboard':
            loadDashboardSection();
            break;
        case 'incidents':
            loadIncidentsSection();
            break;
        case 'users':
            loadUsersSection();
            break;
        case 'messages':
            loadMessagesSection();
            break;
        default:
            contentArea.innerHTML = '<div class="content-section"><h2>Section not found</h2></div>';
    }
}

// Dashboard Section
function loadDashboardSection() {
    contentArea.innerHTML = '<div class="content-section"><h2>Dashboard & Statistics</h2><div id="statsContainer">Loading...</div></div>';

    makeAdminAjaxRequest('../admin/statistics', 'GET', null, function(err, statsData) {
        const statsContainer = document.getElementById('statsContainer');
        if (err) {
            statsContainer.innerHTML = '<div class="error-message">Error loading statistics: ' + err.message + '</div>';
        } else {
            renderStatistics(statsData, statsContainer);
        }
    });
}

function renderStatistics(stats, container) {
    let html = '<h3>Incidents by Type:</h3><ul>';
    if (stats.incidentsByType) {
        stats.incidentsByType.forEach(function(item) {
            html += '<li>' + item.type + ': ' + item.count + '</li>';
        });
    }
    html += '</ul>';

    if (stats.totalIncidents) {
        html += '<h3>Total Incidents: ' + stats.totalIncidents + '</h3>';
    }

    if (stats.totalUsers) {
        html += '<h3>Total Users: ' + stats.totalUsers + '</h3>';
    }

    container.innerHTML = html;
}

// Incidents Section
function loadIncidentsSection() {
    contentArea.innerHTML = '<div class="content-section"><h2>Manage Incidents</h2><div id="incidentsTableContainer">Loading...</div></div>';

    makeAdminAjaxRequest('../admin/incidents', 'GET', null, function(err, incidents) {
        const incidentsContainer = document.getElementById('incidentsTableContainer');
        if (err) {
            incidentsContainer.innerHTML = '<div class="error-message">Error loading incidents: ' + err.message + '</div>';
        } else {
            renderIncidentsTable(incidents, incidentsContainer);
        }
    });
}

function renderIncidentsTable(incidents, container) {
    let html = '<table><thead><tr><th>ID</th><th>Type</th><th>Description</th><th>Status</th><th>Danger</th><th>Actions</th></tr></thead><tbody>';

    incidents.forEach(function(incident) {
        html += '<tr>';
        html += '<td>' + incident.incident_id + '</td>';
        html += '<td>' + incident.incident_type + '</td>';
        html += '<td>' + incident.description + '</td>';
        html += '<td>' + incident.status + '</td>';
        html += '<td>' + incident.danger + '</td>';
        html += '<td><button class="btn-small btn-edit edit-incident-btn" data-incident-id="' + incident.incident_id + '">Edit</button></td>';
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    // Add event listeners to edit buttons
    const editButtons = document.querySelectorAll('.edit-incident-btn');
    editButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const incidentId = this.dataset.incidentId;
            handleEditIncidentForm(incidentId);
        });
    });
}

function handleEditIncidentForm(incidentId) {
    // Create modal form
    const modalHtml = '<div id="editIncidentModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">' +
        '<div class="admin-form" style="width: 500px; max-width: 90%;">' +
        '<h2>Edit Incident</h2>' +
        '<div id="editIncidentError"></div>' +
        '<form id="editIncidentForm">' +
        '<div class="form-group">' +
        '<label for="editIncidentType">Type:</label>' +
        '<input type="text" id="editIncidentType" name="incident_type" required>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="editIncidentDescription">Description:</label>' +
        '<textarea id="editIncidentDescription" name="description" required></textarea>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="editIncidentStatus">Status:</label>' +
        '<select id="editIncidentStatus" name="status" required>' +
        '<option value="In Progress">In Progress</option>' +
        '<option value="Running">Running</option>' +
        '<option value="Submitted">Submitted</option>' +
        '<option value="Finished">Finished</option>' +
        '</select>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="editIncidentDanger">Danger Level:</label>' +
        '<select id="editIncidentDanger" name="danger_level" required>' +
        '<option value="Low">Low</option>' +
        '<option value="Medium">Medium</option>' +
        '<option value="High">High</option>' +
        '<option value="Unknown">Unknown</option>' +
        '</select>' +
        '</div>' +
        '<button type="submit">Update Incident</button>' +
        '<button type="button" id="cancelEditIncident">Cancel</button>' +
        '</form>' +
        '</div>' +
        '</div>';

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Add form submit listener
    document.getElementById('editIncidentForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = {
            incident_id: incidentId,
            incident_type: document.getElementById('editIncidentType').value,
            description: document.getElementById('editIncidentDescription').value,
            status: document.getElementById('editIncidentStatus').value,
            danger: document.getElementById('editIncidentDanger').value
        };
        submitIncidentUpdate(incidentId, formData);
    });

    // Add cancel button listener
    document.getElementById('cancelEditIncident').addEventListener('click', function() {
        document.getElementById('editIncidentModal').remove();
    });
}

function submitIncidentUpdate(incidentId, formDataJson) {
    makeAdminAjaxRequest('../admin/incidents', 'POST', formDataJson, function(err, response) {
        const errorDiv = document.getElementById('editIncidentError');
        if (err) {
            errorDiv.innerHTML = '<div class="error-message">Error updating incident: ' + err.message + '</div>';
        } else {
            document.getElementById('editIncidentModal').remove();
            loadIncidentsSection();
            contentArea.insertAdjacentHTML('afterbegin', '<div class="success-message">Incident updated successfully!</div>');
        }
    });
}

// Users Section
function loadUsersSection() {
    contentArea.innerHTML = '<div class="content-section"><h2>Manage Users</h2><div id="usersTableContainer">Loading...</div></div>';

    makeAdminAjaxRequest('../admin/users', 'GET', null, function(err, users) {
        const usersContainer = document.getElementById('usersTableContainer');
        if (err) {
            usersContainer.innerHTML = '<div class="error-message">Error loading users: ' + err.message + '</div>';
        } else {
            renderUsersTable(users, usersContainer);
        }
    });
}

function renderUsersTable(users, container) {
    let html = '<table><thead><tr><th>Username</th><th>First Name</th><th>Last Name</th><th>Actions</th></tr></thead><tbody>';

    users.forEach(function(user) {
        html += '<tr>';
        html += '<td>' + user.username + '</td>';
        html += '<td>' + user.firstname + '</td>';
        html += '<td>' + user.lastname + '</td>';
        html += '<td><button class="btn-small btn-delete delete-user-btn" data-username="' + user.username + '">Delete</button></td>';
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    // Add event listeners to delete buttons
    const deleteButtons = document.querySelectorAll('.delete-user-btn');
    deleteButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const username = this.dataset.username;
            confirmDeleteUser(username);
        });
    });
}

function confirmDeleteUser(username) {
    if (confirm('Are you sure you want to delete user: ' + username + '?')) {
        makeAdminAjaxRequest('../admin/users', 'POST', {"action": "delete", "username": username}, function(err, response) {
            if (err) {
                contentArea.insertAdjacentHTML('afterbegin', '<div class="error-message">Error deleting user: ' + err.message + '</div>');
            } else {
                loadUsersSection();
                contentArea.insertAdjacentHTML('afterbegin', '<div class="success-message">User deleted successfully!</div>');
            }
        });
    }
}

// Messages Section
function loadMessagesSection() {
    contentArea.innerHTML = '<div class="content-section"><h2>View Messages</h2>' +
        '<div id="messagesTableContainer">Loading...</div>' +
        '<div class="admin-form">' +
        '<h3>Send New Message</h3>' +
        '<form id="sendMessageForm">' +
        '<div class="form-group">' +
        '<label for="messageText">Message:</label>' +
        '<textarea id="messageText" name="message_text" required></textarea>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="recipient">Recipient:</label>' +
        '<select id="recipient" name="recipient" required>' +
        '<option value="Public">Public</option>' +
        '<option value="All Users">All Users</option>' +
        '</select>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="incidentId">Incident ID (optional):</label>' +
        '<input type="number" id="incidentId" name="incident_id">' +
        '</div>' +
        '<button type="submit">Send Message</button>' +
        '</form>' +
        '</div></div>';

    // Load existing messages
    makeAdminAjaxRequest('../admin/messages', 'GET', null, function(err, messages) {
        const messagesContainer = document.getElementById('messagesTableContainer');
        if (err) {
            messagesContainer.innerHTML = '<div class="error-message">Error loading messages: ' + err.message + '</div>';
        } else {
            renderMessagesTable(messages, messagesContainer);
        }
    });

    // Add form submit listener
    document.getElementById('sendMessageForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = {
            message_text: document.getElementById('messageText').value,
            recipient: document.getElementById('recipient').value,
            incident_id: document.getElementById('incidentId').value || null
        };
        sendAdminMessage(formData);
    });
}

function renderMessagesTable(messages, container) {
    let html = '<h3>Recent Messages</h3><table><thead><tr><th>Sender</th><th>Recipient</th><th>Date</th><th>Text</th><th>Incident ID</th></tr></thead><tbody>';

    messages.forEach(function(message) {
        html += '<tr>';
        html += '<td>' + message.sender + '</td>';
        html += '<td>' + message.recipient + '</td>';
        html += '<td>' + message.date_time + '</td>';
        html += '<td>' + message.message + '</td>';
        html += '<td>' + (message.incident_id || 'N/A') + '</td>';
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function sendAdminMessage(formDataJson) {
    makeAdminAjaxRequest('../admin/messages', 'POST', formDataJson, function(err, response) {
        if (err) {
            contentArea.insertAdjacentHTML('afterbegin', '<div class="error-message">Error sending message: ' + err.message + '</div>');
        } else {
            document.getElementById('sendMessageForm').reset();
            loadMessagesSection();
            contentArea.insertAdjacentHTML('afterbegin', '<div class="success-message">Message sent successfully!</div>');
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdminPanel);