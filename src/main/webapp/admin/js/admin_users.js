function loadUsers() {
    makeAdminAjaxRequest('../admin/users', 'GET', null, (err, users) => {
        const container = document.getElementById('usersTableContainer');
        if (err) {
            container.innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
            return;
        }

        const rows = users.map(user =>
            buildRow([
                user.username,
                user.firstname,
                user.lastname,
                user.user_type || 'user',
                `<button class="btn-small btn-delete" onclick="deleteUser('${user.username}')">Delete</button>`
            ])
        ).join('');

        container.innerHTML = buildTable(['Username', 'First Name', 'Last Name', 'Type', 'Actions'], rows);
    });
}

function deleteUser(username) {
    if (confirm(`Delete user: ${username}?`)) {
        makeAdminAjaxRequest('../admin/users', 'POST', {action: "delete", username}, (err, response) => {
            if (err) {
                showMessage('Error deleting user: ' + err.message, 'error');
            } else {
                loadUsers();
                showMessage('User deleted successfully!', 'success');
            }
        });
    }
}