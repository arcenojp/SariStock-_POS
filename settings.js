class SettingsManager {
    constructor() {
        this.currentTab = 'general';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadSettings();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.getAttribute('data-tab'));
            });
        });

        // Form submissions
        const storeForm = document.getElementById('storeSettingsForm');
        if (storeForm) {
            storeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveStoreSettings();
            });
        }

        const receiptForm = document.getElementById('receiptSettingsForm');
        if (receiptForm) {
            receiptForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveReceiptSettings();
            });
        }

        const taxForm = document.getElementById('taxSettingsForm');
        if (taxForm) {
            taxForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTaxSettings();
            });
        }

        // Backup buttons
        const backupBtn = document.getElementById('backupBtn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                this.createBackup();
            });
        }

        const restoreBtn = document.getElementById('restoreBtn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => {
                this.restoreBackup();
            });
        }

        // System information refresh
        this.loadSystemInfo();
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;
    }

    async loadSettings() {
        try {
            // Try to load settings from server first
            const response = await fetch('php/settings/Read.php');
            const result = await response.json();
            
            if (result.success) {
                this.populateSettings(result.data);
            } else {
                // Fallback to localStorage
                this.loadSettingsFromLocalStorage();
            }
        } catch (error) {
            console.error('Error loading settings from server:', error);
            // Fallback to localStorage
            this.loadSettingsFromLocalStorage();
        }
    }

    loadSettingsFromLocalStorage() {
        const storeSettings = this.getStoreSettings();
        const receiptSettings = this.getReceiptSettings();
        const taxSettings = this.getTaxSettings();

        this.populateStoreSettings(storeSettings);
        this.populateReceiptSettings(receiptSettings);
        this.populateTaxSettings(taxSettings);
    }

    getStoreSettings() {
        return JSON.parse(localStorage.getItem('storeSettings')) || {
            storeName: 'My POS Store',
            storeAddress: '123 Main Street, City, State 12345',
            storePhone: '+1 (555) 123-4567',
            storeEmail: 'info@mystore.com',
            currency: 'USD'
        };
    }

    getReceiptSettings() {
        return JSON.parse(localStorage.getItem('receiptSettings')) || {
            receiptHeader: 'Thank you for shopping with us!',
            receiptFooter: 'Please come again!',
            showTax: true,
            showBarcode: true,
            receiptWidth: 42
        };
    }

    getTaxSettings() {
        return JSON.parse(localStorage.getItem('taxSettings')) || {
            taxRate: 10.0,
            taxInclusive: true,
            multipleTax: false
        };
    }

    populateSettings(serverSettings) {
        // If you have server-side settings, populate them here
        // For now, we'll use localStorage
        this.populateStoreSettings(this.getStoreSettings());
        this.populateReceiptSettings(this.getReceiptSettings());
        this.populateTaxSettings(this.getTaxSettings());
    }

    populateStoreSettings(settings) {
        if (document.getElementById('storeName')) document.getElementById('storeName').value = settings.storeName;
        if (document.getElementById('storeAddress')) document.getElementById('storeAddress').value = settings.storeAddress;
        if (document.getElementById('storePhone')) document.getElementById('storePhone').value = settings.storePhone;
        if (document.getElementById('storeEmail')) document.getElementById('storeEmail').value = settings.storeEmail;
        if (document.getElementById('currency')) document.getElementById('currency').value = settings.currency;
    }

    populateReceiptSettings(settings) {
        if (document.getElementById('receiptHeader')) document.getElementById('receiptHeader').value = settings.receiptHeader;
        if (document.getElementById('receiptFooter')) document.getElementById('receiptFooter').value = settings.receiptFooter;
        if (document.getElementById('showTax')) document.getElementById('showTax').checked = settings.showTax;
        if (document.getElementById('showBarcode')) document.getElementById('showBarcode').checked = settings.showBarcode;
        if (document.getElementById('receiptWidth')) document.getElementById('receiptWidth').value = settings.receiptWidth;
    }

    populateTaxSettings(settings) {
        if (document.getElementById('taxRate')) document.getElementById('taxRate').value = settings.taxRate;
        if (document.getElementById('taxInclusive')) document.getElementById('taxInclusive').checked = settings.taxInclusive;
        if (document.getElementById('multipleTax')) document.getElementById('multipleTax').checked = settings.multipleTax;
    }

    async saveStoreSettings() {
        const settings = {
            storeName: document.getElementById('storeName').value,
            storeAddress: document.getElementById('storeAddress').value,
            storePhone: document.getElementById('storePhone').value,
            storeEmail: document.getElementById('storeEmail').value,
            currency: document.getElementById('currency').value
        };

        try {
            // Try to save to server
            const formData = new FormData();
            formData.append('settings', JSON.stringify(settings));
            formData.append('type', 'store');
            
            const response = await fetch('php/settings/Update.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Store settings saved to server', 'success');
            } else {
                // Fallback to localStorage
                localStorage.setItem('storeSettings', JSON.stringify(settings));
                window.posApp.showNotification('Store settings saved locally', 'success');
            }
        } catch (error) {
            // Fallback to localStorage
            localStorage.setItem('storeSettings', JSON.stringify(settings));
            window.posApp.showNotification('Store settings saved locally', 'success');
        }
    }

    async saveReceiptSettings() {
        const settings = {
            receiptHeader: document.getElementById('receiptHeader').value,
            receiptFooter: document.getElementById('receiptFooter').value,
            showTax: document.getElementById('showTax').checked,
            showBarcode: document.getElementById('showBarcode').checked,
            receiptWidth: document.getElementById('receiptWidth').value
        };

        try {
            const formData = new FormData();
            formData.append('settings', JSON.stringify(settings));
            formData.append('type', 'receipt');
            
            const response = await fetch('php/settings/Update.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Receipt settings saved to server', 'success');
            } else {
                localStorage.setItem('receiptSettings', JSON.stringify(settings));
                window.posApp.showNotification('Receipt settings saved locally', 'success');
            }
        } catch (error) {
            localStorage.setItem('receiptSettings', JSON.stringify(settings));
            window.posApp.showNotification('Receipt settings saved locally', 'success');
        }
    }

    async saveTaxSettings() {
        const settings = {
            taxRate: parseFloat(document.getElementById('taxRate').value),
            taxInclusive: document.getElementById('taxInclusive').checked,
            multipleTax: document.getElementById('multipleTax').checked
        };

        try {
            const formData = new FormData();
            formData.append('settings', JSON.stringify(settings));
            formData.append('type', 'tax');
            
            const response = await fetch('php/settings/Update.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Tax settings saved to server', 'success');
            } else {
                localStorage.setItem('taxSettings', JSON.stringify(settings));
                window.posApp.showNotification('Tax settings saved locally', 'success');
            }
        } catch (error) {
            localStorage.setItem('taxSettings', JSON.stringify(settings));
            window.posApp.showNotification('Tax settings saved locally', 'success');
        }
    }

    async createBackup() {
        try {
            const response = await fetch('php/backup/Create.php', {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Database backup created successfully', 'success');
                this.loadSystemInfo(); // Refresh backup list
            } else {
                window.posApp.showNotification('Backup failed: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Backup error:', error);
            window.posApp.showNotification('Backup feature requires server setup', 'info');
        }
    }

    async restoreBackup() {
        if (confirm('Are you sure you want to restore from backup? This will overwrite current data.')) {
            try {
                const response = await fetch('php/backup/Restore.php', {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    window.posApp.showNotification('Database restored successfully', 'success');
                } else {
                    window.posApp.showNotification('Restore failed: ' + result.message, 'error');
                }
            } catch (error) {
                console.error('Restore error:', error);
                window.posApp.showNotification('Restore feature requires server setup', 'info');
            }
        }
    }

    async loadSystemInfo() {
        try {
            // Get database stats
            const [productsResponse, customersResponse, salesResponse] = await Promise.all([
                fetch('php/products/Read.php'),
                fetch('php/customers/Read.php'),
                fetch('php/sales/Read.php')
            ]);

            const [productsResult, customersResult, salesResult] = await Promise.all([
                productsResponse.json(),
                customersResponse.json(),
                salesResponse.json()
            ]);

            let infoHtml = `
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                    <span>POS System Version:</span>
                    <span>v2.1.0</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                    <span>Database Version:</span>
                    <span>MySQL 8.0</span>
                </div>
            `;

            if (productsResult.success) {
                infoHtml += `
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                        <span>Total Products:</span>
                        <span>${productsResult.data.length}</span>
                    </div>
                `;
            }

            if (customersResult.success) {
                infoHtml += `
                    <div style="display; flex; justify-content: space-between; padding: 5px 0;">
                        <span>Total Customers:</span>
                        <span>${customersResult.data.length}</span>
                    </div>
                `;
            }

            if (salesResult.success) {
                infoHtml += `
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                        <span>Total Sales:</span>
                        <span>${salesResult.data.length}</span>
                    </div>
                `;
            }

            infoHtml += `
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                    <span>Last Update:</span>
                    <span>${new Date().toLocaleDateString()}</span>
                </div>
            `;

            const systemInfoElement = document.querySelector('#backup-tab .card:last-child .card');
            if (systemInfoElement) {
                systemInfoElement.innerHTML = infoHtml;
            }

        } catch (error) {
            console.error('Error loading system info:', error);
        }
    }
}

// Initialize settings manager
document.addEventListener('DOMContentLoaded', function() {
    window.settingsManager = new SettingsManager();
});