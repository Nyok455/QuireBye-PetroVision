// Main application entry point (modularized)
import { HELPERS } from "./utils/helpers.js";
import { CONSTANTS } from "./utils/constants.js";
import { DataHandler } from "./modules/dataHandler.js";
import { ChartRenderer } from "./modules/chartRenderer.js";
import { UIComponents } from "./modules/uiComponents.js";
import { FileProcessor } from "./modules/fileProcessor.js";
import { ManagementHandler } from "./modules/managementHandler.js";

class OilGasDashboard {
  constructor() {
    this.data = new DataHandler();
    this.charts = new ChartRenderer();
    this.ui = new UIComponents();
    this.files = new FileProcessor();
    this.management = new ManagementHandler();

    this.wellData = [];
    this.currentFieldFilter = "all";
    this.refreshIntervalId = null;
    this.currentPage = 1;
    this.rowsPerPage = 10;

    this.init();
  }

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this.initializeApp();
      this.setupEventListeners();
    });
  }

  async initializeApp() {
    HELPERS.updateDateTime();

    // Try to load realistic South Sudan data from local CSV first
    try {
      const res = await fetch("assets/data/south_sudan_wells.csv", {
        cache: "no-store",
      });
      if (res.ok) {
        const csv = await res.text();
        this.wellData = this.data.processCSVData(csv);
      } else {
        this.wellData = this.data.generateSampleData();
      }
    } catch (e) {
      // Fallback to synthetic data when running from file:// or offline
      this.wellData = this.data.generateSampleData();
    }

    // KPIs and Top wells
    this.ui.updateKPIs(this.data.calcKPIs());
    this.ui.updateTopWells(this.wellData);

    // Charts
    this.initializeCharts();

    // Populate Management (CEO) snapshot if present
    this.initializeManagementSection();

    // Table
    this.populateTable();

    // Anomalies section (if present)
    const anomalies = this.data.detectAnomalies();
    this.ui.showAnomaliesList?.(anomalies);

    // Start refresh
    this.startAutoRefresh();
  }

  initializeCharts() {
    this.charts.productionTrend(document.getElementById("productionChart"));

    // Status distribution
    const statusCounts = {
      Producing: this.wellData.filter((w) => w.status === "Producing").length,
      "Shut-in": this.wellData.filter((w) => w.status === "Shut-in").length,
      Abandoned: this.wellData.filter((w) => w.status === "Abandoned").length,
      Drilling: this.wellData.filter((w) => w.status === "Drilling").length,
    };
    this.charts.statusDistribution(
      document.getElementById("statusChart"),
      statusCounts
    );

    // Field production
    const fields = [...new Set(this.wellData.map((w) => w.field))];
    const fieldProduction = fields.map((f) =>
      this.wellData
        .filter((w) => w.field === f && w.status === "Producing")
        .reduce((s, w) => s + w.production, 0)
    );
    this.charts.fieldProduction(
      document.getElementById("fieldChart"),
      fields,
      fieldProduction
    );

    // Production type shares
    this.charts.productionType(
      document.getElementById("productionTypeChart"),
      CONSTANTS.PRODUCTION_TYPE_SHARE
    );

    // Optional forecast chart if canvas exists (dashboard)
    const forecastCanvas = document.getElementById("forecastChart");
    if (forecastCanvas) {
      const fc = this.data.forecastDecline({});
      const months = Array.from(
        { length: CONSTANTS.ANALYTICS.forecastMonths },
        (_, i) => `M${i + 1}`
      );
      this.charts.forecastChart(forecastCanvas, months, fc);
    }

    // Water Cut Analysis Chart
    const waterCutCanvas = document.getElementById("waterCutChart");
    if (waterCutCanvas) {
      const fields = [...new Set(this.wellData.map((w) => w.field))];
      const waterCutData = fields.map((f) => {
        const fieldWells = this.wellData.filter(
          (w) => w.field === f && w.status === "Producing"
        );
        if (fieldWells.length === 0) return 0;
        const avgWaterCut =
          fieldWells.reduce((sum, w) => sum + w.waterCut, 0) /
          fieldWells.length;
        return Math.round(avgWaterCut * 100) / 100;
      });
      this.charts.waterCutChart(waterCutCanvas, fields, waterCutData);
    }

    // Optional forecast chart for Management page
    const mgtForecastCanvas = document.getElementById("mgtForecastChart");
    if (mgtForecastCanvas) {
      const fc = this.data.forecastDecline({});
      const months = Array.from(
        { length: CONSTANTS.ANALYTICS.forecastMonths },
        (_, i) => `M${i + 1}`
      );
      this.charts.forecastChart(mgtForecastCanvas, months, fc);

      // Update management page KPIs
      this.updateManagementKPIs();
    }
  }

  populateTable() {
    const wells = this.applyCurrentFilter(this.wellData);
    this.ui.populateTable(wells, this.currentPage, this.rowsPerPage);
    this.updatePaginationInfo(wells.length);

    // Hook up details buttons
    const table = document.getElementById("wells-table");
    if (table) {
      table.querySelectorAll(".well-details-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.getAttribute("data-well-id");
          this.showWellDetails(id);
        });
      });
    }
  }

  updatePaginationInfo(total = this.wellData.length) {
    const totalPages = Math.max(1, Math.ceil(total / this.rowsPerPage));
    const nextBtn = document.getElementById("next-page");
    const prevBtn = document.getElementById("prev-page");
    if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
    if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
  }

  applyCurrentFilter(list) {
    if (this.currentFieldFilter === "all") return list;
    return list.filter(
      (w) =>
        w.field.toLowerCase().replace(/\s/g, "-") === this.currentFieldFilter
    );
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll("[data-page]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = e.currentTarget.getAttribute("data-page");
        this.showPage(page);
        // Set active state on nav
        document
          .querySelectorAll(".nav-link")
          .forEach((l) => l.classList.remove("active"));
        const maybeNav = e.currentTarget.classList.contains("nav-link")
          ? e.currentTarget
          : null;
        if (maybeNav) maybeNav.classList.add("active");
      });
    });

    // Field filter buttons
    document.querySelectorAll(".filter-btn[data-field]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document
          .querySelectorAll(".filter-btn[data-field]")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        this.currentFieldFilter = e.target.getAttribute("data-field");
        this.currentPage = 1;
        this.populateTable();
      });
    });

    // Date filter (placeholder)
    const dateFilter = document.getElementById("date-filter");
    if (dateFilter)
      dateFilter.addEventListener("change", () => this.populateTable());

    // Export
    const exportBtn = document.getElementById("export-btn");
    if (exportBtn)
      exportBtn.addEventListener("click", () =>
        this.files.exportCSV(this.wellData)
      );

    // Settings modal
    const settingsBtn = document.getElementById("settings-btn");
    if (settingsBtn)
      settingsBtn.addEventListener("click", () =>
        new bootstrap.Modal(document.getElementById("settingsModal")).show()
      );

    // Upload modal
    const uploadBtn = document.getElementById("upload-btn");
    if (uploadBtn)
      uploadBtn.addEventListener("click", () =>
        new bootstrap.Modal(document.getElementById("uploadModal")).show()
      );

    // Pagination
    const prevBtn = document.getElementById("prev-page");
    const nextBtn = document.getElementById("next-page");
    if (prevBtn)
      prevBtn.addEventListener("click", () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.populateTable();
        }
      });
    if (nextBtn)
      nextBtn.addEventListener("click", () => {
        const total = this.applyCurrentFilter(this.wellData).length;
        const totalPages = Math.ceil(total / this.rowsPerPage);
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.populateTable();
        }
      });

    // Rows per page
    const rowsPerPageSelect = document.getElementById("rows-per-page");
    if (rowsPerPageSelect)
      rowsPerPageSelect.addEventListener("change", (e) => {
        this.rowsPerPage = parseInt(e.target.value);
        this.currentPage = 1;
        this.populateTable();
      });

    // File upload handling
    this.setupFileUploadListeners();

    // Forecast CSV upload
    const uploadForecastBtn = document.getElementById("upload-forecast-btn");
    if (uploadForecastBtn)
      uploadForecastBtn.addEventListener("click", () =>
        new bootstrap.Modal(
          document.getElementById("forecastUploadModal")
        ).show()
      );

    // Save settings
    const saveSettingsBtn = document.getElementById("save-settings");
    if (saveSettingsBtn)
      saveSettingsBtn.addEventListener("click", () => {
        const refreshInterval = parseInt(
          document.getElementById("refresh-interval").value
        );
        const units = document.getElementById("units").value;
        const notifications = document.getElementById("notifications").checked;
        alert(
          `Settings saved:\nRefresh Interval: ${refreshInterval}ms\nUnits: ${units}\nNotifications: ${notifications}`
        );
        this.startAutoRefresh(refreshInterval);
        bootstrap.Modal.getInstance(
          document.getElementById("settingsModal")
        ).hide();
      });
  }

  setupFileUploadListeners() {
    const fileInput = document.getElementById("file-input");
    const dropZone = document.getElementById("drop-zone");
    const processDataBtn = document.getElementById("process-data-btn");
    const downloadSample = document.getElementById("download-sample");

    if (downloadSample) {
      downloadSample.addEventListener("click", (e) => {
        e.preventDefault();
        const csv = this.files.makeTemplateCSV();
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "well_data_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    }

    if (!fileInput || !dropZone || !processDataBtn) return;

    dropZone.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        processDataBtn.disabled = false;
        dropZone.innerHTML = `
          <div class="file-upload-icon text-success"><i class="fas fa-check-circle"></i></div>
          <p>File selected: ${e.target.files[0].name}</p>
          <p class="small">Click \"Process Data\" to continue</p>
        `;
      }
    });

    // Drag & drop
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "#2c5985";
      dropZone.style.backgroundColor = "rgba(44, 89, 133, 0.1)";
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.style.borderColor = "#dee2e6";
      dropZone.style.backgroundColor = "transparent";
    });
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "#dee2e6";
      dropZone.style.backgroundColor = "transparent";
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        processDataBtn.disabled = false;
        dropZone.innerHTML = `
          <div class="file-upload-icon text-success"><i class="fas fa-check-circle"></i></div>
          <p>File selected: ${e.dataTransfer.files[0].name}</p>
          <p class="small">Click \"Process Data\" to continue</p>
        `;
      }
    });

    processDataBtn.addEventListener("click", async () => {
      if (!fileInput.files.length) return;
      const file = fileInput.files[0];
      const text = await file.text();
      this.wellData = this.data.processCSVData(text);
      this.ui.updateKPIs(this.data.calcKPIs());
      this.ui.updateTopWells(this.wellData);
      this.initializeCharts();
      this.currentPage = 1;
      this.populateTable();
      document.getElementById("upload-status").innerHTML =
        '<div class="alert alert-success">Data processed successfully.</div>';
    });

    // Forecast CSV upload handlers
    this.setupForecastUploadListeners();
  }

  setupForecastUploadListeners() {
    const forecastFileInput = document.getElementById("forecast-file-input");
    const forecastDropZone = document.getElementById("forecast-drop-zone");
    const processForecastBtn = document.getElementById("process-forecast-btn");
    const downloadForecastSample = document.getElementById(
      "download-forecast-sample"
    );

    if (downloadForecastSample) {
      downloadForecastSample.addEventListener("click", (e) => {
        e.preventDefault();
        const csv = this.createForecastTemplate();
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "forecast_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    }

    if (!forecastFileInput || !forecastDropZone || !processForecastBtn) return;

    forecastDropZone.addEventListener("click", () => forecastFileInput.click());

    forecastFileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        processForecastBtn.disabled = false;
        forecastDropZone.innerHTML = `
          <div class="file-upload-icon text-success"><i class="fas fa-check-circle"></i></div>
          <p>File selected: ${e.target.files[0].name}</p>
          <p class="small">Click "Process Forecast Data" to continue</p>
        `;
      }
    });

    // Drag & drop for forecast
    forecastDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      forecastDropZone.style.borderColor = "#2c5985";
      forecastDropZone.style.backgroundColor = "rgba(44, 89, 133, 0.1)";
    });
    forecastDropZone.addEventListener("dragleave", () => {
      forecastDropZone.style.borderColor = "#dee2e6";
      forecastDropZone.style.backgroundColor = "transparent";
    });
    forecastDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      forecastDropZone.style.borderColor = "#dee2e6";
      forecastDropZone.style.backgroundColor = "transparent";
      if (e.dataTransfer.files.length > 0) {
        forecastFileInput.files = e.dataTransfer.files;
        processForecastBtn.disabled = false;
        forecastDropZone.innerHTML = `
          <div class="file-upload-icon text-success"><i class="fas fa-check-circle"></i></div>
          <p>File selected: ${e.dataTransfer.files[0].name}</p>
          <p class="small">Click "Process Forecast Data" to continue</p>
        `;
      }
    });

    processForecastBtn.addEventListener("click", async () => {
      if (!forecastFileInput.files.length) return;
      const file = forecastFileInput.files[0];
      const text = await file.text();
      const forecastData = this.processForecastCSV(text);
      if (forecastData) {
        this.updateForecastChart(forecastData);
        this.updateManagementForecastChart(forecastData);
        document.getElementById("forecast-upload-status").innerHTML =
          '<div class="alert alert-success">Forecast data processed successfully.</div>';
        document.getElementById(
          "forecast-data-source"
        ).textContent = `Data from uploaded CSV: ${
          file.name
        } (${new Date().toLocaleDateString()})`;
        bootstrap.Modal.getInstance(
          document.getElementById("forecastUploadModal")
        ).hide();

        // Navigate to management dashboard to show the updated forecast
        setTimeout(() => {
          this.showPage("management");
        }, 500);
      } else {
        document.getElementById("forecast-upload-status").innerHTML =
          '<div class="alert alert-danger">Error processing forecast data. Please check the file format.</div>';
      }
    });
  }

  createForecastTemplate() {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + i,
        1
      );
      months.push(
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      );
    }

    let csv = "Month,Production (BOE/d)\n";
    months.forEach((month, index) => {
      const production = 45000 - index * 2000; // Example declining production
      csv += `${month},${production}\n`;
    });
    return csv;
  }

  processForecastCSV(csvText) {
    try {
      const lines = csvText.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim());

      // Check for month columns in the headers
      const monthColumns = headers.filter((h) =>
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/.test(h)
      );

      if (monthColumns.length > 0) {
        // Check if it's the production.csv format (Category, Field, months, Unit)
        if (headers.includes("Category") && headers.includes("Field")) {
          return this.processProductionFormat(lines, headers);
        } else {
          // Process South Sudan forecast format (Field, months)
          return this.processSouthSudanFormat(lines, headers);
        }
      } else {
        // Process simple Month, Production format
        return this.processSimpleFormat(lines, headers);
      }
    } catch (error) {
      console.error("Error processing forecast CSV:", error);
      return null;
    }
  }

  processProductionFormat(lines, headers) {
    const categoryIndex = headers.indexOf("Category");
    const fieldIndex = headers.indexOf("Field");
    const unitIndex = headers.indexOf("Unit");

    // Get month column indices
    const monthColumns = headers.filter((h) =>
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/.test(h)
    );

    const fieldData = {};
    let totalsByMonth = {};

    // Initialize totals
    monthColumns.forEach((month) => {
      totalsByMonth[month] = 0;
    });

    // Process each line, focus on Oil Production for forecast
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line === "-") continue; // Skip empty lines and separators

      const values = line.split(",").map((v) => v.trim());
      const category = values[categoryIndex];
      const fieldName = values[fieldIndex];

      // Only process Oil Production data for forecast
      if (
        category === "Oil Production" &&
        fieldName &&
        fieldName.toLowerCase() !== "total"
      ) {
        fieldData[fieldName] = {};

        monthColumns.forEach((month) => {
          const monthIndex = headers.indexOf(month);
          if (monthIndex !== -1 && values[monthIndex]) {
            const production = parseFloat(values[monthIndex]) || 0;
            fieldData[fieldName][month] = production;
            totalsByMonth[month] += production;
          }
        });
      }
    }

    // Convert to chart format
    const chartData = {
      months: monthColumns,
      total: monthColumns.map((month) => totalsByMonth[month]),
      fields: fieldData,
    };

    return chartData;
  }

  processSouthSudanFormat(lines, headers) {
    const monthColumns = headers
      .slice(1)
      .filter((h) =>
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/.test(h)
      );

    const fieldData = {};
    let totalsByMonth = {};

    // Initialize totals
    monthColumns.forEach((month) => {
      totalsByMonth[month] = 0;
    });

    // Process each field
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const fieldName = values[0];

      if (fieldName && fieldName.toLowerCase() !== "total") {
        fieldData[fieldName] = {};
        monthColumns.forEach((month, index) => {
          const production = parseFloat(values[index + 1]) || 0;
          fieldData[fieldName][month] = production;
          totalsByMonth[month] += production;
        });
      }
    }

    // Convert to chart format
    const chartData = {
      months: monthColumns,
      total: monthColumns.map((month) => totalsByMonth[month]),
      fields: fieldData,
    };

    return chartData;
  }

  processSimpleFormat(lines, headers) {
    const monthIndex = headers.findIndex(
      (h) =>
        h.toLowerCase().includes("month") || h.toLowerCase().includes("date")
    );
    const productionIndex = headers.findIndex(
      (h) =>
        h.toLowerCase().includes("production") ||
        h.toLowerCase().includes("boe")
    );

    if (monthIndex === -1 || productionIndex === -1) {
      console.error("Required columns not found. Expected: Month, Production");
      return null;
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length >= Math.max(monthIndex, productionIndex) + 1) {
        data.push({
          month: values[monthIndex],
          production:
            parseFloat(values[productionIndex].replace(/[^\d.-]/g, "")) || 0,
        });
      }
    }

    return {
      months: data.map((d) => d.month),
      total: data.map((d) => d.production),
      fields: {},
    };
  }

  updateForecastChart(forecastData) {
    const chart = this.charts?.forecast || Chart.getChart("forecastChart");
    if (chart) {
      chart.data.labels = forecastData.months;

      // Clear existing datasets
      chart.data.datasets = [];

      // Add total production line
      chart.data.datasets.push({
        label: "Total Production Forecast",
        data: forecastData.total,
        borderColor: "#2c5985",
        backgroundColor: "rgba(44, 89, 133, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#2c5985",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
      });

      // Add individual field lines (top 5 fields by average production)
      const fieldEntries = Object.entries(forecastData.fields);
      if (fieldEntries.length > 0) {
        const fieldAverages = fieldEntries.map(([field, data]) => {
          const values = Object.values(data);
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          return { field, avg, data };
        });

        fieldAverages.sort((a, b) => b.avg - a.avg);
        const topFields = fieldAverages.slice(0, 5);

        const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f7dc6f", "#bb8fce"];

        topFields.forEach((fieldInfo, index) => {
          const fieldData = forecastData.months.map(
            (month) => fieldInfo.data[month] || 0
          );

          chart.data.datasets.push({
            label: fieldInfo.field,
            data: fieldData,
            borderColor: colors[index % colors.length],
            backgroundColor: "transparent",
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointBackgroundColor: colors[index % colors.length],
            pointBorderColor: "#fff",
            pointBorderWidth: 1,
            pointRadius: 3,
          });
        });
      }

      chart.update();
    } else {
      // If no existing chart, recreate it
      const forecastCanvas = document.getElementById("forecastChart");
      if (forecastCanvas) {
        this.recreateForecastChart(forecastCanvas, forecastData);
      }
    }
  }

  recreateForecastChart(canvas, forecastData) {
    // Destroy existing chart if any
    this.charts?.destroy?.("forecast");

    const datasets = [];

    // Add total production line
    datasets.push({
      label: "Total Production Forecast",
      data: forecastData.total,
      borderColor: "#2c5985",
      backgroundColor: "rgba(44, 89, 133, 0.1)",
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: "#2c5985",
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      pointRadius: 5,
    });

    // Add individual field lines (top 5 fields by average production)
    const fieldEntries = Object.entries(forecastData.fields);
    if (fieldEntries.length > 0) {
      const fieldAverages = fieldEntries.map(([field, data]) => {
        const values = Object.values(data);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return { field, avg, data };
      });

      fieldAverages.sort((a, b) => b.avg - a.avg);
      const topFields = fieldAverages.slice(0, 5);

      const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f7dc6f", "#bb8fce"];

      topFields.forEach((fieldInfo, index) => {
        const fieldData = forecastData.months.map(
          (month) => fieldInfo.data[month] || 0
        );

        datasets.push({
          label: fieldInfo.field,
          data: fieldData,
          borderColor: colors[index % colors.length],
          backgroundColor: "transparent",
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: colors[index % colors.length],
          pointBorderColor: "#fff",
          pointBorderWidth: 1,
          pointRadius: 3,
        });
      });
    }

    // Create new chart
    if (!this.charts) this.charts = { destroy: () => {} };
    this.charts.forecast = new Chart(canvas.getContext("2d"), {
      type: "line",
      data: { labels: forecastData.months, datasets },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Production (BOE/d)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Month",
            },
          },
        },
      },
    });
  }

  updateManagementForecastChart(forecastData) {
    const mgtForecastCanvas = document.getElementById("mgtForecastChart");
    if (mgtForecastCanvas) {
      // Use the same chartRenderer method that's used in initializeCharts
      this.recreateForecastChart(mgtForecastCanvas, forecastData);
    }
  }

  // Populate Management (CEO) snapshot numbers on initial load
  initializeManagementSection() {
    const mgtProdEl = document.getElementById("mgt-total-production");
    const mgtWellsEl = document.getElementById("mgt-wells");
    const mgtWaterEl = document.getElementById("mgt-water-cut");
    const mgtProdChange = document.getElementById("mgt-prod-change");
    const mgtWellsChange = document.getElementById("mgt-wells-change");
    const mgtWaterChange = document.getElementById("mgt-water-change");
    if (mgtProdEl && mgtWellsEl && mgtWaterEl) {
      const kpis = this.data.calcKPIs();
      mgtProdEl.innerHTML = `${kpis.totalProduction.toLocaleString()} <small>BOE/d</small>`;
      mgtWellsEl.textContent = this.wellData
        .filter((w) => w.status === "Producing")
        .length.toLocaleString();
      mgtWaterEl.textContent = `${kpis.avgWaterCut.toFixed(1)}%`;
      // simple illustrative changes
      if (mgtProdChange)
        mgtProdChange.textContent = `${(Math.random() * 2 + 0.5).toFixed(1)}%`;
      if (mgtWellsChange)
        mgtWellsChange.textContent = `${(Math.random() * 1 + 0.2).toFixed(1)}%`;
      if (mgtWaterChange)
        mgtWaterChange.textContent = `${(Math.random() * 1.5 + 0.3).toFixed(
          1
        )}%`;
    }
  }

  startAutoRefresh(interval = 60000) {
    if (this.refreshIntervalId) clearInterval(this.refreshIntervalId);
    if (!interval) return;
    this.refreshIntervalId = setInterval(() => {
      HELPERS.updateDateTime();
      // Simulate small random changes to producing wells
      this.wellData
        .filter((w) => w.status === "Producing")
        .forEach((w) => {
          const delta = (Math.random() - 0.5) * 20; // +/- 10 bpd
          w.production = Math.max(0, Math.round(w.production + delta));
          w.change = parseFloat((-2 + Math.random() * 4).toFixed(1));
        });
      const kpis = this.data.calcKPIs();
      this.ui.updateKPIs(kpis);
      this.ui.updateTopWells(this.wellData);
      this.initializeCharts();
      this.populateTable();
      // Update management snapshot numbers if present
      const mgtProdEl = document.getElementById("mgt-total-production");
      const mgtWellsEl = document.getElementById("mgt-wells");
      const mgtWaterEl = document.getElementById("mgt-water-cut");
      if (mgtProdEl && mgtWellsEl && mgtWaterEl) {
        mgtProdEl.innerHTML = `${kpis.totalProduction.toLocaleString()} <small>BOE/d</small>`;
        mgtWellsEl.textContent = this.wellData
          .filter((w) => w.status === "Producing")
          .length.toLocaleString();
        mgtWaterEl.textContent = `${kpis.avgWaterCut.toFixed(1)}%`;
      }
    }, interval);
  }

  showPage(page) {
    // Show loading animation for page transitions
    if (window.loadingAnimation) {
      window.loadingAnimation.showPageLoading(page);
    }

    // Add fade-out effect to current page
    const currentPage = document.querySelector(".page-section.active");
    if (currentPage) {
      currentPage.style.opacity = "0";
      currentPage.style.transform = "translateY(-20px)";
    }

    setTimeout(() => {
      document.querySelectorAll(".page-section").forEach((sec) => {
        sec.classList.remove("active");
        sec.style.opacity = "";
        sec.style.transform = "";
      });

      const el = document.getElementById(page);
      if (el) {
        el.classList.add("active");

        // Trigger re-initialization for specific pages
        if (page === "dashboard" || page === "management") {
          setTimeout(() => {
            this.initializeCharts();
            if (page === "management") {
              this.updateManagementKPIs();
            }
          }, 100);
        }
      }
    }, 150);
  }

  showWellDetails(wellId) {
    const well = this.wellData.find((w) => String(w.id) === String(wellId));
    if (!well) return;
    const container = document.getElementById("well-details-content");
    if (!container) return;
    container.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <h6>Well Information</h6>
          <p><strong>Name:</strong> ${well.name}</p>
          <p><strong>Field:</strong> ${well.field}</p>
          <p><strong>Status:</strong> <span class="well-status-badge status-${well.status
            .toLowerCase()
            .replace(/\s/g, "")}">${well.status}</span></p>
        </div>
        <div class="col-md-6">
          <h6>Performance</h6>
          <p><strong>Production:</strong> ${Number(
            well.production || 0
          ).toLocaleString()} BOE/d</p>
          <p><strong>% Change:</strong> ${well.change > 0 ? "+" : ""}${
      well.change || 0
    }%</p>
          <p><strong>Water Cut:</strong> ${well.waterCut || 0}%</p>
        </div>
      </div>
    `;
    const modal = new bootstrap.Modal(
      document.getElementById("wellDetailsModal")
    );
    modal.show();
  }

  updateManagementKPIs() {
    const kpis = this.data.calcKPIs();

    // Update management page KPI values
    const mgtProdEl = document.getElementById("mgt-total-production");
    const mgtWellsEl = document.getElementById("mgt-wells");
    const mgtWaterEl = document.getElementById("mgt-water-cut");
    const mgtProdChangeEl = document.getElementById("mgt-prod-change");
    const mgtWellsChangeEl = document.getElementById("mgt-wells-change");
    const mgtWaterChangeEl = document.getElementById("mgt-water-change");

    if (mgtProdEl && mgtWellsEl && mgtWaterEl) {
      mgtProdEl.innerHTML = `${kpis.totalProduction.toLocaleString()} <small>BOE/d</small>`;
      mgtWellsEl.textContent = this.wellData
        .filter((w) => w.status === "Producing")
        .length.toLocaleString();
      mgtWaterEl.textContent = `${kpis.avgWaterCut.toFixed(1)}%`;

      // Add some simulated changes
      if (mgtProdChangeEl) mgtProdChangeEl.textContent = "+2.3%";
      if (mgtWellsChangeEl) mgtWellsChangeEl.textContent = "+1.8%";
      if (mgtWaterChangeEl) mgtWaterChangeEl.textContent = "-0.5%";
    }
  }
}

// bootstrap the app
new OilGasDashboard();
