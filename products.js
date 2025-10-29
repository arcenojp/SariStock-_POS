class ProductsManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.init();
    }

    async init() {
        await this.loadCategories();
        await this.loadProducts();
        this.setupEventListeners();
    }

    async loadCategories() {
        try {
            const formData = new FormData();
            formData.append('action', 'read');

            const response = await fetch('php/categories/categories.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                this.categories = result.data;
                this.populateCategoryFilters();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    populateCategoryFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const productCategory = document.getElementById('productCategory');

        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            this.categories.forEach(category => {
                categoryFilter.innerHTML += `<option value="${category.Category_ID}">${category.Category_Name}</option>`;
            });
        }

        if (productCategory) {
            productCategory.innerHTML = '<option value="">Select Category</option>';
            this.categories.forEach(category => {
                productCategory.innerHTML += `<option value="${category.Category_ID}">${category.Category_Name}</option>`;
            });
        }
    }

    async loadProducts(filters = {}) {
        try {
            const formData = new FormData();
            formData.append('action', 'read');

            if (filters.Category_ID) formData.append('Category_ID', filters.Category_ID);
            if (filters.Status) formData.append('Status', filters.Status);
            if (filters.search) formData.append('search', filters.search);

            const response = await fetch('php/products/products.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                this.products = result.data;
                this.renderProducts();
                this.updateProductCount();
            } else {
                window.posApp.showNotification('Error loading products: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            window.posApp.showNotification('Error loading products', 'error');
        }
    }

    renderProducts() {
        const tbody = document.getElementById('productsTable');
        tbody.innerHTML = '';

        this.products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.Product_ID}</td>
                <td>${product.Product_Name}</td>
                <td>${product.Category_Name || 'Uncategorized'}</td>
                <td>${window.posApp.formatCurrency(product.Price)}</td>
                <td class="${product.Stock_Quantity <= 10 ? 'low-stock' : ''}">${product.Stock_Quantity}</td>
                <td><span class="status ${product.Status.toLowerCase()}">${product.Status}</span></td>
                <td>
                    <button class="btn" onclick="productsManager.editProduct(${product.Product_ID})" style="padding: 5px 10px; margin-right: 5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn" onclick="productsManager.deleteProduct(${product.Product_ID})" style="padding: 5px 10px; background: #dc3545; color: white;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateProductCount() {
        const countElement = document.getElementById('productCount');
        if (countElement) {
            countElement.textContent = `${this.products.length} products`;
        }
    }

    async createProduct(productData) {
        try {
            const formData = new FormData();
            formData.append('action', 'create');
            formData.append('Product_Name', productData.Product_Name);
            formData.append('Category_ID', productData.Category_ID);
            formData.append('Price', productData.Price);
            formData.append('Stock_Quantity', productData.Stock_Quantity);
            formData.append('Status', productData.Status);

            const response = await fetch('php/products/products.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Product created successfully', 'success');
                await this.loadProducts();
                this.closeModal();
            } else {
                window.posApp.showNotification('Error creating product: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error creating product:', error);
            window.posApp.showNotification('Error creating product', 'error');
        }
    }

    async updateProduct(productId, productData) {
        try {
            const formData = new FormData();
            formData.append('action', 'update');
            formData.append('Product_ID', productId);
            formData.append('Product_Name', productData.Product_Name);
            formData.append('Category_ID', productData.Category_ID);
            formData.append('Price', productData.Price);
            formData.append('Stock_Quantity', productData.Stock_Quantity);
            formData.append('Status', productData.Status);

            const response = await fetch('php/products/products.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Product updated successfully', 'success');
                await this.loadProducts();
                this.closeModal();
            } else {
                window.posApp.showNotification('Error updating product: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            window.posApp.showNotification('Error updating product', 'error');
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            const formData = new FormData();
            formData.append('action', 'delete');
            formData.append('Product_ID', productId);

            const response = await fetch('php/products/products.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification('Product deleted successfully', 'success');
                await this.loadProducts();
            } else {
                window.posApp.showNotification('Error deleting product: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            window.posApp.showNotification('Error deleting product', 'error');
        }
    }

    async editProduct(productId) {
        try {
            const formData = new FormData();
            formData.append('action', 'read');
            formData.append('Product_ID', productId);

            const response = await fetch('php/products/products.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                this.openModal('edit', result.data);
            } else {
                window.posApp.showNotification('Error loading product: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error loading product:', error);
            window.posApp.showNotification('Error loading product', 'error');
        }
    }

    openModal(mode = 'create', product = null) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('productForm');
        const productId = document.getElementById('productId');
        const productName = document.getElementById('productName');
        const productCategory = document.getElementById('productCategory');
        const productPrice = document.getElementById('productPrice');
        const productStock = document.getElementById('productStock');
        const productStatus = document.getElementById('productStatus');

        if (mode === 'create') {
            title.textContent = 'Add New Product';
            form.reset();
            productId.value = '';
            productStatus.value = 'Active';
        } else {
            title.textContent = 'Edit Product';
            productId.value = product.Product_ID;
            productName.value = product.Product_Name;
            productCategory.value = product.Category_ID;
            productPrice.value = product.Price;
            productStock.value = product.Stock_Quantity;
            productStatus.value = product.Status;
        }

        modal.style.display = 'flex';
    }

    closeModal() {
        const modal = document.getElementById('productModal');
        modal.style.display = 'none';
    }

    setupEventListeners() {
        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.openModal('create');
        });

        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.applyFilters();
        });

        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.applyFilters();
        });

        document.getElementById('searchProducts').addEventListener('input', (e) => {
            this.applyFilters();
        });

        document.getElementById('exportProductsBtn').addEventListener('click', () => {
            this.exportProducts();
        });
    }

    handleFormSubmit() {
        const productId = document.getElementById('productId').value;
        const productName = document.getElementById('productName').value.trim();
        const categoryId = document.getElementById('productCategory').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const stockQuantity = parseInt(document.getElementById('productStock').value);
        const status = document.getElementById('productStatus').value;

        if (!productName || !categoryId || price <= 0 || stockQuantity < 0) {
            window.posApp.showNotification('Please fill all required fields with valid values', 'error');
            return;
        }

        const productData = {
            Product_Name: productName,
            Category_ID: categoryId,
            Price: price,
            Stock_Quantity: stockQuantity,
            Status: status
        };

        if (productId) {
            this.updateProduct(productId, productData);
        } else {
            this.createProduct(productData);
        }
    }

    applyFilters() {
        const filters = {
            Category_ID: document.getElementById('categoryFilter').value,
            Status: document.getElementById('statusFilter').value,
            search: document.getElementById('searchProducts').value
        };

        this.loadProducts(filters);
    }

    exportProducts() {
        const headers = ['ID', 'Product Name', 'Category', 'Price', 'Stock', 'Status'];
        const csvData = this.products.map(product => [
            product.Product_ID,
            product.Product_Name,
            product.Category_Name,
            product.Price,
            product.Stock_Quantity,
            product.Status
        ]);

        let csvContent = headers.join(',') + '\n';
        csvData.forEach(row => {
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products_export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

function closeProductModal() {
    window.productsManager.closeModal();
}

document.addEventListener('DOMContentLoaded', function() {
    window.productsManager = new ProductsManager();
});
