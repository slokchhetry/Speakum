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

// Initialize Lucide icons
lucide.createIcons();

// Main Chat Functions
function joinChat() {
    username = document.getElementById('usernameInput').value.trim();
    if (username) {
        // Update UI
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('chatSection').style.display = 'flex';
        
        // Set user as online
        const userStatusRef = database.ref(`rooms/${roomId}/users/${username}`);
        userStatusRef.set(true);
        
        // Remove user when disconnected
        userStatusRef.onDisconnect().remove();

        // Initialize chat features
        loadMessages();
        setupOnlineUsers();
        setupMessageInput();

        // Update URL with room ID
        window.history.replaceState(null, '', `?room=${roomId}`);
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
            timestamp: Date.now()
        };

        // Push message to Firebase
        database.ref(`rooms/${roomId}/messages`).push(messageData)
            .then(() => {
                messageInput.value = '';
                messageInput.focus();
            })
            .catch(error => {
                console.error("Error sending message:", error);
                alert("Failed to send message. Please try again.");
            });
    }
}

function loadMessages() {
    const messagesDiv = document.getElementById('messages');
    
    // Clear existing messages
    messagesDiv.innerHTML = '';
    
    // Listen for new messages
    database.ref(`rooms/${roomId}/messages`).on('child_added', (snapshot) => {
        const data = snapshot.val();
        const messageId = snapshot.key;
        const messageElement = createMessageElement(data, messageId);
        
        messagesDiv.appendChild(messageElement);
        lucide.createIcons();
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

function createMessageElement(data, messageId) {
    const isOwnMessage = data.username === username;
    const messageElement = document.createElement('div');
    
    messageElement.className = `flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`;
    messageElement.id = `message-${messageId}`;
    
    messageElement.innerHTML = `
        <div class="max-w-[70%] ${isOwnMessage ? 'bg-indigo-600' : 'bg-gray-700'} rounded-lg px-4 py-2">
            <div class="text-sm ${isOwnMessage ? 'text-indigo-200' : 'text-gray-300'} mb-1">${data.username}</div>
            <div class="break-words">${data.message}</div>
            <div class="text-xs text-gray-400 mt-1">${formatTime(data.timestamp)}</div>
        </div>
    `;
    
    return messageElement;
}

// Online Users Functions
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
            userElement.className = `p-2 rounded ${user === username ? 'bg-indigo-600' : 'bg-gray-700'}`;
            userElement.textContent = user;
            usersList.appendChild(userElement);
        });
    });
}

// Emoji Functions
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
    toggleEmojiPicker();
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

function toggleOnlineUsers() {
    const onlineUsers = document.getElementById('onlineUsers');
    onlineUsers.classList.toggle('translate-x-full');
}

// Setup message input
function setupMessageInput() {
    const messageInput = document.getElementById('messageInput');
    
    // Send message on Enter key
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Focus input after joining
    messageInput.focus();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
        const emojiPicker = document.getElementById('emojiPicker');
        if (!e.target.closest('#emojiPicker') && !e.target.closest('button')) {
            emojiPicker.classList.add('hidden');
        }
    });
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (username) {
        database.ref(`rooms/${roomId}/users/${username}`).remove();
    }
});
