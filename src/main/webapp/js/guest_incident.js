document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('guestIncidentForm');
    const messageArea = document.getElementById('messageArea');
    const submitBtn = document.getElementById('submitBtn');

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

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        validateLocation()
            .then(function(coords) {
                submitIncidentWithCoords(coords);
            })
            .catch(function(error) {
                showMessage(error.message, 'error');
            });
    });

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
        messageArea.textContent = message;
        messageArea.className = 'message-area ' + type + '-message';
        messageArea.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                messageArea.style.display = 'none';
            }, 5000);
        }
    }
});