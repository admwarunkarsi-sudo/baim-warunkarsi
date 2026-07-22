document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const btnSubmit = document.getElementById('btn-submit');
    const errorMsg = document.getElementById('error-message');

    // Check if user is already logged in
    const checkSession = async () => {
        if (!window.supabaseClient) return;
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            window.location.href = 'member.html';
        }
    };
    checkSession();

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) return;

        // Visual feedback
        const originalText = btnSubmit.textContent;
        btnSubmit.textContent = 'Memproses...';
        btnSubmit.disabled = true;
        errorMsg.style.display = 'none';

        try {
            if (!window.supabaseClient) {
                throw new Error('Supabase SDK gagal dimuat. Pastikan Anda memiliki koneksi internet aktif, tidak menggunakan pemblokir iklan (AdBlocker) agresif, dan sudah melakukan Hard Refresh.');
            }

            // Attempt to login via Supabase Auth
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                throw error;
            }

            if (data.session) {
                // Login success, redirect to member area
                window.location.href = 'member.html';
            }

        } catch (error) {
            console.error('Login Error:', error.message);
            // Menampilkan pesan error asli dari Supabase agar jelas
            errorMsg.textContent = error.message === 'Email not confirmed' ? 'Email belum dikonfirmasi. Periksa email Anda atau aktifkan Auto-Confirm di Supabase.' : (error.message || 'Email atau password salah.');
            errorMsg.style.display = 'block';
        } finally {
            // Reset button state
            btnSubmit.textContent = originalText;
            btnSubmit.disabled = false;
        }
    });

    // Reveal animation
    setTimeout(() => {
        document.querySelector('.login-container').classList.add('active');
    }, 100);
});
