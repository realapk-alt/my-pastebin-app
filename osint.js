// Enhanced Features Implementation
const advancedFeatures = {
  // Session Management
  sessionTimer: null,
  sessionDuration: 30 * 60, // 30 minutes
  
  // Search History
  searchHistory: JSON.parse(localStorage.getItem('searchHistory')) || [],
  maxHistoryItems: 15,
  
  // Theme Management
  currentTheme: 'dark',
  currentBulkType: 'mobile', // 'mobile' or 'aadhaar'
  
  // API Health Check
  apiStatus: 'online',
  
  // Bulk search data for PDF export
  currentBulkData: null,
  
  // Progress tracking
  progressStartTime: null,
  progressTimer: null,
  
  init() {
    this.initSessionTimer();
    this.initThemeToggle();
    this.initSearchHistory();
    this.initBulkSearch();
    this.initExportButtons();
    this.checkAPIHealth();
    this.initManualEntry();
    this.initBulkTypeSelector();
  },
  
  initSessionTimer() {
    const timerElement = document.getElementById('sessionTimer');
    const timerDisplay = document.getElementById('timer');
    
    this.sessionTimer = setInterval(() => {
      this.sessionDuration--;
      
      if (this.sessionDuration <= 0) {
        this.logout();
        return;
      }
      
      const minutes = Math.floor(this.sessionDuration / 60);
      const seconds = this.sessionDuration % 60;
      timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // Show warning at 5 minutes
      if (this.sessionDuration === 5 * 60) {
        this.showNotification('Session will expire in 5 minutes', 'warning');
      }
      
      // Show warning at 1 minute
      if (this.sessionDuration === 60) {
        this.showNotification('Session will expire in 1 minute', 'warning');
      }
    }, 1000);
    
    timerElement.style.display = 'block';
    
    // Reset timer on user activity
    ['click', 'keypress', 'mousemove'].forEach(event => {
      document.addEventListener(event, () => {
        this.sessionDuration = 30 * 60;
      });
    });
  },
  
  logout() {
    clearInterval(this.sessionTimer);
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('pinOverlay').style.display = 'flex';
    document.getElementById('pinInput').value = '';
    document.getElementById('pinInput').focus();
    this.sessionDuration = 30 * 60;
    this.showNotification('Session expired due to inactivity', 'warning');
  },
  
  initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', () => {
      this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
      this.applyTheme();
    });
  },
  
  applyTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (this.currentTheme === 'light') {
      document.body.classList.add('light-theme');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      document.body.classList.remove('light-theme');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  },
  
  initSearchHistory() {
    this.updateHistoryDisplay();
  },
  
  addToHistory(type, value, result) {
    // FIXED: Properly check if data was found or not
    const dataFound = !(result.includes('Data not found') || 
                       result.includes('NO DATA AVAILABLE') || 
                       result.includes('not found') ||
                       result.includes('No Data') ||
                       result.includes('error') ||
                       result.includes('invalid') ||
                       result.includes('failed') ||
                       result.includes('NETWORK ERROR') ||
                       result.includes('INVALID RESPONSE'));
    
    const historyItem = {
      type,
      value,
      result: dataFound ? 'Found' : 'Not Found', // FIXED: Correctly determine if data was found
      timestamp: new Date().toLocaleString(),
      id: Date.now()
    };
    
    // Remove if already exists
    this.searchHistory = this.searchHistory.filter(item => 
      !(item.type === type && item.value === value)
    );
    
    // Add to beginning
    this.searchHistory.unshift(historyItem);
    
    // Keep only last maxHistoryItems
    this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
    
    // Save to localStorage
    localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    
    this.updateHistoryDisplay();
  },
  
  // Add bulk search to history
  addBulkToHistory(numbers, foundCount, type) {
    const historyItem = {
      type: 'bulk-' + type,
      value: `${numbers.length} ${type} numbers`,
      result: `Found: ${foundCount}, Not Found: ${numbers.length - foundCount}`,
      timestamp: new Date().toLocaleString(),
      id: Date.now(),
      isBulk: true
    };
    
    // Add to beginning
    this.searchHistory.unshift(historyItem);
    
    // Keep only last maxHistoryItems
    this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
    
    // Save to localStorage
    localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    
    this.updateHistoryDisplay();
  },
  
  updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    const searchHistory = document.getElementById('searchHistory');
    
    if (this.searchHistory.length > 0) {
      searchHistory.style.display = 'block';
      historyList.innerHTML = this.searchHistory.map(item => {
        if (item.isBulk) {
          return `
            <div class="history-item" onclick="advancedFeatures.viewBulkResults('${item.id}')">
              <div>
                <strong>${item.value}</strong>
                <div style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">${item.timestamp}</div>
              </div>
              <div>
                <span class="history-type">BULK</span>
                <span style="color: #fbbc05; font-size: 0.8rem;">
                  ${item.result}
                </span>
              </div>
            </div>
          `;
        } else {
          return `
            <div class="history-item" onclick="advancedFeatures.reSearch('${item.type}', '${item.value}')">
              <div>
                <strong>${item.value}</strong>
                <div style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">${item.timestamp}</div>
              </div>
              <div>
                <span class="history-type">${item.type.toUpperCase()}</span>
                <span style="color: ${item.result === 'Found' ? '#34a853' : '#ea4335'}; font-size: 0.8rem;">
                  ${item.result}
                </span>
              </div>
            </div>
          `;
        }
      }).join('');
    } else {
      searchHistory.style.display = 'none';
    }
  },
  
  reSearch(type, value) {
    document.getElementById('lookupType').value = type;
    document.getElementById('inputField').value = value;
    document.getElementById('go').click();
  },
  
  viewBulkResults(id) {
    // For now, just switch to bulk mode
    const item = this.searchHistory.find(item => item.id === id);
    if (item && item.type.includes('mobile')) {
      document.getElementById('lookupType').value = 'bulk-mobile';
    } else if (item && item.type.includes('aadhaar')) {
      document.getElementById('lookupType').value = 'bulk-aadhaar';
    }
    this.showNotification('Switch to bulk mode to upload CSV file', 'info');
  },
  
  initBulkSearch() {
    const lookupType = document.getElementById('lookupType');
    const singleSearch = document.getElementById('singleSearch');
    const bulkSearch = document.getElementById('bulkSearch');
    const uploadBtn = document.getElementById('uploadBtn');
    const csvUpload = document.getElementById('csvUpload');
    
    lookupType.addEventListener('change', function() {
      if (this.value.includes('bulk')) {
        singleSearch.style.display = 'none';
        bulkSearch.style.display = 'block';
        // Update bulk type based on selection
        advancedFeatures.currentBulkType = this.value.includes('mobile') ? 'mobile' : 'aadhaar';
        advancedFeatures.updateBulkInstructions();
      } else {
        singleSearch.style.display = 'block';
        bulkSearch.style.display = 'none';
      }
    });
    
    uploadBtn.addEventListener('click', () => {
      csvUpload.click();
    });
    
    csvUpload.addEventListener('change', this.handleBulkUpload.bind(this));
  },

  initBulkTypeSelector() {
    const uploadOption = document.getElementById('uploadOption');
    const manualOption = document.getElementById('manualOption');
    const uploadSection = document.getElementById('uploadSection');
    const manualSection = document.getElementById('manualSection');

    // Switch between upload and manual entry
    uploadOption.addEventListener('click', () => {
      uploadOption.classList.add('active');
      manualOption.classList.remove('active');
      uploadSection.style.display = 'block';
      manualSection.style.display = 'none';
    });

    manualOption.addEventListener('click', () => {
      manualOption.classList.add('active');
      uploadOption.classList.remove('active');
      manualSection.style.display = 'block';
      uploadSection.style.display = 'none';
      document.getElementById('manualInput').focus();
    });
  },

  updateBulkInstructions() {
    const uploadInstructions = document.getElementById('uploadInstructions');
    const manualInstructions = document.getElementById('manualInstructions');
    const manualInput = document.getElementById('manualInput');
    
    if (this.currentBulkType === 'mobile') {
      uploadInstructions.innerHTML = '<i class="fas fa-info-circle"></i> CSV should contain one 10-digit mobile number per line';
      manualInstructions.innerHTML = '<i class="fas fa-info-circle"></i> Enter one 10-digit mobile number per line';
      manualInput.placeholder = 'Enter 10-digit mobile numbers (one per line)\nExample:\n9044192030\n9876543210\n9123456789';
    } else {
      uploadInstructions.innerHTML = '<i class="fas fa-info-circle"></i> CSV should contain one 12-digit Aadhaar number per line';
      manualInstructions.innerHTML = '<i class="fas fa-info-circle"></i> Enter one 12-digit Aadhaar number per line';
      manualInput.placeholder = 'Enter 12-digit Aadhaar numbers (one per line)\nExample:\n123456789012\n987654321098\n456789012345';
    }
  },

  initManualEntry() {
    const manualInput = document.getElementById('manualInput');

    // Auto-format manual input based on bulk type
    manualInput.addEventListener('input', function() {
      const lines = this.value.split('\n');
      let formattedLines = [];
      const digitLimit = advancedFeatures.currentBulkType === 'mobile' ? 10 : 12;
      
      for (let line of lines) {
        // Remove all non-digit characters
        let numbers = line.replace(/\D/g, '');
        
        // Split numbers into chunks of digitLimit
        while (numbers.length > 0) {
          if (numbers.length >= digitLimit) {
            formattedLines.push(numbers.substring(0, digitLimit));
            numbers = numbers.substring(digitLimit);
          } else {
            if (numbers.length > 0) {
              formattedLines.push(numbers);
            }
            numbers = '';
          }
        }
      }
      
      // Update the textarea with formatted numbers
      this.value = formattedLines.join('\n');
    });

    // Handle paste event for manual input
    manualInput.addEventListener('paste', function(e) {
      setTimeout(() => {
        const content = this.value;
        // Remove all non-digit characters and split by any whitespace
        const numbers = content.replace(/\D+/g, '\n').split('\n').filter(num => num.length > 0);
        this.value = numbers.join('\n');
      }, 0);
    });
  },
  
  handleBulkUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const numbers = this.parseNumbersFromContent(content);
      this.processBulkSearch(numbers, this.currentBulkType);
    };
    reader.readAsText(file);
  },

  parseNumbersFromContent(content) {
    // Split by new lines and remove empty lines
    return content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/\D/g, '')) // Remove non-digit characters
      .filter(num => num.length > 0); // Remove empty strings
  },

  processManualSearch() {
    const manualInput = document.getElementById('manualInput');
    const content = manualInput.value.trim();
    
    if (!content) {
      this.showNotification('Please enter numbers to search', 'warning');
      return;
    }
    
    const numbers = this.parseNumbersFromContent(content);
    
    if (numbers.length === 0) {
      this.showNotification('No valid numbers found in manual entry', 'warning');
      return;
    }
    
    this.processBulkSearch(numbers, this.currentBulkType);
  },
  
  async processBulkSearch(numbers, type) {
    const statusEl = document.getElementById('status');
    const formattedOutput = document.getElementById('formattedOutput');
    const progressSection = document.getElementById('progressSection');
    const progressBar = document.getElementById('progressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    const processedCount = document.getElementById('processedCount');
    const totalCount = document.getElementById('totalCount');
    const foundCount = document.getElementById('foundCount');
    const notFoundCount = document.getElementById('notFoundCount');
    const elapsedTime = document.getElementById('elapsedTime');
    
    // Initialize progress tracking
    this.progressStartTime = Date.now();
    totalCount.textContent = numbers.length;
    processedCount.textContent = '0';
    foundCount.textContent = '0';
    notFoundCount.textContent = '0';
    elapsedTime.textContent = '0s';
    progressSection.style.display = 'block';
    
    // Start elapsed time counter
    this.progressTimer = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - this.progressStartTime) / 1000);
      elapsedTime.textContent = `${elapsedSeconds}s`;
    }, 1000);
    
    statusEl.innerHTML = '<i class="fas fa-sync fa-spin"></i> Processing bulk search...';
    progressBar.style.width = '0%';
    progressPercentage.textContent = '0%';
    
    let formatted = `BULK ${type.toUpperCase()} SEARCH REPORT\n`;
    formatted += "========================================================\n";
    formatted += "Generated: " + new Date().toLocaleString() + "\n";
    formatted += "Total Numbers: " + numbers.length + "\n";
    formatted += "========================================================\n\n";
    
    formattedOutput.value = formatted;
    
    let processed = 0;
    let found = 0;
    const foundNumbers = [];
    const notFoundNumbers = [];
    const apiUrl = type === 'mobile' ? 
      'https://gauravapi.gauravyt492.workers.dev/?mobile=' :
      'https://aadhar.gauravyt492.workers.dev/?aadhar=';
    
    for (const number of numbers) {
      const expectedLength = type === 'mobile' ? 10 : 12;
      
      if (number.length === expectedLength) {
        try {
          const response = await fetch(apiUrl + number);
          const text = await response.text();
          
          // Add detailed result for each number
          formatted += "\n" + "=".repeat(50) + "\n";
          formatted += `RESULT FOR ${number}\n`;
          formatted += "=".repeat(50) + "\n";
          
          // Check if data was found
          let hasData = false;
          
          try {
            const data = JSON.parse(text);
            // Check if we have valid data array with records
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
              hasData = true;
            } else {
              hasData = false;
            }
          } catch (e) {
            // If not JSON, check text response
            hasData = !text.includes('not found') && 
                     !text.includes('error') && 
                     !text.includes('No Data') &&
                     !text.includes('NO DATA AVAILABLE');
          }
          
          if (hasData) {
            found++;
            foundNumbers.push(number);
            
            // Parse and format the detailed data
            try {
              const data = JSON.parse(text);
              if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                // FIXED: Each record has its own sequential number and only first record shows the number
                data.data.forEach((item, idx) => {
                  if (idx === 0) {
                    formatted += `\n--- RECORD ${idx+1} FOR ${number} ---\n`; // Only first record shows the number
                  } else {
                    formatted += `\n--- RECORD ${idx+1} ---\n`; // Subsequent records don't show the number
                  }
                  
                  // FIXED: Email in lowercase, all other values in uppercase
                  if (item.name) formatted += "Name: " + item.name.toUpperCase() + "\n";
                  if (item.fname) formatted += "Father's Name: " + item.fname.toUpperCase() + "\n";
                  if (item.address) formatted += "Address: " + item.address.replace(/!/g, ', ').toUpperCase() + "\n";
                  if (item.mobile) formatted += "Phone Number: " + item.mobile + "\n";
                  if (item.alt) formatted += "Alternative Number: " + item.alt + "\n";
                  if (item.circle) formatted += "Circle: " + item.circle.toUpperCase() + "\n";
                  if (item.email) formatted += "Email: " + item.email.toLowerCase() + "\n"; // Email in lowercase
                  if (item.id) formatted += "Aadhaar: " + item.id + "\n";
                });
                formatted += "\nStatus: DATA FOUND\n";
                
                // Add individual number to history
                this.addToHistory(type, number, text);
              }
            } catch (e) {
              formatted += "Status: INVALID RESPONSE FORMAT\n";
              this.addToHistory(type, number, "INVALID RESPONSE");
            }
          } else {
            notFoundNumbers.push(number);
            formatted += "Status: DATA NOT FOUND\n";
            this.addToHistory(type, number, "DATA NOT FOUND");
          }
          
          formattedOutput.value = formatted;
          
        } catch (error) {
          notFoundNumbers.push(number);
          formatted += "\n" + "=".repeat(50) + "\n";
          formatted += `RESULT FOR ${number}\n`;
          formatted += "=".repeat(50) + "\n";
          formatted += "Status: NETWORK ERROR\n";
          formattedOutput.value = formatted;
          this.addToHistory(type, number, "NETWORK ERROR");
        }
      } else {
        notFoundNumbers.push(number);
        formatted += "\n" + "=".repeat(50) + "\n";
        formatted += `RESULT FOR ${number}\n`;
        formatted += "=".repeat(50) + "\n";
        formatted += "Status: INVALID FORMAT (Expected " + expectedLength + " digits)\n";
        formattedOutput.value = formatted;
      }
      
      processed++;
      const progress = (processed / numbers.length) * 100;
      progressBar.style.width = progress + '%';
      progressPercentage.textContent = Math.round(progress) + '%';
      processedCount.textContent = processed;
      foundCount.textContent = found;
      notFoundCount.textContent = processed - found;
      
      statusEl.innerHTML = `<i class="fas fa-sync fa-spin"></i> Processed ${processed}/${numbers.length} (${found} found)`;
    }
    
    // Clear progress timer
    clearInterval(this.progressTimer);
    
    // Store bulk data for PDF export
    this.currentBulkData = {
      numbers,
      foundNumbers,
      notFoundNumbers,
      type,
      total: numbers.length,
      found: found,
      notFound: numbers.length - found
    };
    
    // Add enhanced summary with number lists
    formatted += "\n\n" + "=".repeat(50) + "\n";
    formatted += "BULK SEARCH SUMMARY\n";
    formatted += "=".repeat(50) + "\n";
    formatted += `TOTAL REQUEST: ${numbers.length}\n\n`;
    formatted += `FOUND: ${found}\n`;
    
    // Add found numbers list
    if (foundNumbers.length > 0) {
      formatted += `Found Numbers: ${foundNumbers.join(', ')}\n`;
    } else {
      formatted += `Found Numbers: None\n`;
    }
    
    formatted += `\nNOT FOUND: ${numbers.length - found}\n`;
    
    // Add not found numbers list
    if (notFoundNumbers.length > 0) {
      formatted += `Not Found Numbers: ${notFoundNumbers.join(', ')}\n`;
    } else {
      formatted += `Not Found Numbers: None\n`;
    }
    
    formatted += `\nSuccess Rate: ${((found / numbers.length) * 100).toFixed(2)}%\n`;
    
    formattedOutput.value = formatted;
    progressSection.style.display = 'none';
    statusEl.innerHTML = `<i class="fas fa-check-circle"></i> Bulk search completed: ${found} found out of ${numbers.length}`;
    
    // Add bulk search to history
    this.addBulkToHistory(numbers, found, type);
    
    // Update statistics
    totalSearches += numbers.length;
    successfulSearches += found;
    updateStats();
  },
  
  initExportButtons() {
    document.getElementById('exportPDF').addEventListener('click', this.exportPDF.bind(this));
    document.getElementById('exportCSV').addEventListener('click', this.exportCSV.bind(this));
  },
  
  exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get the formatted output text
    const content = document.getElementById('formattedOutput').value;
    
    if (!content || content.includes('Formatted results will appear here')) {
      this.showNotification('No data to export', 'warning');
      return;
    }
    
    // Set status
    const statusEl = document.getElementById('status');
    statusEl.innerHTML = '<i class="fas fa-sync fa-spin"></i> Generating PDF...';
    
    // Get lookup type and input value for title
    const lookupType = document.getElementById('lookupType').value;
    const isBulk = lookupType.includes('bulk');
    
    // Set PDF properties
    doc.setProperties({
      title: 'Intelligence Lookup Report',
      subject: `${lookupType} analysis report`,
      author: 'Intelligence Lookup Tool',
      keywords: 'intelligence, osint, security, analysis',
      creator: 'Intelligence Lookup Tool v3.0'
    });
    
    // FIXED: Improved PDF header with better center alignment
    doc.setFillColor(26, 115, 232);
    doc.rect(0, 0, 210, 35, 'F');
    
    // Add title with better center alignment
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INTELLIGENCE LOOKUP TOOL', 105, 12, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Advanced Intelligence Analysis Platform', 105, 18, { align: 'center' });
    doc.text('Authorized Use Only | Secure Database Access', 105, 23, { align: 'center' });
    
    // Add report header section with better center alignment
    doc.setFillColor(13, 71, 161); // Dark blue
    doc.rect(0, 35, 210, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    let reportTitle = '';
    if (lookupType === 'mobile' || lookupType === 'bulk-mobile') {
      reportTitle = isBulk ? 'BULK MOBILE SEARCH REPORT' : 'MOBILE NUMBER ANALYSIS REPORT';
    } else if (lookupType === 'aadhaar' || lookupType === 'bulk-aadhaar') {
      reportTitle = isBulk ? 'BULK AADHAAR SEARCH REPORT' : 'AADHAAR ANALYSIS REPORT';
    } else if (lookupType === 'gst') {
      reportTitle = 'GST NUMBER ANALYSIS REPORT';
    } else if (lookupType === 'tg') {
      reportTitle = 'TELEGRAM USER ANALYSIS REPORT';
    } else if (lookupType === 'vehicle') {
      reportTitle = 'VEHICLE RC ANALYSIS REPORT';
    } else if (lookupType === 'ifsc') {
      reportTitle = 'IFSC CODE ANALYSIS REPORT';
    }
    
    doc.text(reportTitle, 105, 45, { align: 'center' });
    
    // Add generation info
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 15, 62);
    doc.text('Data Source: Secure OSINT Database', 195, 62, { align: 'right' });
    
    // Add a separator line
    doc.setDrawColor(26, 115, 232);
    doc.setLineWidth(0.5);
    doc.line(15, 65, 195, 65);
    
    // Process the content and add it to the PDF
    let yPosition = 75;
    const lines = content.split('\n');
    let currentRecord = 0;
    let currentNumber = '';
    
    // Set initial font for content
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // For bulk searches, add enhanced summary at the beginning
    if (isBulk && this.currentBulkData) {
      // Add enhanced summary section - REMOVED the redundant header
      yPosition += 5;
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPosition - 4, 180, 8, 'F');
      doc.setTextColor(26, 115, 232);
      doc.setFont('helvetica', 'bold');
      doc.text('BULK LOOKUP SUMMARY', 105, yPosition, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPosition += 12;
      
      // Add enhanced summary details with text wrapping
      doc.setFont('helvetica', 'bold');
      doc.text('Total Requests:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(this.currentBulkData.total.toString(), 60, yPosition);
      yPosition += 6;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Found:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      
      // Text wrapping for found numbers
      const foundText = `${this.currentBulkData.found} (${this.currentBulkData.foundNumbers.join(', ')})`;
      const foundLines = doc.splitTextToSize(foundText, 120);
      doc.text(foundLines, 60, yPosition);
      yPosition += foundLines.length * 5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Not Found:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      
      // Text wrapping for not found numbers
      const notFoundText = `${this.currentBulkData.notFound} (${this.currentBulkData.notFoundNumbers.join(', ')})`;
      const notFoundLines = doc.splitTextToSize(notFoundText, 120);
      doc.text(notFoundLines, 60, yPosition);
      yPosition += notFoundLines.length * 5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Success Rate:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(`${((this.currentBulkData.found / this.currentBulkData.total) * 100).toFixed(2)}%`, 60, yPosition);
      yPosition += 10;
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines at the beginning
      if (yPosition === 75 && line === '') continue;
      
      // Skip the redundant header section in bulk searches
      if (isBulk && (line.includes('BULK MOBILE SEARCH REPORT') || 
                     line.includes('BULK AADHAAR SEARCH REPORT') ||
                     line.includes('Generated:') ||
                     line.includes('Total Numbers:'))) {
        continue;
      }
      
      // Skip summary section for bulk searches (already processed)
      if (isBulk && line.includes('BULK SEARCH SUMMARY')) {
        // Skip to the end of summary
        while (i < lines.length && !lines[i].includes('CONFIDENTIAL')) i++;
        continue;
      }
      
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
        
        // Add header to new page with equal margins
        doc.setFillColor(26, 115, 232);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('Intelligence Lookup Tool - Continued', 105, 10, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
      }
      
      // Handle different line types with formatting
      if (line.includes('--- RECORD')) {
        // Record header with professional styling - FULL WIDTH
        currentRecord++;
        
        // Extract number from the record line if present
        const numberMatch = line.match(/FOR (\d+)/);
        if (numberMatch) {
          currentNumber = numberMatch[1];
        }
        
        // Create professional header for record - FULL WIDTH
        doc.setFillColor(240, 240, 240);
        doc.rect(0, yPosition - 4, 210, 8, 'F');
        doc.setTextColor(26, 115, 232);
        doc.setFont('helvetica', 'bold');
        
        // FIXED: Only show number for first record, subsequent records show only record number
        let recordText = line.includes('FOR') ? line.replace('--- ', '').replace(' ---', '') : line.replace('--- ', '').replace(' ---', '');
        
        doc.text(recordText.toUpperCase(), 105, yPosition, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        yPosition += 10;
        
      } else if (line.includes('Name:') || line.includes('Father') || line.includes('Address') || 
                 line.includes('Phone') || line.includes('Alternative') || line.includes('Circle') || 
                 line.includes('Email') || line.includes('Aadhaar') || line.includes('Status:') ||
                 line.includes('Mobile Number:') || line.includes('Aadhaar Number:')) {
        // Data rows with professional formatting
        const parts = line.split(': ');
        if (parts.length === 2) {
          // Labels in bold, with equal margins
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(60, 60, 60);
          doc.text(parts[0] + ':', 15, yPosition); // Fixed: Equal left margin
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          
          // FIXED: Email in lowercase, all other values in uppercase
          let valueText = parts[1];
          if (parts[0].toLowerCase().includes('email')) {
            valueText = valueText.toLowerCase(); // Email in lowercase
          } else {
            valueText = valueText.toUpperCase(); // All other values in uppercase
          }
          
          // Use smaller width for text wrapping to prevent overflow
          const valueLines = doc.splitTextToSize(valueText, 150); // Reduced from 160 to 150 for better margins
          doc.text(valueLines, 50, yPosition); // Adjusted position for better alignment
          yPosition += valueLines.length * 5; // Increased line spacing for readability
        } else {
          doc.text(line, 15, yPosition); // Fixed: Equal left margin
          yPosition += 5;
        }
      } else if (line.includes('RESULT FOR') && !line.includes('=======')) {
        // Individual result header for bulk searches
        yPosition += 8;
        doc.setFillColor(220, 220, 220);
        doc.rect(15, yPosition - 4, 180, 8, 'F'); // Fixed: Equal margins
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(line, 105, yPosition, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        yPosition += 12;
      } else if (line && !line.includes('***************************************') && 
                 !line.includes('CONFIDENTIAL') && !line.includes('Data from legal sources') &&
                 !line.includes('Intermediary service') && !line.includes('IT Act & DPDP compliant') &&
                 !line.includes('========================================================') &&
                 !line.includes('=======') && !line.includes('BULK SEARCH SUMMARY') &&
                 !line.includes('Report generated:') && !line.includes('Data Source:')) {
        // Regular content (skip the footer section)
        if (line.trim() !== '') {
          // FIXED: Better text wrapping for regular content
          const splitLines = doc.splitTextToSize(line, 170); // Reduced width for better margins
          doc.text(splitLines, 20, yPosition); // Centered with equal margins
          yPosition += splitLines.length * 5; // Increased line spacing
        }
      } else if (line.includes('CONFIDENTIAL: For Police / LEA only.')) {
        // Skip the existing confidential message in content
        continue;
      } else {
        // Empty line or separators
        if (line.includes('=======')) {
          yPosition += 3;
        } else {
          yPosition += 2;
        }
      }
    }
    
    // Add enhanced confidential warning at the end of the document
    yPosition += 10;
    
    // Add a prominent border for the confidential section
    doc.setDrawColor(234, 67, 53);
    doc.setLineWidth(1);
    doc.rect(10, yPosition - 5, 190, 45);
    
    // Add background color for the confidential section
    doc.setFillColor(255, 245, 245);
    doc.rect(10, yPosition - 5, 190, 45, 'F');
    
    // Add confidential warning text
    doc.setTextColor(234, 67, 53);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('CONFIDENTIAL: FOR AUTHORIZED LAW ENFORCEMENT USE ONLY', 105, yPosition, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Data sourced from legitimate databases. Use requires proper authorization.', 105, yPosition + 8, { align: 'center' });
    doc.text('Intermediary service provider. No data storage. Not liable for misuse.', 105, yPosition + 16, { align: 'center' });
    doc.text('Compliant with IT Act 2000 & DPDP Act 2023. Do not share publicly.', 105, yPosition + 24, { align: 'center' });
    
    yPosition += 35;
    
    // Add watermark to PDF
    this.addPDFWatermark(doc);
    
    // Add professional footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
      doc.text('Intelligence Lookup Tool v3.0 | Secure OSINT Platform', 105, 290, { align: 'center' });
      doc.text('Classification: RESTRICTED - Law Enforcement Use Only', 105, 295, { align: 'center' });
    }
    
    // Save the PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `intelligence_report_${lookupType}_${timestamp}.pdf`;
    doc.save(filename);
    
    statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Professional PDF report generated successfully';
    setTimeout(() => {
      statusEl.innerHTML = '';
    }, 3000);
  },
  
  // Add watermark to PDF - FIXED VERSION
  addPDFWatermark(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Save current graphics state
      doc.saveGraphicsState();
      
      // Set watermark properties with 8% opacity
      doc.setGState(new doc.GState({ opacity: 0.08 }));
      
      // Center position for watermark with 60px spacing between text
      const centerX = 105;
      const centerY = 150;
      
      // Add "INTELLIGENCE LOOKUP TOOL" watermark (green) - smaller font size
      doc.setTextColor(52, 168, 83); // Green color
      doc.setFontSize(35); // Reduced from 40 to 35
      doc.setFont('helvetica', 'bold');
      doc.text('INTELLIGENCE LOOKUP TOOL', centerX, centerY - 40, { 
        align: 'center',
        angle: -30
      });
      
      // Add "CONFIDENTIAL" watermark (red) - smaller font size
      doc.setTextColor(234, 67, 53); // Red color
      doc.setFontSize(30); // Reduced from 35 to 30
      doc.setFont('helvetica', 'bold');
      doc.text('CONFIDENTIAL', centerX, centerY + 20, { 
        align: 'center',
        angle: -30
      });
      
      // Restore graphics state
      doc.restoreGraphicsState();
    }
  },
  
  exportCSV() {
    const content = document.getElementById('formattedOutput').value;
    if (!content) {
      this.showNotification('No data to export', 'warning');
      return;
    }
    
    const blob = new Blob([content], { type: 'text/csv' });
    this.downloadFile(blob, 'intelligence_report.csv');
    this.showNotification('CSV exported successfully', 'success');
  },
  
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  
  async checkAPIHealth() {
    const apiStatus = document.getElementById('apiStatus');
    try {
      const response = await fetch('https://auth.up.in/test/api.php?key=ishu@ssf&mobile=9919733099');
      if (response.ok) {
        this.apiStatus = 'online';
        apiStatus.className = 'api-status online';
        apiStatus.innerHTML = '<i class="fas fa-circle"></i> All systems operational';
      } else {
        throw new Error('API not responding');
      }
    } catch (error) {
      this.apiStatus = 'offline';
      apiStatus.className = 'api-status offline';
      apiStatus.innerHTML = '<i class="fas fa-circle"></i> API temporarily unavailable';
    }
  },
  
  showNotification(message, type = 'info') {
    const statusEl = document.getElementById('status');
    const icons = {
      info: 'fas fa-info-circle',
      success: 'fas fa-check-circle',
      warning: 'fas fa-exclamation-triangle',
      error: 'fas fa-exclamation-circle'
    };
    
    statusEl.innerHTML = `<i class="${icons[type]}"></i> ${message}`;
    setTimeout(() => {
      if (statusEl.innerHTML.includes(message)) {
        statusEl.innerHTML = '';
      }
    }, 5000);
  }
};

// PIN Protection Logic
const pinOverlay = document.getElementById('pinOverlay');
const mainApp = document.getElementById('mainApp');
const pinInput = document.getElementById('pinInput');
const submitPin = document.getElementById('submitPin');
const pinError = document.getElementById('pinError');
const attemptsCounter = document.getElementById('attemptsCounter');
const attemptsLeft = document.getElementById('attemptsLeft');

// Static PIN for testing - Change this to your desired PIN
const STATIC_PIN = "1212";
let attempts = 3;

// Check PIN and grant access if correct
function checkPin() {
  const enteredPin = pinInput.value.trim();
  
  if (enteredPin === STATIC_PIN) {
    // Correct PIN - hide overlay and show main app
    pinOverlay.style.display = 'none';
    mainApp.style.display = 'block';
    pinError.textContent = '';
    // Initialize advanced features
    advancedFeatures.init();
  } else {
    // Incorrect PIN - show error
    attempts--;
    attemptsLeft.textContent = attempts;
    
    if (attempts <= 0) {
      pinError.innerHTML = '<i class="fas fa-ban"></i> Access denied. Too many failed attempts.';
      submitPin.disabled = true;
      pinInput.disabled = true;
      setTimeout(() => {
        pinError.innerHTML = '<i class="fas fa-exclamation-triangle"></i> System will reset in 30 seconds.';
      }, 3000);
      
      // Reset after 30 seconds
      setTimeout(() => {
        attempts = 3;
        attemptsLeft.textContent = attempts;
        pinError.textContent = '';
        submitPin.disabled = false;
        pinInput.disabled = false;
        pinInput.value = '';
        pinInput.focus();
      }, 30000);
    } else {
      pinError.innerHTML = '<i class="fas fa-exclamation-circle"></i> Incorrect PIN. Please try again.';
      pinInput.value = '';
      pinInput.focus();
    }
  }
}

// Event listeners for PIN functionality
submitPin.addEventListener('click', checkPin);
pinInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    checkPin();
  }
});

// Only allow numeric input for PIN
pinInput.addEventListener('input', () => {
  pinInput.value = pinInput.value.replace(/\D/g, '');
});

// Focus PIN input on load
pinInput.focus();

// Main Application Logic
const mobileApi = "https://gauravapi.gauravyt492.workers.dev/?mobile=";
const aadhaarApi = "https://aadhar.gauravyt492.workers.dev/?aadhar=";
const gstApi = "https://gaurav-osint-panel.gauravyt492.workers.dev/?gstNumber=";
const tgApi = "https://gaurav-osint-panel.gauravyt492.workers.dev/?user=";
const vehicleApi = "https://gaurav-vehicle-api.gauravyt492.workers.dev/?rc=";
const ifscApi = "https://encore.sahilraz9265.workers.dev/ifsc-lookup?ifsc=";

const lookupType = document.getElementById("lookupType");
const inputField = document.getElementById("inputField");
const goBtn = document.getElementById("go");
const clearBtn = document.getElementById("clearBtn");
const rawOutput = document.getElementById("rawOutput");
const formattedOutput = document.getElementById("formattedOutput");
const copyFormattedBtn = document.getElementById("copyFormatted");
const downloadBtn = document.getElementById("downloadBtn");
const statusEl = document.getElementById("status");
const totalSearchesEl = document.getElementById("totalSearches");
const successRateEl = document.getElementById("successRate");
const responseTimeEl = document.getElementById("responseTime");

// Statistics
let totalSearches = 0;
let successfulSearches = 0;
let totalResponseTime = 0;

// Initialize stats from localStorage
const savedStats = JSON.parse(localStorage.getItem('searchStats')) || { total: 0, successful: 0, responseTime: 0 };
totalSearches = savedStats.total;
successfulSearches = savedStats.successful;
totalResponseTime = savedStats.responseTime;
updateStats();

// Function to format mobile number
function formatMobileNumber(input) {
  let cleaned = input.replace(/\D/g, '');
  
  if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length > 10) {
    cleaned = cleaned.substring(1);
  }
  
  return cleaned.substring(0, 10);
}

// Function to format Aadhaar number
function formatAadhaarNumber(input) {
  return input.replace(/\D/g, '').substring(0, 12);
}

// Function to format GST number (15 characters alphanumeric)
function formatGstNumber(input) {
  return input.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15).toUpperCase();
}

// Function to format Telegram user (alphanumeric with underscores, or numeric ID)
function formatTgUser(input) {
  return input.trim();
}

// Function to format Vehicle RC (alphanumeric, typically 10-15 chars)
function formatVehicleRc(input) {
  return input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

// Function to format IFSC (11 characters alphanumeric)
function formatIfsc(input) {
  return input.replace(/[^a-zA-Z0-9]/g, '').substring(0, 11).toUpperCase();
}

// Update stats display
function updateStats() {
  totalSearchesEl.textContent = totalSearches;
  const successRate = totalSearches > 0 ? Math.round((successfulSearches / totalSearches) * 100) : 100;
  successRateEl.textContent = successRate + '%';
  const avgResponse = totalSearches > 0 ? Math.round(totalResponseTime / totalSearches) : 0;
  responseTimeEl.textContent = avgResponse + 'ms';
  
  // Save to localStorage
  localStorage.setItem('searchStats', JSON.stringify({
    total: totalSearches,
    successful: successfulSearches,
    responseTime: totalResponseTime
  }));
}

// Clear button functionality
clearBtn.addEventListener('click', function() {
  inputField.value = '';
  formattedOutput.value = '';
  rawOutput.value = '';
  statusEl.innerHTML = '';
  document.getElementById('progressSection').style.display = 'none';
  document.getElementById('manualInput').value = '';
  inputField.focus();
});

// Update input field based on selection
lookupType.addEventListener('change', function() {
  const currentValue = inputField.value;
  if (currentValue) {
    switch (this.value) {
      case 'mobile':
      case 'bulk-mobile':
        inputField.value = formatMobileNumber(currentValue);
        break;
      case 'aadhaar':
      case 'bulk-aadhaar':
        inputField.value = formatAadhaarNumber(currentValue);
        break;
      case 'gst':
        inputField.value = formatGstNumber(currentValue);
        break;
      case 'tg':
        inputField.value = formatTgUser(currentValue);
        break;
      case 'vehicle':
        inputField.value = formatVehicleRc(currentValue);
        break;
      case 'ifsc':
        inputField.value = formatIfsc(currentValue);
        break;
    }
  }
  
  // Update bulk type and instructions
  if (this.value.includes('bulk')) {
    advancedFeatures.currentBulkType = this.value.includes('mobile') ? 'mobile' : 'aadhaar';
    advancedFeatures.updateBulkInstructions();
  }
  
  inputField.focus();
});

// Auto-format input as user types
inputField.addEventListener('input', function() {
  const type = lookupType.value;
  switch (type) {
    case 'mobile':
    case 'bulk-mobile':
      this.value = formatMobileNumber(this.value);
      break;
    case 'aadhaar':
    case 'bulk-aadhaar':
      this.value = formatAadhaarNumber(this.value);
      break;
    case 'gst':
      this.value = formatGstNumber(this.value);
      break;
    case 'tg':
      this.value = formatTgUser(this.value);
      break;
    case 'vehicle':
      this.value = formatVehicleRc(this.value);
      break;
    case 'ifsc':
      this.value = formatIfsc(this.value);
      break;
  }
});

// Auto-format on paste
inputField.addEventListener('paste', function(e) {
  setTimeout(() => {
    const type = lookupType.value;
    switch (type) {
      case 'mobile':
      case 'bulk-mobile':
        this.value = formatMobileNumber(this.value);
        break;
      case 'aadhaar':
      case 'bulk-aadhaar':
        this.value = formatAadhaarNumber(this.value);
        break;
      case 'gst':
        this.value = formatGstNumber(this.value);
        break;
      case 'tg':
        this.value = formatTgUser(this.value);
        break;
      case 'vehicle':
        this.value = formatVehicleRc(this.value);
        break;
      case 'ifsc':
        this.value = formatIfsc(this.value);
        break;
    }
  }, 0);
});

// Function to clean and format server response
function cleanServerResponse(text) {
  try {
    // Try to parse as JSON first
    const data = JSON.parse(text);
    
    // If it's valid JSON with data array, return clean message
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      return "Server returned valid data";
    }
    
    // If it's JSON but empty or error
    if (data.error || data.message) {
      return data.message || data.error || "Server returned error response";
    }
    
    // Return cleaned JSON string without extra symbols
    return JSON.stringify(data, null, 2)
      .replace(/[{}[\]"]/g, '')
      .replace(/,/g, '\n')
      .replace(/^\s*\n/gm, '')
      .trim();
      
  } catch (e) {
    // If not JSON, return cleaned text
    return text
      .replace(/[{}[\]"]/g, '')
      .replace(/,/g, '\n')
      .replace(/^\s*\n/gm, '')
      .trim();
  }
}

function formatJSON(rawJson, type, inputValue) {
  let data;
  try { 
    data = JSON.parse(rawJson); 
    successfulSearches++;
  } catch(e) { 
    const cleanResponse = cleanServerResponse(rawJson);
    return "Invalid JSON response\n\nServer Raw Response:\n" + cleanResponse;
  }

  // Check for "not found" or error responses for all types
  if (rawJson.includes("not found") || rawJson.includes("Not Found") || 
      rawJson.includes("error") || rawJson.includes("Error") ||
      rawJson.includes("no data") || rawJson.includes("No Data") ||
      rawJson.includes("NO DATA AVAILABLE") ||
      rawJson.includes("invalid") || rawJson.includes("Invalid") ||
      rawJson.includes("failed") || rawJson.includes("Failed")) {
    const cleanResponse = cleanServerResponse(rawJson);
    return "Data not found for " + inputValue + "\n\nServer Raw Response:\n" + cleanResponse;
  }

  let records = [];
  let challans = [];

  switch (type) {
    case 'mobile':
    case 'aadhaar':
      records = data.data || [];
      break;
    case 'gst':
      records = data.data ? [data.data] : [];
      break;
    case 'tg':
      records = data.data ? [data.data] : [];
      break;
    case 'vehicle':
      records = (data.result && data.result.vehicle_response) ? [data.result.vehicle_response] : [];
      challans = (data.result && data.result.challan_response && data.result.challan_response.data) ? data.result.challan_response.data : [];
      break;
    case 'ifsc':
      records = [data];
      break;
  }

  if (records.length === 0) {
    const cleanResponse = cleanServerResponse(rawJson);
    return "No data available for " + inputValue + "\n\nServer Raw Response:\n" + cleanResponse;
  }

  let formatted = "";
  
  // Add professional header based on lookup type
  formatted += "========================================================\n";
  if (type === "mobile") {
    formatted += "MOBILE NUMBER ANALYSIS REPORT\n";
    formatted += "                 FOR " + inputValue + "\n";
  } else if (type === "aadhaar") {
    formatted += "AADHAAR ANALYSIS REPORT\n";
    formatted += "                 FOR " + inputValue + "\n";
  } else if (type === "gst") {
    formatted += "GST NUMBER ANALYSIS REPORT\n";
    formatted += "                 FOR " + inputValue + "\n";
  } else if (type === "tg") {
    formatted += "TELEGRAM USER ANALYSIS REPORT\n";
    formatted += "                 FOR " + inputValue + "\n";
  } else if (type === "vehicle") {
    formatted += "VEHICLE RC ANALYSIS REPORT\n";
    formatted += "                 FOR " + inputValue + "\n";
  } else if (type === "ifsc") {
    formatted += "IFSC CODE ANALYSIS REPORT\n";
    formatted += "                 FOR " + inputValue + "\n";
  }
  formatted += "========================================================\n\n";
  
  // Format each record
  records.forEach((item, idx) => {
    formatted += "-------------------------------------------\n";
    if (idx === 0) {
      formatted += `                      RECORD ${idx+1} FOR ${inputValue}\n`; // First record shows the input value
    } else {
      formatted += `                      RECORD ${idx+1}\n`; // Subsequent records show only record number
    }
    formatted += "-------------------------------------------\n";
    
    // Handle all possible fields, ensuring email is lowercase and others are uppercase
    // Skip if value is null or empty string
    if (item.name != null && item.name !== '') formatted += "Name: " + item.name.toUpperCase() + "\n";
    if (item.fname != null && item.fname !== '') formatted += "Father's Name: " + item.fname.toUpperCase() + "\n";
    if (item.address != null && item.address !== '') formatted += "Address: " + item.address.replace(/!/g, ', ').replace(/\n/g, ', ').toUpperCase() + "\n";
    if (item.mobile != null && item.mobile !== '') formatted += "Phone Number: " + item.mobile + "\n";
    if (item.alt != null && item.alt !== '') formatted += "Alternative Number: " + item.alt + "\n";
    if (item.circle != null && item.circle !== '') formatted += "Circle: " + item.circle.toUpperCase() + "\n";
    if (item.email != null && item.email !== '') formatted += "Email: " + item.email.toLowerCase() + "\n";
    if (item.id != null && item.id !== '') formatted += "Aadhaar: " + item.id + "\n";
    
    // GST fields
    if (item.Gstin != null && item.Gstin !== '') formatted += "GSTIN: " + item.Gstin + "\n";
    if (item.TradeName != null && item.TradeName !== '') formatted += "Trade Name: " + item.TradeName.toUpperCase() + "\n";
    if (item.LegalName != null && item.LegalName !== '') formatted += "Legal Name: " + item.LegalName.toUpperCase() + "\n";
    if (item.AddrBnm || item.AddrBno || item.AddrFlno || item.AddrSt || item.AddrLoc) {
      const addrParts = [item.AddrBno, item.AddrFlno, item.AddrSt, item.AddrBnm, item.AddrLoc].filter(part => part != null && part !== '').join(', ');
      if (addrParts) formatted += "Address: " + addrParts.toUpperCase() + "\n";
    }
    if (item.StateCode != null && item.StateCode !== '') formatted += "State Code: " + item.StateCode + "\n";
    if (item.AddrPncd != null && item.AddrPncd !== '') formatted += "Pincode: " + item.AddrPncd + "\n";
    if (item.TxpType != null && item.TxpType !== '') formatted += "Taxpayer Type: " + item.TxpType + "\n";
    if (item.Status != null && item.Status !== '') formatted += "Status: " + item.Status.toUpperCase() + "\n";
    if (item.BlkStatus != null && item.BlkStatus !== '') formatted += "Block Status: " + item.BlkStatus.toUpperCase() + "\n";
    if (item.DtReg != null && item.DtReg !== '') formatted += "Registration Date: " + item.DtReg + "\n";
    if (item.DtDReg != null && item.DtDReg !== '') formatted += "Deregistration Date: " + item.DtDReg + "\n";
    
    // TG fields
    if (item.first_name != null && item.first_name !== '') formatted += "First Name: " + item.first_name.toUpperCase() + "\n";
    if (item.last_name != null && item.last_name !== '') formatted += "Last Name: " + item.last_name.toUpperCase() + "\n";
    if (item.id != null && item.id !== '') formatted += "ID: " + item.id + "\n";
    if (item.is_active != null) formatted += "Is Active: " + (item.is_active ? "Yes" : "No") + "\n";
    if (item.is_bot != null) formatted += "Is Bot: " + (item.is_bot ? "Yes" : "No") + "\n";
    if (item.first_msg_date != null && item.first_msg_date !== '') formatted += "First Message Date: " + item.first_msg_date + "\n";
    if (item.last_msg_date != null && item.last_msg_date !== '') formatted += "Last Message Date: " + item.last_msg_date + "\n";
    if (item.adm_in_groups != null && item.adm_in_groups !== '') formatted += "Admin in Groups: " + item.adm_in_groups + "\n";
    if (item.msg_in_groups_count != null && item.msg_in_groups_count !== '') formatted += "Messages in Groups: " + item.msg_in_groups_count + "\n";
    if (item.names_count != null && item.names_count !== '') formatted += "Names Count: " + item.names_count + "\n";
    if (item.total_groups != null && item.total_groups !== '') formatted += "Total Groups: " + item.total_groups + "\n";
    if (item.total_msg_count != null && item.total_msg_count !== '') formatted += "Total Messages: " + item.total_msg_count + "\n";
    if (item.usernames_count != null && item.usernames_count !== '') formatted += "Usernames Count: " + item.usernames_count + "\n";
    
    // IFSC fields
    if (item.IFSC != null && item.IFSC !== '') formatted += "IFSC: " + item.IFSC + "\n";
    if (item.BANK != null && item.BANK !== '') formatted += "Bank: " + item.BANK.toUpperCase() + "\n";
    if (item.BANKCODE != null && item.BANKCODE !== '') formatted += "Bank Code: " + item.BANKCODE + "\n";
    if (item.BRANCH != null && item.BRANCH !== '') formatted += "Branch: " + item.BRANCH.toUpperCase() + "\n";
    if (item.ADDRESS != null && item.ADDRESS !== '') formatted += "Address: " + item.ADDRESS.replace(/\n/g, ', ').toUpperCase() + "\n";
    if (item.CITY != null && item.CITY !== '') formatted += "City: " + item.CITY.toUpperCase() + "\n";
    if (item.DISTRICT != null && item.DISTRICT !== '') formatted += "District: " + item.DISTRICT.toUpperCase() + "\n";
    if (item.STATE != null && item.STATE !== '') formatted += "State: " + item.STATE.toUpperCase() + "\n";
    if (item.CENTRE != null && item.CENTRE !== '') formatted += "Centre: " + item.CENTRE.toUpperCase() + "\n";
    if (item.MICR != null && item.MICR !== '') formatted += "MICR: " + item.MICR + "\n";
    if (item.CONTACT != null && item.CONTACT !== '') formatted += "Contact: " + item.CONTACT + "\n";
    if (item.UPI != null) formatted += "UPI: " + (item.UPI ? "Yes" : "No") + "\n";
    if (item.RTGS != null) formatted += "RTGS: " + (item.RTGS ? "Yes" : "No") + "\n";
    if (item.NEFT != null) formatted += "NEFT: " + (item.NEFT ? "Yes" : "No") + "\n";
    if (item.IMPS != null) formatted += "IMPS: " + (item.IMPS ? "Yes" : "No") + "\n";
    if (item.SWIFT != null && item.SWIFT !== '') formatted += "SWIFT: " + item.SWIFT + "\n";
    if (item.ISO3166 != null && item.ISO3166 !== '') formatted += "ISO3166: " + item.ISO3166 + "\n";
    
    // Vehicle fields
    if (item.asset_number != null && item.asset_number !== '') formatted += "Asset Number: " + item.asset_number.toUpperCase() + "\n";
    if (item.asset_type != null && item.asset_type !== '') formatted += "Asset Type: " + item.asset_type.toUpperCase() + "\n";
    if (item.registration_year != null && item.registration_year !== '') formatted += "Registration Year: " + item.registration_year + "\n";
    if (item.registration_month != null && item.registration_month !== '') formatted += "Registration Month: " + item.registration_month + "\n";
    if (item.make_model != null && item.make_model !== '') formatted += "Make Model: " + item.make_model.toUpperCase() + "\n";
    if (item.vehicle_type != null && item.vehicle_type !== '') formatted += "Vehicle Type: " + item.vehicle_type.toUpperCase() + "\n";
    if (item.make_name != null && item.make_name !== '') formatted += "Make Name: " + item.make_name.toUpperCase() + "\n";
    if (item.fuel_type != null && item.fuel_type !== '') formatted += "Fuel Type: " + item.fuel_type.toUpperCase() + "\n";
    if (item.engine_number != null && item.engine_number !== '') formatted += "Engine Number: " + item.engine_number + "\n";
    if (item.owner_name != null && item.owner_name !== '') formatted += "Owner Name: " + item.owner_name.toUpperCase() + "\n";
    if (item.chassis_number != null && item.chassis_number !== '') formatted += "Chassis Number: " + item.chassis_number + "\n";
    if (item.previous_insurer != null && item.previous_insurer !== '') formatted += "Previous Insurer: " + item.previous_insurer.toUpperCase() + "\n";
    if (item.previous_policy_expiry_date != null && item.previous_policy_expiry_date !== '') formatted += "Previous Policy Expiry Date: " + item.previous_policy_expiry_date + "\n";
    if (item.is_commercial != null) formatted += "Is Commercial: " + (item.is_commercial ? "Yes" : "No") + "\n";
    if (item.vehicle_type_v2 != null && item.vehicle_type_v2 !== '') formatted += "Vehicle Type V2: " + item.vehicle_type_v2.toUpperCase() + "\n";
    if (item.vehicle_type_processed != null && item.vehicle_type_processed !== '') formatted += "Vehicle Type Processed: " + item.vehicle_type_processed.toUpperCase() + "\n";
    if (item.permanent_address != null && item.permanent_address !== '') formatted += "Permanent Address: " + item.permanent_address.replace(/\n/g, ', ').toUpperCase() + "\n";
    if (item.present_address != null && item.present_address !== '') formatted += "Present Address: " + item.present_address.replace(/\n/g, ', ').toUpperCase() + "\n";
    if (item.registration_date != null && item.registration_date !== '') formatted += "Registration Date: " + item.registration_date + "\n";
    if (item.registration_address != null && item.registration_address !== '') formatted += "Registration Address: " + item.registration_address.replace(/\n/g, ', ').toUpperCase() + "\n";
    if (item.model_name != null && item.model_name !== '') formatted += "Model Name: " + item.model_name.toUpperCase() + "\n";
    if (item.make_name2 != null && item.make_name2 !== '') formatted += "Make Name 2: " + item.make_name2.toUpperCase() + "\n";
    if (item.model_name2 != null && item.model_name2 !== '') formatted += "Model Name 2: " + item.model_name2.toUpperCase() + "\n";
    if (item.variant_id != null && item.variant_id !== '') formatted += "Variant ID: " + item.variant_id + "\n";
    if (item.variant_id_0 != null && item.variant_id_0 !== '') formatted += "Variant ID 0: " + item.variant_id_0 + "\n";
    if (item.previous_policy_expired != null) formatted += "Previous Policy Expired: " + (item.previous_policy_expired ? "Yes" : "No") + "\n";
    
    formatted += "\n";
  });
  
  // Handle challans for vehicle
  if (type === "vehicle" && challans.length > 0) {
    formatted += "========================================================\n";
    formatted += "CHALLAN DETAILS\n";
    formatted += "========================================================\n\n";
    
    challans.forEach((challan, idx) => {
      formatted += "-------------------------------------------\n";
      formatted += `                      CHALLAN ${idx+1}\n`;
      formatted += "-------------------------------------------\n";
      
      if (challan.number != null && challan.number !== '') formatted += "Challan Number: " + challan.number + "\n";
      if (challan.amount && challan.amount.total != null) formatted += "Total Amount: " + challan.amount.total + "\n";
      if (challan.state != null && challan.state !== '') formatted += "State: " + challan.state + "\n";
      if (challan.challan_status != null && challan.challan_status !== '') formatted += "Status: " + challan.challan_status.toUpperCase() + "\n";
      if (challan.date != null && challan.date !== '') formatted += "Date: " + challan.date + "\n";
      if (challan.name != null && challan.name !== '') formatted += "Name: " + challan.name.toUpperCase() + "\n";
      if (challan.location != null && challan.location !== '') formatted += "Location: " + challan.location.toUpperCase() + "\n";
      if (challan.violations && challan.violations.details) {
        formatted += "Violations:\n";
        Object.entries(challan.violations.details).forEach(([key, value]) => {
          if (key.startsWith('offence') && value != null && value !== '') {
            formatted += " - " + value.replace(/\n/g, ' ').trim() + "\n";
          }
        });
      }
      formatted += "\n";
    });
  }
  
  // Add footer
  formatted += "------------------------------------------\n";
  formatted += "Report generated: " + new Date().toLocaleString() + "\n";
  formatted += "Data Source: Secure OSINT Database\n";
  formatted += "------------------------------------------\n";
  
  formatted += "\n" + "***************************************\n";
  formatted += "CONFIDENTIAL: For Police / LEA only.\n";
  formatted += "Data from legal sources. Use with consent/authorization.\n";
  formatted += "Intermediary service, no storage, not liable.\n";
  formatted += "IT Act & DPDP compliant. Do not share publicly.\n";
  formatted += "***************************************";
  
  return formatted;
}

async function search(){
  const type = lookupType.value;
  
  // Handle bulk search separately
  if (type.includes('bulk')) {
    const manualSection = document.getElementById('manualSection');
    const uploadSection = document.getElementById('uploadSection');
    
    // Check if manual entry is active
    if (manualSection.style.display !== 'none') {
      advancedFeatures.processManualSearch();
      return;
    }
    
    // Otherwise use file upload
    document.getElementById('csvUpload').click();
    return;
  }
  
  let val = inputField.value.trim();

  // Auto-format the input before validation
  switch (type) {
    case 'mobile':
      val = formatMobileNumber(val);
      break;
    case 'aadhaar':
      val = formatAadhaarNumber(val);
      break;
    case 'gst':
      val = formatGstNumber(val);
      break;
    case 'tg':
      val = formatTgUser(val);
      break;
    case 'vehicle':
      val = formatVehicleRc(val);
      break;
    case 'ifsc':
      val = formatIfsc(val);
      break;
  }

  // Update the input field with formatted value
  inputField.value = val;

  // Validation
  switch (type) {
    case 'mobile':
      if (val.length !== 10) {
        statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Enter valid 10-digit mobile';
        return;
      }
      break;
    case 'aadhaar':
      if (val.length !== 12) {
        statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Enter valid 12-digit Aadhaar';
        return;
      }
      break;
    case 'gst':
      if (val.length !== 15) {
        statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Enter valid 15-character GST number';
        return;
      }
      break;
    case 'tg':
      if (val.length === 0) {
        statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Enter valid Telegram user/ID';
        return;
      }
      break;
    case 'vehicle':
      if (val.length < 10) {
        statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Enter valid Vehicle RC number';
        return;
      }
      break;
    case 'ifsc':
      if (val.length !== 11) {
        statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Enter valid 11-character IFSC code';
        return;
      }
      break;
  }

  statusEl.innerHTML = '<i class="fas fa-sync fa-spin"></i> Connecting to Database...';
  rawOutput.value=""; 
  formattedOutput.value="";
  goBtn.disabled = true;
  goBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Connecting...';

  let url;
  switch (type) {
    case 'mobile':
      url = mobileApi + encodeURIComponent(val);
      break;
    case 'aadhaar':
      url = aadhaarApi + encodeURIComponent(val);
      break;
    case 'gst':
      url = gstApi + encodeURIComponent(val);
      break;
    case 'tg':
      url = tgApi + encodeURIComponent(val);
      break;
    case 'vehicle':
      url = vehicleApi + encodeURIComponent(val);
      break;
    case 'ifsc':
      url = ifscApi + encodeURIComponent(val);
      break;
  }
  const startTime = performance.now();

  try{
    // First show connecting status for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Then show fetching data status
    statusEl.innerHTML = '<i class="fas fa-sync fa-spin"></i> Fetching Data...';
    goBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Fetching...';
    
    const resp = await fetch(url);
    const text = await resp.text();
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    totalResponseTime += responseTime;
    
    rawOutput.value = text; // hidden
    formattedOutput.value = formatJSON(text, type, val);
    
    // Add to search history
    advancedFeatures.addToHistory(type, val, text);
    
    // Check if data was found or not for all types
    if (text.includes("not found") || text.includes("No Data") || text.includes("NO DATA AVAILABLE") || text.includes("error") || 
        text.includes("invalid") || text.includes("failed")) {
      statusEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Data Not Found (${responseTime}ms)`;
    } else {
      statusEl.innerHTML = `<i class="fas fa-check-circle"></i> Analysis Complete (${responseTime}ms)`;
    }
  }catch(err){
    rawOutput.value="Request failed: "+err;
    formattedOutput.value = "Network Error: Unable to connect to database\n\nError Details: " + err.message + "\n\nPlease check your internet connection and try again.";
    statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Connection Error';
  }finally{
    // Clear input field after search completion
    inputField.value = '';
    
    totalSearches++;
    updateStats();
    goBtn.disabled = false;
    goBtn.innerHTML = '<i class="fas fa-search"></i> Search';
    setTimeout(() => { statusEl.innerHTML = ''; }, 5000);
    
    // Focus input for next search
    inputField.focus();
  }
}

// Download text file function
function downloadTextFile() {
  if(!formattedOutput.value || formattedOutput.value.includes('Formatted results will appear here')){ 
    advancedFeatures.showNotification('No results to download', 'warning');
    return; 
  }
  
  const blob = new Blob([formattedOutput.value], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Create filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const type = lookupType.value.includes('mobile') ? 'mobile' : lookupType.value;
  a.download = `intelligence_report_${type}_${timestamp}.txt`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  advancedFeatures.showNotification('Report downloaded successfully', 'success');
}

goBtn.addEventListener("click", search);
inputField.addEventListener("keydown", e=>{ if(e.key==="Enter") search(); });

copyFormattedBtn.addEventListener("click", async ()=>{
  if(!formattedOutput.value || formattedOutput.value.includes('Formatted results will appear here')){ 
    advancedFeatures.showNotification('Nothing to copy', 'warning');
    return; 
  }
  try {
    await navigator.clipboard.writeText(formattedOutput.value);
    copyFormattedBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    advancedFeatures.showNotification('Copied to clipboard', 'success');
    setTimeout(()=>{
      copyFormattedBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Result';
    },3000);
  } catch(e) {
    advancedFeatures.showNotification('Copy failed: ' + e, 'error');
  }
});

downloadBtn.addEventListener("click", downloadTextFile);

// Focus input on page load (after PIN is entered)
inputField.focus();
