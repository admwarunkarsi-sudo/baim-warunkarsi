// js/member.js - v6

document.addEventListener('DOMContentLoaded', () => {

    // ============================================================
    // STATE
    // ============================================================
    let currentModules = [];
    let activeLessonId = null;
    let activeLessonModIdx = 0;
    let activeLessonIdx = 0;
    let currentUserId = null;
    let globalCompletedIds = new Set();
    let currentUserData = null;
    const CLOUDINARY_CLOUD = 'heswgpdc';
    const CLOUDINARY_PRESET = 'baim warunk arsi';

    // ============================================================
    // PANEL NAVIGATION
    // ============================================================
    const allPanels = ['panel-dashboard', 'panel-video', 'panel-download', 'panel-profile', 'panel-articles', 'panel-article-read'];

    function showPanel(panelId) {
        allPanels.forEach(p => {
            const el = document.getElementById(p);
            if (el) el.classList.add('hidden');
        });
        const target = document.getElementById(panelId);
        if (target) target.classList.remove('hidden');

        // Update active state on sidebar nav items
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    }

    document.getElementById('nav-dashboard').addEventListener('click', e => {
        e.preventDefault();
        showPanel('panel-dashboard');
        document.getElementById('nav-dashboard').classList.add('active');
        loadDashboard();
    });

    document.getElementById('nav-download').addEventListener('click', e => {
        e.preventDefault();
        showPanel('panel-download');
        document.getElementById('nav-download').classList.add('active');
        loadDownloadArea();
    });

    document.getElementById('nav-articles').addEventListener('click', e => {
        e.preventDefault();
        showPanel('panel-articles');
        document.getElementById('nav-articles').classList.add('active');
        loadMemberArticles();
    });

    document.getElementById('btn-back-articles').addEventListener('click', e => {
        e.preventDefault();
        showPanel('panel-articles');
        document.getElementById('nav-articles').classList.add('active');
    });

    document.getElementById('nav-community').addEventListener('click', async e => {
        e.preventDefault();
        try {
            const { data, error } = await window.supabaseClient
                .from('site_settings').select('value').eq('key', 'whatsapp_group_url').single();
            if (!error && data && data.value) {
                window.open(data.value, '_blank');
            } else {
                alert('Link grup komunitas belum diatur. Silakan hubungi admin.');
            }
        } catch (err) {
            alert('Gagal memuat link grup komunitas.');
        }
    });

    document.getElementById('btn-open-profile').addEventListener('click', e => {
        e.preventDefault();
        showPanel('panel-profile');
        loadProfile();
    });

    const btnOpenProfileMobile = document.getElementById('btn-open-profile-mobile');
    if (btnOpenProfileMobile) {
        btnOpenProfileMobile.addEventListener('click', e => {
            e.preventDefault();
            showPanel('panel-profile');
            loadProfile();
            const sidebar = document.getElementById('sidebar');
            if (sidebar.classList.contains('open')) sidebar.classList.remove('open');
        });
    }

    // ============================================================
    // AUTH CHECK
    // ============================================================
    const checkAuth = async () => {
        try {
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            if (error || !session) {
                alert('Sesi Anda telah berakhir atau Anda belum login. Silakan login kembali.');
                window.location.href = 'login';
                return false;
            }
            currentUserId = session.user.id;

            // FIX: Ensure user is recorded in kelas_members to appear in Admin Dashboard
            try {
                const { data: existingMember } = await window.supabaseClient
                    .from('kelas_members')
                    .select('user_id')
                    .eq('user_id', currentUserId)
                    .single();
                
                if (!existingMember) {
                    const fullName = session.user.user_metadata?.full_name || session.user.email.split('@')[0] || 'Member';
                    const phone = session.user.user_metadata?.whatsapp_number || session.user.user_metadata?.whatsapp || '';
                    
                    await window.supabaseClient.from('kelas_members').insert([{
                        user_id: currentUserId,
                        email: session.user.email,
                        full_name: fullName,
                        whatsapp: phone,
                        status: 'active',
                        payment_method: 'mayar'
                    }]);
                    
                    // Also ensure they are in users table
                    await window.supabaseClient.from('users').upsert({
                        id: currentUserId,
                        email: session.user.email,
                        full_name: fullName,
                        whatsapp_number: phone
                    });
                }
            } catch (memberErr) {
                console.error("Error auto-adding to kelas_members:", memberErr);
            }

            return true;
        } catch (err) {
            console.error('Auth error:', err);
            window.location.href = 'login';
            return false;
        }
    };

    // ============================================================
    // LOAD USER PROFILE (sidebar header)
    // ============================================================
    const loadUserProfile = async () => {
        if (!currentUserId) return;
        try {
            // Get auth session for email
            const { data: sessionData } = await window.supabaseClient.auth.getSession();
            const email = sessionData?.session?.user?.email || '';

            const { data, error } = await window.supabaseClient
                .from('users').select('full_name, email, avatar_url, whatsapp_number').eq('id', currentUserId).single();
            
            currentUserData = data || {};
            
            // Use full_name, or first part of email as fallback
            const emailName = email.split('@')[0] || 'Member';
            const displayName = (data && data.full_name) ? data.full_name : emailName;
            
            document.getElementById('profile-name-display').textContent = displayName;
            document.getElementById('dash-greeting').textContent = 'Selamat datang, ' + displayName + '!';

            // Set avatar
            const avatarUrl = (data && data.avatar_url) 
                ? data.avatar_url 
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E8A020&color=fff&size=80`;
            document.getElementById('profile-avatar-img').src = avatarUrl;
            
            const mobileAvatar = document.getElementById('mobile-profile-avatar-img');
            if (mobileAvatar) mobileAvatar.src = avatarUrl;

        } catch (err) {
            console.error('Error loading user profile:', err);
            document.getElementById('profile-name-display').textContent = 'Member';
        }
    };

    // ============================================================
    // LESSON LOADING
    // ============================================================
    const loadLesson = async (moduleIndex, lessonIndex) => {
        const module = currentModules[moduleIndex];
        const lesson = module.lessons[lessonIndex];
        if (!lesson) return;

        activeLessonId = lesson.id;
        activeLessonModIdx = moduleIndex;
        activeLessonIdx = lessonIndex;

        // Show video panel
        showPanel('panel-video');

        // Update active state in sidebar
        document.querySelectorAll('.lesson-item').forEach(el => el.classList.remove('active'));
        const activeLink = document.getElementById(`lesson-link-${lesson.id}`);
        if (activeLink) activeLink.classList.add('active');

        // Update Header
        document.getElementById('lesson-breadcrumb').innerHTML = `<a href="#">${module.title}</a> &rsaquo; ${lesson.title}`;
        document.getElementById('lesson-title').textContent = lesson.title;

        // Update Video Player
        const videoContainer = document.getElementById('video-container');
        if (lesson.video_provider === 'youtube_unlisted' || lesson.video_provider === 'youtube') {
            videoContainer.innerHTML = `<iframe width="100%" height="100%" style="border:none;" src="https://www.youtube.com/embed/${lesson.video_id}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        } else if (lesson.video_provider === 'vimeo') {
            videoContainer.innerHTML = `<iframe src="https://player.vimeo.com/video/${lesson.video_id}" width="100%" height="100%" style="border:none;" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
        } else {
            videoContainer.innerHTML = `<p style="padding:2rem;">Video tidak tersedia.</p>`;
        }

        // Update Description
        document.getElementById('tab-desc').innerHTML = lesson.content_body || '<p>Tidak ada deskripsi untuk materi ini.</p>';

        // Reset tabs
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector('[data-target="tab-desc"]').classList.add('active');
        document.getElementById('tab-desc').classList.add('active');

        // Fetch Attachments
        await fetchAttachments(lesson.id);

        // Fetch Discussions
        if (typeof window.loadDiscussions === 'function') {
            loadDiscussions(lesson.id);
        }

        // Setup "Tandai Selesai" button
        setupMarkComplete(moduleIndex, lessonIndex);
    };

    const fetchAttachments = async (lessonId) => {
        const attachmentContainer = document.getElementById('attachment-list-container');
        attachmentContainer.innerHTML = '<p>Memuat file...</p>';
        try {
            const { data: attachments, error } = await window.supabaseClient
                .from('attachments').select('*').eq('lesson_id', lessonId);
            if (error) throw error;

            if (attachments && attachments.length > 0) {
                const tabBtn = document.getElementById('tab-btn-resource');
                if (tabBtn) tabBtn.textContent = `Lampiran File (${attachments.length})`;
                let html = '';
                attachments.forEach(file => {
                    let icon = '&#128193;';
                    if (file.file_type === 'pdf') icon = '&#128196;';
                    else if (file.file_type === 'xlsx' || file.file_type === 'xls') icon = '&#128202;';
                    else if (file.file_type === 'url') icon = '&#128279;';
                    
                    const btnText = file.file_type === 'url' ? 'Lihat' : 'Unduh';
                    const targetAttr = file.file_type === 'url' ? '' : 'target="_blank"';
                    
                    html += `
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:0.5rem;background:#fff;">
                            <div style="display:flex;align-items:center;gap:1rem;">
                                <div style="font-size:1.5rem;">${icon}</div>
                                <div>
                                    <h4 style="margin:0;font-size:1rem;color:var(--text-dark);">${file.file_name}</h4>
                                    <p style="margin:0;font-size:0.85rem;color:var(--text-muted);">${(file.file_type === 'url' ? 'Link' : file.file_type || 'file').toUpperCase()}</p>
                                </div>
                            </div>
                            <a href="${file.file_url}" ${targetAttr} class="btn btn-outline" style="padding:0.5rem 1rem;">${btnText}</a>
                        </div>`;
                });
                attachmentContainer.innerHTML = html;
            } else {
                const tabBtn = document.getElementById('tab-btn-resource');
                if (tabBtn) tabBtn.textContent = 'Lampiran File';
                attachmentContainer.innerHTML = '<p style="color:var(--text-muted);">Tidak ada lampiran untuk materi ini.</p>';
            }
        } catch (err) {
            console.error('Error fetching attachments:', err);
            attachmentContainer.innerHTML = '<p style="color:red;">Gagal memuat lampiran.</p>';
        }
    };

    // ============================================================
    // MARK COMPLETE
    // ============================================================
    const setupMarkComplete = (modIdx, lesIdx) => {
        const btn = document.getElementById('btn-mark-complete');
        if (!btn) return;

        btn.onclick = async (e) => {
            e.preventDefault();
            if (!currentUserId || !activeLessonId) return;

            try {
                await window.supabaseClient.from('user_progress').upsert({
                    user_id: currentUserId,
                    lesson_id: activeLessonId,
                    is_completed: true,
                    completed_at: new Date().toISOString()
                }, { onConflict: 'user_id,lesson_id' });

                btn.innerHTML = '&#10003; Selesai!';
                btn.style.background = '#10b981';
                setTimeout(() => {
                    btn.innerHTML = 'Tandai Selesai &amp; Lanjut &#8594;';
                    btn.style.background = '';
                }, 2000);

                // Update local state and re-render sidebar to unlock next lesson
                globalCompletedIds.add(activeLessonId);
                renderSidebar(currentModules);

                // Auto navigate to next lesson
                const mod = currentModules[modIdx];
                if (lesIdx + 1 < mod.lessons.length) {
                    loadLesson(modIdx, lesIdx + 1);
                } else if (modIdx + 1 < currentModules.length && currentModules[modIdx + 1].lessons.length > 0) {
                    loadLesson(modIdx + 1, 0);
                } else {
                    // Last lesson of the course: re-apply active state since we just re-rendered sidebar
                    const link = document.getElementById(`lesson-link-${activeLessonId}`);
                    if (link) link.classList.add('active');
                }
            } catch (err) {
                console.error('Error marking complete:', err);
            }
        };
    };

    // ============================================================
    // ARTICLES
    // ============================================================
    let memberArticles = [];

    const loadMemberArticles = async () => {
        const container = document.getElementById('articles-container');
        container.innerHTML = '<p style="color:var(--text-muted);">Memuat artikel...</p>';
        try {
            const res = await fetch('https://baim-warunkarsi.vercel.app/api/articles');
            const data = await res.json();
            
            // Filter only member/both
            memberArticles = data.filter(a => a.visibility === 'member' || a.visibility === 'both');
            
            if (memberArticles.length === 0) {
                container.innerHTML = '<p style="color:var(--text-muted);">Belum ada artikel edukasi.</p>';
                return;
            }

            let html = '';
            memberArticles.forEach(a => {
                const img = a.image || 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105147/cjxn9nkbq9fk27itqs0z.png';
                html += `
                    <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;">
                        <img src="${img}" style="width:100%;height:160px;object-fit:cover;">
                        <div style="padding:1.5rem;flex:1;display:flex;flex-direction:column;">
                            <span style="font-size:0.75rem;font-weight:700;color:white;background:var(--accent-color);padding:0.25rem 0.5rem;border-radius:4px;align-self:flex-start;margin-bottom:0.75rem;">${a.tag || 'Artikel'}</span>
                            <h3 style="margin:0 0 0.5rem;font-size:1.1rem;color:var(--navy);font-weight:800;line-height:1.4;">${a.title}</h3>
                            <p style="margin:0 0 1.5rem;font-size:0.9rem;color:var(--text-muted);line-height:1.5;flex:1;">${a.excerpt}</p>
                            <button onclick="window.openMemberArticle('${a.slug}')" class="btn btn-outline" style="width:100%;text-align:center;">Baca Artikel</button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        } catch (err) {
            console.error('Error fetching articles:', err);
            container.innerHTML = '<p style="color:red;">Gagal memuat artikel.</p>';
        }
    };

    window.openMemberArticle = (slug) => {
        const a = memberArticles.find(x => x.slug === slug);
        if(!a) return;

        showPanel('panel-article-read');
        document.getElementById('nav-articles').classList.add('active');

        document.getElementById('ar-title').textContent = a.title;
        document.getElementById('ar-tag').textContent = a.tag || 'Artikel';
        document.getElementById('ar-date').textContent = a.date;
        
        if(a.image) {
            document.getElementById('ar-cover').src = a.image;
            document.getElementById('ar-cover').style.display = 'block';
        } else {
            document.getElementById('ar-cover').style.display = 'none';
        }

        let htmlContent = a.content || '';
        if (htmlContent && !htmlContent.startsWith('<') && window.marked) {
            htmlContent = marked.parse(htmlContent);
        }
        document.getElementById('ar-content').innerHTML = htmlContent || a.excerpt;

        // Render product link if any
        const prodCont = document.getElementById('ar-product-link');
        if (a.related_product) {
            fetch('https://baim-warunkarsi.vercel.app/api/products').then(r => r.json()).then(prods => {
                const prod = prods.find(p => p.id == a.related_product);
                if (prod) {
                    prodCont.innerHTML = `
                        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
                            <div>
                                <h4 style="margin:0 0 0.25rem;color:var(--navy);font-size:1.1rem;">Tertarik untuk praktik lebih dalam?</h4>
                                <p style="margin:0;color:var(--text-muted);font-size:0.9rem;">Dapatkan <strong>${prod.name}</strong> sekarang juga.</p>
                            </div>
                            <a href="checkout.html?product=${prod.id}" class="btn btn-primary">Beli Sekarang</a>
                        </div>
                    `;
                    prodCont.style.display = 'block';
                } else {
                    prodCont.style.display = 'none';
                }
            }).catch(() => {
                prodCont.style.display = 'none';
            });
        } else {
            prodCont.style.display = 'none';
        }

        // Load discussions
        window.loadArticleDiscussions(a.slug);
    };

    // --- Article Discussions ---
    window.loadArticleDiscussions = async function(articleSlug) {
        window.currentArticleSlug = articleSlug;
        const historyContainer = document.getElementById('ar-discussion-history');
        if (!historyContainer) return;
        historyContainer.innerHTML = '<p style="color:var(--text-muted);">Memuat diskusi...</p>';
        try {
            const { data, error } = await window.supabaseClient
                .from('article_discussions')
                .select('id, question, reply, created_at, users(full_name, email)')
                .eq('article_slug', articleSlug)
                .order('created_at', { ascending: false });
            
            if (error) {
                if (error.code === '42P01' || (error.message && error.message.toLowerCase().includes('relation'))) {
                    historyContainer.innerHTML = '<p style="color:var(--text-muted);font-style:italic;">Fitur diskusi artikel belum aktif (Tabel tidak ditemukan di Supabase).</p>';
                    return;
                }
                throw error;
            }

            if (!data || data.length === 0) {
                historyContainer.innerHTML = '<p style="color:var(--text-muted);font-style:italic;">Belum ada diskusi untuk artikel ini.</p>';
                return;
            }

            let html = '';
            data.forEach(d => {
                const name = d.users ? (d.users.full_name || d.users.email) : 'Member';
                const date = new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                let replyHtml = '';
                if (d.reply) {
                    replyHtml = `
                        <div style="margin-top:1rem;background:#f8fafc;border-left:4px solid var(--accent-color);padding:1rem;border-radius:0 8px 8px 0;">
                            <div style="font-weight:700;font-size:0.85rem;color:var(--navy);margin-bottom:0.25rem;">Admin membalas:</div>
                            <div style="font-size:0.9rem;color:#334155;line-height:1.5;">${d.reply.replace(/\\n/g, '<br>')}</div>
                        </div>
                    `;
                }
                html += `
                    <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:1.5rem;">
                        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
                            <div style="width:36px;height:36px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--text-muted);">${name.charAt(0).toUpperCase()}</div>
                            <div>
                                <div style="font-weight:700;font-size:0.95rem;color:var(--text-dark);">${name}</div>
                                <div style="font-size:0.8rem;color:var(--text-muted);">${date}</div>
                            </div>
                        </div>
                        <div style="font-size:0.95rem;line-height:1.6;color:#334155;">${d.question.replace(/\\n/g, '<br>')}</div>
                        ${replyHtml}
                    </div>
                `;
            });
            historyContainer.innerHTML = html;
        } catch (err) {
            console.error('Error fetching article discussions:', err);
            historyContainer.innerHTML = '<p style="color:red;">Gagal memuat diskusi.</p>';
        }
    };

    document.getElementById('ar-btn-submit-discussion').addEventListener('click', async () => {
        const input = document.getElementById('ar-discussion-input');
        const status = document.getElementById('ar-discussion-status');
        const text = input.value.trim();
        if (!text) {
            status.textContent = 'Masukkan pertanyaan terlebih dahulu!';
            status.style.color = 'red';
            return;
        }
        if (!currentUserId || !window.currentArticleSlug) {
            status.textContent = 'Silakan login terlebih dahulu.';
            status.style.color = 'red';
            return;
        }
        status.textContent = 'Mengirim pertanyaan...';
        status.style.color = 'var(--text-muted)';
        
        try {
            const { error } = await window.supabaseClient.from('article_discussions').insert([{
                user_id: currentUserId,
                article_slug: window.currentArticleSlug,
                question: text
            }]);
            if (error) {
                if (error.code === '42P01') throw new Error('Fitur diskusi artikel belum aktif (Tabel tidak ditemukan)');
                throw error;
            }
            status.textContent = 'Pertanyaan berhasil dikirim!';
            status.style.color = '#10b981';
            input.value = '';
            setTimeout(() => { status.textContent = ''; }, 3000);
            window.loadArticleDiscussions(window.currentArticleSlug);
        } catch (err) {
            console.error('Submit article discussion error:', err);
            status.textContent = 'Gagal mengirim pertanyaan: ' + err.message;
            status.style.color = 'red';
        }
    });

    // ============================================================
    // RENDER SIDEBAR
    // ============================================================
    const renderSidebar = (modules) => {
        const container = document.getElementById('module-list-container');
        let html = '';
        let isLocked = false;
        
        modules.forEach((mod, modIndex) => {
            html += `
                <div class="nav-item" style="font-weight:600;cursor:default;margin-top:1rem;color:var(--text-dark);border-left:3px solid transparent;">
                    <span class="icon">&#128230;</span><span>${mod.title}</span>
                </div>`;
            if (mod.lessons && mod.lessons.length > 0) {
                html += `<div style="display:flex;flex-direction:column;">`;
                mod.lessons.forEach((lesson, lessonIndex) => {
                    const completed = globalCompletedIds.has(lesson.id);
                    
                    if (isLocked) {
                        html += `
                        <div class="nav-item lesson-item-locked" style="padding-left:3rem;font-size:0.9rem;min-height:2.5rem;border-left:3px solid transparent;opacity:0.5;cursor:not-allowed;">
                            <span class="icon" style="font-size:0.8rem;margin-right:0.5rem;">&#128274;</span>
                            <span>${lesson.title}</span>
                        </div>`;
                    } else {
                        html += `
                        <a href="#" class="nav-item lesson-item" id="lesson-link-${lesson.id}" data-mod="${modIndex}" data-les="${lessonIndex}" style="padding-left:3rem;font-size:0.9rem;min-height:2.5rem;border-left:3px solid transparent;">
                            <span class="icon" style="font-size:0.8rem;margin-right:0.5rem;">&#9654;</span>
                            <span>${lesson.title}</span>
                        </a>`;
                    }
                    
                    if (!completed) {
                        isLocked = true;
                    }
                });
                html += `</div>`;
            }
        });
        container.innerHTML = html;

        // Click events (only unlocked lessons have .lesson-item class)
        document.querySelectorAll('.lesson-item').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const mIdx = parseInt(el.getAttribute('data-mod'));
                const lIdx = parseInt(el.getAttribute('data-les'));
                loadLesson(mIdx, lIdx);
                const sidebar = document.getElementById('sidebar');
                if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            });
        });
    };

    // ============================================================
    // FETCH COURSE DATA
    // ============================================================
    const fetchCourseData = async () => {
        try {
            const { data: modules, error } = await window.supabaseClient
                .from('modules')
                .select(`id, title, order_index, lessons(id, title, video_provider, video_id, content_body, order_index, is_preview)`)
                .order('order_index', { ascending: true })
                .order('order_index', { foreignTable: 'lessons', ascending: true });

            if (error) throw error;

            if (modules && modules.length > 0) {
                currentModules = modules;
                
                // Fetch progress first for locking logic
                if (currentUserId) {
                    const { data: progress } = await window.supabaseClient
                        .from('user_progress')
                        .select('lesson_id')
                        .eq('user_id', currentUserId)
                        .eq('is_completed', true);
                    if (progress) {
                        globalCompletedIds = new Set(progress.map(p => p.lesson_id));
                    }
                }

                renderSidebar(modules);
                // Tampilkan Dashboard sebagai halaman utama
                showPanel('panel-dashboard');
                document.getElementById('nav-dashboard').classList.add('active');
                loadDashboard();
            } else {
                document.getElementById('module-list-container').innerHTML = '<p style="padding:1rem;color:var(--text-muted);">Belum ada modul tersedia.</p>';
            }
        } catch (err) {
            console.error('Error fetching course data:', err);
            document.getElementById('module-list-container').innerHTML = '<p style="padding:1rem;color:red;">Gagal memuat modul.</p>';
        }
    };

    // ============================================================
    // DASHBOARD
    // ============================================================
    const loadDashboard = async () => {
        if (!currentUserId || currentModules.length === 0) return;

        // Count total lessons
        let totalLessons = 0;
        currentModules.forEach(m => { if (m.lessons) totalLessons += m.lessons.length; });

        try {
            const { data: progress, error } = await window.supabaseClient
                .from('user_progress')
                .select('lesson_id, is_completed')
                .eq('user_id', currentUserId)
                .eq('is_completed', true);

            if (error) throw error;

            const completedCount = progress ? progress.length : 0;
            const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

            document.getElementById('stat-total-lessons').textContent = totalLessons;
            document.getElementById('stat-completed').textContent = completedCount;
            document.getElementById('stat-progress').textContent = pct + '%';

            const completedIds = new Set((progress || []).map(p => p.lesson_id));

            // Per-module progress bars
            let modHtml = '';
            currentModules.forEach(mod => {
                const total = mod.lessons ? mod.lessons.length : 0;
                if (total === 0) return;
                const done = mod.lessons.filter(l => completedIds.has(l.id)).length;
                const modPct = Math.round((done / total) * 100);
                modHtml += `
                    <div style="margin-bottom:1.25rem;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem;">
                            <span style="font-weight:600;font-size:0.95rem;">${mod.title}</span>
                            <span style="font-size:0.85rem;color:var(--text-muted);">${done}/${total} materi</span>
                        </div>
                        <div style="background:#e2e8f0;border-radius:99px;height:8px;overflow:hidden;">
                            <div style="background:${modPct === 100 ? '#10b981' : 'var(--accent-color)'};height:100%;border-radius:99px;width:${modPct}%;transition:width 0.5s;"></div>
                        </div>
                    </div>`;
            });
            document.getElementById('dash-module-progress').innerHTML = modHtml || '<p style="color:var(--text-muted);">Belum ada data progress.</p>';

            // Continue card
            let nextLesson = null;
            let nextMod = null;
            outer: for (const mod of currentModules) {
                for (const lesson of (mod.lessons || [])) {
                    if (!completedIds.has(lesson.id)) {
                        nextLesson = lesson;
                        nextMod = mod;
                        break outer;
                    }
                }
            }
            if (nextLesson) {
                document.getElementById('dash-continue-card').style.display = 'block';
                document.getElementById('dash-continue-title').textContent = `${nextMod.title} > ${nextLesson.title}`;
                document.getElementById('dash-continue-btn').onclick = () => {
                    const modIdx = currentModules.indexOf(nextMod);
                    const lesIdx = nextMod.lessons.indexOf(nextLesson);
                    loadLesson(modIdx, lesIdx);
                };
            }
        } catch (err) {
            console.error('Error loading dashboard:', err);
        }
    };

    // ============================================================
    // DOWNLOAD AREA
    // ============================================================
    const loadDownloadArea = async () => {
        // --- Lampiran per bab ---
        const attContainer = document.getElementById('download-attachments');
        attContainer.innerHTML = '<p style="color:var(--text-muted);">Memuat...</p>';
        try {
            const { data, error } = await window.supabaseClient
                .from('attachments')
                .select('*, lessons(title, modules(title))');
            if (error) throw error;

            if (!data || data.length === 0) {
                attContainer.innerHTML = '<p style="color:var(--text-muted);font-style:italic;">Belum ada lampiran materi.</p>';
            } else {
                let html = '';
                data.forEach(att => {
                    const lesTitle = att.lessons ? att.lessons.title : '-';
                    const modTitle = att.lessons && att.lessons.modules ? att.lessons.modules.title : '-';
                    let icon = '&#128193;';
                    if (att.file_type === 'pdf') icon = '&#128196;';
                    else if (att.file_type === 'xlsx' || att.file_type === 'xls') icon = '&#128202;';
                    else if (att.file_type === 'url') icon = '&#128279;';
                    
                    const btnText = att.file_type === 'url' ? 'Lihat' : 'Unduh';
                    const targetAttr = att.file_type === 'url' ? '' : 'target="_blank"';
                    
                    html += `
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:0.5rem;background:#f8fafc;">
                            <div style="display:flex;align-items:center;gap:1rem;">
                                <div style="font-size:1.5rem;">${icon}</div>
                                <div>
                                    <h4 style="margin:0;font-size:0.95rem;color:var(--text-dark);">${att.file_name}</h4>
                                    <p style="margin:0;font-size:0.8rem;color:var(--text-muted);">${modTitle} &rsaquo; ${lesTitle}</p>
                                </div>
                            </div>
                            <a href="${att.file_url}" ${targetAttr} class="btn btn-outline" style="padding:0.5rem 1rem;white-space:nowrap;">${btnText}</a>
                        </div>`;
                });
                attContainer.innerHTML = html;
            }
        } catch (err) {
            attContainer.innerHTML = '<p style="color:red;">Gagal memuat lampiran.</p>';
        }

        // --- File Bonus ---
        const bonusContainer = document.getElementById('download-bonus');
        bonusContainer.innerHTML = '<p style="color:var(--text-muted);">Memuat...</p>';
        try {
            const { data: bonusFiles, error: bonusErr } = await window.supabaseClient
                .from('bonus_files').select('*').order('created_at', { ascending: false });
            if (bonusErr) throw bonusErr;

            if (!bonusFiles || bonusFiles.length === 0) {
                bonusContainer.innerHTML = '<p style="color:var(--text-muted);font-style:italic;">Belum ada file bonus tersedia.</p>';
            } else {
                let html = '';
                bonusFiles.forEach(f => {
                    html += `
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:0.5rem;background:#fffbeb;">
                            <div>
                                <h4 style="margin:0;font-size:0.95rem;color:var(--text-dark);">&#127873; ${f.title}</h4>
                                ${f.description ? `<p style="margin:0;font-size:0.8rem;color:var(--text-muted);">${f.description}</p>` : ''}
                            </div>
                            <a href="${f.file_url}" target="_blank" class="btn btn-primary" style="padding:0.5rem 1rem;white-space:nowrap;">Unduh</a>
                        </div>`;
                });
                bonusContainer.innerHTML = html;
            }
        } catch (err) {
            bonusContainer.innerHTML = '<p style="color:red;">Gagal memuat file bonus.</p>';
        }
    };

    // ============================================================
    // PROFILE
    // ============================================================
    const loadProfile = async () => {
        if (!currentUserId) return;
        try {
            const { data: sessionData } = await window.supabaseClient.auth.getSession();
            const email = sessionData?.session?.user?.email || '';
            document.getElementById('profile-email').value = email;

            const { data, error } = await window.supabaseClient
                .from('users').select('full_name, whatsapp_number, avatar_url').eq('id', currentUserId).single();
            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                document.getElementById('profile-fullname').value = data.full_name || '';
                document.getElementById('profile-wa').value = data.whatsapp_number || '';
                // Populate display name + email beside avatar
                const displayName = data.full_name || email.split('@')[0] || 'Member';
                const nameEl = document.getElementById('profile-display-name');
                const emailEl = document.getElementById('profile-display-email');
                if (nameEl) nameEl.textContent = displayName;
                if (emailEl) emailEl.textContent = email;
                if (data.avatar_url) {
                    document.getElementById('profile-big-avatar').src = data.avatar_url;
                } else {
                    const name = data.full_name || email || 'M';
                    document.getElementById('profile-big-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E8A020&color=fff&size=120`;
                }
            } else {
                // No profile data yet, still show email
                const nameEl = document.getElementById('profile-display-name');
                const emailEl = document.getElementById('profile-display-email');
                if (nameEl) nameEl.textContent = email.split('@')[0] || 'Member';
                if (emailEl) emailEl.textContent = email;
            }
        } catch (err) {
            console.error('Error loading profile:', err);
        }
    };

    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusEl = document.getElementById('profile-status');
        statusEl.textContent = 'Menyimpan...';
        statusEl.style.color = 'gray';

        const fullName = document.getElementById('profile-fullname').value;
        const wa = document.getElementById('profile-wa').value;

        try {
            const { error } = await window.supabaseClient.from('users').update({
                full_name: fullName,
                whatsapp_number: wa
            }).eq('id', currentUserId);

            if (error) throw error;

            statusEl.innerHTML = '&#10003; Perubahan berhasil disimpan!';
            statusEl.style.color = '#10b981';

            // Update sidebar name and profile card display name
            document.getElementById('profile-name-display').textContent = fullName;
            document.getElementById('dash-greeting').textContent = 'Selamat datang, ' + fullName + '!';
            const displayNameEl = document.getElementById('profile-display-name');
            if (displayNameEl) displayNameEl.textContent = fullName;

            setTimeout(() => { statusEl.textContent = ''; }, 4000);
        } catch (err) {
            console.error('Error saving profile:', err);
            statusEl.textContent = 'Gagal menyimpan: ' + err.message;
            statusEl.style.color = 'red';
        }
    });

    // Avatar Upload to Cloudinary
    document.getElementById('avatar-upload').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const statusEl = document.getElementById('avatar-upload-status');
        statusEl.textContent = 'Mengupload foto...';
        statusEl.style.color = 'gray';

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_PRESET);
            formData.append('folder', 'member-avatars');

            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
                method: 'POST',
                body: formData
            });
            const result = await res.json();

            if (!result.secure_url) throw new Error(result.error?.message || 'Upload gagal');

            // Save URL to Supabase
            const { error } = await window.supabaseClient.from('users').update({
                avatar_url: result.secure_url
            }).eq('id', currentUserId);

            if (error) throw error;

            // Update all avatars on page
            document.getElementById('profile-big-avatar').src = result.secure_url;
            document.getElementById('profile-avatar-img').src = result.secure_url;
            const mobileAvatar = document.getElementById('mobile-profile-avatar-img');
            if (mobileAvatar) mobileAvatar.src = result.secure_url;

            statusEl.innerHTML = '&#10003; Foto profil berhasil diperbarui!';
            statusEl.style.color = '#10b981';
            setTimeout(() => { statusEl.textContent = ''; }, 4000);
        } catch (err) {
            console.error('Avatar upload error:', err);
            statusEl.textContent = 'Gagal upload: ' + err.message;
            statusEl.style.color = 'red';
        }
    });

    // ============================================================
    // DISCUSSIONS
    // ============================================================
    window.loadDiscussions = async function(lessonId) {
        const historyContainer = document.getElementById('discussion-history');
        if (!historyContainer) return;
        historyContainer.innerHTML = '<p style="color:var(--text-muted);">Memuat diskusi...</p>';
        try {
            const { data, error } = await window.supabaseClient
                .from('discussions')
                .select('id, question, reply, created_at, users(full_name, email)')
                .eq('lesson_id', lessonId)
                .order('created_at', { ascending: false });
            if (error) throw error;

            if (!data || data.length === 0) {
                historyContainer.innerHTML = '<p style="color:var(--text-muted);font-style:italic;">Belum ada pertanyaan untuk materi ini.</p>';
                return;
            }

            let html = '';
            data.forEach(d => {
                const name = d.users ? (d.users.full_name || d.users.email) : 'Member';
                const date = new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                let replyHtml = '';
                if (d.reply) {
                    replyHtml = `
                        <div style="margin-top:1rem;background:#f0fdf4;padding:1rem;border-left:4px solid #10b981;border-radius:4px;">
                            <div style="font-size:0.8rem;font-weight:bold;color:#10b981;margin-bottom:0.25rem;">Admin Warunk Arsi:</div>
                            <p style="margin:0;font-size:0.95rem;color:#334155;line-height:1.5;">${d.reply.replace(/\n/g, '<br>')}</p>
                        </div>`;
                }
                html += `
                    <div style="border-bottom:1px solid #e2e8f0;padding-bottom:1.5rem;">
                        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:0.5rem;">
                            <div style="font-weight:600;color:var(--navy);">${name}</div>
                            <div style="font-size:0.8rem;color:#94a3b8;">${date}</div>
                        </div>
                        <p style="margin:0;color:#475569;line-height:1.5;font-size:0.95rem;">${d.question.replace(/\n/g, '<br>')}</p>
                        ${replyHtml}
                    </div>`;
            });
            historyContainer.innerHTML = html;
        } catch (err) {
            console.error(err);
            historyContainer.innerHTML = '<p style="color:red;">Gagal memuat diskusi.</p>';
        }
    };

    document.getElementById('btn-submit-discussion').addEventListener('click', async () => {
        const input = document.getElementById('discussion-input');
        const status = document.getElementById('discussion-status');
        const question = input.value.trim();

        if (!question) {
            status.textContent = 'Mohon ketikkan pertanyaan terlebih dahulu.';
            status.style.color = 'red';
            return;
        }
        if (!activeLessonId) {
            status.textContent = 'Silakan pilih materi terlebih dahulu.';
            status.style.color = 'orange';
            return;
        }

        const btnDisc = document.getElementById('btn-submit-discussion');
        btnDisc.disabled = true;
        status.textContent = 'Mengirim...';
        status.style.color = 'gray';

        try {
            const { error } = await window.supabaseClient.from('discussions')
                .insert([{ lesson_id: activeLessonId, user_id: currentUserId, question: question }]);
            if (error) throw error;

            input.value = '';
            status.innerHTML = '&#10003; Pertanyaan berhasil dikirim! Admin akan segera membalasnya.';
            status.style.color = '#10b981';
            setTimeout(() => { status.textContent = ''; }, 5000);
            loadDiscussions(activeLessonId);
        } catch (err) {
            console.error(err);
            status.textContent = 'Gagal mengirim: ' + err.message;
            status.style.color = 'red';
        } finally {
            btnDisc.disabled = false;
        }
    });

    // ============================================================
    // TAB NAVIGATION (Video Panel)
    // ============================================================
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // ============================================================
    // MOBILE HAMBURGER
    // ============================================================
    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('sidebar');
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
        document.querySelector('.main-content').addEventListener('click', () => {
            if (sidebar.classList.contains('open')) sidebar.classList.remove('open');
        });
    }

    // ============================================================
    // LOGOUT
    // ============================================================
    document.getElementById('btn-logout').addEventListener('click', async (e) => {
        e.preventDefault();
        await window.supabaseClient.auth.signOut();
        window.location.href = 'login';
    });

    // ============================================================
    // INIT
    // ============================================================
    checkAuth().then(success => {
        if (success) {
            loadUserProfile();
            fetchCourseData();
        }
    });

});
