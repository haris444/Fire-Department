// Session Token Management Functions
function storeUserSession(token, username) {
    localStorage.setItem('userSessionToken', token);
    localStorage.setItem('loggedInUsername', username);
}

function getUserSessionToken() {
    return localStorage.getItem('userSessionToken');
}

function getLoggedInUsername() {
    return localStorage.getItem('loggedInUsername');
}

function clearUserSession() {
    localStorage.removeItem('userSessionToken');
    localStorage.removeItem('loggedInUsername');
}

// Redirection Functions
function redirectToUserLogin() {
    window.location.href = 'login.html';
}

function redirectToUserPanel() {
    window.location.href = 'panel.html';
}

// ADDED: Function to redirect to the volunteer panel
function redirectToVolunteerPanel() {
    // The path is relative to the login page's location (e.g., /user/login.html)
    window.location.href = '../volunteer/panel.html';
}

// Address Validation Function for Registration
function validateRegistrationAddress() {
    return new Promise(function(resolve, reject) {
        const countryName = document.getElementById('country').value.trim();
        const municipalityName = document.getElementById('municipality').value.trim();
        const addressName = document.getElementById('address').value.trim();
        const regionName = document.getElementById('region').value.trim();

        // Check if required fields are filled
        if (!countryName || !municipalityName || !addressName || !regionName) {
            reject(new Error('Please fill in all address fields (Country, Municipality, Address, Region)'));
            return;
        }

        // Clear any existing validation errors before starting new validation
        clearRegistrationValidationErrors();

        // Show loading message
        const locationFeedback = document.getElementById('locationFeedback');
        locationFeedback.style.display = 'block';
        locationFeedback.className = 'location-feedback loading';
        locationFeedback.innerHTML = '🔄 Validating address...';

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
                            locationFeedback.className = 'location-feedback success';
                            locationFeedback.innerHTML = `✅ Address validated successfully in ${regionName}.`;

                            // Set the hidden coordinates
                            document.getElementById('lat').value = lat;
                            document.getElementById('lon').value = lon;

                            resolve({ lat: lat, lon: lon });
                        } else {
                            // Location not in specified region
                            locationFeedback.className = 'location-feedback error';
                            locationFeedback.innerHTML = `❌ Address not found in ${regionName}. Please check your region.`;
                            setRegistrationValidationErrors(`This location is not in ${regionName}.`);
                            reject(new Error(`Address not found in ${regionName}. Please check your region.`));
                        }
                    } else if (response.length > 0 && countryName !== "Greece") {
                        // Not in Greece
                        locationFeedback.className = 'location-feedback error';
                        locationFeedback.innerHTML = '❌ This application is available only in Greece.';
                        setRegistrationValidationErrors("This application is available only in Greece.");
                        reject(new Error('This application is available only in Greece.'));
                    } else {
                        // Location not found
                        locationFeedback.className = 'location-feedback error';
                        locationFeedback.innerHTML = '❌ Address not found. Please check your address details.';
                        setRegistrationValidationErrors("This address could not be found.");
                        reject(new Error('Address not found. Please check your address details.'));
                    }
                } catch (e) {
                    locationFeedback.className = 'location-feedback error';
                    locationFeedback.innerHTML = '❌ Error validating address.';
                    setRegistrationValidationErrors("Error validating address.");
                    reject(new Error('Error validating address: ' + e.message));
                }
            }
        });

        xhr.onerror = function() {
            locationFeedback.className = 'location-feedback error';
            locationFeedback.innerHTML = '❌ Network error during validation.';
            setRegistrationValidationErrors("Network error during validation.");
            reject(new Error('Network error during address validation.'));
        };

        // Configure and send the geocoding request
        xhr.open("GET", "https://forward-reverse-geocoding.p.rapidapi.com/v1/search?q=" +
            encodeURIComponent(address) + "&accept-language=en&polygon_threshold=0.0");

        xhr.setRequestHeader("x-rapidapi-host", "forward-reverse-geocoding.p.rapidapi.com");
        xhr.setRequestHeader("x-rapidapi-key", "2137d13aedmsh3be9797ef5d78f4p12abd7jsn2946b41ea9a6");

        xhr.send();
    });
}

// Validation error handling for registration
function setRegistrationValidationErrors(message) {
    const countryField = document.getElementById('country');
    const municipalityField = document.getElementById('municipality');
    const addressField = document.getElementById('address');
    const regionField = document.getElementById('region');

    if (countryField) countryField.setCustomValidity(message);
    if (municipalityField) municipalityField.setCustomValidity(message);
    if (addressField) addressField.setCustomValidity(message);
    if (regionField) regionField.setCustomValidity(message);
}

function clearRegistrationValidationErrors() {
    const countryField = document.getElementById('country');
    const municipalityField = document.getElementById('municipality');
    const addressField = document.getElementById('address');
    const regionField = document.getElementById('region');

    if (countryField) countryField.setCustomValidity('');
    if (municipalityField) municipalityField.setCustomValidity('');
    if (addressField) addressField.setCustomValidity('');
    if (regionField) regionField.setCustomValidity('');
}

// Registration Logic for register.html
function initializeRegistrationPage() {
    const registerForm = document.getElementById('userRegisterForm');
    const messageDiv = document.getElementById('registerMessage');

    if (registerForm) {
        // Add event listeners to clear validation errors when address fields change
        const addressFields = ['country', 'municipality', 'address', 'region'];
        addressFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', function() {
                    // Clear validation errors when user starts typing
                    clearRegistrationValidationErrors();
                    // Hide any previous location feedback
                    const locationFeedback = document.getElementById('locationFeedback');
                    if (locationFeedback) {
                        locationFeedback.style.display = 'none';
                    }
                    // Clear coordinates so validation is required again
                    document.getElementById('lat').value = '';
                    document.getElementById('lon').value = '';
                });
            }
        });

        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();

            // Determine registration type by checking which toggle button is active
            const volunteerToggle = document.getElementById('volunteerToggle');
            let registrationType = (volunteerToggle && volunteerToggle.classList.contains('active')) ? 'volunteer' : 'user';

            // First validate the address before proceeding with registration
            validateRegistrationAddress()
                .then(function(coords) {
                    // Address is valid, now proceed with form data collection and validation
                    submitRegistrationData(registrationType, messageDiv);
                })
                .catch(function(error) {
                    showErrorMessage(messageDiv, error.message);
                });
        });
    }
}

function submitRegistrationData(registrationType, messageDiv) {
    // Collect form field values (including auto-calculated lat/lon)
    const formData = {
        registrationType: registrationType,
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        firstname: document.getElementById('firstname').value,
        lastname: document.getElementById('lastname').value,
        birthdate: document.getElementById('birthdate').value,
        gender: document.getElementById('gender').value,
        afm: document.getElementById('afm').value,
        country: document.getElementById('country').value,
        address: document.getElementById('address').value,
        municipality: document.getElementById('municipality').value,
        region: document.getElementById('region').value,
        job: document.getElementById('job').value,
        telephone: document.getElementById('telephone').value,
        lat: document.getElementById('lat').value || null,
        lon: document.getElementById('lon').value || null
    };

    if (registrationType === 'volunteer') {
        formData.volunteer_type = document.getElementById('volunteer_type').value;
        formData.height = document.getElementById('height').value || null;
        formData.weight = document.getElementById('weight').value || null;
    }

    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!validateRegistrationForm(formData, confirmPassword, messageDiv, registrationType)) {
        return;
    }

    const xhr = new XMLHttpRequest();
    // Path from register.html (root) to the servlet is direct
    xhr.open('POST', 'register', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 201) {
                showSuccessMessage(messageDiv, 'Registration successful! Please login.');
                document.getElementById('userRegisterForm').reset();
                // Reset country field and hide location feedback
                document.getElementById('country').value = 'Greece';
                document.getElementById('locationFeedback').style.display = 'none';
            } else {
                try {
                    const response = JSON.parse(xhr.responseText);
                    showErrorMessage(messageDiv, response.message || 'An error occurred.');
                } catch (e) {
                    showErrorMessage(messageDiv, 'An unknown error occurred.');
                }
            }
        }
    };
    xhr.onerror = () => showErrorMessage(messageDiv, 'Network error.');
    xhr.send(JSON.stringify(formData));
}

// Login Logic for login.html
function initializeLoginPage() {
    const loginForm = document.getElementById('userLoginForm');
    const errorDiv = document.getElementById('loginErrorMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (!username || !password) {
                showErrorMessage(errorDiv, 'Please enter both username and password.');
                return;
            }

            const payload = { username, password };

            const xhr = new XMLHttpRequest();
            // Path is from /user/login.html, so we go up one level to the root
            xhr.open('POST', '../login', true);
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if (response.success === true) {
                                storeUserSession(response.sessionToken, response.username);

                                // MODIFIED: Redirect based on user_type from the server's response
                                if (response.user_type === 'volunteer') {
                                    redirectToVolunteerPanel();
                                } else if (response.user_type === 'user') {
                                    redirectToUserPanel();
                                } else {
                                    showErrorMessage(errorDiv, 'Login successful, but role is undefined.');
                                }
                            } else {
                                showErrorMessage(errorDiv, response.message || 'Login failed');
                            }
                        } catch (e) {
                            showErrorMessage(errorDiv, 'Invalid response from server');
                        }
                    } else {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            showErrorMessage(errorDiv, response.message || 'Invalid credentials or server error.');
                        } catch(e) {
                            showErrorMessage(errorDiv, 'Invalid credentials or server error.');
                        }
                    }
                }
            };

            xhr.onerror = () => showErrorMessage(errorDiv, 'Network error occurred');
            xhr.send(JSON.stringify(payload));
        });
    }
}

// Logout Function (called from user_app.js and volunteer_app.js)
function logoutUser() {
    const xhr = new XMLHttpRequest();
    // Use a unified logout URL
    xhr.open('POST', '../logout', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader("X-User-Session-Token", getUserSessionToken()); // Send token to invalidate server session

    // Always clear local session and redirect, regardless of server response
    xhr.onload = xhr.onerror = function() {
        clearUserSession();
        // Redirect to the main index page after logout
        window.location.href = '../user/login.html';
    };

    xhr.send();
}

// Registration Form Validation
function validateRegistrationForm(formData, confirmPassword, messageDiv, registrationType) {
    const requiredFields = ['username', 'email', 'password', 'firstname', 'lastname',
        'birthdate', 'gender', 'afm', 'country', 'address',
        'municipality', 'region', 'job', 'telephone'];

    for (let field of requiredFields) {
        if (!formData[field] || String(formData[field]).trim() === '') {
            showErrorMessage(messageDiv, `Please fill in the ${field} field.`);
            return false;
        }
    }

    if (registrationType === 'volunteer') {
        if (!formData.volunteer_type || formData.volunteer_type.trim() === '') {
            showErrorMessage(messageDiv, 'Please select a volunteer type.');
            return false;
        }
    }

    if (formData.password !== confirmPassword) {
        showErrorMessage(messageDiv, 'Passwords do not match.');
        return false;
    }
    if (formData.password.length < 6) {
        showErrorMessage(messageDiv, 'Password must be at least 6 characters long.');
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showErrorMessage(messageDiv, 'Please enter a valid email address.');
        return false;
    }
    const afmRegex = /^\d{9}$/;
    if (!afmRegex.test(formData.afm)) {
        showErrorMessage(messageDiv, 'AFM must be exactly 9 digits.');
        return false;
    }

    // Check if coordinates were calculated (address validation passed)
    if (!formData.lat || !formData.lon) {
        showErrorMessage(messageDiv, 'Please ensure your address is validated before registering.');
        return false;
    }

    return true;
}

// Message Display Functions
function showErrorMessage(element, message) {
    if(element) {
        element.textContent = message;
        element.className = 'error-message';
        element.style.display = 'block';
    }
}

function showSuccessMessage(element, message) {
    if(element) {
        element.textContent = message;
        element.className = 'success-message';
        element.style.display = 'block';
    }
}

// Authentication Check for user panel (can be used by volunteer panel too)
function checkAuthStatusForPanel() {
    if (!getUserSessionToken() || !getLoggedInUsername()) {
        // Assumes this is called from within user/ or volunteer/ directory
        window.location.href = '../user/login.html';
    }
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('userRegisterForm')) {
        initializeRegistrationPage();
    }
    if (document.getElementById('userLoginForm')) {
        initializeLoginPage();
    }
});