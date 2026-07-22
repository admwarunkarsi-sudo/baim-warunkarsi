document.addEventListener('DOMContentLoaded', () => {
    const checkoutForm = document.getElementById('checkout-form');
    const btnApplyCoupon = document.getElementById('btn-apply-coupon');
    const couponInput = document.getElementById('coupon');
    const couponMessage = document.getElementById('coupon-message');
    const discountRow = document.getElementById('discount-row');
    const discountAmount = document.getElementById('discount-amount');
    const totalPrice = document.getElementById('total-price');
    const paymentSection = document.getElementById('payment-section');
    const btnConfirm = document.getElementById('btn-confirm');
    const countdownTimer = document.getElementById('countdown-timer');
    const btnSaveQris = document.getElementById('btn-save-qris');
    const qrisImage = document.getElementById('qris-image');

    // =========================================================
    // CONFIG
    // =========================================================
    const FONNTE_TOKEN = 'q5fXFifuQdFfhmRprTUs';
    const ADMIN_WA_NUMBER = '6285179660408';
    const ADMIN_WA_FOR_FONNTE = '085179660408';

    let isFreeAccess = false;
    const ORIGINAL_PRICE = 149000;

    // =========================================================
    // COUNTDOWN TIMER (15 menit)
    // =========================================================
    let timeRemaining = 15 * 60;
    let timerInterval;

    function startTimer() {
        timerInterval = setInterval(() => {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            if (countdownTimer) {
                countdownTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                if (countdownTimer) countdownTimer.textContent = '00:00';
                Swal.fire({
                    icon: 'warning',
                    title: 'Waktu Habis',
                    text: 'Waktu pembayaran Anda telah habis. Silakan muat ulang halaman untuk melanjutkan.',
                    confirmButtonText: 'Muat Ulang'
                }).then(() => window.location.reload());
            }
            timeRemaining--;
        }, 1000);
    }
    startTimer();

    // =========================================================
    // SIMPAN QRIS KE GALERI
    // =========================================================
    if (btnSaveQris && qrisImage) {
        btnSaveQris.addEventListener('click', () => {
            const link = document.createElement('a');
            link.href = qrisImage.src;
            link.download = 'QRIS_Baim_Warunk_Arsi.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'QRIS berhasil disimpan!', showConfirmButton: false, timer: 2000 });
        });
    }

    // =========================================================
    // KUPON
    // =========================================================
    const VALID_COUPONS = {
        'TEAMBAIM': { discount: 1, label: 'Diskon 100% (Akses Tim)' },
        'GRATIS100': { discount: 1, label: 'Diskon 100% (Akses Gratis)' }
    };

    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
    }

    btnApplyCoupon.addEventListener('click', () => {
        const code = couponInput.value.trim().toUpperCase();
        if (!code) {
            couponMessage.textContent = 'Masukkan kode kupon terlebih dahulu.';
            couponMessage.className = 'coupon-message error';
            return;
        }
        if (VALID_COUPONS[code]) {
            const coupon = VALID_COUPONS[code];
            isFreeAccess = coupon.discount === 1;
            couponMessage.textContent = `✅ Kupon berhasil: ${coupon.label}`;
            couponMessage.className = 'coupon-message success';
            discountRow.style.display = 'flex';
            discountAmount.textContent = `-${formatRupiah(ORIGINAL_PRICE * coupon.discount)}`;
            totalPrice.textContent = formatRupiah(ORIGINAL_PRICE - (ORIGINAL_PRICE * coupon.discount));
            if (isFreeAccess) {
                paymentSection.style.display = 'none';
                btnConfirm.textContent = 'Buat Akun & Masuk Kelas';
                clearInterval(timerInterval);
            }
        } else {
            isFreeAccess = false;
            couponMessage.textContent = '❌ Kode kupon tidak valid atau sudah kedaluwarsa.';
            couponMessage.className = 'coupon-message error';
            discountRow.style.display = 'none';
            totalPrice.textContent = formatRupiah(ORIGINAL_PRICE);
            paymentSection.style.display = 'block';
            btnConfirm.textContent = 'Konfirmasi Sudah Bayar';
            if (!timerInterval || timeRemaining <= 0) { timeRemaining = 15 * 60; startTimer(); }
        }
    });

    // =========================================================
    // FONNTE: Kirim notifikasi WA ke Admin
    // =========================================================
    async function sendFonnteNotification(name, email, wa) {
        const message = `🔔 *PENDAFTAR BARU - Kelas Kuliner*\n\nNama: *${name}*\nEmail: ${email}\nWhatsApp: ${wa}\n\nStatus: ⏳ Menunggu Verifikasi\n\n👉 Konfirmasi di:\nhttps://baim.warunkarsi.com/admin`;
        try {
            await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                headers: {
                    'Authorization': FONNTE_TOKEN,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    target: ADMIN_WA_FOR_FONNTE,
                    message: message,
                    countryCode: '62'
                })
            });
        } catch (err) {
            console.warn('Fonnte notification failed (non-critical):', err);
        }
    }

    // =========================================================
    // FORM SUBMIT
    // =========================================================
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const wa = document.getElementById('wa').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!name || !wa || !email || !password) {
            Swal.fire('Error', 'Mohon lengkapi semua data form.', 'error');
            return;
        }
        if (!window.supabaseClient) {
            Swal.fire('Error', 'Sistem sedang offline. Mohon refresh halaman.', 'error');
            return;
        }

        const originalBtnText = btnConfirm.textContent;
        btnConfirm.textContent = 'Memproses...';
        btnConfirm.disabled = true;

        try {
            // 1. Daftarkan akun di Supabase Auth
            const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: { data: { full_name: name, whatsapp: wa } }
            });

            if (authError) {
                if (authError.message.includes('already registered') || authError.status === 422) {
                    throw new Error('Email ini sudah terdaftar. Silakan gunakan email lain atau langsung Login.');
                }
                throw authError;
            }

            const userId = authData?.user?.id;
            const memberStatus = isFreeAccess ? 'active' : 'pending';

            // 2. Simpan ke tabel members
            const { error: dbError } = await window.supabaseClient
                .from('members')
                .insert({
                    user_id: userId,
                    full_name: name,
                    email: email,
                    whatsapp: wa,
                    status: memberStatus,
                    payment_method: isFreeAccess ? 'coupon' : 'qris'
                });

            if (dbError) console.warn('DB Insert error (non-critical):', dbError.message);

            // 3. Kirim notifikasi Fonnte ke admin (hanya untuk pendaftar berbayar)
            if (!isFreeAccess) {
                await sendFonnteNotification(name, email, wa);
            }

            // 4. Redirect
            if (isFreeAccess) {
                Swal.fire({
                    icon: 'success',
                    title: 'Pendaftaran Berhasil! 🎉',
                    text: 'Kupon berhasil digunakan. Anda akan diarahkan ke Member Area.',
                    timer: 2500,
                    showConfirmButton: false
                }).then(() => { window.location.href = '/member'; });
            } else {
                const text = `Halo Admin Baim,\n\nSaya sudah melakukan pembayaran untuk Kelas Kuliner via QRIS.\n\nNama: ${name}\nEmail: ${email}\n\n*Mohon lampirkan screenshot bukti transfer sebelum mengirim pesan ini.*`;
                const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(text)}`;

                Swal.fire({
                    icon: 'success',
                    title: 'Akun Berhasil Dibuat!',
                    html: `Terima kasih, <b>${name}</b>!<br><br>Silakan kirimkan <b>bukti transfer QRIS</b> Anda ke Admin via WhatsApp untuk mengaktifkan akun Anda.<br><br><small style="color:#6b7280;">Admin akan mengaktifkan akun Anda dalam waktu singkat.</small>`,
                    confirmButtonText: '📤 Kirim Bukti via WhatsApp',
                    confirmButtonColor: '#25D366',
                    allowOutsideClick: false
                }).then(() => { window.location.href = waUrl; });
            }

        } catch (error) {
            console.error('Checkout Error:', error);
            Swal.fire({ icon: 'error', title: 'Pendaftaran Gagal', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
            btnConfirm.textContent = originalBtnText;
            btnConfirm.disabled = false;
        }
    });
});
