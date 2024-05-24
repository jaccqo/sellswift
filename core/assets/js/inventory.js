$(document).ready(function(){
    let base_url="http://192.168.100.14:5000"
    

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

        // Assuming you have already initialized DataTables on the table with ID 'inventoryTable'
        var table = $('#products-datatable').DataTable();
    
        // Clear existing data
        table.clear();
    
        // Add new data
        inventoryData.forEach(item => {
            
            table.row.add([
                `<input type="checkbox" class="form-check-input" id="customCheck${item._id}">`,
                `<img src="data:image/png;base64,${item.image}"  title="Product Image" class="rounded me-3" height="48" alt="Base64 Image"/>` +
                `<p class="m-0 d-inline-block align-middle font-16">` +
                `${item.name}<br/>` +
                `<!-- Star ratings --></p>`,
                item.category,
                item.price,
                item.stock,
                `<span class="badge ${item.status ? 'bg-success' : 'bg-danger'}">${item.status}</span>`,
                `<a href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="left" title="Inventory products" class="action-icon addInventoryproduct"  data-inventoryproduct="${item._id}"><i class="mdi mdi-plus"></i></a>` +
                `<a href="javascript:void(0);" class="action-icon" data-bs-toggle="tooltip" data-bs-placement="right" title="Edit inventory" ><i class="mdi mdi-square-edit-outline editInventory"  data-editinventory="${item._id}"></i></a>` +
                `<a href="javascript:void(0);" class="action-icon" data-bs-toggle="tooltip" data-bs-placement="left" title="Delete inventory"><i class="mdi mdi-delete deleteInventory"  data-deleteinventory="${item._id}"></i></a>`
            ]);
            

           
        });
    
        // Redraw the table to reflect the changes
        table.draw();
    }
    
                                                                                                       
    ipcRenderer.on('initial-data', (event, initialData) => {
        // Update UI with initial data
        populateInventoryTable(initialData)
        inventoryDeletion();
        add_inventory_prod();
        edit_inventory();
 
    });

    // Listen for new data from the main process
    ipcRenderer.on('new-data', (event, newData) => {

        populateInventoryTable(newData)
        inventoryDeletion();
        add_inventory_prod();
        edit_inventory();
 
        // Update UI with new data
    });



    const inputElement = document.getElementById('itemImage');
   
    const pond_one = FilePond.create(inputElement, {
        allowFileTypeValidation:true,
        labelFileTypeNotAllowed:true,
        acceptedFileTypes: ['image/*']
    });
    

    $('#addProductsBtn').click(function() {
        $('#addProductsModal').modal('show');
    });



    $('#addProductForm').submit(async function(event) {

        event.preventDefault();

        $(".addinventory-load").removeClass("d-none");
        $(".addinventory-load").removeClass("d-none");

        $(".addinventory").addClass("d-none");

        // Get the FilePond file objects
        const files = pond_one.getFiles();

        // Create a FormData object and append each file to it
        let file_path ;
        files.forEach(file => {
            file_path=file.file.path;
        });
        if(!file_path){
            file_path="./images/brand-identity.png"
        }



        const itemName = $('#itemNameInput').val();
        const itemCategory = $('#itemCategoryInput').val();
        const itemPrice = $('#itemPrice').val();
        const itemStatus = $('#itemStatusInput').prop('checked'); // Checkbox value
      

        const item = {
            name: itemName,
            image: file_path,
            category:itemCategory,
            price: itemPrice,
            status: itemStatus,

        };


        try {
            const result = await ipcRenderer.Insertinventory(item);
            console.log(result); // Handle result
            ipcRenderer.send('request-initial-data');

            if (result.message==="Item inserted successfully"){
                $('#addProductsModal').modal('toggle');

                showToast(
                    "! Inventory added",
                    `${result.message}`,
                    "top-center",
                    "rgba(0,0,0,0.2)",
                    "success"
                );

            }

        } catch (error) {
            console.error(error); // Handle error
            showToast(
                "Oh snap!",
                `${errror}`,
                "top-center",
                "rgba(0,0,0,0.2)",
                "error"
            );
        }


        $(".addinventory").removeClass("d-none");
        $(".addinventory").removeClass("d-none");

        $(".addinventory-load").addClass("d-none");

        

    });


const inventoryDeletion=()=>{

    $('.deleteInventory').on('click', function() {
        // Get the ID of the item to be deleted
        const itemId = $(this).data('deleteinventory');
        
        // Set the delete button click event to open the modal
        $('#deleteItemModal').modal('show');
        
        // Handle delete confirmation
        $('#confirmDeleteBtn').on('click',async function() {
            $(".deletion-load").removeClass("d-none");
            $(".deletion-load").removeClass("d-none");

            $(this).addClass("d-none");
          // Call a function to delete the item (implement this function as needed)
         

         const Response = await ipcRenderer.DeleteInventory(itemId)

         if (Response.message==="Inventory item deleted successfully"){

            ipcRenderer.send('request-initial-data');

            showToast(
                "! Inventory deleted",
                `${Response.message}`,
                "top-center",
                "rgba(0,0,0,0.2)",
                "success"
            );
          
            // Close the modal
            $('#deleteItemModal').modal('hide');

         }
         else{

            showToast(
                "Oh snap!",
                `something went wrong`,
                "top-center",
                "rgba(0,0,0,0.2)",
                "error"
            );

         }


         $(".deletion-load").addClass("d-none");

         $(this).removeClass("d-none");
         $(this).removeClass("d-none");

        
        });
      });
}


var active_inventory=null
var active_inventoryid=null


const add_inventory_prod=()=>{

    $('.addInventoryproduct').click(function() {
        var itemId = $(this).data('inventoryproduct');

        
        var row_text = $(this).closest('tr').find('td:eq(1) p').text();
        
        InventoryGetBarcodes(itemId,row_text)

        active_inventoryid=itemId

        active_inventory=row_text

        $("#fullWidthModalLabelProducts").text(`${row_text} products Barcodes `)

        $("#barcodes-modal").modal("toggle");

       


    });

}

// Attach keypress event listener to the barcode input field
$('#barcodeInput').keypress(function(event) {
    // Check if the key pressed is Enter (key code 13)
    if (event.which === 13) {
        // Get the value of the input field
        var inputValue = $(this).val();


        $("#barcode-loading").removeClass("d-none")

        $("#barcode-loading").fadeOut(0)

        $("#barcode-loading").fadeIn(500)

         var data={dbname:user_info.organization,inventory_id_:active_inventoryid,barcode: inputValue}

         $.ajax({
            url: `${base_url}/api/add-barcode`,
            method: 'POST',
            contentType:'application/json',
            dataType:'json',

            data: JSON.stringify(data),
            success: function(response) {
               
                resp_barcode_info=response.barcodes.barcode

                const bar_code_=resp_barcode_info.barcode

                const date_added_=resp_barcode_info.date_added

                const barcodes_edit_ = `<a href="javascript:void(0);" class="action-icon" data-bs-toggle="tooltip" data-bs-placement="left" title="Delete inventory barcode"><i class="mdi mdi-delete deleteInventoryBarcode" data-deletebarcode="${bar_code_}"></i></a>` +
                      `<h5><span id="barcode_status_${bar_code_}" class="badge badge-warning-lighten d-none"></span><span id="loading_${bar_code_}" class="spinner-border spinner-border-sm text-warning d-none" role="status"></span></h5>`;

            

                $("#barcode-load-text").text(response.message)

                
                barcode_table.row.add([active_inventory,bar_code_ ,date_added_,barcodes_edit_]);
              
                
                barcode_table.draw();

                ipcRenderer.send('request-initial-data');

               
              
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);

                $("#barcode-load-text").text("Failed to add barcode. Please try again.")
                
            }
        });

        $("#barcode-loading").fadeOut(1000)
        setTimeout(()=>{
            $("#barcode-loading").addClass("d-none")
        },1000)
      


        // Optionally, clear the input field after sending the data
        $(this).val('');
        

    }
});
 // Assuming you have already initialized DataTables on the table with ID 'inventoryTable'
var barcode_table = $('#BarcodeTable').DataTable();

const InventoryGetBarcodes=(inventoryId,inventoryname)=>{
  
    barcode_table.clear()


    var db_name=user_info.organization;

    // Construct the data object including dbname and itemId
    var dataToSend = JSON.stringify({ dbname: db_name, inventoryId:inventoryId });

    // AJAX request
    $.ajax({
        url: `${base_url}/api/get-barcodes`,
        type: "POST", // Or "GET", depending on your backend setup
        contentType: "application/json", // Specify the content type as JSON
        dataType: "json", // Specify the expected data type of the response
        data: dataToSend,
        success: function(response) {
            // Handle success
            console.log("Data sent successfully:", response);

            
            if (response.barcodes.length === 0) {
                // Add a dummy row indicating no data
                barcode_table.row.add(["No data", "", "", ""]);
            } else {
                $.each(response.barcodes, function(barcode, barcode_info) {
                    var barcodes_edit = `<a href="javascript:void(0);" class="action-icon" data-bs-toggle="tooltip" data-bs-placement="left" title="Delete inventory barcode"><i class="mdi mdi-delete deleteInventoryBarcode" data-deletebarcode="${barcode}"></i></a>` +
                    `<h5><span id="barcode_status_${barcode}" class="badge badge-warning-lighten d-none"></span><span id="loading_${barcode}" class="spinner-border spinner-border-sm text-warning d-none" role="status"></span></h5>`;

                    var barcode_date_added = barcode_info.date_added || null;
            
                    barcode_table.row.add([inventoryname, barcode, barcode_date_added, barcodes_edit]);
                });
            }
            
            barcode_table.draw();

    

        },
        error: function(xhr, status, error) {
            // Handle error
            console.error("Error sending data:", error);
        }
    });

}


const inputElement_two = document.getElementById('edititemImage');
   
const pond_two = FilePond.create(inputElement_two, {
        allowFileTypeValidation:true,
        labelFileTypeNotAllowed:true,
        acceptedFileTypes: ['image/*']
});



const edit_inventory = async () => {

    $('.editInventory').click(async function() {
        var itemId = $(this).data('editinventory');

        var row_text = $(this).closest('tr').find('td:eq(1) p').text();


        $("#inventoryname").text(`Edit ${row_text} inventory`)

        $("#EditProductsModal").data('itemid', itemId);
        // Get the itemId
        $("#EditProductsModal").modal("toggle");
    });

}

$("#editProductForm").on("click", async function(event){
    event.preventDefault();

    $(".editinventory-load").removeClass("d-none")

    $(".editinventory-load").removeClass("d-none")

    $(this).addClass("d-none")

    // Get the values from the modal inputs
    var itemId = $("#EditProductsModal").data('itemid');
    var name = $('#edititemNameInput').val();
    var category = $('#edititemCategoryInput').val();
    var price = $('#edititemPrice').val();
    var status = $('#edititemStatusInput').prop('checked'); // Assuming it's a 
    
  
    // You can retrieve other values similarly

    // Get the FilePond file objects
    const files = pond_two.getFiles();

    // Create a FormData object and append each file to it
    let file_path ;
    files.forEach(file => {
        file_path=file.file.path;
    });

    if (file_path){
        var base64_img_= await ipcRenderer.returnBase64file(file_path);

    }
    else{
        var base64_img_=null;
    }
   

    let formData = {};

    // Add the database name
    formData['dbname']=user_info.organization;

    // Add the item ID if it exists
    if (itemId) {
        formData['itemId']=itemId;
    }

    // Add the name if it exists
    if (name) {
        formData['name']=name;
    }

    // Add the category if it exists
    if (category) {
        formData['category']=category;
    }

    // Add the price if it exists
    if (price) {
        formData['price']=price;
    }

    // Add the status if it exists
  

    // Add the file data if it exists
    if (base64_img_) {
        formData['fileData']=base64_img_;
    }

    formData['status']=status;

   

    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: `${base_url}/api/edit-inventory`, 
        data: JSON.stringify(formData),
        dataType:"json",
        success: function(response) {
            // Handle the success response from the backend

            showToast(
                "! Inventory edited",
                `${response.message}`,
                "top-center",
                "rgba(0,0,0,0.2)",
                "success"
            );

            ipcRenderer.send('request-initial-data');

            $("#editProductForm").removeClass("d-none")

            $("#editProductForm").removeClass("d-none")

            $(".editinventory-load").addClass("d-none")

        },
        error: function(xhr, status, error) {
            // Handle errors here
            showToast(
                "! error",
                `${error}`,
                "top-center",
                "rgba(0,0,0,0.2)",
                "error"
            );

            $("#editProductForm").removeClass("d-none")

            $("#editProductForm").removeClass("d-none")

            $(".editinventory-load").addClass("d-none")
        }

        
    });
    $('#edititemNameInput').val("");
    $('#edititemCategoryInput').val("");
    $('#edititemPrice').val("");

    
    
    

});



const handleDeleteInventoryBarcode = () => {
        // Set the active inventory ID to null
        // Set up the click event listener using jQuery
        $(document).on('click', '.deleteInventoryBarcode', function() {
            // Get the data-deletebarcode attribute value
            const deleteBarcode = $(this).data('deletebarcode');

             // Show spinner
             const spinnerElement = $(`#loading_${deleteBarcode}`);

             const barcode_spinner_text= $(`#barcode_status_${deleteBarcode}`);

             // Show spinner
            spinnerElement.removeClass('d-none');
            barcode_spinner_text.removeClass('d-none');



            const inventory_deletion_bcode_data={
                dbname:user_info.organization,
                inventoryid:active_inventoryid,
                barcode:deleteBarcode
            }

            $.ajax({
                type: "POST",
                contentType: "application/json",
                url: `${base_url}/api/delete-inventory-barcode`, 
                data: JSON.stringify(inventory_deletion_bcode_data),
                dataType: "json",
                success: function(response) {
                    console.log('Server Response:', response);
                    // Set response text to the spinner element before hiding it
                    barcode_spinner_text.text(response.message);

                   

                            // Hide spinner after a delay
                    setTimeout(function() {
                        spinnerElement.addClass('d-none');
                        barcode_spinner_text.addClass('d-none');
                        InventoryGetBarcodes(active_inventoryid,active_inventory)
                        ipcRenderer.send('request-initial-data');
                        
                    }, 2000); // Adjust delay time as needed

                },
                error: function(xhr, status, error) {
                    console.error('Error:', error);

                            // Set error message to the spinner element before hiding it
                    barcode_spinner_text.text('Error: ' + error);

                            // Hide spinner after a delay
                    setTimeout(function() {
                        spinnerElement.addClass('d-none');
                        barcode_spinner_text.addClass('d-none');
                    }, 2000); // Adjust delay time as needed


                }
            });
           
            

        });
    };


    handleDeleteInventoryBarcode();


});

