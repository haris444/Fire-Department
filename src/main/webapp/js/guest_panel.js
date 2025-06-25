// Guest Panel JavaScript - Updated with location validation

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

    if (form) {
        // Add event listeners to clear validation errors when address fields change
        const addressFields = ['country', 'municipality', 'address'];
        addressFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', function() {
                    // Clear validation errors when user starts typing
                    clearValidationErrors();
                    // Hide any previous location feedback
                    const locationFeedback = document.getElementById('locfeedback');
                    if (locationFeedback) {
                        locationFeedback.style.display = 'none';
                    }
                });
            }
        });

        // Form submission
        form.addEventListener('submit', handleIncidentSubmission);
    }
}

/**
 * Handle incident form submission with location validation
 */
function handleIncidentSubmission(event) {
    event.preventDefault();

    // First validate the location
    validateLocation()
        .then(function(coords) {
            // If validation successful, submit the incident
            submitIncidentWithCoords(coords);
        })
        .catch(function(error) {
            showMessage(error.message, 'error');
        });
}

/**
 * Validates the location using the geocoding API
 * @returns {Promise} Promise that resolves with coordinates if valid
 */
function validateLocation() {
    return new Promise(function(resolve, reject) {
        const countryName = document.getElementById('country').value;
        const municipalityName = document.getElementById('municipality').value;
        const addressName = document.getElementById('address').value;

        // Check if required fields are filled
        if (!countryName || !municipalityName || !addressName) {
            reject(new Error('Please fill in all location fields'));
            return;
        }

        // Clear any existing validation errors before starting new validation
        clearValidationErrors();

        // Show loading message
        const locationFeedback = document.getElementById('locfeedback');
        locationFeedback.style.display = 'block';
        locationFeedback.innerHTML = '<span style="color: blue;">🔄 Validating location...</span>';

        // Create the search address
        const address = `${countryName} ${municipalityName} ${addressName}`;

        // Create XMLHttpRequest for geocoding - FIXED: Remove withCredentials
        const xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === this.DONE) {
                try {
                    const response = JSON.parse(xhr.responseText);

                    // Check if we got results
                    if (response.length > 0 && countryName === "Greece" && municipalityName && addressName) {
                        const location = response[0];
                        const displayName = location.display_name;

                        // Check if the location is in Crete
                        if (displayName.includes("Crete")) {
                            const lat = parseFloat(location.lat);
                            const lon = parseFloat(location.lon);

                            // Success - location found and valid
                            locationFeedback.innerHTML = '<span style="color: green;">✅ Location validated successfully.</span>';

                            resolve({ lat: lat, lon: lon });
                        } else {
                            // Location not in Crete
                            locationFeedback.innerHTML = '<span style="color: red;">❌ The service is available only in Crete.</span>';
                            setValidationErrors("This location is not in Crete.");
                            reject(new Error('The service is available only in Crete.'));
                        }
                    } else if (response.length > 0 && countryName !== "Greece") {
                        // Not in Greece
                        locationFeedback.innerHTML = '<span style="color: red;">❌ The application is available only in Greece.</span>';
                        setValidationErrors("The application is available only in Greece.");
                        reject(new Error('The application is available only in Greece.'));
                    } else {
                        // Location not found
                        locationFeedback.innerHTML = '<span style="color: red;">❌ Location not found. Please check your address.</span>';
                        setValidationErrors("This location could not be found.");
                        reject(new Error('Location not found. Please check your address.'));
                    }
                } catch (e) {
                    locationFeedback.innerHTML = '<span style="color: red;">❌ Error validating location.</span>';
                    setValidationErrors("Error validating location.");
                    reject(new Error('Error validating location: ' + e.message));
                }
            }
        });

        xhr.onerror = function() {
            locationFeedback.innerHTML = '<span style="color: red;">❌ Network error during validation.</span>';
            setValidationErrors("Network error during validation.");
            reject(new Error('Network error during location validation.'));
        };

        // Configure and send the geocoding request
        xhr.open("GET", "https://forward-reverse-geocoding.p.rapidapi.com/v1/search?q=" +
            encodeURIComponent(address) + "&accept-language=en&polygon_threshold=0.0");

        xhr.setRequestHeader("x-rapidapi-host", "forward-reverse-geocoding.p.rapidapi.com");
        xhr.setRequestHeader("x-rapidapi-key", "2137d13aedmsh3be9797ef5d78f4p12abd7jsn2946b41ea9a6");

        xhr.send();
    });
}

/**
 * Submits the incident with validated coordinates
 */
function submitIncidentWithCoords(coords) {
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
        prefecture: document.getElementById('prefecture').value,
        lat: coords.lat,
        lon: coords.lon
    };

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
                document.getElementById('country').value = 'Greece'; // Reset country to Greece
                document.getElementById('locfeedback').style.display = 'none';
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
 * Sets validation errors on form fields
 */
function setValidationErrors(message) {
    const municipalityField = document.getElementById('municipality');
    const addressField = document.getElementById('address');
    const countryField = document.getElementById('country');

    if (municipalityField) municipalityField.setCustomValidity(message);
    if (addressField) addressField.setCustomValidity(message);
    if (countryField) countryField.setCustomValidity(message);
}

/**
 * Clears validation errors from form fields
 */
function clearValidationErrors() {
    const municipalityField = document.getElementById('municipality');
    const addressField = document.getElementById('address');
    const countryField = document.getElementById('country');

    if (municipalityField) municipalityField.setCustomValidity('');
    if (addressField) addressField.setCustomValidity('');
    if (countryField) countryField.setCustomValidity('');
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