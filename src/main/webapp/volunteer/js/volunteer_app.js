// Global Variables/Selectors
const contentArea = document.getElementById('volunteerContentArea');
const navLinks = document.querySelectorAll('nav ul li a');
const logoutButton = document.getElementById('logoutBtn');
const welcomeMsg = document.getElementById('welcomeVolunteerMsg');

/**
 * Helper function for making authenticated AJAX requests for the volunteer panel.
 * @param {string} url - The URL to request.
 * @param {string} method - The HTTP method (GET, POST).
 * @param {object} data - The data to send (for POST requests).
 * @param {function} callback - The callback function to handle the response.
 */
function makeVolunteerAjaxRequest(url, method, data, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    // Note: We reuse the user session token logic from user_auth.js
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
            // Unauthorized or forbidden, redirect to login
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

/**
 * Initializes the volunteer panel when the DOM is fully loaded.
 */
function initVolunteerPanel() {
    if (!getUserSessionToken()) {
        redirectToUserLogin();
        return;
    }

    // Display welcome message
    if (welcomeMsg) {
        welcomeMsg.textContent = `Welcome, Volunteer ${getLoggedInUsername()}!`;
    }

    // Logout button event listener
    if (logoutButton) {
        logoutButton.addEventListener('click', () => logoutUser());
    }

    // Navigation links event listeners
    navLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const sectionName = event.target.dataset.section;
            loadVolunteerSection(sectionName);
        });
    });

    // Load the default profile section
    loadVolunteerSection('profile');
}

/**
 * Loads the content for a specific section into the main content area.
 * @param {string} sectionName - The name of the section to load.
 */
function loadVolunteerSection(sectionName) {
    contentArea.innerHTML = ''; // Clear previous content

    switch (sectionName) {
        case 'profile':
            // This will use the universal ProfileServlet
            loadUserProfileSection();
            break;
        case 'incidents':
            loadIncidentsSection();
            break;
        case 'messages':
            loadMessagesSection();
            break;
        default:
            contentArea.innerHTML = `<div class="content-section"><h2>Section not found</h2></div>`;
    }
}

/**
 * Loads the incidents section with two tabs.
 */
function loadIncidentsSection() {
    let html = `
        <div class="content-section">
            <h2>Incidents</h2>
            
            <!-- Tab Navigation -->
            <div class="tab-navigation">
                <button class="tab-btn active" data-tab="available">Available Incidents</button>
                <button class="tab-btn" data-tab="assigned">My Assigned Incidents</button>
            </div>
            
            <!-- Tab Content Areas -->
            <div id="availableIncidentsTab" class="tab-content active">
                <h3>Available Incidents - Apply to Help</h3>
                <div id="availableIncidentsContainer">Loading available incidents...</div>
            </div>
            
            <div id="assignedIncidentsTab" class="tab-content">
                <h3>My Assigned Incidents</h3>
                <div id="assignedIncidentsContainer">Loading assigned incidents...</div>
            </div>
        </div>
    `;

    contentArea.innerHTML = html;

    // Add tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Load initial data for both tabs
    loadAvailableIncidents();
    loadAssignedIncidents();
}

/**
 * Switches between tabs in the incidents section.
 * @param {string} tabName - The name of the tab to switch to.
 */
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}IncidentsTab`).classList.add('active');
}

/**
 * Loads all available incidents for the volunteer to apply to.
 */
function loadAvailableIncidents() {
    // Get all incidents (not just assigned ones)
    makeVolunteerAjaxRequest('../volunteer/incidents?type=all', 'GET', null, (err, incidentsData) => {
        const container = document.getElementById('availableIncidentsContainer');
        if (err || !incidentsData) {
            container.innerHTML = `<div class="error-message">Error loading incidents: ${err ? err.message : 'No data returned'}</div>`;
        } else {
            renderAvailableIncidentsTable(incidentsData, container);
        }
    });
}

/**
 * Loads incidents assigned to this volunteer.
 */
function loadAssignedIncidents() {
    // Get only assigned incidents
    makeVolunteerAjaxRequest('../volunteer/incidents?type=assigned', 'GET', null, (err, incidentsData) => {
        const container = document.getElementById('assignedIncidentsContainer');
        if (err || !incidentsData) {
            container.innerHTML = `<div class="error-message">Error loading assigned incidents: ${err ? err.message : 'No data returned'}</div>`;
        } else {
            renderAssignedIncidentsTable(incidentsData, container);
        }
    });
}

/**
 * Renders a table of available incidents with apply buttons.
 * @param {Array<object>} incidents - The array of incident objects.
 * @param {HTMLElement} container - The container to render the table in.
 */
function renderAvailableIncidentsTable(incidents, container) {
    if (!incidents.length) {
        container.innerHTML = '<p>No incidents available at this time.</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Danger</th>
                    <th>Location</th>
                    <th>Start Time</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    incidents.forEach(incident => {
        html += `
            <tr>
                <td>${incident.incident_id}</td>
                <td>${incident.incident_type || 'N/A'}</td>
                <td>${incident.description || 'N/A'}</td>
                <td><span class="status-badge status-${(incident.status || '').toLowerCase()}">${incident.status || 'N/A'}</span></td>
                <td><span class="danger-badge danger-${(incident.danger || '').toLowerCase()}">${incident.danger || 'N/A'}</span></td>
                <td>${incident.municipality || 'N/A'}, ${incident.prefecture || 'N/A'}</td>
                <td>${incident.start_datetime || 'N/A'}</td>
                <td>
                    <button class="btn-small btn-apply" onclick="applyToIncident(${incident.incident_id})">
                        Apply to Help
                    </button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

/**
 * Renders a table of assigned incidents.
 * @param {Array<object>} incidents - The array of incident objects.
 * @param {HTMLElement} container - The container to render the table in.
 */
function renderAssignedIncidentsTable(incidents, container) {
    if (!incidents.length) {
        container.innerHTML = '<p>You are not currently assigned to any incidents.</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Danger</th>
                    <th>Location</th>
                    <th>Start Time</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    incidents.forEach(incident => {
        html += `
            <tr>
                <td>${incident.incident_id}</td>
                <td>${incident.incident_type || 'N/A'}</td>
                <td>${incident.description || 'N/A'}</td>
                <td><span class="status-badge status-${(incident.status || '').toLowerCase()}">${incident.status || 'N/A'}</span></td>
                <td><span class="danger-badge danger-${(incident.danger || '').toLowerCase()}">${incident.danger || 'N/A'}</span></td>
                <td>${incident.municipality || 'N/A'}, ${incident.prefecture || 'N/A'}</td>
                <td>${incident.start_datetime || 'N/A'}</td>
                <td>
                    <button class="btn-small btn-leave" onclick="leaveIncident(${incident.incident_id})">
                        Leave Assignment
                    </button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

/**
 * Handles volunteer applying to an incident.
 * @param {number} incidentId - The ID of the incident to apply to.
 */
function applyToIncident(incidentId) {
    if (!confirm('Are you sure you want to apply to help with this incident?')) {
        return;
    }

    const requestData = {
        action: 'apply',
        incident_id: incidentId
    };

    // This would need a new endpoint or modify existing volunteer servlet
    makeVolunteerAjaxRequest('../volunteer/incidents', 'POST', requestData, (err, response) => {
        if (err) {
            showMessage('Error applying to incident: ' + err.message, 'error');
        } else {
            showMessage('Successfully applied to incident! Admin will review your application.', 'success');
            // Refresh the assigned incidents tab
            loadAssignedIncidents();
        }
    });
}

/**
 * Handles volunteer leaving an incident assignment.
 * @param {number} incidentId - The ID of the incident to leave.
 */
function leaveIncident(incidentId) {
    if (!confirm('Are you sure you want to leave this incident assignment?')) {
        return;
    }

    const requestData = {
        action: 'leave',
        incident_id: incidentId
    };

    makeVolunteerAjaxRequest('../volunteer/incidents', 'POST', requestData, (err, response) => {
        if (err) {
            showMessage('Error leaving incident: ' + err.message, 'error');
        } else {
            showMessage('Successfully left the incident assignment.', 'success');
            // Refresh both tabs
            loadAvailableIncidents();
            loadAssignedIncidents();
        }
    });
}

/**
 * Shows a temporary message to the user.
 * @param {string} message - The message to show.
 * @param {string} type - The type of message (success, error, info).
 */
function showMessage(message, type) {
    // Remove any existing messages
    const existingMessage = document.querySelector('.temp-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create new message element
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

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, 5000);
}

/**
 * Loads the user profile section.
 * This function is adapted from user_app.js to work in the volunteer context.
 * It calls the universal profile servlet.
 */
function loadUserProfileSection() {
    contentArea.innerHTML = `<div class="content-section"><h2>My Profile</h2><div id="profileContainer">Loading profile...</div></div>`;

    // The endpoint is the universal profile servlet we planned
    makeVolunteerAjaxRequest('../volunteer/profile', 'GET', null, (err, userData) => {
        const profileContainer = document.getElementById('profileContainer');
        if (err) {
            profileContainer.innerHTML = `<div class="error-message">Error loading profile: ${err.message}</div>`;
        } else {
            // The rendering function needs to handle volunteer-specific fields
            renderUserProfileForm(userData);
        }
    });
}

/**
 * Renders the user profile form, including volunteer-specific fields.
 * @param {object} user - The user object containing all profile data.
 */
function renderUserProfileForm(user) {
    const profileContainer = document.getElementById('profileContainer');

    let html = `
        <form id="userProfileForm" class="user-form">
            <h3>Profile Information</h3>
            <div class="form-row">
                <div class="form-group"><label>Username:</label><input type="text" value="${user.username || ''}" readonly></div>
                <div class="form-group"><label>Email:</label><input type="email" value="${user.email || ''}" readonly></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Account Type:</label><input type="text" value="${user.user_type || 'volunteer'}" readonly></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label for="firstname">First Name:</label><input type="text" id="firstname" name="firstname" value="${user.firstname || ''}" required></div>
                <div class="form-group"><label for="lastname">Last Name:</label><input type="text" id="lastname" name="lastname" value="${user.lastname || ''}" required></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label for="birthdate">Birth Date:</label><input type="date" id="birthdate" name="birthdate" value="${user.birthdate || ''}" required></div>
                <div class="form-group"><label for="gender">Gender:</label><select id="gender" name="gender" required>
                    <option value="Male"${user.gender === 'Male' ? ' selected' : ''}>Male</option>
                    <option value="Female"${user.gender === 'Female' ? ' selected' : ''}>Female</option>
                    <option value="Other"${user.gender === 'Other' ? ' selected' : ''}>Other</option>
                </select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label for="afm">AFM:</label><input type="text" id="afm" name="afm" value="${user.afm || ''}" required></div>
                <div class="form-group"><label for="country">Country:</label><input type="text" id="country" name="country" value="${user.country || ''}" required></div>
            </div>
            <div class="form-group"><label for="address">Address:</label><input type="text" id="address" name="address" value="${user.address || ''}" required></div>
            <div class="form-row">
                <div class="form-group"><label for="municipality">Municipality:</label><input type="text" id="municipality" name="municipality" value="${user.municipality || ''}" required></div>
                <div class="form-group"><label for="prefecture">Prefecture:</label><input type="text" id="prefecture" name="prefecture" value="${user.prefecture || ''}" required></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label for="job">Job:</label><input type="text" id="job" name="job" value="${user.job || ''}" required></div>
                <div class="form-group"><label for="telephone">Telephone:</label><input type="tel" id="telephone" name="telephone" value="${user.telephone || ''}" required></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label for="lat">Latitude:</label><input type="number" id="lat" name="lat" value="${user.lat || ''}" step="any"></div>
                <div class="form-group"><label for="lon">Longitude:</label><input type="number" id="lon" name="lon" value="${user.lon || ''}" step="any"></div>
            </div>
    `;

    // Add volunteer-specific fields
    if (user.user_type === 'volunteer') {
        html += `
            <h3>Volunteer Information</h3>
            <div class="form-row">
                <div class="form-group">
                    <label for="volunteer_type">Volunteer Type:</label>
                    <select id="volunteer_type" name="volunteer_type">
                        <option value="">Select Type</option>
                        <option value="simple"${user.volunteer_type === 'simple' ? ' selected' : ''}>Simple</option>
                        <option value="driver"${user.volunteer_type === 'driver' ? ' selected' : ''}>Driver</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="height">Height (m):</label>
                    <input type="number" id="height" name="height" step="0.01" value="${user.height || ''}" placeholder="e.g., 1.75">
                </div>
                <div class="form-group">
                    <label for="weight">Weight (kg):</label>
                    <input type="number" id="weight" name="weight" step="0.1" value="${user.weight || ''}" placeholder="e.g., 70.5">
                </div>
            </div>
        `;
    }

    html += `
            <button type="submit">Update Profile</button>
        </form>
        <div id="profileUpdateMessage"></div>
    `;

    profileContainer.innerHTML = html;

    // Add form submit listener
    document.getElementById('userProfileForm').addEventListener('submit', event => {
        event.preventDefault();
        submitUserProfileUpdate();
    });
}

/**
 * Submits the updated profile data to the server.
 */
function submitUserProfileUpdate() {
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

    // Add volunteer fields if they exist in the form
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

    makeVolunteerAjaxRequest('../volunteer/profile', 'POST', formData, (err, response) => {
        const messageDiv = document.getElementById('profileUpdateMessage');
        if (err) {
            messageDiv.innerHTML = `<div class="error-message">Error updating profile: ${err.message}</div>`;
        } else {
            messageDiv.innerHTML = `<div class="success-message">Profile updated successfully!</div>`;
        }
    });
}

/**
 * Loads the messaging section for the volunteer.
 */
function loadMessagesSection() {
    contentArea.innerHTML = `<div class="content-section"><h2>Messages</h2>
        <div id="messagesContainer">Loading messages...</div>
        <div class="message-compose">
            <h3>Send New Message</h3>
            <div class="message-info">
                <p><strong>Volunteer Message Rules:</strong></p>
                <ul>
                    <li>You can send messages to: <strong>Admin</strong>, <strong>Public</strong>, or <strong>Volunteers</strong></li>
                    <li>Incident ID is required for all messages</li>
                    <li>You can send messages about any incident</li>
                    <li>You can see: Public messages and volunteer messages for your assigned incidents</li>
                </ul>
            </div>
            <form id="sendMessageForm">
                <div class="form-group">
                    <label for="recipient">Recipient: *</label>
                    <select id="recipient" name="recipient" required>
                        <option value="">Select Recipient</option>
                        <option value="admin">Admin</option>
                        <option value="volunteers">Volunteers (on incident)</option>
                        <option value="public">Public</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="incident_id">Incident: * <span class="field-note">(Any incident)</span></label>
                    <select id="incident_id" name="incident_id" required>
                        <option value="">Loading incidents...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="message_text">Message: *</label>
                    <textarea id="message_text" name="message_text" required placeholder="Type your message here..."></textarea>
                </div>
                <button type="submit" class="btn-send">Send Message</button>
            </form>
            <div id="sendMessageResult"></div>
        </div>
    </div>`;

    // Load all incidents for the dropdown (not just assigned)
    loadAllIncidentsForMessaging();

    // Fetch and render messages
    makeVolunteerAjaxRequest('../volunteer/messages', 'GET', null, (err, messages) => {
        const messagesContainer = document.getElementById('messagesContainer');
        if (err) {
            messagesContainer.innerHTML = `<div class="error-message">Error loading messages: ${err.message}</div>`;
        } else {
            renderVolunteerMessages(messages, messagesContainer);
        }
    });

    // FIXED: Use setTimeout to ensure form is in DOM before adding listener
    setTimeout(() => {
        const sendMessageForm = document.getElementById('sendMessageForm');
        if (sendMessageForm) {
            // Add single event listener
            sendMessageForm.addEventListener('submit', handleVolunteerSendMessage);
        }
    }, 0);
}

/**
 * Loads all incidents for the messaging dropdown (volunteers can message about any incident).
 */
function loadAllIncidentsForMessaging() {
    makeVolunteerAjaxRequest('../volunteer/incidents?type=all', 'GET', null, (err, incidents) => {
        const select = document.getElementById('incident_id');
        if (err || !incidents || incidents.length === 0) {
            select.innerHTML = '<option value="">No incidents found</option>';
            select.disabled = true;
            return;
        }

        select.innerHTML = '<option value="">Select an incident</option>';
        incidents.forEach(incident => {
            select.innerHTML += `<option value="${incident.incident_id}">
                ID: ${incident.incident_id} - ${incident.incident_type} (${incident.status}) - ${incident.municipality || 'Unknown'}
            </option>`;
        });
        select.disabled = false;
    });
}

/**
 * Renders messages in the message list with proper categorization.
 * @param {Array<object>} messages - Array of message objects.
 * @param {HTMLElement} container - The container to render into.
 */
function renderVolunteerMessages(messages, container) {
    let html = '<div class="message-list">';

    if (messages && messages.length > 0) {
        html += '<h3>Your Messages</h3>';
        html += '<div class="messages-info"><p>You can see: Public messages and volunteer messages for incidents you are assigned to. All messages are tied to specific incidents.</p></div>';

        // Sort messages by date (newest first)
        messages.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));

        messages.forEach(message => {
            const messageType = getVolunteerMessageType(message);
            html += `
                <div class="message-item ${messageType}">
                    <div class="message-header">
                        <span class="message-sender">From: ${message.sender}</span>
                        <span class="message-recipient">To: ${message.recipient}</span>
                        <span class="message-incident">Incident: ${message.incident_id || 'N/A'}</span>
                        <span class="message-type-badge ${messageType}">${getVolunteerMessageTypeLabel(messageType)}</span>
                    </div>
                    <div class="message-content">${escapeHtml(message.message)}</div>
                    <div class="message-time">${formatDateTime(message.date_time)}</div>
                </div>
            `;
        });
    } else {
        html += '<p>No messages available.</p>';
    }

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Determines the type of message for styling purposes.
 * @param {object} message - The message object.
 * @returns {string} The message type.
 */
function getVolunteerMessageType(message) {
    if (message.recipient === 'public') return 'public';
    if (message.sender === 'admin') return 'from-admin';
    if (message.recipient === 'volunteers') return 'volunteer-group';
    return 'regular';
}

/**
 * Gets a user-friendly label for the message type.
 * @param {string} messageType - The message type.
 * @returns {string} The label.
 */
function getVolunteerMessageTypeLabel(messageType) {
    switch (messageType) {
        case 'public': return 'Public';
        case 'from-admin': return 'From Admin';
        case 'volunteer-group': return 'Volunteer Group';
        default: return 'Regular';
    }
}

/**
 * FIXED: Handles sending a message from the volunteer with proper event handling.
 */
function handleVolunteerSendMessage(event) {
    event.preventDefault();

    const recipient = document.getElementById('recipient').value;
    const messageText = document.getElementById('message_text').value;
    const incidentId = document.getElementById('incident_id').value;

    // Validate all required fields
    if (!recipient) {
        showVolunteerMessageResult('Please select a recipient.', 'error');
        return;
    }

    if (!incidentId) {
        showVolunteerMessageResult('Please select an incident ID (required for all messages).', 'error');
        return;
    }

    if (!messageText.trim()) {
        showVolunteerMessageResult('Please enter a message.', 'error');
        return;
    }

    // Validate recipient options for volunteers
    if (!['admin', 'public', 'volunteers'].includes(recipient)) {
        showVolunteerMessageResult('Volunteers can only send to Admin, Public, or Volunteers.', 'error');
        return;
    }

    const messageData = {
        recipient: recipient,
        message_text: messageText.trim(),
        incident_id: parseInt(incidentId)
    };

    makeVolunteerAjaxRequest('../volunteer/messages', 'POST', messageData, (err, response) => {
        if (err) {
            showVolunteerMessageResult(`Error sending message: ${err.message}`, 'error');
        } else {
            showVolunteerMessageResult('Message sent successfully!', 'success');
            document.getElementById('sendMessageForm').reset();
            // Refresh messages after sending
            loadMessagesSection();
        }
    });
}

/**
 * Shows a result message for the send message form.
 * @param {string} message - The message to show.
 * @param {string} type - The type of message (success/error).
 */
function showVolunteerMessageResult(message, type) {
    const resultDiv = document.getElementById('sendMessageResult');
    resultDiv.innerHTML = `<div class="${type}-message">${message}</div>`;

    // Auto-clear after 5 seconds
    setTimeout(() => {
        if (resultDiv) {
            resultDiv.innerHTML = '';
        }
    }, 5000);
}
/**
* Utility function to format date/time for display.
                                           * @param {string} dateTimeStr - The datetime string.
* @returns {string} Formatted date/time.
*/
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return 'N/A';
    try {
        const date = new Date(dateTimeStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
        return dateTimeStr;
    }
}

/**
 * Utility function to escape HTML for safe display.
 * @param {string} text - The text to escape.
 * @returns {string} HTML-escaped text.
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize the panel when the DOM is ready
document.addEventListener('DOMContentLoaded', initVolunteerPanel);