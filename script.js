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
const db = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();

class SpeakumChat {
    constructor() {
        this.currentUser = null;
        this.currentRoom = 'general';
        this.rooms = new Map();
        this.users = new Map();
        this.init();
    }

    async init() {
        // Auth state observer
        auth.onAuthStateChanged(user => {
            if (user) {
                this.currentUser = user;
                this.setupUserPresence();
                this.loadRooms();
                this.loadMessages();
            } else {
                this.showLoginModal();
            }
        });

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Message input
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Room selection
        document.querySelectorAll('.room-item').forEach(room => {
            room.addEventListener('click', (e) => {
                this.switchRoom(e.target.dataset.roomId);
            });
        });
    }

    async sendMessage(content = null) {
        const input = document.getElementById('messageInput');
        const message = content || input.value.trim();

        if (!message) return;

        try {
            await db.ref(`rooms/${this.currentRoom}/messages`).push({
                content: message,
                author: this.currentUser.uid,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                displayName: this.currentUser.displayName,
                photoURL: this.currentUser.photoURL
            });

            input.value = '';
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    loadMessages() {
        const messagesRef = db.ref(`rooms/${this.currentRoom}/messages`);
        
        messagesRef.on('child_added', snapshot => {
            const message = snapshot.val();
            this.displayMessage(message, snapshot.key);
        });
    }

    displayMessage(message, messageId) {
        const messagesContainer = document.querySelector('.messages-container');
        const messageElement = document.createElement('div');
        
        messageElement.className = `message ${
            message.author === this.currentUser.uid ? 'sent' : 'received'
        }`;

        messageElement.innerHTML = `
            <div class="message-header">
                <img class="user-avatar" src="${message.photoURL || 'default-avatar.png'}" alt="User avatar">
                <span class="username">${message.displayName}</span>
                <span class="timestamp">${this.formatTimestamp(message.timestamp)}</span>
            </div>
            <div class="message-content">${this.formatMessage(message.content)}</div>
            <div class="message-actions">
                <span class="reaction-button">👍</span>
                <span class="reaction-button">❤️</span>
                <span class="reaction-button">😂</span>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatMessage(content) {
        // Convert URLs to links
        content = content.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank">$1</a>'
        );

        // Convert user mentions
        content = content.replace(
            /@(\w+)/g,
            '<span class="mention">@$1</span>'
        );

        return content;
    }

    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleTimeString();
    }

    setupUserPresence() {
        const userRef = db.ref(`users/${this.currentUser.uid}`);
        const connectionRef = db.ref('.info/connected');

        connectionRef.on('value', snapshot => {
            if (snapshot.val()) {
                userRef.onDisconnect().remove();
                userRef.set({
                    displayName: this.currentUser.displayName,
                    photoURL: this.currentUser.photoURL,
                    lastSeen: firebase.database.ServerValue.TIMESTAMP
                });
            }
        });
    }

    async switchRoom(roomId) {
        // Remove previous listeners
        db.ref(`rooms/${this.currentRoom}/messages`).off();
        
        this.currentRoom = roomId;
        
        // Clear messages
        document.querySelector('.messages-container').innerHTML = '';
        
        // Load new room's messages
        this.loadMessages();
        
        // Update UI
        document.querySelectorAll('.room-item').forEach(room => {
            room.classList.toggle('active', room.dataset.roomId === roomId);
        });
    }

    showLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <h2>Login to Speakum</h2>
            <button onclick="speakumChat.loginWithGoogle()">Login with Google</button>
        `;
        
        document.body.appendChild(modal);
    }

    async loginWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await auth.signInWithPopup(provider);
        } catch (error) {
            console.error('Login error:', error);
        }
    }
}

// Initialize chat
const speakumChat = new SpeakumChat();
