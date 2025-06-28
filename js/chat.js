// DOM Elements
const chatMessages = document.getElementById("chat-messages");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const uploadImageBtn = document.getElementById("upload-image-btn");
const createPollBtn = document.getElementById("create-poll-btn");
const voiceMessageBtn = document.getElementById("voice-message-btn");
const pollModal = document.getElementById("poll-modal");
const closePollModal = pollModal.querySelector(".close");
const pollForm = document.getElementById("poll-form");
const pollQuestion = document.getElementById("poll-question");
const pollOptions = document.getElementById("poll-options");
const addOptionBtn = document.getElementById("add-option-btn");
const categoryButtons = document.querySelectorAll(".category-btn");
const onlineUsersElement = document.getElementById("online-users");

// Current chat data
let currentCategory = "general";
let chatRef = null;
let userPresenceRef = null;
let usersList = {};
let mediaRecorder = null;
let audioChunks = [];

// Initialize chat events
function initializeChat() {
    // Message form submit
    messageForm.addEventListener("submit", sendMessage);
    
    // Category buttons
    categoryButtons.forEach(button => {
        button.addEventListener("click", changeCategory);
    });
    
    // Poll modal events
    createPollBtn.addEventListener("click", () => {
        pollModal.style.display = "block";
    });
    
    closePollModal.addEventListener("click", () => {
        pollModal.style.display = "none";
    });
    
    window.addEventListener("click", (e) => {
        if (e.target === pollModal) {
            pollModal.style.display = "none";
        }
    });
    
    // Poll form
    addOptionBtn.addEventListener("click", addPollOption);
    pollForm.addEventListener("submit", createPoll);
    
    // 禁用图片和语音按钮
    disableMediaButtons();
}

// 禁用图片和语音按钮
function disableMediaButtons() {
    // 禁用图片上传按钮
    uploadImageBtn.disabled = true;
    uploadImageBtn.classList.add("disabled-btn");
    uploadImageBtn.title = "Image upload feature is currently unavailable";
    uploadImageBtn.removeEventListener("click", uploadImage);
    
    // 禁用语音消息按钮
    voiceMessageBtn.disabled = true;
    voiceMessageBtn.classList.add("disabled-btn");
    voiceMessageBtn.title = "Voice message feature is currently unavailable";
    voiceMessageBtn.removeEventListener("click", toggleVoiceRecording);
}

// Join chatroom
function joinChatroom() {
    if (!window.currentUser) return;
    
    const chatroomId = `${currentTimezone.id}/${currentCategory}`;
    chatRef = window.database.ref(`chatrooms/${chatroomId}/messages`);
    
    // Load messages
    loadMessages();
    
    // Track user presence
    userPresenceRef = window.database.ref(`chatrooms/${chatroomId}/users/${window.currentUser.uid}`);
    
    const userPresenceData = {
        uid: window.currentUser.uid,
        displayName: window.currentUser.displayName || window.currentUser.email.split("@")[0],
        photoURL: window.currentUser.photoURL || "images/default-avatar.png",
        lastActive: firebase.database.ServerValue.TIMESTAMP
    };
    
    // When this client disconnects, remove the user from presence list
    userPresenceRef.onDisconnect().remove();
    
    // Add user to presence list
    userPresenceRef.set(userPresenceData);
    
    // Listen for online users changes
    window.database.ref(`chatrooms/${chatroomId}/users`).on("value", (snapshot) => {
        usersList = snapshot.val() || {};
        updateOnlineUsersCount();
    });
}

// Leave chatroom
function leaveChatroom() {
    if (chatRef) {
        chatRef.off();
        chatRef = null;
    }
    
    if (userPresenceRef) {
        userPresenceRef.remove();
        userPresenceRef = null;
    }
    
    // Clear messages
    chatMessages.innerHTML = "";
}

// Load messages from database
function loadMessages() {
    chatMessages.innerHTML = "";
    
    chatRef.orderByChild("timestamp").limitToLast(50).on("child_added", (snapshot) => {
        const message = snapshot.val();
        displayMessage(message);
    });
}

// Display a single message
function displayMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    
    if (window.currentUser && message.uid === window.currentUser.uid) {
        messageElement.classList.add("own-message");
    }
    
    // Message info
    const messageInfo = document.createElement("div");
    messageInfo.classList.add("message-info");
    
    const avatar = document.createElement("img");
    avatar.classList.add("message-avatar");
    avatar.src = message.photoURL || "images/default-avatar.png";
    avatar.alt = "User Avatar";
    
    const username = document.createElement("span");
    username.classList.add("message-user");
    username.textContent = message.displayName || "Anonymous";
    
    const timestamp = document.createElement("span");
    timestamp.classList.add("message-time");
    const date = new Date(message.timestamp);
    timestamp.textContent = formatTimeForTimezone(date, currentTimezone.offset);
    
    messageInfo.appendChild(avatar);
    messageInfo.appendChild(username);
    messageInfo.appendChild(timestamp);
    
    messageElement.appendChild(messageInfo);
    
    // Message content
    const content = document.createElement("div");
    content.classList.add("message-content");
    
    // Handle different message types
    switch (message.type) {
        case "text":
            content.textContent = message.text;
            break;
            
        case "image":
            content.textContent = message.text || "";
            
            const img = document.createElement("img");
            img.classList.add("message-image");
            img.src = message.imageURL;
            img.alt = "Uploaded Image";
            img.addEventListener("click", () => {
                window.open(message.imageURL, "_blank");
            });
            
            content.appendChild(img);
            break;
            
        case "poll":
            content.innerHTML = "";
            
            const pollContainer = document.createElement("div");
            pollContainer.classList.add("poll-container");
            
            const pollQuestion = document.createElement("div");
            pollQuestion.classList.add("poll-question");
            pollQuestion.textContent = message.pollQuestion;
            
            const pollOptions = document.createElement("div");
            pollOptions.classList.add("poll-options");
            
            const totalVotes = Object.values(message.pollVotes || {}).reduce((sum, votes) => sum + votes, 0);
            
            for (const [optionId, optionText] of Object.entries(message.pollOptions)) {
                const optionVotes = message.pollVotes?.[optionId] || 0;
                const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                
                const optionElement = document.createElement("div");
                optionElement.classList.add("poll-option");
                
                const optionLabel = document.createElement("span");
                optionLabel.classList.add("poll-option-label");
                optionLabel.textContent = optionText;
                
                const optionBar = document.createElement("div");
                optionBar.classList.add("poll-option-bar");
                optionBar.style.width = `${percentage}%`;
                
                const optionPercentage = document.createElement("span");
                optionPercentage.classList.add("poll-option-percentage");
                optionPercentage.textContent = `${percentage}%`;
                
                optionElement.appendChild(optionLabel);
                optionElement.appendChild(optionBar);
                optionElement.appendChild(optionPercentage);
                
                // Add vote functionality if user is logged in
                if (window.currentUser) {
                    optionElement.addEventListener("click", () => {
                        if (message.uid !== window.currentUser.uid) { // Don't allow voting on your own polls
                            const voteRef = window.database.ref(`chatrooms/${currentTimezone.id}/${currentCategory}/messages/${message.id}/pollVotes/${optionId}`);
                            voteRef.transaction((currentVotes) => {
                                return (currentVotes || 0) + 1;
                            });
                        }
                    });
                    optionElement.style.cursor = "pointer";
                }
                
                pollOptions.appendChild(optionElement);
            }
            
            pollContainer.appendChild(pollQuestion);
            pollContainer.appendChild(pollOptions);
            content.appendChild(pollContainer);
            break;
            
        case "voice":
            const voiceMessage = document.createElement("div");
            voiceMessage.classList.add("voice-message");
            
            const icon = document.createElement("i");
            icon.className = "fas fa-play";
            
            const audio = document.createElement("audio");
            audio.src = message.audioURL;
            
            voiceMessage.appendChild(icon);
            voiceMessage.appendChild(document.createTextNode("Voice Message"));
            
            voiceMessage.addEventListener("click", () => {
                if (audio.paused) {
                    audio.play();
                    icon.className = "fas fa-pause";
                    
                    audio.onended = () => {
                        icon.className = "fas fa-play";
                    };
                } else {
                    audio.pause();
                    icon.className = "fas fa-play";
                }
            });
            
            content.appendChild(voiceMessage);
            break;
    }
    
    messageElement.appendChild(content);
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send a text message
function sendMessage(e) {
    e.preventDefault();
    
    const text = messageInput.value.trim();
    if (!text || !window.currentUser) return;
    
    const message = {
        uid: window.currentUser.uid,
        displayName: window.currentUser.displayName || window.currentUser.email.split("@")[0],
        photoURL: window.currentUser.photoURL || "images/default-avatar.png",
        text: text,
        type: "text",
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    const newMessageRef = chatRef.push();
    message.id = newMessageRef.key;
    newMessageRef.set(message);
    
    messageInput.value = "";
}

// Change chat category
function changeCategory(e) {
    categoryButtons.forEach(button => {
        button.classList.remove("active");
    });
    
    e.target.classList.add("active");
    currentCategory = e.target.dataset.category;
    
    updateChatroomTitle();
    
    if (window.currentUser) {
        leaveChatroom();
        joinChatroom();
    }
}

// Upload image (禁用功能，保留代码供将来使用)
function uploadImage() {
    if (!window.currentUser) {
        alert("Please login to upload images");
        return;
    }
    
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.match("image.*")) {
            alert("Please select an image file");
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                // Upload image to Firebase Storage
                const storageRef = window.storage.ref(`images/${currentTimezone.id}/${currentCategory}/${Date.now()}_${file.name}`);
                const uploadTask = storageRef.put(file);
                
                uploadTask.on(
                    "state_changed",
                    null,
                    (error) => {
                        alert("Error uploading image: " + error.message);
                    },
                    async () => {
                        // Get image URL
                        const imageURL = await uploadTask.snapshot.ref.getDownloadURL();
                        
                        // Create message with image
                        const text = messageInput.value.trim();
                        const message = {
                            uid: window.currentUser.uid,
                            displayName: window.currentUser.displayName || window.currentUser.email.split("@")[0],
                            photoURL: window.currentUser.photoURL || "images/default-avatar.png",
                            text: text,
                            type: "image",
                            imageURL: imageURL,
                            timestamp: firebase.database.ServerValue.TIMESTAMP
                        };
                        
                        const newMessageRef = chatRef.push();
                        message.id = newMessageRef.key;
                        newMessageRef.set(message);
                        
                        messageInput.value = "";
                    }
                );
            } catch (error) {
                alert("Error uploading image: " + error.message);
            }
        };
        
        reader.readAsDataURL(file);
    };
    
    input.click();
}

// Add a new poll option
function addPollOption() {
    const optionInput = document.createElement("input");
    optionInput.type = "text";
    optionInput.classList.add("poll-option");
    optionInput.placeholder = `Option ${pollOptions.children.length + 1}`;
    optionInput.required = true;
    
    pollOptions.appendChild(optionInput);
}

// Create a poll
function createPoll(e) {
    e.preventDefault();
    
    if (!window.currentUser) {
        alert("Please login to create polls");
        return;
    }
    
    const question = pollQuestion.value.trim();
    if (!question) return;
    
    const options = {};
    const optionInputs = pollOptions.querySelectorAll(".poll-option");
    
    // Check if we have at least 2 options
    if (optionInputs.length < 2) {
        alert("Please add at least 2 options");
        return;
    }
    
    // Build options object
    optionInputs.forEach((input, index) => {
        const optionText = input.value.trim();
        if (optionText) {
            options[`option${index + 1}`] = optionText;
        }
    });
    
    // Create poll message
    const message = {
        uid: window.currentUser.uid,
        displayName: window.currentUser.displayName || window.currentUser.email.split("@")[0],
        photoURL: window.currentUser.photoURL || "images/default-avatar.png",
        type: "poll",
        pollQuestion: question,
        pollOptions: options,
        pollVotes: {},
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    const newMessageRef = chatRef.push();
    message.id = newMessageRef.key;
    newMessageRef.set(message);
    
    // Reset form and close modal
    pollQuestion.value = "";
    pollOptions.innerHTML = `
        <input type="text" class="poll-option" placeholder="Option 1" required>
        <input type="text" class="poll-option" placeholder="Option 2" required>
    `;
    pollModal.style.display = "none";
}

// Toggle voice recording (禁用功能，保留代码供将来使用)
function toggleVoiceRecording() {
    if (!window.currentUser) {
        alert("Please login to send voice messages");
        return;
    }
    
    if (mediaRecorder && mediaRecorder.state === "recording") {
        // Stop recording
        mediaRecorder.stop();
        voiceMessageBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceMessageBtn.classList.remove("recording");
    } else {
        // Start recording
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.addEventListener("dataavailable", e => {
                    audioChunks.push(e.data);
                });
                
                mediaRecorder.addEventListener("stop", () => {
                    // Create audio blob
                    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                    
                    // Upload to Firebase Storage
                    const storageRef = window.storage.ref(`audio/${currentTimezone.id}/${currentCategory}/${Date.now()}_voice.webm`);
                    const uploadTask = storageRef.put(audioBlob);
                    
                    uploadTask.on(
                        "state_changed",
                        null,
                        (error) => {
                            alert("Error uploading voice message: " + error.message);
                        },
                        async () => {
                            // Get audio URL
                            const audioURL = await uploadTask.snapshot.ref.getDownloadURL();
                            
                            // Create message with audio
                            const message = {
                                uid: window.currentUser.uid,
                                displayName: window.currentUser.displayName || window.currentUser.email.split("@")[0],
                                photoURL: window.currentUser.photoURL || "images/default-avatar.png",
                                type: "voice",
                                audioURL: audioURL,
                                timestamp: firebase.database.ServerValue.TIMESTAMP
                            };
                            
                            const newMessageRef = chatRef.push();
                            message.id = newMessageRef.key;
                            newMessageRef.set(message);
                        }
                    );
                    
                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());
                });
                
                // Start recording
                mediaRecorder.start();
                voiceMessageBtn.innerHTML = '<i class="fas fa-stop"></i>';
                voiceMessageBtn.classList.add("recording");
                
                // Limit recording to 60 seconds
                setTimeout(() => {
                    if (mediaRecorder && mediaRecorder.state === "recording") {
                        mediaRecorder.stop();
                        voiceMessageBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                        voiceMessageBtn.classList.remove("recording");
                    }
                }, 60000);
            })
            .catch(error => {
                alert("Error accessing microphone: " + error.message);
            });
    }
}

// Update online users count
function updateOnlineUsersCount() {
    const count = Object.keys(usersList).length;
    onlineUsersElement.textContent = `Online: ${count}`;
}

// Initialize chat when DOM is loaded
window.addEventListener("DOMContentLoaded", initializeChat);

// 公开函数给其他JS文件使用
window.joinChatroom = joinChatroom;
window.leaveChatroom = leaveChatroom;