// admin_assignments.js - Assignment management functionality

function loadAssignments() {
    loadVolunteersDropdown();
    loadIncidentsDropdown();
    loadCurrentAssignments();

    document.getElementById('createAssignmentForm').addEventListener('submit', event => {
        event.preventDefault();
        const volunteerUserId = document.getElementById('volunteerSelect').value;
        const incidentId = document.getElementById('incidentSelect').value;

        if (!volunteerUserId || !incidentId) {
            document.getElementById('assignmentResult').innerHTML = '<div class="error-message">Please select both</div>';
            return;
        }

        const data = {
            action: 'assign',
            volunteer_user_id: parseInt(volunteerUserId),
            incident_id: parseInt(incidentId)
        };

        makeAdminAjaxRequest('../admin/assignments', 'POST', data, (err, response) => {
            const resultDiv = document.getElementById('assignmentResult');
            if (err) {
                resultDiv.innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
            } else {
                resultDiv.innerHTML = '<div class="success-message">Assignment created!</div>';
                document.getElementById('createAssignmentForm').reset();
                loadCurrentAssignments();
            }
        });
    });
}

function loadVolunteersDropdown() {
    makeAdminAjaxRequest('../admin/volunteers', 'GET', null, (err, volunteers) => {
        const select = document.getElementById('volunteerSelect');
        if (err) {
            select.innerHTML = '<option value="">Error loading</option>';
        } else {
            select.innerHTML = '<option value="">Select Volunteer</option>' +
                buildOptions(volunteers, 'user_id', vol => `${vol.firstname} ${vol.lastname} (${vol.username})`);
        }
    });
}

function loadIncidentsDropdown() {
    makeAdminAjaxRequest('../admin/incidents', 'GET', null, (err, incidents) => {
        const select = document.getElementById('incidentSelect');
        if (err) {
            select.innerHTML = '<option value="">Error loading</option>';
        } else {
            select.innerHTML = '<option value="">Select Incident</option>' +
                buildOptions(incidents, 'incident_id', inc => `ID: ${inc.incident_id} - ${inc.incident_type} (${inc.status})`);
        }
    });
}

function loadCurrentAssignments() {
    makeAdminAjaxRequest('../admin/assignments', 'GET', null, (err, assignments) => {
        const container = document.getElementById('assignmentsTableContainer');
        if (err) {
            container.innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
            return;
        }

        if (!assignments || !assignments.length) {
            container.innerHTML = '<h3>Current Assignments</h3><p>No assignments found.</p>';
            return;
        }

        const rows = assignments.map(assignment =>
            buildRow([
                assignment.volunteer_name,
                assignment.incident_description,
                assignment.assignment_date || 'N/A',
                `<button class="btn-small btn-delete" onclick="removeAssignment(${assignment.volunteer_user_id}, ${assignment.incident_id})">Remove</button>`
            ])
        ).join('');

        container.innerHTML = '<h3>Current Assignments</h3>' +
            buildTable(['Volunteer', 'Incident', 'Date', 'Actions'], rows);
    });
}

function removeAssignment(volunteerUserId, incidentId) {
    if (confirm('Remove this assignment?')) {
        const data = {action: 'remove', volunteer_user_id: volunteerUserId, incident_id: incidentId};
        makeAdminAjaxRequest('../admin/assignments', 'POST', data, (err, response) => {
            if (err) {
                showMessage('Error removing assignment: ' + err.message, 'error');
            } else {
                loadCurrentAssignments();
                showMessage('Assignment removed!', 'success');
            }
        });
    }
}