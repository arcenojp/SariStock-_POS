class ReportsManager {
    constructor() {
        this.reportData = [];
        this.salesChart = null;
        this.productsChart = null;
        this.init();
    }

    async init() {
        await this.loadReportData();
        this.setupEventListeners();
    }

    async loadReportData() {
        // Load initial report data
        await this.generateSalesReport();
    }

    async generateSalesReport() {
        try {
            // Load KPI data
            await this.loadKPIData();
            
            // Generate charts
            await this.generateSalesChart();
            await this.generateProductsChart();
            
            // Load report table data
            await this.loadReportTable('sales');
            
        } catch (error) {
            console.error('Error generating report:', error);
            window.posApp.showNotification('Error generating report', 'error');
        }
    }

    async loadKPIData() {
        try {
            // Get today's summary
            const todayResponse = await fetch('php/sales/sales.php?today_summary=true');
            const todayResult = await todayResponse.json();
            
            // Get total sales data (you might need to adjust dates for this)
            const salesResponse = await fetch('php/sales/sales.php');
            const salesResult = await salesResponse.json();
            
            // Get low stock products for inventory insights
            const productsResponse = await fetch('php/products/sales.php');
            const productsResult = await productsResponse.json();
            
            if (todayResult.success && salesResult.success && productsResult.success) {
                this.updateKPICards(todayResult.data, salesResult.data, productsResult.data);
            }
        } catch (error) {
            console.error('Error loading KPI data:', error);
            // Fallback to mock data
            this.updateKPICards(
                { today_sales: 0, transaction_count: 0 },
                [],
                []
            );
        }
    }

    updateKPICards(todayData, salesData, productsData) {
        // Calculate metrics from real data
        const totalSales = salesData.reduce((sum, sale) => sum + sale.TotalAmount, 0);
        const totalTransactions = salesData.length;
        const averageOrder = totalTransactions > 0 ? totalSales / totalTransactions : 0;
        
        // Find top category (you would need to implement this logic)
        const topCategory = this.findTopCategory(salesData);
        
        // Update DOM elements
        document.getElementById('totalSales').textContent = window.posApp.formatCurrency(totalSales);
        document.getElementById('salesGrowth').textContent = '12.5%'; // You would calculate this
        document.getElementById('totalTransactions').textContent = totalTransactions;
        document.getElementById('transactionGrowth').textContent = '8.2%'; // You would calculate this
        document.getElementById('averageOrder').textContent = window.posApp.formatCurrency(averageOrder);
        document.getElementById('aovChange').textContent = '3.1%'; // You would calculate this
        document.getElementById('topCategory').textContent = topCategory || 'N/A';
    }

    findTopCategory(salesData) {
        // This is a simplified example - you'd need to implement proper category analysis
        // For now, return a placeholder
        return 'Electronics';
    }

    async generateSalesChart() {
        try {
            // Get sales data for the chart period
            const period = document.getElementById('chartPeriod')?.value || '7';
            const endDate = new Date();
            const startDate = new Date();
            
            switch (period) {
                case '7':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '30':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                case '90':
                    startDate.setDate(endDate.getDate() - 90);
                    break;
            }
            
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];
            
            const response = await fetch(`php/sales/sales.php?start_date=${startDateStr}&end_date=${endDateStr}`);
            const result = await response.json();
            
            if (result.success) {
                this.createSalesChart(result.data, period);
            } else {
                // Fallback to mock data
                this.createSalesChart([], period);
            }
        } catch (error) {
            console.error('Error generating sales chart:', error);
            this.createSalesChart([], '7');
        }
    }

    createSalesChart(salesData, period) {
        const ctx = document.getElementById('salesTrendChart');
        if (!ctx) return;
        
        if (this.salesChart) {
            this.salesChart.destroy();
        }

        // Process sales data for chart
        const chartData = this.processSalesDataForChart(salesData, period);
        
        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Sales ($)',
                    data: chartData.data,
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    processSalesDataForChart(salesData, period) {
        // This is a simplified processing - you'd implement proper data aggregation
        if (salesData.length === 0) {
            // Return mock data if no real data
            return {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                data: [12000, 19000, 15000, 18000, 22000, 19500, 16000]
            };
        }
        
        // Group sales by date and sum amounts
        const salesByDate = {};
        salesData.forEach(sale => {
            const date = new Date(sale.Sale_Date).toLocaleDateString();
            if (!salesByDate[date]) {
                salesByDate[date] = 0;
            }
            salesByDate[date] += sale.TotalAmount;
        });
        
        const labels = Object.keys(salesByDate);
        const data = Object.values(salesByDate);
        
        return { labels, data };
    }

    async generateProductsChart() {
        try {
            const response = await fetch('php/products/products.php');
            const result = await response.json();
            
            if (result.success) {
                this.createProductsChart(result.data);
            } else {
                this.createProductsChart([]);
            }
        } catch (error) {
            console.error('Error generating products chart:', error);
            this.createProductsChart([]);
        }
    }

    createProductsChart(productsData) {
        const ctx = document.getElementById('topProductsChart');
        if (!ctx) return;
        
        if (this.productsChart) {
            this.productsChart.destroy();
        }

        // Process products data for chart
        const chartData = this.processProductsDataForChart(productsData);
        
        this.productsChart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    processProductsDataForChart(productsData) {
        if (productsData.length === 0) {
            // Mock data
            return {
                labels: ['Wireless Earbuds', 'Smartphone', 'Energy Drink', 'Chips', 'Phone Case'],
                datasets: [{
                    data: [35, 25, 15, 12, 8],
                    backgroundColor: [
                        '#4361ee',
                        '#4cc9f0',
                        '#f72585',
                        '#7209b7',
                        '#3a0ca3'
                    ],
                    borderWidth: 0
                }]
            };
        }
        
        // Sort products by stock quantity (or any other metric)
        const sortedProducts = productsData
            .sort((a, b) => b.Stock_Quantity - a.Stock_Quantity)
            .slice(0, 5); // Top 5
        
        const labels = sortedProducts.map(p => p.Product_Name);
        const data = sortedProducts.map(p => p.Stock_Quantity);
        const backgroundColors = [
            '#4361ee',
            '#4cc9f0',
            '#f72585',
            '#7209b7',
            '#3a0ca3'
        ];
        
        return {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderWidth: 0
            }]
        };
    }

    async loadReportTable(reportType) {
        try {
            let headers = [];
            let data = [];

            switch (reportType) {
                case 'sales':
                    headers = ['Date', 'Transaction ID', 'Customer', 'Amount', 'Payment Method'];
                    const salesResponse = await fetch('php/sales/sales.php');
                    const salesResult = await salesResponse.json();
                    
                    if (salesResult.success) {
                        data = salesResult.data.map(sale => [
                            new Date(sale.Sale_Date).toLocaleDateString(),
                            `#${sale.Sale_ID}`,
                            sale.customer_name || 'Walk-in Customer',
                            window.posApp.formatCurrency(sale.TotalAmount),
                            sale.Payment_Method
                        ]).slice(0, 10); // Last 10 transactions
                    }
                    break;
                    
                case 'inventory':
                    headers = ['Product', 'Category', 'Current Stock', 'Price', 'Status'];
                    const productsResponse = await fetch('php/products/products.php');
                    const productsResult = await productsResponse.json();
                    
                    if (productsResult.success) {
                        data = productsResult.data.map(product => [
                            product.Product_Name,
                            product.Category_Name || 'Uncategorized',
                            product.Stock_Quantity,
                            window.posApp.formatCurrency(product.Price),
                            product.Status
                        ]);
                    }
                    break;
                    
                case 'customer':
                    headers = ['Customer', 'Contact', 'Email', 'Total Orders'];
                    const customersResponse = await fetch('php/customers/customers.php');
                    const customersResult = await customersResponse.json();
                    
                    if (customersResult.success) {
                        data = customersResult.data.map(customer => [
                            customer.Name,
                            customer.Contact_Number,
                            customer.Email,
                            customer.total_orders || 0
                        ]);
                    }
                    break;
                    
                case 'employee':
                    headers = ['Employee', 'Role', 'Status'];
                    const employeesResponse = await fetch('php/employees/employees.php');
                    const employeesResult = await employeesResponse.json();
                    
                    if (employeesResult.success) {
                        data = employeesResult.data.map(employee => [
                            employee.Full_Name,
                            employee.Role,
                            employee.Status
                        ]);
                    }
                    break;
            }

            this.renderReportTable(headers, data);
        } catch (error) {
            console.error('Error loading report table:', error);
            window.posApp.showNotification('Error loading report data', 'error');
        }
    }

    renderReportTable(headers, data) {
        const reportHeaders = document.getElementById('reportHeaders');
        const reportTable = document.getElementById('reportTable');

        if (!reportHeaders || !reportTable) return;

        // Update headers
        reportHeaders.innerHTML = '';
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            reportHeaders.appendChild(th);
        });

        // Update table data
        reportTable.innerHTML = '';
        
        if (data.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = headers.length;
            td.textContent = 'No data available';
            td.style.textAlign = 'center';
            td.style.padding = '20px';
            td.style.color = 'var(--gray)';
            tr.appendChild(td);
            reportTable.appendChild(tr);
            return;
        }

        data.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            reportTable.appendChild(tr);
        });
    }

    setupEventListeners() {
        // Generate report button
        const generateBtn = document.getElementById('generateReport');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateReport();
            });
        }

        // Report type change
        const reportType = document.getElementById('reportType');
        if (reportType) {
            reportType.addEventListener('change', () => {
                this.loadReportTable(reportType.value);
            });
        }

        // Chart period change
        const chartPeriod = document.getElementById('chartPeriod');
        if (chartPeriod) {
            chartPeriod.addEventListener('change', () => {
                this.generateSalesChart();
            });
        }

        // Export buttons
        const exportPdfBtn = document.getElementById('exportReport');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => {
                this.exportPDF();
            });
        }

        const exportCsvBtn = document.getElementById('exportDataBtn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                this.exportCSV();
            });
        }

        // Date range changes
        const startDate = document.getElementById('reportStartDate');
        const endDate = document.getElementById('reportEndDate');
        
        if (startDate && endDate) {
            // Set default dates (last 30 days)
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 30);
            
            startDate.value = start.toISOString().split('T')[0];
            endDate.value = end.toISOString().split('T')[0];
            
            startDate.addEventListener('change', () => this.generateSalesChart());
            endDate.addEventListener('change', () => this.generateSalesChart());
        }
    }

    async generateReport() {
        const reportType = document.getElementById('reportType').value;
        await this.loadReportTable(reportType);
        window.posApp.showNotification(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully`, 'success');
    }

    exportPDF() {
        // Simple PDF export simulation
        // In a real app, you would use a library like jsPDF or html2pdf
        window.posApp.showNotification('PDF export would be implemented with a library like jsPDF', 'info');
        
        // Example of what you might do:
        // const { jsPDF } = window.jspdf;
        // const doc = new jsPDF();
        // doc.text('Sales Report', 20, 20);
        // doc.save('sales-report.pdf');
    }

    exportCSV() {
        const reportType = document.getElementById('reportType').value;
        const headers = Array.from(document.querySelectorAll('#reportHeaders th')).map(th => th.textContent);
        const rows = Array.from(document.querySelectorAll('#reportTable tr')).map(tr => 
            Array.from(tr.querySelectorAll('td')).map(td => td.textContent)
        );

        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        window.posApp.showNotification('CSV exported successfully', 'success');
    }
}

// Initialize reports manager
document.addEventListener('DOMContentLoaded', function() {
    window.reportsManager = new ReportsManager();
});