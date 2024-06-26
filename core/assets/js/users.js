$(document).ready(function () {
    let base_url=user_info.base_url

    $("#addUserForm").on("submit", async function (event) {
        event.preventDefault();


        var fullName = $("#fullNameInput").val();
        var email = $("#emailInput").val();
        var password = $("#passwordInput").val();

        var addUserBtn = $("#addUserForm button[type='submit']");
        var loadingBtn = $(".add-user-load");

        async function showToast(heading, text, position, loaderBg, icon, hideAfter = 3000, stack = 1, showHideTransition = "fade") {
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

        // Show loading spinner and hide submit button
        addUserBtn.addClass('d-none');
        loadingBtn.removeClass('d-none');

        try {


            const ip = await getIPAddress();
            const organization = user_info.organization;
            const sessionID = generateSessionID();
            const acceptTerms = "Yes"
            const isAdminUser = "No"

            var data = {
                fullname: fullName,
                email: email,
                password: password,
                ipAddress: ip,
                acceptTerms: acceptTerms,
                organization: organization,
                sessionID: sessionID,
                isAdminUser: isAdminUser,
                isAddedByexistinguser:true
            };


            $.ajax({
                url: `${base_url}/add-user`, // Replace with your Flask route
                method: 'POST',
                data: JSON.stringify(data),
                contentType: 'application/json',
                success: function (response) {
                    // Handle successful response

                    $("#user-add-text").text(response.message)

                    $("#useradd-status").fadeIn().delay(2000).fadeOut();
                    // Hide loading spinner and show submit button

                    // Reset the form
                    $("#addUserForm")[0].reset();
                    // Optionally, close the modal
                    setTimeout(function () {
                        loadingBtn.addClass('d-none');
                        addUserBtn.removeClass('d-none');
                        $('#addUserModal').modal('hide');
                        populateUsersTable()
                    }, 2000)

                },
                error: function (xhr, status, error) {
                    // Handle error response
                    const errorMessage = xhr.responseText ? JSON.parse(xhr.responseText).error : 'Unknown error';

                    console.error('Error:', error);
                    // Optionally, show an error message to the user

                    // Hide loading spinner and show submit button
                    loadingBtn.addClass('d-none');
                    addUserBtn.removeClass('d-none');

                    $("#user-add-text").text(errorMessage)

                    $("#useradd-status").fadeIn().delay(2000).fadeOut();

                }
            });

        }

        catch (error) {

            console.log(error)

        }

    });



    // Function to retrieve the IP address
    function getIPAddress() {
        // Using a third-party service to get the IP address
        return new Promise((resolve, reject) => {
            $.getJSON("https://api.ipify.org?format=json", function (data) {
                resolve(data.ip);
            }).fail(function () {
                reject("Failed to retrieve IP address");
            });
        });
    }

    function generateSessionID() {
        // Generate a random string as the session ID (for demonstration purposes)
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    const getUsers = async (dbName) => {
        try {
            const response = await fetch(`${base_url}/api/getUsers?dbname=${dbName}`);
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            const data = await response.json();

            return data


            // Process the data (e.g., display it in your application)
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
            // Optionally, show an error message to the user
        }
    };

    function formatDate(dateString) {
        const date = new Date(dateString);
    
        // Extracting parts of the date
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
        const day = date.getUTCDate().toString().padStart(2, '0');
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    
        // Format: YYYY-MM-DD HH:MM
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    const populateUsersTable = () => {
        
        
        getUsers(user_info.organization).then(users => {
            if (users) {

                const table = $("#users-datatable").DataTable();
                table.clear();


                for (const user of users) {

                    const joinedDate = user.joined_date && user.joined_date.$date ? formatDate(user.joined_date.$date) : '';
                    const lastlogin = user.last_login && user.last_login.$date ? formatDate(user.last_login.$date) : '';
                    table.row.add([
                        '<div class="form-check"><input type="checkbox" class="form-check-input" id="customCheck13"/><label class="form-check-label" for="customCheck13">&nbsp;</label></div>',
                        `<span class="text-body fw-semibold">${user.fullname || ""}</span>`,
                        user.is_admin || "",
                        user.email || "",
                        user.login_location.city || "",
                        joinedDate || "",
                        lastlogin  || "",
                        (user.is_online ? '<span class="badge badge-success-lighten">online</span>' : '<span class="badge badge-danger-lighten">offline</span>'),
                        `<a href="javascript:void(0);" class="action-icon"><i class="mdi mdi-square-edit-outline edit-user" data-edituserid="${user._id.$oid}" data-editusername="${user.fullname}" data-isadmin="${user.is_admin}" data-isonline="${user.is_online}" ></i></a><a href="javascript:void(0);" class="action-icon"><i class="mdi mdi-delete deleteuser" data-deleteuserid="${user._id.$oid}" data-deleteusername="${user.fullname}"></i></a>`
                    ]);

                }

                table.draw();

                deleteUserHandler()
                editUserHandler()


            }
        });

    }


    const deleteUserHandler = () => {
        // Event delegation for delete user
        $('#users-datatable').on('click', '.deleteuser', function () {
            // Retrieve user ID and name from data attributes
            const userId = $(this).data('deleteuserid');
            const userName = $(this).data('deleteusername');

            $("#deletinguser-msg").text(`You're about to delete ${userName} account , this decision is irreversible `)

            $('#delete-user-alert-modal').attr('data-userid', userId);
            $('#delete-user-alert-modal').attr('data-username', userId);

            $("#delete-user-alert-modal").modal("show")


        });
    }

    const editUserHandler = () => {
        // Event delegation for edit user
        $('#users-datatable').on('click', '.edit-user', function () {
            // Retrieve user ID and name from data attributes
            const userId = $(this).data('edituserid');
            const userName = $(this).data('editusername');

            const userOnline=$(this).data('isonline')
            const userAdmin=$(this).data('isadmin')

            $('#editUserModal').modal('show'); // Show the modal

            
            $('#editing-user').attr('data-userid', userId);

            $("#editing-user").text(`Editing ${userName} `)

                    // Set the state of the online switch
            if (userOnline) {
                $('#is_online').prop('checked', true);
            } else {
                $('#is_online').prop('checked', false);
            }

            // Set the state of the admin switch
            if (userAdmin==="Yes" || userAdmin===true) {
                $('#is_admin').prop('checked', true);
            } else {
                $('#is_admin').prop('checked', false);
            }

          


        });

    }



    const confirmDeleteUserHandler = () => {
        $('#confirm-deletion').on('click', function () {
            const userId = $('#delete-user-alert-modal').attr('data-userid');
            const userName = $('#delete-user-alert-modal').attr('data-username');

            if (userId === user_info._id) {

                // Show success message
                $('#userdelete-status').show().fadeIn().delay(1800).fadeOut(2500);
                $('#user-delete-text').removeClass("badge-success-lighten").addClass("badge-danger-lighten").addClass("text-danger").text('You cannot delete your own account. Please log in to another account to perform this action.');

                return
            }
            else{
                $('#user-delete-text').removeClass("text-danger").removeClass("badge-danger-lighten").addClass("badge-success-lighten").addClass("text-success").text(`Deleting ${userName}`)

            }

            // Show the loading spinner and hide the confirmation button
            $('#confirm-deletion').addClass('d-none');
            $('.delete-user-load').removeClass('d-none').fadeIn();

            // Send a request to the server to delete the user using fetch
            fetch(`${base_url}/api/deleteUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    userName: userName,
                    dbname: user_info.organization
                })  // Send data as a dictionary
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {

                    // Optionally, refresh the user table or remove the user row
                    $('#users-datatable').DataTable().row($(`.deleteuser[data-deleteuserid="${userId}"]`).parents('tr')).remove().draw();

                    // Show success message
                    $('#userdelete-status').show().fadeIn();
                    $('#user-delete-text').text('User deleted successfully');

                })
                .catch(error => {
                    console.error('Error deleting user:', error);
                    // Optionally, show an error message to the user
                    $('#userdelete-status').show().fadeIn();
                    $('#user-delete-text').text('Error deleting user');
                })
                .finally(() => {

                    setTimeout(() => {

                        // Hide the loading spinner and show the confirmation button again
                        $('.delete-user-load').fadeOut(() => {
                            $(this).addClass('d-none');
                            $('#confirm-deletion').removeClass('d-none').fadeIn();
                        });

                    }, 1500);

                    // Hide the modal after a short delay
                    setTimeout(() => {

                        $('#delete-user-alert-modal').modal('hide');
                        $('#userdelete-status').fadeOut();
                    }, 2000);
                });
        });
    };

    const confirmEdit = () => {
        // Submit form handler
        $('#editUserForm').submit(function (event) {
            event.preventDefault(); // Prevent default form submission

            var editUserBtn = $("#editUserForm button[type='submit']");
            var editloadBtn = $('.edit-user-load');

            var userEditdiv = $('#useredit-status');
            var userEdittxt = $('#user-edit-text');

            var uid=$('#editing-user').attr("data-userid");

       

            // Serialize form data
            const formData = {
                dbName: user_info.organization,
                userId: uid,
                fullName: $('#editfullNameInput').val(),
                email: $('#editemailInput').val(),
                isAdmin: $('#is_admin').prop('checked'),
                isOnline: $('#is_online').prop('checked')
            };

            // Show loading spinner
            editUserBtn.addClass('d-none');

            editloadBtn.removeClass('d-none');


            // Send edited user data to the server
            fetch(`${base_url}/api/editUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to edit user');
                    }
                    return response.json();
                })
                .then(data => {
                    // Handle successful edit

                    userEdittxt.text(data.message);
                    userEditdiv.fadeIn();

                    populateUsersTable()
                })
                .catch(error => {
                    // Handle edit error
                    console.error('Error editing user:', error);



                    // Show error message
                    userEdittxt.text('Error editing user');
                    userEditdiv.fadeIn();
                })

                .finally(() => {


                    // Hide the modal after a short delay
                    setTimeout(() => {
                        editloadBtn.addClass('d-none');

                        editUserBtn.removeClass("d-none").fadeIn();

                        $('#editUserModal').modal('hide');

                        // Reset the form
                        $("#editUserForm")[0].reset();

                        userEditdiv.fadeOut();

                    }, 2000);
                });


        });
    };

    const exportUsers = async () => {
        const progressBar = $('#conversion-progress-bar');
    
        try {
            const users = await getUsers(user_info.organization);
    
            // Initialize progress bar
            progressBar.css('width', '0%');
            progressBar.attr('aria-valuenow', 0);
            progressBar.text('0%');
            $(".progress-div").fadeIn();
    
            if (users) {
                const csvRows = [];
                const headers = ['Name', 'Admin', 'Email', 'Location', 'Created Date', 'Last login', 'Online'];
                csvRows.push(headers.join(','));
    
                users.forEach((user, index) => {
                    const joinedDate = user.joined_date && user.joined_date.$date ? formatDate(user.joined_date.$date) : '';
                    const lastlogin = user.last_login && user.last_login.$date ? formatDate(user.last_login.$date) : '';
    
                    const row = [
                        `"${user.fullname}"`,
                        `"${user.is_admin}"`,
                        `"${user.email}"`,
                        `"${user.login_location.city}"`,
                        `"${joinedDate}"`,
                        `"${lastlogin}"`,
                        `"${user.is_online}"`
                    ];
                    csvRows.push(row.join(','));
    
                    // Update progress
                    const progress = Math.round((index + 1) / users.length * 100);
                    progressBar.css('width', `${progress}%`);
                    progressBar.attr('aria-valuenow', progress);
                    progressBar.text(`${progress}%`);
                });
    
                await showToast(
                    "! Download ",
                    `Your CSV file is ready`,
                    "top-center",
                    "rgba(0,0,0,0.2)",
                    "success"
                );
    
                $(".progress-div").fadeOut();
    
                // Trigger CSV download
                const csvContent = csvRows.join('\n');
                const csvFile = new Blob([csvContent], { type: 'text/csv' });
                const downloadLink = document.createElement('a');
                downloadLink.download = 'users.csv';
                downloadLink.href = window.URL.createObjectURL(csvFile);
                downloadLink.style.display = 'none';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }
        } catch (error) {
            console.error('Error exporting users:', error);
            $(".progress-div").fadeOut();
        }
    };

    $(".export-users").on("click",async function(){

        const conversionProgressBar = $('#conversion-progress-bar');
        $(".progress-div").fadeIn()
       
        await showToast(
            "! Users",
            `Getting Users from server please wait ..`,
            "top-center",
            "rgba(0,0,0,0.2)",
            "success"
        );

         // Reset and show progress bars
         conversionProgressBar.css('width', '0%').attr('aria-valuenow', 0).text('0%');

         // Convert data to CSV
          await exportUsers();

    })



    // Call the confirmEdit function


    confirmEdit();

    populateUsersTable()

    confirmDeleteUserHandler()

    //new table data each 3 seconds
    setInterval(function () {
        populateUsersTable()
    }, 4000)

});
