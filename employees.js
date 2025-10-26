class EmployeesManager {
    constructor() {
        this.employees = [];
        this.init();
    }

    async init() {
        await this.loadEmployees();
        this.setupEventListeners();
    }

    async loadEmployees(filters = {}) {
        try {
            const formData = new FormData();
            formData.append('action', 'read');

            if (filters.Role) formData.append('Role', filters.Role);
            if (filters.Status) formData.append('Status', filters.Status);
            if (filters.search) formData.append('search', filters.search);

            const response = await fetch('php/employees/employees.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                this.employees = result.data;
                this.renderEmployees();
                this.updateEmployeeCount();
            } else {
                window.posApp.showNotification('Error loading employees: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            window.posApp.showNotification('Error loading employees', 'error');
        }
    }

    renderEmployees() {
        const tbody = document.getElementById('employeesTable');
        tbody.innerHTML = '';

        this.employees.forEach(employee => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.Employee_ID}</td>
                <td>${employee.username}</td>
                <td>${employee.Full_Name}</td>
                <td>${employee.Role}</td>
                <td><span class="status ${employee.Status.toLowerCase()}">${employee.Status}</span></td>
                <td>${employee.created_at ? new Date(employee.created_at).toLocaleDateString() : '-'}</td>
                <td>
                    <button class="btn" onclick="employeesManager.editEmployee(${employee.Employee_ID})" style="padding: 5px 10px; margin-right: 5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn" onclick="employeesManager.deleteEmployee(${employee.Employee_ID})" style="padding: 5px 10px; background: #dc3545; color: white;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateEmployeeCount() {
        const countElement = document.getElementById('employeeCount');
        if (countElement) {
            countElement.textContent = `${this.employees.length} employees`;
        }
    }

    async createEmployee(employeeData) {
        try {
            const formData = new FormData();
            formData.append('action', 'create');
            formData.append('username', employeeData.username);
            formData.append('password', employeeData.password);
            formData.append('Full_Name', employeeData.Full_Name);
            formData.append('Role', employeeData.Role);
            formData.append('Status', employeeData.Status);

            const response = await fetch('php/employees/employees.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Employee created successfully', 'success');
                await this.loadEmployees();
                this.closeModal();
            } else {
                window.posApp.showNotification('Error creating employee: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error creating employee:', error);
            window.posApp.showNotification('Error creating employee', 'error');
        }
    }

    async updateEmployee(employeeId, employeeData) {
        try {
            const formData = new FormData();
            formData.append('action', 'update');
            formData.append('Employee_ID', employeeId);
            formData.append('username', employeeData.username);
            formData.append('Full_Name', employeeData.Full_Name);
            formData.append('Role', employeeData.Role);
            formData.append('Status', employeeData.Status);

            if (employeeData.password) {
                formData.append('password', employeeData.password);
            }

            const response = await fetch('php/employees/employees.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Employee updated successfully', 'success');
                await this.loadEmployees();
                this.closeModal();
            } else {
                window.posApp.showNotification('Error updating employee: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error updating employee:', error);
            window.posApp.showNotification('Error updating employee', 'error');
        }
    }

    async deleteEmployee(employeeId) {
        // Prevent users from deleting their own account
        const currentUser = window.posApp.getCurrentUser();
        if (currentUser && currentUser.Employee_ID == employeeId) {
            window.posApp.showNotification('You cannot delete your own account', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this employee?')) {
            return;
        }

        try {
            const formData = new FormData();
            formData.append('action', 'delete');
            formData.append('Employee_ID', employeeId);

            const response = await fetch('php/employees/employees.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Employee deleted successfully', 'success');
                await this.loadEmployees();
            } else {
                window.posApp.showNotification('Error deleting employee: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
            window.posApp.showNotification('Error deleting employee', 'error');
        }
    }

    async editEmployee(employeeId) {
        try {
            const formData = new FormData();
            formData.append('action', 'read');
            formData.append('Employee_ID', employeeId);

            const response = await fetch('php/employees/employees.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                this.openModal('edit', result.data);
            } else {
                window.posApp.showNotification('Error loading employee: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error loading employee:', error);
            window.posApp.showNotification('Error loading employee', 'error');
        }
    }

    openModal(mode = 'create', employee = null) {
        const modal = document.getElementById('employeeModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('employeeForm');
        const employeeId = document.getElementById('employeeId');
        const employeeUsername = document.getElementById('employeeUsername');
        const employeePassword = document.getElementById('employeePassword');
        const passwordLabel = document.getElementById('passwordLabel');
        const employeeFullName = document.getElementById('employeeFullName');
        const employeeRole = document.getElementById('employeeRole');
        const employeeStatus = document.getElementById('employeeStatus');

        const currentUser = window.posApp.getCurrentUser();
        
        // Security: Remove Admin option for non-admin users
        if (currentUser && currentUser.Role !== 'Admin') {
            const adminOption = employeeRole.querySelector('option[value="Admin"]');
            if (adminOption) {
                adminOption.remove();
            }
        }

        if (mode === 'create') {
            title.textContent = 'Add New Employee';
            form.reset();
            employeeId.value = '';
            passwordLabel.textContent = 'Password *';
            employeePassword.required = true;
            employeeStatus.value = 'Active';
        } else {
            title.textContent = 'Edit Employee';
            employeeId.value = employee.Employee_ID;
            employeeUsername.value = employee.username;
            employeeFullName.value = employee.Full_Name;
            employeeRole.value = employee.Role;
            employeeStatus.value = employee.Status;
            passwordLabel.textContent = 'Password (leave blank to keep current)';
            employeePassword.required = false;
            employeePassword.value = '';

            // Security: Prevent non-admins from editing admin accounts
            if (currentUser && currentUser.Role !== 'Admin' && employee.Role === 'Admin') {
                employeeRole.disabled = true;
                window.posApp.showNotification('You cannot modify admin accounts', 'info');
            } else {
                employeeRole.disabled = false;
            }
        }

        modal.style.display = 'flex';
    }

    closeModal() {
        const modal = document.getElementById('employeeModal');
        modal.style.display = 'none';
        
        // Re-enable role dropdown when closing modal
        const employeeRole = document.getElementById('employeeRole');
        if (employeeRole) {
            employeeRole.disabled = false;
        }
    }

    setupEventListeners() {
        // Add employee button
        document.getElementById('addEmployeeBtn').addEventListener('click', () => {
            this.openModal('create');
        });

        // Employee form submission
        document.getElementById('employeeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Filters
        document.getElementById('roleFilter').addEventListener('change', (e) => {
            this.applyFilters();
        });

        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.applyFilters();
        });

        document.getElementById('searchEmployees').addEventListener('input', (e) => {
            this.applyFilters();
        });
    }

    handleFormSubmit() {
        const currentUser = window.posApp.getCurrentUser();
        
        // Get all form values FIRST
        const employeeId = document.getElementById('employeeId').value;
        const username = document.getElementById('employeeUsername').value.trim();
        const password = document.getElementById('employeePassword').value;
        const fullName = document.getElementById('employeeFullName').value.trim();
        const role = document.getElementById('employeeRole').value;
        const status = document.getElementById('employeeStatus').value;

        // Role-based security check - NOW THIS WORKS CORRECTLY
        if (role === 'Admin' && currentUser.Role !== 'Admin') {
            window.posApp.showNotification('Only administrators can create admin accounts', 'error');
            return;
        }

        // Prevent users from demoting the last admin
        if (employeeId && role !== 'Admin') {
            const editingEmployee = this.employees.find(emp => emp.Employee_ID == employeeId);
            if (editingEmployee && editingEmployee.Role === 'Admin') {
                const adminCount = this.employees.filter(emp => 
                    emp.Role === 'Admin' && emp.Status === 'Active' && emp.Employee_ID != employeeId
                ).length;
                
                if (adminCount === 0) {
                    window.posApp.showNotification('Cannot demote the last active administrator', 'error');
                    return;
                }
            }
        }

        // Basic validation
        if (!username || !fullName || !role || !status) {
            window.posApp.showNotification('Please fill all required fields', 'error');
            return;
        }

        if (!employeeId && !password) {
            window.posApp.showNotification('Password is required for new employees', 'error');
            return;
        }

        if (password && password.length < 6) {
            window.posApp.showNotification('Password must be at least 6 characters long', 'error');
            return;
        }

        const employeeData = {
            username: username,
            Full_Name: fullName,
            Role: role,
            Status: status
        };

        if (password) {
            employeeData.password = password;
        }

        if (employeeId) {
            // Update existing employee
            this.updateEmployee(employeeId, employeeData);
        } else {
            // Create new employee
            this.createEmployee(employeeData);
        }
    }

    applyFilters() {
        const filters = {
            Role: document.getElementById('roleFilter').value,
            Status: document.getElementById('statusFilter').value,
            search: document.getElementById('searchEmployees').value
        };

        this.loadEmployees(filters);
    }
}

// Global functions for modal
function closeEmployeeModal() {
    window.employeesManager.closeModal();
}

// Initialize employees manager
document.addEventListener('DOMContentLoaded', function() {
    window.employeesManager = new EmployeesManager();
});