/* auto transactions fetch */
fetch('php/backend/transactions_fetch.php').then(r=>r.json()).then(data=>{ try{ const tbody=document.querySelector('#transactionsTable tbody'); if(tbody){ tbody.innerHTML=''; data.forEach(row=>{ const tr=document.createElement('tr'); tr.innerHTML = `<td>#${row.Sale_ID}</td><td>${row.Sale_Date}</td><td>${row.Customer||'Walk-in'}</td><td>${row.Cashier||''}</td><td>${window.posApp.formatCurrency(row.TotalAmount)}</td><td>${row.Payment_Method}</td><td>${row.Status}</td>`; tbody.appendChild(tr); }); } }catch(e){console.error(e);} }).catch(e=>console.error(e));
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
            const formData = new FormData();
            formData.append('action', 'read');

            if (filters.start_date) formData.append('start_date', filters.start_date);
            if (filters.end_date) formData.append('end_date', filters.end_date);
            if (filters.Payment_Method) formData.append('Payment_Method', filters.Payment_Method);
            if (filters.Status) formData.append('Status', filters.Status);

            const response = await fetch('php/sales/sales.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                this.transactions = result.data;
                this.renderTransactions();
            } else {
                console.error('Error loading transactions:', result.message);
                this.showNotification('Error loading transactions', 'error');
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showNotification('Error loading transactions', 'error');
        }
    }

    renderTransactions() {
        const tbody = document.getElementById('transactionsTable');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!this.transactions || this.transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px; color: var(--gray);">
                        No transactions found
                    </td>
                </tr>
            `;
            return;
        }

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
                <td>${this.formatCurrency(transaction.TotalAmount)}</td>
                <td>${transaction.Payment_Method}</td>
                <td><span class="status ${transaction.Status.toLowerCase()}">${transaction.Status}</span></td>
                <td>
                    <button class="btn btn-sm" onclick="transactionsManager.viewTransactionDetails(${transaction.Sale_ID})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async viewTransactionDetails(saleId) {
        try {
            const formData = new FormData();
            formData.append('action', 'read');
            formData.append('Sale_ID', saleId);

            const response = await fetch('php/sales/sales.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                this.showTransactionModal(result.data);
            } else {
                this.showNotification('Error loading transaction details', 'error');
            }
        } catch (error) {
            console.error('Error loading transaction details:', error);
            this.showNotification('Error loading transaction details', 'error');
        }
    }

    showTransactionModal(transaction) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('transactionModal');
        if (!modal) {
            this.createTransactionModal();
            modal = document.getElementById('transactionModal');
        }

        const details = document.getElementById('transactionDetails');
        
        if (!modal || !details) return;

        const saleDate = new Date(transaction.Sale_Date);
        const dateString = saleDate.toLocaleDateString();
        const timeString = saleDate.toLocaleTimeString();

        // Create items HTML - you'll need to fetch items separately or ensure they're included
        let itemsHtml = '';
        if (transaction.items && transaction.items.length > 0) {
            transaction.items.forEach(item => {
                itemsHtml += `
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                        <div>
                            <strong>${item.Product_Name}</strong><br>
                            <small>${item.Quantity} x ${this.formatCurrency(item.Price)}</small>
                        </div>
                        <div>${this.formatCurrency(item.SubTotal)}</div>
                    </div>
                `;
            });
        } else {
            // Try to fetch items if not included
            this.fetchTransactionItems(transaction.Sale_ID).then(items => {
                items.forEach(item => {
                    itemsHtml += `
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                            <div>
                                <strong>${item.Product_Name}</strong><br>
                                <small>${item.Quantity} x ${this.formatCurrency(item.Price)}</small>
                            </div>
                            <div>${this.formatCurrency(item.SubTotal)}</div>
                        </div>
                    `;
                });
                details.querySelector('#transactionItems').innerHTML = itemsHtml;
            });
            itemsHtml = '<div id="transactionItems">Loading items...</div>';
        }

        details.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h4>Transaction #${transaction.Sale_ID}</h4>
                <p><strong>Date:</strong> ${dateString} ${timeString}</p>
                <p><strong>Customer:</strong> ${transaction.customer_name || 'Walk-in Customer'}</p>
                <p><strong>Cashier:</strong> ${transaction.cashier_name || 'Unknown'}</p>
                <p><strong>Payment Method:</strong> ${transaction.Payment_Method}</p>
                <p><strong>Status:</strong> <span class="status ${transaction.Status.toLowerCase()}">${transaction.Status}</span></p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4>Items</h4>
                ${itemsHtml}
            </div>
            
            <div style="border-top: 2px solid #eee; padding-top: 10px;">
                <div style="display: flex; justify-content: space-between; font-weight: bold;">
                    <span>Total:</span>
                    <span>${this.formatCurrency(transaction.TotalAmount)}</span>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    }

    async fetchTransactionItems(saleId) {
        try {
            const response = await fetch(`php/sales/sales_details.php?Sale_ID=${saleId}`);
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error fetching transaction items:', error);
            return [];
        }
    }

    createTransactionModal() {
        const modalHTML = `
            <div id="transactionModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Transaction Details</h3>
                        <button class="close-btn" onclick="transactionsManager.closeTransactionModal()">&times;</button>
                    </div>
                    <div id="transactionDetails"></div>
                    <div class="modal-footer">
                        <button class="btn" onclick="transactionsManager.closeTransactionModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeTransactionModal() {
        const modal = document.getElementById('transactionModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    setupEventListeners() {
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }

        const resetFiltersBtn = document.getElementById('resetFilters');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        const exportBtn = document.getElementById('exportTransactionsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportTransactions();
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
        if (document.getElementById('startDate')) document.getElementById('startDate').value = '';
        if (document.getElementById('endDate')) document.getElementById('endDate').value = '';
        if (document.getElementById('paymentFilter')) document.getElementById('paymentFilter').value = '';
        if (document.getElementById('statusFilter')) document.getElementById('statusFilter').value = '';
        
        this.loadTransactions();
    }

    formatCurrency(amount) {
        return '₱' + parseFloat(amount || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    showNotification(message, type = 'info') {
        // Simple notification implementation
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            border-radius: 4px;
            z-index: 10000;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }

    exportTransactions() {
        const headers = ['Transaction ID', 'Date', 'Customer', 'Cashier', 'Amount', 'Payment Method', 'Status'];
        let csvContent = headers.join(',') + '\n';
        
        this.transactions.forEach(transaction => {
            const saleDate = new Date(transaction.Sale_Date);
            const dateString = saleDate.toLocaleDateString();
            const row = [
                transaction.Sale_ID,
                dateString,
                transaction.customer_name || 'Walk-in Customer',
                transaction.cashier_name || 'Unknown',
                transaction.TotalAmount,
                transaction.Payment_Method,
                transaction.Status
            ];
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showNotification('Transactions exported successfully', 'success');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.transactionsManager = new TransactionsManager();
});
