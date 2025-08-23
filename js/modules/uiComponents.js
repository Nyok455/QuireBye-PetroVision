export class UIComponents {
  updateKPIs({ totalWells, totalProduction, avgProduction, avgWaterCut }) {
    const totalWellsEl = document.getElementById("total-wells");
    const dailyProductionEl = document.getElementById("daily-production");
    const avgProductionEl = document.getElementById("avg-production");
    const waterCutEl = document.getElementById("water-cut");

    if (totalWellsEl) totalWellsEl.textContent = totalWells.toLocaleString();
    if (dailyProductionEl)
      dailyProductionEl.innerHTML = `${totalProduction.toLocaleString()} <small>BOE/d</small>`;
    if (avgProductionEl)
      avgProductionEl.innerHTML = `${avgProduction.toFixed(
        1
      )} <small>BOE/d</small>`;
    if (waterCutEl) waterCutEl.textContent = `${avgWaterCut.toFixed(1)}%`;
  }

  updateTopWells(wells) {
    const topWellsList = document.getElementById("top-wells-list");
    if (!topWellsList) return;
    const top = wells
      .filter((w) => w.status === "Producing")
      .sort((a, b) => b.production - a.production)
      .slice(0, 5);
    topWellsList.innerHTML = top
      .map(
        (w) =>
          `<div class="top-well-item"><strong>${
            w.name
          }</strong>: ${w.production.toLocaleString()} BOE/d</div>`
      )
      .join("");
  }

  populateTable(wells, currentPage, rowsPerPage) {
    const tableBody = document.querySelector("#wells-table tbody");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, wells.length);
    const pageData = wells.slice(startIndex, endIndex);

    const tableInfo = document.getElementById("table-info");
    if (tableInfo)
      tableInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${
        wells.length
      } wells`;

    pageData.forEach((w) => {
      const trendClass =
        (parseFloat(w.change) || 0) > 0
          ? "text-success"
          : (parseFloat(w.change) || 0) < 0
          ? "text-danger"
          : "text-muted";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${w.name}</td>
        <td>${w.field}</td>
        <td><span class="well-status-badge status-${w.status
          .toLowerCase()
          .replace(/\s/g, "")}">${w.status}</span></td>
        <td>${(w.production || 0).toLocaleString()}</td>
        <td class="${trendClass}">${(w.change || 0) > 0 ? "+" : ""}${
        w.change || 0
      }%</td>
        <td>${w.waterCut || 0}%</td>
        <td><button class="btn btn-sm btn-outline-primary well-details-btn" data-well-id="${
          w.id
        }">Details</button></td>
      `;
      tableBody.appendChild(row);
    });
  }

  showAnomaliesList(anomalies) {
    const container = document.getElementById("anomalies-list");
    if (!container) return;
    container.innerHTML = anomalies.length
      ? anomalies
          .map(
            (a) => `
      <li>
        <strong>${a.name}</strong> (${
              a.field
            }) - ${a.production.toLocaleString()} BOE/d<br/>
        <small>${a.flags.join(" | ")}</small>
      </li>
    `
          )
          .join("")
      : "<li>No anomalies detected</li>";
  }
}
