class PointOfSale {
    static WALKIN_CUSTOMER_ID = 5;
    constructor() {
        this.cart = [];
        this.products = [];
        this.customers = [];
        this.selectedPaymentMethod = null;
        this.taxRate = 0.10; 
        this.currentUser = window.posApp?.currentUser || { Role: 'Admin', Username: 'admin' };

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
                this.products = result.data.filter(p => p.Status === 'Active');
                this.renderProducts();
            } else {
                console.error('Error loading products:', result.message);
            }
        } catch (err) {
            console.error('Error loading products:', err);
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
        } catch (err) {
            console.error('Error loading customers:', err);
        }
    }

    populateCustomerSelect() {
        const select = document.getElementById('customerSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Walk-in Customer</option>';
        this.customers.forEach(c => {
            select.innerHTML += `<option value="${c.Customer_ID}">${c.Name}</option>`;
        });
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        grid.innerHTML = '';
        this.products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <i class="fas fa-box" style="font-size: 32px; color: var(--primary);"></i>
                <h4>${product.Product_Name}</h4>
                <div class="price">${window.posApp.formatCurrency(product.Price)}</div>
                <div class="stock">Stock: ${product.Stock_Quantity}</div>
            `;
            card.addEventListener('click', () => this.addToCart(product));
            grid.appendChild(card);
        });
    }

    addToCart(product) {
        const existing = this.cart.find(i => i.Product_ID === product.Product_ID);

        if (existing) {
            if (existing.Quantity < product.Stock_Quantity) {
                existing.Quantity++;
                existing.SubTotal = existing.Quantity * existing.Price;
            } else {
                window.posApp.showNotification('Not enough stock available', 'error');
                return;
            }
        } else if (product.Stock_Quantity > 0) {
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

        this.updateCartDisplay();
        window.posApp.showNotification(`${product.Product_Name} added to cart`, 'success');
    }

    removeFromCart(id) {
        this.cart = this.cart.filter(i => i.Product_ID !== id);
        this.updateCartDisplay();
    }

    updateQuantity(id, qty) {
        const item = this.cart.find(i => i.Product_ID === id);
        const product = this.products.find(p => p.Product_ID === id);

        if (!item || !product) return;

        if (qty <= 0) {
            this.removeFromCart(id);
        } else if (qty > product.Stock_Quantity) {
            window.posApp.showNotification('Not enough stock available', 'error');
        } else {
            item.Quantity = qty;
            item.SubTotal = qty * item.Price;
            this.updateCartDisplay();
        }
    }

    updateCartDisplay() {
        const cartDiv = document.getElementById('cartItems');
        if (!cartDiv) return;

        if (this.cart.length === 0) {
            cartDiv.innerHTML = `
                <div class="empty-cart" style="text-align:center;padding:40px;color:var(--gray);">
                    <i class="fas fa-shopping-cart" style="font-size:48px;margin-bottom:15px;"></i>
                    <p>Your cart is empty</p>
                </div>`;
            const cashInput = document.getElementById('cashGiven');
            if (cashInput) cashInput.value = '';
            this.calculateChange();
            return;
        }

        cartDiv.innerHTML = '';
        this.cart.forEach(item => {
            cartDiv.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.Product_Name}</h4>
                        <div class="price">${window.posApp.formatCurrency(item.Price)} each</div>
                    </div>
                    <div class="cart-item-controls">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="pos.decreaseQuantity(${item.Product_ID})"><i class="fas fa-minus"></i></button>
                            <span>${item.Quantity}</span>
                            <button class="quantity-btn" onclick="pos.increaseQuantity(${item.Product_ID})"><i class="fas fa-plus"></i></button>
                        </div>
                        <div style="font-weight:600;margin-left:15px;">${window.posApp.formatCurrency(item.SubTotal)}</div>
                        <button class="quantity-btn" onclick="pos.removeFromCart(${item.Product_ID})" style="margin-left:10px;color:#dc3545;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>`;
        });

        const subtotal = this.cart.reduce((s, i) => s + i.SubTotal, 0);
        const tax = subtotal * this.taxRate;
        const total = subtotal + tax;

        document.getElementById('subtotal').textContent = window.posApp.formatCurrency(subtotal);
        document.getElementById('tax').textContent = window.posApp.formatCurrency(tax);
        document.getElementById('total').textContent = window.posApp.formatCurrency(total);

        this.calculateChange();
    }

    increaseQuantity(id) {
        const item = this.cart.find(i => i.Product_ID === id);
        if (item) this.updateQuantity(id, item.Quantity + 1);
    }

    decreaseQuantity(id) {
        const item = this.cart.find(i => i.Product_ID === id);
        if (item) this.updateQuantity(id, item.Quantity - 1);
    }

    calculateChange() {
        if (this.selectedPaymentMethod === 'cash') {
            const cashEl = document.getElementById('cashGiven');
            const cash = parseFloat(cashEl?.value) || 0;
            const subtotal = this.cart.reduce((s, i) => s + (i.SubTotal || 0), 0);
            const total = subtotal + (subtotal * this.taxRate);
            const change = cash - total;
            const changeEl = document.getElementById('changeAmount');
            
            if (changeEl) {
                if (change >= 0) {
                    changeEl.textContent = window.posApp.formatCurrency(change);
                    changeEl.style.color = 'var(--success)';
                } else {
                    changeEl.textContent = window.posApp.formatCurrency(Math.abs(change)) + ' (Insufficient)';
                    changeEl.style.color = 'var(--danger)';
                }
            }
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.payment-method').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.payment-method').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedPaymentMethod = btn.getAttribute('data-method');
                
                
                const cashInputSection = document.getElementById('cashInputSection');
                if (this.selectedPaymentMethod === 'cash') {
                    cashInputSection.style.display = 'block';
                    this.calculateChange();
                } else {
                    cashInputSection.style.display = 'none';
                }
            });
        });

       
        document.getElementById('cashGiven')?.addEventListener('input', () => this.calculateChange());
        
        document.getElementById('clearCart')?.addEventListener('click', () => {
            this.clearCart();
            this.calculateChange();
        });
        document.getElementById('completeSale')?.addEventListener('click', () => this.completeSale());

        document.getElementById('categoryFilter')?.addEventListener('change', e => this.filterProducts(e.target.value));
        document.getElementById('productSearch')?.addEventListener('input', e => this.searchProducts(e.target.value));
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
        
      
        if(this.selectedPaymentMethod === 'cash'){
            const cashEl = document.getElementById('cashGiven');
            const cash = parseFloat(cashEl?.value) || 0;
            const subtotal = this.cart.reduce((s,i)=>s + (i.SubTotal||0), 0);
            const total = subtotal + (subtotal * this.taxRate);
            if(cash < total){ 
                window.posApp.showNotification('Cash given is insufficient','error'); 
                return; 
            }
        }

        const customerSelect = document.getElementById('customerSelect');
        let customerId = customerSelect?.value || '';
        
       
        if (!customerId || customerId === '') {
            customerId = '5'; 

        const total = this.cart.reduce((s, i) => s + i.SubTotal, 0) * (1 + this.taxRate);

        try {
            const formData = new FormData();
            formData.append('action', 'create');
            formData.append('Customer_ID', customerId);
            formData.append('User_Role', this.currentUser.Role);
            formData.append('Username', this.currentUser.Username);
            formData.append('TotalAmount', total);
            formData.append('Payment_Method', this.selectedPaymentMethod);
            formData.append('items', JSON.stringify(this.cart));

            const res = await fetch('php/sales/sales.php', { method: 'POST', body: formData });
            const result = await res.json();

            if (result.success) {
                window.posApp.showNotification(`Sale completed! Transaction ID: #${result.Sale_ID}`, 'success');
                this.clearCart();
                document.querySelectorAll('.payment-method').forEach(b => b.classList.remove('selected'));
                this.selectedPaymentMethod = null;
                
              
                if (customerSelect) customerSelect.value = '';
                
                await this.loadProducts();
            } else {
                window.posApp.showNotification('Error completing sale: ' + result.message, 'error');
            }
        } catch (err) {
            console.error('Error completing sale:', err);
            window.posApp.showNotification('Error completing sale', 'error');
        }
    }

    filterProducts(categoryId) {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        grid.innerHTML = '';
        
        let filteredProducts = this.products;
        if (categoryId) {
            filteredProducts = this.products.filter(product => product.Category_ID == categoryId);
        }

        filteredProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <i class="fas fa-box" style="font-size: 32px; color: var(--primary);"></i>
                <h4>${product.Product_Name}</h4>
                <div class="price">${window.posApp.formatCurrency(product.Price)}</div>
                <div class="stock">Stock: ${product.Stock_Quantity}</div>
            `;
            card.addEventListener('click', () => this.addToCart(product));
            grid.appendChild(card);
        });
    }

    searchProducts(searchTerm) {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        grid.innerHTML = '';
        
        let filteredProducts = this.products;
        if (searchTerm) {
            filteredProducts = this.products.filter(product => 
                product.Product_Name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        filteredProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <i class="fas fa-box" style="font-size: 32px; color: var(--primary);"></i>
                <h4>${product.Product_Name}</h4>
                <div class="price">${window.posApp.formatCurrency(product.Price)}</div>
                <div class="stock">Stock: ${product.Stock_Quantity}</div>
            `;
            card.addEventListener('click', () => this.addToCart(product));
            grid.appendChild(card);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => window.pos = new PointOfSale());
