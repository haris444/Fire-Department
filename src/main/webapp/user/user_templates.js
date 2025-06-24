const userTemplates = {
    profile: `<div class="content-section"><h2>My Profile</h2><div id="profileContainer">Loading...</div></div>`,

    submitIncident: `<div class="content-section"><h2>Submit New Incident</h2>
        <form id="submitIncidentForm" class="user-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="incident_type">Type:</label>
                    <select id="incident_type" required>
                        <option value="">Select Type</option>
                        <option value="fire">Fire</option>
                        <option value="crash">Accident</option>
                        <option value="accident">Medical Emergency</option>
                        <option value="rescue">Rescue</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="danger">Danger:</label>
                    <select id="danger" required>
                        <option value="">Select Level</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label for="description">Description:</label>
                <textarea id="description" required placeholder="Describe the incident..."></textarea>
            </div>
            <div class="form-group">
                <label for="address">Address:</label>
                <input type="text" id="address" required placeholder="Incident location">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="municipality">Municipality:</label>
                    <input type="text" id="municipality" required>
                </div>
                <div class="form-group">
                    <label for="prefecture">Prefecture:</label>
                    <input type="text" id="prefecture" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="lat">Latitude:</label>
                    <input type="number" id="lat" step="any" placeholder="Optional">
                </div>
                <div class="form-group">
                    <label for="lon">Longitude:</label>
                    <input type="number" id="lon" step="any" placeholder="Optional">
                </div>
            </div>
            <button type="submit">Submit Incident</button>
        </form>
        <div id="incidentSubmitMessage"></div>
    </div>`,

    viewIncidents: `<div class="content-section"><h2>View Incidents</h2><div id="incidentsContainer">Loading...</div></div>`,

    // UPDATED MSG TEMPLATE with field note about format
    messages: `<div class="content-section"><h2>Messages</h2>
        <div id="messagesContainer">Loading...</div>
        <div class="message-compose">
            <h3>Send New Message</h3>
            <div class="message-info">
                <p><strong>User Message Rules:</strong></p>
                <ul>
                    <li>You can send messages to: <strong>Admin</strong> (about specific incident) or <strong>Public</strong> (visible to all)</li>
                    <li>All messages must be tied to an incident</li>
                    <li>You can only see public messages from all users</li>
                </ul>
            </div>
            <form id="sendMessageForm">
                <div class="form-group">
                    <label for="recipient">Recipient: *</label>
                    <select id="recipient" required>
                        <option value="">Select Recipient</option>
                        <option value="admin">Admin (About Incident)</option>
                        <option value="public">Public (All Users)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="incident_id">Incident: * <span class="field-note">(Format: Type - Municipality (Status))</span></label>
                    <select id="incident_id" required><option value="">Loading...</option></select>
                </div>
                <div class="form-group">
                    <label for="message_text">Message: *</label>
                    <textarea id="message_text" required placeholder="Type your message..."></textarea>
                </div>
                <button type="submit" class="btn-send">Send Message</button>
            </form>
            <div id="sendMessageResult"></div>
        </div>
    </div>`
};

// Profile form builder and utility functions
function buildProfileForm(user) {
    const isVol = user.user_type === 'volunteer';
    let h = '<form id="userProfileForm" class="user-form"><h3>Profile Information</h3>';

    // Read-only fields
    h += `<div class="form-row">
        <div class="form-group"><label>Username:</label><input type="text" value="${user.username || ''}" readonly></div>
        <div class="form-group"><label>Email:</label><input type="email" value="${user.email || ''}" readonly></div>
    </div>`;
    h += `<div class="form-group"><label>Type:</label><input type="text" value="${user.user_type || 'user'}" readonly></div>`;

    // Editable fields
    h += `<div class="form-row">
        <div class="form-group"><label for="firstname">First Name:</label><input type="text" id="firstname" value="${user.firstname || ''}" required></div>
        <div class="form-group"><label for="lastname">Last Name:</label><input type="text" id="lastname" value="${user.lastname || ''}" required></div>
    </div>`;
    h += `<div class="form-row">
        <div class="form-group"><label for="birthdate">Birth Date:</label><input type="date" id="birthdate" value="${user.birthdate || ''}" required></div>
        <div class="form-group"><label for="gender">Gender:</label><select id="gender" required>
            <option value="Male"${user.gender === 'Male' ? ' selected' : ''}>Male</option>
            <option value="Female"${user.gender === 'Female' ? ' selected' : ''}>Female</option>
            <option value="Other"${user.gender === 'Other' ? ' selected' : ''}>Other</option>
        </select></div>
    </div>`;
    h += `<div class="form-row">
        <div class="form-group"><label for="afm">AFM:</label><input type="text" id="afm" value="${user.afm || ''}" required></div>
        <div class="form-group"><label for="country">Country:</label><input type="text" id="country" value="${user.country || ''}" required></div>
    </div>`;
    h += `<div class="form-group"><label for="address">Address:</label><input type="text" id="address" value="${user.address || ''}" required></div>`;
    h += `<div class="form-row">
        <div class="form-group"><label for="municipality">Municipality:</label><input type="text" id="municipality" value="${user.municipality || ''}" required></div>
        <div class="form-group"><label for="prefecture">Prefecture:</label><input type="text" id="prefecture" value="${user.prefecture || ''}" required></div>
    </div>`;
    h += `<div class="form-row">
        <div class="form-group"><label for="job">Job:</label><input type="text" id="job" value="${user.job || ''}" required></div>
        <div class="form-group"><label for="telephone">Phone:</label><input type="tel" id="telephone" value="${user.telephone || ''}" required></div>
    </div>`;
    h += `<div class="form-row">
        <div class="form-group"><label for="lat">Latitude:</label><input type="number" id="lat" value="${user.lat || ''}" step="any"></div>
        <div class="form-group"><label for="lon">Longitude:</label><input type="number" id="lon" value="${user.lon || ''}" step="any"></div>
    </div>`;

    // Volunteer fields
    if (isVol) {
        h += '<h3>Volunteer Info</h3>';
        h += `<div class="form-row">
            <div class="form-group"><label for="volunteer_type">Type:</label><select id="volunteer_type">
                <option value="">Select</option>
                <option value="simple"${user.volunteer_type === 'simple' ? ' selected' : ''}>Simple</option>
                <option value="driver"${user.volunteer_type === 'driver' ? ' selected' : ''}>Driver</option>
            </select></div>
        </div>`;
        h += `<div class="form-row">
            <div class="form-group"><label for="height">Height (m):</label><input type="number" id="height" value="${user.height || ''}" step="0.01"></div>
            <div class="form-group"><label for="weight">Weight (kg):</label><input type="number" id="weight" value="${user.weight || ''}" step="0.1"></div>
        </div>`;
    }

    return h + '<button type="submit">Update Profile</button></form><div id="profileUpdateMessage"></div>';
}

// Utility functions
function buildUserTable(headers, rows) {
    return `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}

function buildUserRow(cells) {
    return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
}