class CustomersManager {
    constructor() {
        this.customers = [];
        this.init();
    }

    async init() {
        await this.loadCustomers();
        this.setupEventListeners();
    }

    async loadCustomers(search = '') {
        try {
            const formData = new FormData();
            formData.append('action', 'read');
            if (search) formData.append('search', search);

            const response = await fetch('php/customers/customers.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                this.customers = result.data;
                this.renderCustomers();
                this.updateCustomerCount();
            } else {
                window.posApp.showNotification('Error loading customers: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            window.posApp.showNotification('Error loading customers', 'error');
        }
    }

    renderCustomers() {
        const tbody = document.getElementById('customersTable');
        tbody.innerHTML = '';

        this.customers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.Customer_ID}</td>
                <td>${customer.Name}</td>
                <td>${customer.Contact_Number}</td>
                <td>${customer.Email}</td>
                <td>${customer.Address || '-'}</td>
                <td>${customer.total_orders || 0}</td>
                <td>
                    <button class="btn" onclick="customersManager.editCustomer(${customer.Customer_ID})" style="padding: 5px 10px; margin-right: 5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn" onclick="customersManager.deleteCustomer(${customer.Customer_ID})" style="padding: 5px 10px; background: #dc3545; color: white;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateCustomerCount() {
        const countElement = document.getElementById('customerCount');
        if (countElement) {
            countElement.textContent = `${this.customers.length} customers`;
        }
    }

    async createCustomer(customerData) {
        try {
            const formData = new FormData();
            formData.append('action', 'create');
            formData.append('Name', customerData.Name);
            formData.append('Contact_Number', customerData.Contact_Number);
            formData.append('Email', customerData.Email);
            formData.append('Address', customerData.Address);

            const response = await fetch('php/customers/customers.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Customer created successfully', 'success');
                await this.loadCustomers();
                this.closeModal();
            } else {
                window.posApp.showNotification('Error creating customer: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error creating customer:', error);
            window.posApp.showNotification('Error creating customer', 'error');
        }
    }

    async updateCustomer(customerId, customerData) {
        try {
            const formData = new FormData();
            formData.append('action', 'update');
            formData.append('Customer_ID', customerId);
            formData.append('Name', customerData.Name);
            formData.append('Contact_Number', customerData.Contact_Number);
            formData.append('Email', customerData.Email);
            formData.append('Address', customerData.Address);

            const response = await fetch('php/customers/customers.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Customer updated successfully', 'success');
                await this.loadCustomers();
                this.closeModal();
            } else {
                window.posApp.showNotification('Error updating customer: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error updating customer:', error);
            window.posApp.showNotification('Error updating customer', 'error');
        }
    }

    async deleteCustomer(customerId) {
        if (!confirm('Are you sure you want to delete this customer?')) {
            return;
        }

        try {
            const formData = new FormData();
            formData.append('action', 'delete');
            formData.append('Customer_ID', customerId);

            const response = await fetch('php/customers/customers.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Customer deleted successfully', 'success');
                await this.loadCustomers();
            } else {
                window.posApp.showNotification('Error deleting customer: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
            window.posApp.showNotification('Error deleting customer', 'error');
        }
    }

    async editCustomer(customerId) {
        try {
            const formData = new FormData();
            formData.append('action', 'read');
            formData.append('Customer_ID', customerId);

            const response = await fetch('php/customers/customers.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                this.openModal('edit', result.data);
            } else {
                window.posApp.showNotification('Error loading customer: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error loading customer:', error);
            window.posApp.showNotification('Error loading customer', 'error');
        }
    }

    openModal(mode = 'create', customer = null) {
        const modal = document.getElementById('customerModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('customerForm');
        const customerId = document.getElementById('customerId');
        const customerName = document.getElementById('customerName');
        const customerContact = document.getElementById('customerContact');
        const customerEmail = document.getElementById('customerEmail');
        const customerAddress = document.getElementById('customerAddress');

        if (mode === 'create') {
            title.textContent = 'Add New Customer';
            form.reset();
            customerId.value = '';
        } else {
            title.textContent = 'Edit Customer';
            customerId.value = customer.Customer_ID;
            customerName.value = customer.Name;
            customerContact.value = customer.Contact_Number;
            customerEmail.value = customer.Email;
            customerAddress.value = customer.Address;
        }

        modal.style.display = 'flex';
    }

    closeModal() {
        const modal = document.getElementById('customerModal');
        modal.style.display = 'none';
    }

    setupEventListeners() {
        // Add customer button
        document.getElementById('addCustomerBtn').addEventListener('click', () => {
            this.openModal('create');
        });

        // Customer form submission
        document.getElementById('customerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Search customers
        document.getElementById('searchCustomers').addEventListener('input', (e) => {
            this.loadCustomers(e.target.value);
        });
    }

    handleFormSubmit() {
        const customerId = document.getElementById('customerId').value;
        const customerName = document.getElementById('customerName').value.trim();
        const customerContact = document.getElementById('customerContact').value.trim();
        const customerEmail = document.getElementById('customerEmail').value.trim();
        const customerAddress = document.getElementById('customerAddress').value.trim();

        if (!customerName) {
            window.posApp.showNotification('Customer name is required', 'error');
            return;
        }

        const customerData = {
            Name: customerName,
            Contact_Number: customerContact,
            Email: customerEmail,
            Address: customerAddress
        };

        if (customerId) {
            // Update existing customer
            this.updateCustomer(customerId, customerData);
        } else {
            // Create new customer
            this.createCustomer(customerData);
        }
    }
}

// Global functions for modal
function closeCustomerModal() {
    window.customersManager.closeModal();
}

// Initialize customers manager
document.addEventListener('DOMContentLoaded', function() {
    window.customersManager = new CustomersManager();
});