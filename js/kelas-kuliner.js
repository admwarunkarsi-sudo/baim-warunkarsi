document.addEventListener('DOMContentLoaded', () => {
    // Accordion Logic
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const content = item.querySelector('.accordion-content');
            
            // Toggle open class
            item.classList.toggle('open');
            
            // Note: max-height is handled by CSS based on .active class
            // but we can also do it via JS for precise heights if needed.
            // For now, CSS max-height transition handles it.
        });
    });

    // WhatsApp Checkout Logic
    const btnWa = document.getElementById('btn-checkout-wa');
    if(btnWa) {
        btnWa.addEventListener('click', (e) => {
            e.preventDefault();
            const phoneNumber = '6285179660408'; // Ganti dengan nomor WA admin
            const message = 'Halo Kang Baim, saya tertarik bergabung di Kelas Digital Marketing F&B. Mohon info pendaftaran dan metode pembayarannya. Terima kasih!';
            const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(waUrl, '_blank');
        });
    }

    // Demo Login Logic removed since we use actual login.html now

    // Scroll Reveal Animation (copied from main.js)
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

    // Navbar Background on Scroll
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
            }
        });
    }
});
