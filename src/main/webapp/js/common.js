function loadFooter() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {

        let pathPrefix = '';
        if (window.location.pathname.includes('/user/') || window.location.pathname.includes('/volunteer/') || window.location.pathname.includes('/admin/')) {
            pathPrefix = '../';
        }

        fetch(pathPrefix + 'common/footer.html')
            .then(response => {
                if (response.ok) {
                    return response.text();
                }
                throw new Error('Footer not found.');
            })
            .then(data => {
                footerPlaceholder.innerHTML = data;
            })
            .catch(error => {
                console.error('Error loading footer:', error);
                footerPlaceholder.innerHTML = '<p style="text-align:center;color:red;">Error loading footer content.</p>';
            });
    }
}

document.addEventListener('DOMContentLoaded', loadFooter);