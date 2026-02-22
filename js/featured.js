// Featured Apps Manager
class FeaturedAppsManager {
    constructor() {
        this.featuredApps = [];
        this.allApps = [];
        this.currentSlide = 0;
        this.sliderElement = null;
        this.indicators = [];
        this.autoSlideInterval = null;
        this.init();
    }
    
    init() {
        this.sliderElement = document.getElementById('featuredSlider');
        this.initializeElements();
        this.bindEvents();
        this.loadFeaturedApps();
    }
    
    initializeElements() {
        this.refreshBtn = document.getElementById('refreshFeatured');
        this.prevBtn = document.getElementById('featuredPrev');
        this.nextBtn = document.getElementById('featuredNext');
        this.indicatorsContainer = document.getElementById('scrollIndicators');
    }
    
    bindEvents() {
        // Refresh button
        this.refreshBtn.addEventListener('click', () => {
            this.refreshFeaturedApps();
        });
        
        // Navigation buttons
        this.prevBtn.addEventListener('click', () => {
            this.slideToPrev();
        });
        
        this.nextBtn.addEventListener('click', () => {
            this.slideToNext();
        });
        
        // Touch/swipe support
        let startX = 0;
        let endX = 0;
        
        this.sliderElement.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });
        
        this.sliderElement.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;
            
            if (Math.abs(diffX) > 50) { // Minimum swipe distance
                if (diffX > 0) {
                    this.slideToNext(); // Swipe left
                } else {
                    this.slideToPrev(); // Swipe right
                }
            }
        }, { passive: true });
        
        // Click on indicators
        this.indicatorsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('indicator')) {
                const index = parseInt(e.target.dataset.index);
                this.slideToIndex(index);
            }
        });
    }
    
    async loadFeaturedApps() {
        try {
            // Thử lấy từ cache trước
            const cachedApps = AppUtils.getFromCache();
            if (cachedApps && cachedApps.length > 0) {
                console.log('✅ Đang tải featured apps từ cache...');
                this.allApps = cachedApps;
                this.selectRandomFeaturedApps();
                this.renderFeaturedApps();
                
                // Tải dữ liệu mới trong nền
                this.fetchFreshData();
                return;
            }
            
            // Nếu không có cache, tải mới
            await this.fetchFreshData();
            
        } catch (error) {
            console.error('Lỗi khi tải featured apps:', error);
            this.showError();
        }
    }
    
    async fetchFreshData() {
        try {
            console.log('🔄 Đang tải dữ liệu mới cho featured apps...');
            const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getApps&t=${Date.now()}`);
            const result = await response.json();
            
            if (result.success) {
                this.allApps = result.data.map(app => {
                    if (!app.categories) {
                        app.categories = 'other';
                    }
                    return app;
                });
                
                AppUtils.saveToCache(this.allApps);
                this.selectRandomFeaturedApps();
                this.renderFeaturedApps();
                console.log('✅ Dữ liệu mới đã được tải cho featured apps');
            } else {
                throw new Error('Không thể tải dữ liệu');
            }
        } catch (error) {
            console.error('Lỗi khi fetch dữ liệu mới:', error);
        }
    }
    
    selectRandomFeaturedApps() {
        if (this.allApps.length === 0) return;
        
        // Lấy 20 ứng dụng gần nhất (sort by id)
        const sortedApps = [...this.allApps]
            .sort((a, b) => {
                const idA = parseInt(a.id) || 0;
                const idB = parseInt(b.id) || 0;
                return idB - idA;
            })
            .slice(0, 20);
        
        // Random 5 ứng dụng từ 20 ứng dụng gần nhất
        const shuffled = [...sortedApps].sort(() => 0.5 - Math.random());
        this.featuredApps = shuffled.slice(0, 5);
        
        console.log(`🎲 Đã chọn ${this.featuredApps.length} ứng dụng nổi bật random từ 20 ứng dụng gần nhất`);
    }
    
    refreshFeaturedApps() {
        // Hiệu ứng loading
        this.refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Đang tải...</span>';
        this.refreshBtn.disabled = true;
        
        // Chọn lại random apps
        this.selectRandomFeaturedApps();
        this.renderFeaturedApps();
        
        // Reset button sau 1.5 giây
        setTimeout(() => {
            this.refreshBtn.innerHTML = '<i class="fas fa-redo"></i><span>Đổi ứng dụng</span>';
            this.refreshBtn.disabled = false;
            
            // Hiệu ứng xoay
            this.refreshBtn.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                this.refreshBtn.style.transform = 'rotate(0deg)';
            }, 300);
        }, 1500);
    }
    
    renderFeaturedApps() {
        // Xóa skeleton loading
        document.getElementById('featuredSkeleton').style.display = 'none';
        
        // Xóa slider cũ
        this.sliderElement.innerHTML = '';
        
        if (this.featuredApps.length === 0) {
            this.sliderElement.innerHTML = `
                <div class="no-results" style="width: 100%; text-align: center; padding: 40px 20px;">
                    <i class="fas fa-star" style="font-size: 40px; margin-bottom: 12px; color: var(--text-muted);"></i>
                    <p style="color: var(--text-muted);">Chưa có ứng dụng nổi bật</p>
                </div>
            `;
            return;
        }
        
        // Tạo HTML cho từng featured app
        this.featuredApps.forEach((app, index) => {
            const appCard = this.createFeaturedAppCard(app, index);
            this.sliderElement.appendChild(appCard);
        });
        
        // Cập nhật indicators
        this.updateIndicators();
        
        // Reset slide về đầu
        this.currentSlide = 0;
        this.slideToIndex(0);
        
        // Auto slide mỗi 5 giây
        this.startAutoSlide();
    }
    
    createFeaturedAppCard(app, index) {
        const card = document.createElement('div');
        card.className = 'featured-app-card';
        
        // Lấy dòng mô tả đầu tiên
        const firstDescriptionLine = app.description ? 
            app.description.split('\n')[0].trim() : 
            'Ứng dụng chất lượng cao';
        
        // Format date
        const formattedDate = AppUtils.formatDate(app.updatedate);
        
        // Lấy category chính
        let mainCategory = 'other';
        if (app.categories) {
            if (Array.isArray(app.categories)) {
                mainCategory = app.categories[0];
            } else if (typeof app.categories === 'string') {
                mainCategory = app.categories.split(',')[0];
            }
        }
        
        const categoryLabel = CONFIG.CATEGORY_LABELS[mainCategory] || mainCategory;
        
        card.innerHTML = `
            <div class="featured-badge">NỔI BẬT</div>
            <div class="app-logo-container">
                <img src="${app.image || 'https://via.placeholder.com/80/2563eb/FFFFFF?text=App'}" 
                     alt="${app.name}" 
                     class="app-logo-featured"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/80/2563eb/FFFFFF?text=App'">
                <div class="logo-overlay"></div>
            </div>
            <div class="featured-app-content">
                <h3 class="featured-app-name">${app.name}</h3>
                <p class="featured-app-description">${firstDescriptionLine}</p>
                <div class="featured-app-meta">
                    <div class="featured-app-date">
                        <i class="fas fa-clock"></i>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="featured-app-category">${categoryLabel}</div>
                </div>
                <a href="app-detail.html?id=${app.id}" class="featured-app-button">
                    <i class="fas fa-download"></i>
                    Tải về ngay
                </a>
            </div>
        `;
        
        return card;
    }
    
    slideToPrev() {
        const cardWidth = document.querySelector('.featured-app-card').offsetWidth + 12; // width + gap
        const maxScroll = this.sliderElement.scrollWidth - this.sliderElement.clientWidth;
        
        this.currentSlide = Math.max(0, this.currentSlide - 1);
        
        this.sliderElement.scrollTo({
            left: this.currentSlide * cardWidth,
            behavior: 'smooth'
        });
        
        this.updateIndicators();
        this.resetAutoSlide();
    }
    
    slideToNext() {
        const cardWidth = document.querySelector('.featured-app-card').offsetWidth + 12;
        const maxScroll = this.sliderElement.scrollWidth - this.sliderElement.clientWidth;
        const maxSlides = Math.floor(maxScroll / cardWidth);
        
        this.currentSlide = Math.min(maxSlides, this.currentSlide + 1);
        
        this.sliderElement.scrollTo({
            left: this.currentSlide * cardWidth,
            behavior: 'smooth'
        });
        
        this.updateIndicators();
        this.resetAutoSlide();
    }
    
    slideToIndex(index) {
        const cardWidth = document.querySelector('.featured-app-card').offsetWidth + 12;
        this.currentSlide = index;
        
        this.sliderElement.scrollTo({
            left: this.currentSlide * cardWidth,
            behavior: 'smooth'
        });
        
        this.updateIndicators();
        this.resetAutoSlide();
    }
    
    updateIndicators() {
        if (this.featuredApps.length === 0) return;
        
        const cardWidth = document.querySelector('.featured-app-card').offsetWidth + 12;
        const maxScroll = this.sliderElement.scrollWidth - this.sliderElement.clientWidth;
        const totalSlides = Math.ceil(maxScroll / cardWidth) + 1;
        
        // Cập nhật số lượng indicators
        this.indicatorsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const indicator = document.createElement('div');
            indicator.className = 'indicator';
            indicator.dataset.index = i;
            if (i === this.currentSlide) {
                indicator.classList.add('active');
            }
            this.indicatorsContainer.appendChild(indicator);
        }
    }
    
    startAutoSlide() {
        // Dừng interval cũ nếu có
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
        }
        
        // Tự động slide mỗi 5 giây
        this.autoSlideInterval = setInterval(() => {
            this.slideToNext();
        }, 5000);
    }
    
    resetAutoSlide() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
        }
        this.startAutoSlide();
    }
    
    showError() {
        this.sliderElement.innerHTML = `
            <div class="no-results" style="width: 100%; text-align: center; padding: 40px 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 40px; margin-bottom: 12px; color: var(--text-muted);"></i>
                <p style="color: var(--text-muted);">Không thể tải ứng dụng nổi bật</p>
                <button class="refresh-featured" onclick="location.reload()" style="margin-top: 12px;">
                    <i class="fas fa-redo"></i>
                    Thử lại
                </button>
            </div>
        `;
    }
}

// Khởi tạo khi DOM sẵn sàng
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.featuredAppsManager = new FeaturedAppsManager();
    });
} else {
    window.featuredAppsManager = new FeaturedAppsManager();
}
