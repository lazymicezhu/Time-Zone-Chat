// DOM Elements
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const loginModal = document.getElementById("login-modal");
const closeLoginModal = loginModal.querySelector(".close");
const signinBtn = document.getElementById("signin-btn");
const signupBtn = document.getElementById("signup-btn");
const googleAuthBtn = document.getElementById("google-auth-btn");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const userAvatar = document.getElementById("user-avatar");
const userName = document.getElementById("user-name");

// Current user data - 全局变量
let currentUser = null;
// 让其他js文件可以访问
window.currentUser = null;

// 确保auth和其他Firebase服务可用
document.addEventListener("DOMContentLoaded", () => {
    // 初始化代码
    initAuth();
});

function initAuth() {
    // 引用Firebase服务
    const auth = window.auth;
    const database = window.database;
    
    if (!auth || !database) {
        console.error("Firebase服务未初始化，请确保先加载firebase-config.js");
        return;
    }

// Open login modal
loginBtn.addEventListener("click", () => {
    loginModal.style.display = "block";
});

// Close login modal
closeLoginModal.addEventListener("click", () => {
    loginModal.style.display = "none";
});

// Close modal when clicking outside
window.addEventListener("click", (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = "none";
    }
});

// Sign in with email and password
signinBtn.addEventListener("click", () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            loginModal.style.display = "none";
            emailInput.value = "";
            passwordInput.value = "";
        })
        .catch((error) => {
            alert("Error: " + error.message);
        });
});

// Sign up with email and password
signupBtn.addEventListener("click", () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }
    
    if (password.length < 6) {
        alert("Password should be at least 6 characters");
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Create user profile in database
            const user = userCredential.user;
            const displayName = email.split("@")[0];
            
            database.ref("users/" + user.uid).set({
                email: email,
                displayName: displayName,
                photoURL: "images/default-avatar.png",
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            // Update profile
            user.updateProfile({
                displayName: displayName
            });
            
            loginModal.style.display = "none";
            emailInput.value = "";
            passwordInput.value = "";
        })
        .catch((error) => {
            alert("Error: " + error.message);
        });
});

// Sign in with Google
googleAuthBtn.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            
            // Check if user exists in database, if not create profile
            database.ref("users/" + user.uid).once("value")
                .then((snapshot) => {
                    if (!snapshot.exists()) {
                        database.ref("users/" + user.uid).set({
                            email: user.email,
                            displayName: user.displayName || user.email.split("@")[0],
                            photoURL: user.photoURL || "images/default-avatar.png",
                            createdAt: firebase.database.ServerValue.TIMESTAMP
                        });
                    }
                });
                
            loginModal.style.display = "none";
        })
        .catch((error) => {
            alert("Error: " + error.message);
        });
});

// Logout
logoutBtn.addEventListener("click", () => {
    auth.signOut()
        .then(() => {
            // Logged out
        })
        .catch((error) => {
            alert("Error: " + error.message);
        });
});

// Auth state change listener
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        currentUser = user;
        window.currentUser = user; // 更新全局变量
        
        // Get user data from database
        database.ref("users/" + user.uid).once("value")
            .then((snapshot) => {
                const userData = snapshot.val();
                if (userData) {
                    userName.textContent = userData.displayName;
                    userAvatar.src = userData.photoURL;
                } else {
                    userName.textContent = user.displayName || user.email.split("@")[0];
                    userAvatar.src = user.photoURL || "images/default-avatar.png";
                }
            });
        
        loginBtn.style.display = "none";
        logoutBtn.style.display = "inline-block";
        
        // Join chatroom
        if (typeof joinChatroom === 'function') {
            joinChatroom();
        }
    } else {
        // User is signed out
        currentUser = null;
        window.currentUser = null; // 更新全局变量
        userName.textContent = "Guest";
        userAvatar.src = "images/default-avatar.png";
        
        loginBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
        
        // Leave chatroom
        if (typeof leaveChatroom === 'function') {
            leaveChatroom();
        }
    }
});
} 