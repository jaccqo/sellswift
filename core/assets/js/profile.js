
  $(document).ready(function() {
    let base_url=user_info.base_url
    // Save Email Button Click Event
    $(".save-email").on("click",function() {
        var newEmail = $("#new-email").val();
        var emailPassword = $("#email-password").val();
        var statusSpan = $(".update-email-status");
        var user_id = user_info._id;
        var db_name = user_info.organization;

      
  
        // Check if all fields are filled
        if (newEmail.trim() === "" || emailPassword.trim() === "") {
          // Show status message
          statusSpan.text("Please fill in all fields.").fadeIn().delay(2000).fadeOut();
        } else {
          // Send data to Flask server
          statusSpan.text("Updating email please wait.").fadeIn();
          $.ajax({
            type: "POST",
            url: `${base_url}/api-updateEmail`, // Replace with your Flask route
            data: JSON.stringify({ 
              newEmail: newEmail,
              emailPassword: emailPassword,
              user_id: user_id,
              db_name: db_name
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(response) {
              console.log("Success:", response);
              statusSpan.text(`${response.message}`).fadeIn().delay(2000).fadeOut();

              $(".user-email").text(newEmail)
              newEmail.val("")
              emailPassword.val("")
              // Handle success response here
            },
            error: function(xhr, status, error) {
              console.error("Error:", error);
              statusSpan.text(`${error.message}`).fadeIn().delay(2000).fadeOut();
              // Handle error here
            }
          });
        }
      });

    // Save Password Button Click Event
    $(".save-password").on("click",function() {
        var currentPassword = $("#current-password").val();
        var newPassword = $("#new-password").val();
        var statusSpan = $(".update-password-status");
        var user_id = user_info._id;
        var db_name = user_info.organization;
  
        // Check if all fields are filled
        if (currentPassword.trim() === "" || newPassword.trim() === "") {
          // Show status message
          statusSpan.text("Please fill in all fields.").fadeIn().delay(2000).fadeOut();
        } else {
            statusSpan.text("Upating password please wait.").fadeIn();
          // Send data to Flask server
          $.ajax({
            type: "POST",
            url: `${base_url}/api-updatePassword`, // Replace with your Flask route
            data: JSON.stringify({
              currentPassword: currentPassword,
              newPassword: newPassword,
              user_id: user_id,
              db_name: db_name
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(response) {
              
              statusSpan.text(`${response.message}`).fadeIn().delay(2000).fadeOut();
              currentPassword.val("")
              newPassword.val("")
              // Handle success response here
            },
            error: function(xhr, status, error) {
              console.error("Error:", error);
              statusSpan.text(`${xhr.responseText}`).fadeIn().delay(2000).fadeOut();
              // Handle error here
            }
          });
        }
    });


  
        // Attach click event listener to the "Save" button
        $("#save-personal-infoBtn").on("click", function() {
          // Get the values of the input fields
          var fullName = $("#fullname").val();
          var bio = $("#userbio").val();
          var mobileNumber = $("#mobileNumber").val();  // New: Get the mobile number value
          var user_id = user_info._id;
          var db_name = user_info.organization;

          var statusSpan = $(".update-personalinfo-status");

          // Check if all input fields are empty
          if (fullName.trim() === "" && bio.trim() === "" && mobileNumber.trim() === "") {
              // Show error message and change badge to warning style
              statusSpan
                  .removeClass("badge-success-lighten text-success")
                  .addClass("badge-warning-lighten text-warning")
                  .text("Please fill out at least one field.")
                  .fadeIn().delay(2000).fadeOut();
              return; // Exit the function
          }

          // Set updating message and change badge to info style
          statusSpan
              .removeClass("badge-warning-lighten text-warning")
              .addClass("badge-info-lighten text-info")
              .text("Updating personal info.")
              .fadeIn();

          // Create a data object to send to the server
          var data = {
              fullName: fullName,
              bio: bio,
              mobileNumber: mobileNumber,  // New: Add the mobile number to the data object
              user_id: user_id,
              db_name: db_name
          };

          // Send the data to the server using AJAX
          $.ajax({
              url: `${base_url}/api/updatePersonalInfo`, // Replace with your Flask route
              method: 'POST', // Use POST method to send data
              data: JSON.stringify(data), // Convert data object to JSON string
              contentType: 'application/json', // Set content type header
              success: function(response) {
                  // Handle successful response from the server
                  console.log('Data saved successfully:', response);
                  statusSpan
                      .removeClass("badge-info-lighten text-info")
                      .addClass("badge-success-lighten text-success")
                      .text(`${response.message}`)
                      .fadeIn().delay(2000).fadeOut();

                  // Optionally, update the UI with the new data
                  if (fullName) {
                      $(".logged-user").text(fullName);
                  }
                  if (bio) {
                      $(".about-me").text(bio);
                  }
                  if (mobileNumber) {
                      $(".user-mobile").text(mobileNumber);  // New: Update mobile number display if applicable
                  }

                  // Clear the input fields
                  $("#fullname").val("");
                  $("#userbio").val("");
                  $("#mobileNumber").val("");  // New: Clear the mobile number field
              },
              error: function(xhr, status, error) {
                  // Handle error response from the server
                  console.error('Error:', error);
                  statusSpan
                      .removeClass("badge-info-lighten text-info")
                      .addClass("badge-danger-lighten text-danger")
                      .text(`Error: ${error}`)
                      .fadeIn().delay(2000).fadeOut();
              }
          });
        });



  });

