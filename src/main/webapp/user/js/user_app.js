// user_app.js - Compact version with external templates

// Global Variables/Selectors
const contentArea = document.getElementById('userContentArea');
const navLinks = document.querySelectorAll('nav ul li a');
const logoutButton = document.getElementById('logoutBtn');
const welcomeUserMsg = document.getElementById('welcomeUserMsg');

// Helper Function for User AJAX Requests
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

// Main Content Loading Function
function loadUserSection(sectionName) {
    contentArea.innerHTML = userTemplates[sectionName] || '<div class="content-section"><h2>Section not found</h2></div>';

    switch (sectionName) {
        case 'profile': loadUserProfileSection(); break;
        case 'submitIncident': loadSubmitIncidentSection(); break;
        case 'viewIncidents': loadViewIncidentsSection(); break;
        case 'messages': loadMessagesSection(); break;
    }
}

// Profile Section
function loadUserProfileSection() {
    makeUserAjaxRequest('../user/profile', 'GET', null, function(err, userData) {
        const profileContainer = document.getElementById('profileContainer');
        if (err) {
            profileContainer.innerHTML = '<div class="error-message">Error loading profile: ' + err.message + '</div>';
        } else {
            profileContainer.innerHTML = buildProfileForm(userData);

            // Add form submit listener
            document.getElementById('userProfileForm').addEventListener('submit', function(event) {
                event.preventDefault();
                submitUserProfileUpdate();
            });
        }
    });
}

function submitUserProfileUpdate() {
    // Collect standard user fields
    const formData = {
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

    // Collect volunteer fields if they exist
    const volunteerTypeField = document.getElementById('volunteer_type');
    const heightField = document.getElementById('height');
    const weightField = document.getElementById('weight');

    if (volunteerTypeField) {
        formData.volunteer_type = volunteerTypeField.value || null;
    }
    if (heightField) {
        formData.height = heightField.value || null;
    }
    if (weightField) {
        formData.weight = weightField.value || null;
    }

    makeUserAjaxRequest('../user/profile', 'POST', formData, function(err, response) {
        const messageDiv = document.getElementById('profileUpdateMessage');
        if (err) {
            messageDiv.innerHTML = '<div class="error-message">Error updating profile: ' + err.message + '</div>';
        } else {
            messageDiv.innerHTML = '<div class="success-message">Profile updated successfully!</div>';
        }
    });
}

// Submit Incident Section
function loadSubmitIncidentSection() {
    document.getElementById('submitIncidentForm').addEventListener('submit', function(event) {
        event.preventDefault();
        handleIncidentSubmission();
    });
}

function handleIncidentSubmission() {
    const incidentData = {
        incident_type: document.getElementById('incident_type').value,
        description: document.getElementById('description').value,
        address: document.getElementById('address').value,
        municipality: document.getElementById('municipality').value,
        prefecture: document.getElementById('prefecture').value,
        danger: document.getElementById('danger').value,
        lat: document.getElementById('lat').value || null,
        lon: document.getElementById('lon').value || null
    };

    makeUserAjaxRequest('../user/incidents', 'POST', incidentData, function(err, response) {
        const messageDiv = document.getElementById('incidentSubmitMessage');
        if (err) {
            messageDiv.innerHTML = '<div class="error-message">Error submitting incident: ' + err.message + '</div>';
        } else {
            messageDiv.innerHTML = '<div class="success-message">Incident submitted successfully!</div>';
            document.getElementById('submitIncidentForm').reset();
        }
    });
}

// View Incidents Section
function loadViewIncidentsSection() {
    makeUserAjaxRequest('../user/incidents', 'GET', null, function(err, incidentsData) {
        const incidentsContainer = document.getElementById('incidentsContainer');
        if (err) {
            incidentsContainer.innerHTML = '<div class="error-message">Error loading incidents: ' + err.message + '</div>';
        } else {
            renderIncidentsTable(incidentsData);
        }
    });
}

function renderIncidentsTable(incidents) {
    const incidentsContainer = document.getElementById('incidentsContainer');

    if (!incidents || incidents.length === 0) {
        incidentsContainer.innerHTML = '<p>No incidents found.</p>';
        return;
    }

    const rows = incidents.map(incident =>
        buildUserRow([
            incident.incident_id,
            incident.incident_type || 'N/A',
            incident.description || 'N/A',
            incident.status || 'N/A',
            incident.danger || 'N/A',
            incident.start_datetime || 'N/A',
            incident.address || 'N/A'
        ])
    ).join('');

    const headers = ['ID', 'Type', 'Description', 'Status', 'Danger', 'Start Time', 'Address'];
    incidentsContainer.innerHTML = buildUserTable(headers, rows);
}

// Messages Section
function loadMessagesSection() {
    makeUserAjaxRequest('../user/messages', 'GET', null, function(err, responseData) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (err) {
            messagesContainer.innerHTML = '<div class="error-message">Error loading messages: ' + err.message + '</div>';
        } else {
            renderUserMessages(responseData.messages);
            populateUserIncidentsDropdown(responseData.incidents);
        }
    });

    // Setup form handlers
    document.getElementById('recipient').addEventListener('change', function() {
        const incidentGroup = document.getElementById('incidentGroup');
        const incidentSelect = document.getElementById('incident_id');

        if (this.value === 'admin') {
            incidentGroup.style.display = 'block';
            incidentSelect.required = true;
        } else {
            incidentGroup.style.display = 'none';
            incidentSelect.required = false;
            incidentSelect.value = '';
        }
    });

    document.getElementById('sendMessageForm').addEventListener('submit', function(event) {
        event.preventDefault();
        handleUserSendMessage();
    });
}

function populateUserIncidentsDropdown(incidents) {
    const select = document.getElementById('incident_id');
    if (!incidents || incidents.length === 0) {
        select.innerHTML = '<option value="">No incidents available</option>';
        return;
    }

    select.innerHTML = '<option value="">Select an incident</option>';
    incidents.forEach(function(incident) {
        select.innerHTML += '<option value="' + incident.incident_id + '">' +
            'ID: ' + incident.incident_id + ' - ' +
            incident.incident_type + ' (' + incident.status + ') - ' +
            (incident.municipality || 'Unknown location') +
            '</option>';
    });
}

function renderUserMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');

    let html = '<div class="message-list">';
    html += '<h3>Public Messages</h3>';
    html += '<div class="messages-info">You can see all public messages from admins, volunteers, and other users.</div>';

    if (messages && messages.length > 0) {
        messages.sort(function(a, b) {
            return new Date(b.date_time) - new Date(a.date_time);
        });

        messages.forEach(function(message) {
            const messageType = getUserMessageType(message);
            html += '<div class="message-item ' + messageType + '">';
            html += '<div class="message-header">';
            html += '<span class="message-sender">From: ' + message.sender + '</span>';
            html += '<span class="message-recipient">To: ' + message.recipient + '</span>';
            if (message.incident_id && message.incident_id > 1) {
                html += '<span class="message-incident">Incident: ' + message.incident_id + '</span>';
            }
            html += '<span class="message-type-badge ' + messageType + '">' + getUserMessageTypeLabel(messageType) + '</span>';
            html += '</div>';
            html += '<div class="message-content">' + escapeHtml(message.message) + '</div>';
            html += '<div class="message-time">' + formatDateTime(message.date_time) + '</div>';
            html += '</div>';
        });
    } else {
        html += '<p>No public messages available.</p>';
    }

    html += '</div>';
    messagesContainer.innerHTML = html;
}

function getUserMessageType(message) {
    if (message.sender === 'admin') return 'from-admin';
    if (message.sender.includes('volunteer') || isKnownVolunteer(message.sender)) return 'from-volunteer';
    return 'from-user';
}

function getUserMessageTypeLabel(messageType) {
    switch (messageType) {
        case 'from-admin': return 'From Admin';
        case 'from-volunteer': return 'From Volunteer';
        case 'from-user': return 'From User';
        default: return 'Public';
    }
}

function isKnownVolunteer(sender) {
    const volunteerPatterns = ['volunteer', 'vol_', 'raphael', 'nick', 'mary', 'papas'];
    return volunteerPatterns.some(pattern => sender.toLowerCase().includes(pattern.toLowerCase()));
}

function handleUserSendMessage() {
    const recipient = document.getElementById('recipient').value;
    const messageText = document.getElementById('message_text').value;
    const incidentId = document.getElementById('incident_id').value;

    if (!recipient) {
        showUserMessageResult('Please select a recipient.', 'error');
        return;
    }

    if (!messageText.trim()) {
        showUserMessageResult('Please enter a message.', 'error');
        return;
    }

    if (recipient === 'admin' && !incidentId) {
        showUserMessageResult('Please select an incident when messaging admin.', 'error');
        return;
    }

    const messageData = {
        recipient: recipient,
        message_text: messageText.trim()
    };

    if (incidentId) {
        messageData.incident_id = parseInt(incidentId);
    }

    makeUserAjaxRequest('../user/messages', 'POST', messageData, function(err, response) {
        if (err) {
            showUserMessageResult('Error sending message: ' + err.message, 'error');
        } else {
            showUserMessageResult('Message sent successfully!', 'success');
            document.getElementById('sendMessageForm').reset();
            document.getElementById('incidentGroup').style.display = 'none';
            loadMessagesSection();
        }
    });
}

function showUserMessageResult(message, type) {
    const resultDiv = document.getElementById('sendMessageResult');
    resultDiv.innerHTML = '<div class="' + type + '-message">' + message + '</div>';

    setTimeout(function() {
        if (resultDiv) {
            resultDiv.innerHTML = '';
        }
    }, 5000);
}

// Utility functions
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initUserPanel);