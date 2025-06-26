function loadIncidentsSection() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    loadAvailableIncidents();
    loadAssignedIncidents();
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}IncidentsTab`).classList.add('active');
}

function loadAvailableIncidents() {
    makeVolunteerAjaxRequest('../volunteer/incidents?type=all', 'GET', null, (err, incidentsData) => {
        const container = document.getElementById('availableIncidentsContainer');
        if (err || !incidentsData) {
            container.innerHTML = `<div class="error-message">Error loading incidents: ${err ? err.message : 'No data returned'}</div>`;
        } else {
            renderAvailableIncidentsTable(incidentsData, container);
        }
    });
}

function loadAssignedIncidents() {
    makeVolunteerAjaxRequest('../volunteer/incidents?type=assigned', 'GET', null, (err, incidentsData) => {
        const container = document.getElementById('assignedIncidentsContainer');
        if (err || !incidentsData) {
            container.innerHTML = `<div class="error-message">Error loading assigned incidents: ${err ? err.message : 'No data returned'}</div>`;
        } else {
            renderAssignedIncidentsTable(incidentsData, container);
        }
    });
}

function renderAvailableIncidentsTable(incidents, container) {
    if (!incidents.length) {
        container.innerHTML = '<p>No incidents available at this time.</p>';
        return;
    }

    const rows = incidents.map(incident =>
        buildVolunteerRow([
            incident.incident_id,
            incident.incident_type || 'N/A',
            incident.description || 'N/A',
            `<span class="status-badge status-${(incident.status || '').toLowerCase()}">${incident.status || 'N/A'}</span>`,
            `<span class="danger-badge danger-${(incident.danger || '').toLowerCase()}">${incident.danger || 'N/A'}</span>`,
            `${incident.municipality || 'N/A'}, ${incident.prefecture || 'N/A'}`,
            incident.start_datetime || 'N/A',
            `<button class="btn-small btn-apply" onclick="applyToIncident(${incident.incident_id})">Apply to Help</button>`
        ])
    ).join('');

    const headers = ['ID', 'Type', 'Description', 'Status', 'Danger', 'Location', 'Start Time', 'Actions'];
    container.innerHTML = buildVolunteerTable(headers, rows);
}

function renderAssignedIncidentsTable(incidents, container) {
    if (!incidents.length) {
        container.innerHTML = '<p>You are not currently assigned to any incidents.</p>';
        return;
    }

    const rows = incidents.map(incident =>
        buildVolunteerRow([
            incident.incident_id,
            incident.incident_type || 'N/A',
            incident.description || 'N/A',
            `<span class="status-badge status-${(incident.status || '').toLowerCase()}">${incident.status || 'N/A'}</span>`,
            `<span class="danger-badge danger-${(incident.danger || '').toLowerCase()}">${incident.danger || 'N/A'}</span>`,
            `${incident.municipality || 'N/A'}, ${incident.prefecture || 'N/A'}`,
            incident.start_datetime || 'N/A',
            `<button class="btn-small btn-leave" onclick="leaveIncident(${incident.incident_id})">Leave Assignment</button>`
        ])
    ).join('');

    const headers = ['ID', 'Type', 'Description', 'Status', 'Danger', 'Location', 'Start Time', 'Actions'];
    container.innerHTML = buildVolunteerTable(headers, rows);
}

function applyToIncident(incidentId) {
    if (!confirm('Are you sure you want to apply to help with this incident?')) {
        return;
    }

    const requestData = {
        action: 'apply',
        incident_id: incidentId
    };

    makeVolunteerAjaxRequest('../volunteer/incidents', 'POST', requestData, (err, response) => {
        if (err) {
            showMessage('Error applying to incident: ' + err.message, 'error');
        } else {
            showMessage('Successfully applied to incident! Admin will review your application.', 'success');
            loadAssignedIncidents();
        }
    });
}

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
            loadAvailableIncidents();
            loadAssignedIncidents();
        }
    });
}