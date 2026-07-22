document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('edukasi-grid');
    const searchInput = document.getElementById('search-input');
    const noResults = document.getElementById('no-results');
    let allArticles = [];

    const renderArticles = (articles) => {
        if (articles.length === 0) {
            grid.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }

        noResults.style.display = 'none';
        grid.innerHTML = articles.map((a, index) => {
            // Apply delay based on index for smooth staggering animation (max 3 delays)
            const delayClass = index % 3 === 1 ? ' delay-1' : (index % 3 === 2 ? ' delay-2' : '');
            
            return `
            <div class="blog-card reveal active${delayClass}">
                <div class="blog-img">
                    <span class="blog-tag">${a.tag}</span>
                    <img src="${a.image}" alt="${a.title}">
                </div>
                <div class="blog-content">
                    <h3 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">${a.title}</h3>
                    <p style="color: #666; font-size: 0.95rem; margin-bottom: 1rem; line-height: 1.5;">${a.excerpt}</p>
                    <a href="/blog/${a.slug}" class="btn-read-more">Baca Selengkapnya &rarr;</a>
                </div>
            </div>`;
        }).join('');
    };

    try {
        const res = await fetch('data/articles.json?t=' + new Date().getTime());
        allArticles = await res.json();
        
        // Sort by date descending (Newest first)
        allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Initial render
        renderArticles(allArticles);
    } catch (err) {
        console.error('Failed to load articles:', err);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Gagal memuat artikel.</p>';
    }

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const filtered = allArticles.filter(a => 
            a.title.toLowerCase().includes(keyword) || 
            a.excerpt.toLowerCase().includes(keyword) ||
            a.tag.toLowerCase().includes(keyword)
        );
        renderArticles(filtered);
    });
});
