# Project Structure Documentation

## Overview
This document outlines the structure and organization of the PetroVision Energy Oil & Gas Dashboard project.

## Directory Structure

```
Field Management/
├── index.html                 # Main application entry point
├── hh.html                   # Legacy file (can be removed)
├── Package.json              # Project metadata
├── README.md                 # Main project documentation
├── .gitignore               # Git ignore rules
│
├── css/                     # Stylesheets
│   ├── style.css           # Main stylesheet (consolidated)
│   └── components/         # Component-specific styles (future use)
│       ├── charts.css      # Chart styling
│       ├── header.css      # Header component styles
│       └── modals.css      # Modal component styles
│
├── js/                      # JavaScript files
│   ├── app.js              # Main application logic (consolidated)
│   ├── modules/            # Modular components (future expansion)
│   │   ├── chartRenderer.js
│   │   ├── dataHandler.js
│   │   ├── fileProcessor.js
│   │   └── uiComponents.js
│   └── utils/              # Utility functions
│       ├── config.js
│       ├── constants.js
│       └── helpers.js
│
├── assets/                  # Static assets
│   ├── data/
│   │   └── sample-data.csv # Sample CSV template
│   └── images/
│       └── logo.png        # Company logo
│
└── docs/                    # Documentation
    ├── PROJECT_STRUCTURE.md # This file
    └── SETUP_GUIDE.md       # Setup instructions
```

## File Descriptions

### Core Files

#### `index.html`
- Main application entry point
- Contains all HTML structure for the multi-page application
- Includes navigation, dashboard, home page, projects, and footer
- Integrates all necessary CDN resources (Bootstrap, Chart.js, Font Awesome)

#### `css/style.css`
- Consolidated stylesheet containing all application styles
- Uses CSS custom properties (variables) for consistent theming
- Responsive design with mobile-first approach
- Includes styles for all components and pages

#### `js/app.js`
- Main application logic consolidated into a single class
- Handles data generation, chart rendering, table population
- Manages file upload/download functionality
- Contains all event listeners and user interactions

### Assets

#### `assets/data/sample-data.csv`
- Template CSV file for data uploads
- Contains sample well data with proper column headers
- Used for download template functionality

#### `assets/images/logo.png`
- Company logo (placeholder)
- Used in navigation and branding

### Documentation

#### `README.md`
- Comprehensive project documentation
- Installation and usage instructions
- Feature descriptions and troubleshooting

#### `docs/PROJECT_STRUCTURE.md`
- This file - detailed project structure documentation

## Architecture Decisions

### Consolidated vs Modular Approach

**Current Implementation: Consolidated**
- All functionality in single files for simplicity
- Easier to maintain and debug
- Better for smaller projects
- No build process required

**Future Modular Approach**
- Code split into logical modules
- Better for larger applications
- Easier to test individual components
- Requires build process or ES6 modules

### CSS Organization

**Current: Single File**
- All styles in `css/style.css`
- Uses CSS custom properties for theming
- Organized by component sections

**Component Structure Available**
- `css/components/` directory prepared for future modularization
- Individual component stylesheets can be created as needed

### JavaScript Architecture

**Current: Class-Based Single File**
- `OilGasDashboard` class contains all functionality
- Methods organized by feature area
- Event listeners centralized in `setupEventListeners()`

**Modular Structure Available**
- `js/modules/` directory prepared for future expansion
- Utility functions can be extracted to `js/utils/`

## Key Features Implementation

### Dashboard Components

1. **KPI Cards**
   - Real-time metrics display
   - Trend indicators with color coding
   - Responsive layout

2. **Top 5 Wells Bar**
   - Fixed position below header
   - Dynamic content based on production data
   - Responsive design for mobile

3. **Interactive Charts**
   - Chart.js integration
   - Multiple chart types (line, bar, doughnut, pie)
   - Responsive and interactive

4. **Data Table**
   - Pagination support
   - Sortable columns
   - Status badges with color coding
   - Action buttons for details

5. **File Upload System**
   - Drag and drop functionality
   - CSV parsing and validation
   - Progress indicators
   - Error handling

### Navigation System

- Single-page application with multiple sections
- Dynamic page switching
- Active state management
- Responsive navigation menu

## Development Guidelines

### Adding New Features

1. **CSS**: Add styles to appropriate section in `style.css`
2. **JavaScript**: Add methods to `OilGasDashboard` class
3. **HTML**: Add markup to appropriate section in `index.html`

### Code Organization

- Keep related functionality together
- Use descriptive method and variable names
- Comment complex logic
- Maintain consistent coding style

### Testing

- Test in multiple browsers
- Verify responsive design on different screen sizes
- Test file upload with various CSV formats
- Validate chart interactions and data updates

## Future Enhancements

### Planned Improvements

1. **Modularization**
   - Split JavaScript into logical modules
   - Implement proper module loading
   - Add build process if needed

2. **Enhanced Features**
   - Real-time data integration
   - Advanced filtering options
   - User authentication
   - Data persistence

3. **Performance Optimization**
   - Lazy loading for large datasets
   - Chart rendering optimization
   - Caching strategies

### Migration Path

1. **Phase 1**: Current consolidated approach
2. **Phase 2**: Extract utilities and constants
3. **Phase 3**: Modularize components
4. **Phase 4**: Add build process and advanced features

## Maintenance

### Regular Tasks

- Update CDN versions periodically
- Review and optimize performance
- Update documentation
- Test with new browser versions

### Monitoring

- Check for JavaScript errors in console
- Monitor loading times
- Validate data processing accuracy
- Test file upload functionality

---

**Last Updated**: December 2024  
**Maintained By**: Development Team