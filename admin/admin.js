window.admin = window.admin || {};
const ADMIN_PASSWORD = 'baimdigital2026';
let authToken = localStorage.getItem('adminToken') || null;
// Validasi token yang tersimpan
if (authToken !== ADMIN_PASSWORD) {
    authToken = null;
    localStorage.removeItem('adminToken');
}
let productsData = [];
let articlesData = [];

const API_BASE = '/api';

// --- Auth & Init ---
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        showDashboard();
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
    }

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = document.getElementById('password').value;

        if (pwd === ADMIN_PASSWORD) {
            authToken = pwd;
            localStorage.setItem('adminToken', authToken);
            showDashboard();
        } else {
            const errEl = document.getElementById('login-error');
            if (errEl) {
                errEl.textContent = 'Password salah! Coba lagi.';
                errEl.classList.remove('hidden');
                setTimeout(() => errEl.classList.add('hidden'), 3000);
            } else {
                alert('Password salah! Coba lagi.');
            }
        }
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        authToken = null;
        localStorage.removeItem('adminToken');
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('password').value = '';
    });

    // Tab Navigation
    document.getElementById('tab-products').addEventListener('click', () => {
        switchTab('products');
    });
    document.getElementById('tab-articles').addEventListener('click', () => {
        switchTab('articles');
    });
    document.getElementById('tab-lms').addEventListener('click', () => {
        switchTab('lms');
    });
    document.getElementById('tab-discussions').addEventListener('click', () => {
        switchTab('discussions');
    });
    document.getElementById('tab-bonus').addEventListener('click', () => {
        switchTab('bonus');
    });
    document.getElementById('tab-settings').addEventListener('click', () => {
        switchTab('settings');
    });
    document.getElementById('tab-members').addEventListener('click', () => {
        switchTab('members');
    });

    // Publish Button
    document.getElementById('btn-publish').addEventListener('click', publishChanges);
});

function showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    // Initialize Summernote
    const summernoteOptions = {
        height: 250,
        toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'underline', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['view', ['fullscreen', 'codeview', 'help']]
        ]
    };
    $('#p-full-description').summernote(summernoteOptions);
    $('#a-content').summernote(Object.assign({}, summernoteOptions, {height: 350}));
    $('#lesson-content').summernote(Object.assign({}, summernoteOptions, {height: 350}));

    loadProducts();
    loadArticles();
}

// --- Cloudinary Upload Logic ---
const uploadToCloudinary = async (file, loadingElement, urlInput, previewElement) => {
    const cloudName = 'heswgpdc';
    const uploadPreset = 'baim warunk arsi';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    loadingElement.classList.remove('hidden');
    previewElement.classList.add('hidden');
    urlInput.value = '';

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        if (res.ok && data.secure_url) {
            const imageUrl = data.secure_url;
            urlInput.value = imageUrl;
            previewElement.src = imageUrl;
            previewElement.classList.remove('hidden');
        } else {
            alert('Gagal mengupload gambar: ' + (data.error ? data.error.message : 'Unknown error'));
        }
    } catch (err) {
        console.error('Upload Error:', err);
        alert('Terjadi kesalahan koneksi saat upload gambar ke Cloudinary.');
    } finally {
        loadingElement.classList.add('hidden');
    }
};

document.getElementById('p-image-file').addEventListener('change', (e) => {
    if (e.target.files[0]) {
        uploadToCloudinary(
            e.target.files[0], 
            document.getElementById('p-image-loading'), 
            document.getElementById('p-image'), 
            document.getElementById('p-image-preview')
        );
    }
});

document.getElementById('a-image-file').addEventListener('change', (e) => {
    if (e.target.files[0]) {
        uploadToCloudinary(
            e.target.files[0], 
            document.getElementById('a-image-loading'), 
            document.getElementById('a-image'), 
            document.getElementById('a-image-preview')
        );
    }
});
// --- End Cloudinary Logic ---

// --- Auto Slug Logic ---
document.getElementById('p-title').addEventListener('input', (e) => {
    // Hanya otomatis jika ini produk baru (ID kosong)
    if (!document.getElementById('p-id').value) {
        document.getElementById('p-slug').value = generateSlug(e.target.value);
    }
});

document.getElementById('a-title').addEventListener('input', (e) => {
    // Hanya otomatis jika ini artikel baru (ID kosong)
    if (!document.getElementById('a-id').value) {
        document.getElementById('a-slug').value = generateSlug(e.target.value);
    }
});
// --- End Auto Slug Logic ---

function switchTab(tab) {
    const sections = ['section-products', 'section-articles', 'section-lms', 'section-discussions', 'section-bonus', 'section-settings', 'section-members'];
    const tabs = ['tab-products', 'tab-articles', 'tab-lms', 'tab-discussions', 'tab-bonus', 'tab-settings', 'tab-members'];

    sections.forEach(s => {
        const el = document.getElementById(s);
        if(el) el.classList.add('hidden');
    });
    tabs.forEach(t => {
        const el = document.getElementById(t);
        if(el) {
            el.classList.remove('bg-gray-100', 'text-navy');
            el.classList.add('text-gray-600');
        }
    });

    const activate = (sectionId, tabId, cb) => {
        document.getElementById(sectionId)?.classList.remove('hidden');
        const tabEl = document.getElementById(tabId);
        if (tabEl) {
            tabEl.classList.add('bg-gray-100', 'text-navy');
            tabEl.classList.remove('text-gray-600');
        }
        if (cb) cb();
    };

    if (tab === 'products') activate('section-products', 'tab-products');
    else if (tab === 'articles') activate('section-articles', 'tab-articles');
    else if (tab === 'lms') activate('section-lms', 'tab-lms', () => { if (typeof loadLMSData === 'function') loadLMSData(); });
    else if (tab === 'discussions') activate('section-discussions', 'tab-discussions', () => { if (window.admin?.loadDiscussions) window.admin.loadDiscussions(); });
    else if (tab === 'bonus') activate('section-bonus', 'tab-bonus', () => { if (window.admin?.loadBonusFiles) window.admin.loadBonusFiles(); });
    else if (tab === 'settings') activate('section-settings', 'tab-settings', () => { if (window.admin?.loadSettings) window.admin.loadSettings(); });
    else if (tab === 'members') activate('section-members', 'tab-members', () => { if (window.admin?.loadMembers) window.admin.loadMembers(); });
}

function showStatus(msg, isError = false) {
    const el = document.getElementById('status-msg');
    el.textContent = msg;
    el.className = `mb-4 p-4 rounded text-sm font-semibold ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}

function handleApiError(res) {
    if (res.status === 401) {
        showStatus('Gagal memperbarui config blog (bukan error kritis, tapi url tidak terupdate di root).', true);
    }
}

// --- LMS Management Logic ---
let lmsModules = [];
let defaultCourseId = null;

async function fetchDefaultCourseId() {
    try {
        // Cek apakah ada course yang sudah ada
        const { data, error } = await window.supabaseClient.from('courses').select('id').limit(1);
        if (!error && data && data.length > 0) {
            defaultCourseId = data[0].id;
            console.log('Course ID ditemukan:', defaultCourseId);
            return;
        }
        
        // Jika tidak ada, buat course default secara otomatis
        console.log('Tidak ada course, membuat course default...');
        const { data: newCourse, error: insertErr } = await window.supabaseClient
            .from('courses')
            .insert([{
                title: 'Masterclass F&B Warunk Arsi',
                slug: 'masterclass-fb-warunk-arsi',
                description: 'Kursus lengkap membangun bisnis F&B yang profitable.',
                is_published: true
            }])
            .select('id')
            .single();
        
        if (!insertErr && newCourse) {
            defaultCourseId = newCourse.id;
            console.log('Course default berhasil dibuat dengan ID:', defaultCourseId);
        } else {
            console.error('Gagal membuat course default:', insertErr);
            // Fallback: coba tanpa course_id (jika kolom nullable)
            defaultCourseId = null;
        }
    } catch(err) {
        console.error('fetchDefaultCourseId error:', err);
        defaultCourseId = null;
    }
}

async function loadLMSData() {
    const container = document.getElementById('lms-container');
    if (!window.supabaseClient) {
        container.innerHTML = '<div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"><p class="text-red-600 font-bold">❌ Koneksi Supabase tidak ditemukan.</p><p class="text-sm text-gray-500 mt-2">Pastikan file supabase-client.js sudah dimuat dengan benar.</p></div>';
        return;
    }
    container.innerHTML = '<div class="bg-white shadow rounded-lg p-6 text-center text-gray-500">⏳ Memuat data LMS dari Supabase...</div>';
    
    if (!defaultCourseId) {
        await fetchDefaultCourseId();
    }
    
    try {
        const { data, error } = await window.supabaseClient
            .from('modules')
            .select(`
                id, title, order_index, course_id,
                lessons (
                    id, module_id, title, video_provider, video_id, content_body, order_index, is_preview
                )
            `)
            .order('order_index', { ascending: true })
            .order('order_index', { foreignTable: 'lessons', ascending: true });

        if (error) throw error;
        lmsModules = data || [];
        renderLMSData();
    } catch (err) {
        console.error('LMS Load Error:', err);
        container.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                <p class="text-red-600 font-bold text-lg mb-2">❌ Gagal memuat data LMS</p>
                <p class="text-sm text-gray-700 mb-3"><strong>Pesan Error:</strong> ${err.message || JSON.stringify(err)}</p>
                <hr class="mb-3">
                <p class="text-xs text-gray-500">Kemungkinan penyebab: RLS Supabase belum dikonfigurasi. Jalankan perintah SQL berikut di Supabase SQL Editor:</p>
                <pre class="bg-gray-800 text-green-300 text-xs p-3 rounded mt-2 overflow-auto">CREATE POLICY "Enable ALL for modules" ON public.modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable ALL for lessons" ON public.lessons FOR ALL USING (true) WITH CHECK (true);</pre>
            </div>`;
    }
}

function renderLMSData() {
    const container = document.getElementById('lms-container');
    if (lmsModules.length === 0) {
        container.innerHTML = '<div class="bg-white shadow rounded-lg p-6 text-center text-gray-500">Belum ada modul.</div>';
        return;
    }

    let html = '';
    lmsModules.forEach(mod => {
        html += `
            <div class="bg-white shadow rounded-lg p-4">
                <div class="flex justify-between items-center border-b pb-3 mb-3">
                    <h3 class="text-xl font-bold text-navy flex items-center gap-2"><span class="text-accent">📦</span> ${mod.title} (Urutan: ${mod.order_index})</h3>
                    <div class="flex gap-2">
                        <button onclick="window.admin.openLessonForm('${mod.id}')" class="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded text-sm transition font-bold">+ Bab</button>
                        <button onclick="window.admin.editModule('${mod.id}')" class="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded text-sm transition">Edit</button>
                        <button onclick="window.admin.deleteModule('${mod.id}')" class="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-sm transition">Hapus</button>
                    </div>
                </div>
                <div class="space-y-2 pl-6">
        `;
        
        if (mod.lessons && mod.lessons.length > 0) {
            mod.lessons.forEach(lesson => {
                html += `
                    <div class="flex justify-between items-center bg-gray-50 p-3 rounded border hover:bg-gray-100 transition">
                        <div class="font-semibold text-gray-700 flex items-center gap-2"><span class="text-accent">▶</span> ${lesson.title} <span class="text-xs text-gray-400 font-normal ml-2">(Urutan: ${lesson.order_index})</span></div>
                        <div class="flex items-center gap-3">
                            <span class="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">${lesson.video_provider.toUpperCase()}</span>
                            <button onclick="window.admin.openAttachmentModal('${lesson.id}', \`${lesson.title.replace(/'/g, "\\'")}\`)" class="text-green-600 hover:text-green-800 text-sm font-semibold border-l pl-3 border-gray-300">Lampiran</button>
                            <button onclick="window.admin.editLesson('${mod.id}', '${lesson.id}')" class="text-blue-600 hover:text-blue-800 text-sm font-semibold border-l pl-3 border-gray-300">Edit</button>
                            <button onclick="window.admin.deleteLesson('${lesson.id}')" class="text-red-600 hover:text-red-800 text-sm font-semibold">Hapus</button>
                        </div>
                    </div>
                `;
            });
        } else {
            html += `<p class="text-sm text-gray-400 italic">Belum ada bab di modul ini.</p>`;
        }
        
        html += `</div></div>`;
    });
    container.innerHTML = html;
}

document.getElementById('module-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('module-id').value;
    const payload = {
        title: document.getElementById('module-title').value,
        order_index: parseInt(document.getElementById('module-order').value)
    };
    
    try {
        if (id) {
            const { error } = await window.supabaseClient.from('modules').update(payload).eq('id', id);
            if(error) throw error;
        } else {
            if (defaultCourseId) {
                payload.course_id = defaultCourseId;
            }
            const { data: insertedData, error } = await window.supabaseClient.from('modules').insert([payload]).select();
            if(error) throw error;
            console.log('Modul berhasil ditambahkan:', insertedData);
        }
        window.admin.closeModuleForm();
        showStatus('Modul berhasil disimpan!');
        loadLMSData();
    } catch(err) {
        console.error(err);
        alert('Error menyimpan modul: ' + err.message);
        showStatus('Gagal menyimpan modul', true);
    }
});

document.getElementById('lesson-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('lesson-id').value;
    let rawVideoId = document.getElementById('lesson-video-id').value.trim();
    // Jika user memasukkan URL penuh, ekstrak ID-nya
    if (rawVideoId.includes('youtube.com') || rawVideoId.includes('youtu.be')) {
        const match = rawVideoId.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
        if (match) rawVideoId = match[1];
    } else if (rawVideoId.includes('vimeo.com')) {
        const match = rawVideoId.match(/vimeo\.com\/(\d+)/);
        if (match) rawVideoId = match[1];
    }

    const payload = {
        module_id: document.getElementById('lesson-module-id').value,
        title: document.getElementById('lesson-title').value,
        video_provider: document.getElementById('lesson-provider').value,
        video_id: rawVideoId,
        order_index: parseInt(document.getElementById('lesson-order').value),
        content_body: $('#lesson-content').summernote('code')
    };
    
    try {
        if (id) {
            const { error } = await window.supabaseClient.from('lessons').update(payload).eq('id', id);
            if(error) throw error;
        } else {
            const { error } = await window.supabaseClient.from('lessons').insert([payload]);
            if(error) throw error;
        }
        window.admin.closeLessonForm();
        showStatus('Bab berhasil disimpan!');
        loadLMSData();
    } catch(err) {
        console.error(err);
        alert('Error menyimpan bab: ' + err.message);
        showStatus('Gagal menyimpan bab', true);
    }
});

// --- Data Fetching ---
async function loadProducts() {
    try {
        // Coba dari server dulu, fallback ke file JSON langsung
        let data;
        try {
            const res = await fetch(`${API_BASE}/products`);
            if (!res.ok) throw new Error('Server tidak aktif');
            data = await res.json();
        } catch {
            const res = await fetch('../data/products.json');
            data = await res.json();
        }
        productsData = data;
        renderProducts();
        
        // Populate related product dropdown in article form
        const relatedSelect = document.getElementById('a-related-product');
        if (relatedSelect) {
            const currentVal = relatedSelect.value;
            relatedSelect.innerHTML = '<option value="">-- Tidak ada produk yang ditautkan --</option>';
            productsData.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.slug;
                opt.textContent = p.title;
                relatedSelect.appendChild(opt);
            });
            relatedSelect.value = currentVal;
        }
    } catch (err) {
        console.error('Failed to load products', err);
        document.getElementById('product-list').innerHTML = '<tr><td colspan="4" class="px-5 py-5 text-center text-red-500">Gagal memuat data produk. Pastikan server berjalan.</td></tr>';
    }
}

async function loadArticles() {
    try {
        let data;
        try {
            const res = await fetch(`${API_BASE}/articles`);
            if (!res.ok) throw new Error('Server tidak aktif');
            data = await res.json();
        } catch {
            const res = await fetch('../data/articles.json');
            data = await res.json();
        }
        articlesData = data;
        renderArticles();
    } catch (err) {
        console.error('Failed to load articles', err);
        document.getElementById('article-list').innerHTML = '<tr><td colspan="4" class="px-5 py-5 text-center text-red-500">Gagal memuat data artikel. Pastikan server berjalan.</td></tr>';
    }
}

// --- Rendering ---
function renderProducts() {
    const tbody = document.getElementById('product-list');
    tbody.innerHTML = productsData.map(p => {
        const badge = p.type === 'free'
            ? `<span class="inline-block px-2 py-0.5 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Gratis</span>`
            : `<span class="inline-block px-2 py-0.5 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">Premium</span>`;
        const actions = `<button onclick="window.admin.editProduct(${p.id})" class="text-blue-600 hover:text-blue-900 font-semibold text-sm mr-3">✏️ Edit</button><button onclick="window.admin.deleteProduct(${p.id})" class="text-red-600 hover:text-red-900 font-semibold text-sm">🗑️ Hapus</button>`;
        return `
        <!-- Mobile Card -->
        <tr class="block md:hidden">
            <td colspan="4" class="p-0 border-b border-gray-200">
                <div class="bg-white p-4 space-y-2">
                    <p class="font-semibold text-gray-900 text-sm">${p.title}</p>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">${badge} <span class="text-sm text-gray-600">${p.price}</span></div>
                        <div>${actions}</div>
                    </div>
                </div>
            </td>
        </tr>
        <!-- Desktop Row -->
        <tr class="hidden md:table-row hover:bg-gray-50">
            <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm font-semibold text-gray-900">${p.title}</td>
            <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">${badge}</td>
            <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm text-gray-700">${p.price}</td>
            <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">${actions}</td>
        </tr>`;
    }).join('');
}

function renderArticles() {
    const tbody = document.getElementById('article-list');
    tbody.innerHTML = articlesData.map(a => {
        const actions = `<button onclick="window.admin.editArticle(${a.id})" class="text-blue-600 hover:text-blue-900 font-semibold text-sm mr-3">✏️ Edit</button><button onclick="window.admin.deleteArticle(${a.id})" class="text-red-600 hover:text-red-900 font-semibold text-sm">🗑️ Hapus</button>`;
        return `
        <!-- Mobile Card -->
        <tr class="block md:hidden">
            <td colspan="4" class="p-0 border-b border-gray-200">
                <div class="bg-white p-4 space-y-1">
                    <p class="font-semibold text-gray-900 text-sm">${a.title}</p>
                    <div class="flex items-center justify-between">
                        <div class="text-xs text-gray-500">${a.tag} · ${a.date}</div>
                        <div>${actions}</div>
                    </div>
                </div>
            </td>
        </tr>
        <!-- Desktop Row -->
        <tr class="hidden md:table-row hover:bg-gray-50">
            <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm font-semibold text-gray-900">${a.title}</td>
            <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm text-gray-700">${a.tag}</td>
            <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm text-gray-500">${a.date}</td>
            <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">${actions}</td>
        </tr>`;
    }).join('');
}

// --- CRUD Forms ---

// Products
document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('p-id').value;
    
    const newProduct = {
        id: id ? parseInt(id) : Date.now(),
        slug: generateSlug(document.getElementById('p-slug').value || document.getElementById('p-title').value),
        title: document.getElementById('p-title').value,
        type: document.getElementById('p-type').value,
        category: document.getElementById('p-category').value,
        price: document.getElementById('p-price').value,
        description: document.getElementById('p-description').value,
        full_description: $('#p-full-description').summernote('code'),
        image: document.getElementById('p-image').value,
        url: document.getElementById('p-url').value,
        delay: ""
    };

    if (id) {
        const idx = productsData.findIndex(p => p.id === parseInt(id));
        if (idx !== -1) productsData[idx] = newProduct;
    } else {
        productsData.push(newProduct);
    }

    await saveProducts();
    window.admin.closeProductForm();
});

async function saveProducts() {
    try {
        const res = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': authToken },
            body: JSON.stringify(productsData)
        });
        handleApiError(res);
        const data = await res.json();
        if (data.success) {
            showStatus('Produk berhasil disimpan.');
            renderProducts();
        } else {
            showStatus(data.message, true);
        }
    } catch (err) {
        if(err.message !== 'Unauthorized') showStatus('Gagal menyimpan produk.', true);
    }
}

// Articles
document.getElementById('article-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('a-id').value;
    
    const newArticle = {
        id: id ? parseInt(id) : Date.now(),
        slug: generateSlug(document.getElementById('a-slug').value || document.getElementById('a-title').value),
        title: document.getElementById('a-title').value,
        tag: document.getElementById('a-tag').value,
        date: document.getElementById('a-date').value,
        image: document.getElementById('a-image').value,
        excerpt: document.getElementById('a-excerpt').value,
        related_product: document.getElementById('a-related-product').value,
        content: $('#a-content').summernote('code')
    };

    if (id) {
        const idx = articlesData.findIndex(a => a.id === parseInt(id));
        if (idx !== -1) articlesData[idx] = newArticle;
    } else {
        articlesData.push(newArticle);
    }

    await saveArticles();
    window.admin.closeArticleForm();
});

async function saveArticles() {
    try {
        const res = await fetch(`${API_BASE}/articles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': authToken },
            body: JSON.stringify(articlesData)
        });
        handleApiError(res);
        const data = await res.json();
        if (data.success) {
            showStatus('Artikel berhasil disimpan.');
            renderArticles();
        } else {
            showStatus(data.message, true);
        }
    } catch (err) {
        if(err.message !== 'Unauthorized') showStatus('Gagal menyimpan artikel.', true);
    }
}

// --- Git Publish ---
async function publishChanges() {
    const btn = document.getElementById('btn-publish');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = 'Memproses...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/publish`, {
            method: 'POST',
            headers: { 'x-admin-token': authToken }
        });
        handleApiError(res);
        const data = await res.json();
        if (data.success) {
            showStatus(data.message);
        } else {
            showStatus(data.message, true);
        }
    } catch (err) {
        if(err.message !== 'Unauthorized') showStatus('Gagal melakukan publish.', true);
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
}


// --- Auto Slug ---
function generateSlug(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

    // Expose window functions for onclick attributes
window.admin = {
    openProductForm: () => {
        document.getElementById('product-form').reset();
        document.getElementById('p-id').value = '';
        document.getElementById('p-slug').value = '';
        document.getElementById('p-image-file').value = '';
        document.getElementById('p-image-preview').src = '';
        document.getElementById('p-image-preview').classList.add('hidden');
        $('#p-full-description').summernote('reset'); // Clear editor
        document.getElementById('product-modal-title').textContent = 'Tambah Produk';
        document.getElementById('product-modal').classList.remove('hidden');
    },
    closeProductForm: () => {
        document.getElementById('product-modal').classList.add('hidden');
    },
    editProduct: (id) => {
        const p = productsData.find(x => x.id === id);
        if (p) {
            document.getElementById('p-id').value = p.id;
            document.getElementById('p-slug').value = p.slug || '';
            document.getElementById('p-title').value = p.title;
            document.getElementById('p-type').value = p.type;
            document.getElementById('p-category').value = p.category;
            document.getElementById('p-price').value = p.price;
            document.getElementById('p-description').value = p.description;
            
            // Parse existing markdown to HTML if necessary
            let htmlContent = p.full_description || '';
            if (htmlContent && !htmlContent.startsWith('<') && window.marked) {
                htmlContent = marked.parse(htmlContent);
            }
            $('#p-full-description').summernote('code', htmlContent);
            
            document.getElementById('p-image').value = p.image;
            if (p.image) {
                document.getElementById('p-image-preview').src = p.image;
                document.getElementById('p-image-preview').classList.remove('hidden');
            } else {
                document.getElementById('p-image-preview').classList.add('hidden');
            }
            
            document.getElementById('p-url').value = p.url;
            
            document.getElementById('product-modal-title').textContent = 'Edit Produk';
            document.getElementById('product-modal').classList.remove('hidden');
        }
    },
    deleteProduct: async (id) => {
        if (confirm('Yakin ingin menghapus produk ini?')) {
            productsData = productsData.filter(x => x.id !== id);
            await saveProducts();
        }
    },
    openArticleForm: () => {
        document.getElementById('article-form').reset();
        document.getElementById('a-id').value = '';
        document.getElementById('a-slug').value = '';
        document.getElementById('a-image-file').value = '';
        document.getElementById('a-image-preview').src = '';
        document.getElementById('a-image-preview').classList.add('hidden');
        document.getElementById('a-related-product').value = '';
        $('#a-content').summernote('reset'); // Clear editor
        document.getElementById('article-modal-title').textContent = 'Tambah Artikel';
        document.getElementById('article-modal').classList.remove('hidden');
    },
    closeArticleForm: () => {
        document.getElementById('article-modal').classList.add('hidden');
    },
    editArticle: (id) => {
        const a = articlesData.find(x => x.id === id);
        if (a) {
            document.getElementById('a-id').value = a.id;
            document.getElementById('a-slug').value = a.slug || '';
            document.getElementById('a-title').value = a.title;
            document.getElementById('a-tag').value = a.tag;
            document.getElementById('a-date').value = a.date;
            document.getElementById('a-image').value = a.image;
            if (a.image) {
                document.getElementById('a-image-preview').src = a.image;
                document.getElementById('a-image-preview').classList.remove('hidden');
            } else {
                document.getElementById('a-image-preview').classList.add('hidden');
            }
            document.getElementById('a-excerpt').value = a.excerpt;
            document.getElementById('a-related-product').value = a.related_product || '';
            
            let htmlContent = a.content || '';
            if (htmlContent && !htmlContent.startsWith('<') && window.marked) {
                htmlContent = marked.parse(htmlContent);
            }
            $('#a-content').summernote('code', htmlContent);
            
            document.getElementById('article-modal-title').textContent = 'Edit Artikel';
            document.getElementById('article-modal').classList.remove('hidden');
        }
    },
    deleteArticle: async (id) => {
        if (confirm('Yakin ingin menghapus artikel ini?')) {
            articlesData = articlesData.filter(x => x.id !== id);
            await saveArticles();
        }
    },
    // --- LMS Functions ---
    openModuleForm: function(id = null) {
        document.getElementById('module-form').reset();
        document.getElementById('module-id').value = '';
        document.getElementById('module-modal-title').textContent = 'Tambah Modul Baru';
        if (id) {
            const mod = lmsModules.find(m => m.id === id);
            if (mod) {
                document.getElementById('module-id').value = mod.id;
                document.getElementById('module-title').value = mod.title;
                document.getElementById('module-order').value = mod.order_index;
                document.getElementById('module-modal-title').textContent = 'Edit Modul';
            }
        }
        document.getElementById('module-modal').classList.remove('hidden');
    },
    closeModuleForm: function() {
        document.getElementById('module-modal').classList.add('hidden');
    },
    editModule: function(id) {
        window.admin.openModuleForm(id);
    },
    deleteModule: async function(id) {
        if(confirm('Yakin ingin menghapus modul ini beserta isinya?')) {
            try {
                const { error } = await window.supabaseClient.from('modules').delete().eq('id', id);
                if(error) throw error;
                showStatus('Modul berhasil dihapus!');
                loadLMSData();
            } catch(err) {
                console.error(err);
                alert('Error menghapus modul: ' + err.message);
                showStatus('Gagal menghapus modul', true);
            }
        }
    },
    openLessonForm: function(moduleId, lessonId = null) {
        document.getElementById('lesson-form').reset();
        document.getElementById('lesson-id').value = '';
        document.getElementById('lesson-module-id').value = moduleId;
        $('#lesson-content').summernote('code', '');
        document.getElementById('lesson-modal-title').textContent = 'Tambah Bab Baru';
        if (lessonId) {
            const mod = lmsModules.find(m => m.id === moduleId);
            if (mod) {
                const lesson = mod.lessons.find(l => l.id === lessonId);
                if (lesson) {
                    document.getElementById('lesson-id').value = lesson.id;
                    document.getElementById('lesson-title').value = lesson.title;
                    document.getElementById('lesson-provider').value = lesson.video_provider;
                    document.getElementById('lesson-video-id').value = lesson.video_id;
                    document.getElementById('lesson-order').value = lesson.order_index;
                    $('#lesson-content').summernote('code', lesson.content_body || '');
                    document.getElementById('lesson-modal-title').textContent = 'Edit Bab';
                }
            }
        }
        document.getElementById('lesson-modal').classList.remove('hidden');
    },
    closeLessonForm: function() {
        document.getElementById('lesson-modal').classList.add('hidden');
    },
    editLesson: function(moduleId, lessonId) {
        window.admin.openLessonForm(moduleId, lessonId);
    },
    deleteLesson: async function(id) {
        if(confirm('Yakin ingin menghapus bab ini?')) {
            try {
                const { error } = await window.supabaseClient.from('lessons').delete().eq('id', id);
                if(error) throw error;
                showStatus('Bab berhasil dihapus!');
                loadLMSData();
            } catch(err) {
                console.error(err);
                alert('Error menghapus bab: ' + err.message);
                showStatus('Gagal menghapus bab', true);
            }
        }
    },
    // --- Attachment Functions ---
    openAttachmentModal: async function(lessonId, lessonTitle) {
        document.getElementById('attach-lesson-id').value = lessonId;
        document.getElementById('attach-lesson-title').textContent = lessonTitle;
        document.getElementById('attachment-form').reset();
        document.getElementById('attachment-list').innerHTML = '<p class="text-gray-500">Memuat lampiran...</p>';
        document.getElementById('attachment-modal').classList.remove('hidden');
        
        await window.admin.loadAttachments(lessonId);
    },
    closeAttachmentModal: function() {
        document.getElementById('attachment-modal').classList.add('hidden');
    },
    loadAttachments: async function(lessonId) {
        try {
            const { data, error } = await window.supabaseClient.from('attachments').select('*').eq('lesson_id', lessonId);
            if(error) throw error;
            
            const listContainer = document.getElementById('attachment-list');
            if(!data || data.length === 0) {
                listContainer.innerHTML = '<p class="text-sm text-gray-400 italic">Belum ada lampiran.</p>';
                return;
            }
            
            listContainer.innerHTML = data.map(att => `
                <div class="flex justify-between items-center bg-white p-2 border rounded shadow-sm">
                    <div class="flex items-center gap-2">
                        <span class="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded uppercase font-bold">${att.file_type}</span>
                        <a href="${att.file_url}" target="_blank" class="text-sm text-blue-600 hover:underline font-semibold">${att.file_name}</a>
                    </div>
                    <button type="button" onclick="window.admin.deleteAttachment('${att.id}', '${lessonId}')" class="text-red-600 hover:text-red-800 text-xs font-bold px-2 py-1 bg-red-50 rounded">Hapus</button>
                </div>
            `).join('');
        } catch(err) {
            console.error(err);
            document.getElementById('attachment-list').innerHTML = '<p class="text-sm text-red-500">Gagal memuat lampiran.</p>';
        }
    },
    deleteAttachment: async function(id, lessonId) {
        if(confirm('Yakin ingin menghapus lampiran ini?')) {
            try {
                const { error } = await window.supabaseClient.from('attachments').delete().eq('id', id);
                if(error) throw error;
                window.admin.loadAttachments(lessonId);
            } catch(err) {
                console.error(err);
                alert('Gagal menghapus lampiran');
            }
        }
    },
    // --- Discussion Functions ---
    loadDiscussions: async function() {
        const tbody = document.getElementById('discussion-list');
        tbody.innerHTML = '<tr><td colspan="5" class="px-5 py-5 text-center text-gray-500">Memuat data diskusi...</td></tr>';
        
        try {
            // Kita join dengan tabel users dan lessons
            const { data, error } = await window.supabaseClient
                .from('discussions')
                .select(`
                    id, question, reply, created_at,
                    users ( full_name, email ),
                    lessons ( title )
                `)
                .order('created_at', { ascending: false });
                
            if(error) throw error;
            
            if(!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="px-5 py-5 text-center text-gray-500">Belum ada diskusi/pertanyaan masuk.</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.map(d => {
                const isReplied = !!d.reply;
                const statusBadge = isReplied 
                    ? `<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Terjawab</span>`
                    : `<span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">Menunggu Balasan</span>`;
                
                const memberName = d.users ? (d.users.full_name || d.users.email) : 'Member';
                const lessonTitle = d.lessons ? d.lessons.title : '-';
                
                return `
                <tr>
                    <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                        <p class="text-gray-900 font-semibold">${memberName}</p>
                    </td>
                    <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                        <p class="text-gray-600">${lessonTitle}</p>
                    </td>
                    <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                        <p class="text-gray-800 italic">"${d.question}"</p>
                    </td>
                    <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                        ${statusBadge}
                    </td>
                    <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                        <button onclick="window.admin.openReplyModal('${d.id}', \`${memberName.replace(/'/g, "\\'")}\`, \`${lessonTitle.replace(/'/g, "\\'")}\`, \`${d.question.replace(/'/g, "\\'")}\`, \`${(d.reply || '').replace(/'/g, "\\'")}\`)" class="bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold px-3 py-1 rounded transition">Balas</button>
                    </td>
                </tr>
                `;
            }).join('');
            
        } catch(err) {
            console.error(err);
            tbody.innerHTML = '<tr><td colspan="5" class="px-5 py-5 text-center text-red-500">Gagal memuat diskusi: ' + err.message + '</td></tr>';
        }
    },
    openReplyModal: function(id, memberName, lessonTitle, questionText, existingReply) {
        document.getElementById('reply-discussion-id').value = id;
        document.getElementById('reply-member-name').textContent = memberName;
        document.getElementById('reply-lesson-title').textContent = lessonTitle;
        document.getElementById('reply-question-text').textContent = `"${questionText}"`;
        document.getElementById('reply-content').value = existingReply || '';
        
        document.getElementById('reply-modal').classList.remove('hidden');
    },
    closeReplyModal: function() {
        document.getElementById('reply-modal').classList.add('hidden');
    },
    // --- Bonus Files Functions ---
    loadBonusFiles: async function() {
        const tbody = document.getElementById('bonus-list');
        tbody.innerHTML = '<tr><td colspan="3" class="px-5 py-5 text-center text-gray-500">Memuat...</td></tr>';
        try {
            const { data, error } = await window.supabaseClient
                .from('bonus_files').select('*').order('created_at', { ascending: false });
            if (error) throw error;

            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="px-5 py-5 text-center text-gray-500">Belum ada file bonus.</td></tr>';
                return;
            }
            tbody.innerHTML = data.map(f => `
                <!-- Mobile Card -->
                <tr class="block md:hidden">
                    <td colspan="3" class="p-0 border-b border-gray-200">
                        <div class="bg-white p-4 space-y-2">
                            <div class="flex items-start justify-between">
                                <div>
                                    <p class="font-semibold text-gray-900 text-sm">${f.title}</p>
                                    ${f.description ? `<p class="text-gray-500 text-xs">${f.description}</p>` : ''}
                                    <span class="mt-1 inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs uppercase font-bold">${f.file_type}</span>
                                </div>
                                <div class="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                                    <a href="${f.file_url}" target="_blank" class="text-blue-600 font-semibold text-sm hover:underline">👁️ Lihat</a>
                                    <button onclick="window.admin.deleteBonusFile('${f.id}')" class="text-red-600 font-semibold text-sm">🗑️ Hapus</button>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
                <!-- Desktop Row -->
                <tr class="hidden md:table-row hover:bg-gray-50">
                    <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                        <p class="text-gray-900 font-semibold">${f.title}</p>
                        ${f.description ? `<p class="text-gray-500 text-xs">${f.description}</p>` : ''}
                    </td>
                    <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                        <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs uppercase font-bold">${f.file_type}</span>
                    </td>
                    <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                        <a href="${f.file_url}" target="_blank" class="text-blue-600 hover:underline mr-3">Lihat</a>
                        <button onclick="window.admin.deleteBonusFile('${f.id}')" class="text-red-600 hover:text-red-800 font-semibold">Hapus</button>
                    </td>
                </tr>
            `).join('');
        } catch(err) {
            tbody.innerHTML = `<tr><td colspan="3" class="px-5 py-5 text-center text-red-500">Gagal: ${err.message}</td></tr>`;
        }
    },
    openBonusForm: function() {
        document.getElementById('bonus-form').reset();
        document.getElementById('bonus-id').value = '';
        document.getElementById('bonus-modal-title').textContent = 'Tambah File Bonus';
        document.getElementById('bonus-modal').classList.remove('hidden');
    },
    closeBonusForm: function() {
        document.getElementById('bonus-modal').classList.add('hidden');
    },
    deleteBonusFile: async function(id) {
        if (!confirm('Yakin ingin menghapus file bonus ini?')) return;
        try {
            const { error } = await window.supabaseClient.from('bonus_files').delete().eq('id', id);
            if (error) throw error;
            showStatus('File bonus berhasil dihapus!');
            window.admin.loadBonusFiles();
        } catch(err) {
            alert('Gagal menghapus: ' + err.message);
        }
    },
    // --- Settings Functions ---
    loadSettings: async function() {
        try {
            const { data, error } = await window.supabaseClient
                .from('site_settings').select('value').eq('key', 'whatsapp_group_url').single();
            if (!error && data) {
                document.getElementById('wa-group-url').value = data.value || '';
            }
        } catch(err) {
            console.error('Error loading settings:', err);
        }
    },
    saveSettings: async function() {
        const url = document.getElementById('wa-group-url').value.trim();
        const statusEl = document.getElementById('settings-status');
        statusEl.textContent = 'Menyimpan...';
        statusEl.style.color = 'gray';
        try {
            const { error } = await window.supabaseClient
                .from('site_settings')
                .upsert({ key: 'whatsapp_group_url', value: url }, { onConflict: 'key' });
            if (error) throw error;
            statusEl.textContent = '✅ Pengaturan berhasil disimpan!';
            statusEl.style.color = '#10b981';
            setTimeout(() => { statusEl.textContent = ''; }, 4000);
        } catch(err) {
            statusEl.textContent = 'Gagal: ' + err.message;
            statusEl.style.color = 'red';
        }
    }
};

// --- Form Submit Handlers for Modals ---
document.getElementById('attachment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const lessonId = document.getElementById('attach-lesson-id').value;
    const payload = {
        lesson_id: lessonId,
        file_name: document.getElementById('attach-name').value,
        file_type: document.getElementById('attach-type').value,
        file_url: document.getElementById('attach-url').value
    };
    
    try {
        const { error } = await window.supabaseClient.from('attachments').insert([payload]);
        if(error) throw error;
        document.getElementById('attachment-form').reset();
        window.admin.loadAttachments(lessonId); // refresh list
    } catch(err) {
        console.error(err);
        alert('Gagal menambah lampiran');
    }
});

document.getElementById('reply-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const discussionId = document.getElementById('reply-discussion-id').value;
    const replyContent = document.getElementById('reply-content').value;
    
    try {
        const { error } = await window.supabaseClient.from('discussions')
            .update({ 
                reply: replyContent, 
                replied_at: new Date().toISOString() 
            })
            .eq('id', discussionId);
            
        if(error) throw error;
        window.admin.closeReplyModal();
        showStatus('Balasan berhasil dikirim!');
        window.admin.loadDiscussions(); // refresh list
    } catch(err) {
        console.error(err);
        alert('Gagal mengirim balasan');
    }
});

// --- Bonus File Form Submit ---
document.getElementById('bonus-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        title: document.getElementById('bonus-title').value,
        description: document.getElementById('bonus-desc').value,
        file_type: document.getElementById('bonus-type').value,
        file_url: document.getElementById('bonus-url').value
    };
    try {
        const { error } = await window.supabaseClient.from('bonus_files').insert([payload]);
        if (error) throw error;
        window.admin.closeBonusForm();
        showStatus('File bonus berhasil ditambahkan!');
        window.admin.loadBonusFiles();
    } catch(err) {
        console.error(err);
        alert('Gagal menambah file bonus: ' + err.message);
    }
});

// ============================================================
// MEMBERS MANAGEMENT
// ============================================================
let allMembersData = [];
let currentFilter = 'pending';

window.admin.loadMembers = async function(filter = 'pending') {
    currentFilter = filter;
    const tbody = document.getElementById('member-list');
    tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-8 text-center text-gray-400">Memuat data...</td></tr>`;

    try {
        const { data, error } = await window.supabaseClient
            .from('kelas_members')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        allMembersData = data || [];

        // Update pending badge
        const pendingCount = allMembersData.filter(m => m.status === 'pending').length;
        const badge = document.getElementById('pending-badge');
        if (badge) {
            if (pendingCount > 0) {
                badge.textContent = pendingCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        window.admin.renderMembers(filter);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-8 text-center text-red-500">Gagal memuat data: ${err.message}</td></tr>`;
    }
};

window.admin.filterMembers = function(status) {
    currentFilter = status;
    // Highlight active filter button
    document.querySelectorAll('.member-filter-btn').forEach(btn => {
        btn.className = 'member-filter-btn bg-gray-100 text-gray-600 border border-gray-300 px-4 py-1.5 rounded-full text-sm font-semibold';
    });
    const activeMap = {
        pending: 'filter-pending',
        active: 'filter-active',
        rejected: 'filter-rejected',
        all: 'filter-all'
    };
    const activeBtn = document.getElementById(activeMap[status]);
    if (activeBtn) activeBtn.className = 'member-filter-btn bg-navy text-white border border-navy px-4 py-1.5 rounded-full text-sm font-semibold';
    window.admin.renderMembers(status);
};

window.admin.renderMembers = function(filter) {
    const tbody = document.getElementById('member-list');
    const filtered = filter === 'all' ? allMembersData : allMembersData.filter(m => m.status === filter);

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-8 text-center text-gray-400">Tidak ada data dengan status "${filter}".</td></tr>`;
        return;
    }

    const statusMap = {
        pending: `<span class="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">⏳ Pending</span>`,
        active: `<span class="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">✅ Aktif</span>`,
        rejected: `<span class="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">❌ Ditolak</span>`
    };

    tbody.innerHTML = filtered.map(m => {
        const date = new Date(m.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const status = statusMap[m.status] || m.status;
        const actions = m.status === 'pending'
            ? `<button onclick="window.admin.approveMember('${m.id}')" class="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1 rounded mr-1 transition">✅ Terima</button>
               <button onclick="window.admin.rejectMember('${m.id}')" class="bg-red-500 hover:bg-red-400 text-white text-xs font-bold px-3 py-1 rounded transition">❌ Tolak</button>`
            : m.status === 'active'
            ? `<button onclick="window.admin.rejectMember('${m.id}')" class="bg-gray-400 hover:bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded transition">Cabut Akses</button>`
            : `<button onclick="window.admin.approveMember('${m.id}')" class="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1 rounded transition">✅ Aktifkan</button>`;

        return `
        <!-- Mobile Card -->
        <tr class="block md:hidden">
            <td colspan="6" class="p-0 border-b border-gray-200">
                <div class="bg-white p-4 space-y-2">
                    <div class="flex items-center justify-between">
                        <p class="font-semibold text-gray-900 text-sm">${m.full_name}</p>
                        ${status}
                    </div>
                    <p class="text-xs text-gray-500">${m.email}</p>
                    <div class="flex items-center justify-between">
                        <a href="https://wa.me/62${m.whatsapp.replace(/^0/, '')}" target="_blank" class="text-green-600 text-xs font-semibold">📞 ${m.whatsapp}</a>
                        <span class="text-xs text-gray-400">${date}</span>
                    </div>
                    <div class="flex gap-2 pt-1">${actions}</div>
                </div>
            </td>
        </tr>
        <!-- Desktop Row -->
        <tr class="hidden md:table-row hover:bg-gray-50">
            <td class="px-5 py-4 border-b border-gray-200 text-sm font-semibold">${m.full_name}</td>
            <td class="px-5 py-4 border-b border-gray-200 text-sm">${m.email}</td>
            <td class="px-5 py-4 border-b border-gray-200 text-sm">
                <a href="https://wa.me/62${m.whatsapp.replace(/^0/, '')}" target="_blank" class="text-green-600 hover:underline">📞 ${m.whatsapp}</a>
            </td>
            <td class="px-5 py-4 border-b border-gray-200 text-sm text-gray-500">${date}</td>
            <td class="px-5 py-4 border-b border-gray-200">${status}</td>
            <td class="px-5 py-4 border-b border-gray-200">${actions}</td>
        </tr>`;
    }).join('');
};

window.admin.approveMember = async function(id) {
    if (!confirm('Aktifkan akun member ini? Pastikan pembayaran sudah diterima.')) return;
    try {
        const { error } = await window.supabaseClient.from('kelas_members').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
        showStatus('✅ Akun member berhasil diaktifkan!');
        window.admin.loadMembers(currentFilter);
    } catch (err) {
        alert('Gagal mengaktifkan: ' + err.message);
    }
};

window.admin.rejectMember = async function(id) {
    if (!confirm('Tolak/cabut akses member ini?')) return;
    try {
        const { error } = await window.supabaseClient.from('kelas_members').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
        showStatus('Akses member berhasil dicabut.', false);
        window.admin.loadMembers(currentFilter);
    } catch (err) {
        alert('Gagal menolak: ' + err.message);
    }
};
