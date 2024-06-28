$(document).ready(function() {
    let base_url=user_info.base_url
    $(".search-btn").on("click",function(event){

        event.preventDefault()

    })

    $('#top-search').on('input', async function() {
      var searchTerm = $(this).val().trim();
      // Call your search function here passing the searchTerm
      // For example, you can log it to the console
      console.log('Searching for: ' + searchTerm);


      const search_result=await ipcRenderer.SearchInventory(searchTerm)

      $('.search-result-list').empty();
      $('.search-result-count').text("")

      $('.search-result-count').text(search_result.length);


      search_result.forEach(function(item) {

        if(!item.status){
          
            $('.search-result-list').empty();
            $('.search-result-count').text("inventory not active")

            $(this).val('')
        }

        else if(item.stock<1){
            $('.search-result-count').text(`${item.name} is out of stock`)
        }

        else{

            var listItem = `
        <a href="javascript:void(0);" class="dropdown-item notify-item search-result-item" data-item-id="${item._id}" data-item-barcode="${item.matching_barcode}" data-stock-count="${item.stock}">
            <div class="d-flex">
              <img class="d-flex me-2 avatar-sm rounded search-result-image" src="data:image/jpeg;base64,${item.image}" alt="Product Image" height="50"/>
              <div class="w-100">
                <h5 class="m-0 font-14 search-result-name">${item.name} </h5>
                <span class="font-12 mb-0 search-result-price">ksh ${parseFloat(item.price).toLocaleString()}</span>
                <h6 class="font-6 text-muted" > stock ${item.stock} </h6>
              </div>
            </div>
          </a>
        `;
        $('.search-result-list').prepend(listItem);


        }
        
      });

      sync_item()

    });

    


    const sync_item = () => {
        // Event listener for adding items to the cart
        $(".search-result-item").on("click", async function() {
            var itemId = $(this).data('item-id');
            var barcode = $(this).data('item-barcode');
    
            // Fetch the available quantity of the item from the inventory
            let availableQuantity = $(this).data('stock-count')
          
    
            // Check if the item exists in customerCartBarcode
            if (!customerCartBarcode[itemId]) {
                // If the item doesn't exist, create a new list with the barcode
                customerCartBarcode[itemId] = [barcode];
                // Add the item to the cart with automatic quantity increment
                addItemToCart(itemId);
            } else {
                // If the item exists, check the current quantity in the cart
                let currentQuantity = customerCartBarcode[itemId].length;
    
                // Allow adding the item only if the current quantity is less than the available quantity
                if (currentQuantity < availableQuantity) {
                    // Add the barcode to the existing list
                    customerCartBarcode[itemId].push(barcode);
                    // Add the item to the cart with automatic quantity increment
                    addItemToCart(itemId);
                }
                // else {
                //     alert("You have reached the maximum quantity available for this item.");
                // }
            }
    
            // Render the updated cart
            renderCart();
            remove_widget();
        });
    };
    
    // Function to fetch the available quantity of an item from the inventory
    const fetchAvailableQuantity = async (itemId) => {
        try {
            const response = await fetch(`/api/items/quantity?item_id=${itemId}`);
            const data = await response.json();
            return data.available_quantity;
        } catch (error) {
            console.error('Error fetching available quantity:', error);
            return 0; // Default to 0 if there's an error
        }
    };
    
    // Initial call to sync_item to set up the event listeners
    sync_item();
    

// Define a dictionary to store the items in the cart
var customerCart = {};

var customerCartBarcode={}

var customerCartTotal={};
        // Function to add an item to the customer's cart
function addItemToCart(itemId) {
    if (customerCart[itemId]) {
        // If the item already exists in the cart, increment its quantity by 1
        customerCart[itemId]++;
    } else {
        // If the item does not exist in the cart, add it with a quantity of 1
        customerCart[itemId] = 1;
    }
}



function removeItemFromCart(itemId) {
    delete customerCart[itemId];
    delete customerCartTotal[itemId];
    delete customerCartBarcode[itemId]

    render_total();
}


// Function to clear the customer's cart
function clearCart() {
    customerCart = {};
    customerCartTotal={};
    customerCartBarcode={};
    render_total();
}


// Function to render the customer's cart



function renderCart() {
    // Loop through each item in the customerCart
    for (const [itemId, quantity] of Object.entries(customerCart)) {
        const barcode = customerCartBarcode[itemId];

        // Retrieve item information from the backend and render the item in the cart
        $.ajax({
            type: "POST",
            url: `${base_url}/api/get-item`,
            contentType: "application/json",
            data: JSON.stringify({ dbname: user_info.organization, itemId: itemId }),
            dataType: "json",
            success: function(response) {
                var imageData = 'data:image/jpeg;base64,' + response.image;
                var itemPrice = parseFloat(response.price); // Convert item price to a floating-point number
                var itemTotal = itemPrice * quantity; // Calculate total price for the item

                // Check if the widget already exists
                var existingWidget = $(`#${itemId}`);
                if (existingWidget.length > 0) {
                    // Update the existing widget's content
                    existingWidget.find('.card-title').text(response.name);
                    existingWidget.find('.card-text:eq(0)').text(`Price: ksh ${parseFloat(itemPrice.toFixed(2)).toLocaleString()}`);
                    existingWidget.find('.badge').text(quantity);
                    existingWidget.find('.item-total').text(`Total: ksh ${parseFloat(itemTotal.toFixed(2)).toLocaleString()}`);
                    existingWidget.find('.card-img-top').attr('src', imageData);
                } else {
                    // Construct a new widget with item information
                    var widget = `
                        <div class="card-widget col-6 col-sm-6 col-md-4 col-lg-3 mb-3">
                            <div class="card h-100" id="${itemId}" data-barcodes="${barcode.join(', ')}">
                                <img src="${imageData}" class="card-img-top mx-auto d-block" alt="${response.name}" title="${response.name}" style="max-height: 70%; max-width: 70%;">
                                <div class="card-body p-2">
                                    <h5 class="card-title mb-1" style="font-size: 14px;">${response.name}</h5>
                                    <p class="card-text mb-1" style="font-size: 12px;">Price: ksh ${parseFloat(itemPrice.toFixed(2)).toLocaleString()}</p>
                                    <p class="card-text mb-1" style="font-size: 12px;">Quantity: <span class="badge bg-success">${quantity}</span></p>
                                    <p class="card-text mb-1 item-total" style="font-size: 12px;">Total: ksh ${parseFloat(itemTotal.toFixed(2)).toLocaleString()}</p>
                                    <a href="javascript:void(0);" class="btn btn-danger btn-sm delete-item">
                                        <i class="mdi mdi-delete text-light"></i> Remove
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                    // Append the constructed widget to the container
                    $('#customer-shopping-cart').append(widget);

                    // Scroll the container to the bottom to ensure the last added widget is in view
                    $(`#${itemId}`)[0].scrollIntoView({
                        behavior: "smooth", // or "auto" or "instant"
                        block: "start" // or "end"
                    });
                }

                customerCartTotal[itemId] = {
                    name: response.name,
                    price: itemPrice,
                    quantity: quantity,
                    totalAmount: itemTotal
                };

                render_total();
            },
            error: function(xhr, status, error) {
                // Handle errors here
                console.error("Error:", error);
            }
        });
    }
}


    function calculateFinalAmount() {
        let finalAmount = 0;
        let cartQuantity = 0;
        for (const [itemId, item] of Object.entries(customerCartTotal)) {
            finalAmount += item.totalAmount;
            cartQuantity += item.quantity;
        }
        return { cartAmount: finalAmount.toFixed(2), cartQuantity: cartQuantity };
    }

    const render_total = () => {
        const cart = calculateFinalAmount();
        $('#total-amount').text('ksh ' + parseFloat(cart.cartAmount).toLocaleString());
        $('.totalAmount').attr('data-total-amount', cart.cartAmount);
        $('#total-items').text(cart.cartQuantity);
        $(".modaltotalamount").text("ksh "+parseFloat(cart.cartAmount).toLocaleString());
        $(".modaltotalitems").text(cart.cartQuantity);

    }

    function remove_widget() {
        $('#customer-shopping-cart').on('click', '.delete-item', function(event) {
            event.stopPropagation(); // Prevent card click event from firing
            var itemId = $(this).closest('.card').attr('id');
            // Remove the item from the cart dictionary
            removeItemFromCart(itemId);
            // Remove the card from the container
            $(this).closest('.card-widget').remove();

          
        });
    }


    // Add input event listener to the cashAmount input field
    $("#cashAmount").on("input", function () {
      // Remove non-numeric characters and commas from the input

      var input = $(this)
        .val()
        .replace(/[^\d.]/g, "");
      $(this).val(numberWithCommas_(input));

      // Calculate cash amount and update total paid
      var cashAmount = parseFloat(input);

      $("#totalpaidmodal")
        .attr("data-total-paidmodal", cashAmount.toFixed(2))
        .text(parseFloat(cashAmount.toFixed(2)).toLocaleString());

      // Get the total amount from the data attribute
      var totalAmount = parseFloat(
        $(".totalAmount").data("total-amount")
      );

      // Calculate change due
      var changeDue = cashAmount - totalAmount;

      $("#changedue")
        .attr("data-total-changedue", changeDue.toFixed(2))
        .text(parseFloat(changeDue.toFixed(2)).toLocaleString());
    });

    // Function to format number with commas
    function numberWithCommas_(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Add input event listener to the payment method radio buttons
    $('input[name="paymentMethod"]').on("input", function () {
      // Get selected payment method
      var paymentMethod = $(this).val();

      // Handle checkout based on payment method
      if (paymentMethod === "cash") {
        // Display cash amount input field
        $("#cashAmountDiv").removeClass("d-none");
      } else {
        // Hide cash amount input field for non-cash payments
        $("#cashAmountDiv").addClass("d-none");
        $("#cashAmount").val("")
        $("#totalpaidmodal")
        .attr("data-total-paidmodal",0)
        .text("");

        $("#changedue")
        .attr("data-total-changedue", 0)
        .text("");

      }
    });



    function completeCheckout() {
        // Get selected payment method

        $("#completeCheckout").on("click",function(){

            var paymentMethod = $('input[name="paymentMethod"]:checked').val();

            // Retrieve total amount from data attribute
            var totalAmount = parseFloat(
                $(".totalAmount").data("total-amount")
            ); // Retrieve from data attribute

            // Calculate change for cash payment
            var cashAmountInput = $("#cashAmount").val();
            var cashAmount = parseFloat(
                cashAmountInput.replace(/[^\d.]/g, "")
            );

            // Handle checkout based on payment method
            if (paymentMethod === "cash") {
                // Display cash amount input field
                $("#cashAmountDiv").removeClass("d-none");
                

                var changeDue = cashAmount - totalAmount;

                finish_checkout(totalAmount,paymentMethod,changeDue)
                

            // Display change due
            //alert("Change Due: $" + changeDue.toFixed(2));
            } else if (paymentMethod === "card") {
               
                $("#cashAmountDiv").addClass("d-none");

                finish_checkout(totalAmount,paymentMethod)
                

            } else if (paymentMethod === "mpesa") {
                // Hide cash amount input field
                $("#cashAmountDiv").addClass("d-none");

                finish_checkout(totalAmount, paymentMethod);

               
                // Process card payment
                //alert("Checkout completed with card payment!");


            } else if (paymentMethod === "paypal") {
                // Hide cash amount input field
                $("#cashAmountDiv").addClass("d-none");
                finish_checkout(totalAmount, paymentMethod);

                
            } else {
            alert("Please select a payment method.");
            }
      
        });
    }
        


    const finish_checkout=(totalAmount,paymentMethod,change_due=0)=>{
        var checkoutData = {
            purchase_amount: totalAmount,
            payment_method: paymentMethod,
            change_due: change_due,
            dbname: user_info.organization,
            customer_cart_barcode: customerCartBarcode,
            sales_person:user_info.fullname
        };

        fetch(`${base_url}/api/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(checkoutData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Clear the cart and reset the form
                clearCart();
                $('#top-search').val('');
                $('.search-result-list').empty();
                $('.search-result-count').text("0")
                

                $('#customer-shopping-cart').empty();
                $("#checkoutModal").modal("toggle");

                $("#checkout-status").removeClass("bg-danger").addClass("bg-success")

                $("#success-checkout-alert-modal").modal("toggle");

                $("#checkout-title").text(`Checkout Successful! customer ID ${data.customer_id}`)

            } else {
               
                $("#checkout-status").removeClass("bg-success").addClass("bg-danger")
                $("#success-checkout-alert-modal").modal("toggle");

                $("#checkout-title").text(`Checkout failed  ${ data.error}`)
            }


        })
        .catch(error => {
            console.error('Error:', error);
         
            $("#checkout-status").removeClass("bg-success").addClass("bg-danger")
            $("#success-checkout-alert-modal").modal("toggle");

            $("#checkout-title").text(`"An error occurred during checkout."`)
        });
    }


    
    completeCheckout()



});