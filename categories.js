class CategoriesManager {
    constructor() {
        this.categories = [];
        this.init();
    }

    async init() {
        await this.loadCategories();
        this.setupEventListeners();
    }

    async loadCategories() {
        try {
            const response = await fetch('php/categories/categories.php');
            const result = await response.json();
            
            if (result.success) {
                this.categories = result.data;
                this.renderCategories();
                this.updateCategoryCount();
            } else {
                window.posApp.showNotification('Error loading categories: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            window.posApp.showNotification('Error loading categories', 'error');
        }
    }

    renderCategories() {
        const tbody = document.getElementById('categoriesTable');
        tbody.innerHTML = '';

        this.categories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.Category_ID}</td>
                <td>${category.Category_Name}</td>
                <td>${category.product_count || 0}</td>
                <td>
                    <button class="btn" onclick="categoriesManager.editCategory(${category.Category_ID})" style="padding: 5px 10px; margin-right: 5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn" onclick="categoriesManager.deleteCategory(${category.Category_ID})" style="padding: 5px 10px; background: #dc3545; color: white;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateCategoryCount() {
        const countElement = document.getElementById('categoryCount');
        if (countElement) {
            countElement.textContent = `${this.categories.length} categories`;
        }
    }

    async createCategory(categoryData) {
        try {
            const formData = new FormData();
            formData.append('Category_Name', categoryData.Category_Name);

            const response = await fetch('php/categories/categories.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Category created successfully', 'success');
                await this.loadCategories();
                this.closeModal();
            } else {
                window.posApp.showNotification('Error creating category: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error creating category:', error);
            window.posApp.showNotification('Error creating category', 'error');
        }
    }

    async updateCategory(categoryId, categoryData) {
        try {
            const formData = new FormData();
            formData.append('Category_ID', categoryId);
            formData.append('Category_Name', categoryData.Category_Name);

            const response = await fetch('php/categories/categories.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Category updated successfully', 'success');
                await this.loadCategories();
                this.closeModal();
            } else {
                window.posApp.showNotification('Error updating category: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error updating category:', error);
            window.posApp.showNotification('Error updating category', 'error');
        }
    }

    async deleteCategory(categoryId) {
        if (!confirm('Are you sure you want to delete this category?')) {
            return;
        }

        try {
            const formData = new FormData();
            formData.append('Category_ID', categoryId);

            const response = await fetch('php/categories/categories.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Category deleted successfully', 'success');
                await this.loadCategories();
            } else {
                window.posApp.showNotification('Error deleting category: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            window.posApp.showNotification('Error deleting category', 'error');
        }
    }

    async editCategory(categoryId) {
        // For separate CRUD, we need to get single category
        // We'll modify Read.php to accept an ID parameter
        try {
            const response = await fetch(`php/categories/categories.php?Category_ID=${categoryId}`);
            const result = await response.json();
            
            if (result.success && result.data.length > 0) {
                this.openModal('edit', result.data[0]);
            } else {
                window.posApp.showNotification('Error loading category', 'error');
            }
        } catch (error) {
            console.error('Error loading category:', error);
            window.posApp.showNotification('Error loading category', 'error');
        }
    }

    openModal(mode = 'create', category = null) {
        const modal = document.getElementById('categoryModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('categoryForm');
        const categoryId = document.getElementById('categoryId');
        const categoryName = document.getElementById('categoryName');

        if (mode === 'create') {
            title.textContent = 'Add New Category';
            form.reset();
            categoryId.value = '';
        } else {
            title.textContent = 'Edit Category';
            categoryId.value = category.Category_ID;
            categoryName.value = category.Category_Name;
        }

        modal.style.display = 'flex';
    }

    closeModal() {
        const modal = document.getElementById('categoryModal');
        modal.style.display = 'none';
    }

    setupEventListeners() {
        // Add category button
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.openModal('create');
        });

        // Category form submission
        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Search categories
        document.getElementById('searchCategories').addEventListener('input', (e) => {
            this.searchCategories(e.target.value);
        });
    }

    handleFormSubmit() {
        const categoryId = document.getElementById('categoryId').value;
        const categoryName = document.getElementById('categoryName').value.trim();

        if (!categoryName) {
            window.posApp.showNotification('Category name is required', 'error');
            return;
        }

        if (categoryId) {
            // Update existing category
            this.updateCategory(categoryId, { Category_Name: categoryName });
        } else {
            // Create new category
            this.createCategory({ Category_Name: categoryName });
        }
    }

    searchCategories(searchTerm) {
        const filteredCategories = this.categories.filter(category => 
            category.Category_Name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const tbody = document.getElementById('categoriesTable');
        tbody.innerHTML = '';

        filteredCategories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.Category_ID}</td>
                <td>${category.Category_Name}</td>
                <td>${category.product_count || 0}</td>
                <td>
                    <button class="btn" onclick="categoriesManager.editCategory(${category.Category_ID})" style="padding: 5px 10px; margin-right: 5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn" onclick="categoriesManager.deleteCategory(${category.Category_ID})" style="padding: 5px 10px; background: #dc3545; color: white;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Global functions for modal
function closeCategoryModal() {
    window.categoriesManager.closeModal();
}

// Initialize categories manager
document.addEventListener('DOMContentLoaded', function() {
    window.categoriesManager = new CategoriesManager();
});