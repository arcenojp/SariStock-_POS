// Main application functionality
class POSApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setActiveNavLink();
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            const response = await fetch('php/auth/CheckSession.php');
            const result = await response.json();
            
            if (result.success && result.user) {
                this.currentUser = result.user;
                this.updateUserInfo();
            } else {
                // Redirect to login if not authenticated
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = 'login.html';
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    setActiveNavLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-links a');
        
        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href');
            if (linkPage === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    updateUserInfo() {
        const userProfile = document.querySelector('.user-profile');
        if (userProfile && this.currentUser) {
            const userImage = userProfile.querySelector('img');
            const userName = userProfile.querySelector('div > div:first-child');
            const userRole = userProfile.querySelector('div > div:last-child');
            
            if (userImage) {
                // You can add profile pictures later, for now use a default
                userImage.src = `https://i.pravatar.cc/150?img=${this.currentUser.Employee_ID || 12}`;
            }
            if (userName) userName.textContent = this.currentUser.Full_Name;
            if (userRole) userRole.textContent = this.currentUser.Role;
        }
    }

    setupEventListeners() {
        // Logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    async logout() {
        try {
            const response = await fetch('php/auth/Logout.php');
            const result = await response.json();
            
            if (result.success) {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = 'login.html';
        }
    }

    // Utility functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-left: 4px solid ${this.getNotificationColor(type)};
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || colors.info;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.posApp = new POSApp();
});