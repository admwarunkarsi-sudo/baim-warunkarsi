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
            window.location.href = 'member';
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
                window.location.href = 'member';
            }

        } catch (error) {
            console.error('Login Error:', error.message);
            if (error.message === 'Invalid login credentials' || error.message.includes('Invalid')) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Belum Terdaftar',
                        text: 'Email belum terdaftar atau password salah. Silakan daftar Kelas Kuliner terlebih dahulu.',
                        confirmButtonText: 'Daftar Sekarang',
                        confirmButtonColor: '#f59e0b',
                        showCancelButton: true,
                        cancelButtonText: 'Batal'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = 'kelas-kuliner#pricing';
                        }
                    });
                } else {
                    alert('Email belum terdaftar atau password salah.\nSilakan daftar Kelas Kuliner terlebih dahulu.');
                    window.location.href = 'kelas-kuliner#pricing';
                }
            } else {
                errorMsg.textContent = error.message === 'Email not confirmed' ? 'Email belum dikonfirmasi. Periksa email Anda.' : error.message;
                errorMsg.style.display = 'block';
            }
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
