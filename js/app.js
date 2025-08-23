// Main application entry point (modularized)
import { HELPERS } from "./utils/helpers.js";
import { CONSTANTS } from "./utils/constants.js";
import { DataHandler } from "./modules/dataHandler.js";
import { ChartRenderer } from "./modules/chartRenderer.js";
import { UIComponents } from "./modules/uiComponents.js";
import { FileProcessor } from "./modules/fileProcessor.js";

class OilGasDashboard {
  constructor() {
    this.data = new DataHandler();
    this.charts = new ChartRenderer();
    this.ui = new UIComponents();
    this.files = new FileProcessor();

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

    // Optional forecast chart for Management page
    const mgtForecastCanvas = document.getElementById("mgtForecastChart");
    if (mgtForecastCanvas) {
      const fc = this.data.forecastDecline({});
      const months = Array.from(
        { length: CONSTANTS.ANALYTICS.forecastMonths },
        (_, i) => `M${i + 1}`
      );
      this.charts.forecastChart(mgtForecastCanvas, months, fc);
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
    document
      .querySelectorAll(".page-section")
      .forEach((sec) => sec.classList.remove("active"));
    const el = document.getElementById(page);
    if (el) el.classList.add("active");
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
}

// bootstrap the app
new OilGasDashboard();
