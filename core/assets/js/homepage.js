$(document).ready( function() {


    let base_url = user_info.base_url;
    let dbname = user_info.organization;


    let revenueChartInstance;
    let highPerformingChartInstance;

    async function showToast(heading, text, position, loaderBg, icon, hideAfter = 3000, stack = 1, showHideTransition = "fade") {
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

    const renderRevenueChart = (data) => {
        const revenueColors = ["#727cf5", "#0acf97"];
        const revenueChartColors = $("#revenue-chart").data("colors");
        const revenueConfig = {
            chart: {
                height: 370,
                type: "line",
                dropShadow: { enabled: true, opacity: 0.2, blur: 7, left: -7, top: 7 },
            },
            dataLabels: { enabled: false },
            stroke: { curve: "smooth", width: 4 },
            series: [
                { name: "Current Week", data: data.currentWeek },
                { name: "Previous Week", data: data.previousWeek },
            ],
            colors: revenueChartColors ? revenueChartColors.split(",") : revenueColors,
            zoom: { enabled: false },
            legend: { show: false },
            xaxis: {
                type: "string",
                categories: data.categories,
                tooltip: { enabled: false },
                axisBorder: { show: false },
            },
            grid: { strokeDashArray: 7 },
            yaxis: {
                labels: {
                    formatter: function (e) {
                        return e.toLocaleString() + " ksh ";
                    },
                    offsetX: -15,
                },
            },
        };
        const revenueChart = new ApexCharts(document.querySelector("#revenue-chart"), revenueConfig);
        revenueChart.render();
        return revenueChart;
    };
    
    const renderHighPerformingChart = (data) => {
        const highPerformingColors = ["#727cf5", "#0acf97"];
        const highPerformingChartColors = $("#high-performing-product").data("colors");
        const highPerformingConfig = {
            chart: { height: 256, type: "bar", stacked: true },
            plotOptions: { bar: { horizontal: false, columnWidth: "20%" } },
            dataLabels: { enabled: false },
            stroke: { show: true, width: 0, colors: ["transparent"] },
            series: [{ name: "Sells", data: data.actualData }],
            zoom: { enabled: false },
            legend: { show: false },
            colors: highPerformingChartColors ? highPerformingChartColors.split(",") : highPerformingColors,
            xaxis: {
                categories: data.categories,
                axisBorder: { show: false },
            },
            yaxis: {
                labels: {
                    formatter: function (e) {
                        return e.toLocaleString() + " ksh";
                    },
                    offsetX: -15,
                },
            },
            fill: { opacity: 1 },
            tooltip: {
                y: {
                    formatter: function (e) {
                        return "ksh " + e.toLocaleString() ;
                    },
                },
            },
        };
        const highPerformingChart = new ApexCharts(document.querySelector("#high-performing-product"), highPerformingConfig);
        highPerformingChart.render();
        return highPerformingChart;
    };

    const fetchDashboardData=()=>{
        fetch(`${base_url}/api/dashboard-data?dbname=${dbname}`)
            .then(response => response.json())
            .then(data => {
                if (!data.error) {
                    $('#customer-count').text(data.customers.toLocaleString());
                    $('#purchase-count').text(data.inventory_count.toLocaleString());
                    $('#revenue-amount').text(`ksh ${data.revenue.toLocaleString()}`);
                    $('#growth-percentage').text(data.growth_percentage + '%');

                    // Update percentage indicators if needed
                    $('#customer-growth').html(data.customer_growth > 0 ? 
                        `<span class="text-success me-2"><i class="mdi mdi-arrow-up-bold"></i> ${data.customer_growth}%</span> <span class="text-nowrap">Since last month</span>` : 
                        (data.customer_growth < 0 ? 
                            `<span class="text-danger me-2"><i class="mdi mdi-arrow-down-bold"></i> ${data.customer_growth}%</span> <span class="text-nowrap">Since last month</span>` :
                            `<span class="text-warning me-2"><i class="mdi mdi-arrow-right-bold"></i> ${data.customer_growth}%</span> <span class="text-nowrap">Since last month</span>`));
                    
                    $('#purchase-growth').html(data.inventory_growth > 0 ? 
                        `<span class="text-success me-2"><i class="mdi mdi-arrow-up-bold"></i> ${data.inventory_growth}%</span> <span class="text-nowrap">Since last month</span>` : 
                        (data.inventory_growth < 0 ? 
                            `<span class="text-danger me-2"><i class="mdi mdi-arrow-down-bold"></i> ${data.inventory_growth}%</span> <span class="text-nowrap">Since last month</span>` :
                            `<span class="text-warning me-2"><i class="mdi mdi-arrow-right-bold"></i> ${data.inventory_growth}%</span> <span class="text-nowrap">Since last month</span>`));
                    
                    $('#revenue-growth').html(data.revenue_growth > 0 ? 
                        `<span class="text-success me-2"><i class="mdi mdi-arrow-up-bold"></i> ${data.revenue_growth}%</span> <span class="text-nowrap">Since last month</span>` : 
                        (data.revenue_growth < 0 ? 
                            `<span class="text-danger me-2"><i class="mdi mdi-arrow-down-bold"></i> ${data.revenue_growth}%</span> <span class="text-nowrap">Since last month</span>` :
                            `<span class="text-warning me-2"><i class="mdi mdi-arrow-right-bold"></i> ${data.revenue_growth}%</span> <span class="text-nowrap">Since last month</span>`));
                    
                    $('#growth-indicator').html(data.growth_percentage > 0 ? 
                        `<span class="text-success me-2"><i class="mdi mdi-arrow-up-bold"></i> ${data.growth_percentage}%</span> <span class="text-nowrap">Since last month</span>` : 
                        (data.growth_percentage < 0 ? 
                            `<span class="text-danger me-2"><i class="mdi mdi-arrow-down-bold"></i> ${data.growth_percentage}%</span> <span class="text-nowrap">Since last month</span>` :
                            `<span class="text-warning me-2"><i class="mdi mdi-arrow-right-bold"></i> ${data.growth_percentage}%</span> <span class="text-nowrap">Since last month</span>`));
                } else {
                    console.error('Error fetching dashboard data:', data.error);
                }


                const revenueData = data.revenueData;
                const highPerformingData = data.highPerformingData;

                if(revenueData){
                    $("#current-week-earning").text(`ksh ${revenueData.current_revenue.toLocaleString()}`)
                    $("#prev-week-earning").text(`ksh ${revenueData.prev_revenue.toLocaleString()}`)
                    $("#today-earning").text(`Today's Earning: Ksh ${revenueData.today_earnings.toLocaleString()}`)
                }


            
                if (!revenueChartInstance) {
                    revenueChartInstance = renderRevenueChart(revenueData);
                } else {
                    revenueChartInstance.updateSeries([
                        { data: revenueData.currentWeek },
                        { data: revenueData.previousWeek }
                    ]);
                }

                if (!highPerformingChartInstance) {
                    highPerformingChartInstance = renderHighPerformingChart(highPerformingData);
                } else {
                    highPerformingChartInstance.updateSeries([{ data: highPerformingData.actualData }]);
                }


            })
            .catch(error => {
                console.error('Error fetching dashboard data:', error);
            });

    }



        const top_selling_table = () => {
            $.ajax({
                url: `${base_url}/api/inventory?dbname=${dbname}`,
                method: 'GET',
                success: function(data) {
                    let tableBody = $('#product-table-body');
                    tableBody.empty();  // Clear any existing rows
        
                    data.forEach(function(product) {
                        let row = `<tr id=${product.id}>
                            <td>
                                <h5 class="font-14 my-1 fw-normal">${product.name}</h5>
                                <span class="text-muted font-13">${product.date}</span>
                            </td>
                            <td>
                                <h5 class="font-14 my-1 fw-normal">Ksh ${parseFloat(product.price).toLocaleString()}</h5>
                                <span class="text-muted font-13">Price</span>
                            </td>
                            <td>
                                <h5 class="font-14 my-1 fw-normal">${product.quantity}</h5>
                                <span class="text-muted font-13">Quantity Sold</span>
                            </td>
                            <td>
                                <h5 class="font-14 my-1 fw-normal">Ksh ${parseFloat(product.amount).toLocaleString()}</h5>
                                <span class="text-muted font-13">Amount</span>
                            </td>
                            <td>
                                <img src="data:image/png;base64,${product.image}" alt="${product.name}" class="img-fluid" style="max-width: 60px; height: auto;"> <!-- Reduced size here -->
                            </td>
                        </tr>`;
                        tableBody.append(row);
                    });
                },
                error: function(error) {
                    console.error('Error fetching inventory data:', error);
                }
            });
        }
    

    

    const convertToCSV = async (data) => {
        const progressBar = $('#conversion-progress-bar');

        progressBar.css('width', '0%');
        progressBar.attr('aria-valuenow', 0);
        progressBar.text('0%');

   
        const csvRows = [];
        const headers = ['Name', 'Date Added', 'Price', 'Quantity', 'Amount'];
        csvRows.push(headers.join(','));


    
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const row = [
                `"${item.name}"`,
                `"${item.date}"`,
                `"${parseFloat(item.price).toLocaleString()}"`,
                item.quantity,
                `"${parseFloat(item.amount).toLocaleString()}"`
            ];
            csvRows.push(row.join(','));
    
            // Update progress
            const progress = Math.round((i + 1) / data.length * 100);
            progressBar.css('width', `${progress}%`);
            progressBar.attr('aria-valuenow', progress);
            progressBar.text(`${progress}%`);
        }

        await showToast(
            "! Download ",
            `Your csv file is ready`,
            "top-center",
            "rgba(0,0,0,0.2)",
            "success"
        );

        $(".progress-div").fadeOut()
       
        return csvRows.join('\n');
    }
    
  
    
    const downloadCSV = async (csv, filename) => {
        const csvFile = new Blob([csv], { type: 'text/csv' });
        const downloadLink = document.createElement('a');
        downloadLink.download = filename;
        downloadLink.href = window.URL.createObjectURL(csvFile);
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);

        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
    
    $('.export-topselling').click(async function() {
        const conversionProgressBar = $('#conversion-progress-bar');
        $(".progress-div").fadeIn()
       
       
        await showToast(
            "! Top selling products",
            `Getting Data from server please wait ..`,
            "top-center",
            "rgba(0,0,0,0.2)",
            "success"
        );
    
        try {
            const response = await fetch(`${base_url}/api/inventory?dbname=${dbname}`);
            const data = await response.json();

    
            // Reset and show progress bars
            conversionProgressBar.css('width', '0%').attr('aria-valuenow', 0).text('0%');
            
            // Convert data to CSV
            const csv = await convertToCSV(data);
    
            // Download CSV
            await downloadCSV(csv, 'top_selling_products.csv');
        } catch (error) {
            console.error('Error fetching inventory data:', error);
            await showToast(
                "! Error fetching inventory data:",
                `Getting Data from server please wait ..`,
                "top-center",
                "rgba(0,0,0,0.2)",
                "success"
            );
        }
    });


   
    // Function to fetch daily sales data
    function fetchDailySales() {
        const user_id = user_info._id;  // Retrieve user ID from the user_info object
        const db_name = user_info.organization;  // Retrieve the database name
    
        $.ajax({
            type: "POST",  // Change to POST for sending data
            url: `${base_url}/api-dailySales`,  // Flask route to get the daily sales data
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: JSON.stringify({
                user_id: user_id,  // Include user_id in the request payload
                db_name: db_name   // Include db_name in the request payload
            }),
            success: function (response) {
                // Assume response contains 'sales', 'profits', and 'growth' data
                const dailySales = response.sales;
                const dailyProfits = response.profits;
                const growth = response.growth;
    
                // Update the ApexChart with new data
                chart.updateSeries([dailySales, dailyProfits, growth]);
            },
            error: function (xhr, status, error) {
                console.error("Error fetching daily sales:", error);
            }
        });
    }
    
    // Initial ApexChart options
    var colors = ["#727cf5", "#6c757d", "#0acf97", "#fa5c7c"];
    var dataColors = $("#Daily-sales").data("colors");
    
    var options = {
        chart: {
            height: 320,
            type: "donut",
        },
        dataLabels: {
            enabled: false,
            formatter: function (val, opts) {
                // Show actual values, not percentages
                const seriesIndex = opts.seriesIndex;
                const actualValue = opts.w.config.series[seriesIndex];
                // Format numbers with commas
                return actualValue.toLocaleString('en-US');
            },
            style: {
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                colors: ['#FFFFFF']  // Color of the labels
            },
            dropShadow: {
                enabled: true,
                top: 1,
                left: 1,
                blur: 1,
                opacity: 0.45
            }
        },
        series: [0, 0, 0], // Placeholder values, will be updated via AJAX
        labels: ["Today's Sales", "Today's Profits", "Growth from Yesterday"],
        colors: dataColors ? dataColors.split(",") : colors,
        legend: {
            show: true,
            position: "bottom",
            horizontalAlign: "left",
            floating: false,
            fontSize: "14px",
            offsetX: 0,
            offsetY: 7,
        },
        responsive: [
            {
                breakpoint: 600,
                options: { chart: { height: 340 }, legend: { show: false } },
            },
        ],
    };
    
    // Initialize the ApexChart
    var chart = new ApexCharts(document.querySelector("#Daily-sales"), options);
    chart.render();
    




    // Function to fetch and update the Monthly and Yearly profit widgets
    function updateProfits() {
        const user_id = user_info._id;  // Retrieve user ID from the user_info object
        const db_name = user_info.organization;  // Retrieve the database name
    
        $.ajax({
            url: `${base_url}/api-monthlyYearlyProfits`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                user_id: user_id,
                db_name: db_name
            }),
            success: function(response) {
                // Format numbers with commas and no trailing decimals
                const formatCurrency = (amount) => {
                    return parseFloat(amount).toLocaleString('en-US');
                };
    
                // Update Monthly Profits
                $('#monthly-profit-amount').text('Ksh ' + formatCurrency(response.monthly_profits));
                
                // Update Monthly Growth
                const monthlyGrowthClass = response.monthly_growth >= 0 ? 'text-success' : 'text-danger';
                $('#monthly-profit-growth').html(`
                    <span class="${monthlyGrowthClass} me-2"><i class="mdi ${response.monthly_growth >= 0 ? 'mdi-arrow-up-bold' : 'mdi-arrow-down-bold'}"></i> ${response.monthly_growth}%</span>
                    <span class="text-nowrap">Since last month</span>
                `);
                
                // Update Monthly Revenue
                $('#monthly-revenue-amount').text('Ksh ' + formatCurrency(response.monthly_revenue));
                
                // Update Monthly Units Sold
                $('#monthly-units-sold').text(response.monthly_units_sold + ' units');
                
                // Update Yearly Profits
                $('#yearly-profit-amount').text('Ksh ' + formatCurrency(response.yearly_profits));
                
                // Update Yearly Growth
                const yearlyGrowthClass = response.yearly_growth >= 0 ? 'text-success' : 'text-danger';
                $('#yearly-profit-growth').html(`
                    <span class="${yearlyGrowthClass} me-2"><i class="mdi ${response.yearly_growth >= 0 ? 'mdi-arrow-up-bold' : 'mdi-arrow-down-bold'}"></i> ${response.yearly_growth}%</span>
                    <span class="text-nowrap">Since last year</span>
                `);
    
                // Update Yearly Revenue
                $('#yearly-revenue-amount').text('Ksh ' + formatCurrency(response.yearly_revenue));
                
                // Update Yearly Units Sold
                $('#yearly-units-sold').text(response.yearly_units_sold + ' units');
            },
            error: function(xhr, status, error) {
                console.error("Error fetching profits: ", error);
            }
        });
    }


    function loadNotifications() {
        $.ajax({
            url: `${base_url}/api/notifications`,  // Backend route to fetch notifications
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                user_id: user_info._id,   // Assuming user_info contains the user ID
                db_name: user_info.organization  // Assuming db_name is needed
            }),
            success: function(response) {
                if (response.success) {
                    updateNotificationList(response.notifications);
    
                    // Check if there are any notifications and toggle the badge visibility
                    const totalNotifications = response.notifications.today.length 
                        + response.notifications.yesterday.length 
                        + response.notifications.older.length;
    
                    if (totalNotifications > 0) {
                        $('#notificationBadge').show();  // Show the badge
                    } else {
                        $('#notificationBadge').hide();  // Hide the badge
                    }
                } else {
                    console.error('Failed to load notifications:', response.error);
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading notifications:', error);
            }
        });
    }
    
    function updateNotificationList(notifications) {
        let notificationContainer = $('#notificationsContent');
        notificationContainer.empty();  // Clear existing notifications
    
        // Today Notifications
        if (notifications.today.length) {
            notificationContainer.append('<h5 class="text-muted font-13 fw-normal mt-2">Today</h5>');
            notifications.today.forEach(function(notification) {
                let item = createNotificationItem(notification);
                notificationContainer.append(item);
            });
        }
    
        // Yesterday Notifications
        if (notifications.yesterday.length) {
            notificationContainer.append('<h5 class="text-muted font-13 fw-normal mt-2">Yesterday</h5>');
            notifications.yesterday.forEach(function(notification) {
                let item = createNotificationItem(notification);
                notificationContainer.append(item);
            });
        }
    
        // Older Notifications
        if (notifications.older.length) {
            notificationContainer.append('<h5 class="text-muted font-13 fw-normal mt-2">Older</h5>');
            notifications.older.forEach(function(notification) {
                let item = createNotificationItem(notification);
                notificationContainer.append(item);
            });
        }
    }
    
    function createNotificationItem(notification) {
        return `
            <a href="javascript:void(0);" class="dropdown-item p-0 notify-item card shadow-none mb-2 notification-item">
                <div class="card-body">
                    <span class="float-end noti-close-btn text-muted notification-close"><i class="mdi mdi-close"></i></span>
                    <div class="d-flex align-items-center">
                        <div class="flex-shrink-0">
                            <div class="notify-icon bg-${notification.iconColor || 'primary'}">
                                <i class="mdi ${notification.icon || 'mdi-comment-account-outline'}"></i>
                            </div>
                        </div>
                        <div class="flex-grow-1 text-truncate ms-2">
                            <h5 class="noti-item-title fw-semibold font-14">${notification.title} 
                                <small class="fw-normal text-muted ms-1">${formatTimeAgo(notification.timestamp)}</small>
                            </h5>
                            <small class="noti-item-subtitle text-muted">${notification.message}</small>
                        </div>
                    </div>
                </div>
            </a>
        `;
    }
    
    // Utility function to format time
    function formatTimeAgo(timestamp) {
        let date = new Date(timestamp);
        let now = new Date();
        let timeDiff = Math.floor((now - date) / 1000 / 60); // in minutes
    
        if (timeDiff < 60) return `${timeDiff} min ago`;
        if (timeDiff < 1440) return `${Math.floor(timeDiff / 60)} hours ago`;
        return `${Math.floor(timeDiff / 1440)} days ago`;
    }
    
    // Trigger the notifications load when the dropdown is opened
    $('#notificationsDropdown').on('show.bs.dropdown', function() {
        loadNotifications();
    });

    
    

    // Call the function to update the profits when the page loads
    setInterval(loadNotifications(),30000)

    updateProfits();

    // Optionally, you can refresh the data periodically
    setInterval(updateProfits, 60000); // Update every 60 seconds

      
    // Fetch daily sales data when the page loads
    fetchDailySales();
    
    // Optionally, you can refresh data at intervals (e.g., every minute)
    setInterval(fetchDailySales, 60000); // Fetch new data every 60 seconds
   
      

    // Initial fetch to populate the table
    top_selling_table();


    fetchDashboardData()

    setInterval(fetchDashboardData,60000)
    
        
});




