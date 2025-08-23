export class ChartRenderer {
  constructor() {
    this.charts = {};
  }

  destroy(id) {
    if (this.charts[id]) {
      this.charts[id].destroy();
      delete this.charts[id];
    }
  }

  productionTrend(ctx) {
    if (!ctx) return;
    this.destroy("production");
    this.charts.production = new Chart(ctx.getContext("2d"), {
      type: "line",
      data: {
        labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
        datasets: [
          {
            label: "Oil (bbl/d)",
            data: [24500, 25200, 26100, 26800, 27500, 28400],
            borderColor: "#f6851f",
            backgroundColor: "rgba(246, 133, 31, 0.1)",
            tension: 0.3,
            fill: true,
          },
          {
            label: "Gas (mcf/d)",
            data: [12500, 12800, 13200, 13600, 13900, 14200],
            borderColor: "#2c5985",
            backgroundColor: "rgba(44, 89, 133, 0.1)",
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
        scales: {
          y: { beginAtZero: false, grid: { drawBorder: false } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  statusDistribution(ctx, counts) {
    if (!ctx) return;
    this.destroy("status");
    this.charts.status = new Chart(ctx.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Producing", "Shut-in", "Abandoned", "Drilling"],
        datasets: [
          {
            data: [
              counts.Producing || 0,
              counts["Shut-in"] || 0,
              counts.Abandoned || 0,
              counts.Drilling || 0,
            ],
            backgroundColor: ["#4caf50", "#ff9800", "#f44336", "#2c5985"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: { legend: { position: "bottom" } },
      },
    });
  }

  fieldProduction(ctx, labels, values) {
    if (!ctx) return;
    this.destroy("field");
    this.charts.field = new Chart(ctx.getContext("2d"), {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Production (BOE/d)",
            data: values,
            backgroundColor: "#2c5985",
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { drawBorder: false } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  productionType(ctx, shares) {
    if (!ctx) return;
    this.destroy("productionType");
    this.charts.productionType = new Chart(ctx.getContext("2d"), {
      type: "pie",
      data: {
        labels: ["Oil", "Gas", "NGL"],
        datasets: [
          {
            data: [
              Math.round(shares.oil * 100),
              Math.round(shares.gas * 100),
              Math.round(shares.ngl * 100),
            ],
            backgroundColor: ["#f6851f", "#2c5985", "#4a7bab"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
      },
    });
  }

  // Bonus: forecast chart per field
  forecastChart(ctx, labels, seriesByField) {
    if (!ctx) return;
    this.destroy("forecast");
    const datasets = Object.entries(seriesByField).map(
      ([field, { series }], idx) => ({
        label: `${field} (forecast)`,
        data: series,
        borderColor: ["#2c5985", "#f6851f", "#4a7bab", "#6c757d", "#20c997"][
          idx % 5
        ],
        backgroundColor: "transparent",
        fill: false,
        tension: 0.2,
      })
    );
    this.charts.forecast = new Chart(ctx.getContext("2d"), {
      type: "line",
      data: { labels, datasets },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
      },
    });
  }

  // Water Cut Analysis Chart
  waterCutChart(ctx, fields, waterCutData) {
    if (!ctx) return;
    this.destroy("waterCut");
    this.charts.waterCut = new Chart(ctx.getContext("2d"), {
      type: "bar",
      data: {
        labels: fields,
        datasets: [
          {
            label: "Water Cut (%)",
            data: waterCutData,
            backgroundColor: [
              "#1282c4",
              "#f6851f",
              "#4a7bab",
              "#6c757d",
              "#20c997",
            ],
            borderColor: [
              "#0d3d91",
              "#e67e22",
              "#2c5985",
              "#495057",
              "#17a2b8",
            ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function (value) {
                return value + "%";
              },
            },
          },
        },
      },
    });
  }
}
