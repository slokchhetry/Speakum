
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
let username = localStorage.getItem('chatUsername') || '';
let roomId = new URLSearchParams(window.location.search).get('room') || 
             Math.random().toString(36).substring(2, 8);

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    if (username) {
        joinChat(true);
    }
});

// Main Chat Functions
function joinChat(autoJoin = false) {
    if (!autoJoin) {
        const inputUsername = document.getElementById('usernameInput').value.trim();
        if (!inputUsername) {
            alert('Please enter a username');
            return;
        }
        username = inputUsername;
        localStorage.setItem('chatUsername', username);
    }

    // Update UI
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('chatSection').style.display = 'flex';
    
    // Set user as online
    const userStatusRef = database.ref(`rooms/${roomId}/users/${username}`);
    userStatusRef.set({
        online: true,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    });
    
    // Remove user when disconnected
    userStatusRef.onDisconnect().remove();

    // Initialize chat features
    loadMessages();
    setupOnlineUsers();
    setupMessageInput();

    // Update URL with room ID
    if (!window.location.search.includes('room')) {
        window.history.replaceState(null, '', `?room=${roomId}`);
    }
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (message) {
        const messageData = {
            username: username,
            message: message,
            timestamp: Date.now()
        };

        messageInput.value = '';
        messageInput.focus();

        database.ref(`rooms/${roomId}/messages`).push(messageData)
            .catch(error => {
                console.error("Error sending message:", error);
                alert("Failed to send message. Please try again.");
            });
    }
}

function loadMessages() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';
    
    database.ref(`rooms/${roomId}/messages`)
        .orderByChild('timestamp')
        .limitToLast(100)
        .on('child_added', (snapshot) => {
            const data = snapshot.val();
            const messageElement = createMessageElement(data, snapshot.key);
            messagesDiv.appendChild(messageElement);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });
}

function createMessageElement(data, messageId) {
    const isOwnMessage = data.username === username;
    const messageElement = document.createElement('div');
    
    messageElement.className = `message-appear flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`;
    messageElement.id = `message-${messageId}`;
    
    const time = new Date(data.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageElement.innerHTML = `
        <div class="max-w-[75%] md:max-w-[60%] ${isOwnMessage ? 'bg-indigo-600 text-white' : 'bg-white'} 
             rounded-2xl px-4 py-2 shadow-sm ${isOwnMessage ? 'rounded-tr-none' : 'rounded-tl-none'}">
            <div class="text-xs ${isOwnMessage ? 'text-indigo-200' : 'text-gray-500'} mb-1">${data.username}</div>
            <div class="text-sm break-words">${formatMessage(data.message)}</div>
            <div class="text-xs ${isOwnMessage ? 'text-indigo-200' : 'text-gray-500'} mt-1 text-right">${time}</div>
        </div>
    `;
    
    return messageElement;
}

function formatMessage(message) {
    // Convert URLs to clickable links
    message = message.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" class="underline hover:text-indigo-300">$1</a>'
    );

    // Convert emojis shortcuts
    const emojiMap = {
        ':)': '😊',
        ':D': '😃',
        ':(': '😢',
        ';)': '😉',
        '<3': '❤️',
        ':p': '😛',
        ':P': '😛',
        ':o': '😮',
        ':O': '😮',
        'xD': '😆',
        'XD': '😆'
    };

    for (let emoji in emojiMap) {
        message = message.replace(new RegExp(emoji, 'g'), emojiMap[emoji]);
    }

    return message;
}

function setupOnlineUsers() {
    const usersRef = database.ref(`rooms/${roomId}/users`);
    
    usersRef.on('value', (snapshot) => {
        const users = snapshot.val() || {};
        const usersList = document.getElementById('usersList');
        const onlineCount = document.getElementById('onlineCount');
        
        // Update users list
        usersList.innerHTML = '';
        const userCount = Object.keys(users).length;
        onlineCount.textContent = `${userCount} online`;
        
        // Add each user to the list
        Object.keys(users).forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = `p-3 rounded-lg ${user === username ? 
                'bg-indigo-100 text-indigo-700' : 
                'bg-gray-50'} flex items-center gap-2`;
            userElement.innerHTML = `
                <i class="fas fa-circle text-green-400 text-xs"></i>
                <span class="font-medium">${user}</span>
            `;
            usersList.appendChild(userElement);
        });
    });
}

function setupMessageInput() {
    const messageInput = document.getElementById('messageInput');
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    messageInput.focus();
}

// UI Functions
function toggleSidebar() {
    const userList = document.getElementById('userList');
    userList.classList.toggle('hidden');
}

function toggleUserList() {
    const userList = document.getElementById('userList');
    if (window.innerWidth < 768) { // mobile
        userList.classList.toggle('hidden');
    }
}

function toggleEmojiPicker() {
    const emojiPicker = document.getElementById('emojiPicker');
    emojiPicker.classList.toggle('hidden');
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

function copyRoomLink() {
    const roomLink = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(roomLink)
        .then(() => {
            alert('Room link copied! Share it with your friends to chat together.');
        })
        .catch(err => {
            console.error('Failed to copy room link:', err);
            alert('Failed to copy room link. Please try again.');
        });
}

// Utility function to format time
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Handle clicks outside emoji picker
    document.addEventListener('click', (e) => {
        const emojiPicker = document.getElementById('emojiPicker');
        if (!e.target.closest('#emojiPicker') && !e.target.closest('button')) {
            emojiPicker.classList.add('hidden');
        }
    });

    // Handle Enter key in username input
    document.getElementById('usernameInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinChat();
        }
    });
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (username) {
        database.ref(`rooms/${roomId}/users/${username}`).remove();
    }
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (username) {
        const userRef = database.ref(`rooms/${roomId}/users/${username}`);
        if (document.hidden) {
            userRef.update({ online: false, lastSeen: firebase.database.ServerValue.TIMESTAMP });
        } else {
            userRef.update({ online: true });
        }
    }
});
