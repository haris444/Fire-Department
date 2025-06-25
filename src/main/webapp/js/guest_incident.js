// Guest Incident JavaScript with Address Validation and Geocoding

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('guestIncidentForm');
    const messageArea = document.getElementById('messageArea');
    const submitBtn = document.getElementById('submitBtn');

    // Add event listeners to clear validation errors when address fields change
    const addressFields = ['country', 'municipality', 'address', 'region'];
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
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // First validate the location
        validateLocation()
            .then(function(coords) {
                // If validation successful, submit the incident
                submitIncidentWithCoords(coords);
            })
            .catch(function(error) {
                showMessage(error.message, 'error');
            });
    });

    /**
     * Validates the location using the geocoding API
     * @returns {Promise} Promise that resolves with coordinates if valid
     */
    function validateLocation() {
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
            clearValidationErrors();

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
                                setValidationErrors(`This location is not in ${regionName}.`);
                                reject(new Error(`Address not found in ${regionName}. Please check your region.`));
                            }
                        } else if (response.length > 0 && countryName !== "Greece") {
                            // Not in Greece
                            locationFeedback.innerHTML = '<span style="color: red;">❌ This application is available only in Greece.</span>';
                            setValidationErrors("This application is available only in Greece.");
                            reject(new Error('This application is available only in Greece.'));
                        } else {
                            // Location not found
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
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        // Collect form data
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

        // Send data to server
        fetch('guest/incident', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage('Incident submitted successfully! Emergency responders have been notified.', 'success');
                    form.reset();
                    document.getElementById('country').value = 'Greece'; // Reset country to Greece
                    document.getElementById('locfeedback').style.display = 'none';
                } else {
                    showMessage('Error: ' + data.message, 'error');
                }
            })
            .catch(error => {
                showMessage('Network error. Please try again.', 'error');
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Incident Report';
            });
    }

    /**
     * Sets validation errors on form fields
     */
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

    /**
     * Clears validation errors from form fields
     */
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

    /**
     * Shows a message to the user
     */
    function showMessage(message, type) {
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
});