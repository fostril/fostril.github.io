document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            performLogin(email, password);
        });
    }

    // Handle registration form submission
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const messageContainer = document.getElementById('message-container');

            if (password !== confirmPassword) {
                messageContainer.textContent = 'Passwords do not match.';
                messageContainer.style.color = 'red';
                return;
            }
            performRegistration(email, password, messageContainer);
        });
    }

    // Function to perform login
    function performLogin(email, password) {
        fetch('/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email, password: password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
              window.location.href = data.redirectUrl;  // Redirect on successful login
            } else if (data.redirectUrl) {
              window.location.href = data.redirectUrl;  // Redirect to subscribe if necessary
            } else {
              alert(data.message);  // Show error message otherwise
            }
        })
        .catch(error => console.error('Error:', error));
    }    

    // Function to perform registration
    function performRegistration(email, password, messageContainer) {
        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({email: email, password: password}),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                messageContainer.textContent = 'Registration successful! Redirecting...';
                messageContainer.style.color = 'green';
                setTimeout(() => {
                    window.location.href = '/'; // Redirect to the login page
                }, 3000); // Redirect after 3 seconds
            } else {
                messageContainer.textContent = data.message;
                messageContainer.style.color = 'red';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            messageContainer.textContent = 'An error occurred during registration. Please try again.';
            messageContainer.style.color = 'red';
        });
    }
});
