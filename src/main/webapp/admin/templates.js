const templates = {
    dashboard: `<div class="content-section"><h2>Dashboard & Statistics</h2><div id="statsContainer">Loading...</div></div>`,

    incidents: `<div class="content-section"><h2>Manage Incidents</h2><div id="incidentsTableContainer">Loading...</div></div>`,

    users: `<div class="content-section"><h2>Manage Users</h2><div id="usersTableContainer">Loading...</div></div>`,

    assignments: `<div class="content-section">
        <h2>Manage Volunteer Assignments</h2>
        <div class="admin-form">
            <h3>Assign Volunteer to Incident</h3>
            <form id="createAssignmentForm">
                <div class="form-group">
                    <label for="volunteerSelect">Volunteer:</label>
                    <select id="volunteerSelect" required><option value="">Loading...</option></select>
                </div>
                <div class="form-group">
                    <label for="incidentSelect">Incident:</label>
                    <select id="incidentSelect" required><option value="">Loading...</option></select>
                </div>
                <button type="submit">Assign Volunteer</button>
            </form>
            <div id="assignmentResult"></div>
        </div>
        <div id="assignmentsTableContainer">Loading...</div>
    </div>`,

    messages: `<div class="content-section">
        <h2>Messages Management</h2>
        <div id="messagesContainer">Loading...</div>
        <div class="admin-form">
            <h3>Send New Message</h3>
            <div class="message-info">
                <p><strong>Admin Message Rules:</strong></p>
                <ul>
                    <li>You can send messages to: <strong>Public</strong> (all users) or <strong>Volunteers</strong> (for specific incident)</li>
                    <li>All messages must be tied to an incident</li>
                    <li>Public messages are visible to all users</li>
                    <li>Volunteer messages are only visible to volunteers assigned to that incident</li>
                </ul>
            </div>
            <form id="sendMessageForm">
                <div class="form-group">
                    <label for="recipient">Recipient: *</label>
                    <select id="recipient" required>
                        <option value="">Select Recipient</option>
                        <option value="public">Public (All Users)</option>
                        <option value="volunteers">Volunteers (Specific Incident)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="incidentId">Incident: * <span class="field-note">(Format: Type - Municipality (Status))</span></label>
                    <select id="incidentId" required><option value="">Loading...</option></select>
                </div>
                <div class="form-group">
                    <label for="messageText">Message: *</label>
                    <textarea id="messageText" required rows="4" placeholder="Type your message..."></textarea>
                </div>
                <button type="submit">Send Message</button>
            </form>
            <div id="sendMessageResult"></div>
        </div>
    </div>`
};

// Table builders
function buildTable(headers, rows) {
    return `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}

function buildRow(cells) {
    return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
}

function buildOptions(items, valueKey, textFunction) {
    if (typeof textFunction === 'function') {
        return items.map(item => `<option value="${item[valueKey]}">${textFunction(item)}</option>`).join('');
    } else {
        // Fallback for backwards compatibility
        return items.map(item => `<option value="${item[valueKey]}">${item[textFunction]}</option>`).join('');
    }
}