class Dashboard {
    constructor() {
        this.salesChart = null;
        this.categoryChart = null;
        this.init();
    }

    async init() {
        await this.loadDashboardData();
        this.setupEventListeners();
    }

    async loadDashboardData() {
        try {
            // Load KPI data
            const todaySummary = await this.getTodaySummary();
            const lowStockProducts = await this.getLowStockProducts();
            
            // Load chart data
            const salesData = await this.getSalesChartData();
            const categoryData = await this.getSalesByCategory();
            
            // Load recent transactions
            const recentTransactions = await this.getRecentTransactions();

            this.updateKPICards(todaySummary, lowStockProducts);
            this.updateCharts(salesData, categoryData);
            this.updateTables(recentTransactions, lowStockProducts);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async getTodaySummary() {
        try {
            const formData = new FormData();
            formData.append('action', 'read');
            formData.append('today_summary', 'true');

            const response = await fetch('php/sales.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            return result.success ? result.data : { today_sales: 0, transaction_count: 0 };
        } catch (error) {
            console.error('Error loading today summary:', error);
            return { today_sales: 0, transaction_count: 0 };
        }
    }

    async getLowStockProducts() {
        try {
            const formData = new FormData();
            formData.append('action', 'read');
            formData.append('low_stock', 'true');

            const response = await fetch('php/products.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error loading low stock products:', error);
            return [];
        }
    }

    async getSalesChartData(period = '7') {
        try {
            // For demo purposes, generating mock data
            // In real app, you would fetch from php/sales.php with chart_data parameter
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            return days.map(() => Math.floor(Math.random() * 2000) + 500);
        } catch (error) {
            console.error('Error loading sales chart data:', error);
            return [1250, 1900, 1700, 2100, 2500, 2200, 1800];
        }
    }

    async getSalesByCategory(period = '30') {
        try {
            // For demo purposes, generating mock data
            return [35, 25, 20, 15, 5];
        } catch (error) {
            console.error('Error loading category data:', error);
            return [35, 25, 20, 15, 5];
        }
    }

    async getRecentTransactions() {
        try {
            const formData = new FormData();
            formData.append('action', 'read');

            const response = await fetch('php/sales.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                return result.data.slice(0, 5); // Get last 5 transactions
            }
            return [];
        } catch (error) {
            console.error('Error loading recent transactions:', error);
            return [];
        }
    }

    updateKPICards(todaySummary, lowStockProducts) {
        const todaySales = document.getElementById('todaySales');
        const salesTrend = document.getElementById('salesTrend');
        const todayTransactions = document.getElementById('todayTransactions');
        const transactionsTrend = document.getElementById('transactionsTrend');
        const newCustomers = document.getElementById('newCustomers');
        const customersTrend = document.getElementById('customersTrend');
        const lowStockItems = document.getElementById('lowStockItems');

        if (todaySales) todaySales.textContent = window.posApp.formatCurrency(todaySummary.today_sales);
        if (salesTrend) salesTrend.textContent = '12.5%';
        if (todayTransactions) todayTransactions.textContent = todaySummary.transaction_count;
        if (transactionsTrend) transactionsTrend.textContent = '8.2%';
        if (newCustomers) newCustomers.textContent = '0'; // You can add customer counting later
        if (customersTrend) customersTrend.textContent = '3.1%';
        if (lowStockItems) lowStockItems.textContent = lowStockProducts.length;
    }

    updateCharts(salesData, categoryData) {
        this.createSalesChart(salesData);
        this.createCategoryChart(categoryData);
    }

    createSalesChart(salesData) {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;
        
        if (this.salesChart) {
            this.salesChart.destroy();
        }

        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Sales ($)',
                    data: salesData,
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

    createCategoryChart(categoryData) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;
        
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Electronics', 'Beverages', 'Snacks', 'Accessories', 'Others'],
                datasets: [{
                    data: categoryData,
                    backgroundColor: [
                        '#4361ee',
                        '#4cc9f0',
                        '#f72585',
                        '#7209b7',
                        '#3a0ca3'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateTables(recentTransactions, lowStockProducts) {
        this.updateRecentTransactions(recentTransactions);
        this.updateLowStockProducts(lowStockProducts);
    }

    updateRecentTransactions(transactions) {
        const tbody = document.querySelector('#recentTransactions tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: var(--gray);">
                        No recent transactions
                    </td>
                </tr>
            `;
            return;
        }

        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            const saleDate = new Date(transaction.Sale_Date);
            const timeString = saleDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
            
            row.innerHTML = `
                <td>#${transaction.Sale_ID}</td>
                <td>${timeString}</td>
                <td>${window.posApp.formatCurrency(transaction.TotalAmount)}</td>
                <td>${transaction.Payment_Method}</td>
                <td><span class="status ${transaction.Status === 1 ? 'completed' : 'refunded'}">${transaction.Status === 1 ? 'Completed' : 'Refunded'}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    updateLowStockProducts(products) {
        const tbody = document.querySelector('#lowStockProducts tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 20px; color: var(--gray);">
                        No low stock items
                    </td>
                </tr>
            `;
            return;
        }

        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.Product_Name}</td>
                <td>${product.Category_Name || 'Uncategorized'}</td>
                <td class="low-stock">${product.Stock_Quantity}</td>
                <td><span class="status active">${product.Status}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    setupEventListeners() {
        const salesPeriod = document.getElementById('salesPeriod');
        if (salesPeriod) {
            salesPeriod.addEventListener('change', () => {
                this.loadDashboardData();
            });
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dashboard = new Dashboard();
});