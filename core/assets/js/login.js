// Wait for the document to be fully loaded
$(document).ready(async function() {
    const get_user = async () => {
        try {
            const user_info = await ipcRenderer.GetUser();
            return user_info

        } catch (error) {
            console.error("Error getting user information:", error.message);
        }
    };

    const users_information=await get_user();
 

    let base_url=users_information.base_url
  
    // Get the form and buttons
    const form = document.getElementById('loginForm');
    const loginButton = document.querySelector('.login-btn');
    const loadingButton = document.querySelector('.login-loading');

    const loginMessage = $('#loginMessage');

    // Add event listener for form submission
    form.addEventListener('submit', async function(event) {
        // Prevent the default form submission
        event.preventDefault();
    
        // Show the loading spinner button and hide the login button
        loginButton.classList.add('d-none');
        loadingButton.classList.remove('d-none');
    
        try {
            // Perform the AJAX request to submit the form data
            const formData = new FormData(form);
            
            // Fetch the organization name, secret key, email, and password
            const organization = formData.get('organization');
            const orgSecretKey = formData.get('orgSecretKey');
            const email = formData.get('email');
            const password = formData.get('password');
            
            // Include organization secret key in the form data
            formData.append('orgSecretKey', orgSecretKey);
    
            // Perform the fetch request
            const response = await fetch(`${base_url}/login`, {
                method: 'POST',
                body: formData
            });
    
            // Assuming response indicates success
            if (response.status === 200) {
                const data = await response.json();
               // Reset the form fields
                form.reset();
    
                loginMessage.html(`<div class="card-body">
                    <div class="ribbon ribbon-success float-end"><i class="mdi mdi-access-point me-1"></i></div>
                    <h5 class="text-success float-start mt-0">${data.message}</h5>
                </div> <!-- end card-body -->`)
    
                loginMessage.removeClass('d-none');
    
                // Set cookie and navigate to main if "remember me" is checked
                if (data.remember_me) {
                    ipcRenderer.send('set-cookie', { name: 'sessionID', value: data.sessionID, organization: data.org, days: 30 });
                }

    
                ipcRenderer.send("proceedMain");
            } else {
                // Handle errors from the server response
                const errorData = await response.json();
                console.log(errorData); // This will log the error response data object
    
                loginMessage.html(`<div class="card-body">
                    <div class="ribbon ribbon-danger float-end"><i class="mdi mdi-access-point me-1"></i></div>
                    <h5 class="text-danger float-start mt-0">${errorData.message}</h5>
                </div> <!-- end card-body -->`);
    
                loginMessage.removeClass('d-none');
            }
    
            
        } catch (error) {
            // Handle any other errors
            console.error('Error:', error);
        } finally {
            // Hide the loading spinner button and show the login button
            loginButton.classList.remove('d-none');
            loadingButton.classList.add('d-none');
        }
    });
    
    
});
