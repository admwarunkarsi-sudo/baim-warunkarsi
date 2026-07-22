document.addEventListener('DOMContentLoaded', async () => {
    const pathParts = window.location.pathname.split('/');
    const slug = pathParts[pathParts.length - 1];

    if (!slug) {
        document.getElementById('product-main-content').innerHTML = `
            <div class="container" style="padding: 150px 0; text-align: center;">
                <h2>Produk tidak ditemukan</h2>
                <a href="/" class="btn btn-primary" style="margin-top:20px;">Kembali ke Beranda</a>
            </div>
        `;
        return;
    }

    try {
        const res = await fetch('/data/products.json?t=' + new Date().getTime());
        const products = await res.json();
        const product = products.find(p => p.slug === slug);

        if (!product) {
            document.getElementById('product-main-content').innerHTML = `
                <div class="container" style="padding: 150px 0; text-align: center;">
                    <h2>Produk tidak ditemukan</h2>
                    <a href="/" class="btn btn-primary" style="margin-top:20px;">Kembali ke Beranda</a>
                </div>
            `;
            return;
        }

        // Set Page Title & Meta SEO
        const pageTitle = `${product.title} | Baim Warunk Arsi`;
        document.title = pageTitle;
        if(document.getElementById('meta-title')) document.getElementById('meta-title').textContent = pageTitle;
        
        const cleanDesc = product.description.replace(/(<([^>]+)>)/gi, "").substring(0, 150) + "...";
        if(document.getElementById('meta-desc')) document.getElementById('meta-desc').setAttribute('content', cleanDesc);
        if(document.getElementById('og-title')) document.getElementById('og-title').setAttribute('content', pageTitle);
        if(document.getElementById('og-desc')) document.getElementById('og-desc').setAttribute('content', cleanDesc);
        if(document.getElementById('tw-title')) document.getElementById('tw-title').setAttribute('content', pageTitle);
        if(document.getElementById('tw-desc')) document.getElementById('tw-desc').setAttribute('content', cleanDesc);
        
        if(product.image) {
            if(document.getElementById('og-image')) document.getElementById('og-image').setAttribute('content', product.image);
            if(document.getElementById('tw-image')) document.getElementById('tw-image').setAttribute('content', product.image);
        }
        
        const currentUrl = window.location.href;
        if(document.getElementById('og-url')) document.getElementById('og-url').setAttribute('content', currentUrl);
        if(document.getElementById('tw-url')) document.getElementById('tw-url').setAttribute('content', currentUrl);

        const isFree = product.type === 'free';
        const labelClass = isFree ? 'label-free' : 'label-paid';
        const labelText = isFree ? 'Gratis' : 'Premium';
        const priceClass = isFree ? 'price free' : 'price';
        
        const ctaBtn = isFree 
            ? `<a href="${product.url}" class="btn btn-primary btn-block" style="font-size: 1.1rem; padding: 1rem;" target="_blank">Dapatkan Sekarang (Gratis)</a>`
            : `<a href="${product.url}" class="btn btn-primary btn-block" style="font-size: 1.1rem; padding: 1rem;" target="_blank">Beli Sekarang</a>`;

        const parsedContent = marked.parse(product.full_description || product.description);

        const html = `
            <section class="product-detail-hero">
                <div class="container product-detail-container">
                    <div class="product-sticky-img">
                        <img src="${product.image}" alt="${product.title}" style="width:100%; display:block; background-color: var(--primary-color);">
                    </div>
                    
                    <div class="product-info">
                        <span class="badge" style="margin-bottom:1rem;">${product.category}</span>
                        <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem; color: var(--primary-color);">${product.title}</h1>
                        <div style="margin-bottom: 2rem;">
                            <span class="label ${labelClass}" style="position:relative; top:0; right:0; display:inline-block; margin-right: 10px;">${labelText}</span>
                            <span class="${priceClass}" style="font-size: 2rem; vertical-align: middle;">${product.price}</span>
                        </div>
                        
                        <div class="markdown-body">
                            ${parsedContent}
                        </div>
                        
                        <div style="margin-top: 3rem; background: white; padding: 2rem; border-radius: 12px; box-shadow: var(--shadow-sm); border-top: 4px solid var(--accent-color);">
                            <h3 style="margin-bottom: 1rem; color: var(--primary-color);">Tertarik dengan penawaran ini?</h3>
                            ${ctaBtn}
                        </div>
                    </div>
                </div>
            </section>
        `;

        document.getElementById('product-main-content').innerHTML = html;

    } catch (error) {
        console.error('Error loading product:', error);
    }

    // Modal Logic removed as all products now go directly to Lynk.id checkout / links
});
