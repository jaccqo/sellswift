$(document).ready(function () {
  let salesData = []; // To store sales data globally

  // Check if DataTable is already initialized, then destroy it before re-initializing
  if ($.fn.DataTable.isDataTable("#sales-datatable")) {
      $("#sales-datatable").DataTable().destroy();
  }

  // Initialize DataTable with export buttons and sorting enabled
  var table = $("#sales-datatable").DataTable({
      dom:
          "<'row'<'col-sm-12 col-md-4'l><'col-sm-12 col-md-4 text-center'B><'col-sm-12 col-md-4'f>>" +
          "<'row'<'col-sm-12'tr>>" +
          "<'row'<'col-sm-5'i><'col-sm-7'p>>",
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
              render: function () {
                  return '<div class="form-check"><input type="checkbox" class="form-check-input dt-checkboxes"><label class="form-check-label">&nbsp;</label></div>';
              },
              checkboxes: {
                  selectRow: true,
              },
          },
          { orderable: true }, // ID
          { orderable: true }, // Sales Person
          { orderable: true }, // Product Name
          { orderable: true }, // Quantity
          { orderable: true }, // Reference Number
          { orderable: true }, // Payment Status
          { orderable: true }, // Sale Type
          { orderable: true }, // Paid Amount
          { orderable: true }, // Tax
          { orderable: true }, // Total Discount
          { orderable: true }, // Timestamp
          { orderable: true }, // Last Modified
          { orderable: true }, // Sent Date
          { orderable: true }, // Store ID
          { orderable: true }, // Notes
          
          {
              // Add action buttons for edit and delete
              orderable: false,
              data: null,
              render: function (data, type, row) {
                  const saleId = row[1];
                  return `
                      <div class="action-buttons">
                          <button type="button" class="btn btn-sm btn-primary edit-sale" data-id="${saleId}" data-bs-toggle="modal" data-bs-target="#edit-sale-modal">
                              <i class="mdi mdi-pencil"></i>
                          </button>
                          <button type="button" class="btn btn-sm btn-danger delete-sale ms-2" data-id="${saleId}" data-bs-toggle="modal" data-bs-target="#delete-sale-modal">
                              <i class="mdi mdi-delete"></i>
                          </button>

                          <button type="button" class="btn btn-sm btn-info open-sale" data-id="${saleId}" data-bs-toggle="modal" data-bs-target="#open-sale-modal">
                          <i class="mdi mdi-open-in-new"></i> Open on POS
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
          $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
          $("#sales-datatable_length label").addClass("form-label");

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
      hour12: false,
  };

  // Function to fetch and display data
  function fetchSalesData() {
      fetch(`${base_url}/api/sales-data?dbname=${user_info.organization}`)
          .then((response) => response.json())
          .then((data) => {
              salesData = data;
              table.clear();

              // Add new data
              data.forEach((sale) => {
                  let itemDetails = sale.item_details.map((item) => `${item.name}`).join("<br>");
                  table.row.add([
                      `<div class="form-check"><input type="checkbox" class="form-check-input" /><label class="form-check-label">&nbsp;</label></div>`,
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
                      `
                          <button type="button" class="btn btn-sm btn-info open-sale" data-id="${sale._id}" data-bs-toggle="modal" data-bs-target="#open-sale-modal">
                              <i class="mdi mdi-open-in-new"></i> Open on POS
                          </button>
                      `,
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
                  ]).draw();
              });
          })
          .catch((error) => console.error("Error fetching sales data:", error));
  }

  // Initial data fetch
  fetchSalesData();

  // Refresh data every minute
  setInterval(fetchSalesData, 60000);

  // Handle "Open on POS" button click
  $(document).on("click", ".open-sale", function () {
      const saleId = $(this).data("id");
      $("#confirm-open-sale").data("sale-id", saleId);
  });

  $("#confirm-open-sale").on("click", function () {
      const saleId = $(this).data("sale-id");

      $(this).html(`
          <button class="btn btn-info" type="button" disabled>
              <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Opening...
          </button>
      `);

      $.ajax({
        url: `${base_url}/api/open-sale/?sale_id=${saleId}&dbname=${user_info.organization}`,
        method: "POST",
        success: function () {
            // Reset the button and close the modal
            $("#confirm-open-sale").html('Open Sale').removeAttr("disabled");
            $("#open-sale-modal").modal("hide");
    
            // Show success toast notification
            showToast("Success", "Sale opened on POS successfully.", "top-center", "rgba(0,0,0,0.2)", "success");
    
            // Redirect to the POS page with sale_id as a parameter
            const posPageUrl = `pos.html?sale_id=${saleId}`;
            window.location.href = posPageUrl;
        },
        error: function (xhr, status, error) {
            console.error("Error opening sale on POS:", error);
    
            // Reset the button in case of error
            $("#confirm-open-sale").html('Open Sale').removeAttr("disabled");
    
            // Show error toast notification
            showToast("Error", "Failed to open sale on POS. Please try again.", "top-center", "rgba(0,0,0,0.2)", "error");
        },
    });
    
  });

  // Handle edit button click
  $(document).on("click", ".edit-sale", function () {
      const saleId = $(this).data("id");
      $("#edit-sale-form").data("id", saleId);

      const editButton = $(this);
      editButton.find("i").removeClass("mdi-pencil").addClass("mdi-loading mdi-spin");

      $.ajax({
          url: `${base_url}/api/sale/?sale_id=${saleId}&dbname=${user_info.organization}`,
          method: "GET",
          success: function (sale) {
              // Populate modal fields
              $("#edit-reference-number").val(sale.reference_number || "");
              $("#edit-sales-person").val(sale.sales_person || "");
              $("#edit-item-details").val(sale.items.map((item) => item.name).join(", "));
              $("#edit-quantity").val(sale.quantity || "");
              $("#edit-payment-status").val(sale.payment_status || "");
              $("#edit-payment-method").val(sale.payment_method || "");
              $("#edit-purchase-amount").val(sale.purchase_amount || "");
              $("#edit-tax").val(sale.tax || "");
              $("#edit-total-discount").val(sale.total_discount || "");
              $("#edit-timestamp").val(sale.timestamp || "");
              $("#edit-last-modified").val(new Date().toISOString());
              $("#edit-store-id").val(sale.store_id || "");
              $("#edit-notes").val(sale.notes || "");

              editButton.find("i").removeClass("mdi-loading mdi-spin").addClass("mdi-pencil");
          },
          error: function () {
              editButton.find("i").removeClass("mdi-loading mdi-spin").addClass("mdi-pencil");
          },
      });
  });

  // Handle delete button click
  $(document).on("click", ".delete-sale", function () {
      const saleId = $(this).data("id");
      $("#confirm-delete").data("sale-id", saleId);
  });

  $("#confirm-delete").on("click", function () {
      const saleId = $(this).data("sale-id");

      $(this).html(`
          <button class="btn btn-danger" type="button" disabled>
              <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Deleting...
          </button>
      `);

      $.ajax({
          url: `${base_url}/api/sale/?sale_id=${saleId}&dbname=${user_info.organization}`,
          method: "DELETE",
          success: function () {
              $("#confirm-delete").html('<i class="mdi mdi-delete"></i> Confirm');
              table.row($(`.delete-sale[data-id='${saleId}']`).parents("tr")).remove().draw();
              $("#delete-sale-modal").modal("hide");
          },
          error: function () {
              $("#confirm-delete").html('<i class="mdi mdi-delete"></i> Confirm');
          },
      });
  });
});
