function loadVolunteerProfileSection() {
    makeVolunteerAjaxRequest('../volunteer/profile', 'GET', null, (err, userData) => {
        const profileContainer = document.getElementById('profileContainer');
        if (err) {
            profileContainer.innerHTML = `<div class="error-message">Error loading profile: ${err.message}</div>`;
        } else {
            profileContainer.innerHTML = buildVolunteerProfileForm(userData);
            document.getElementById('userProfileForm').addEventListener('submit', event => {
                event.preventDefault();
                submitVolunteerProfileUpdate();
            });
        }
    });
}



function submitVolunteerProfileUpdate() {
    const formData = {
        firstname: document.getElementById('firstname').value,
        lastname: document.getElementById('lastname').value,
        birthdate: document.getElementById('birthdate').value,
        gender: document.getElementById('gender').value,
        afm: document.getElementById('afm').value,
        country: document.getElementById('country').value,
        address: document.getElementById('address').value,
        municipality: document.getElementById('municipality').value,
        prefecture: document.getElementById('prefecture').value,
        job: document.getElementById('job').value,
        telephone: document.getElementById('telephone').value,
        lat: document.getElementById('lat').value || null,
        lon: document.getElementById('lon').value || null
    };

    const volunteerTypeField = document.getElementById('volunteer_type');
    const heightField = document.getElementById('height');
    const weightField = document.getElementById('weight');

    if (volunteerTypeField) {
        formData.volunteer_type = volunteerTypeField.value || null;
    }
    if (heightField) {
        formData.height = heightField.value || null;
    }
    if (weightField) {
        formData.weight = weightField.value || null;
    }

    makeVolunteerAjaxRequest('../volunteer/profile', 'POST', formData, (err, response) => {
        const messageDiv = document.getElementById('profileUpdateMessage');
        if (err) {
            messageDiv.innerHTML = `<div class="error-message">Error updating profile: ${err.message}</div>`;
        } else {
            messageDiv.innerHTML = `<div class="success-message">Profile updated successfully!</div>`;
        }
    });
}