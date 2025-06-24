// admin_assignments.js - Assignment management functionality

function loadAssignments() {
    makeAdminAjaxRequest('../admin/assignments', 'GET', null, (err, responseData) => {
        if (err) {
            document.getElementById('assignmentResult').innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
            return;
        }

        // Load dropdowns with the data from the server
        loadVolunteersDropdown(responseData.volunteers);
        loadIncidentsDropdown(responseData.incidents);
        loadCurrentAssignments(responseData.assignments);
    });

    // Setup form submission handler
    document.getElementById('createAssignmentForm').addEventListener('submit', event => {
        event.preventDefault();
        const volunteerUserId = document.getElementById('volunteerSelect').value;
        const incidentId = document.getElementById('incidentSelect').value;

        if (!volunteerUserId || !incidentId) {
            document.getElementById('assignmentResult').innerHTML = '<div class="error-message">Please select both volunteer and incident</div>';
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
                loadAssignments(); // Reload everything
            }
        });
    });
}

function loadVolunteersDropdown(volunteers) {
    const select = document.getElementById('volunteerSelect');
    if (!volunteers || volunteers.length === 0) {
        select.innerHTML = '<option value="">No volunteers available</option>';
        return;
    }

    select.innerHTML = '<option value="">Select Volunteer</option>' +
        buildOptions(volunteers, 'user_id', vol => `${vol.firstname} ${vol.lastname} (${vol.username})`);
}

function loadIncidentsDropdown(incidents) {
    const select = document.getElementById('incidentSelect');
    if (!incidents || incidents.length === 0) {
        select.innerHTML = '<option value="">No incidents available</option>';
        return;
    }

    // Build options showing Type, Municipality, Status instead of just ID
    select.innerHTML = '<option value="">Select Incident</option>' +
        buildOptions(incidents, 'incident_id', inc => {
            const type = inc.incident_type || 'Unknown';
            const municipality = inc.municipality || 'Unknown';
            const status = inc.status || 'Unknown';
            return `${type} - ${municipality} (${status})`;
        });
}

function loadCurrentAssignments(assignments) {
    const container = document.getElementById('assignmentsTableContainer');

    if (!assignments || assignments.length === 0) {
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
}

function removeAssignment(volunteerUserId, incidentId) {
    if (confirm('Remove this assignment?')) {
        const data = {action: 'remove', volunteer_user_id: volunteerUserId, incident_id: incidentId};
        makeAdminAjaxRequest('../admin/assignments', 'POST', data, (err, response) => {
            if (err) {
                showMessage('Error removing assignment: ' + err.message, 'error');
            } else {
                loadAssignments(); // Reload everything
                showMessage('Assignment removed!', 'success');
            }
        });
    }
}