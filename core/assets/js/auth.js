
    $(document).ready(function() {

        let base_url=user_info.base_url

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


        $('#togglePassword').click(function() {
            // Toggle the 'fa-eye' and 'fa-eye-slash' classes
            $('#togglePassword span').toggleClass('fa-eye fa-eye-slash');

            // Toggle the input type between 'password' and 'text'
            var passwordField = $('#password');
            var fieldType = passwordField.attr('type');
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
