
    $(document).ready(function() {
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

        $('.logout').on("click",()=>{

            ipcRenderer.send("logout");

        })



    });
