function loadDashboard() {
    makeAdminAjaxRequest('../admin/statistics', 'GET', null, (err, stats) => {
        const container = document.getElementById('statsContainer');
        if (err) {
            container.innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
            return;
        }

        const totalPeople = (stats.userCount || 0) + (stats.volunteerCount || 0);
        const totalIncidents = stats.incidentsByType ? stats.incidentsByType.reduce((sum, item) => sum + item.count, 0) : 0;

        //incidents table
        let incidentsTable = '';
        if (stats.incidentsByType?.length) {
            const rows = stats.incidentsByType.map(item => buildRow([item.type, item.count])).join('');
            incidentsTable = buildTable(['Type', 'Count'], rows + buildRow(['TOTAL', totalIncidents]));
        } else {
            incidentsTable = '<p>No incidents found.</p>';
        }

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div>
                    <h3>Overview</h3>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <div><strong>Total Users:</strong> ${stats.userCount || 0}</div>
                        <div><strong>Total Volunteers:</strong> ${stats.volunteerCount || 0}</div>
                        <div><strong>Total People:</strong> ${totalPeople}</div>
                        <div><strong>Total Vehicles:</strong> ${stats.totalVehicleCount || 0} (4 firemen per vehicle)</div>
                    </div>
                </div>
                <div>
                    <h3>Incidents by Type</h3>
                    ${incidentsTable}
                </div>
            </div>`;
    });
}