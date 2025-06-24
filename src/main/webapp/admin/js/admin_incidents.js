// admin_incidents.js - Incidents management functionality

function loadIncidents() {
    makeAdminAjaxRequest('../admin/incidents', 'GET', null, (err, incidents) => {
        const container = document.getElementById('incidentsTableContainer');
        if (err) {
            container.innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
            return;
        }

        const rows = incidents.map(incident =>
            buildRow([
                incident.incident_id,
                incident.incident_type,
                incident.description,
                incident.status,
                incident.danger,
                incident.vehicles || 0,
                `<button class="btn-small btn-edit edit-incident-btn" data-incident-id="${incident.incident_id}">Edit</button>`
            ])
        ).join('');

        container.innerHTML = buildTable(['ID', 'Type', 'Description', 'Status', 'Danger', 'Vehicles', 'Actions'], rows);

        // Add edit listeners
        document.querySelectorAll('.edit-incident-btn').forEach(btn => {
            btn.addEventListener('click', () => showEditModal(btn.dataset.incidentId));
        });
    });
}

function showEditModal(incidentId) {
    // First get the current incident data
    makeAdminAjaxRequest('../admin/incidents', 'GET', null, (err, incidents) => {
        if (err) {
            alert('Error loading incident data: ' + err.message);
            return;
        }

        const incident = incidents.find(inc => inc.incident_id == incidentId);
        if (!incident) {
            alert('Incident not found');
            return;
        }

        const modal = `
            <div id="editModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                <div class="admin-form" style="width: 500px; max-width: 90%;">
                    <h2>Edit Incident</h2>
                    <form id="editForm">
                        <div class="form-group">
                            <label>Type:</label>
                            <select id="editType" required>
                                <option value="fire">Fire</option>
                                <option value="crash">Accident</option>
                                <option value="accident">Medical Emergency</option>
                                <option value="rescue">Rescue</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Description:</label>
                            <textarea id="editDescription" required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Status:</label>
                            <select id="editStatus" required>
                                <option value="In Progress">In Progress</option>
                                <option value="Running">Running</option>
                                <option value="Submitted">Submitted</option>
                                <option value="Finished">Finished</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Danger:</label>
                            <select id="editDanger" required>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Unknown">Unknown</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Vehicles Engaged:</label>
                            <input type="number" id="editVehicles" min="0" step="1" value="${incident.vehicles || 0}">
                        </div>
                        <button type="submit">Update</button>
                        <button type="button" onclick="document.getElementById('editModal').remove()">Cancel</button>
                    </form>
                </div>
            </div>`;

        document.body.insertAdjacentHTML('beforeend', modal);

        // Pre-fill the form with current values
        document.getElementById('editType').value = incident.incident_type;
        document.getElementById('editDescription').value = incident.description;
        document.getElementById('editStatus').value = incident.status;
        document.getElementById('editDanger').value = incident.danger;

        document.getElementById('editForm').addEventListener('submit', event => {
            event.preventDefault();
            const data = {
                incident_id: incidentId,
                incident_type: document.getElementById('editType').value,
                description: document.getElementById('editDescription').value,
                status: document.getElementById('editStatus').value,
                danger: document.getElementById('editDanger').value,
                vehicles: parseInt(document.getElementById('editVehicles').value) || 0
            };

            makeAdminAjaxRequest('../admin/incidents', 'POST', data, (err, response) => {
                if (err) {
                    alert('Error: ' + err.message);
                } else {
                    document.getElementById('editModal').remove();
                    loadIncidents();
                    showMessage('Incident updated successfully!', 'success');
                }
            });
        });
    });
}