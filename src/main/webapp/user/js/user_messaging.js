// user_messaging.js - Messaging functionality

// Messages Section
function loadMessagesSection() {
    makeUserAjaxRequest('../user/messages', 'GET', null, function(err, responseData) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (err) {
            messagesContainer.innerHTML = '<div class="error-message">Error loading messages: ' + err.message + '</div>';
        } else {
            renderUserMessages(responseData.messages, responseData.incident_info || {});
            populateUserIncidentsDropdown(responseData.incidents);
        }
    });

    // Remove existing event listener before adding new one
    const sendMessageForm = document.getElementById('sendMessageForm');
    if (sendMessageForm) {
        // Clone the form to remove all event listeners
        const newForm = sendMessageForm.cloneNode(true);
        sendMessageForm.parentNode.replaceChild(newForm, sendMessageForm);

        // Add single event listener to the new form
        document.getElementById('sendMessageForm').addEventListener('submit', handleUserSendMessage);
    }
}

// Extract the send message handler to a separate function
function handleUserSendMessage(event) {
    event.preventDefault();

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

    // Incident ID is now required for all messages
    if (!incidentId) {
        showUserMessageResult('Please select an incident (required for all messages).', 'error');
        return;
    }

    // Validate user can only send to admin or public
    if (recipient !== 'admin' && recipient !== 'public') {
        showUserMessageResult('Users can only send to Admin or Public.', 'error');
        return;
    }

    const messageData = {
        recipient: recipient,
        message_text: messageText.trim(),
        incident_id: parseInt(incidentId)
    };

    makeUserAjaxRequest('../user/messages', 'POST', messageData, function(err, response) {
        if (err) {
            showUserMessageResult('Error sending message: ' + err.message, 'error');
        } else {
            showUserMessageResult('Message sent successfully!', 'success');
            document.getElementById('sendMessageForm').reset();
            loadMessagesSection();
        }
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
        const type = incident.incident_type || 'Unknown';
        const municipality = incident.municipality || 'Unknown';
        const status = incident.status || 'Unknown';

        select.innerHTML += '<option value="' + incident.incident_id + '">' +
            type + ' - ' + municipality + ' (' + status + ')' +
            '</option>';
    });
}

function renderUserMessages(messages, incidentInfo) {
    const messagesContainer = document.getElementById('messagesContainer');

    let html = '<div class="message-list">';
    html += '<h3>Public Messages</h3>';
    html += '<div class="messages-info">You can see all public messages from admins, volunteers, and other users. All messages are tied to specific incidents.</div>';

    if (messages && messages.length > 0) {
        messages.sort(function(a, b) {
            return new Date(b.date_time) - new Date(a.date_time);
        });

        messages.forEach(function(message) {
            const messageType = getUserMessageType(message);
            const incidentDisplay = getIncidentDisplayString(message.incident_id, incidentInfo);

            html += '<div class="message-item ' + messageType + '">';
            html += '<div class="message-header">';
            html += '<span class="message-sender">From: ' + message.sender + '</span>';
            html += '<span class="message-recipient">To: ' + message.recipient + '</span>';
            html += '<span class="message-incident">Incident: ' + incidentDisplay + '</span>';
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

function getIncidentDisplayString(incidentId, incidentInfo) {
    if (!incidentId) return 'N/A';

    const info = incidentInfo[incidentId];
    if (!info) return 'ID: ' + incidentId;

    return info.type + ' - ' + info.municipality + ' (' + info.status + ')';
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

function showUserMessageResult(message, type) {
    const resultDiv = document.getElementById('sendMessageResult');
    resultDiv.innerHTML = '<div class="' + type + '-message">' + message + '</div>';

    setTimeout(function() {
        if (resultDiv) {
            resultDiv.innerHTML = '';
        }
    }, 5000);
}