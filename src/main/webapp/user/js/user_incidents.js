function loadSubmitIncidentSection() {
    setTimeout(function() {
        const addressFields = ['country', 'municipality', 'address', 'region'];
        addressFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', function() {
                    clearIncidentValidationErrors();
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

    validateIncidentLocation()
        .then(function(coords) {

            submitIncidentWithCoords(coords);
        })
        .catch(function(error) {
            const messageDiv = document.getElementById('incidentSubmitMessage');
            messageDiv.innerHTML = '<div class="error-message">' + error.message + '</div>';
        });
}


function validateIncidentLocation() {
    return new Promise(function(resolve, reject) {
        const countryName = document.getElementById('country').value.trim();
        const municipalityName = document.getElementById('municipality').value.trim();
        const addressName = document.getElementById('address').value.trim();
        const regionName = document.getElementById('region').value.trim();

        if (!countryName || !municipalityName || !addressName || !regionName) {
            reject(new Error('Please fill in all location fields (Country, Municipality, Address, Region)'));
            return;
        }

        clearIncidentValidationErrors();

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
                            setIncidentValidationErrors(`This location is not in ${regionName}.`);
                            reject(new Error(`Address not found in ${regionName}. Please check your region.`));
                        }
                    } else if (response.length > 0 && countryName !== "Greece") {

                        locationFeedback.innerHTML = '<span style="color: red;">❌ This application is available only in Greece.</span>';
                        setIncidentValidationErrors("This application is available only in Greece.");
                        reject(new Error('This application is available only in Greece.'));
                    } else {

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


        xhr.open("GET", "https://forward-reverse-geocoding.p.rapidapi.com/v1/search?q=" +
            encodeURIComponent(address) + "&accept-language=en&polygon_threshold=0.0");

        xhr.setRequestHeader("x-rapidapi-host", "forward-reverse-geocoding.p.rapidapi.com");
        xhr.setRequestHeader("x-rapidapi-key", "2137d13aedmsh3be9797ef5d78f4p12abd7jsn2946b41ea9a6");

        xhr.send();
    });
}


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