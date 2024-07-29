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
                            <img src="data:image/png;base64,${product.image}" alt="${product.name}" class="img-fluid" style="max-width: 100px;">
                        
                        
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

    // Initial fetch to populate the table
    top_selling_table();


    fetchDashboardData()

    setInterval(fetchDashboardData,60000)
    
        
});




