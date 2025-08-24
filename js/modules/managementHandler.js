// Management Handler Module
export class ManagementHandler {
  constructor() {
    this.wellLogsData = null;
    this.priceData = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadExistingPriceData();
  }

  setupEventListeners() {
    // Well Logs Upload
    const uploadWellLogsBtn = document.getElementById("upload-well-logs");
    if (uploadWellLogsBtn) {
      uploadWellLogsBtn.addEventListener("click", () => {
        const modal = bootstrap.Modal.getOrCreateInstance(
          document.getElementById("wellLogsModal")
        );
        modal.show();
      });
    }

    // Price Data Upload
    const uploadPriceBtn = document.getElementById("upload-price-data");
    if (uploadPriceBtn) {
      uploadPriceBtn.addEventListener("click", () => {
        const modal = bootstrap.Modal.getOrCreateInstance(
          document.getElementById("priceDataModal")
        );
        modal.show();
      });
    }

    // Well Logs Modal Events
    this.setupWellLogsModal();
    this.setupPriceDataModal();
  }

  setupWellLogsModal() {
    const dropZone = document.getElementById("well-logs-drop-zone");
    const fileInput = document.getElementById("well-logs-input");
    const processBtn = document.getElementById("process-well-logs");

    if (!dropZone || !fileInput || !processBtn) return;

    // Click to select file
    dropZone.addEventListener("click", () => fileInput.click());

    // File selection
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        this.handleFileSelection(
          e.target.files[0],
          dropZone,
          processBtn,
          "well-logs"
        );
      }
    });

    // Drag and drop
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("dragover");
      if (
        e.dataTransfer &&
        e.dataTransfer.files &&
        e.dataTransfer.files.length > 0
      ) {
        fileInput.files = e.dataTransfer.files;
        this.handleFileSelection(
          e.dataTransfer.files[0],
          dropZone,
          processBtn,
          "well-logs"
        );
      }
    });

    // Process button
    processBtn.addEventListener("click", () => {
      if (fileInput.files.length > 0) {
        this.processWellLogsData(fileInput.files[0]);
      }
    });

    // Ensure cleanup when modal fully hides
    const modalEl = document.getElementById("wellLogsModal");
    if (modalEl) {
      modalEl.addEventListener("hidden.bs.modal", () =>
        this.cleanupBackdrops()
      );
    }
  }

  setupPriceDataModal() {
    const dropZone = document.getElementById("price-data-drop-zone");
    const fileInput = document.getElementById("price-data-input");
    const processBtn = document.getElementById("process-price-data");

    if (!dropZone || !fileInput || !processBtn) return;

    // Click to select file
    dropZone.addEventListener("click", () => fileInput.click());

    // File selection
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        this.handleFileSelection(
          e.target.files[0],
          dropZone,
          processBtn,
          "price-data"
        );
        const status = document.getElementById("price-upload-status");
        if (status) status.innerHTML = "";
      }
    });

    // Drag and drop
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("dragover");
      if (
        e.dataTransfer &&
        e.dataTransfer.files &&
        e.dataTransfer.files.length > 0
      ) {
        fileInput.files = e.dataTransfer.files;
        this.handleFileSelection(
          e.dataTransfer.files[0],
          dropZone,
          processBtn,
          "price-data"
        );
        const status = document.getElementById("price-upload-status");
        if (status) status.innerHTML = "";
      }
    });

    // Process button
    processBtn.addEventListener("click", () => {
      if (fileInput.files.length > 0) {
        this.processPriceData(fileInput.files[0]);
      }
    });

    // Ensure cleanup when modal fully hides
    const modalEl = document.getElementById("priceDataModal");
    if (modalEl) {
      modalEl.addEventListener("hidden.bs.modal", () =>
        this.cleanupBackdrops()
      );
    }
  }

  handleFileSelection(file, dropZone, processBtn, type) {
    const icon =
      type === "well-logs" ? "fas fa-oil-well" : "fas fa-dollar-sign";
    dropZone.innerHTML = `
      <div class="file-upload-icon text-success"><i class="${icon}"></i></div>
      <p><strong>File selected:</strong> ${file.name}</p>
      <p class="small text-muted">Click "Process Data" to continue</p>
    `;
    processBtn.disabled = false;
  }

  async processWellLogsData(file) {
    try {
      const text = await file.text();
      const data = this.parseCSV(text);

      // Validate headers
      const expectedHeaders = [
        "Depth",
        "WOB",
        "SURF_RPM",
        "ROP_AVG",
        "PHIF",
        "VSH",
        "SW",
        "KLOGH",
      ];
      const headers = Object.keys(data[0] || {});

      const missingHeaders = expectedHeaders.filter(
        (h) => !headers.includes(h)
      );
      if (missingHeaders.length > 0) {
        throw new Error(`Missing headers: ${missingHeaders.join(", ")}`);
      }

      this.wellLogsData = data;
      this.renderWellLogsChart();

      // Show success and hide modal
      this.showSuccess("Well logs data processed successfully!");
      const modalEl = document.getElementById("wellLogsModal");
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.hide();
      setTimeout(() => this.cleanupBackdrops(), 0);
    } catch (error) {
      this.showError(`Error processing well logs: ${error.message}`);
    }
  }

  async processPriceData(file) {
    try {
      const text = await file.text();
      const data = this.parseCSV(text);

      // More flexible header validation - check if essential headers exist
      // Allow for different case or slight variations in header names
      const essentialHeaders = ["TOWN", "STATE", "DATES", "PRICES"];
      const headers = Object.keys(data[0] || {}).map((h) => h.toUpperCase());

      // Check if we have the essential price data headers (case insensitive)
      const missingHeaders = essentialHeaders.filter(
        (h) => !headers.some((header) => header.includes(h))
      );

      if (missingHeaders.length > 0) {
        throw new Error(
          `Missing essential headers: ${missingHeaders.join(", ")}`
        );
      }

      // Map data to expected format if headers don't exactly match
      const normalizedData = data.map((row) => {
        const normalizedRow = {};
        Object.keys(row).forEach((key) => {
          const upperKey = key.toUpperCase();
          if (upperKey.includes("TOWN")) normalizedRow.TOWN = row[key];
          if (upperKey.includes("STATE")) normalizedRow.STATE = row[key];
          if (upperKey.includes("DATE")) normalizedRow.DATES = row[key];
          if (upperKey.includes("PRICE")) normalizedRow.PRICES = row[key];
          if (upperKey.includes("INDEX")) normalizedRow.INDEX = row[key];
        });
        return normalizedRow;
      });

      this.priceData = normalizedData;
      this.renderPriceFluctuationChart();
      this.updatePriceSummary();

      // Show success and hide modal (forecast-like pattern)
      const status = document.getElementById("price-upload-status");
      if (status)
        status.innerHTML =
          '<div class="alert alert-success">Price data processed successfully.</div>';
      const modalEl = document.getElementById("priceDataModal");
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.hide();
      setTimeout(() => this.cleanupBackdrops(), 0);

      // Optionally ensure user is on Management page to see updates
      if (typeof window?.app?.showPage === "function") {
        setTimeout(() => window.app.showPage("management"), 200);
      }
    } catch (error) {
      this.showError(`Error processing price data: ${error.message}`);
    }
  }

  cleanupBackdrops() {
    // Remove any lingering backdrops or body classes that can freeze the UI
    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");
  }

  parseCSV(text) {
    const lines = text.trim().split("\n");
    if (lines.length < 2) throw new Error("Invalid CSV file");

    const headers = lines[0].split(",").map((h) => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return data;
  }

  renderWellLogsChart() {
    const canvas = document.getElementById("wellLogsChart");
    if (!canvas || !this.wellLogsData) return;

    const ctx = canvas.getContext("2d");

    // Destroy existing chart
    if (canvas.chart) {
      canvas.chart.destroy();
    }

    const depths = this.wellLogsData.map((d) => parseFloat(d.Depth));
    const rop = this.wellLogsData.map((d) => parseFloat(d.ROP_AVG));
    const phif = this.wellLogsData.map((d) => parseFloat(d.PHIF) * 100); // Convert to percentage

    canvas.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: depths,
        datasets: [
          {
            label: "ROP (ft/hr)",
            data: rop,
            borderColor: "#1282c4",
            backgroundColor: "rgba(18, 130, 196, 0.1)",
            yAxisID: "y",
          },
          {
            label: "Porosity (%)",
            data: phif,
            borderColor: "#7dd56f",
            backgroundColor: "rgba(125, 213, 111, 0.1)",
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: "Depth (ft)",
            },
          },
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: {
              display: true,
              text: "ROP (ft/hr)",
            },
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            title: {
              display: true,
              text: "Porosity (%)",
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
          },
          title: {
            display: true,
            text: "Well Logs Analysis",
          },
        },
      },
    });

    // Show the well logs section
    const section = document.getElementById("well-logs-section");
    if (section) {
      section.style.display = "block";
    }
  }

  renderPriceFluctuationChart() {
    const canvas = document.getElementById("priceFluctuationChart");
    if (!canvas || !this.priceData) return;

    const ctx = canvas.getContext("2d");

    // Destroy existing chart
    if (canvas.chart) {
      canvas.chart.destroy();
    }

    // Group data by town and sort by date
    const townData = {};
    this.priceData.forEach((row) => {
      const town = row.TOWN;
      const date = row.DATES;
      const price = parseFloat(row.PRICES);

      if (!townData[town]) {
        townData[town] = [];
      }
      townData[town].push({ date, price });
    });

    // Sort each town's data by date
    Object.keys(townData).forEach((town) => {
      townData[town].sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    // Create datasets for top 5 towns
    const towns = Object.keys(townData)
      .filter((t) => t && t !== "null" && t !== "undefined")
      .slice(0, 5);
    const colors = ["#1282c4", "#7dd56f", "#ff9800", "#f44336", "#9c27b0"];

    // Create date labels from the data (chronologically sorted)
    const uniqueDates = Array.from(new Set(this.priceData.map((d) => d.DATES)));
    const dates = uniqueDates
      .map((ds) => ({
        ds,
        ts: Date.parse(ds) || Date.parse(ds.replace(/\//g, "-")) || 0,
      }))
      .sort((a, b) => a.ts - b.ts)
      .map((x) => x.ds);

    canvas.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: dates,
        datasets: towns.map((town, index) => {
          const townPrices = dates.map((date) => {
            const record = this.priceData.find(
              (d) => d.TOWN === town && d.DATES === date
            );
            return record ? parseFloat(record.PRICES) : null;
          });

          return {
            label: town,
            data: townPrices,
            borderColor: colors[index],
            backgroundColor: colors[index] + "20",
            fill: false,
            tension: 0.1,
          };
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: "Date",
            },
          },
          y: {
            title: {
              display: true,
              text: "Price (USD/bbl)",
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
          title: {
            display: true,
            text: "Price Fluctuation by Region",
          },
        },
      },
    });
  }

  updatePriceSummary() {
    const summaryContainer = document.getElementById("price-summary-list");
    if (!summaryContainer || !this.priceData) return;

    // Calculate average prices by town
    const townAverages = {};
    this.priceData.forEach((row) => {
      const town = row.TOWN;
      const price = parseFloat(row.PRICES);

      if (!townAverages[town]) {
        townAverages[town] = { total: 0, count: 0, state: row.STATE };
      }
      townAverages[town].total += price;
      townAverages[town].count += 1;
    });

    // Sort by average price
    const sortedTowns = Object.keys(townAverages)
      .map((town) => ({
        town,
        state: townAverages[town].state,
        avg: townAverages[town].total / townAverages[town].count,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8); // Top 8 towns

    const html = sortedTowns
      .map(
        (item) => `
      <div class="price-list-item">
        <div>
          <div class="price-location">${item.town}</div>
          <small class="text-muted">${item.state}</small>
        </div>
        <div class="price-value">$${item.avg.toFixed(2)}</div>
      </div>
    `
      )
      .join("");

    summaryContainer.innerHTML = html;
  }

  async loadExistingPriceData() {
    try {
      const response = await fetch("assets/data/prices.csv");
      if (response.ok) {
        const text = await response.text();
        this.priceData = this.parseCSV(text);
        this.renderPriceFluctuationChart();
        this.updatePriceSummary();
      }
    } catch (error) {
      console.log("No existing price data found, will load on upload");
      // Create empty price data structure to avoid errors
      this.priceData = [];
    }
  }

  showSuccess(message) {
    this.showNotification(message, "success");
  }

  showError(message) {
    this.showNotification(message, "danger");
  }

  showNotification(message, type) {
    const toast = document.createElement("div");
    toast.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    toast.style.cssText =
      "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
    toast.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);
  }
}

// Global functions for CEO profile
window.downloadCV = function () {
  // Create a sample CV download
  const cvContent = `
NYOK WUOR MIYAR
Executive CEO, QuireBye PetroVision
=====================================

EXECUTIVE SUMMARY
Visionary leader with 15+ years experience in South Sudan's energy sector. 
Founded QuireBye PetroVision to deliver data-driven production optimization 
and ESG programs for the upstream oil & gas industry.

PROFESSIONAL EXPERIENCE
2020 - Present    Executive CEO, QuireBye PetroVision
2015 - 2020      Senior Operations Manager, Energy Sector
2010 - 2015      Field Engineer, Upstream Operations

EDUCATION
Master of Science in Petroleum Engineering
Bachelor of Engineering in Chemical Engineering

CONTACT
Email: nyok@quirebyepetrovision.com
Phone: +211 XXX XXX XXX
Location: Juba, South Sudan
  `;

  const blob = new Blob([cvContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Nyok_Wuor_Miyar_CV.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

window.contactCEO = function () {
  const email = "nyok@quirebyepetrovision.com";
  const subject = "Inquiry about QuireBye PetroVision Services";
  const body =
    "Hello Nyok,\n\nI would like to learn more about QuireBye PetroVision's services.\n\nBest regards,";

  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
  window.open(mailtoLink);
};

window.contactPartner = function (partner) {
  const partners = {
    nile: {
      email: "info@nilepetroleum.gov.ss",
      name: "Nile Petroleum Corporation",
      subject: "Partnership Inquiry - QuireBye PetroVision",
    },
    schlumberger: {
      email: "southsudan@slb.com",
      name: "Schlumberger South Sudan",
      subject: "Technology Partnership Discussion",
    },
    uofj: {
      email: "partnerships@uofj.edu",
      name: "University of Juba",
      subject: "Research Collaboration Inquiry",
    },
  };

  const partnerInfo = partners[partner];
  if (partnerInfo) {
    const body = `Hello ${partnerInfo.name} Team,\n\nI am reaching out from QuireBye PetroVision regarding potential collaboration opportunities.\n\nBest regards,\nQuireBye PetroVision Team`;
    const mailtoLink = `mailto:${
      partnerInfo.email
    }?subject=${encodeURIComponent(
      partnerInfo.subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  }
};
