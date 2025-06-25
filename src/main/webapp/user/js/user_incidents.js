// user_incidents.js - Incident management functionality

// Submit Incident Section
function loadSubmitIncidentSection() {
    // Add event listeners to clear validation errors when address fields change
    setTimeout(function() {
        const addressFields = ['country', 'municipality', 'address', 'region'];
        addressFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', function() {
                    // Clear validation errors when user starts typing
                    clearIncidentValidationErrors();
                    // Hide any previous location feedback
                    const locationFeedback = document.getElementById('locfeedback');
                    if (locationFeedback) {
                        locationFeedback.style.display = 'none';
                    }
                });
            }
        });

        document.getElementById('submitIncidentForm').addEventListener('submit', function(event) {
            event.preventDefault();
            handleIncidentSubmission();
        });
    }, 100);
}

function handleIncidentSubmission() {
    // First validate the location
    validateIncidentLocation()
        .then(function(coords) {
            // If validation successful, submit the incident
            submitIncidentWithCoords(coords);
        })
        .catch(function(error) {
            const messageDiv = document.getElementById('incidentSubmitMessage');
            messageDiv.innerHTML = '<div class="error-message">' + error.message + '</div>';
        });
}

/**
 * Validates the incident location using the geocoding API
 * @returns {Promise} Promise that resolves with coordinates if valid
 */
function validateIncidentLocation() {
    return new Promise(function(resolve, reject) {
        const countryName = document.getElementById('country').value.trim();
        const municipalityName = document.getElementById('municipality').value.trim();
        const addressName = document.getElementById('address').value.trim();
        const regionName = document.getElementById('region').value.trim();

        // Check if required fields are filled
        if (!countryName || !municipalityName || !addressName || !regionName) {
            reject(new Error('Please fill in all location fields (Country, Municipality, Address, Region)'));
            return;
        }

        // Clear any existing validation errors before starting new validation
        clearIncidentValidationErrors();

        // Show loading message
        const locationFeedback = document.getElementById('locfeedback');
        locationFeedback.style.display = 'block';
        locationFeedback.innerHTML = '<span style="color: blue;">🔄 Validating location...</span>';

        // Create the search address - prioritize region for better geocoding
        const address = `${addressName}, ${municipalityName}, ${regionName}, ${countryName}`;

        // Create XMLHttpRequest for geocoding
        const xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === this.DONE) {
                try {
                    const response = JSON.parse(xhr.responseText);

                    // Check if we got results
                    if (response.length > 0 && countryName === "Greece") {
                        const location = response[0];
                        const displayName = location.display_name;

                        // Check if the location matches the specified region (case-insensitive)
                        if (displayName.toLowerCase().includes(regionName.toLowerCase())) {
                            const lat = parseFloat(location.lat);
                            const lon = parseFloat(location.lon);

                            // Success - location found and valid
                            locationFeedback.innerHTML = `<span style="color: green;">✅ Location validated successfully in ${regionName}.</span>`;

                            resolve({ lat: lat, lon: lon });
                        } else {
                            // Location not in specified region
                            locationFeedback.innerHTML = `<span style="color: red;">❌ Address not found in ${regionName}. Please check your region.</span>`;
                            setIncidentValidationErrors(`This location is not in ${regionName}.`);
                            reject(new Error(`Address not found in ${regionName}. Please check your region.`));
                        }
                    } else if (response.length > 0 && countryName !== "Greece") {
                        // Not in Greece
                        locationFeedback.innerHTML = '<span style="color: red;">❌ This application is available only in Greece.</span>';
                        setIncidentValidationErrors("This application is available only in Greece.");
                        reject(new Error('This application is available only in Greece.'));
                    } else {
                        // Location not found
                        locationFeedback.innerHTML = '<span style="color: red;">❌ Address not found. Please check your address details.</span>';
                        setIncidentValidationErrors("This address could not be found.");
                        reject(new Error('Address not found. Please check your address details.'));
                    }
                } catch (e) {
                    locationFeedback.innerHTML = '<span style="color: red;">❌ Error validating location.</span>';
                    setIncidentValidationErrors("Error validating location.");
                    reject(new Error('Error validating location: ' + e.message));
                }
            }
        });

        xhr.onerror = function() {
            locationFeedback.innerHTML = '<span style="color: red;">❌ Network error during validation.</span>';
            setIncidentValidationErrors("Network error during validation.");
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
    const incidentData = {
        incident_type: document.getElementById('incident_type').value,
        description: document.getElementById('description').value,
        address: document.getElementById('address').value,
        municipality: document.getElementById('municipality').value,
        region: document.getElementById('region').value,
        danger: document.getElementById('danger').value,
        lat: coords.lat,
        lon: coords.lon
    };

    makeUserAjaxRequest('../user/incidents', 'POST', incidentData, function(err, response) {
        const messageDiv = document.getElementById('incidentSubmitMessage');
        if (err) {
            messageDiv.innerHTML = '<div class="error-message">Error submitting incident: ' + err.message + '</div>';
        } else {
            messageDiv.innerHTML = '<div class="success-message">Incident submitted successfully!</div>';
            document.getElementById('submitIncidentForm').reset();
            document.getElementById('country').value = 'Greece'; // Reset country to Greece
            document.getElementById('locfeedback').style.display = 'none';
        }
    });
}

/**
 * Sets validation errors on incident form fields
 */
function setIncidentValidationErrors(message) {
    const municipalityField = document.getElementById('municipality');
    const addressField = document.getElementById('address');
    const countryField = document.getElementById('country');
    const regionField = document.getElementById('region');

    if (municipalityField) municipalityField.setCustomValidity(message);
    if (addressField) addressField.setCustomValidity(message);
    if (countryField) countryField.setCustomValidity(message);
    if (regionField) regionField.setCustomValidity(message);
}

/**
 * Clears validation errors from incident form fields
 */
function clearIncidentValidationErrors() {
    const municipalityField = document.getElementById('municipality');
    const addressField = document.getElementById('address');
    const countryField = document.getElementById('country');
    const regionField = document.getElementById('region');

    if (municipalityField) municipalityField.setCustomValidity('');
    if (addressField) addressField.setCustomValidity('');
    if (countryField) countryField.setCustomValidity('');
    if (regionField) regionField.setCustomValidity('');
}

// View Incidents Section
function loadViewIncidentsSection() {
    makeUserAjaxRequest('../user/incidents', 'GET', null, function(err, incidentsData) {
        const incidentsContainer = document.getElementById('incidentsContainer');
        if (err) {
            incidentsContainer.innerHTML = '<div class="error-message">Error loading incidents: ' + err.message + '</div>';
        } else {
            renderIncidentsTable(incidentsData);
        }
    });
}

function renderIncidentsTable(incidents) {
    const incidentsContainer = document.getElementById('incidentsContainer');

    if (!incidents || incidents.length === 0) {
        incidentsContainer.innerHTML = '<p>No incidents found.</p>';
        return;
    }

    const rows = incidents.map(incident =>
        buildUserRow([
            incident.incident_id,
            incident.incident_type || 'N/A',
            incident.description || 'N/A',
            incident.status || 'N/A',
            incident.danger || 'N/A',
            incident.start_datetime || 'N/A',
            incident.address || 'N/A'
        ])
    ).join('');

    const headers = ['ID', 'Type', 'Description', 'Status', 'Danger', 'Start Time', 'Address'];
    incidentsContainer.innerHTML = buildUserTable(headers, rows);
}