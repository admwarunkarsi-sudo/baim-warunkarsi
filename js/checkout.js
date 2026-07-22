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
    
    let isFreeAccess = false;
    const ORIGINAL_PRICE = 149000;
    
    // Simple hardcoded coupons for demo/team access
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
            
            // Update UI
            couponMessage.textContent = `Kupon berhasil diterapkan: ${coupon.label}`;
            couponMessage.className = 'coupon-message success';
            
            discountRow.style.display = 'flex';
            discountAmount.textContent = `-${formatRupiah(ORIGINAL_PRICE * coupon.discount)}`;
            
            const newTotal = ORIGINAL_PRICE - (ORIGINAL_PRICE * coupon.discount);
            totalPrice.textContent = formatRupiah(newTotal);
            
            if (isFreeAccess) {
                paymentSection.style.display = 'none';
                btnConfirm.textContent = 'Buat Akun & Masuk Kelas';
            }
        } else {
            isFreeAccess = false;
            couponMessage.textContent = 'Kode kupon tidak valid atau sudah kedaluwarsa.';
            couponMessage.className = 'coupon-message error';
            
            discountRow.style.display = 'none';
            totalPrice.textContent = formatRupiah(ORIGINAL_PRICE);
            paymentSection.style.display = 'block';
            btnConfirm.textContent = 'Konfirmasi Sudah Bayar';
        }
    });

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

        // Change button state
        const originalBtnText = btnConfirm.textContent;
        btnConfirm.textContent = 'Memproses...';
        btnConfirm.disabled = true;

        try {
            // Register user in Supabase
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                        whatsapp: wa
                    }
                }
            });

            if (error) {
                // If email already exists
                if (error.message.includes('already registered') || error.status === 422) {
                    throw new Error('Email ini sudah terdaftar. Silakan gunakan email lain atau langsung Login jika ini akun Anda.');
                }
                throw error;
            }

            // Success logic based on payment method
            if (isFreeAccess) {
                // Free access -> Redirect directly to member dashboard
                Swal.fire({
                    icon: 'success',
                    title: 'Pendaftaran Berhasil!',
                    text: 'Kupon berhasil digunakan. Anda akan diarahkan ke Member Area.',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = 'member';
                });
            } else {
                // Paid access -> Redirect to WhatsApp for manual verification
                const waNumber = '6285179660408'; // Admin WA number
                const text = `Halo Admin Baim,\n\nSaya sudah melakukan pembayaran untuk Kelas Kuliner via QRIS.\n\nNama: ${name}\nEmail: ${email}\n\nBerikut saya lampirkan bukti transfernya (TOLONG LAMPIRKAN GAMBAR BUKTI TRANSFER SEBELUM MENGIRIM PESAN INI).`;
                const encodedText = encodeURIComponent(text);
                const waUrl = `https://wa.me/${waNumber}?text=${encodedText}`;
                
                Swal.fire({
                    icon: 'success',
                    title: 'Akun Dibuat!',
                    html: 'Pendaftaran berhasil.<br><br><b>PENTING:</b><br>Sistem akan mengarahkan Anda ke WhatsApp Admin. Mohon kirimkan <b>Bukti Transfer QRIS</b> Anda agar akun bisa segera diaktifkan.',
                    confirmButtonText: 'Kirim Bukti via WhatsApp',
                    confirmButtonColor: '#25D366',
                    allowOutsideClick: false
                }).then(() => {
                    window.location.href = waUrl;
                });
            }
            
        } catch (error) {
            console.error('Checkout Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Pendaftaran Gagal',
                text: error.message || 'Terjadi kesalahan saat membuat akun. Silakan coba lagi.'
            });
            btnConfirm.textContent = originalBtnText;
            btnConfirm.disabled = false;
        }
    });
});
