$(document).ready( function() {


    let base_url = user_info.base_url;
    let dbname = user_info.organization;


    let revenueChartInstance;
    let highPerformingChartInstance;

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
                    $('#purchase-count').text(data.purchases.toLocaleString());
                    $('#revenue-amount').text(`ksh ${data.revenue.toLocaleString()}`);
                    $('#growth-percentage').text(data.growth_percentage + '%');

                    // Update percentage indicators if needed
                    $('#customer-growth').html(data.customer_growth > 0 ? 
                        `<span class="text-success me-2"><i class="mdi mdi-arrow-up-bold"></i> ${data.customer_growth}%</span> <span class="text-nowrap">Since last month</span>` : 
                        (data.customer_growth < 0 ? 
                            `<span class="text-danger me-2"><i class="mdi mdi-arrow-down-bold"></i> ${data.customer_growth}%</span> <span class="text-nowrap">Since last month</span>` :
                            `<span class="text-warning me-2"><i class="mdi mdi-arrow-right-bold"></i> ${data.customer_growth}%</span> <span class="text-nowrap">Since last month</span>`));
                    
                    $('#purchase-growth').html(data.purchase_growth > 0 ? 
                        `<span class="text-success me-2"><i class="mdi mdi-arrow-up-bold"></i> ${data.purchase_growth}%</span> <span class="text-nowrap">Since last month</span>` : 
                        (data.purchase_growth < 0 ? 
                            `<span class="text-danger me-2"><i class="mdi mdi-arrow-down-bold"></i> ${data.purchase_growth}%</span> <span class="text-nowrap">Since last month</span>` :
                            `<span class="text-warning me-2"><i class="mdi mdi-arrow-right-bold"></i> ${data.purchase_growth}%</span> <span class="text-nowrap">Since last month</span>`));
                    
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

    const top_selling_table=()=>{
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
                            <span class="text-muted font-13">Quantity</span>
                        </td>
                        <td>
                            <h5 class="font-14 my-1 fw-normal">Ksh ${parseFloat(product.amount).toLocaleString()}</h5>
                            <span class="text-muted font-13">Amount</span>
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

    top_selling_table()

    fetchDashboardData()

    setInterval(fetchDashboardData,60000)
    
        
});




