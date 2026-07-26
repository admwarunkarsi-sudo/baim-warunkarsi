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

    let chatHistory = [];

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

        const addMessageToUI = (role, text) => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${role}`;
            
            // Convert simple markdown (bold) to HTML and preserve line breaks
            let formattedText = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="chat-btn-link">$1</a>')
                .replace(/\n/g, '<br>');

            msgDiv.innerHTML = formattedText;
            chatBody.appendChild(msgDiv);
            chatBody.scrollTop = chatBody.scrollHeight;
        };

        const sendMessage = async () => {
            const text = chatInput.value.trim();
            if (!text) return;

            // Add user message to UI
            addMessageToUI('user', text);
            
            // Add to history
            chatHistory.push({ role: 'user', content: text });
            
            chatInput.value = '';
            chatInput.disabled = true;
            sendChat.disabled = true;

            // Show typing indicator
            const typingId = 'typing-' + Date.now();
            const typingEl = document.createElement('div');
            typingEl.id = typingId;
            typingEl.className = 'chat-typing';
            typingEl.style.display = 'block';
            typingEl.textContent = 'Kang Baim AI sedang mengetik...';
            chatBody.appendChild(typingEl);
            chatBody.scrollTop = chatBody.scrollHeight;

            try {
                // Determine backend URL
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                const apiUrl = isLocal ? 'http://localhost:3000/api/chat-public' : 'https://baim-warunkarsi.vercel.app/api/chat-public';

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        history: chatHistory.slice(0, -1), // Exclude the message just added
                        message: text
                    })
                });

                // Remove typing indicator
                const typingToRemove = document.getElementById(typingId);
                if (typingToRemove) typingToRemove.remove();

                if (!response.ok) {
                    throw new Error('Server error');
                }

                const data = await response.json();
                
                // Add AI response to UI
                addMessageToUI('bot', data.reply);
                
                // Add to history
                chatHistory.push({ role: 'model', content: data.reply });

            } catch (error) {
                console.error('Chat error:', error);
                
                // Remove typing indicator
                const typingToRemove = document.getElementById(typingId);
                if (typingToRemove) typingToRemove.remove();
                
                addMessageToUI('bot', 'Maaf kang, koneksi lagi bermasalah nih. Coba refresh atau tanya lagi nanti ya! 🙏');
            } finally {
                chatInput.disabled = false;
                sendChat.disabled = false;
                chatInput.focus();
            }
        };

        sendChat.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
});
