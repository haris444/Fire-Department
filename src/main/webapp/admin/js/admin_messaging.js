let incidentsData = [];

function loadMessages() {
    makeAdminAjaxRequest('../admin/messages', 'GET', null, (err, responseData) => {
        const container = document.getElementById('messagesContainer');
        if (err) {
            container.innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
            return;
        }

        // for later use
        incidentsData = responseData.incidents || [];

        renderMessagesTable(responseData.messages, container);
        populateIncidentsForMessages(responseData.incidents);
    });

    const sendMessageForm = document.getElementById('sendMessageForm');
    if (sendMessageForm) {
        const newForm = sendMessageForm.cloneNode(true);
        sendMessageForm.parentNode.replaceChild(newForm, sendMessageForm);

        document.getElementById('sendMessageForm').addEventListener('submit', handleAdminSendMessage);
    }
}

function handleAdminSendMessage(event) {
    event.preventDefault();

    const recipient = document.getElementById('recipient').value;
    const messageText = document.getElementById('messageText').value;
    const incidentId = document.getElementById('incidentId').value;

    if (!recipient || !messageText.trim() || !incidentId) {
        showMessageResult('Please fill all required fields', 'error');
        return;
    }

    if (recipient !== 'public' && recipient !== 'volunteers') {
        showMessageResult('Admin can only send to Public or Volunteers', 'error');
        return;
    }

    const data = {
        recipient: recipient,
        message_text: messageText.trim(),
        incident_id: parseInt(incidentId)
    };

    makeAdminAjaxRequest('../admin/messages', 'POST', data, (err, response) => {
        if (err) {
            showMessageResult('Error: ' + err.message, 'error');
        } else {
            showMessageResult('Message sent!', 'success');
            document.getElementById('sendMessageForm').reset();
            loadMessages();
        }
    });
}

function renderMessagesTable(messages, container) {
    if (!messages?.length) {
        container.innerHTML = '<h3>All Messages</h3><p>No messages found.</p>';
        return;
    }

    messages.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));

    const rows = messages.map(msg => {
        const incidentInfo = getIncidentDisplayInfo(msg.incident_id);
        return buildRow([
            formatDateTime(msg.date_time),
            msg.sender,
            msg.recipient,
            escapeHtml(msg.message),
            incidentInfo,
            getMessageType(msg)
        ]);
    }).join('');

    container.innerHTML = `<h3>All Messages (${messages.length} total)</h3>` +
        '<div class="message-info">' +
        '<p><strong>Message Rules:</strong> All messages are tied to incidents. Recipients are Public, Volunteers, or Admin.</p>' +
        '</div>' +
        buildTable(['Time', 'From', 'To', 'Message', 'Incident', 'Type'], rows);
}

function populateIncidentsForMessages(incidents) {
    const select = document.getElementById('incidentId');
    if (!incidents?.length) {
        select.innerHTML = '<option value="">No incidents available</option>';
        return;
    }

    select.innerHTML = '<option value="">Select incident</option>' +
        buildOptions(incidents, 'incident_id', inc =>
            `${inc.incident_type || 'Unknown'} - ${inc.municipality || 'Unknown'} (${inc.status || 'Unknown'})`
        );
}

function getMessageType(message) {
    if (message.sender === 'admin' && message.recipient === 'public') return 'Admin → Public';
    if (message.sender === 'admin' && message.recipient === 'volunteers') return 'Admin → Volunteers';
    if (message.recipient === 'admin') return 'To Admin';
    if (message.recipient === 'public') return 'Public Message';
    if (message.recipient === 'volunteers') return 'Volunteer Message';
    return 'Other';
}

function showMessageResult(message, type) {
    const resultDiv = document.getElementById('sendMessageResult');
    resultDiv.innerHTML = `<div class="${type}-message">${message}</div>`;
    setTimeout(() => resultDiv.innerHTML = '', 5000);
}

function getIncidentDisplayInfo(incidentId) {
    if (!incidentId) return 'N/A';

    const incident = incidentsData.find(inc => inc.incident_id == incidentId);
    if (!incident) return `ID: ${incidentId}`;

    const type = incident.incident_type || 'Unknown';
    const municipality = incident.municipality || 'Unknown';
    const status = incident.status || 'Unknown';

    return `${type}<br>${municipality}<br>(${status})`;
}