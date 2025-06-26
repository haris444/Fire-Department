const volunteerTemplates = {
    profile: `<div class="content-section"><h2>My Profile</h2><div id="profileContainer">Loading...</div></div>`,

    incidents: `<div class="content-section">
        <h2>Incidents</h2>
        
        <div class="tab-navigation">
            <button class="tab-btn active" data-tab="available">Available Incidents</button>
            <button class="tab-btn" data-tab="assigned">My Assigned Incidents</button>
        </div>
        
        <div id="availableIncidentsTab" class="tab-content active">
            <h3>Available Incidents - Apply to Help</h3>
            <div id="availableIncidentsContainer">Loading available incidents...</div>
        </div>
        
        <div id="assignedIncidentsTab" class="tab-content">
            <h3>My Assigned Incidents</h3>
            <div id="assignedIncidentsContainer">Loading assigned incidents...</div>
        </div>
    </div>`,

    messages: `<div class="content-section">
        <h2>Messages</h2>
        <div id="messagesContainer">Loading messages...</div>
        <div class="message-compose">
            <h3>Send New Message</h3>
            <div class="message-info">
                <p><strong>Volunteer Message Rules:</strong></p>
                <ul>
                    <li><strong>To Admin/Public:</strong> You can message about any incident</li>
                    <li><strong>To Volunteers:</strong> You can only message about incidents you are assigned to</li>
                    <li>Incident ID is required for all messages</li>
                    <li>You can see: Public messages and volunteer messages for your assigned incidents</li>
                </ul>
            </div>
            <form id="sendMessageForm">
                <div class="form-group">
                    <label for="recipient">Recipient: *</label>
                    <select id="recipient" name="recipient" required>
                        <option value="">Select Recipient</option>
                        <option value="admin">Admin</option>
                        <option value="volunteers">Volunteers (assigned incidents only)</option>
                        <option value="public">Public</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="incident_id">Incident: * <span class="field-note" id="incident_note">(Format: Type - Municipality (Status))</span></label>
                    <select id="incident_id" name="incident_id" required>
                        <option value="">First select a recipient</option>
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
    </div>`
};

function buildVolunteerTable(headers, rows) {
    return `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}

function buildVolunteerRow(cells) {
    return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
}

function buildVolunteerProfileForm(user) {
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
    `;

    html += `<input type="hidden" id="lat" name="lat" value="${user.lat || ''}">`;
    html += `<input type="hidden" id="lon" name="lon" value="${user.lon || ''}">`;

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

    return html + '<button type="submit">Update Profile</button></form><div id="profileUpdateMessage"></div>';
}