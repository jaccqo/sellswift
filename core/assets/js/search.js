$(document).ready(function() {
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

    $(".search-btn").on("click", function(event) {
        event.preventDefault();
    });

    $('#top-search').on('input', async function() {
        var searchTerm = $(this).val().trim();
        console.log('Searching for: ' + searchTerm);

        const search_result = await ipcRenderer.SearchInventory(searchTerm);

        $('.search-result-list').empty();
        $('.search-result-count').text("");

        $('.search-result-count').text(search_result.length);

        search_result.forEach(function(item) {
            if (!item.status) {
                $('.search-result-list').empty();
                $('.search-result-count').text("inventory not active");
                $(this).val('');
            } else if (item.stock < 1) {
                $('.search-result-count').text(`${item.name} is out of stock`);
            } else {
                console.log(item.matching_barcode)
                var listItem = `
                    <a href="javascript:void(0);" class="dropdown-item notify-item search-result-item" data-item-id="${item._id}" data-item-barcode="${item.matching_barcode}" data-stock-count="${item.stock}">
                        <div class="d-flex">
                            <img class="d-flex me-2 avatar-sm rounded search-result-image" src="data:image/jpeg;base64,${item.image}" alt="Product Image" height="50"/>
                            <div class="w-100">
                                <h5 class="m-0 font-14 search-result-name">${item.name}</h5>
                                <span class="font-12 mb-0 search-result-price">ksh ${parseFloat(item.price).toLocaleString()}</span>
                                <h6 class="font-6 text-muted"> stock ${item.stock} </h6>
                            </div>
                        </div>
                    </a>
                `;
                $('.search-result-list').prepend(listItem);
            }
        });

        sync_item();
    });

    const sync_item = () => {
        // Event listener for adding items to the cart from search results
        $(".search-result-item").on("click", async function() {
            var itemId = $(this).data('item-id');
            var barcode = $(this).data('item-barcode');
            let availableQuantity = $(this).data('stock-count');

            if (availableQuantity <= 0) {
                showToast("Oh snap!", "This item is out of stock and cannot be added to the cart.", "top-center", "rgba(0,0,0,0.2)", "error");
                return;
            }

            if (!customerCartBarcode[itemId]) {
                customerCartBarcode[itemId] = [barcode];
                addItemToCart(itemId);
            } else {
                let currentQuantity = customerCartBarcode[itemId].length;
                if (currentQuantity < availableQuantity) {
                    customerCartBarcode[itemId].push(barcode);
                    addItemToCart(itemId);
                }
            }

            renderCart();
            remove_widget();
        });

        // Event listener for adding items to the cart from popular products
        $(".popular-product-item").on("click", async function() {
            var itemId = $(this).data('item-id');
            var barcode = $(this).data('item-barcode');
            let availableQuantity = $(this).data('stock-count');

            if (availableQuantity <= 0) {
                showToast("Oh snap!", "This item is out of stock and cannot be added to the cart.", "top-center", "rgba(0,0,0,0.2)", "error");
                return;
            }

            if (!customerCartBarcode[itemId]) {
                customerCartBarcode[itemId] = [barcode];
                addItemToCart(itemId);
            } else {
                let currentQuantity = customerCartBarcode[itemId].length;
                if (currentQuantity < availableQuantity) {
                    customerCartBarcode[itemId].push(barcode);
                    addItemToCart(itemId);
                }
            }

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
    var customerCartBarcode = {};
    var customerCartTotal = {};

    // Function to add an item to the customer's cart
    function addItemToCart(itemId) {
        if (customerCart[itemId]) {
            customerCart[itemId]++;
        } else {
            customerCart[itemId] = 1;
        }
    }

    function removeItemFromCart(itemId) {
        delete customerCart[itemId];
        delete customerCartTotal[itemId];
        delete customerCartBarcode[itemId];
        render_total();
    }

    // Function to clear the customer's cart
    function clearCart() {
        customerCart = {};
        customerCartTotal = {};
        customerCartBarcode = {};
        render_total();
    }

    // Function to render the customer's cart
    function renderCart() {
        $('#customer-shopping-cart').empty();
        for (const [itemId, quantity] of Object.entries(customerCart)) {
            const barcode = customerCartBarcode[itemId];

            $.ajax({
                type: "POST",
                url: `${base_url}/api/get-item`,
                contentType: "application/json",
                data: JSON.stringify({ dbname: user_info.organization, itemId: itemId }),
                dataType: "json",
                success: function(response) {
                    if (response.stock <= 0) {
                        showToast("Oh snap!", `${response.name} is out of stock and cannot be added to the cart.`, "top-center", "rgba(0,0,0,0.2)", "error");
                        return;
                    }

                    var imageData = 'data:image/jpeg;base64,' + response.image;
                    var itemPrice = parseFloat(response.price);
                    var itemTotal = itemPrice * quantity;

                    var existingWidget = $(`#${itemId}`);
                    if (existingWidget.length > 0) {
                        existingWidget.find('.card-title').text(response.name);
                        existingWidget.find('.card-text:eq(0)').text(`Price: ksh ${parseFloat(itemPrice.toFixed(2)).toLocaleString()}`);
                        existingWidget.find('.badge').text(quantity);
                        existingWidget.find('.item-total').text(`Total: ksh ${parseFloat(itemTotal.toFixed(2)).toLocaleString()}`);
                        existingWidget.find('.card-img-top').attr('src', imageData);
                    } else {
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
                        $('#customer-shopping-cart').append(widget);
                        $(`#${itemId}`)[0].scrollIntoView({
                            behavior: "smooth",
                            block: "start"
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
        $(".modaltotalamount").text("ksh " + parseFloat(cart.cartAmount).toLocaleString());
        $(".modaltotalitems").text(cart.cartQuantity);
    };

    function remove_widget() {
        $('#customer-shopping-cart').on('click', '.delete-item', function(event) {
            event.stopPropagation();
            var itemId = $(this).closest('.card').attr('id');
            removeItemFromCart(itemId);
            $(this).closest('.card-widget').remove();
        });
    }

    // Add input event listener to the cashAmount input field
    $("#cashAmount").on("input", function() {
        var input = $(this).val().replace(/[^\d.]/g, "");
        $(this).val(numberWithCommas_(input));

        var cashAmount = parseFloat(input);
        $("#totalpaidmodal").attr("data-total-paidmodal", cashAmount.toFixed(2)).text(parseFloat(cashAmount.toFixed(2)).toLocaleString());

        var totalAmount = parseFloat($(".totalAmount").data("total-amount"));
        var changeDue = cashAmount - totalAmount;

        $("#changedue").attr("data-total-changedue", changeDue.toFixed(2)).text(parseFloat(changeDue.toFixed(2)).toLocaleString());
    });

    function numberWithCommas_(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    $('input[name="paymentMethod"]').on("input", function() {
        var paymentMethod = $(this).val();

        if (paymentMethod === "cash") {
            $("#cashAmountDiv").removeClass("d-none");
        } else {
            $("#cashAmountDiv").addClass("d-none");
            $("#cashAmount").val("");
            $("#totalpaidmodal").attr("data-total-paidmodal", 0).text("");
            $("#changedue").attr("data-total-changedue", 0).text("");
        }
    });

    function completeCheckout() {
        $("#completeCheckout").on("click", function() {
            var paymentMethod = $('input[name="paymentMethod"]:checked').val();
            var totalAmount = parseFloat($(".totalAmount").data("total-amount"));
            var cashAmountInput = $("#cashAmount").val();
            var cashAmount = parseFloat(cashAmountInput.replace(/[^\d.]/g, ""));

            if (paymentMethod === "cash") {
                $("#cashAmountDiv").removeClass("d-none");
                var changeDue = cashAmount - totalAmount;
                finish_checkout(totalAmount, paymentMethod, changeDue);
            } else if (paymentMethod === "card" || paymentMethod === "mpesa" || paymentMethod === "paypal") {
                $("#cashAmountDiv").addClass("d-none");
                finish_checkout(totalAmount, paymentMethod);
            } else {
                showToast("Error !", "Please Select A Payment Method.", "top-center", "rgba(0,0,0,0.2)", "error");
            }
        });
    }

    const finish_checkout = (totalAmount, paymentMethod, change_due = 0) => {
        var checkoutData = {
            purchase_amount: totalAmount,
            payment_method: paymentMethod,
            change_due: change_due,
            dbname: user_info.organization,
            customer_cart_barcode: customerCartBarcode,
            sales_person: user_info.fullname
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
                clearCart();
                popular_products();
                $('#top-search').val('');
                $('.search-result-list').empty();
                $('.search-result-count').text("0");
                $('#customer-shopping-cart').empty();
                $("#checkoutModal").modal("toggle");

                $("#checkout-status").removeClass("bg-danger").addClass("bg-success");
                $("#success-checkout-alert-modal").modal("toggle");
                $("#checkout-title").text(`Checkout Successful! customer ID ${data.customer_id}`);
            } else {
                $("#checkout-status").removeClass("bg-success").addClass("bg-danger");
                $("#success-checkout-alert-modal").modal("toggle");
                $("#checkout-title").text(`Checkout failed  ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            $("#checkout-status").removeClass("bg-success").addClass("bg-danger");
            $("#success-checkout-alert-modal").modal("toggle");
            $("#checkout-title").text(`"An error occurred during checkout."`);
        });
    };

    const popular_products = () => {
        $.ajax({
            url: `${base_url}/api/inventory?dbname=${user_info.organization}`,
            method: 'GET',
            success: function(data) {
                let tableBody = $('#product-table-body');
                tableBody.empty();

                data.forEach(function(product) {
                    let row = `<tr id="pop_${product.id}" class="popular-product-item" data-item-id="${product.id}" data-item-barcode="${product.matching_barcode}" data-stock-count="${product.stock_quantity}">
                        <td>
                            <h5 class="font-14 my-1 fw-normal">${product.name}</h5>
                            <span class="text-muted font-13">${product.date_created}</span>
                        </td>
                        <td>
                            <h5 class="font-14 my-1 fw-normal">Ksh ${parseFloat(product.price).toLocaleString()}</h5>
                            <span class="text-muted font-13">Price</span>
                        </td>
                        <td>
                            <h5 class="font-14 my-1 fw-normal">${product.stock_quantity}</h5>
                            <span class="text-muted font-13">Stock Quantity</span>
                        </td>
                        <td>
                            <img src="data:image/png;base64,${product.image}" alt="${product.name}" class="img-fluid" style="max-width: 100px;">
                        </td>
                    </tr>`;
                    tableBody.append(row);
                });

                sync_item(); // Sync item click events after rendering
            },
            error: function(error) {
                console.error('Error fetching inventory data:', error);
            }
        });
    };

    // Call the function to populate the table
    popular_products();
    completeCheckout();
});
