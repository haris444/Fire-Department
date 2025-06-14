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
    contentArea.innerHTML = '';

    switch (sectionName) {
        case 'profile':
            loadUserProfileSection();
            break;
        case 'submitIncident':
            loadSubmitIncidentSection();
            break;
        case 'viewIncidents':
            loadViewIncidentsSection();
            break;
        case 'messages':
            loadMessagesSection();
            break;
        default:
            contentArea.innerHTML = '<div class="content-section"><h2>Section not found</h2></div>';
    }
}

// Profile Section
function loadUserProfileSection() {
    contentArea.innerHTML = '<div class="content-section"><h2>My Profile</h2><div id="profileContainer">Loading profile...</div></div>';

    // UPDATED: Now calls unified ProfileServlet which returns User object with all fields
    makeUserAjaxRequest('../user/profile', 'GET', null, function(err, userData) {
        const profileContainer = document.getElementById('profileContainer');
        if (err) {
            profileContainer.innerHTML = '<div class="error-message">Error loading profile: ' + err.message + '</div>';
        } else {
            renderUserProfileForm(userData);
        }
    });
}

// UPDATED: Modified to conditionally render volunteer-specific fields
function renderUserProfileForm(user) {
    const profileContainer = document.getElementById('profileContainer');

    let html = '<form id="userProfileForm" class="user-form">';
    html += '<h3>Profile Information</h3>';

    // CONDITIONAL RENDERING: Check if this is a volunteer to show volunteer-specific fields
    const isVolunteer = user.user_type === 'volunteer';

    // Non-editable fields
    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<label>Username:</label>';
    html += '<input type="text" value="' + (user.username || '') + '" readonly>';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label>Email:</label>';
    html += '<input type="email" value="' + (user.email || '') + '" readonly>';
    html += '</div>';
    html += '</div>';

    // UPDATED: Show user type (read-only)
    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<label>Account Type:</label>';
    html += '<input type="text" value="' + (user.user_type || 'user') + '" readonly>';
    html += '</div>';
    html += '</div>';

    // Editable fields
    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<label for="firstname">First Name:</label>';
    html += '<input type="text" id="firstname" name="firstname" value="' + (user.firstname || '') + '" required>';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label for="lastname">Last Name:</label>';
    html += '<input type="text" id="lastname" name="lastname" value="' + (user.lastname || '') + '" required>';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<label for="birthdate">Birth Date:</label>';
    html += '<input type="date" id="birthdate" name="birthdate" value="' + (user.birthdate || '') + '" required>';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label for="gender">Gender:</label>';
    html += '<select id="gender" name="gender" required>';
    html += '<option value="Male"' + (user.gender === 'Male' ? ' selected' : '') + '>Male</option>';
    html += '<option value="Female"' + (user.gender === 'Female' ? ' selected' : '') + '>Female</option>';
    html += '<option value="Other"' + (user.gender === 'Other' ? ' selected' : '') + '>Other</option>';
    html += '</select>';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<label for="afm">AFM:</label>';
    html += '<input type="text" id="afm" name="afm" value="' + (user.afm || '') + '" required>';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label for="country">Country:</label>';
    html += '<input type="text" id="country" name="country" value="' + (user.country || '') + '" required>';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label for="address">Address:</label>';
    html += '<input type="text" id="address" name="address" value="' + (user.address || '') + '" required>';
    html += '</div>';

    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<label for="municipality">Municipality:</label>';
    html += '<input type="text" id="municipality" name="municipality" value="' + (user.municipality || '') + '" required>';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label for="prefecture">Prefecture:</label>';
    html += '<input type="text" id="prefecture" name="prefecture" value="' + (user.prefecture || '') + '" required>';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<label for="job">Job:</label>';
    html += '<input type="text" id="job" name="job" value="' + (user.job || '') + '" required>';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label for="telephone">Telephone:</label>';
    html += '<input type="tel" id="telephone" name="telephone" value="' + (user.telephone || '') + '" required>';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<label for="lat">Latitude:</label>';
    html += '<input type="number" id="lat" name="lat" value="' + (user.lat || '') + '" step="any">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label for="lon">Longitude:</label>';
    html += '<input type="number" id="lon" name="lon" value="' + (user.lon || '') + '" step="any">';
    html += '</div>';
    html += '</div>';

    // CONDITIONAL RENDERING: Only show volunteer-specific fields if user_type is 'volunteer'
    if (isVolunteer) {
        html += '<h3>Volunteer Information</h3>';

        html += '<div class="form-row">';
        html += '<div class="form-group">';
        html += '<label for="volunteer_type">Volunteer Type:</label>';
        html += '<select id="volunteer_type" name="volunteer_type">';
        html += '<option value="">Select Type</option>';
        html += '<option value="simple"' + (user.volunteer_type === 'simple' ? ' selected' : '') + '>Simple</option>';
        html += '<option value="driver"' + (user.volunteer_type === 'driver' ? ' selected' : '') + '>Driver</option>';
        html += '</select>';
        html += '</div>';
        html += '</div>';

        html += '<div class="form-row">';
        html += '<div class="form-group">';
        html += '<label for="height">Height (m):</label>';
        html += '<input type="number" id="height" name="height" value="' + (user.height || '') + '" step="0.01" placeholder="e.g., 1.75">';
        html += '</div>';
        html += '<div class="form-group">';
        html += '<label for="weight">Weight (kg):</label>';
        html += '<input type="number" id="weight" name="weight" value="' + (user.weight || '') + '" step="0.1" placeholder="e.g., 70.5">';
        html += '</div>';
        html += '</div>';
    }

    html += '<button type="submit">Update Profile</button>';
    html += '</form>';
    html += '<div id="profileUpdateMessage"></div>';

    profileContainer.innerHTML = html;

    // Add form submit listener
    document.getElementById('userProfileForm').addEventListener('submit', function(event) {
        event.preventDefault();
        submitUserProfileUpdate();
    });
}

// UPDATED: Modified to handle optional volunteer fields in form submission
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

    // CONDITIONAL DATA COLLECTION: Only collect volunteer fields if they exist in the DOM
    // This means the user is a volunteer and these fields were rendered
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

    // UPDATED: Send to unified ProfileServlet which handles both users and volunteers
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
// Submit Incident Section
function loadSubmitIncidentSection() {
    let html = '<div class="content-section">';
    html += '<h2>Submit New Incident</h2>';
    html += '<form id="submitIncidentForm" class="user-form">';
    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<label for="incident_type">Incident Type:</label>';
    html += '<select id="incident_type" name="incident_type" required>';
    html += '<option value="">Select Type</option>';
    html += '<option value="fire">Fire</option>';
    html += '<option value="crash">Accident</option>';
    html += '<option value="accident">Medical Emergency</option>';
    html += '<option value="rescue">Rescue</option>';
    html += '<option value="other">Other</option>';
    html += '</select>';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label for="danger">Danger Level:</label>';
    html += '<select id="danger" name="danger" required>';
    html += '<option value="">Select Danger Level</option>';
    html += '<option value="low">Low</option>';
    html += '<option value="medium">Medium</option>';
    html += '<option value="high">High</option>';
    html += '</select>';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label for="description">Description:</label>';
    html += '<textarea id="description" name="description" required placeholder="Describe the incident in detail..."></textarea>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label for="address">Address:</label>';
    html += '<input type="text" id="address" name="address" required placeholder="Enter the incident location">';
    html += '</div>';

    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<label for="municipality">Municipality:</label>';
    html += '<input type="text" id="municipality" name="municipality" required>';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label for="prefecture">Prefecture:</label>';
    html += '<input type="text" id="prefecture" name="prefecture" required>';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<label for="lat">Latitude (optional):</label>';
    html += '<input type="number" id="lat" name="lat" step="any" placeholder="e.g., 35.3387352">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label for="lon">Longitude (optional):</label>';
    html += '<input type="number" id="lon" name="lon" step="any" placeholder="e.g., 25.1442126">';
    html += '</div>';
    html += '</div>';

    html += '<button type="submit">Submit Incident</button>';
    html += '</form>';
    html += '<div id="incidentSubmitMessage"></div>';
    html += '</div>';

    contentArea.innerHTML = html;

    // Add form submit listener
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
    contentArea.innerHTML = '<div class="content-section"><h2>View Incidents</h2><div id="incidentsContainer">Loading incidents...</div></div>';

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

    let html = '<table>';
    html += '<thead><tr>';
    html += '<th>ID</th>';
    html += '<th>Type</th>';
    html += '<th>Description</th>';
    html += '<th>Status</th>';
    html += '<th>Danger</th>';
    html += '<th>Start Time</th>';
    html += '<th>Address</th>';
    html += '</tr></thead>';
    html += '<tbody>';

    incidents.forEach(function(incident) {
        html += '<tr>';
        html += '<td>' + incident.incident_id + '</td>';
        html += '<td>' + (incident.incident_type || 'N/A') + '</td>';
        html += '<td>' + (incident.description || 'N/A') + '</td>';
        html += '<td>' + (incident.status || 'N/A') + '</td>';
        html += '<td>' + (incident.danger || 'N/A') + '</td>';
        html += '<td>' + (incident.start_datetime || 'N/A') + '</td>';
        html += '<td>' + (incident.address || 'N/A') + '</td>';
        html += '</tr>';
    });

    html += '</tbody></table>';
    incidentsContainer.innerHTML = html;
}

// Messages Section - Updated implementation for regular users
function loadMessagesSection() {
    let html = '<div class="content-section">';
    html += '<h2>Messages</h2>';
    html += '<div id="messagesContainer">Loading messages...</div>';

    // Send message form with user-specific rules
    html += '<div class="message-compose">';
    html += '<h3>Send New Message</h3>';
    html += '<div class="message-info">';
    html += '<p><strong>User Messaging Rules:</strong></p>';
    html += '<ul>';
    html += '<li>Send <strong>Public</strong> messages: Visible to all users</li>';
    html += '<li>Send to <strong>Admin</strong>: Must specify an incident ID (for incident-related communications)</li>';
    html += '<li>You can only see public messages from others</li>';
    html += '</ul>';
    html += '</div>';
    html += '<form id="sendMessageForm">';
    html += '<div class="form-group">';
    html += '<label for="recipient">Recipient: *</label>';
    html += '<select id="recipient" name="recipient" required>';
    html += '<option value="">Select Recipient</option>';
    html += '<option value="public">Public (All Users)</option>';
    html += '<option value="admin">Admin (About Incident)</option>';
    html += '</select>';
    html += '</div>';
    html += '<div class="form-group" id="incidentGroup" style="display: none;">';
    html += '<label for="incident_id">Incident: * <span class="field-note">(Required when messaging admin)</span></label>';
    html += '<select id="incident_id" name="incident_id">';
    html += '<option value="">Loading incidents...</option>';
    html += '</select>';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label for="message_text">Message: *</label>';
    html += '<textarea id="message_text" name="message_text" required placeholder="Type your message here..."></textarea>';
    html += '</div>';
    html += '<button type="submit" class="btn-send">Send Message</button>';
    html += '</form>';
    html += '<div id="sendMessageResult"></div>';
    html += '</div>';
    html += '</div>';

    contentArea.innerHTML = html;

    // Load messages and incidents
    makeUserAjaxRequest('../user/messages', 'GET', null, function(err, responseData) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (err) {
            messagesContainer.innerHTML = '<div class="error-message">Error loading messages: ' + err.message + '</div>';
        } else {
            // Render public messages only
            renderUserMessages(responseData.messages);

            // Populate incidents dropdown for admin messages
            populateUserIncidentsDropdown(responseData.incidents);
        }
    });

    // Add recipient change listener to show/hide incident dropdown
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

    // Add send message form listener
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
        // Show all incidents for user reference
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
        // Sort messages by date (newest first)
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
    // Simple check - in a real app you might want to track this differently
    // For now, we'll assume volunteer usernames contain certain patterns
    const volunteerPatterns = ['volunteer', 'vol_', 'raphael', 'nick', 'mary', 'papas'];
    return volunteerPatterns.some(pattern => sender.toLowerCase().includes(pattern.toLowerCase()));
}

function handleUserSendMessage() {
    const recipient = document.getElementById('recipient').value;
    const messageText = document.getElementById('message_text').value;
    const incidentId = document.getElementById('incident_id').value;

    // Validation
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

    // Add incident_id if provided
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
            // Refresh messages
            loadMessagesSection();
        }
    });
}

function showUserMessageResult(message, type) {
    const resultDiv = document.getElementById('sendMessageResult');
    resultDiv.innerHTML = '<div class="' + type + '-message">' + message + '</div>';

    // Auto-clear after 5 seconds
    setTimeout(function() {
        if (resultDiv) {
            resultDiv.innerHTML = '';
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initUserPanel);