$(document).ready(function() {
    // Initialize DataTable
    var table = $('#sales-datatable').DataTable();
    var base_url=user_info.base_url

    const options = {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Ensure 24-hour format
    };

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
                    let itemDetails = sale.item_details.map(item => `${item.name}`).join('<br>');

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
                        new Date(sale.timestamp).toLocaleString('en-US',options),
                        sale.last_modified ? new Date(sale.last_modified).toLocaleString('en-US',options) : '',
                        sale.sent_date ? new Date(sale.sent_date).toLocaleString('en-US',options) : '',
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
