// Professional Loading Animation Module
class LoadingAnimation {
  constructor() {
    this.createLoadingOverlay();
    this.initializePageLoader();
  }

  createLoadingOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "loading-overlay";
    overlay.innerHTML = `
      <div class="loading-container">
        <div class="loading-logo">
          <i class="fas fa-oil-well"></i>
        </div>
        <div class="loading-text">QuireBye PetroVision</div>
        <div class="loading-subtitle">Initializing Energy Intelligence Platform</div>
        <div class="loading-progress">
          <div class="progress-bar"></div>
        </div>
        <div class="loading-status">Loading resources...</div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.addLoadingStyles();
  }

  addLoadingStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0d3d91 0%, #1282c4 100%);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 1;
        transition: opacity 0.5s ease-out;
      }

      .loading-container {
        text-align: center;
        color: white;
        max-width: 400px;
        padding: 2rem;
      }

      .loading-logo {
        font-size: 4rem;
        margin-bottom: 1rem;
        animation: pulse 2s infinite;
      }

      .loading-text {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        opacity: 0.95;
      }

      .loading-subtitle {
        font-size: 1rem;
        margin-bottom: 2rem;
        opacity: 0.8;
        font-weight: 300;
      }

      .loading-progress {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 1rem;
      }

      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #19a7ce, #e3f2fd);
        border-radius: 2px;
        width: 0%;
        animation: loading 3s ease-in-out forwards;
      }

      .loading-status {
        font-size: 0.9rem;
        opacity: 0.7;
        font-weight: 400;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }

      @keyframes loading {
        0% { width: 0%; }
        25% { width: 30%; }
        50% { width: 60%; }
        75% { width: 85%; }
        100% { width: 100%; }
      }

      .loading-fade-out {
        opacity: 0;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  initializePageLoader() {
    // Simulate loading progress
    const statusTexts = [
      "Loading resources...",
      "Initializing data connections...",
      "Preparing charts and analytics...",
      "Finalizing user interface...",
      "Ready!",
    ];

    let currentIndex = 0;
    const statusElement = document.querySelector(".loading-status");

    const updateStatus = () => {
      if (statusElement && currentIndex < statusTexts.length - 1) {
        statusElement.textContent = statusTexts[currentIndex];
        currentIndex++;
        setTimeout(updateStatus, 600);
      }
    };

    // Start status updates
    setTimeout(updateStatus, 500);

    // Hide loading screen when page is loaded
    window.addEventListener("load", () => {
      setTimeout(() => {
        this.hideLoading();
      }, 3000); // Show for minimum 3 seconds for professional feel
    });

    // Fallback: Hide after 5 seconds max
    setTimeout(() => {
      this.hideLoading();
    }, 5000);
  }

  hideLoading() {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.classList.add("loading-fade-out");
      setTimeout(() => {
        overlay.remove();
      }, 500);
    }
  }

  // Method to show loading for page transitions
  showPageLoading(pageName) {
    const quickLoader = document.createElement("div");
    quickLoader.id = "page-loader";
    quickLoader.innerHTML = `
      <div class="page-loading-spinner">
        <i class="fas fa-oil-well"></i>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      #page-loader {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(13, 61, 145, 0.9);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        z-index: 1000;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .page-loading-spinner {
        text-align: center;
        font-size: 1.5rem;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(quickLoader);

    // Remove after short delay
    setTimeout(() => {
      if (quickLoader) quickLoader.remove();
      if (style) style.remove();
    }, 300);
  }
}

// Initialize loading animation
document.addEventListener("DOMContentLoaded", () => {
  window.loadingAnimation = new LoadingAnimation();
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = LoadingAnimation;
}
