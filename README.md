QuireBye PetroVision Energy - Oil & Gas Dashboard

A comprehensive web-based dashboard for monitoring oil and gas well operations, production data, and field management.

🚀 Features

Dashboard Features
- Real-time KPI Monitoring: Total wells, daily production, average production per well, and water cut metrics
- Interactive Charts: Production trends, well status distribution, production by field, and production type breakdown
- Top 5 Wells Display: Shows the highest producing wells in a dedicated bar below the header
- Data Table: Paginated table with well details, status badges, and production metrics
- File Upload: CSV data import functionality with drag-and-drop support
- Data Export: Export current data to CSV format
- Responsive Design: Mobile-friendly interface

Navigation
- Multi-page Application: Home, Dashboard, Future Projects, and Contact sections
- Smooth Transitions: Page switching with active state management

🔧 Recent Fixes

 ✅ Issues Resolved

1. Top 5 Wells Display
   - Added dedicated top wells bar below the dashboard header
   - Shows the 5 highest producing wells with their production values
   - Updates automatically when data changes
   - Positioned correctly without interfering with other components

2. Production by Field Chart
   - Fixed chart functionality to maintain proper field-based production display
   - Ensures the chart updates correctly when data changes
   - Preserves original functionality while integrating with new features

3. Upload Data Functionality
   - Fixed file upload modal and processing
   - Implemented proper drag-and-drop functionality
   - Added file validation and error handling
   - CSV parsing works correctly with proper data mapping
   - Progress indicators and success/error messages
   - Sample data template download functionality

4. Modular Project Structure
   - Organized code into proper modular structure
   - Separated concerns while maintaining functionality
   - Clean, maintainable codebase

📁 Project Structure

Field Management/
├── index.html              # Main application file
├── css/
│   ├── style.css          # Main stylesheet with all components
│   └── components/        # Component-specific styles (for future expansion)
├── js/
│   ├── app.js            # Main application logic
│   ├── modules/          # Modular components (for future expansion)
│   └── utils/            # Utility functions (for future expansion)
├── assets/
│   ├── data/
│   │   └── sample-data.csv # Sample data template
│   └── images/           # Project images
├── docs/                 # Documentation
└── README.md            # This file


🛠️ Installation & Setup

1. Clone or Download* the project to your local machine
2. Open `index.html` in a modern web browser
3. No build process required - it's a client-side application

 Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for CDN resources: Bootstrap, Chart.js, Font Awesome)

📊 Data Format

CSV Upload Format
The application accepts CSV files with the following columns:
- `Well Name`: Name/identifier of the well
- `Field`: Field location (e.g., Eagle Ford, Permian Basin)
- `Status`: Well status (Producing, Shut-in, Abandoned, Drilling)
- `Production (BOE/d)`: Daily production in barrels of oil equivalent
- `% Change`: Percentage change from previous period
- `Water Cut (%)`: Water cut percentage

Sample Data
A sample CSV template is available for download within the application or in `assets/data/sample-data.csv`.

🎯 Usage
Dashboard Navigation
1. Home: Company information and services overview
2. Dashboard: Main analytics and data visualization
3. Future Projects: Upcoming development projects
4. Contact: Company contact information

### Data Management
1. Upload Data: Click the "Upload Data" button to import CSV files
2. Export Data: Click the "Export" button to download current data
3. Filter Data: Use field filters and date ranges to focus on specific data
4. View Details: Click "Details" on any well row for more information

Dashboard Features
- KPI Cards: Monitor key performance indicators at the top
- Top Wells Bar: View the 5 highest producing wells
- Charts: Interactive visualizations of production data
- Data Table: Detailed well information with pagination

🔧 Configuration

Settings Modal
Access dashboard settings via the gear icon:
- Refresh Interval: Set automatic data refresh frequency
- Units: Choose between Imperial and Metric units
- Notifications: Enable/disable system notifications

🚀 Future Enhancements

- Real-time data integration via API
- Advanced filtering and search capabilities
- Historical data analysis and trends
- Mobile app development
- User authentication and role-based access
- Advanced reporting and analytics

🐛 Troubleshooting

Common Issues

1. Charts not displaying
   - Ensure internet connection for Chart.js CDN
   - Check browser console for JavaScript errors

2. File upload not working
   - Verify CSV format matches the template
   - Check file size (large files may take time to process)
   - Ensure proper column headers

3. Data not updating
   - Refresh the page
   - Check if filters are applied
   - Verify data format in uploaded files

📝 Technical Details

Technologies Used
- HTML5: Semantic markup and structure
- CSS3: Modern styling with CSS variables and flexbox/grid
- JavaScript (ES6+): Modern JavaScript with classes and modules
- Bootstrap 5: Responsive UI framework
- Chart.js: Interactive data visualizations
- Font Awesome: Icon library

Browser Support
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

📄 License

This project is proprietary software developed for PetroVision Energy.

👥 Support

For technical support or questions, please contact the development team.
