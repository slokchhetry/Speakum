// App State
const state = {
    currentUser: null,
    currentRoom: null,
    rooms: [],
    messages: [],
    members: []
};

// Theme configurations
const themes = {
    meme: {
        primary: '#9c27b0',
        secondary: '#f3e5f5',
        emoji: ['🤣', '😎', '🔥', '💯', '🎮']
    },
    dating: {
        primary: '#e91e63',
        secondary: '#fce4ec',
        emoji: ['❤️', '😊', '😘', '🌹', '✨']
    },
    normal: {
        primary: '#2196f3',
        secondary: '#e3f2fd',
        emoji: ['👍', '😊', '👋', '🎉', '💡']
    },
    gaming: {
        primary: '#4caf50',
        secondary: '#e8f5e9',
        emoji: ['🎮', '🎲', '🏆', '⚔️', '🎯']
    },
    space: {
        primary: '#3f51b5',
        secondary: '#e8eaf6',
        emoji: ['🚀', '🌎', '👽', '⭐', '🌌']
    }
};

// DOM Elements
const pages = {
    landing: document.getElementById('landing-page'),
    dashboard: document.getElementById('dashboard'),
    chatroom: document.getElementById('chatroom')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    showPage('landing');
});

function initializeEventListeners() {
    // Auth event listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
    
    // Chat input
    const messageInput = document.getElementById('message-input');
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    document.querySelector('.send-btn').addEventListener('click', sendMessage);
    document.querySelector('.emoji-btn').addEventListener('click', toggleEmojiPicker);
    document.querySelector('.attachment-btn').addEventListener('click', handleAttachment);
    
    // Room controls
    document.getElementById('create-room-btn').addEventListener('click', showCreateRoomModal);
    document.querySelector('.members-btn').addEventListener('click', toggleMembersSidebar);
    document.querySelector('.pin-btn').addEventListener('click', togglePinnedMessages);
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

// Authentication Functions
function handleLogin(e) {
    e.preventDefault();
    const email = e.target.elements[0].value;
    const password = e.target.elements[1].value;
    
    // Simulate login (replace with actual authentication)
    state.currentUser = {
        id: Date.now(),
        username: email.split('@')[0],
        email: email
    };
    
    showPage('dashboard');
    loadDashboard();
}

function handleSignup(e) {
    e.preventDefault();
    const username = e.target.elements[0].value;
    const email = e.target.elements[1].value;
    const password = e.target.elements[2].value;
    
    // Simulate signup (replace with actual registration)
    state.currentUser = {
        id: Date.now(),
        username: username,
        email: email
    };
    
    showPage('dashboard');
    loadDashboard();
}

function handleLogout() {
    state.currentUser = null;
    state.currentRoom = null;
    state.messages = [];
    showPage('landing');
}

// Navigation Functions
function showPage(pageId) {
    Object.values(pages).forEach(page => page.classList.remove('active'));
    pages[pageId].classList.add('active');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

// Dashboard Functions
function loadDashboard() {
    updateRoomsList();
    updateThemesGrid();
}

function updateRoomsList() {
    const roomsList = document.getElementById('joined-rooms');
    roomsList.innerHTML = state.rooms.map(room => `
        <div class="room-item" onclick="joinRoom(${room.id})">
            <i class="fas fa-hashtag"></i>
            <span>${room.name}</span>
            <span class="member-count">${room.members.length}</span>
        </div>
    `).join('');
}

function updateThemesGrid() {
    const themesGrid = document.querySelector('.themes-grid');
    themesGrid.innerHTML = Object.entries(themes).map(([name, theme]) => `
        <div class="theme-card theme-${name}" onclick="createRoom('${name}')">
            <h3 style="background-color: ${theme.primary}">${name}</h3>
            <div class="preview-content" style="background-color: ${theme.secondary}">
                <div class="theme-emoji">${theme.emoji.join(' ')}</div>
            </div>
        </div>
    `).join('');
}

// Room Management
function createRoom(theme) {
    const roomName = prompt('Enter room name:');
    if (!roomName) return;
    
    const room = {
        id: Date.now(),
        name: roomName,
        theme: theme,
        messages: [],
        members: [state.currentUser],
        pinnedMessages: [],
        createdAt: new Date(),
        createdBy: state.currentUser.id
    };
    
    state.rooms.push(room);
    state.currentRoom = room;
    showPage('chatroom');
    loadChatRoom();
}

function joinRoom(roomId) {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return;
    
    if (!room.members.find(m => m.id === state.currentUser.id)) {
        room.members.push(state.currentUser);
    }
    
    state.currentRoom = room;
    showPage('chatroom');
    loadChatRoom();
}

// Chat Room Functions
function loadChatRoom() {
    updateRoomHeader();
    updateMessagesList();
    updateMembersList();
    scrollToBottom();
    loadThemeStyles();
}

function updateRoomHeader() {
    const roomName = document.getElementById('room-name');
    roomName.textContent = state.currentRoom.name;
    roomName.style.color = themes[state.currentRoom.theme].primary;
}

function updateMessagesList() {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = state.currentRoom.messages.map(msg => createMessageElement(msg)).join('');
}

function createMessageElement(message) {
    const isCurrentUser = message.userId === state.currentUser.id;
    return `
        <div class="message ${isCurrentUser ? 'sent' : 'received'}" data-id="${message.id}">
            <div class="message-header">
                <span class="username">${message.username}</span>
                <span class="timestamp">${formatTimestamp(message.timestamp)}</span>
            </div>
            <div class="message-content">${message.content}</div>
            <div class="message-actions">
                <button onclick="reactToMessage(${message.id})" class="reaction-btn">
                    <i class="fas fa-smile"></i>
                </button>
                <button onclick="replyToMessage(${message.id})" class="reply-btn">
                    <i class="fas fa-reply"></i>
                </button>
                ${isCurrentUser ? `
                    <button onclick="editMessage(${message.id})" class="edit-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteMessage(${message.id})" class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
            ${message.reactions ? createReactionsElement(message.reactions) : ''}
        </div>
    `;
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    
    if (!content) return;
    
    const message = {
        id: Date.now(),
        content: content,
        userId: state.currentUser.id,
        username: state.currentUser.username,
        timestamp: new Date(),
        reactions: {},
        roomId: state.currentRoom.id
    };
    
    state.currentRoom.messages.push(message);
    input.value = '';
    updateMessagesList();
    scrollToBottom();
}

// Message Actions
function reactToMessage(messageId) {
    const message = state.currentRoom.messages.find(m => m.id === messageId);
    if (!message) return;
    
    const emoji = prompt('Enter emoji reaction:');
    if (!emoji) return;
    
    if (!message.reactions) message.reactions = {};
    message.reactions[state.currentUser.id] = emoji;
    updateMessagesList();
}

function replyToMessage(messageId) {
    const message = state.currentRoom.messages.find(m => m.id === messageId);
    if (!message) return;
    
    const input = document.getElementById('message-input');
    input.value = `@${message.username} `;
    input.focus();
}

function editMessage(messageId) {
    const message = state.currentRoom.messages.find(m => m.id === messageId);
    if (!message || message.userId !== state.currentUser.id) return;
    
    const newContent = prompt('Edit message:', message.content);
    if (!newContent) return;
    
    message.content = newContent;
    message.edited = true;
    updateMessagesList();
}

function deleteMessage(messageId) {
    const index = state.currentRoom.messages.findIndex(m => m.id === messageId);
    if (index === -1 || state.currentRoom.messages[index].userId !== state.currentUser.id) return;
    
    if (confirm('Delete this message?')) {
        state.currentRoom.messages.splice(index, 1);
        updateMessagesList();
    }
}

// Utility Functions
function formatTimestamp(date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function loadThemeStyles() {
    const theme = themes[state.currentRoom.theme];
    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
}

function createReactionsElement(reactions) {
    return `
        <div class="message-reactions">
            ${Object.entries(reactions).map(([userId, emoji]) => `
                <span class="reaction" title="${getUserName(userId)}">${emoji}</span>
            `).join('')}
        </div>
    `;
}

function getUserName(userId) {
    const member = state.currentRoom.members.find(m => m.id === userId);
    return member ? member.username : 'Unknown User';
}

// File Handling
function handleAttachment() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.doc,.docx';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Simulate file upload (replace with actual upload logic)
        const reader = new FileReader();
        reader.onload = () => {
            sendMessage(`Shared a file: ${file.name}`);
        };
        reader.readAsDataURL(file);
    };
    
    input.click();
}

// Emoji Picker
function toggleEmojiPicker() {
    const theme = themes[state.currentRoom.theme];
    const picker = document.createElement('div');
    picker.className = 'emoji-picker';
    picker.innerHTML = theme.emoji.map(emoji => `
        <span onclick="insertEmoji('${emoji}')">${emoji}</span>
    `).join('');
    
    const btn = document.querySelector('.emoji-btn');
    picker.style.bottom = '60px';
    picker.style.left = btn.offsetLeft + 'px';
    
    document.body.appendChild(picker);
    
    document.onclick = (e) => {
        if (!picker.contains(e.target) && e.target !== btn) {
            picker.remove();
            document.onclick = null;
        }
    };
}

function insertEmoji(emoji) {
    const input = document.getElementById('message-input');
    input.value += emoji;
    input.focus();
}

// Members Sidebar
function toggleMembersSidebar() {
    const sidebar = document.querySelector('.members-sidebar');
    sidebar.classList.toggle('active');
}

function updateMembersList() {
    const membersList = document.getElementById('members-list');
    membersList.innerHTML = state.currentRoom.members.map(member => `
        <div class="member-item">
            <div class="member-avatar">${member.username[0].toUpperCase()}</div>
            <span class="member-name">${member.username}</span>
            ${member.id === state.currentRoom.createdBy ? 
                '<span class="member-badge">Creator</span>' : ''}
        </div>
    `).join('');
}

// Pinned Messages
function togglePinnedMessages() {
    const pinnedContainer = document.createElement('div');
    pinnedContainer.className = 'pinned-messages';
    pinnedContainer.innerHTML = `
        <h3>Pinned Messages</h3>
        ${state.currentRoom.pinnedMessages.map(msgId => {
            const message = state.currentRoom.messages.find(m => m.id === msgId);
            return message ? createMessageElement(message) : '';
        }).join('')}
    `;
    
    const existing = document.querySelector('.pinned-messages');
    if (existing) {
        existing.remove();
    } else {
        document.querySelector('.chat-container').appendChild(pinnedContainer);
    }
}

// Initialize the app
initializeEventListeners();