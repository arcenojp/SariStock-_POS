class PointOfSale {
    constructor() {
        this.cart = [];
        this.products = [];
        this.customers = [];
        this.selectedPaymentMethod = null;
        this.taxRate = 0.10; // 10% tax
        this.currentEmployee = window.posApp ? window.posApp.currentUser : { Employee_ID: 1 }; // Default employee
        
        this.init();
    }

    async init() {
        await this.loadProducts();
        await this.loadCustomers();
        this.setupEventListeners();
        this.updateCartDisplay();
    }

    async loadProducts() {
        try {
            const formData = new FormData();
            formData.append('action', 'read');

            const response = await fetch('php/products/products.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                this.products = result.data.filter(product => product.Status === 'Active');
                this.renderProducts();
            } else {
                console.error('Error loading products:', result.message);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    async loadCustomers() {
        try {
            const formData = new FormData();
            formData.append('action', 'read');

            const response = await fetch('php/customers/customers.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                this.customers = result.data;
                this.populateCustomerSelect();
            }
        } catch (error) {
            console.error('Error loading customers:', error);
        }
    }

    populateCustomerSelect() {
        const customerSelect = document.getElementById('customerSelect');
        if (customerSelect) {
            customerSelect.innerHTML = '<option value="">Walk-in Customer</option>';
            this.customers.forEach(customer => {
                customerSelect.innerHTML += `<option value="${customer.Customer_ID}">${customer.Name}</option>`;
            });
        }
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        productsGrid.innerHTML = '';

        this.products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <i class="fas fa-box" style="font-size: 32px; color: var(--primary);"></i>
                <h4>${product.Product_Name}</h4>
                <div class="price">${window.posApp.formatCurrency(product.Price)}</div>
                <div class="stock">Stock: ${product.Stock_Quantity}</div>
            `;

            productCard.addEventListener('click', () => {
                this.addToCart(product);
            });

            productsGrid.appendChild(productCard);
        });
    }

    addToCart(product) {
        const existingItem = this.cart.find(item => item.Product_ID === product.Product_ID);
        
        if (existingItem) {
            if (existingItem.Quantity < product.Stock_Quantity) {
                existingItem.Quantity++;
                existingItem.SubTotal = existingItem.Quantity * existingItem.Price;
            } else {
                window.posApp.showNotification('Not enough stock available', 'error');
                return;
            }
        } else {
            if (product.Stock_Quantity > 0) {
                this.cart.push({
                    Product_ID: product.Product_ID,
                    Product_Name: product.Product_Name,
                    Price: product.Price,
                    Quantity: 1,
                    SubTotal: product.Price
                });
            } else {
                window.posApp.showNotification('Product out of stock', 'error');
                return;
            }
        }

        this.updateCartDisplay();
        window.posApp.showNotification(`${product.Product_Name} added to cart`, 'success');
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.Product_ID !== productId);
        this.updateCartDisplay();
    }

    updateQuantity(productId, newQuantity) {
        const item = this.cart.find(item => item.Product_ID === productId);
        const product = this.products.find(p => p.Product_ID === productId);

        if (item && product) {
            if (newQuantity <= 0) {
                this.removeFromCart(productId);
                return;
            }

            if (newQuantity > product.Stock_Quantity) {
                window.posApp.showNotification('Not enough stock available', 'error');
                return;
            }

            item.Quantity = newQuantity;
            item.SubTotal = item.Quantity * item.Price;
            this.updateCartDisplay();
        }
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cartItems');
        const subtotalElement = document.getElementById('subtotal');
        const taxElement = document.getElementById('tax');
        const totalElement = document.getElementById('total');

        if (!cartItems) return;

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart" style="text-align: center; padding: 40px; color: var(--gray);">
                    <i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
        } else {
            cartItems.innerHTML = '';
            this.cart.forEach(item => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <div class="cart-item-info">
                        <h4>${item.Product_Name}</h4>
                        <div class="price">${window.posApp.formatCurrency(item.Price)} each</div>
                    </div>
                    <div class="cart-item-controls">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="pos.decreaseQuantity(${item.Product_ID})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span>${item.Quantity}</span>
                            <button class="quantity-btn" onclick="pos.increaseQuantity(${item.Product_ID})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <div style="font-weight: 600; margin-left: 15px;">
                            ${window.posApp.formatCurrency(item.SubTotal)}
                        </div>
                        <button class="quantity-btn" onclick="pos.removeFromCart(${item.Product_ID})" style="margin-left: 10px; color: #dc3545;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                cartItems.appendChild(cartItem);
            });
        }

        // Update totals
        const subtotal = this.cart.reduce((sum, item) => sum + item.SubTotal, 0);
        const tax = subtotal * this.taxRate;
        const total = subtotal + tax;

        if (subtotalElement) subtotalElement.textContent = window.posApp.formatCurrency(subtotal);
        if (taxElement) taxElement.textContent = window.posApp.formatCurrency(tax);
        if (totalElement) totalElement.textContent = window.posApp.formatCurrency(total);
    }

    increaseQuantity(productId) {
        const item = this.cart.find(item => item.Product_ID === productId);
        if (item) {
            this.updateQuantity(productId, item.Quantity + 1);
        }
    }

    decreaseQuantity(productId) {
        const item = this.cart.find(item => item.Product_ID === productId);
        if (item) {
            this.updateQuantity(productId, item.Quantity - 1);
        }
    }

    setupEventListeners() {
        // Payment method selection
        document.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', () => {
                document.querySelectorAll('.payment-method').forEach(m => {
                    m.classList.remove('selected');
                });
                method.classList.add('selected');
                this.selectedPaymentMethod = method.getAttribute('data-method');
            });
        });

        // Clear cart
        const clearCartBtn = document.getElementById('clearCart');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                this.clearCart();
            });
        }

        // Complete sale
        const completeSaleBtn = document.getElementById('completeSale');
        if (completeSaleBtn) {
            completeSaleBtn.addEventListener('click', () => {
                this.completeSale();
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterProducts(e.target.value);
            });
        }

        // Product search
        const productSearch = document.getElementById('productSearch');
        if (productSearch) {
            productSearch.addEventListener('input', (e) => {
                this.searchProducts(e.target.value);
            });
        }
    }

    filterProducts(categoryId) {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        productsGrid.innerHTML = '';

        const filteredProducts = categoryId ? 
            this.products.filter(product => product.Category_ID == categoryId) : 
            this.products;

        filteredProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <i class="fas fa-box" style="font-size: 32px; color: var(--primary);"></i>
                <h4>${product.Product_Name}</h4>
                <div class="price">${window.posApp.formatCurrency(product.Price)}</div>
                <div class="stock">Stock: ${product.Stock_Quantity}</div>
            `;

            productCard.addEventListener('click', () => {
                this.addToCart(product);
            });

            productsGrid.appendChild(productCard);
        });
    }

    searchProducts(searchTerm) {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        productsGrid.innerHTML = '';

        const filteredProducts = this.products.filter(product => 
            product.Product_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.Barcode.includes(searchTerm)
        );

        filteredProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <i class="fas fa-box" style="font-size: 32px; color: var(--primary);"></i>
                <h4>${product.Product_Name}</h4>
                <div class="price">${window.posApp.formatCurrency(product.Price)}</div>
                <div class="stock">Stock: ${product.Stock_Quantity}</div>
            `;

            productCard.addEventListener('click', () => {
                this.addToCart(product);
            });

            productsGrid.appendChild(productCard);
        });
    }

    clearCart() {
        this.cart = [];
        this.updateCartDisplay();
        window.posApp.showNotification('Cart cleared', 'info');
    }

    async completeSale() {
        if (this.cart.length === 0) {
            window.posApp.showNotification('Cart is empty', 'error');
            return;
        }

        if (!this.selectedPaymentMethod) {
            window.posApp.showNotification('Please select a payment method', 'error');
            return;
        }

        const customerSelect = document.getElementById('customerSelect');
        const customerId = customerSelect ? customerSelect.value : null;
        const total = this.cart.reduce((sum, item) => sum + item.SubTotal, 0) * (1 + this.taxRate);

        try {
            const formData = new FormData();
            formData.append('action', 'create');
            formData.append('Customer_ID', customerId || '');
            formData.append('Cashier_ID', this.currentEmployee.Employee_ID);
            formData.append('TotalAmount', total);
            formData.append('Payment_Method', this.selectedPaymentMethod);
            formData.append('items', JSON.stringify(this.cart));

            const response = await fetch('php/sales/sales.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                window.posApp.showNotification(`Sale completed successfully! Transaction ID: #${result.Sale_ID}`, 'success');
                this.clearCart();
                document.querySelectorAll('.payment-method').forEach(m => {
                    m.classList.remove('selected');
                });
                this.selectedPaymentMethod = null;
                if (customerSelect) customerSelect.value = '';
                
                // Reload products to update stock
                await this.loadProducts();
            } else {
                window.posApp.showNotification('Error completing sale: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error completing sale:', error);
            window.posApp.showNotification('Error completing sale', 'error');
        }
    }
}

// Initialize POS when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.pos = new PointOfSale();
});