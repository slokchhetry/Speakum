// Firebase initialization
const firebaseConfig = {
    apiKey: "AIzaSyCbolT_azEYHAZWTFkXxK3URxulrKwyzu0",
    authDomain: "speakum-b09cd.firebaseapp.com",
    projectId: "speakum-b09cd",
    storageBucket: "speakum-b09cd.firebasestorage.app",
    messagingSenderId: "596735564522",
    appId: "1:596735564522:web:c0be7b5fb68facf8fed593",
    measurementId: "G-HRN7LRKP7Y"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Global Variables
let username = '';
let roomId = new URLSearchParams(window.location.search).get('room') || 
             Math.random().toString(36).substring(2, 8);
let typingTimeout;
let lastTypingUpdate = 0;

// Initialize Lucide icons
lucide.createIcons();

// Chat Functions
function joinChat() {
    username = document.getElementById('usernameInput').value.trim();
    if (username) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('chatSection').style.display = 'flex';
        
        // Set user as online and remove when disconnected
        const userRef = database.ref(`rooms/${roomId}/users/${username}`);
        userRef.set(true);
        userRef.onDisconnect().remove();

        // Initialize chat features
        loadMessages();
        setupTypingIndicator();
        setupOnlineUsers();

        // Update room link in URL
        if (!window.location.search.includes('room')) {
            window.history.replaceState(null, '', `?room=${roomId}`);
        }
    } else {
        alert('Please enter a username');
    }
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (message) {
        const messageData = {
            username: username,
            message: message,
            timestamp: Date.now(),
            reactions: {}
        };

        // Push message to Firebase
        database.ref(`rooms/${roomId}/messages`).push(messageData)
            .then(() => {
                messageInput.value = '';
                updateTypingStatus(false);
            })
            .catch(error => {
                console.error("Error sending message:", error);
                alert("Failed to send message. Please try again.");
            });
    }
}

function loadMessages() {
    const messagesDiv = document.getElementById('messages');
    
    // Listen for new messages
    database.ref(`rooms/${roomId}/messages`).on('child_added', (snapshot) => {
        const data = snapshot.val();
        const messageId = snapshot.key;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${data.username === username ? 'sent' : 'received'}`;
        
        messageElement.innerHTML = `
            <div class="username">${data.username}</div>
            <div class="message-text">${formatMessage(data.message)}</div>
            <div class="message-time">${formatTime(data.timestamp)}</div>
            <div class="reaction" id="reactions-${messageId}"></div>
        `;

        // Add reaction button
        const reactionButton = document.createElement('button');
        reactionButton.className = 'icon-button';
        reactionButton.innerHTML = '<i data-lucide="smile"></i>';
        reactionButton.onclick = () => addReaction(messageId);
        messageElement.appendChild(reactionButton);

        messagesDiv.appendChild(messageElement);
        lucide.createIcons();
        
        // Auto scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        // Update reactions if any exist
        updateReactions(messageId, data.reactions || {});
    });

    // Handle message deletion
    database.ref(`rooms/${roomId}/messages`).on('child_removed', (snapshot) => {
        const messageElement = document.getElementById(`message-${snapshot.key}`);
        if (messageElement) {
            messageElement.remove();
        }
    });
}

// Message Formatting
function formatMessage(message) {
    // Convert URLs to clickable links
    message = message.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank">$1</a>'
    );

    // Convert emojis shortcuts
    const emojiMap = {
        ':)': '😊',
        ':D': '😃',
        ':(': '😢',
        ';)': '😉',
        '<3': '❤️'
    };

    for (let emoji in emojiMap) {
        message = message.replace(new RegExp(emoji, 'g'), emojiMap[emoji]);
    }

    return message;
}

// Typing Indicator Functions
function setupTypingIndicator() {
    const messageInput = document.getElementById('messageInput');
    
    messageInput.addEventListener('input', () => {
        const now = Date.now();
        if (now - lastTypingUpdate > 1000) {
            updateTypingStatus(true);
            lastTypingUpdate = now;
        }
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => updateTypingStatus(false), 2000);
    });

    // Listen for typing status changes
    database.ref(`rooms/${roomId}/typing`).on('value', (snapshot) => {
        const typing = snapshot.val() || {};
        const typingUsers = Object.keys(typing).filter(user => user !== username && typing[user]);
        const typingIndicator = document.getElementById('typingIndicator');
        
        if (typingUsers.length > 0) {
            typingIndicator.textContent = `${typingUsers.join(', ')} ${typingUsers.length === 1 ? 'is' : 'are'} typing...`;
        } else {
            typingIndicator.textContent = '';
        }
    });
}

function updateTypingStatus(isTyping) {
    database.ref(`rooms/${roomId}/typing/${username}`).set(isTyping);
}

// Online Users Functions
function setupOnlineUsers() {
    database.ref(`rooms/${roomId}/users`).on('value', (snapshot) => {
        const users = snapshot.val() || {};
        const usersList = document.getElementById('usersList');
        const onlineCount = document.getElementById('onlineCount');
        
        // Update users list
        usersList.innerHTML = '';
        const userCount = Object.keys(users).length;
        onlineCount.textContent = `${userCount} online`;
        
        Object.keys(users).forEach(user => {
            const userElement = document.createElement('div');
            userElement.textContent = user;
            userElement.style.padding = '5px';
            if (user === username) {
                userElement.style.color = 'var(--accent-color)';
            }
            usersList.appendChild(userElement);
        });
    });
}

function toggleOnlineUsers() {
    const onlineUsers = document.getElementById('onlineUsers');
    onlineUsers.classList.toggle('show');
}

// Emoji Functions
function toggleEmojiPicker() {
    const emojiPicker = document.getElementById('emojiPicker');
    emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
}

function addEmoji(emoji) {
    const messageInput = document.getElementById('messageInput');
    const cursorPos = messageInput.selectionStart;
    const textBefore = messageInput.value.substring(0, cursorPos);
    const textAfter = messageInput.value.substring(cursorPos);
    
    messageInput.value = textBefore + emoji + textAfter;
    messageInput.focus();
    messageInput.selectionStart = cursorPos + emoji.length;
    messageInput.selectionEnd = cursorPos + emoji.length;
    
    toggleEmojiPicker();
}

// Reaction Functions
function addReaction(messageId) {
    const reaction = '👍'; // Default reaction
    database.ref(`rooms/${roomId}/messages/${messageId}/reactions/${username}`).set(reaction);
}

function updateReactions(messageId, reactions) {
    const reactionDiv = document.getElementById(`reactions-${messageId}`);
    if (reactionDiv) {
        reactionDiv.innerHTML = Object.entries(reactions)
            .map(([user, reaction]) => `<span>${reaction} ${user}</span>`)
            .join('');
    }
}

// Utility Functions
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function copyRoomLink() {
    const roomLink = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(roomLink)
        .then(() => alert('Room link copied to clipboard!'))
        .catch(err => console.error('Failed to copy room link:', err));
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Message input enter key handler
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
        const emojiPicker = document.getElementById('emojiPicker');
        if (!e.target.closest('.emoji-picker') && !e.target.closest('.icon-button')) {
            emojiPicker.style.display = 'none';
        }
    });
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (username) {
        database.ref(`rooms/${roomId}/users/${username}`).remove();
        database.ref(`rooms/${roomId}/typing/${username}`).remove();
    }
});
