class TransactionsManager {
    constructor() {
        this.transactions = [];
        this.init();
    }

    async init() {
        await this.loadTransactions();
        this.setupEventListeners();
    }

    async loadTransactions(filters = {}) {
        try {
            // Build URL with filters
            let url = 'php/sales/sales.php';
            const params = new URLSearchParams();
            
            if (filters.start_date) params.append('start_date', filters.start_date);
            if (filters.end_date) params.append('end_date', filters.end_date);
            if (filters.Payment_Method) params.append('Payment_Method', filters.Payment_Method);
            if (filters.Status) params.append('Status', filters.Status);
            
            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success) {
                this.transactions = result.data;
                this.renderTransactions();
            } else {
                window.posApp.showNotification('Error loading transactions: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            window.posApp.showNotification('Error loading transactions', 'error');
        }
    }

    renderTransactions() {
        const tbody = document.getElementById('transactionsTable');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.transactions.forEach(transaction => {
            const row = document.createElement('tr');
            const saleDate = new Date(transaction.Sale_Date);
            const dateString = saleDate.toLocaleDateString();
            const timeString = saleDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
            
            row.innerHTML = `
                <td>#${transaction.Sale_ID}</td>
                <td>${dateString} ${timeString}</td>
                <td>${transaction.customer_name || 'Walk-in Customer'}</td>
                <td>${transaction.cashier_name || 'Unknown'}</td>
                <td>${window.posApp.formatCurrency(transaction.TotalAmount)}</td>
                <td>${transaction.Payment_Method}</td>
                <td><span class="status ${transaction.Status === 1 ? 'completed' : 'refunded'}">${transaction.Status === 1 ? 'Completed' : 'Refunded'}</span></td>
                <td>
                    <button class="btn" onclick="transactionsManager.viewTransactionDetails(${transaction.Sale_ID})" style="padding: 5px 10px;">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${transaction.Status === 1 ? `
                    <button class="btn" onclick="transactionsManager.refundTransaction(${transaction.Sale_ID})" style="padding: 5px 10px; background: #ffc107; color: white; margin-left: 5px;">
                        <i class="fas fa-undo"></i>
                    </button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async viewTransactionDetails(saleId) {
        try {
            const response = await fetch(`php/sales/sales.php?Sale_ID=${saleId}`);
            const result = await response.json();
            
            if (result.success) {
                this.showTransactionModal(result.data[0]);
            } else {
                window.posApp.showNotification('Error loading transaction details: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error loading transaction details:', error);
            window.posApp.showNotification('Error loading transaction details', 'error');
        }
    }

    async refundTransaction(saleId) {
        if (!confirm('Are you sure you want to refund this transaction?')) {
            return;
        }

        try {
            const formData = new FormData();
            formData.append('Sale_ID', saleId);
            formData.append('Status', 0); // 0 means refunded

            const response = await fetch('php/sales/sales.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Transaction refunded successfully', 'success');
                await this.loadTransactions();
            } else {
                window.posApp.showNotification('Error refunding transaction: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error refunding transaction:', error);
            window.posApp.showNotification('Error refunding transaction', 'error');
        }
    }

    setupEventListeners() {
        // Apply filters
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }

        // Reset filters
        const resetFiltersBtn = document.getElementById('resetFilters');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    }

    applyFilters() {
        const filters = {
            start_date: document.getElementById('startDate')?.value,
            end_date: document.getElementById('endDate')?.value,
            Payment_Method: document.getElementById('paymentFilter')?.value,
            Status: document.getElementById('statusFilter')?.value
        };

        this.loadTransactions(filters);
    }

    resetFilters() {
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('paymentFilter').value = '';
        document.getElementById('statusFilter').value = '';
        
        this.loadTransactions();
    }

    showTransactionModal(transaction) {
        const modal = document.getElementById('transactionModal');
        const details = document.getElementById('transactionDetails');
        
        if (!modal || !details) return;

        const saleDate = new Date(transaction.Sale_Date);
        const dateString = saleDate.toLocaleDateString();
        const timeString = saleDate.toLocaleTimeString();

        let itemsHtml = '';
        transaction.items.forEach(item => {
            itemsHtml += `
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                    <div>
                        <strong>${item.Product_Name}</strong><br>
                        <small>${item.Quantity} x ${window.posApp.formatCurrency(item.Price)}</small>
                    </div>
                    <div>${window.posApp.formatCurrency(item.SubTotal)}</div>
                </div>
            `;
        });

        details.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h4>Transaction #${transaction.Sale_ID}</h4>
                <p><strong>Date:</strong> ${dateString} ${timeString}</p>
                <p><strong>Customer:</strong> ${transaction.customer_name || 'Walk-in Customer'}</p>
                <p><strong>Cashier:</strong> ${transaction.cashier_name || 'Unknown'}</p>
                <p><strong>Payment Method:</strong> ${transaction.Payment_Method}</p>
                <p><strong>Status:</strong> <span class="status ${transaction.Status === 1 ? 'completed' : 'refunded'}">${transaction.Status === 1 ? 'Completed' : 'Refunded'}</span></p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4>Items</h4>
                ${itemsHtml}
            </div>
            
            <div style="border-top: 2px solid #eee; padding-top: 10px;">
                <div style="display: flex; justify-content: space-between; font-weight: bold;">
                    <span>Total:</span>
                    <span>${window.posApp.formatCurrency(transaction.TotalAmount)}</span>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    }
}

// Global functions for modal
function closeTransactionModal() {
    const modal = document.getElementById('transactionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Initialize transactions manager
document.addEventListener('DOMContentLoaded', function() {
    window.transactionsManager = new TransactionsManager();
});