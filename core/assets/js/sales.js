$(document).ready(function () {
    let salesData = []; // To store sales data globally
  
    // Check if DataTable is already initialized, then destroy it before re-initializing
    if ($.fn.DataTable.isDataTable("#sales-datatable")) {
      $("#sales-datatable").DataTable().destroy();
    }
  
    // Initialize DataTable with export buttons and sorting enabled
    var table = $("#sales-datatable").DataTable({
      dom:
        "<'row'<'col-sm-12 col-md-4'l><'col-sm-12 col-md-4 text-center'B><'col-sm-12 col-md-4'f>>" + // Adds length menu, buttons, and search bar in the same row
        "<'row'<'col-sm-12'tr>>" + // Table rows
        "<'row'<'col-sm-5'i><'col-sm-7'p>>", // Info and pagination
      buttons: ["copy", "csv", "excel", "pdf"],
      language: {
        paginate: {
          previous: "<i class='mdi mdi-chevron-left'></i>",
          next: "<i class='mdi mdi-chevron-right'></i>",
        },
        searchPlaceholder: "Search Sale...",
        info: "Showing Sales _START_ to _END_ of _TOTAL_",
        lengthMenu:
          'Display <select class="form-select form-select-sm ms-1 me-1"><option value="5">5</option><option value="10">10</option><option value="20">20</option><option value="-1">All</option></select> Sales',
      },
      pageLength: 5,
      columns: [
        {
          orderable: false,
          targets: 0,
          render: function (e, l, a, o) {
            return (e =
              "display" === l
                ? '<div class="form-check"><input type="checkbox" class="form-check-input dt-checkboxes"><label class="form-check-label">&nbsp;</label></div>'
                : e);
          },
          checkboxes: {
            selectRow: true,
            selectAllRender:
              '<div class="form-check"><input type="checkbox" class="form-check-input dt-checkboxes"><label class="form-check-label">&nbsp;</label></div>',
          },
        },
        { orderable: true },
        { orderable: true },
        { orderable: true },
        { orderable: true },
        { orderable: true },
        { orderable: true },
        { orderable: true },
        { orderable: true },
        { orderable: true },
        { orderable: true },
        { orderable: true },
        { orderable: true },
        { orderable: true },
        { orderable: true },
        {
          // Add action buttons for edit and delete
          orderable: false,
          data: null,
          render: function (data, type, row) {
            const saleId = row[1]; // The second element in the array is the _id
            return `
              <div class="action-buttons">
                <button type="button" class="btn btn-sm btn-primary edit-sale" data-id="${saleId}" data-bs-toggle="modal" data-bs-target="#edit-sale-modal">
                  <i class="mdi mdi-pencil"></i>
                </button>
                <button type="button" class="btn btn-sm btn-danger delete-sale ms-2" data-id="${saleId}" data-bs-toggle="modal" data-bs-target="#delete-sale-modal">
                  <i class="mdi mdi-delete"></i>
                </button>
              </div>
            `;
          },
        },
      ],
      select: {
        style: "multi",
      },
      order: [[1, "asc"]],
      drawCallback: function () {
        // Adding classes for pagination and lengthMenu
        $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
        $("#sales-datatable_length label").addClass("form-label");
  
        // Check if the DataTables wrapper exists before modifying the columns
        const wrapperRow = document.querySelector(".dataTables_wrapper .row");
        if (wrapperRow) {
          const columns = wrapperRow.querySelectorAll(".col-md-6");
          columns.forEach(function (e) {
            e.classList.add("col-sm-6");
            e.classList.remove("col-sm-12");
            e.classList.remove("col-md-6");
          });
        }
      },
    });
  
    var base_url = user_info.base_url;
  
    const options = {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false, // Ensure 24-hour format
    };
  
    // Function to fetch and display data
    function fetchSalesData() {
      fetch(`${base_url}/api/sales-data?dbname=${user_info.organization}`)
        .then((response) => response.json())
        .then((data) => {
          salesData = data; // Store sales data globally for easy lookup
          table.clear();
  
          // Add new data
          data.forEach((sale) => {
            let itemDetails = sale.item_details
              .map((item) => `${item.name}`)
              .join("<br>");
  
            table
              .row.add([
                `<div class="form-check">
                      <input type="checkbox" class="form-check-input" />
                      <label class="form-check-label">&nbsp;</label>
                   </div>`,
                sale._id || "",
                sale.sales_person || "",
                itemDetails || "",
                sale.quantity || "",
                sale.reference_number || "",
                sale.payment_status || "",
                sale.payment_method || "",
                `ksh ${parseFloat(sale.purchase_amount).toLocaleString()}`,
                sale.tax || "",
                sale.total_discount || "",
                new Date(sale.timestamp).toLocaleString("en-US", options),
                sale.last_modified
                  ? new Date(sale.last_modified).toLocaleString("en-US", options)
                  : "",
                sale.sent_date
                  ? new Date(sale.sent_date).toLocaleString("en-US", options)
                  : "",
                sale.store_id || "",
                sale.notes || "",
                // Edit and delete action buttons
                `
                  <div class="action-buttons">
                    <button type="button" class="btn btn-sm btn-primary edit-sale" data-id="${sale._id}" data-bs-toggle="modal" data-bs-target="#edit-sale-modal">
                      <i class="mdi mdi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-danger delete-sale ms-2" data-id="${sale._id}" data-bs-toggle="modal" data-bs-target="#delete-sale-modal">
                      <i class="mdi mdi-delete"></i>
                    </button>
                  </div>
                `,
              ])
              .draw();
          });
        })
        .catch((error) => console.error("Error fetching sales data:", error));
    }
  
    // Initial data fetch
    fetchSalesData();
  
    // Refresh data every minute
    setInterval(fetchSalesData, 60000); // Fetch new data every minute

    function toggleCashAmount() {
      var paymentMethod = document.getElementById("edit-payment-method").value;
      var cashAmountDiv = document.getElementById("cashAmountDiv");
      
      if (paymentMethod === "cash") {
        cashAmountDiv.classList.remove("d-none");
      } else {
        cashAmountDiv.classList.add("d-none");
      }
    }
  
    // Handle edit button click to fetch and populate modal with data via AJAX
    $(document).on("click", ".edit-sale", function () {
      const saleId = $(this).data("id");

        // Attach the sale ID to the form so it can be used later when saving
      $("#edit-sale-form").data("id", saleId);
      

     
  
      // Get the button element
      const editButton = $(this);
  
      // Change the icon to a spinner
      editButton.find("i").removeClass("mdi-pencil").addClass("mdi-loading mdi-spin");
  
      // Perform AJAX call to fetch sale data by ID
      $.ajax({
        url: `${base_url}/api/sale/?sale_id=${saleId}&dbname=${user_info.organization}`, // API to get individual sale data
        method: "GET",
        success: function (sale) {
          // Safely parse the timestamp from the response
          const timestamp = sale.timestamp ? new Date(sale.timestamp) : null;
          const lastModified = sale.last_modified ? new Date(sale.last_modified) : null;
          const sentDate = sale.sent_date ? new Date(sale.sent_date) : null;

          let itemDetails = sale.items
              .map((item) => `${item.name}`)
              .join(" , ");
  
          // Populate the modal fields with the sale data
          $("#edit-reference-number").val(sale.reference_number || "");
          $("#edit-sales-person").val(sale.sales_person || "");
          $("#edit-item-details").val(itemDetails);
          $("#edit-quantity").val(sale.items.length || ""); // Example of how to display quantity, modify as needed
          $("#edit-payment-status").val(sale.payment_status || "");
          $("#edit-payment-method").val(sale.payment_method || "");
          $("#edit-purchase-amount").val(parseFloat(sale.purchase_amount) || "");
          $("#edit-tax").val(sale.tax || "");
          $("#edit-total-discount").val(sale.total_discount || "");
  
          // Handle timestamp formatting for the date inputs
          if (timestamp) {
            $("#edit-timestamp").val(timestamp.toISOString().slice(0, 16)); // Ensure the correct format for input type="datetime-local"
          }
          if (lastModified) {
            $("#edit-last-modified").val(lastModified.toISOString().slice(0, 16));
          }
          if (sentDate) {
            $("#edit-sent-date").val(sentDate.toISOString().slice(0, 16));
          }
  
          $("#edit-store-id").val(sale.store_id || "");
          $("#edit-notes").val(sale.notes || "");
  
          // Revert the spinner back to the edit icon
          editButton.find("i").removeClass("mdi-loading mdi-spin").addClass("mdi-pencil");
        },
        error: function (xhr, status, error) {
          console.error("Error fetching sale data:", error);
  
          // Revert the spinner back to the edit icon even if there's an error
          editButton.find("i").removeClass("mdi-loading mdi-spin").addClass("mdi-pencil");
        },
      });
    });




    $("#save-sale-btn").click(function (e) {
        e.preventDefault(); // Prevent form from submitting normally

        const saleId = $("#edit-sale-form").data("id");

        var organization = user_info.organization;  // Fetch the organization from the user's info
        
        // Show spinner while waiting for response
        $("#save-sale-btn").html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...').attr("disabled", true);

        // Collect form data
        var saleData = {
            reference_number: $("#edit-reference-number").val(),
            sales_person: $("#edit-sales-person").val(),
            item_details: $("#edit-item-details").val(),
            quantity: $("#edit-quantity").val(),
            payment_status: $("#edit-payment-status").val(),
            payment_method: $("#edit-payment-method").val(),
            purchase_amount: $("#edit-purchase-amount").val(),
            tax: $("#edit-tax").val(),
            total_discount: $("#edit-total-discount").val(),
            timestamp: $("#edit-timestamp").val(),
            last_modified: $("#edit-last-modified").val(),
            sent_date: $("#edit-sent-date").val()
        };

        // AJAX POST request to send data to the backend
        $.ajax({
            url: `${base_url}/api/sale/?sale_id=${saleId}&dbname=${organization}`,  // Dynamic URL based on sale ID and organization
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(saleData),
            success: function (response) {
                // Handle success response
                showToast("Success", "Sale saved successfully.", "top-center", "rgba(0,0,0,0.2)", "success");
                
                // Reset spinner and button
                $("#save-sale-btn").html('Save changes').removeAttr("disabled");

                // Optionally close the modal
                $("#edit-sale-modal").modal('hide');
            },
            error: function (xhr, status, error) {
                // Handle error response
                showToast("Error", "Failed to save the sale. Please try again.", "top-center", "rgba(0,0,0,0.2)", "error");
                
                // Reset spinner and button
                $("#save-sale-btn").html('Save changes').removeAttr("disabled");
            }
        });
    });





  
    // Handle delete button click to trigger modal and set sale ID
    $(document).on("click", ".delete-sale", function () {
      const saleId = $(this).data("id");
      // Set the saleId in the delete confirmation modal
      $("#confirm-delete").data("sale-id", saleId);
    });
  
    // Handle delete confirmation
    $("#confirm-delete").on("click", function () {
      const saleId = $(this).data("sale-id");
  
      // Change the button to show a spinner while waiting for the delete request
      $(this).html(`
        <button class="btn btn-danger" type="button" disabled>
          <span class="spinner-grow spinner-grow-sm me-1" role="status" aria-hidden="true"></span>
          Deleting...
        </button>
      `);
  
      // Perform AJAX call to delete the sale
      $.ajax({
        url: `${base_url}/api/sale/?sale_id=${saleId}&dbname=${user_info.organization}`, // API to delete sale
        method: "DELETE",
        success: function (response) {
          // Revert the button back to original state after successful deletion
          $("#confirm-delete").html('<i class="mdi mdi-delete"></i> Confirm');
  
          // Remove the deleted row from the DataTable
          table.row($(`.delete-sale[data-id='${saleId}']`).parents('tr')).remove().draw();
  
          // Close the modal after deletion is successful
          $("#delete-sale-modal").modal("hide");
        },
        error: function (xhr, status, error) {
          console.error("Error deleting sale:", error);
  
          // Revert the button back to original state in case of an error
          $("#confirm-delete").html('<i class="mdi mdi-delete"></i> Confirm');
        },
      });
    });
  });
  