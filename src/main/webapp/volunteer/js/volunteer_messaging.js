let allIncidentsData = [];
let assignedIncidentIds = [];

function loadMessagesSection() {
    makeVolunteerAjaxRequest('../volunteer/messages', 'GET', null, (err, responseData) => {
        const messagesContainer = document.getElementById('messagesContainer');
        if (err) {
            messagesContainer.innerHTML = `<div class="error-message">Error loading messages: ${err.message}</div>`;
        } else {
            allIncidentsData = responseData.incidents || [];
            assignedIncidentIds = responseData.assigned_incident_ids || [];

            renderVolunteerMessages(responseData.messages, responseData.incident_info || {}, messagesContainer);
            setupMessageForm();
        }
    });
}

function setupMessageForm() {
    const recipientSelect = document.getElementById('recipient');
    const incidentSelect = document.getElementById('incident_id');
    const incidentNote = document.getElementById('incident_note');

    if (recipientSelect && incidentSelect) {
        recipientSelect.addEventListener('change', function() {
            updateIncidentDropdown(this.value, incidentSelect, incidentNote);
        });
    }

    setTimeout(() => {
        const sendMessageForm = document.getElementById('sendMessageForm');
        if (sendMessageForm) {
            sendMessageForm.addEventListener('submit', handleVolunteerSendMessage);
        }
    }, 0);
}

function updateIncidentDropdown(recipient, incidentSelect, incidentNote) {
    if (!recipient) {
        incidentSelect.innerHTML = '<option value="">First select a recipient</option>';
        incidentSelect.disabled = true;
        incidentNote.textContent = '(Format: Type - Municipality (Status))';
        return;
    }

    let incidentsToShow = [];
    let noteText = '';

    if (recipient === 'volunteers') {
        incidentsToShow = allIncidentsData.filter(incident =>
            assignedIncidentIds.includes(incident.incident_id)
        );
        noteText = '(Only your assigned incidents - Format: Type - Municipality (Status))';

        if (incidentsToShow.length === 0) {
            incidentSelect.innerHTML = '<option value="">No assigned incidents found</option>';
            incidentSelect.disabled = true;
            incidentNote.textContent = noteText;
            return;
        }
    } else {
        incidentsToShow = allIncidentsData;
        noteText = '(All incidents - Format: Type - Municipality (Status))';
    }

    incidentSelect.innerHTML = '<option value="">Select an incident</option>';
    incidentsToShow.forEach(incident => {
        const type = incident.incident_type || '';
        const municipality = incident.municipality || '';
        const status = incident.status || '';

        incidentSelect.innerHTML += `<option value="${incident.incident_id}">
            ${type} - ${municipality} (${status})
        </option>`;
    });

    incidentSelect.disabled = false;
    incidentNote.textContent = noteText;
}

function renderVolunteerMessages(messages, incidentInfo, container) {
    let html = '<div class="message-list">';

    if (messages && messages.length > 0) {
        html += '<h3>Your Messages</h3>';
        html += '<div class="messages-info"><p>You can see: Public messages and volunteer messages for incidents you are assigned to. All messages are tied to specific incidents.</p></div>';

        messages.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));

        messages.forEach(message => {
            const messageType = getVolunteerMessageType(message);
            const incidentDisplay = getVolunteerIncidentDisplayString(message.incident_id, incidentInfo);

            html += `
                <div class="message-item ${messageType}">
                    <div class="message-header">
                        <span class="message-sender">From: ${message.sender}</span>
                        <span class="message-recipient">To: ${message.recipient}</span>
                        <span class="message-incident">Incident: ${incidentDisplay}</span>
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

function getVolunteerIncidentDisplayString(incidentId, incidentInfo) {
    if (!incidentId) return '';

    const info = incidentInfo[incidentId];
    if (!info) return incidentId;

    return `${info.type || ''} - ${info.municipality || ''} (${info.status || ''})`;
}

function getVolunteerMessageType(message) {
    if (message.recipient === 'public') return 'public';
    if (message.sender === 'admin') return 'from-admin';
    if (message.recipient === 'volunteers') return 'volunteer-group';
    return 'regular';
}

function getVolunteerMessageTypeLabel(messageType) {
    switch (messageType) {
        case 'public': return 'Public';
        case 'from-admin': return 'From Admin';
        case 'volunteer-group': return 'Volunteer Group';
        default: return 'Regular';
    }
}

function handleVolunteerSendMessage(event) {
    event.preventDefault();

    const recipient = document.getElementById('recipient').value;
    const messageText = document.getElementById('message_text').value;
    const incidentId = document.getElementById('incident_id').value;

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

    if (recipient === 'volunteers') {
        const selectedIncidentId = parseInt(incidentId);
        if (!assignedIncidentIds.includes(selectedIncidentId)) {
            showVolunteerMessageResult('You can only send volunteer messages for incidents you are assigned to.', 'error');
            return;
        }
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

            const incidentSelect = document.getElementById('incident_id');
            const incidentNote = document.getElementById('incident_note');
            incidentSelect.innerHTML = '<option value="">First select a recipient</option>';
            incidentSelect.disabled = true;
            incidentNote.textContent = '(Format: Type - Municipality (Status))';

            loadMessagesSection();
        }
    });
}

function showVolunteerMessageResult(message, type) {
    const resultDiv = document.getElementById('sendMessageResult');
    resultDiv.innerHTML = `<div class="${type}-message">${message}</div>`;

    setTimeout(() => {
        if (resultDiv) {
            resultDiv.innerHTML = '';
        }
    }, 5000);
}