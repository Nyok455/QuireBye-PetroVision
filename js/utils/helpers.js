export const HELPERS = {
    updateDateTime() {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        const dateTimeElement = document.getElementById('current-date-time');
        if (dateTimeElement) {
            dateTimeElement.textContent = now.toLocaleDateString('en-US', options);
        }
    },
    
    getWeightedRandomIndex(weights) {
        const sum = weights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * sum;
        for (let i = 0; i < weights.length; i++) {
            rand -= weights[i];
            if (rand <= 0) return i;
        }
        return weights.length - 1;
    },
    
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    parseCSV(csvData) {
        const lines = csvData.split('\n');
        const result = [];
        
        if (lines.length < 2) return result;
        
        // Extract headers
        const headers = lines[0].split(',').map(header => header.trim());
        
        // Process data rows
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const obj = {};
            const currentline = lines[i].split(',');
            
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j] ? currentline[j].trim() : '';
            }
            
            result.push(obj);
        }
        
        return result;
    },
    
    // Additional helper functions...
};