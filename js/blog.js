document.addEventListener('DOMContentLoaded', async () => {
    const pathParts = window.location.pathname.split('/');
    const slug = pathParts[pathParts.length - 1];

    if (!slug) {
        document.getElementById('blog-main-content').innerHTML = `
            <div class="container" style="padding: 150px 0; text-align: center;">
                <h2>Artikel tidak ditemukan</h2>
                <a href="/" class="btn btn-primary" style="margin-top:20px;">Kembali ke Beranda</a>
            </div>
        `;
        return;
    }

    try {
        const res = await fetch('/data/articles.json?t=' + new Date().getTime());
        const articles = await res.json();
        const article = articles.find(a => a.slug === slug);

        if (!article) {
            document.getElementById('blog-main-content').innerHTML = `
                <div class="container" style="padding: 150px 0; text-align: center;">
                    <h2>Artikel tidak ditemukan</h2>
                    <a href="" class="btn btn-primary" style="margin-top:20px;">Kembali ke Beranda</a>
                </div>
            `;
            return;
        }

        // Set Page Title & Meta SEO
        const pageTitle = `${article.title} | Blog Baim`;
        document.title = pageTitle;
        if(document.getElementById('meta-title')) document.getElementById('meta-title').textContent = pageTitle;
        
        let rawContent = article.excerpt || article.content || "";
        const cleanDesc = rawContent.replace(/(<([^>]+)>)/gi, "").substring(0, 150) + "...";
        if(document.getElementById('meta-desc')) document.getElementById('meta-desc').setAttribute('content', cleanDesc);
        if(document.getElementById('og-title')) document.getElementById('og-title').setAttribute('content', pageTitle);
        if(document.getElementById('og-desc')) document.getElementById('og-desc').setAttribute('content', cleanDesc);
        if(document.getElementById('tw-title')) document.getElementById('tw-title').setAttribute('content', pageTitle);
        if(document.getElementById('tw-desc')) document.getElementById('tw-desc').setAttribute('content', cleanDesc);
        
        if(article.image) {
            if(document.getElementById('og-image')) document.getElementById('og-image').setAttribute('content', article.image);
            if(document.getElementById('tw-image')) document.getElementById('tw-image').setAttribute('content', article.image);
        }
        
        const currentUrl = window.location.href;
        if(document.getElementById('og-url')) document.getElementById('og-url').setAttribute('content', currentUrl);
        if(document.getElementById('tw-url')) document.getElementById('tw-url').setAttribute('content', currentUrl);

        // Format Date (Simple)
        const dateObj = new Date(article.date);
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = dateObj.toLocaleDateString('id-ID', dateOptions) !== 'Invalid Date' ? dateObj.toLocaleDateString('id-ID', dateOptions) : article.date;

        const parsedContent = marked.parse(article.content || article.excerpt);

        let relatedProductHtml = '';
        if (article.related_product) {
            try {
                const pRes = await fetch('/data/products.json?t=' + new Date().getTime());
                const products = await pRes.json();
                const related = products.find(p => p.slug === article.related_product);
                if (related) {
                    relatedProductHtml = `
                        <div style="margin-top: 3rem; background: #fff; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center; border: 1px solid #eaeaea;">
                            <img src="${related.image}" alt="${related.title}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; flex-shrink: 0;">
                            <div style="flex: 1; min-width: 250px;">
                                <span style="font-size: 0.8rem; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px;">Rekomendasi Spesial</span>
                                <h3 style="margin: 0.5rem 0; font-size: 1.25rem; color: #1e293b;">${related.title}</h3>
                                <p style="color: #64748b; margin-bottom: 1rem; font-size: 0.95rem; line-height: 1.4;">${related.description}</p>
                                <a href="/produk/${related.slug}" class="btn btn-primary" style="text-decoration: none; padding: 0.6rem 1.5rem; display: inline-block;">Lihat Detail &rarr;</a>
                            </div>
                        </div>
                    `;
                }
            } catch (err) {
                console.error("Failed to load related product", err);
            }
        }

        const html = `
            <article>
                <div class="container" style="padding-top: 120px;">
                    <div class="blog-detail-image">
                        <img src="${article.image}" alt="${article.title}" style="width:100%; display:block; background-color: var(--bg-light);">
                    </div>
                </div>

                <div class="blog-detail-hero container" style="margin-top: 2rem;">
                    <span class="blog-tag" style="position:relative; top:0; left:0; display:inline-block; margin-bottom:1rem;">${article.tag}</span>
                    <h1 style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--primary-color);">${article.title}</h1>
                    <p style="color: var(--text-muted); font-size: 1rem;">Diterbitkan pada ${dateStr}</p>
                </div>
                
                <div class="blog-content-wrapper">
                    <div class="markdown-body">
                        ${parsedContent}
                    </div>
                    
                    ${relatedProductHtml}
                    
                    <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #eee; text-align: center;">
                        <p style="margin-bottom: 1rem; font-weight: 600;">Bagikan artikel ini</p>
                        <div style="display: flex; justify-content: center; gap: 1rem;">
                            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" class="btn btn-outline">Share ke Facebook</a>
                            <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + ' - ' + window.location.href)}" target="_blank" class="btn btn-outline">Share ke WA</a>
                        </div>
                    </div>
                </div>
            </article>
        `;

        document.getElementById('blog-main-content').innerHTML = html;

    } catch (error) {
        console.error('Error loading article:', error);
    }
});
