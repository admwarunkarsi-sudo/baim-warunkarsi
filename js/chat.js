document.addEventListener('DOMContentLoaded', () => {
    // Chat Widget Logic
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const iconOpen = document.getElementById('chat-icon-open');
    const iconClose = document.getElementById('chat-icon-close');
    const chatInput = document.getElementById('chat-input');
    const sendChat = document.getElementById('send-chat');
    const chatBody = document.getElementById('chat-body');

    let isFirstMessage = true;

    if (chatToggle && chatWindow) {
        const toggleChat = () => {
            chatWindow.classList.toggle('hidden');
            iconOpen.classList.toggle('hidden');
            iconClose.classList.toggle('hidden');
            if (!chatWindow.classList.contains('hidden')) {
                chatInput.focus();
            }
        };

        chatToggle.addEventListener('click', toggleChat);
        closeChat.addEventListener('click', toggleChat);

        const sendMessage = () => {
            const text = chatInput.value.trim();
            if (!text) return;

            // Add user message
            const userMsg = document.createElement('div');
            userMsg.className = 'chat-message user';
            userMsg.textContent = text;
            chatBody.appendChild(userMsg);
            
            chatInput.value = '';
            chatBody.scrollTop = chatBody.scrollHeight;

            if (isFirstMessage) {
                isFirstMessage = false;
                
                // Bot typing simulation
                const botTyping = document.createElement('div');
                botTyping.className = 'chat-message bot';
                botTyping.textContent = 'Mengetik...';
                chatBody.appendChild(botTyping);
                chatBody.scrollTop = chatBody.scrollHeight;

                setTimeout(() => {
                    chatBody.removeChild(botTyping);
                    
                    const botReply = document.createElement('div');
                    botReply.className = 'chat-message bot';
                    
                    const waLink = `https://wa.me/6285179660408?text=${encodeURIComponent(text)}`;
                    botReply.innerHTML = `Siap, Kak! Pesan Kakak sudah saya terima. Agar Baim bisa memberikan respon lebih lengkap, mari kita lanjutkan obrolan ini via WhatsApp ya! 😊<br><br><a href="${waLink}" target="_blank" style="display:inline-block; background-color:#20c997; color:white; padding:8px 12px; border-radius:15px; text-decoration:none; font-weight:bold; font-size:0.85rem; width:100%; text-align:center; margin-top:8px;">Lanjut ke WhatsApp</a>`;
                    
                    chatBody.appendChild(botReply);
                    chatBody.scrollTop = chatBody.scrollHeight;
                }, 1000);
            }
        };

        sendChat.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
});
