$(document).ready(async function() {

    const get_user = async () => {
        try {
            const user_info = await ipcRenderer.GetUser();
            return user_info;
        } catch (error) {
            console.error("Error getting user information:", error.message);
        }
    };

    function showToast(heading, text, position, loaderBg, icon, hideAfter = 3000, stack = 1, showHideTransition = "fade") {
        const options = {
            heading: heading,
            text: text,
            position: position,
            loaderBg: loaderBg,
            icon: icon,
            hideAfter: hideAfter,
            stack: stack,
            showHideTransition: showHideTransition
        };
        $.toast().reset("all");
        $.toast(options);
    }

    const users_information = await get_user();
    let base_url = users_information.base_url;

    const signupButton = $('.signup');
    const loadingSpinner = $('.signup-loading');
    const signupMessage = $('#signupMessage');
    const termsModal = $('#termsModal');

    $('#signupForm').submit(async function(event) {
        event.preventDefault(); // Prevent default form submission
    
        const password = $('#password').val();
        const confirmPassword = $('#confirm-password').val();
    
        // Check if passwords match
        if (password !== confirmPassword) {
            showToast(
                "Error",
                "Passwords do not match!",
                "top-center",
                "#e80945",
                "error"
            );
            return; // Stop form submission if passwords don't match
        }
    
        const formData = new FormData(this);
        const sessionID = generateSessionID();
        formData.append('sessionID', sessionID);
    
        const isAdminUser = $('#switch3').is(':checked');
        formData.append('isAdminUser', isAdminUser ? 'Yes' : 'No');
    
        const acceptTerms = $('#checkbox-signup').is(':checked');
        formData.append('acceptTerms', acceptTerms ? 'Yes' : 'No');
    
        // Add the organization secret key
        const organizationSecretKey = $('#organization-secret-key').val(); // Assuming this is the input field for the secret key
        formData.append('organizationSecretKey', organizationSecretKey);
    
        try {
            const ip = await getIPAddress();
            formData.append("ipAddress", ip);
    
            if (!acceptTerms) {
                termsModal.modal('show');
                return;
            }
    
            // Convert FormData to an object
            const formDataObject = {};
            for (const [key, value] of formData.entries()) {
                formDataObject[key] = value;
            }
    
            signupButton.addClass('d-none');
            loadingSpinner.removeClass('d-none');
    
            $.ajax({
                type: 'POST',
                url: `${base_url}/add-user`,
                data: JSON.stringify(formDataObject),
                contentType: 'application/json',
                success: function(response) {
                    if (response.status === "success") {
                        showToast(
                            "Success",
                            `${response.messag}`,
                            "top-center",
                            "#0eed89",
                            "success"
                        );

                        const org = formDataObject["organization"];
                        const sess_id = response.sessionID;
                        ipcRenderer.send('set-cookie', { name: 'sessionID', value: sess_id, organization: org, days: 30 });
                        signupMessage.html(`<div class="card-body"><h5 class="text-success">${response.message}</h5></div>`);
                        ipcRenderer.send("proceedMain");
                    }
                    signupMessage.removeClass('d-none');
                    signupButton.removeClass('d-none');
                    loadingSpinner.addClass('d-none');
                },
                error: function(xhr, status, error) {
                    const errorMessage = xhr.responseText ? JSON.parse(xhr.responseText).error : 'Unknown error';
                    signupMessage.html(`<div class="card-body"><h5 class="text-danger">${errorMessage}</h5></div>`);

                    showToast(
                        "Error",
                       `${errorMessage}`,
                        "top-center",
                        "#e80945",
                        "error"
                    ); 

                    signupMessage.removeClass('d-none');
                    signupButton.removeClass('d-none');
                    loadingSpinner.addClass('d-none');
                }
            });
    
        } catch (error) {
            console.error(error);
        }
    });
    

    function generateSessionID() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    function getIPAddress() {
        return new Promise((resolve, reject) => {
            $.getJSON("https://api.ipify.org?format=json", function(data) {
                resolve(data.ip);
            }).fail(function() {
                reject("Failed to retrieve IP address");
            });
        });
    }
});
