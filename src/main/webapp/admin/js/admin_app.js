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
        case 'assignments':
            loadAssignmentsSection();
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
    let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">';

    // Left column - Summary statistics
    html += '<div>';
    html += '<h3>System Overview</h3>';
    html += '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db;">';
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">';
    html += '<div><strong>Total Users:</strong> ' + (stats.userCount || 0) + '</div>';
    html += '<div><strong>Total Volunteers:</strong> ' + (stats.volunteerCount || 0) + '</div>';
    html += '<div><strong>Total Vehicles:</strong> ' + (stats.totalVehicleCount || 0) + '</div>';
    html += '<div><strong>Total People:</strong> ' + ((stats.userCount || 0) + (stats.volunteerCount || 0)) + '</div>';
    html += '</div></div></div>';

    // Right column - Incidents by type table
    html += '<div>';
    html += '<h3>Incidents by Type</h3>';
    if (stats.incidentsByType && stats.incidentsByType.length > 0) {
        html += '<table style="width: 100%; border-collapse: collapse;">';
        html += '<thead><tr style="background: #34495e; color: white;">';
        html += '<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Incident Type</th>';
        html += '<th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Count</th>';
        html += '</tr></thead><tbody>';

        let totalIncidents = 0;
        stats.incidentsByType.forEach(function(item) {
            totalIncidents += item.count;
            html += '<tr style="border-bottom: 1px solid #eee;">';
            html += '<td style="padding: 10px; border: 1px solid #ddd; text-transform: capitalize;">' + item.type + '</td>';
            html += '<td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">' + item.count + '</td>';
            html += '</tr>';
        });

        // Total row
        html += '<tr style="background: #ecf0f1; font-weight: bold;">';
        html += '<td style="padding: 10px; border: 1px solid #ddd;">TOTAL</td>';
        html += '<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">' + totalIncidents + '</td>';
        html += '</tr>';
        html += '</tbody></table>';
    } else {
        html += '<p style="color: #7f8c8d; font-style: italic;">No incidents found.</p>';
    }
    html += '</div>';
    html += '</div>'; // End grid container

    // Full width - Volunteers per incident type table
    html += '<div style="margin-top: 30px;">';
    html += '<h3>Volunteer Assignments by Incident Type</h3>';
    if (stats.volunteersPerIncidentType && stats.volunteersPerIncidentType.length > 0) {
        html += '<table style="width: 100%; border-collapse: collapse;">';
        html += '<thead><tr style="background: #27ae60; color: white;">';
        html += '<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Incident Type</th>';
        html += '<th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Assigned Volunteers</th>';
        html += '<th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Volunteers per Incident</th>';
        html += '</tr></thead><tbody>';

        let totalVolunteerAssignments = 0;
        stats.volunteersPerIncidentType.forEach(function(item) {
            totalVolunteerAssignments += item.volunteer_count;
            // Find corresponding incident count to calculate volunteers per incident
            let incidentCount = 0;
            if (stats.incidentsByType) {
                const incidentData = stats.incidentsByType.find(inc => inc.type === item.incident_type);
                incidentCount = incidentData ? incidentData.count : 0;
            }
            const volunteersPerIncident = incidentCount > 0 ? (item.volunteer_count / incidentCount).toFixed(1) : '0';

            html += '<tr style="border-bottom: 1px solid #eee;">';
            html += '<td style="padding: 10px; border: 1px solid #ddd; text-transform: capitalize;">' + item.incident_type + '</td>';
            html += '<td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">' + item.volunteer_count + '</td>';
            html += '<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">' + volunteersPerIncident + '</td>';
            html += '</tr>';
        });

        // Total row
        html += '<tr style="background: #ecf0f1; font-weight: bold;">';
        html += '<td style="padding: 10px; border: 1px solid #ddd;">TOTAL</td>';
        html += '<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">' + totalVolunteerAssignments + '</td>';
        html += '<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">-</td>';
        html += '</tr>';
        html += '</tbody></table>';
    } else {
        html += '<p style="color: #7f8c8d; font-style: italic;">No volunteer assignments found.</p>';
    }
    html += '</div>';

    // Additional insights section
    html += '<div style="margin-top: 30px; background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">';
    html += '<h3 style="margin-top: 0; color: #856404;">Key Insights</h3>';
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">';

    // Calculate some insights
    const totalPeople = (stats.userCount || 0) + (stats.volunteerCount || 0);
    const volunteerPercentage = totalPeople > 0 ? ((stats.volunteerCount || 0) / totalPeople * 100).toFixed(1) : 0;

    let totalIncidents = 0;
    if (stats.incidentsByType) {
        totalIncidents = stats.incidentsByType.reduce((sum, item) => sum + item.count, 0);
    }

    let totalVolunteerAssignments = 0;
    if (stats.volunteersPerIncidentType) {
        totalVolunteerAssignments = stats.volunteersPerIncidentType.reduce((sum, item) => sum + item.volunteer_count, 0);
    }

    const avgVolunteersPerIncident = totalIncidents > 0 ? (totalVolunteerAssignments / totalIncidents).toFixed(1) : 0;
    const vehiclesPerIncident = totalIncidents > 0 ? ((stats.totalVehicleCount || 0) / totalIncidents).toFixed(1) : 0;

    html += '<div><strong>Volunteer Participation Rate:</strong> ' + volunteerPercentage + '%</div>';
    html += '<div><strong>Avg Volunteers per Incident:</strong> ' + avgVolunteersPerIncident + '</div>';
    html += '<div><strong>Avg Vehicles per Incident:</strong> ' + vehiclesPerIncident + '</div>';
    html += '<div><strong>Total Assignments:</strong> ' + totalVolunteerAssignments + '</div>';
    html += '</div></div>';

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
    let html = '<table><thead><tr><th>Username</th><th>First Name</th><th>Last Name</th><th>User Type</th><th>Actions</th></tr></thead><tbody>';

    users.forEach(function(user) {
        html += '<tr>';
        html += '<td>' + user.username + '</td>';
        html += '<td>' + user.firstname + '</td>';
        html += '<td>' + user.lastname + '</td>';
        html += '<td>' + (user.user_type || 'user') + '</td>';
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

// Assignments Section
function loadAssignmentsSection() {
    contentArea.innerHTML =
        '<div class="content-section">' +
        '<h2>Manage Volunteer Assignments</h2>' +

        '<!-- Create New Assignment Form -->' +
        '<div class="admin-form">' +
        '<h3>Assign Volunteer to Incident</h3>' +
        '<form id="createAssignmentForm">' +
        '<div class="form-group">' +
        '<label for="volunteerSelect">Volunteer:</label>' +
        '<select id="volunteerSelect" required>' +
        '<option value="">Loading volunteers...</option>' +
        '</select>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="incidentSelect">Incident:</label>' +
        '<select id="incidentSelect" required>' +
        '<option value="">Loading incidents...</option>' +
        '</select>' +
        '</div>' +
        '<button type="submit">Assign Volunteer</button>' +
        '</form>' +
        '<div id="assignmentResult"></div>' +
        '</div>' +

        '<!-- Current Assignments Table -->' +
        '<div id="assignmentsTableContainer">Loading current assignments...</div>' +
        '</div>';

    // Load data for dropdowns and table
    loadVolunteersDropdown();
    loadIncidentsDropdown();
    loadCurrentAssignments();

    // Add form submit listener
    document.getElementById('createAssignmentForm').addEventListener('submit', handleCreateAssignment);
}

function loadVolunteersDropdown() {
    // Use the dedicated volunteers endpoint instead of filtering all users
    makeAdminAjaxRequest('../admin/volunteers', 'GET', null, function(err, volunteers) {
        const select = document.getElementById('volunteerSelect');
        if (err) {
            select.innerHTML = '<option value="">Error loading volunteers</option>';
        } else {
            // No filtering needed - we already have only volunteers
            select.innerHTML = '<option value="">Select Volunteer</option>';
            volunteers.forEach(function(volunteer) {
                select.innerHTML += '<option value="' + volunteer.user_id + '">' +
                    volunteer.firstname + ' ' + volunteer.lastname + ' (' + volunteer.username + ')</option>';
            });
        }
    });
}

function loadIncidentsDropdown() {
    makeAdminAjaxRequest('../admin/incidents', 'GET', null, function(err, incidents) {
        const select = document.getElementById('incidentSelect');
        if (err) {
            select.innerHTML = '<option value="">Error loading incidents</option>';
        } else {
            select.innerHTML = '<option value="">Select Incident</option>';
            incidents.forEach(function(incident) {
                select.innerHTML += '<option value="' + incident.incident_id + '">ID: ' +
                    incident.incident_id + ' - ' + incident.incident_type + ' (' + incident.status + ')</option>';
            });
        }
    });
}

function loadCurrentAssignments() {
    makeAdminAjaxRequest('../admin/assignments', 'GET', null, function(err, assignments) {
        const container = document.getElementById('assignmentsTableContainer');
        if (err) {
            container.innerHTML = '<div class="error-message">Error loading assignments: ' + err.message + '</div>';
        } else {
            renderAssignmentsTable(assignments);
        }
    });
}

function renderAssignmentsTable(assignments) {
    const container = document.getElementById('assignmentsTableContainer');

    if (!assignments || assignments.length === 0) {
        container.innerHTML = '<h3>Current Assignments</h3><p>No assignments found.</p>';
        return;
    }

    let html = '<h3>Current Assignments</h3>' +
        '<table>' +
        '<thead>' +
        '<tr>' +
        '<th>Volunteer</th>' +
        '<th>Incident</th>' +
        '<th>Assignment Date</th>' +
        '<th>Actions</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>';

    assignments.forEach(function(assignment) {
        html += '<tr>' +
            '<td>' + assignment.volunteer_name + '</td>' +
            '<td>' + assignment.incident_description + '</td>' +
            '<td>' + (assignment.assignment_date || 'N/A') + '</td>' +
            '<td>' +
            '<button class="btn-small btn-delete" ' +
            'onclick="removeAssignment(' + assignment.volunteer_user_id + ', ' + assignment.incident_id + ')">' +
            'Remove' +
            '</button>' +
            '</td>' +
            '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function handleCreateAssignment(event) {
    event.preventDefault();

    const volunteerUserId = document.getElementById('volunteerSelect').value;
    const incidentId = document.getElementById('incidentSelect').value;

    if (!volunteerUserId || !incidentId) {
        document.getElementById('assignmentResult').innerHTML =
            '<div class="error-message">Please select both volunteer and incident</div>';
        return;
    }

    const data = {
        action: 'assign',
        volunteer_user_id: parseInt(volunteerUserId),
        incident_id: parseInt(incidentId)
    };

    makeAdminAjaxRequest('../admin/assignments', 'POST', data, function(err, response) {
        const resultDiv = document.getElementById('assignmentResult');
        if (err) {
            resultDiv.innerHTML = '<div class="error-message">Error creating assignment: ' + err.message + '</div>';
        } else {
            resultDiv.innerHTML = '<div class="success-message">Assignment created successfully!</div>';
            document.getElementById('createAssignmentForm').reset();
            loadCurrentAssignments(); // Refresh the table
        }
    });
}

function removeAssignment(volunteerUserId, incidentId) {
    if (!confirm('Are you sure you want to remove this assignment?')) {
        return;
    }

    const data = {
        action: 'remove',
        volunteer_user_id: volunteerUserId,
        incident_id: incidentId
    };

    makeAdminAjaxRequest('../admin/assignments', 'POST', data, function(err, response) {
        if (err) {
            contentArea.insertAdjacentHTML('afterbegin', '<div class="error-message">Error removing assignment: ' + err.message + '</div>');
        } else {
            loadCurrentAssignments(); // Refresh the table
            contentArea.insertAdjacentHTML('afterbegin', '<div class="success-message">Assignment removed successfully!</div>');
        }
    });
}

// Messages Section
// Messages Section - Updated implementation
function loadMessagesSection() {
    contentArea.innerHTML = '<div class="content-section">' +
        '<h2>Messages Management</h2>' +
        '<div id="messagesContainer">Loading messages...</div>' +

        // Send message form with better layout
        '<div class="admin-form">' +
        '<h3>Send New Message</h3>' +
        '<div class="message-info">' +
        '<p><strong>Admin Messaging Rules:</strong></p>' +
        '<ul>' +
        '<li>Send to <strong>Public</strong>: Visible to all users (incident ID optional)</li>' +
        '<li>Send to <strong>Volunteers</strong>: Only volunteers assigned to the specified incident (incident ID required)</li>' +
        '</ul>' +
        '</div>' +
        '<form id="sendMessageForm">' +
        '<div class="form-group">' +
        '<label for="recipient">Recipient: *</label>' +
        '<select id="recipient" name="recipient" required>' +
        '<option value="">Select Recipient</option>' +
        '<option value="public">Public (All Users)</option>' +
        '<option value="volunteers">Volunteers (Specific Incident)</option>' +
        '</select>' +
        '</div>' +
        '<div class="form-group" id="incidentGroup" style="display: none;">' +
        '<label for="incidentId">Incident: * <span class="field-note">(Required for volunteer messages)</span></label>' +
        '<select id="incidentId" name="incident_id">' +
        '<option value="">Loading incidents...</option>' +
        '</select>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="messageText">Message: *</label>' +
        '<textarea id="messageText" name="message_text" required placeholder="Type your message here..." rows="4"></textarea>' +
        '</div>' +
        '<button type="submit">Send Message</button>' +
        '</form>' +
        '<div id="sendMessageResult"></div>' +
        '</div>' +
        '</div>';

    // Load messages and incidents data
    makeAdminAjaxRequest('../admin/messages', 'GET', null, function(err, responseData) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (err) {
            messagesContainer.innerHTML = '<div class="error-message">Error loading messages: ' + err.message + '</div>';
        } else {
            // Render messages table
            renderMessagesTable(responseData.messages, messagesContainer);

            // Populate incidents dropdown
            populateIncidentsDropdown(responseData.incidents);
        }
    });

    // Add recipient change listener to show/hide incident dropdown
    document.getElementById('recipient').addEventListener('change', function() {
        const incidentGroup = document.getElementById('incidentGroup');
        const incidentSelect = document.getElementById('incidentId');

        if (this.value === 'volunteers') {
            incidentGroup.style.display = 'block';
            incidentSelect.required = true;
        } else {
            incidentGroup.style.display = 'none';
            incidentSelect.required = false;
            incidentSelect.value = '';
        }
    });

    // Add form submit listener
    document.getElementById('sendMessageForm').addEventListener('submit', function(event) {
        event.preventDefault();
        handleSendAdminMessage();
    });
}

function populateIncidentsDropdown(incidents) {
    const select = document.getElementById('incidentId');
    if (!incidents || incidents.length === 0) {
        select.innerHTML = '<option value="">No incidents available</option>';
        return;
    }

    select.innerHTML = '<option value="">Select an incident</option>';
    incidents.forEach(function(incident) {
        // Only show active incidents (running or submitted)
        if (incident.status === 'running' || incident.status === 'submitted') {
            select.innerHTML += '<option value="' + incident.incident_id + '">' +
                'ID: ' + incident.incident_id + ' - ' +
                incident.incident_type + ' (' + incident.status + ') - ' +
                (incident.municipality || 'Unknown location') +
                '</option>';
        }
    });
}

function renderMessagesTable(messages, container) {
    if (!messages || messages.length === 0) {
        container.innerHTML = '<h3>All Messages</h3><p>No messages found.</p>';
        return;
    }

    let html = '<h3>All Messages in System (' + messages.length + ' total)</h3>';

    // Add filter buttons
    html += '<div style="margin-bottom: 20px;">' +
        '<button class="btn-small" onclick="filterMessages(\'all\')">All Messages</button>' +
        '<button class="btn-small" onclick="filterMessages(\'admin\')">From Admin</button>' +
        '<button class="btn-small" onclick="filterMessages(\'public\')">Public Messages</button>' +
        '<button class="btn-small" onclick="filterMessages(\'volunteers\')">To Volunteers</button>' +
        '</div>';

    html += '<div style="max-height: 600px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px;">';
    html += '<table id="messagesTable">';
    html += '<thead><tr style="position: sticky; top: 0; background: #34495e; z-index: 10;">';
    html += '<th>Time</th><th>From</th><th>To</th><th>Message</th><th>Incident</th><th>Type</th>';
    html += '</tr></thead>';
    html += '<tbody>';

    // Sort messages by date (newest first)
    messages.sort(function(a, b) {
        return new Date(b.date_time) - new Date(a.date_time);
    });

    messages.forEach(function(message) {
        const messageType = getMessageTypeClass(message);
        const incidentInfo = message.incident_id ? 'ID: ' + message.incident_id : 'N/A';

        html += '<tr class="message-row ' + messageType + '" data-sender="' + message.sender + '" data-recipient="' + message.recipient + '">';
        html += '<td style="white-space: nowrap; font-size: 12px;">' + formatDateTime(message.date_time) + '</td>';
        html += '<td><span class="sender-badge sender-' + message.sender + '">' + message.sender + '</span></td>';
        html += '<td><span class="recipient-badge recipient-' + message.recipient + '">' + message.recipient + '</span></td>';
        html += '<td style="max-width: 300px; word-wrap: break-word;">' + escapeHtml(message.message) + '</td>';
        html += '<td style="text-align: center;">' + incidentInfo + '</td>';
        html += '<td><span class="message-type-badge ' + messageType + '">' + getMessageTypeLabel(messageType) + '</span></td>';
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function getMessageTypeClass(message) {
    if (message.sender === 'admin' && message.recipient === 'public') return 'admin-public';
    if (message.sender === 'admin' && message.recipient === 'volunteers') return 'admin-volunteers';
    if (message.sender === 'admin') return 'admin-other';
    if (message.recipient === 'public') return 'public-message';
    if (message.recipient === 'volunteers') return 'volunteer-group';
    return 'regular';
}

function getMessageTypeLabel(messageType) {
    switch (messageType) {
        case 'admin-public': return 'Admin → Public';
        case 'admin-volunteers': return 'Admin → Volunteers';
        case 'admin-other': return 'Admin Message';
        case 'public-message': return 'Public';
        case 'volunteer-group': return 'Volunteer Group';
        default: return 'Regular';
    }
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

function filterMessages(filter) {
    const rows = document.querySelectorAll('.message-row');

    rows.forEach(function(row) {
        let show = false;

        switch (filter) {
            case 'all':
                show = true;
                break;
            case 'admin':
                show = row.dataset.sender === 'admin';
                break;
            case 'public':
                show = row.dataset.recipient === 'public';
                break;
            case 'volunteers':
                show = row.dataset.recipient === 'volunteers';
                break;
        }

        row.style.display = show ? '' : 'none';
    });

    // Update active filter button
    document.querySelectorAll('.btn-small').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function handleSendAdminMessage() {
    const recipient = document.getElementById('recipient').value;
    const messageText = document.getElementById('messageText').value;
    const incidentId = document.getElementById('incidentId').value;

    // Validation
    if (!recipient) {
        showMessageResult('Please select a recipient.', 'error');
        return;
    }

    if (!messageText.trim()) {
        showMessageResult('Please enter a message.', 'error');
        return;
    }

    if (recipient === 'volunteers' && !incidentId) {
        showMessageResult('Please select an incident when sending to volunteers.', 'error');
        return;
    }

    const messageData = {
        recipient: recipient,
        message_text: messageText.trim()
    };

    // Add incident_id if selected
    if (incidentId) {
        messageData.incident_id = parseInt(incidentId);
    }

    makeAdminAjaxRequest('../admin/messages', 'POST', messageData, function(err, response) {
        if (err) {
            showMessageResult('Error sending message: ' + err.message, 'error');
        } else {
            showMessageResult('Message sent successfully!', 'success');
            document.getElementById('sendMessageForm').reset();
            document.getElementById('incidentGroup').style.display = 'none';
            // Refresh messages view
            loadMessagesSection();
        }
    });
}

function showMessageResult(message, type) {
    const resultDiv = document.getElementById('sendMessageResult');
    resultDiv.innerHTML = '<div class="' + type + '-message">' + message + '</div>';

    // Auto-clear after 5 seconds
    setTimeout(function() {
        if (resultDiv) {
            resultDiv.innerHTML = '';
        }
    }, 5000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdminPanel);