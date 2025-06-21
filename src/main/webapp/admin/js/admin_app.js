// admin_app.js - Updated version with vehicle management

const contentArea = document.getElementById('adminContentArea');
const navLinks = document.querySelectorAll('nav ul li a');
const logoutButton = document.getElementById('logoutBtn');

// AJAX Helper
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

// Main section loader
function loadSection(sectionName) {
    contentArea.innerHTML = templates[sectionName] || '<div class="content-section"><h2>Section not found</h2></div>';

    switch (sectionName) {
        case 'dashboard': loadDashboard(); break;
        case 'incidents': loadIncidents(); break;
        case 'users': loadUsers(); break;
        case 'assignments': loadAssignments(); break;
        case 'messages': loadMessages(); break;
    }
}

// Dashboard
function loadDashboard() {
    makeAdminAjaxRequest('../admin/statistics', 'GET', null, (err, stats) => {
        const container = document.getElementById('statsContainer');
        if (err) {
            container.innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
            return;
        }

        const totalPeople = (stats.userCount || 0) + (stats.volunteerCount || 0);
        const totalIncidents = stats.incidentsByType ? stats.incidentsByType.reduce((sum, item) => sum + item.count, 0) : 0;

        // Build incidents table
        let incidentsTable = '';
        if (stats.incidentsByType?.length) {
            const rows = stats.incidentsByType.map(item => buildRow([item.type, item.count])).join('');
            incidentsTable = buildTable(['Type', 'Count'], rows + buildRow(['TOTAL', totalIncidents]));
        } else {
            incidentsTable = '<p>No incidents found.</p>';
        }

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div>
                    <h3>Overview</h3>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <div><strong>Total Users:</strong> ${stats.userCount || 0}</div>
                        <div><strong>Total Volunteers:</strong> ${stats.volunteerCount || 0}</div>
                        <div><strong>Total People:</strong> ${totalPeople}</div>
                        <div><strong>Total Vehicles:</strong> ${stats.totalVehicleCount || 0}</div>
                    </div>
                </div>
                <div>
                    <h3>Incidents by Type</h3>
                    ${incidentsTable}
                </div>
            </div>`;
    });
}

// Incidents - UPDATED to include vehicles column
function loadIncidents() {
    makeAdminAjaxRequest('../admin/incidents', 'GET', null, (err, incidents) => {
        const container = document.getElementById('incidentsTableContainer');
        if (err) {
            container.innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
            return;
        }

        const rows = incidents.map(incident =>
            buildRow([
                incident.incident_id,
                incident.incident_type,
                incident.description,
                incident.status,
                incident.danger,
                incident.vehicles || 0, // ADDED: Vehicles column
                `<button class="btn-small btn-edit edit-incident-btn" data-incident-id="${incident.incident_id}">Edit</button>`
            ])
        ).join('');

        // UPDATED: Added "Vehicles" header
        container.innerHTML = buildTable(['ID', 'Type', 'Description', 'Status', 'Danger', 'Vehicles', 'Actions'], rows);

        // Add edit listeners
        document.querySelectorAll('.edit-incident-btn').forEach(btn => {
            btn.addEventListener('click', () => showEditModal(btn.dataset.incidentId));
        });
    });
}

// UPDATED: Edit modal now includes vehicles field
function showEditModal(incidentId) {
    // First get the current incident data
    makeAdminAjaxRequest('../admin/incidents', 'GET', null, (err, incidents) => {
        if (err) {
            alert('Error loading incident data: ' + err.message);
            return;
        }

        const incident = incidents.find(inc => inc.incident_id == incidentId);
        if (!incident) {
            alert('Incident not found');
            return;
        }

        const modal = `
            <div id="editModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                <div class="admin-form" style="width: 500px; max-width: 90%;">
                    <h2>Edit Incident</h2>
                    <form id="editForm">
                        <div class="form-group">
                            <label>Type:</label>
                            <select id="editType" required>
                                <option value="fire">Fire</option>
                                <option value="crash">Accident</option>
                                <option value="accident">Medical Emergency</option>
                                <option value="rescue">Rescue</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Description:</label>
                            <textarea id="editDescription" required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Status:</label>
                            <select id="editStatus" required>
                                <option value="In Progress">In Progress</option>
                                <option value="Running">Running</option>
                                <option value="Submitted">Submitted</option>
                                <option value="Finished">Finished</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Danger:</label>
                            <select id="editDanger" required>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Unknown">Unknown</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Vehicles Engaged:</label>
                            <input type="number" id="editVehicles" min="0" step="1" value="${incident.vehicles || 0}">
                        </div>
                        <button type="submit">Update</button>
                        <button type="button" onclick="document.getElementById('editModal').remove()">Cancel</button>
                    </form>
                </div>
            </div>`;

        document.body.insertAdjacentHTML('beforeend', modal);

        // Pre-fill the form with current values
        document.getElementById('editType').value = incident.incident_type;
        document.getElementById('editDescription').value = incident.description;
        document.getElementById('editStatus').value = incident.status;
        document.getElementById('editDanger').value = incident.danger;

        document.getElementById('editForm').addEventListener('submit', event => {
            event.preventDefault();
            const data = {
                incident_id: incidentId,
                incident_type: document.getElementById('editType').value,
                description: document.getElementById('editDescription').value,
                status: document.getElementById('editStatus').value,
                danger: document.getElementById('editDanger').value,
                vehicles: parseInt(document.getElementById('editVehicles').value) || 0 // ADDED: Vehicles field
            };

            makeAdminAjaxRequest('../admin/incidents', 'POST', data, (err, response) => {
                if (err) {
                    alert('Error: ' + err.message);
                } else {
                    document.getElementById('editModal').remove();
                    loadIncidents();
                    showMessage('Incident updated successfully!', 'success');
                }
            });
        });
    });
}

// Users
function loadUsers() {
    makeAdminAjaxRequest('../admin/users', 'GET', null, (err, users) => {
        const container = document.getElementById('usersTableContainer');
        if (err) {
            container.innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
            return;
        }

        const rows = users.map(user =>
            buildRow([
                user.username,
                user.firstname,
                user.lastname,
                user.user_type || 'user',
                `<button class="btn-small btn-delete" onclick="deleteUser('${user.username}')">Delete</button>`
            ])
        ).join('');

        container.innerHTML = buildTable(['Username', 'First Name', 'Last Name', 'Type', 'Actions'], rows);
    });
}

function deleteUser(username) {
    if (confirm(`Delete user: ${username}?`)) {
        makeAdminAjaxRequest('../admin/users', 'POST', {action: "delete", username}, (err, response) => {
            if (err) {
                showMessage('Error deleting user: ' + err.message, 'error');
            } else {
                loadUsers();
                showMessage('User deleted successfully!', 'success');
            }
        });
    }
}

// Assignments
function loadAssignments() {
    loadVolunteersDropdown();
    loadIncidentsDropdown();
    loadCurrentAssignments();

    document.getElementById('createAssignmentForm').addEventListener('submit', event => {
        event.preventDefault();
        const volunteerUserId = document.getElementById('volunteerSelect').value;
        const incidentId = document.getElementById('incidentSelect').value;

        if (!volunteerUserId || !incidentId) {
            document.getElementById('assignmentResult').innerHTML = '<div class="error-message">Please select both</div>';
            return;
        }

        const data = {
            action: 'assign',
            volunteer_user_id: parseInt(volunteerUserId),
            incident_id: parseInt(incidentId)
        };

        makeAdminAjaxRequest('../admin/assignments', 'POST', data, (err, response) => {
            const resultDiv = document.getElementById('assignmentResult');
            if (err) {
                resultDiv.innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
            } else {
                resultDiv.innerHTML = '<div class="success-message">Assignment created!</div>';
                document.getElementById('createAssignmentForm').reset();
                loadCurrentAssignments();
            }
        });
    });
}

function loadVolunteersDropdown() {
    makeAdminAjaxRequest('../admin/volunteers', 'GET', null, (err, volunteers) => {
        const select = document.getElementById('volunteerSelect');
        if (err) {
            select.innerHTML = '<option value="">Error loading</option>';
        } else {
            select.innerHTML = '<option value="">Select Volunteer</option>' +
                buildOptions(volunteers, 'user_id', vol => `${vol.firstname} ${vol.lastname} (${vol.username})`);
        }
    });
}

function loadIncidentsDropdown() {
    makeAdminAjaxRequest('../admin/incidents', 'GET', null, (err, incidents) => {
        const select = document.getElementById('incidentSelect');
        if (err) {
            select.innerHTML = '<option value="">Error loading</option>';
        } else {
            select.innerHTML = '<option value="">Select Incident</option>' +
                buildOptions(incidents, 'incident_id', inc => `ID: ${inc.incident_id} - ${inc.incident_type} (${inc.status})`);
        }
    });
}

function loadCurrentAssignments() {
    makeAdminAjaxRequest('../admin/assignments', 'GET', null, (err, assignments) => {
        const container = document.getElementById('assignmentsTableContainer');
        if (err) {
            container.innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
            return;
        }

        if (!assignments || !assignments.length) {
            container.innerHTML = '<h3>Current Assignments</h3><p>No assignments found.</p>';
            return;
        }

        const rows = assignments.map(assignment =>
            buildRow([
                assignment.volunteer_name,
                assignment.incident_description,
                assignment.assignment_date || 'N/A',
                `<button class="btn-small btn-delete" onclick="removeAssignment(${assignment.volunteer_user_id}, ${assignment.incident_id})">Remove</button>`
            ])
        ).join('');

        container.innerHTML = '<h3>Current Assignments</h3>' +
            buildTable(['Volunteer', 'Incident', 'Date', 'Actions'], rows);
    });
}

function removeAssignment(volunteerUserId, incidentId) {
    if (confirm('Remove this assignment?')) {
        const data = {action: 'remove', volunteer_user_id: volunteerUserId, incident_id: incidentId};
        makeAdminAjaxRequest('../admin/assignments', 'POST', data, (err, response) => {
            if (err) {
                showMessage('Error removing assignment: ' + err.message, 'error');
            } else {
                loadCurrentAssignments();
                showMessage('Assignment removed!', 'success');
            }
        });
    }
}

function loadMessages() {
    makeAdminAjaxRequest('../admin/messages', 'GET', null, (err, responseData) => {
        const container = document.getElementById('messagesContainer');
        if (err) {
            container.innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
            return;
        }

        renderMessagesTable(responseData.messages, container);
        populateIncidentsForMessages(responseData.incidents);
    });

    // FIXED: Remove existing event listener before adding new one
    const sendMessageForm = document.getElementById('sendMessageForm');
    if (sendMessageForm) {
        // Clone the form to remove all event listeners
        const newForm = sendMessageForm.cloneNode(true);
        sendMessageForm.parentNode.replaceChild(newForm, sendMessageForm);

        // Add single event listener to the new form
        document.getElementById('sendMessageForm').addEventListener('submit', handleAdminSendMessage);
    }
}

// FIXED: Extract the send message handler to a separate function
function handleAdminSendMessage(event) {
    event.preventDefault();

    const recipient = document.getElementById('recipient').value;
    const messageText = document.getElementById('messageText').value;
    const incidentId = document.getElementById('incidentId').value;

    if (!recipient || !messageText.trim() || !incidentId) {
        showMessageResult('Please fill all required fields', 'error');
        return;
    }

    // Validate admin can only send to public or volunteers
    if (recipient !== 'public' && recipient !== 'volunteers') {
        showMessageResult('Admin can only send to Public or Volunteers', 'error');
        return;
    }

    const data = {
        recipient: recipient,
        message_text: messageText.trim(),
        incident_id: parseInt(incidentId)
    };

    makeAdminAjaxRequest('../admin/messages', 'POST', data, (err, response) => {
        if (err) {
            showMessageResult('Error: ' + err.message, 'error');
        } else {
            showMessageResult('Message sent!', 'success');
            document.getElementById('sendMessageForm').reset();
            loadMessages();
        }
    });
}

function renderMessagesTable(messages, container) {
    if (!messages?.length) {
        container.innerHTML = '<h3>All Messages</h3><p>No messages found.</p>';
        return;
    }

    messages.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));

    const rows = messages.map(msg => {
        const incidentInfo = msg.incident_id ? `ID: ${msg.incident_id}` : 'N/A';
        return buildRow([
            formatDateTime(msg.date_time),
            msg.sender,
            msg.recipient,
            escapeHtml(msg.message),
            incidentInfo,
            getMessageType(msg)
        ]);
    }).join('');

    container.innerHTML = `<h3>All Messages (${messages.length} total)</h3>` +
        '<div class="message-info">' +
        '<p><strong>Message Rules:</strong> All messages are tied to incidents. Recipients are Public, Volunteers, or Admin.</p>' +
        '</div>' +
        buildTable(['Time', 'From', 'To', 'Message', 'Incident', 'Type'], rows);
}

function populateIncidentsForMessages(incidents) {
    const select = document.getElementById('incidentId');
    if (!incidents?.length) {
        select.innerHTML = '<option value="">No incidents available</option>';
        return;
    }

    // Show all incidents (admin can send messages about any incident)
    select.innerHTML = '<option value="">Select incident</option>' +
        buildOptions(incidents, 'incident_id', inc => `ID: ${inc.incident_id} - ${inc.incident_type} (${inc.status}) - ${inc.municipality || 'Unknown'}`);
}

function getMessageType(message) {
    if (message.sender === 'admin' && message.recipient === 'public') return 'Admin → Public';
    if (message.sender === 'admin' && message.recipient === 'volunteers') return 'Admin → Volunteers';
    if (message.recipient === 'admin') return 'To Admin';
    if (message.recipient === 'public') return 'Public Message';
    if (message.recipient === 'volunteers') return 'Volunteer Message';
    return 'Other';
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

function showMessageResult(message, type) {
    const resultDiv = document.getElementById('sendMessageResult');
    resultDiv.innerHTML = `<div class="${type}-message">${message}</div>`;
    setTimeout(() => resultDiv.innerHTML = '', 5000);
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

// Table builders
function buildTable(headers, rows) {
    return `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}

function buildRow(cells) {
    return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
}

// Initialize
document.addEventListener('DOMContentLoaded', initAdminPanel);