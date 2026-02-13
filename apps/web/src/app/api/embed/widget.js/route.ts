import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/embed/widget.js?key=pk_live_xxx
// Serves the embeddable chat widget JavaScript
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key') || '';

    // Fetch product info for branding (using key prefix lookup)
    let productName = 'AI Assistant';
    let primaryColor = '#6366f1';
    let greeting = '';
    let agentName = '';

    if (apiKey) {
        // We need the hash to look up the key
        const crypto = await import('crypto');
        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

        const { data: keyRecord } = await supabase
            .from('product_api_keys')
            .select('product_id')
            .eq('key_hash', keyHash)
            .single();

        if (keyRecord) {
            const { data: product } = await supabase
                .from('products')
                .select('name, primary_color')
                .eq('id', keyRecord.product_id)
                .single();

            const { data: persona } = await supabase
                .from('agent_persona')
                .select('agent_name, greeting_message')
                .eq('product_id', keyRecord.product_id)
                .single();

            if (product) {
                productName = product.name;
                primaryColor = product.primary_color || '#6366f1';
            }
            if (persona) {
                agentName = persona.agent_name || productName;
                greeting = persona.greeting_message || '';
            }
        }
    }

    const widgetJS = generateWidgetScript({
        productName,
        primaryColor,
        greeting,
        agentName: agentName || productName,
    });

    return new NextResponse(widgetJS, {
        headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'public, max-age=300', // 5 min cache
            'Access-Control-Allow-Origin': '*',
        },
    });
}

function generateWidgetScript(config: {
    productName: string;
    primaryColor: string;
    greeting: string;
    agentName: string;
}): string {
    const { productName, primaryColor, greeting, agentName } = config;

    return `
(function() {
    'use strict';

    // Prevent double initialization
    if (window.__karrai_widget_loaded) return;
    window.__karrai_widget_loaded = true;

    // Configuration
    const script = document.currentScript || document.querySelector('script[data-karrai-key]');
    const API_KEY = script?.getAttribute('data-karrai-key') || '';
    const POSITION = script?.getAttribute('data-position') || 'bottom-right';
    const THEME = script?.getAttribute('data-theme') || 'light';
    const API_URL = script?.src ? new URL(script.src).origin + '/api/v1/chat' : '/api/v1/chat';
    const PRIMARY = '${primaryColor}';
    const AGENT_NAME = '${agentName.replace(/'/g, "\\'")}';
    const GREETING = '${greeting.replace(/'/g, "\\'")}';

    let sessionId = null;
    let isOpen = false;

    // ========================================
    // STYLES
    // ========================================
    const style = document.createElement('style');
    style.textContent = \`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        #karrai-widget * {
            margin: 0; padding: 0; box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        #karrai-bubble {
            position: fixed;
            \${POSITION.includes('right') ? 'right: 20px' : 'left: 20px'};
            \${POSITION.includes('top') ? 'top: 20px' : 'bottom: 20px'};
            width: 56px; height: 56px;
            border-radius: 50%;
            background: \${PRIMARY};
            box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 0 0 0 \${PRIMARY}40;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            z-index: 999998;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            animation: karrai-pulse 2s ease-in-out infinite;
        }

        #karrai-bubble:hover {
            transform: scale(1.08);
            box-shadow: 0 6px 28px rgba(0,0,0,0.2);
        }

        #karrai-bubble.karrai-open {
            transform: scale(0.9) rotate(90deg);
            animation: none;
        }

        @keyframes karrai-pulse {
            0%, 100% { box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 0 0 0 \${PRIMARY}30; }
            50% { box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 0 0 8px \${PRIMARY}00; }
        }

        #karrai-bubble svg {
            width: 24px; height: 24px; fill: white;
            transition: transform 0.3s ease;
        }

        #karrai-panel {
            position: fixed;
            \${POSITION.includes('right') ? 'right: 20px' : 'left: 20px'};
            \${POSITION.includes('top') ? 'top: 86px' : 'bottom: 86px'};
            width: 380px;
            max-height: 560px;
            border-radius: 16px;
            background: \${THEME === 'dark' ? '#1a1a2e' : '#ffffff'};
            box-shadow: 0 12px 48px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
            z-index: 999997;
            display: flex; flex-direction: column;
            overflow: hidden;
            opacity: 0; transform: translateY(16px) scale(0.95);
            pointer-events: none;
            transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        #karrai-panel.karrai-visible {
            opacity: 1; transform: translateY(0) scale(1);
            pointer-events: auto;
        }

        .karrai-header {
            padding: 16px 20px;
            background: \${PRIMARY};
            color: white;
            display: flex; align-items: center; gap: 12px;
        }

        .karrai-header-avatar {
            width: 36px; height: 36px; border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex; align-items: center; justify-content: center;
            font-weight: 600; font-size: 14px;
        }

        .karrai-header-info h3 {
            font-size: 15px; font-weight: 600; color: white;
        }

        .karrai-header-info p {
            font-size: 11px; opacity: 0.8; margin-top: 1px;
        }

        .karrai-messages {
            flex: 1; overflow-y: auto; padding: 16px;
            min-height: 200px; max-height: 380px;
            background: \${THEME === 'dark' ? '#12122a' : '#f8f7f5'};
        }

        .karrai-msg {
            margin-bottom: 12px; max-width: 85%;
            animation: karrai-fade-in 0.3s ease;
        }

        @keyframes karrai-fade-in {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .karrai-msg-bot {
            margin-right: auto;
        }

        .karrai-msg-user {
            margin-left: auto;
        }

        .karrai-msg-content {
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 13.5px; line-height: 1.5;
            word-wrap: break-word;
        }

        .karrai-msg-bot .karrai-msg-content {
            background: \${THEME === 'dark' ? '#252545' : '#ffffff'};
            color: \${THEME === 'dark' ? '#e0e0e0' : '#2d2d2d'};
            border-bottom-left-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .karrai-msg-user .karrai-msg-content {
            background: \${PRIMARY};
            color: white;
            border-bottom-right-radius: 4px;
        }

        .karrai-typing {
            display: flex; gap: 4px; padding: 10px 14px;
            background: \${THEME === 'dark' ? '#252545' : '#ffffff'};
            border-radius: 14px; border-bottom-left-radius: 4px;
            width: fit-content; margin-bottom: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .karrai-typing span {
            width: 6px; height: 6px; border-radius: 50%;
            background: \${THEME === 'dark' ? '#888' : '#b0b0b0'};
            animation: karrai-bounce 1.4s ease-in-out infinite;
        }

        .karrai-typing span:nth-child(2) { animation-delay: 0.2s; }
        .karrai-typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes karrai-bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-6px); }
        }

        .karrai-input-area {
            padding: 12px 16px;
            border-top: 1px solid \${THEME === 'dark' ? '#2a2a4a' : '#eee'};
            background: \${THEME === 'dark' ? '#1a1a2e' : '#ffffff'};
            display: flex; gap: 8px; align-items: center;
        }

        .karrai-input {
            flex: 1; border: 1px solid \${THEME === 'dark' ? '#3a3a5a' : '#e0e0e0'};
            border-radius: 10px; padding: 10px 14px;
            font-size: 13.5px; outline: none;
            background: \${THEME === 'dark' ? '#252545' : '#f8f7f5'};
            color: \${THEME === 'dark' ? '#e0e0e0' : '#2d2d2d'};
            transition: border-color 0.2s;
        }

        .karrai-input:focus {
            border-color: \${PRIMARY};
        }

        .karrai-input::placeholder {
            color: \${THEME === 'dark' ? '#666' : '#aaa'};
        }

        .karrai-send {
            width: 38px; height: 38px; border-radius: 10px;
            background: \${PRIMARY}; border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: opacity 0.2s, transform 0.15s;
        }

        .karrai-send:hover { opacity: 0.9; transform: scale(1.05); }
        .karrai-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .karrai-send svg {
            width: 16px; height: 16px; fill: white;
        }

        .karrai-powered {
            text-align: center; padding: 6px;
            font-size: 10px; color: \${THEME === 'dark' ? '#555' : '#bbb'};
            background: \${THEME === 'dark' ? '#1a1a2e' : '#ffffff'};
        }

        .karrai-powered a {
            color: inherit; text-decoration: none;
        }

        .karrai-powered a:hover { text-decoration: underline; }

        @media (max-width: 480px) {
            #karrai-panel {
                width: calc(100vw - 24px);
                right: 12px !important; left: 12px !important;
                max-height: 70vh;
                bottom: 76px !important;
            }
        }
    \`;
    document.head.appendChild(style);

    // ========================================
    // HTML
    // ========================================
    const container = document.createElement('div');
    container.id = 'karrai-widget';
    container.innerHTML = \`
        <div id="karrai-bubble" role="button" aria-label="Open chat" tabindex="0">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
        </div>
        <div id="karrai-panel">
            <div class="karrai-header">
                <div class="karrai-header-avatar">\${AGENT_NAME.charAt(0).toUpperCase()}</div>
                <div class="karrai-header-info">
                    <h3>\${AGENT_NAME}</h3>
                    <p>Online · Typically replies instantly</p>
                </div>
            </div>
            <div class="karrai-messages" id="karrai-messages"></div>
            <div class="karrai-input-area">
                <input class="karrai-input" id="karrai-input" type="text"
                    placeholder="Type your message..." autocomplete="off" />
                <button class="karrai-send" id="karrai-send" disabled aria-label="Send message">
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </div>
            <div class="karrai-powered">
                Powered by <a href="https://karrai.global" target="_blank" rel="noopener">KarrAI</a>
            </div>
        </div>
    \`;
    document.body.appendChild(container);

    // ========================================
    // LOGIC
    // ========================================
    const bubble = document.getElementById('karrai-bubble');
    const panel = document.getElementById('karrai-panel');
    const messagesEl = document.getElementById('karrai-messages');
    const inputEl = document.getElementById('karrai-input');
    const sendBtn = document.getElementById('karrai-send');

    // Toggle
    function toggle() {
        isOpen = !isOpen;
        bubble.classList.toggle('karrai-open', isOpen);
        panel.classList.toggle('karrai-visible', isOpen);
        if (isOpen) {
            inputEl.focus();
            if (messagesEl.children.length === 0 && GREETING) {
                addMessage('bot', GREETING);
            }
        }
    }

    bubble.addEventListener('click', toggle);
    bubble.addEventListener('keydown', (e) => { if (e.key === 'Enter') toggle(); });

    // Add message to chat
    function addMessage(type, text) {
        const div = document.createElement('div');
        div.className = 'karrai-msg karrai-msg-' + type;
        
        // Escape HTML entities first to prevent XSS
        let escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        
        // Simple markdown: bold, italic, code, newlines (applied AFTER escaping)
        let html = escaped
            .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
            .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
            .replace(/\\\`(.+?)\\\`/g, '<code style="background:#f0f0f0;padding:1px 4px;border-radius:3px;font-size:12px;">$1</code>')
            .replace(/\\n/g, '<br>');
        
        div.innerHTML = '<div class="karrai-msg-content">' + html + '</div>';
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'karrai-typing';
        div.id = 'karrai-typing';
        div.innerHTML = '<span></span><span></span><span></span>';
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function hideTyping() {
        const el = document.getElementById('karrai-typing');
        if (el) el.remove();
    }

    // Send message
    async function sendMessage() {
        const text = inputEl.value.trim();
        if (!text) return;

        addMessage('user', text);
        inputEl.value = '';
        sendBtn.disabled = true;
        showTyping();

        try {
            const resp = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + API_KEY,
                },
                body: JSON.stringify({
                    message: text,
                    session_id: sessionId,
                    visitor_id: getVisitorId(),
                }),
            });

            hideTyping();

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                addMessage('bot', err.error || 'Sorry, something went wrong. Please try again.');
                return;
            }

            const data = await resp.json();
            sessionId = data.session_id;
            addMessage('bot', data.response);
        } catch (err) {
            hideTyping();
            addMessage('bot', 'Connection error. Please check your internet and try again.');
        }

        sendBtn.disabled = !inputEl.value.trim();
    }

    // Input handlers
    inputEl.addEventListener('input', () => {
        sendBtn.disabled = !inputEl.value.trim();
    });

    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    // Anonymous visitor ID (persist across page loads)
    function getVisitorId() {
        let id = localStorage.getItem('karrai_visitor_id');
        if (!id) {
            id = 'v_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
            localStorage.setItem('karrai_visitor_id', id);
        }
        return id;
    }

    // Restore session from storage
    const savedSession = sessionStorage.getItem('karrai_session_' + API_KEY);
    if (savedSession) sessionId = savedSession;

    // Save session on message
    const origSend = sendMessage;
    const _wrapSend = sendMessage;

    // Persist session ID
    setInterval(() => {
        if (sessionId) {
            sessionStorage.setItem('karrai_session_' + API_KEY, sessionId);
        }
    }, 2000);

})();
`;
}
