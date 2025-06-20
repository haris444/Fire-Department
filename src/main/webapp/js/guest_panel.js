// Guest Panel JavaScript - Simple implementation for school assignment

// Initialize the guest panel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initGuestPanel();
});

/**
 * Initialize the guest panel functionality
 */
function initGuestPanel() {
    setupTabNavigation();
    loadActiveIncidents();
    setupIncidentForm();
}

/**
 * Setup tab navigation functionality
 */
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.dataset.tab;

            // Remove active class from all tabs and buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding tab
            this.classList.add('active');
            if (targetTab === 'view') {
                document.getElementById('viewIncidentsTab').classList.add('active');
            } else if (targetTab === 'submit') {
                document.getElementById('submitIncidentsTab').classList.add('active');
            }

            // Load incidents if switching to view tab
            if (targetTab === 'view') {
                loadActiveIncidents();
            }
        });
    });
}

/**
 * Load and display active incidents
 */
function loadActiveIncidents() {
    const container = document.getElementById('incidentsContainer');
    container.innerHTML = 'Loading incidents...';

    // Simple AJAX request to get incidents
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'guest/incident', true);

    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                const incidents = JSON.parse(xhr.responseText);
                renderIncidentsTable(incidents);
            } catch (e) {
                container.innerHTML = '<div class="error-message">Error loading incidents data</div>';
            }
        } else {
            container.innerHTML = '<div class="error-message">Unable to load incidents at this time</div>';
        }
    };

    xhr.onerror = function() {
        container.innerHTML = '<div class="error-message">Network error - please try again later</div>';
    };

    xhr.send();
}

/**
 * Render incidents in a table format
 */
function renderIncidentsTable(incidents) {
    const container = document.getElementById('incidentsContainer');

    if (!incidents || incidents.length === 0) {
        container.innerHTML = '<p class="info-text">No active incidents at this time.</p>';
        return;
    }

    // Filter for active incidents only
    const activeIncidents = incidents.filter(incident =>
        incident.status === 'running' || incident.status === 'submitted'
    );

    if (activeIncidents.length === 0) {
        container.innerHTML = '<p class="info-text">No active incidents at this time.</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Danger Level</th>
                    <th>Start Time</th>
                </tr>
            </thead>
            <tbody>
    `;

    activeIncidents.forEach(incident => {
        html += `
            <tr>
                <td>${incident.incident_type || 'N/A'}</td>
                <td>${incident.description || 'N/A'}</td>
                <td>${(incident.municipality || 'N/A') + ', ' + (incident.prefecture || 'N/A')}</td>
                <td><span class="status-badge status-${(incident.status || '').toLowerCase()}">${incident.status || 'N/A'}</span></td>
                <td><span class="danger-badge danger-${(incident.danger || '').toLowerCase()}">${incident.danger || 'Unknown'}</span></td>
                <td>${formatDateTime(incident.start_datetime)}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

/**
 * Setup the incident submission form
 */
function setupIncidentForm() {
    const form = document.getElementById('guestIncidentForm');
    const getLocationBtn = document.getElementById('getLocationBtn');

    // Get location button functionality
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', getCurrentLocation);
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', handleIncidentSubmission);
    }
}

/**
 * Get user's current location
 */
function getCurrentLocation() {
    const btn = document.getElementById('getLocationBtn');

    if (!navigator.geolocation) {
        showMessage('Geolocation is not supported by this browser.', 'warning');
        return;
    }

    btn.textContent = '📍 Getting location...';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        function(position) {
            document.getElementById('lat').value = position.coords.latitude.toFixed(6);
            document.getElementById('lon').value = position.coords.longitude.toFixed(6);
            btn.textContent = '✅ Location obtained';

            setTimeout(() => {
                btn.textContent = '📍 Get My Current Location';
                btn.disabled = false;
            }, 2000);
        },
        function(error) {
            showMessage('Unable to get your location. Please enter coordinates manually if needed.', 'warning');
            btn.textContent = '📍 Get My Current Location';
            btn.disabled = false;
        }
    );
}

/**
 * Handle incident form submission
 */
function handleIncidentSubmission(event) {
    event.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    // Collect form data
    const formData = {
        user_phone: document.getElementById('user_phone').value,
        incident_type: document.getElementById('incident_type').value,
        description: document.getElementById('description').value,
        address: document.getElementById('address').value,
        municipality: document.getElementById('municipality').value,
        prefecture: document.getElementById('prefecture').value
    };

    // Add optional coordinates if provided
    const lat = document.getElementById('lat').value;
    const lon = document.getElementById('lon').value;
    if (lat) formData.lat = parseFloat(lat);
    if (lon) formData.lon = parseFloat(lon);

    // Submit via AJAX
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'guest/incident', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Incident Report';

        try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
                showMessage('Incident submitted successfully! Emergency responders have been notified.', 'success');
                document.getElementById('guestIncidentForm').reset();
            } else {
                showMessage('Error: ' + response.message, 'error');
            }
        } catch (e) {
            showMessage('Error processing response. Please try again.', 'error');
        }
    };

    xhr.onerror = function() {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Incident Report';
        showMessage('Network error. Please try again.', 'error');
    };

    xhr.send(JSON.stringify(formData));
}

/**
 * Show a message to the user
 */
function showMessage(message, type) {
    const messageArea = document.getElementById('messageArea');
    messageArea.textContent = message;
    messageArea.className = 'message-area ' + type + '-message';
    messageArea.style.display = 'block';

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageArea.style.display = 'none';
        }, 5000);
    }
}

/**
 * Format date and time for display
 */
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return 'N/A';

    try {
        const date = new Date(dateTimeStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
        return dateTimeStr;
    }
}