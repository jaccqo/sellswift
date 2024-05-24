$(document).ready(function() {
    let base_url="http://192.168.100.14:5000"
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

      

            $(this).clear()
        }

        else{

            var listItem = `
        <a href="javascript:void(0);" class="dropdown-item notify-item search-result-item" data-item-id="${item._id}" data-item-barcode="${item.matching_barcode}">
            <div class="d-flex">
              <img class="d-flex me-2 avatar-sm rounded search-result-image" src="data:image/jpeg;base64,${item.image}" alt="Product Image" height="50"/>
              <div class="w-100">
                <h5 class="m-0 font-14 search-result-name">${item.name}</h5>
                <span class="font-12 mb-0 search-result-price">${item.price}</span>
              </div>
            </div>
          </a>
        `;
        $('.search-result-list').prepend(listItem);


        }
        
      });

      sync_item()

    });

    $('#colapsed-search').on('input', async function() {
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
                $('.search-result-count').text("invenotry not active")

                
                $(this).clear()
            }
            else{

                    var listItem = `
                <a href="javascript:void(0);" class="dropdown-item notify-item search-result-item" data-item-id="${item._id}" data-item-barcode="${item.matching_barcode}">
                    <div class="d-flex">
                    <img class="d-flex me-2 avatar-sm rounded search-result-image" src="data:image/jpeg;base64,${item.image}" alt="Product Image" height="50"/>
                    <div class="w-100">
                        <h5 class="m-0 font-14 search-result-name">${item.name}</h5>
                        <span class="font-12 mb-0 search-result-price">${item.price}</span>
                    </div>
                    </div>
                </a>
                `;
                $('.search-result-list').prepend(listItem);

            }

            

            
        });

        sync_item()

        // console.log(search_result)

      });


      const sync_item=()=>{
                    // Event listener for adding items to the cart
                    // Event listener for adding items to the cart
                $(".search-result-item").on("click", async function() {
                    var itemId = $(this).data('item-id');
                    var barcode=$(this).data('item-barcode');

                    // Add the item to the cart with automatic quantity increment
                    addItemToCart(itemId);

                                // Check if the item exists in customerCartBarcode
                    if (!customerCartBarcode[itemId]) {
                        // If the item doesn't exist, create a new list with the barcode
                        customerCartBarcode[itemId] = [barcode];
                    } else {
                        // If the item exists, add the barcode to the existing list
                        customerCartBarcode[itemId].push(barcode);
                    }

                    // Render the updated cart
                    renderCart();
                    remove_row();
                });
        }

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
        $('#customer-shopping-cart').empty(); // Clear the existing cart content
        
        for (const [itemId, quantity] of Object.entries(customerCart)) {
            const barcode=customerCartBarcode[itemId]


            // Retrieve item information from the backend and render the item in the cart
            $.ajax({
                type: "POST",
                url: `${base_url}/api/get-item`,
                contentType: "application/json",
                data: JSON.stringify({ dbname: user_info.organization, itemId: itemId}),
                dataType: "json",
                success: function(response) {
                    var imageData = 'data:image/jpeg;base64,' + response.image;
                    var itemPrice = parseFloat(response.price); // Convert item price to a floating-point number
                    var itemTotal = itemPrice * quantity; // Calculate total price for the item

                    // Construct the table row (tr) with item information
         
                
                    var row = `
                        <tr class="item-row" id="${itemId}" data-barcodes="${barcode.join(', ')}">
                            <td class="sorting_1">
                                <img src="${imageData}" alt="${response.name}" title="${response.name}" class="rounded me-3" height="48">
                                
                            </td>
                            <td>$${itemPrice}</td>
                            <td><span class="badge bg-success">${quantity} Pcs</span></td>
                            <td class="item-total">$${itemTotal.toFixed(2)}</td> <!-- Display item total -->
                            <td>
                                <a href="javascript:void(0);" class="action-icon text-danger delete-item">
                                    <i class="mdi mdi-delete"></i>
                                </a>
                            </td>
                        </tr>
                    `;
                    // Append the constructed row to the table body
                    $('#customer-shopping-cart').append(row);

                    customerCartTotal[itemId] = {
                        name: response.name,
                        price: itemPrice,
                        quantity: quantity,
                        totalAmount:itemTotal
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
        $('#total-amount').text('$' + cart.cartAmount);
        $('.totalAmount').attr('data-total-amount', cart.cartAmount);
        $('#total-items').text(cart.cartQuantity);
        $(".modaltotalamount").text(cart.cartAmount);
        $(".modaltotalitems").text(cart.cartQuantity);

    }



    // Function to remove row from the cart
    function remove_row() {
        $('#customer-shopping-cart').on('click', '.delete-item', function(event) {
            event.stopPropagation(); // Prevent row click event from firing
            var itemId = $(this).closest('.item-row').attr('id');
            // Remove the item from the cart dictionary
            removeItemFromCart(itemId);
            // Remove the row from the table
            $(this).closest('.item-row').remove();
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
        .text(cashAmount.toFixed(2));

      // Get the total amount from the data attribute
      var totalAmount = parseFloat(
        $(".totalAmount").data("total-amount")
      );

      // Calculate change due
      var changeDue = cashAmount - totalAmount;

      $("#changedue")
        .attr("data-total-changedue", changeDue.toFixed(2))
        .text(changeDue.toFixed(2));
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
      }
    });



    function completeCheckout() {
        // Get selected payment method

        $("#completeCheckout").on("click",function(){

            var paymentMethod = $('input[name="paymentMethod"]:checked').val();

            // Handle checkout based on payment method
            if (paymentMethod === "cash") {
                // Display cash amount input field
                $("#cashAmountDiv").removeClass("d-none");

                // Retrieve total amount from data attribute
                var totalAmount = parseFloat(
                    $(".totalAmount").data("total-amount")
                ); // Retrieve from data attribute

                // Calculate change for cash payment
                var cashAmountInput = $("#cashAmount").val();
                var cashAmount = parseFloat(
                    cashAmountInput.replace(/[^\d.]/g, "")
                );

                var changeDue = cashAmount - totalAmount;

            // Display change due
            //alert("Change Due: $" + changeDue.toFixed(2));
            } else if (paymentMethod === "card") {
                alert("checking out with card")
                // Hide cash amount input field
                $("#cashAmountDiv").addClass("d-none");

                // Process card payment
                //alert("Checkout completed with card payment!");

                $("#success-checkout-alert-modal").modal("toggle");

                $("#checkoutModal").modal("toggle");

                clearCart()
                $('#customer-shopping-cart').empty();

            } else if (paymentMethod === "mpesa") {
                // Hide cash amount input field
                $("#cashAmountDiv").addClass("d-none");

                alert("checking out with mpesa")

                // Process card payment
                //alert("Checkout completed with card payment!");

                $("#success-checkout-alert-modal").modal("toggle");

                $("#checkoutModal").modal("toggle");

                clearCart()
                $('#customer-shopping-cart').empty();

            } else if (paymentMethod === "paypal") {
                // Hide cash amount input field
                $("#cashAmountDiv").addClass("d-none");

                alert("checking out with paypal")

                // Process card payment
                //alert("Checkout completed with card payment!");

                $("#success-checkout-alert-modal").modal("toggle");

                $("#checkoutModal").modal("toggle");

                clearCart()
                $('#customer-shopping-cart').empty();



            } else {
            alert("Please select a payment method.");
            }
      
        });
    }
        

      completeCheckout()



});