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
  
    // Selecting elements outside the form submission event listener
    const signupButton = $('.signup');
    const loadingSpinner = $('.signup-loading');
    const signupMessage = $('#signupMessage');
    const termsModal = $('#termsModal');


    // Form submission event listener
    $('#signupForm').submit(async function(event) {
  
        event.preventDefault(); // Prevent default form submission
    
        // Gather form data
        const formData = new FormData(this);
    
        // Generate a session ID
        const sessionID = generateSessionID();
    
        // Append session ID to the form data
        formData.append('sessionID', sessionID);
    
        // Include Admin User checkbox state
        const isAdminUser = $('#switch3').is(':checked');
        formData.append('isAdminUser', isAdminUser ? 'Yes' : 'No');
    
        // Include Terms and Conditions checkbox state
        const acceptTerms = $('#checkbox-signup').is(':checked');
        formData.append('acceptTerms', acceptTerms ? 'Yes' : 'No');
        
    
        try {
            // Get IP address
            const ip = await getIPAddress();
            formData.append("ipAddress", ip);
    
            // Check if terms have been accepted
            if (!acceptTerms) {
                // Show the terms modal
                termsModal.modal('show');
                return; // Stop form submission
            }
    
            // Convert formData to an object
            const formDataObject = {};
            for (const [key, value] of formData.entries()) {
                formDataObject[key] = value;
            }

            // Display loading spinner and hide signup button
            signupButton.addClass('d-none');
            loadingSpinner.removeClass('d-none');
    
            // Send form data to the server via AJAX
            $.ajax({
                type: 'POST',
                url: `${base_url}/add-user`, // Replace with your server URL
                data: JSON.stringify(formDataObject),
                contentType: 'application/json', // Set content type to JSON
                success: function(response) {
                    // Parse the response and extract the message
                    const message = response.message;

                    // Display the message in the signupMessage element
                    if (response.status==="success") {

                        const org=formDataObject["organization"];
                        const sess_id=response.sessionID

                        ipcRenderer.send('set-cookie', { name: 'sessionID', value:sess_id ,organization:org, days: 30 });

                        signupMessage.html(` <div class="card-body" >
                        <div class="ribbon ribbon-success float-end " ><i class="mdi mdi-access-point me-1"></i></div>
                        <h5 class="text-success float-start mt-0">${message}</h5>
                    </div> <!-- end card-body -->`);

                        ipcRenderer.send("proceedMain");
    
                    }
                    // Hide loading spinner and reveal signup button
                    signupMessage.removeClass('d-none');
    
                    signupButton.removeClass('d-none');
                    loadingSpinner.addClass('d-none');
                },
                error: function(xhr, status, error) {
                    // Handle error response
                    const errorMessage = xhr.responseText ? JSON.parse(xhr.responseText).error : 'Unknown error';
                    
                    signupMessage.html(` <div class="card-body" >
                        <div class="ribbon ribbon-danger float-end " ><i class="mdi mdi-access-point me-1"></i></div>
                        <h5 class="text-danger float-start mt-0">${errorMessage}</h5>
                    </div> <!-- end card-body -->`);
    
                    signupMessage.removeClass('d-none');
                    signupButton.removeClass('d-none');
                    loadingSpinner.addClass('d-none');
                }
            });
    
        } catch (error) {
            console.error(error);
            // Handle error if IP address retrieval fails
        }
    });
    

    // Function to generate a session ID
    function generateSessionID() {
        // Generate a random string as the session ID (for demonstration purposes)
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

        // Function to retrieve the IP address
    function getIPAddress() {
        // Using a third-party service to get the IP address
        return new Promise((resolve, reject) => {
            $.getJSON("https://api.ipify.org?format=json", function(data) {
                resolve(data.ip);
            }).fail(function() {
                reject("Failed to retrieve IP address");
            });
        });
    }

    

});
