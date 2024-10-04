$(document).ready(function () {
    let base_url = user_info.base_url;

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

    function populateInventoryTable(inventoryData) {
        const table = $('#products-datatable').DataTable();
        table.clear();
        inventoryData.forEach(item => {
            table.row.add([
                `<input type="checkbox" class="form-check-input" id="customCheck${item._id}">`,
                `<img src="data:image/png;base64,${item.image}" title="Product Image" class="rounded me-3" height="48" alt="Base64 Image"/>
                <p class="m-0 d-inline-block align-middle font-16">${item.name}</p>`,
                item.category,
                `ksh ${parseFloat(item.price).toLocaleString()}`,
                item.stock,
                `<span class="badge ${item.status ? 'bg-success' : 'bg-danger'}">${item.status}</span>`,
                `<a href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="left" title="Inventory products" class="action-icon addInventoryproduct" data-inventoryproduct="${item._id}"><i class="mdi mdi-plus"></i></a>
                <a href="javascript:void(0);" class="action-icon" data-bs-toggle="tooltip" data-bs-placement="right" title="Edit inventory"><i class="mdi mdi-square-edit-outline editInventory" data-editinventory="${item._id}"></i></a>
                <a href="javascript:void(0);" class="action-icon" data-bs-toggle="tooltip" data-bs-placement="left" title="Delete inventory"><i class="mdi mdi-delete deleteInventory" data-deleteinventory="${item._id}"></i></a>`
            ]);
        });
        table.draw();
    }

    ipcRenderer.on('initial-data', (event, initialData) => {
        populateInventoryTable(initialData);
        setupEventHandlers();
    });

    ipcRenderer.on('new-data', (event, newData) => {
        populateInventoryTable(newData);
        setupEventHandlers();
    });

    const inputElement = document.getElementById('itemImage');
    const pond_one = FilePond.create(inputElement, {
        allowFileTypeValidation: true,
        labelFileTypeNotAllowed: true,
        acceptedFileTypes: ['image/*']
    });

    $('#addProductsBtn').click(function () {
        $('#addProductsModal').modal('show');
    });

    $('#addProductForm').submit(async function (event) {
        event.preventDefault();
        $(".addinventory-load").removeClass("d-none");
        $(".addinventory").addClass("d-none");
    
        const files = pond_one.getFiles();
        let file_path = files.length ? files[0].file.path : "./images/brand-identity.png";
    
        const item = {
            name: $('#itemNameInput').val(),
            image: file_path,
            category: $('#itemCategoryInput').val(),
            price: $('#itemPrice').val(),
            status: $('#itemStatusInput').prop('checked'),
            itemBarcode: $('#barcodeScan').val() || $('#barcodeManual').val(),
            barcodeQuantity: $('#barcodeQuantity').val(),
            markupPercentage: $('#markupPercentage').val()  // Added the markup percentage
        };
    
        try {
            const result = await ipcRenderer.Insertinventory(item);
            if (result.message === "Item inserted successfully") {
                $('#addProductsModal').modal('toggle');
                showToast("! Inventory added", result.message, "top-center", "rgba(0,0,0,0.2)", "success");
            }
        } catch (error) {
            showToast("Oh snap!", error.toString(), "top-center", "rgba(0,0,0,0.2)", "error");
        }
    
        $(".addinventory").removeClass("d-none");
        $(".addinventory-load").addClass("d-none");
        $(this)[0].reset();
        ipcRenderer.send('request-initial-data');
    });
    

    function setupEventHandlers() {
        handleInventoryDeletion();
        handleAddInventoryProduct();
        handleEditInventory();
        handleDeleteInventoryBarcode();
    }

    function handleInventoryDeletion() {
        $('#products-datatable').off('click', '.deleteInventory');
        $('#products-datatable').on('click', '.deleteInventory', function () {
            const itemId = $(this).data('deleteinventory');
            $("#deleteItemModal").attr("data-itemid", itemId);
            $('#deleteItemModal').modal('show');
        });

        $('#confirmDeleteBtn').off('click');
        $('#confirmDeleteBtn').on('click', async function () {
            $(".deletion-load").removeClass("d-none");
            $(this).addClass("d-none");
            const item_id = $("#deleteItemModal").attr("data-itemid");

            const response = await ipcRenderer.DeleteInventory(item_id);
            if (response.message === "Inventory item deleted successfully") {
                ipcRenderer.send('request-initial-data');
                showToast("! Inventory deleted", response.message, "top-center", "rgba(0,0,0,0.2)", "success");
                $('#deleteItemModal').modal('hide');
            } else {
                showToast("Oh snap!", "Something went wrong", "top-center", "rgba(0,0,0,0.2)", "error");
            }

            $(".deletion-load").addClass("d-none");
            $(this).removeClass("d-none");
        });
    }

    let active_inventory = null;
    let active_inventoryid = null;

    function handleAddInventoryProduct() {
        $('#products-datatable').off('click', '.addInventoryproduct');
        $('#products-datatable').on('click', '.addInventoryproduct', function () {
            const itemId = $(this).data('inventoryproduct');
            const row_text = $(this).closest('tr').find('td:eq(1) p').text();

            InventoryGetBarcodes(itemId, row_text);
            active_inventoryid = itemId;
            active_inventory = row_text;

            $("#fullWidthModalLabelProducts").text(`${row_text} products Barcodes `);
            $("#barcodes-modal").modal("toggle");
        });
    }

    $('#barcodeInput').keypress(function (event) {
        if (event.which === 13) {
            const inputValue = $(this).val();
            $("#barcode-loading").removeClass("d-none").fadeIn(500);

            const data = { dbname: user_info.organization, inventory_id_: active_inventoryid, barcode: inputValue };

            $.ajax({
                url: `${base_url}/api/add-barcode`,
                method: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(data),
                success: function (response) {
                    const { barcode, date_added } = response.barcodes.barcode;
                    const barcode_edit = `
                        <div class="d-flex align-items-center">
                            <a href="javascript:void(0);" class="action-icon" data-bs-toggle="tooltip" data-bs-placement="left" title="Delete inventory barcode">
                                <i class="mdi mdi-delete deleteInventoryBarcode text-success" data-deletebarcode="${barcode}"></i>
                            </a>
                            <h5 class="mb-0 ms-2">
                                <span id="barcode_status_${barcode}" class="badge badge-warning-lighten d-none"></span>
                                <span id="loading_${barcode}" class="spinner-border spinner-border-sm text-warning d-none" role="status"></span>
                            </h5>
                        </div>`;

                    $("#barcode-load-text").text(response.message);
                    barcode_table.row.add([active_inventory, barcode, date_added, barcode_edit]).draw();
                    ipcRenderer.send('request-initial-data');
                },
                error: function (xhr, status, error) {
                    $("#barcode-load-text").text("Failed to add barcode. Please try again.");
                }
            });

            $("#barcode-loading").fadeOut(1000).addClass("d-none");
            $(this).val('');
        }
    });

    var barcode_table = $('#BarcodeTable').DataTable();

    function InventoryGetBarcodes(inventoryId, inventoryname) {
        barcode_table.clear();
        const dataToSend = JSON.stringify({ dbname: user_info.organization, inventoryId });

        $.ajax({
            url: `${base_url}/api/get-barcodes`,
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            data: dataToSend,
            success: function (response) {
                console.log("Received response:", response); // Add this line to debug the response
                if (response.barcodes && typeof response.barcodes === 'object') {
                    const barcodes = Object.entries(response.barcodes);
                    if (barcodes.length > 0) {
                        barcodes.forEach(([barcode, barcode_info]) => {
                            const barcode_edit = `
                                <div class="d-flex align-items-center">
                                    <a href="javascript:void(0);" class="action-icon" data-bs-toggle="tooltip" data-bs-placement="left" title="Delete inventory barcode">
                                        <i class="mdi mdi-delete deleteInventoryBarcode text-success" data-deletebarcode="${barcode_info.barcode}"></i>
                                    </a>
                                    <h5 class="mb-2 ms-2">
                                        <span id="barcode_status_${barcode_info.barcode}" class="badge badge-warning-lighten d-none"></span>
                                        <span id="loading_${barcode_info.barcode}" class="spinner-border spinner-border-sm text-warning d-none" role="status"></span>
                                    </h5>
                                </div>`;
                            barcode_table.row.add([inventoryname, barcode, barcode_info.date_added || null, barcode_edit]).draw();
                        });
                    } else {
                        barcode_table.row.add(["No data", "", "", ""]).draw();
                    }
                }
            },
            error: function (xhr, status, error) {
                console.error("Error sending data:", error);
            }
        });
    }

    const inputElement_two = document.getElementById('edititemImage');
    const pond_two = FilePond.create(inputElement_two, {
        allowFileTypeValidation: true,
        labelFileTypeNotAllowed: true,
        acceptedFileTypes: ['image/*']
    });

    async function handleEditInventory() {
        $('#products-datatable').off('click', '.editInventory');
        $('#products-datatable').on('click', '.editInventory', async function () {
            const itemId = $(this).data('editinventory');
            const row_text = $(this).closest('tr').find('td:eq(1) p').text();
    
            try {
                const response = await fetch(`${base_url}/api/get-item/${itemId}?dbname=${user_info.organization}`);
                const result = await response.json();
    
                if (result.success) {
                    const item = result.data;
                    console.log(item);
    
                    // Populate the edit form fields
                    $("#edititemNameInput").val(item.name);
                    $("#edititemCategoryInput").val(item.category);
                    $("#edititemPrice").val(item.price);
                    $("#edititemStatusInput").prop('checked', item.status);
                    $('#editbarcodeManual').val(item.itemBarcode);
                    $("#editbarcodeQuantity").val(item.stock);
                    $("#editMarkupPercentage").val(item.markupPercentage); // Set the markup percentage value
    
                    $("#inventoryname").text(`Edit ${row_text} inventory`);
                    $("#EditProductsModal").data('itemid', itemId).modal("toggle");
                } else {
                    showToast("Oh snap!", result.error, "top-center", "rgba(0,0,0,0.2)", "error");
                }
            } catch (error) {
                showToast("Oh snap!", error.toString(), "top-center", "rgba(0,0,0,0.2)", "error");
            }
        });
    }
    
    $("#save-editInventory").on("click", async function (event) {
        event.preventDefault();
        $(".editinventory-load").removeClass("d-none");
        $(this).addClass("d-none");
    
        const itemId = $("#EditProductsModal").data('itemid');
        const name = $('#edititemNameInput').val();
        const category = $('#edititemCategoryInput').val();
        const price = $('#edititemPrice').val();
        const status = $('#edititemStatusInput').prop('checked');
        const itemBarcode = $('#editbarcodeScan').val() || $('#editbarcodeManual').val();
        const barcodeQuantity = $('#editbarcodeQuantity').val();
        const markupPercentage = $('#editMarkupPercentage').val();  // Added markup percentage
    
        const files = pond_two.getFiles();
        let file_path = files.length ? files[0].file.path : "./core/assets/images/brand-identity.png";
    
        const base64_img_ = file_path ? await ipcRenderer.returnBase64file(file_path) : null;
    
        const formData = {
            dbname: user_info.organization,
            itemId,
            name,
            category,
            price,
            status,
            itemBarcode,
            barcodeQuantity,
            markupPercentage,  // Include markup percentage in the formData
            fileData: base64_img_
        };
    
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: `${base_url}/api/edit-inventory`,
            data: JSON.stringify(formData),
            dataType: "json",
            success: function (response) {
                showToast("! Inventory edited", response.message, "top-center", "rgba(0,0,0,0.2)", "success");
                ipcRenderer.send('request-initial-data');
                $("#save-editInventory").removeClass("d-none");
                $(".editinventory-load").addClass("d-none");
                $("#EditProductsModal").modal("hide");
            },
            error: function (xhr, status, error) {
                showToast("! error", error.toString(), "top-center", "rgba(0,0,0,0.2)", "error");
                $("#save-editInventory").removeClass("d-none");
                $(".editinventory-load").addClass("d-none");
            }
        });
    
        $('#edititemNameInput, #edititemCategoryInput, #edititemPrice, #edititemMarkupInput').val("");
    });
    

    function handleDeleteInventoryBarcode() {
        $(document).off('click', '.deleteInventoryBarcode');
        $(document).on('click', '.deleteInventoryBarcode', function () {
            const deleteBarcode = $(this).data('deletebarcode');
            const spinnerElement = $(`#loading_${deleteBarcode}`);
            const barcode_spinner_text = $(`#barcode_status_${deleteBarcode}`);
            spinnerElement.removeClass('d-none');
            barcode_spinner_text.removeClass('d-none').text("Deleting barcode");

            const inventory_deletion_bcode_data = {
                dbname: user_info.organization,
                inventoryid: active_inventoryid,
                barcode: deleteBarcode
            };

            $.ajax({
                type: "POST",
                contentType: "application/json",
                url: `${base_url}/api/delete-inventory-barcode`,
                data: JSON.stringify(inventory_deletion_bcode_data),
                dataType: "json",
                success: function (response) {
                    barcode_spinner_text.text(response.message);
                    setTimeout(() => {
                        spinnerElement.addClass('d-none');
                        barcode_spinner_text.addClass('d-none');
                        InventoryGetBarcodes(active_inventoryid, active_inventory);
                        ipcRenderer.send('request-initial-data');
                    }, 2000);
                },
                error: function (xhr, status, error) {
                    barcode_spinner_text.text(`Error: ${error}`);
                    setTimeout(() => {
                        spinnerElement.addClass('d-none');
                        barcode_spinner_text.addClass('d-none');
                    }, 2000);
                }
            });
        });
    }

    async function downloadCSV(csv, filename) {
        const csvFile = new Blob([csv], { type: 'text/csv' });
        const downloadLink = document.createElement('a');
        downloadLink.download = filename;
        downloadLink.href = window.URL.createObjectURL(csvFile);
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    async function convertToCSV(data) {
        const progressBar = $('#conversion-progress-bar');
        progressBar.css('width', '0%').attr('aria-valuenow', 0).text('0%');

        const csvRows = [];
        const headers = ['Product', 'Category', 'Price', 'Stock Quantity', 'Active', 'Date added'];
        csvRows.push(headers.join(','));

        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const row = [
                `"${item.name}"`,
                `"${item.category}"`,
                `"${parseFloat(item.price).toLocaleString()}"`,
                `"${item.stock}"`,
                `"${item.status}"`,
                `"${item.date_created}"`
            ];
            csvRows.push(row.join(','));

            const progress = Math.round((i + 1) / data.length * 100);
            progressBar.css('width', `${progress}%`).attr('aria-valuenow', progress).text(`${progress}%`);
        }

        showToast("! Download ", "Your CSV file is ready", "top-center", "rgba(0,0,0,0.2)", "success");
        $(".progress-div").fadeOut();

        return csvRows.join('\n');
    }

    $(".export-inventory").on("click", async function () {
        const conversionProgressBar = $('#conversion-progress-bar');
        $(".progress-div").fadeIn();
        showToast("! Inventory ", "Getting Data from server please wait ..", "top-center", "rgba(0,0,0,0.2)", "success");

        conversionProgressBar.css('width', '0%').attr('aria-valuenow', 0).text('0%');

        const inventory_data = await ipcRenderer.GetInventory();
        const csv = await convertToCSV(inventory_data);
        await downloadCSV(csv, "inventory.csv");
    });

    setupEventHandlers();
});
