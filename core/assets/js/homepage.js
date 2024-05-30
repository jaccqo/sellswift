$(document).ready( function() {


    let base_url = user_info.base_url;
    let dbname = user_info.organization;

    fetch(`${base_url}/api/dashboard-data?dbname=${dbname}`)
        .then(response => response.json())
        .then(data => {
            if (!data.error) {
                $('#customer-count').text(data.customers.toLocaleString());
                $('#purchase-count').text(data.purchases.toLocaleString());
                $('#revenue-amount').text(`ksh ${data.revenue.toLocaleString()}`);
                $('#growth-percentage').text(data.growth_percentage + '%');

                // Update percentage indicators if needed
                $('#customer-growth').html(data.customer_growth > 0 ? 
                    `<span class="text-success me-2"><i class="mdi mdi-arrow-up-bold"></i> ${data.customer_growth}%</span>   <span class="text-nowrap">Since last month</span>` : 
                    `<span class="text-danger me-2"><i class="mdi mdi-arrow-down-bold"></i> ${data.customer_growth}%</span>  <span class="text-nowrap">Since last month</span>`);

                $('#purchase-growth').html(data.purchase_growth > 0 ? 
                    `<span class="text-success me-2"><i class="mdi mdi-arrow-up-bold"></i> ${data.purchase_growth}%</span>    <span class="text-nowrap">Since last month</span>` : 
                    `<span class="text-danger me-2"><i class="mdi mdi-arrow-down-bold"></i> ${data.purchase_growth}%</span>    <span class="text-nowrap">Since last month</span>`);

                $('#revenue-growth').html(data.revenue_growth > 0 ? 
                    `<span class="text-success me-2"><i class="mdi mdi-arrow-up-bold"></i> ${data.revenue_growth}%</span>       <span class="text-nowrap">Since last month</span>` : 
                    `<span class="text-danger me-2"><i class="mdi mdi-arrow-down-bold"></i> ${data.revenue_growth}%</span>      <span class="text-nowrap">Since last month</span>`);

                $('#growth-indicator').html(data.growth_percentage > 0 ? 
                    `<span class="text-success me-2"><i class="mdi mdi-arrow-up-bold"></i> ${data.growth_percentage}%</span>    <span class="text-nowrap">Since last month</span>` : 
                    `<span class="text-danger me-2"><i class="mdi mdi-arrow-down-bold"></i> ${data.growth_percentage}%</span>    <span class="text-nowrap">Since last month</span>`);
            } else {
                console.error('Error fetching dashboard data:', data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching dashboard data:', error);
        });

        


            
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
                            return e + "ksh ";
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
                series: [{ name: "Actual", data: data.actualData }],
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
                            return e + "ksh";
                        },
                        offsetX: -15,
                    },
                },
                fill: { opacity: 1 },
                tooltip: {
                    y: {
                        formatter: function (e) {
                            return "ksh " + e ;
                        },
                    },
                },
            };
            const highPerformingChart = new ApexCharts(document.querySelector("#high-performing-product"), highPerformingConfig);
            highPerformingChart.render();
            return highPerformingChart;
        };
        
        // Define global variables to hold chart instances
        let revenueChartInstance;
        let highPerformingChartInstance;
        
        const fetchDataAndUpdateCharts = () => {
            // Example: Fetch data using AJAX or other methods
            const revenueData = {
                currentWeek: [100, 200, 150, 250, 200, 300, 200], // Dummy data for the current week
                previousWeek: [50, 150, 100, 300, 150, 350, 250], // Dummy data for the previous week
                categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], // Categories for x-axis
            };
        
            const highPerformingData = {
                actualData: [1, 5, 0, 1, 6, 8, 0], // Dummy data for the high-performing product chart
                categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"], // Categories for x-axis
            };
        
            // Check if chart instances exist, if not, render the charts
            if (!revenueChartInstance) {
                revenueChartInstance = renderRevenueChart(revenueData);
            } else {
                // Update the series data for the revenue chart
                revenueChartInstance.updateSeries([
                    { data: revenueData.currentWeek },
                    { data: revenueData.previousWeek }
                ]);
            }
        
            if (!highPerformingChartInstance) {
                highPerformingChartInstance = renderHighPerformingChart(highPerformingData);
            } else {
                // Update the series data for the high-performing chart
                highPerformingChartInstance.updateSeries([{ data: highPerformingData.actualData }]);
            }

            
        };
        
        // Initial data fetch and update
        fetchDataAndUpdateCharts();
        
        // Schedule data fetch and update at intervals
        setInterval(fetchDataAndUpdateCharts, 1000); // Update every second (adjust interval as needed)
        
        
        

        
});




