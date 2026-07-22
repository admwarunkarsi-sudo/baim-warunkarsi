// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // 0. Fetch Dynamic Data
    const loadData = async () => {
        try {
            // Load Products
            const productRes = await fetch('data/products.json?t=' + new Date().getTime());
            const products = await productRes.json();
            const productGrid = document.getElementById('product-grid');
            
            if (productGrid && products) {
                productGrid.innerHTML = products.map((p, index) => {
                    const delay = p.delay ? ` ${p.delay}` : (index === 1 ? ' delay-1' : (index === 2 ? ' delay-2' : ''));
                    const isFree = p.type === 'free';
                    const labelClass = isFree ? 'label-free' : 'label-paid';
                    const labelText = isFree ? 'Gratis' : 'Premium';
                    const priceClass = isFree ? 'price free' : 'price';
                    const btnHtml = isFree 
                        ? `<a href="/produk/${p.slug}" class="btn btn-outline btn-block">Selengkapnya</a>`
                        : `<a href="/produk/${p.slug}" class="btn btn-primary btn-block">Selengkapnya</a>`;

                    return `
                    <div class="product-card reveal${delay} active">
                        <div class="card-img">
                            <span class="label ${labelClass}">${labelText}</span>
                            <img src="${p.image}" alt="${p.title}">
                        </div>
                        <div class="card-content">
                            <span class="category">${p.category}</span>
                            <h3>${p.title}</h3>
                            <p>${p.description}</p>
                            <div class="card-footer">
                                <span class="${priceClass}">${p.price}</span>
                                ${btnHtml}
                            </div>
                        </div>
                    </div>`;
                }).join('');
            }

            // Load Articles
            const articleRes = await fetch('data/articles.json?t=' + new Date().getTime());
            let articles = await articleRes.json();
            // Sort by date descending
            articles.sort((a, b) => new Date(b.date) - new Date(a.date));
            const blogCarousel = document.getElementById('blog-carousel');
            
            if (blogCarousel && articles) {
                blogCarousel.innerHTML = articles.map(a => `
                    <div class="blog-card">
                        <div class="blog-img">
                            <span class="blog-tag">${a.tag}</span>
                            <img src="${a.image}" alt="${a.title}">
                        </div>
                        <div class="blog-content">
                            <h3>${a.title}</h3>
                            <p>${a.excerpt}</p>
                            <a href="/blog/${a.slug}" class="btn-read-more">Baca Selengkapnya &rarr;</a>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    loadData();

    // 1. Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const revealPoint = 150; // pixels before element is visible to trigger animation

        revealElements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            
            if (elementTop < windowHeight - revealPoint) {
                el.classList.add('active');
            }
        });
    };

    // Trigger once on load
    revealOnScroll();
    // Trigger on scroll
    window.addEventListener('scroll', revealOnScroll);

    // 2. Navbar Background on Scroll
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
        }
    });

    // 3. Modal Form Logic (Dummy Fonnte)
    const modalOverlay = document.getElementById('modal-form');
    const btnFreeTools = document.getElementById('btn-free-tools');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCloseSuccess = document.getElementById('btn-close-success');
    const leadForm = document.getElementById('lead-form');
    
    const formView = document.getElementById('form-view');
    const successView = document.getElementById('success-view');

    // Make openModal available globally for dynamic buttons
    window.openModal = () => {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    // Open Modal (for hardcoded elements if any)
    if (btnFreeTools) {
        btnFreeTools.addEventListener('click', window.openModal);
    }

    // Close Modal Function
    const closeModal = () => {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset form after closing animation
        setTimeout(() => {
            leadForm.reset();
            formView.classList.remove('hidden');
            successView.classList.add('hidden');
        }, 300);
    };

    // Close on buttons
    btnCloseModal.addEventListener('click', closeModal);
    btnCloseSuccess.addEventListener('click', closeModal);

    // Close on outside click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Handle Form Submit
    leadForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent actual submission for dummy
        
        // Simulating API call (Fonnte)
        const btnSubmit = leadForm.querySelector('button[type="submit"]');
        const originalText = btnSubmit.textContent;
        btnSubmit.textContent = 'Memproses...';
        btnSubmit.disabled = true;

        setTimeout(() => {
            // Show success view
            formView.classList.add('hidden');
            successView.classList.remove('hidden');
            
            // Reset button
            btnSubmit.textContent = originalText;
            btnSubmit.disabled = false;
        }, 1500);
    });

    // 4. Blog Carousel Logic
    const blogCarousel = document.getElementById('blog-carousel');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (blogCarousel && prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            // Scroll left by the width of one card + gap (roughly 33% of container)
            const cardWidth = blogCarousel.querySelector('.blog-card').offsetWidth;
            const gap = 32; // 2rem gap
            blogCarousel.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            // Scroll right
            const cardWidth = blogCarousel.querySelector('.blog-card').offsetWidth;
            const gap = 32; // 2rem gap
            blogCarousel.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
        });
    }
});
