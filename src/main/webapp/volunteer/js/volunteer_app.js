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
            loadAssignedIncidentsSection();
            break;
        case 'messages':
            loadMessagesSection();
            break;
        default:
            contentArea.innerHTML = `<div class="content-section"><h2>Section not found</h2></div>`;
    }
}

/**
 * Loads the user profile section.
 * This function is adapted from user_app.js to work in the volunteer context.
 * It calls the universal profile servlet.
 */
function loadUserProfileSection() {
    contentArea.innerHTML = `<div class="content-section"><h2>My Profile</h2><div id="profileContainer">Loading profile...</div></div>`;

    // The endpoint is the universal profile servlet we planned
    makeVolunteerAjaxRequest('../user/profile', 'GET', null, (err, userData) => {
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

    // Base form fields (same as regular user)
    let html = `
        <form id="userProfileForm" class="user-form">
            <h3>Profile Information</h3>
            <div class="form-row">
                <div class="form-group"><label>Username:</label><input type="text" value="${user.username}" readonly></div>
                <div class="form-group"><label>Email:</label><input type="email" value="${user.email}" readonly></div>
            </div>
            <!-- Other user fields like name, birthdate, etc. -->
            <div class="form-row">
                <div class="form-group"><label for="firstname">First Name:</label><input type="text" id="firstname" name="firstname" value="${user.firstname}" required></div>
                <div class="form-group"><label for="lastname">Last Name:</label><input type="text" id="lastname" name="lastname" value="${user.lastname}" required></div>
            </div>
            <!-- ... other common fields ... -->
    `;

    // Conditionally add volunteer-specific fields
    if (user.user_type === 'volunteer') {
        html += `
            <h3>Volunteer Information</h3>
            <div class="form-row">
                <div class="form-group">
                    <label for="volunteer_type">Volunteer Type:</label>
                    <select id="volunteer_type" name="volunteer_type">
                        <option value="simple" ${user.volunteer_type === 'simple' ? 'selected' : ''}>Simple</option>
                        <option value="driver" ${user.volunteer_type === 'driver' ? 'selected' : ''}>Driver</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="height">Height (m):</label>
                    <input type="number" id="height" name="height" step="0.01" value="${user.height || ''}">
                </div>
                <div class="form-group">
                    <label for="weight">Weight (kg):</label>
                    <input type="number" id="weight" name="weight" step="0.1" value="${user.weight || ''}">
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
    // This is the same as the user's profile update, but we include volunteer fields.
    const formData = {
        firstname: document.getElementById('firstname').value,
        lastname: document.getElementById('lastname').value,
        // ... include all other common fields
    };

    // Add volunteer fields if they exist in the form
    if (document.getElementById('volunteer_type')) {
        formData.volunteer_type = document.getElementById('volunteer_type').value;
        formData.height = document.getElementById('height').value || null;
        formData.weight = document.getElementById('weight').value || null;
    }

    makeVolunteerAjaxRequest('../user/profile', 'POST', formData, (err, response) => {
        const messageDiv = document.getElementById('profileUpdateMessage');
        if (err) {
            messageDiv.innerHTML = `<div class="error-message">Error updating profile: ${err.message}</div>`;
        } else {
            messageDiv.innerHTML = `<div class="success-message">Profile updated successfully!</div>`;
        }
    });
}


/**
 * Loads the incidents assigned to the volunteer.
 */
function loadAssignedIncidentsSection() {
    contentArea.innerHTML = `<div class="content-section"><h2>My Assigned Incidents</h2><div id="incidentsContainer">Loading incidents...</div></div>`;

    makeVolunteerAjaxRequest('../volunteer/incidents', 'GET', null, (err, incidentsData) => {
        const incidentsContainer = document.getElementById('incidentsContainer');
        if (err || !incidentsData) {
            incidentsContainer.innerHTML = `<div class="error-message">Error loading incidents: ${err ? err.message : 'No data returned'}</div>`;
        } else {
            renderIncidentsTable(incidentsData, incidentsContainer);
        }
    });
}


/**
 * Renders a table of incidents.
 * @param {Array<object>} incidents - The array of incident objects.
 * @param {HTMLElement} container - The container to render the table in.
 */
function renderIncidentsTable(incidents, container) {
    if (!incidents.length) {
        container.innerHTML = '<p>You are not currently assigned to any incidents.</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>ID</th><th>Type</th><th>Description</th><th>Status</th><th>Danger</th><th>Address</th>
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
                <td>${incident.status || 'N/A'}</td>
                <td>${incident.danger || 'N/A'}</td>
                <td>${incident.address || 'N/A'}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

/**
 * Loads the messaging section for the volunteer.
 */
function loadMessagesSection() {
    contentArea.innerHTML = `<div class="content-section"><h2>Messages</h2>
        <div id="messagesContainer">Loading messages...</div>
        <div class="message-compose">
            <h3>Send New Message</h3>
            <form id="sendMessageForm">
                <div class="form-group">
                    <label for="recipient">Recipient:</label>
                    <select id="recipient" name="recipient" required>
                        <option value="admin">Admin</option>
                        <option value="volunteers">All Volunteers (on an incident)</option>
                        <option value="public">Public</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="incident_id">Incident ID (Required for volunteer messages):</label>
                    <input type="number" id="incident_id" name="incident_id" placeholder="Enter incident ID">
                </div>
                <div class="form-group">
                    <label for="message_text">Message:</label>
                    <textarea id="message_text" name="message_text" required></textarea>
                </div>
                <button type="submit" class="btn-send">Send</button>
            </form>
            <div id="sendMessageResult"></div>
        </div>
    </div>`;

    // Fetch and render messages
    makeVolunteerAjaxRequest('../volunteer/messages', 'GET', null, (err, messages) => {
        const messagesContainer = document.getElementById('messagesContainer');
        if (err) {
            messagesContainer.innerHTML = `<div class="error-message">Error loading messages: ${err.message}</div>`;
        } else {
            renderMessages(messages, messagesContainer);
        }
    });

    // Add send message listener
    document.getElementById('sendMessageForm').addEventListener('submit', event => {
        event.preventDefault();
        handleSendMessage();
    });
}

/**
 * Renders messages in the message list.
 * @param {Array<object>} messages - Array of message objects.
 * @param {HTMLElement} container - The container to render into.
 */
function renderMessages(messages, container) {
    let html = '<div class="message-list">';
    if (messages && messages.length > 0) {
        messages.forEach(message => {
            html += `
                <div class="message-item">
                    <div class="message-header">From: ${message.sender} | To: ${message.recipient} | Incident: ${message.incident_id || 'N/A'}</div>
                    <div class="message-content">${message.message}</div>
                    <div class="message-time">${message.date_time}</div>
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
 * Handles sending a message from the volunteer.
 */
function handleSendMessage() {
    const messageData = {
        recipient: document.getElementById('recipient').value,
        message_text: document.getElementById('message_text').value,
        incident_id: document.getElementById('incident_id').value,
    };

    if (!messageData.incident_id && messageData.recipient === 'volunteers') {
        const resultDiv = document.getElementById('sendMessageResult');
        resultDiv.innerHTML = `<div class="error-message">Incident ID is required to send a message to other volunteers.</div>`;
        return;
    }


    makeVolunteerAjaxRequest('../volunteer/messages', 'POST', messageData, (err, response) => {
        const resultDiv = document.getElementById('sendMessageResult');
        if (err) {
            resultDiv.innerHTML = `<div class="error-message">Error sending message: ${err.message}</div>`;
        } else {
            resultDiv.innerHTML = `<div class="success-message">Message sent successfully!</div>`;
            document.getElementById('sendMessageForm').reset();
            // Refresh messages after sending
            loadMessagesSection();
        }
    });
}


// Initialize the panel when the DOM is ready
document.addEventListener('DOMContentLoaded', initVolunteerPanel);
