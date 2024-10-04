
    $(document).ready(function() {

        let base_url = '';

        // Try to fetch user info, handle errors if it fails without showing toast
        try {
            base_url = user_info.base_url;
        } catch (error) {
            console.error('Error retrieving user info:', error.message);
        }

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


        $('#togglePassword, #toggleConfirmPassword').click(function() {
            // Toggle the eye icon class
            $(this).find('.password-eye').toggleClass('show-password');
        
            // Get the associated input field
            var passwordField = $(this).siblings('input');
            var fieldType = passwordField.attr('type');
        
            // Toggle the input type between 'password' and 'text'
            if (fieldType === 'password') {
                passwordField.attr('type', 'text');
            } else {
                passwordField.attr('type', 'password');
            }
        });
        
        
        

        $('.logout').on("click", async ()=>{

        
            
            try {
                const response = await fetch(`${base_url}/api/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ user_id: user_info._id,db_name:user_info.organization }) // Assuming userId is available
                });
        
                if (response.ok) {

                    showToast(
                        "! Logged out",
                        `logged out successfully`,
                        "top-center",
                        "rgba(0,0,0,0.2)",
                        "success"
                    );

                    setTimeout(function(){
                        ipcRenderer.send("logout");

                    },700)
    
                  

                } else {
                    console.error('Failed to logout:', response.statusText);
                    showToast(
                        "!Failed Logged out",
                        `${response.statusText}`,
                        "top-center",
                        "rgba(0,0,0,0.2)",
                        "success"
                    );
                    // Handle logout failure
                }
            } catch (error) {
                console.error('Error logging out:', error.message);
                showToast(
                    "!'Error logging out",
                    `${error.message}`,
                    "top-center",
                    "rgba(0,0,0,0.2)",
                    "success"
                );
                // Handle logout error
            }

        })


    });
