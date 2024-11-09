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
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const storage = firebase.storage();

let username = "";
const roomId = "general";  // Example roomId
let lastTypingUpdate = Date.now();

// Initialize elements
const messageInput = document.getElementById('messageInput');
const messagesContainer = document.getElementById('messages');
const typingIndicator = document.getElementById('typingIndicator');
const emojiPicker = document.getElementById('emojiPicker');
const fileInput = document.getElementById('fileInput');
const onlineCountElement = document.getElementById('onlineCount');
const onlineUsersElement = document.getElementById('usersList');

// Check if user is logged in
function checkLoginStatus() {
    username = localStorage.getItem('username');
    if (username) {
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('chatSection').classList.remove('hidden');
        loadMessages();
        updateOnlineUsers(true);
    }
}

function joinChat() {
    username = document.getElementById('usernameInput').value.trim();
    if (username) {
        localStorage.setItem('username', username);
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('chatSection').classList.remove('hidden');
        loadMessages();
        updateOnlineUsers(true);
    } else {
        alert("Please enter a username.");
    }
}

// Load messages from Firebase
function loadMessages() {
    const messagesRef = database.ref('chatrooms/' + roomId + '/messages');
    messagesRef.on('child_added', snapshot => {
        const message = snapshot.val();
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'flex', 'items-start', 'space-x-2');
        messageElement.innerHTML = `
            <div class="flex-shrink-0">
                <span class="font-bold">${message.username}</span>
            </div>
            <div class="flex-1">
                <div class="bg-secondary p-3 rounded-lg">
                    <span>${message.text}</span>
                </div>
            </div>
        `;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

// Send message to Firebase
function sendMessage() {
    const messageText = messageInput.value.trim();
    if (messageText) {
        const messagesRef = database.ref('chatrooms/' + roomId + '/messages');
        messagesRef.push({
            username: username,
            text: messageText,
            timestamp: new Date().toISOString()
        });
        messageInput.value = '';
        updateTypingStatus(false);
    }
}

// Update typing status to Firebase
function updateTypingStatus(isTyping) {
    if (Date.now() - lastTypingUpdate < 1000) return;
    lastTypingUpdate = Date.now();
    const typingRef = database.ref('chatrooms/' + roomId + '/typing');
    typingRef.set(isTyping ? username : null);
}

// Listen for typing indicator
database.ref('chatrooms/' + roomId + '/typing').on('value', snapshot => {
    const typingUser = snapshot.val();
    if (typingUser && typingUser !== username) {
        typingIndicator.textContent = `${typingUser} is typing...`;
    } else {
        typingIndicator.textContent = '';
    }
});

// Toggle emoji picker visibility
function toggleEmojiPicker() {
    emojiPicker.classList.toggle('hidden');
}

// Add emoji to input field
function addEmoji(emoji) {
    messageInput.value += emoji;
    emojiPicker.classList.add('hidden');
    messageInput.focus();
}

// Handle file upload
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const storageRef = storage.ref('chatrooms/' + roomId + '/' + file.name);
        storageRef.put(file).then(() => {
            storageRef.getDownloadURL().then(url => {
                const messagesRef = database.ref('chatrooms/' + roomId + '/messages');
                messagesRef.push({
                    username: username,
                    text: `<img src="${url}" alt="uploaded image" class="max-w-xs rounded-lg" />`,
                    timestamp: new Date().toISOString()
                });
            });
        });
    }
});

// Update online users in Firebase
function updateOnlineUsers(isOnline) {
    const onlineUsersRef = database.ref('chatrooms/' + roomId + '/onlineUsers');
    const userRef = onlineUsersRef.child(username);
    if (isOnline) {
        userRef.set(true);
    } else {
        userRef.remove();
    }
    onlineUsersRef.on('value', snapshot => {
        const onlineUsers = snapshot.val();
        const onlineList = Object.keys(onlineUsers || {}).map(user => `<li>${user}</li>`).join('');
        onlineUsersElement.innerHTML = onlineList;
        onlineCountElement.textContent = `${Object.keys(onlineUsers || {}).length} online`;
    });
}

// Toggle online users sidebar
function toggleOnlineUsers() {
    onlineUsersElement.classList.toggle('hidden');
}

// Toggle light/dark theme
function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
    if (currentTheme === 'dark') {
        document.body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

// Apply theme from local storage
function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
}

// Initialize theme on page load
applyTheme();
