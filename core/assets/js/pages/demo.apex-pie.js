$(document).ready(function () {
  // Function to initialize charts
  function initCharts() {
    // Colors array for charts
    const colors = ["#727cf5", "#6c757d", "#0acf97", "#fa5c7c", "#e3eaef"];

    // Simple Pie Chart
    const simplePieOptions = {
      chart: { height: 320, type: "pie" },
      series: [44, 55, 41, 17, 15],
      labels: ["Series 1", "Series 2", "Series 3", "Series 4", "Series 5"],
      colors: colors,
      legend: {
        show: true,
        position: "bottom",
        horizontalAlign: "center",
        verticalAlign: "middle",
        floating: false,
        fontSize: "14px",
        offsetX: 0,
        offsetY: 7,
      },
      responsive: [
        {
          breakpoint: 600,
          options: { chart: { height: 240 }, legend: { show: false } },
        },
      ],
    };
    const simplePieChart = new ApexCharts(document.querySelector("#simple-pie"), simplePieOptions);
    simplePieChart.render();

    // Simple Donut Chart
    const simpleDonutOptions = {
      chart: { height: 320, type: "donut" },
      series: [44, 55, 41, 17, 15],
      labels: ["Series 1", "Series 2", "Series 3", "Series 4", "Series 5"],
      colors: colors,
      legend: {
        show: true,
        position: "bottom",
        horizontalAlign: "center",
        verticalAlign: "middle",
        floating: false,
        fontSize: "14px",
        offsetX: 0,
        offsetY: 7,
      },
      responsive: [
        {
          breakpoint: 600,
          options: { chart: { height: 240 }, legend: { show: false } },
        },
      ],
    };
    const simpleDonutChart = new ApexCharts(document.querySelector("#simple-donut"), simpleDonutOptions);
    simpleDonutChart.render();

    // Monochrome Pie Chart
    const monochromePieOptions = {
      chart: { height: 320, type: "pie" },
      series: [25, 15, 44, 55, 41, 17],
      labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      legend: {
        show: true,
        position: "bottom",
        horizontalAlign: "center",
        verticalAlign: "middle",
        floating: false,
        fontSize: "14px",
        offsetX: 0,
        offsetY: 7,
      },
      theme: { monochrome: { enabled: true } },
      responsive: [
        {
          breakpoint: 600,
          options: { chart: { height: 240 }, legend: { show: false } },
        },
      ],
    };
    const monochromePieChart = new ApexCharts(document.querySelector("#monochrome-pie"), monochromePieOptions);
    monochromePieChart.render();

    // Gradient Donut Chart
    const gradientDonutOptions = {
      chart: { height: 320, type: "donut" },
      series: [44, 55, 41, 17, 15],
      labels: ["Series 1", "Series 2", "Series 3", "Series 4", "Series 5"],
      colors: colors,
      fill: { type: "gradient" },
      legend: {
        show: true,
        position: "bottom",
        horizontalAlign: "center",
        verticalAlign: "middle",
        floating: false,
        fontSize: "14px",
        offsetX: 0,
        offsetY: 7,
      },
      responsive: [
        {
          breakpoint: 600,
          options: { chart: { height: 240 }, legend: { show: false } },
        },
      ],
    };
    const gradientDonutChart = new ApexCharts(document.querySelector("#gradient-donut"), gradientDonutOptions);
    gradientDonutChart.render();

    // Patterned Donut Chart
    const patternedDonutOptions = {
      chart: {
        height: 320,
        type: "donut",
        dropShadow: { enabled: true, color: "#111", top: -1, left: 3, blur: 3, opacity: 0.2 },
      },
      stroke: { show: true, width: 2 },
      series: [44, 55, 41, 17, 15],
      labels: ["Comedy", "Action", "SciFi", "Drama", "Horror"],
      colors: colors,
      dataLabels: { dropShadow: { blur: 3, opacity: 0.8 } },
      fill: {
        type: "pattern",
        opacity: 1,
        pattern: {
          enabled: true,
          style: ["verticalLines", "squares", "horizontalLines", "circles", "slantedLines"],
        },
      },
      legend: {
        show: true,
        position: "bottom",
        horizontalAlign: "center",
        verticalAlign: "middle",
        floating: false,
        fontSize: "14px",
        offsetX: 0,
        offsetY: 7,
      },
      responsive: [
        {
          breakpoint: 600,
          options: { chart: { height: 240 }, legend: { show: false } },
        },
      ],
    };
    const patternedDonutChart = new ApexCharts(document.querySelector("#patterned-donut"), patternedDonutOptions);
    patternedDonutChart.render();

    // Image Pie Chart
    const imagePieOptions = {
      chart: { height: 320, type: "pie" },
      labels: ["Series 1", "Series 2", "Series 3", "Series 4"],
      colors: colors,
      series: [44, 33, 54, 45],
      fill: {
        type: "image",
        opacity: 0.85,
        image: {
          src: [
            "assets/images/small/small-1.jpg",
            "assets/images/small/small-2.jpg",
            "assets/images/small/small-3.jpg",
            "assets/images/small/small-4.jpg",
          ],
          width: 25,
          height: 25,
        },
      },
      stroke: { width: 4 },
      dataLabels: { enabled: false },
      legend: {
        show: true,
        position: "bottom",
        horizontalAlign: "center",
        verticalAlign: "middle",
        floating: false,
        fontSize: "14px",
        offsetX: 0,
        offsetY: 7,
      },
      responsive: [
        {
          breakpoint: 600,
          options: { chart: { height: 240 }, legend: { show: false } },
        },
      ],
    };
    const imagePieChart = new ApexCharts(document.querySelector("#image-pie"), imagePieOptions);
    imagePieChart.render();
  }

  // Call the function to initialize all charts
  initCharts();
});
