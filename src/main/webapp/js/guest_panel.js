
document.addEventListener('DOMContentLoaded', function() {
    initGuestPanel();
});


function initGuestPanel() {
    setupTabNavigation();
    loadActiveIncidents();
    setupIncidentForm();
}


function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            this.classList.add('active');
            if (targetTab === 'view') {
                document.getElementById('viewIncidentsTab').classList.add('active');
            } else if (targetTab === 'submit') {
                document.getElementById('submitIncidentsTab').classList.add('active');
            }

            if (targetTab === 'view') {
                loadActiveIncidents();
            }
        });
    });
}


function loadActiveIncidents() {
    const container = document.getElementById('incidentsContainer');
    container.innerHTML = 'Loading incidents...';

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


function renderIncidentsTable(incidents) {
    const container = document.getElementById('incidentsContainer');

    if (!incidents || incidents.length === 0) {
        container.innerHTML = '<p class="info-text">No active incidents at this time.</p>';
        return;
    }

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


function setupIncidentForm() {
    const form = document.getElementById('guestIncidentForm');

    if (form) {
        const addressFields = ['country', 'municipality', 'address', 'region'];
        addressFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', function() {
                    clearValidationErrors();
                    const locationFeedback = document.getElementById('locfeedback');
                    if (locationFeedback) {
                        locationFeedback.style.display = 'none';
                    }
                });
            }
        });

        form.addEventListener('submit', handleIncidentSubmission);
    }
}


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


function validateLocation() {
    return new Promise(function(resolve, reject) {
        const countryName = document.getElementById('country').value.trim();
        const municipalityName = document.getElementById('municipality').value.trim();
        const addressName = document.getElementById('address').value.trim();
        const regionName = document.getElementById('region').value.trim();

        if (!countryName || !municipalityName || !addressName || !regionName) {
            reject(new Error('Please fill in all location fields (Country, Municipality, Address, Region)'));
            return;
        }

        clearValidationErrors();

        const locationFeedback = document.getElementById('locfeedback');
        locationFeedback.style.display = 'block';
        locationFeedback.innerHTML = '<span style="color: blue;">🔄 Validating location...</span>';

        const address = `${addressName}, ${municipalityName}, ${regionName}, ${countryName}`;

        const xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === this.DONE) {
                try {
                    const response = JSON.parse(xhr.responseText);


                    if (response.length > 0 && countryName === "Greece") {
                        const location = response[0];
                        const displayName = location.display_name;


                        if (displayName.toLowerCase().includes(regionName.toLowerCase())) {
                            const lat = parseFloat(location.lat);
                            const lon = parseFloat(location.lon);


                            locationFeedback.innerHTML = `<span style="color: green;">✅ Location validated successfully in ${regionName}.</span>`;

                            resolve({ lat: lat, lon: lon });
                        } else {

                            locationFeedback.innerHTML = `<span style="color: red;">❌ Address not found in ${regionName}. Please check your region.</span>`;
                            setValidationErrors(`This location is not in ${regionName}.`);
                            reject(new Error(`Address not found in ${regionName}. Please check your region.`));
                        }
                    } else if (response.length > 0 && countryName !== "Greece") {

                        locationFeedback.innerHTML = '<span style="color: red;">❌ This application is available only in Greece.</span>';
                        setValidationErrors("This application is available only in Greece.");
                        reject(new Error('This application is available only in Greece.'));
                    } else {

                        locationFeedback.innerHTML = '<span style="color: red;">❌ Address not found. Please check your address details.</span>';
                        setValidationErrors("This address could not be found.");
                        reject(new Error('Address not found. Please check your address details.'));
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


        xhr.open("GET", "https://forward-reverse-geocoding.p.rapidapi.com/v1/search?q=" +
            encodeURIComponent(address) + "&accept-language=en&polygon_threshold=0.0");

        xhr.setRequestHeader("x-rapidapi-host", "forward-reverse-geocoding.p.rapidapi.com");
        xhr.setRequestHeader("x-rapidapi-key", "2137d13aedmsh3be9797ef5d78f4p12abd7jsn2946b41ea9a6");

        xhr.send();
    });
}


function submitIncidentWithCoords(coords) {
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';


    const formData = {
        user_phone: document.getElementById('user_phone').value,
        incident_type: document.getElementById('incident_type').value,
        description: document.getElementById('description').value,
        address: document.getElementById('address').value,
        municipality: document.getElementById('municipality').value,
        region: document.getElementById('region').value,
        lat: coords.lat,
        lon: coords.lon
    };


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


function setValidationErrors(message) {
    const municipalityField = document.getElementById('municipality');
    const addressField = document.getElementById('address');
    const countryField = document.getElementById('country');
    const regionField = document.getElementById('region');

    if (municipalityField) municipalityField.setCustomValidity(message);
    if (addressField) addressField.setCustomValidity(message);
    if (countryField) countryField.setCustomValidity(message);
    if (regionField) regionField.setCustomValidity(message);
}


function clearValidationErrors() {
    const municipalityField = document.getElementById('municipality');
    const addressField = document.getElementById('address');
    const countryField = document.getElementById('country');
    const regionField = document.getElementById('region');

    if (municipalityField) municipalityField.setCustomValidity('');
    if (addressField) addressField.setCustomValidity('');
    if (countryField) countryField.setCustomValidity('');
    if (regionField) regionField.setCustomValidity('');
}


function showMessage(message, type) {
    const messageArea = document.getElementById('messageArea');
    messageArea.textContent = message;
    messageArea.className = 'message-area ' + type + '-message';
    messageArea.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            messageArea.style.display = 'none';
        }, 5000);
    }
}


function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return 'N/A';

    try {
        const date = new Date(dateTimeStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
        return dateTimeStr;
    }
}