$(document).ready(function() {
    // Initialize DataTable
    var table = $('#sales-datatable').DataTable();
    var base_url=user_info.base_url

    // Function to fetch and display data
    function fetchSalesData() {
        fetch(`${base_url}/api/sales-data?dbname=${user_info.organization}`)
            .then(response => response.json())
            .then(data => {
                console.log(data)
                // Clear existing data
                table.clear();

                // Add new data
                data.forEach(sale => {
                    let itemDetails = sale.item_details.map(item => `Name: ${item.name}, Category: ${item.category}`).join('<br>');

                    table.row.add([
                        `<div class="form-check">
                           
                            <label class="form-check-label">&nbsp;</label>
                         </div>`,
                        sale._id,
                        sale.sales_person || '',
                        itemDetails,
    
                        sale.quantity || '',
                        sale.reference_number || '',
                        sale.payment_status || '',
                        sale.payment_method || '',
                        `ksh ${parseFloat(sale.purchase_amount).toLocaleString()}`,
                        sale.tax || '',
                        sale.total_discount || '',
                        new Date(sale.timestamp).toLocaleString(),
                        sale.last_modified ? new Date(sale.last_modified).toLocaleString() : '',
                        sale.sent_date ? new Date(sale.sent_date).toLocaleString() : '',
                        sale.store_id || '',
                        sale.notes || ''
                       
                    ]).draw();
                });
            })
            .catch(error => console.error('Error fetching sales data:', error));
    }

    // Initial data fetch
    fetchSalesData();

    setInterval(fetchSalesData,60000)
});
