// ========================================
// PIKKO SHORTS - সম্পূর্ণ আপডেটেড ভার্সন 3.0
// ========================================

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBU7zL9e_q1dDSsVMHNw7iJNuunzhzSH0k",
    authDomain: "pikko-shorts-99a1b.firebaseapp.com",
    databaseURL: "https://pikko-shorts-99a1b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pikko-shorts-99a1b",
    storageBucket: "pikko-shorts-99a1b.firebasestorage.app",
    messagingSenderId: "999981600608",
    appId: "1:999981600608:web:ae22fb1735ea7a37375805"
};

// Firebase Initialize
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Constants
const ADMIN_PASS = "0863";
const WITHDRAW_WHATSAPP = "+918391921082";
const BATCH_SIZE = 5;
const APP_VERSION = "3.0";
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// Global Variables
const contentDiv = document.getElementById('mainContent');
const loader = document.getElementById('globalLoader');
const loaderText = document.getElementById('loaderText');
const toast = document.getElementById('toastMessage');
let currentVideoId = null;
let currentVideoUser = null;
let currentVideoIndex = 0;
let allVideos = [];
let displayedVideos = [];
let currentGiftVideoCreator = null;
let selectedStars = 1;
let currentProcessingUsername = null;
let watchedVideos = JSON.parse(localStorage.getItem('watchedVideos')) || [];
let selectedTestUser = null;
let feedScrollListener = null;
let isLoadingMore = false;
let hasMore = true;
let windowSelectedVideoFile = null;
let offlineBanner = document.getElementById('offlineBanner');
let clickTimer = null;
let adminMessageTimeout = null;
let selectedThumbnailTime = 0;
let videoThumbnails = [];

// ===== UTILITY FUNCTIONS =====
function showLoader(text = "Loading...") { 
    if (loaderText) loaderText.innerText = text; 
    if (loader) loader.style.display = 'flex'; 
}

function hideLoader() { 
    if (loader) loader.style.display = 'none'; 
}

function showToast(msg, duration = 2000) {
    if (!toast) return;
    toast.innerText = msg; 
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', duration);
}

function stringToColor(str) {
    if (!str) return '#666';
    let hash = 0; 
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + "00000".substring(0, 6 - c.length) + c;
}

function generateReferralCode(username) { 
    return 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase(); 
}

// ===== OFFLINE DETECTION =====
function updateOnlineStatus() {
    if (!offlineBanner) return;
    offlineBanner.style.display = navigator.onLine ? 'none' : 'flex';
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ===== USER MANAGEMENT =====
function getActiveUser() {
    let user = localStorage.getItem('shortVideoUser');
    if (user) {
        try {
            user = JSON.parse(user);
            if (!user.saved) user.saved = [];
            if (!user.blocked) user.blocked = [];
            if (!user.muted) user.muted = [];
            if (!user.reported) user.reported = [];
            if (!user.playlists) user.playlists = [];
            if (!user.following) user.following = [];
            if (!user.followers) user.followers = [];
            if (!user.likes) user.likes = [];
            if (!user.starBalance) user.starBalance = 0;
            if (!user.pCoinBalance) user.pCoinBalance = 0;
            if (!user.starsReceived) user.starsReceived = 0;
            if (!user.dailyStars) user.dailyStars = { lastClaimDate: '', claimed: [false, false, false] };
            if (!user.referralCode) user.referralCode = generateReferralCode(user.username);
            if (!user.monthlyStars) user.monthlyStars = 0;
            if (!user.lastMonthReset) user.lastMonthReset = new Date().toISOString().slice(0, 7);
            if (!user.monthlyPcoins) user.monthlyPcoins = 0;
            if (!user.exchangeCount) user.exchangeCount = 0;
            if (!user.exchangeMonth) user.exchangeMonth = new Date().toISOString().slice(0, 7);
            return user;
        } catch (e) { 
            console.error("Error parsing user:", e);
            return null; 
        }
    }
    return null;
}

function saveUser(user) {
    try {
        localStorage.setItem('shortVideoUser', JSON.stringify(user));
        if (user && user.username) {
            localStorage.setItem('user_' + user.username, JSON.stringify(user));
            localStorage.setItem('activeUsername', user.username);
        }
        return true;
    } catch (e) { 
        console.error("Error saving user:", e);
        return false;
    }
}

// ===== THEME =====
function toggleTheme() {
    let current = document.body.getAttribute('data-theme') || 'dark';
    let newTheme = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeUI(newTheme);
}

function updateThemeUI(theme) {
    const icon = document.getElementById('themeIcon');
    const text = document.getElementById('themeText');
    const toggle = document.getElementById('themeToggle');
    if (!icon || !text || !toggle) return;
    if (theme === 'dark') {
        icon.className = 'fas fa-moon';
        text.innerText = 'Dark Mode';
        toggle.innerText = '🌙';
    } else {
        icon.className = 'fas fa-sun';
        text.innerText = 'Light Mode';
        toggle.innerText = '☀️';
    }
}

// ===== AUTH =====
function renderAuth() {
    contentDiv.innerHTML = `
        <div class="form-container" style="padding:30px; display:flex; flex-direction:column; justify-content:center; height:100%; text-align:center;">
            <h2 style="margin-bottom:30px; font-size:32px;">🎬 Pikko Shorts</h2>
            <input type="text" id="authName" placeholder="Full Name" class="input-field" value="Test User">
            <input type="text" id="authUsername" placeholder="Username" class="input-field" value="testuser">
            <input type="password" id="authPassword" placeholder="Password" class="input-field" value="123456">
            <button class="primary-btn" onclick="handleSignup()">Sign Up</button>
            <p style="margin:20px 0;">or</p>
            <button class="primary-btn" style="background:#333;" onclick="showLogin()">Login</button>
        </div>`;
}

function showLogin() {
    contentDiv.innerHTML = `
        <div class="form-container" style="padding:30px; display:flex; flex-direction:column; justify-content:center; height:100%; text-align:center;">
            <h2 style="margin-bottom:30px; font-size:32px;">🔐 Login</h2>
            <input type="text" id="loginUsername" placeholder="Username" class="input-field" value="testuser">
            <input type="password" id="loginPassword" placeholder="Password" class="input-field" value="123456">
            <button class="primary-btn" onclick="handleLogin()">Login</button>
            <p style="margin-top:20px; cursor:pointer;" onclick="renderAuth()">Create new account</p>
        </div>`;
}

async function handleSignup() {
    const nameInput = document.getElementById('authName');
    const usernameInput = document.getElementById('authUsername');
    const passwordInput = document.getElementById('authPassword');
    
    if (!nameInput || !usernameInput || !passwordInput) return;
    
    const name = nameInput.value;
    const usernameRaw = usernameInput.value.trim();
    const username = '@' + usernameRaw.replace(/^@/, '');
    const password = passwordInput.value;

    if (name && usernameRaw && password) {
        showLoader("Creating account...");
        try {
            const userRef = db.collection('users').doc(username);
            const doc = await userRef.get();
            
            if (doc.exists) { 
                hideLoader(); 
                showToast('Username already exists!'); 
            } else {
                const currentMonth = new Date().toISOString().slice(0, 7);
                const today = new Date().toDateString();
                
                const newUser = {
                    name, username, password, 
                    bio: "Content Creator", 
                    profilePic: "",
                    starBalance: 0,
                    pCoinBalance: 0, 
                    verification: 'none',
                    appVersion: APP_VERSION, 
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    following: [], 
                    followers: [], 
                    likes: [], 
                    saved: [], 
                    blocked: [], 
                    muted: [], 
                    reported: [],
                    playlists: [], 
                    starsReceived: 0,
                    monthlyStars: 0,
                    monthlyPcoins: 0,
                    lastMonthReset: currentMonth,
                    dailyStars: { lastClaimDate: today, claimed: [false, false, false] },
                    referralCode: generateReferralCode(username),
                    transactions: [],
                    exchangeCount: 0,
                    exchangeMonth: currentMonth
                };
                
                await userRef.set(newUser);
                hideLoader();
                saveUser(newUser);
                showToast('Account created!');
                renderHome();
            }
        } catch (error) { 
            hideLoader(); 
            showToast('Error: ' + error.message); 
        }
    } else showToast('Please fill all fields');
}

async function handleLogin() {
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    
    if (!usernameInput || !passwordInput) return;
    
    const usernameRaw = usernameInput.value.trim();
    const username = '@' + usernameRaw.replace(/^@/, '');
    const password = passwordInput.value;

    if (usernameRaw && password) {
        showLoader("Logging in...");
        try {
            const userRef = db.collection('users').doc(username);
            const doc = await userRef.get();
            hideLoader();
            
            if (!doc.exists) { 
                showToast('User not found! Please sign up.'); 
            } else {
                const userData = doc.data();
                if (userData.password === password) {
                    userData.appVersion = APP_VERSION;
                    
                    const currentMonth = new Date().toISOString().slice(0, 7);
                    if (userData.lastMonthReset !== currentMonth) {
                        userData.monthlyStars = 0;
                        userData.monthlyPcoins = 0;
                        userData.lastMonthReset = currentMonth;
                    }
                    
                    saveUser(userData);
                    showToast('Login Successful!');
                    renderHome();
                } else { 
                    showToast('Wrong password!'); 
                }
            }
        } catch (error) { 
            hideLoader(); 
            showToast('Error: ' + error.message); 
        }
    } else { 
        showToast('Please fill all fields'); 
    }
}

function handleLogout() {
    localStorage.removeItem('shortVideoUser');
    localStorage.removeItem('activeUsername');
    closeMenu();
    renderAuth();
}

// ===== VIDEO PLAYBACK & CLEANUP =====
async function cleanupOldVideos() {
    try {
        const oneMonthAgo = new Date(Date.now() - ONE_MONTH_MS);
        const snapshot = await db.collection('videos')
            .where('createdAt', '<', oneMonthAgo)
            .get();
        
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${snapshot.size} old videos`);
    } catch (error) {
        console.error("Error cleaning up videos:", error);
    }
}

function togglePlay(video) { 
    if (!video) return;
    if (video.paused) video.play(); 
    else video.pause(); 
}

function initObserver() {
    const videos = document.querySelectorAll('video');
    if (videos.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // ভিডিও প্লে/পজ করার কাজটি এখন index.html এর smartVideoController করবে
                const card = entry.target.closest('.video-card');
                if (card) {
                    const index = card.dataset.videoIndex;
                    if (index) currentVideoIndex = parseInt(index) || 0;
                }
            }
        });
    }, { threshold: 0.6 });
    
    videos.forEach(video => {
        // যেন একই ভিডিও বারবার অবজার্ভ না হয়
        if (!video.dataset.indexObserved) {
            observer.observe(video);
            video.dataset.indexObserved = "true";
        }
    });
}

// ===== AI FEED =====
function trackVideoWatch(videoId, username, duration) {
    if (!videoId || !username) return;
    
    if (duration > 4) {
        watchedVideos = watchedVideos.filter(v => v.videoId !== videoId);
        watchedVideos.push({
            videoId,
            username,
            timestamp: Date.now()
        });
        
        if (watchedVideos.length > 50) {
            watchedVideos = watchedVideos.slice(-50);
        }
        
        localStorage.setItem('watchedVideos', JSON.stringify(watchedVideos));
    }
}

function initVideoTracking() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        let watchStartTime = null;
        
        video.addEventListener('play', () => {
            watchStartTime = Date.now();
        });
        
        video.addEventListener('pause', () => {
            if (watchStartTime) {
                const duration = (Date.now() - watchStartTime) / 1000;
                const card = video.closest('.video-card');
                if (card) {
                    const videoId = card.dataset.videoId;
                    const username = card.dataset.username;
                    trackVideoWatch(videoId, username, duration);
                }
                watchStartTime = null;
            }
        });
        
        video.addEventListener('ended', () => {
            if (watchStartTime) {
                const duration = (Date.now() - watchStartTime) / 1000;
                const card = video.closest('.video-card');
                if (card) {
                    const videoId = card.dataset.videoId;
                    const username = card.dataset.username;
                    trackVideoWatch(videoId, username, duration);
                }
                watchStartTime = null;
            }
        });
    });
}

// ===== THUMBNAIL HELPER =====
function getThumbnailUrl(videoUrl, time = 1) {
    if (!videoUrl) return '';
    if (videoUrl.includes('cloudinary.com')) {
        return videoUrl.replace('/video/upload/', `/video/upload/so_${time},w_400,h_600,c_thumb/`);
    }
    return '';
}

// ===== HOME PAGE =====
function renderHome(tab = 'foryou') {
    updateNavActive('Home');
    showLoader("Loading Feed...");
    
    const user = getActiveUser();
    if (!user) { 
        renderAuth(); 
        return; 
    }
    
    contentDiv.innerHTML = `
        <div class="home-top-bar">
            <div class="home-menu-icon" onclick="openMenu()">
                <i class="fas fa-bars"></i>
            </div>
            <div class="top-tabs">
                <div class="top-tab ${tab === 'following' ? 'active-tab' : ''}" onclick="renderHome('following')">Following</div>
                <div class="top-tab ${tab === 'foryou' ? 'active-tab' : ''}" onclick="renderHome('foryou')">For You</div>
            </div>
            <div style="width: 45px;"></div>
        </div>
        <div id="feedContainer" class="video-feed"></div>
        <div id="feedLoader" style="text-align:center; padding:15px; display:none;">
            <i class="fas fa-spinner fa-pulse" style="margin-right:8px;"></i> Loading more videos...
        </div>
    `;

    if (!navigator.onLine) {
        hideLoader();
        return;
    }

    cleanupOldVideos();

    db.collection('videos').orderBy('createdAt', 'desc').get()
        .then((snapshot) => {
            let data = [];
            snapshot.forEach(doc => {
                const videoData = doc.data();
                data.push({ 
                    id: doc.id, 
                    url: videoData.video_url || videoData.url,
                    caption: videoData.caption || '',
                    username: videoData.username || '@unknown',
                    likes_count: videoData.likes_count || Math.floor(Math.random() * 500) + 10,
                    comment_count: videoData.comment_count || Math.floor(Math.random() * 50) + 1,
                    createdAt: videoData.createdAt,
                    thumbnail_time: videoData.thumbnail_time || 1
                });
            });
            
            hideLoader();
            setTimeout(initFloatingStar, 500);

            if (data.length === 0) {
                document.getElementById('feedContainer').innerHTML = 
                    '<p style="text-align:center; padding:30px;">No videos yet. Be the first to upload!</p>';
            } else {
                allVideos = data;
                processVideos(data, tab);
            }
        })
        .catch(error => {
            console.error("Firebase error:", error);
            hideLoader();
            if (!navigator.onLine) {
                // অফলাইন মেসেজ
            } else {
                document.getElementById('feedContainer').innerHTML = 
                    '<p style="text-align:center; padding:30px;">Failed to load videos. Please refresh.</p>';
            }
        });
}

function processVideos(videos, tab) {
    const user = getActiveUser();
    if (!user) { 
        renderAuth(); 
        return; 
    }

    // ব্লক বা মিউট করা ইউজারদের ভিডিও বাদ দেওয়া হচ্ছে (নিরাপত্তার জন্য এটি রাখা জরুরি)
    let filteredVideos = videos.filter(v => {
        if (!v || !v.username) return false;
        if (user.blocked && user.blocked.includes(v.username)) return false;
        if (user.muted && user.muted.includes(v.username)) return false;
        return true;
    });

    if (tab === 'following') {
        // 'Following' ট্যাবে শুধু ফলো করা ইউজারদের ভিডিও দেখাবে
        filteredVideos = filteredVideos.filter(v => 
            user.following && user.following.includes(v.username)
        );
    } else {
        // 'For You' ট্যাবে সবগুলো ভিডিও সম্পূর্ণ গোলমাল (Shuffle/Random) করে দেখাবে
        filteredVideos = filteredVideos.sort(() => Math.random() - 0.5);
    }

    allVideos = filteredVideos;
    displayedVideos = [];
    hasMore = filteredVideos.length > 0;
    currentVideoIndex = 0;
    
    loadMoreVideos();
}


function loadMoreVideos() {
    if (isLoadingMore || !hasMore) return;
    
    const feed = document.getElementById('feedContainer');
    if (!feed) { 
        isLoadingMore = false; 
        return; 
    }

    isLoadingMore = true;
    const feedLoader = document.getElementById('feedLoader');
    if (feedLoader) feedLoader.style.display = 'block';

    const start = displayedVideos.length;
    const end = Math.min(start + BATCH_SIZE, allVideos.length);
    
    if (start >= allVideos.length) { 
        hasMore = false; 
        isLoadingMore = false; 
        if (feedLoader) feedLoader.style.display = 'none';
        return; 
    }

    const batch = allVideos.slice(start, end);
    displayedVideos = displayedVideos.concat(batch);

    const user = getActiveUser();

    batch.forEach((vid, idx) => {
        if (!vid) return;
        
        const profileUserData = localStorage.getItem('user_' + vid.username);
        let profilePic = '';
        if (profileUserData) {
            try { 
                const profileUser = JSON.parse(profileUserData);
                profilePic = profileUser.profilePic || ''; 
            } catch (e) { }
        }

        const isLiked = user.likes && user.likes.includes(vid.id);
        const isFollowing = user.following && user.following.includes(vid.username);
        const isSaved = user.saved && user.saved.includes(vid.id);
        const likeCount = vid.likes_count || Math.floor(Math.random() * 500) + 10;
        const commentCount = vid.comment_count || Math.floor(Math.random() * 50) + 1;
        const letter = vid.username ? vid.username.replace('@', '').charAt(0).toUpperCase() : 'U';
        const color = stringToColor(vid.username);

        const avatarStyle = profilePic 
            ? `background-image:url('${profilePic}'); background-size:cover; background-position:center;` 
            : `background:${color}; display:flex; align-items:center; justify-content:center;`;
            
        const avatarContent = profilePic ? '' : letter;
        const thumbnailUrl = getThumbnailUrl(vid.url, vid.thumbnail_time || 1);

        const html = `
            <div class="video-card" data-video-index="${start + idx}" data-video-id="${vid.id}" data-username="${vid.username}">
                <video class="video-player" src="${vid.url}" poster="${thumbnailUrl}" loop playsinline
                    ondblclick="handleDoubleTap(this, '${vid.id}')"
                    onclick="handleVideoClick(event, this)">
                </video>
                <div class="play-pause-btn"><i class="fas fa-play"></i></div>
                <div class="video-menu" onclick="openVideoOptions('${vid.username}', '${vid.id}', '${vid.url}')">
                    <i class="fas fa-ellipsis-vertical"></i>
                </div>
                <div class="right-sidebar">
                    <div class="avatar-circle" style="${avatarStyle}" onclick="viewOtherProfile('${vid.username}')">
                        ${avatarContent}
                        ${!isFollowing ? '<div class="plus-badge"><i class="fas fa-plus"></i></div>' : ''}
                    </div>
                    <div class="action-btn" onclick="toggleLike('${vid.id}', this)">
                        <i class="fas fa-heart" style="color: ${isLiked ? '#fe2c55' : 'white'}"></i>
                        <span class="like-count">${likeCount}</span>
                    </div>
                    <div class="action-btn" onclick="toggleSave('${vid.id}', this)">
                        <i class="fas fa-bookmark" style="color: ${isSaved ? '#fe2c55' : 'white'}"></i>
                        <span>Save</span>
                    </div>
                    <div class="action-btn" onclick="openComments('${vid.id}')">
                        <i class="fas fa-comment-dots"></i>
                        <span>${commentCount}</span>
                    </div>
                    <div class="action-btn" onclick="openGiftModal('${vid.username}')">
                        <i class="fas fa-gift"></i>
                        <span>Gift</span>
                    </div>
                    <div class="action-btn" onclick="saveOffline('${vid.id}', '${vid.url}', '${vid.caption}', '${vid.username}')">
                        <i class="fas fa-cloud-download-alt"></i>
                        <span>Offline</span>
                    </div>
                    <div class="action-btn" onclick="shareVideo('${vid.id}')">
                        <i class="fas fa-share"></i>
                        <span>Share</span>
                    </div>
                </div>
                <div class="video-overlay">
                    <div class="user-info-row">
                        <div class="username" onclick="viewOtherProfile('${vid.username}')">${vid.username}</div>
                        <button class="follow-btn ${isFollowing ? 'following' : ''}" onclick="handleFollow('${vid.username}', this)">
                            ${isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>
                    <div class="caption">${vid.caption || ''}</div>
                </div>
            </div>`;
            
        feed.insertAdjacentHTML('beforeend', html);
    });

    if (!feedScrollListener) {
        feedScrollListener = true;
        feed.addEventListener('scroll', () => {
            if (feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 100) {
                loadMoreVideos();
            }
        });
    }

    initObserver();
    initVideoTracking();
    isLoadingMore = false;
    if (feedLoader) feedLoader.style.display = 'none';
}

// ===== VIDEO CLICK HANDLER =====
function handleVideoClick(event, videoElement) {
    if (!videoElement) return;
    
    if (event.detail === 1) {
        if (clickTimer) clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
            togglePlay(videoElement);
            const playPauseBtn = videoElement.parentElement.querySelector('.play-pause-btn i');
            if (playPauseBtn) {
                playPauseBtn.className = videoElement.paused ? 'fas fa-play' : 'fas fa-pause';
                
                const btnContainer = videoElement.parentElement.querySelector('.play-pause-btn');
                if (btnContainer) {
                    btnContainer.style.opacity = '1';
                    setTimeout(() => {
                        btnContainer.style.opacity = '0';
                    }, 300);
                }
            }
        }, 200);
    }
}

function handleDoubleTap(videoElement, videoId) {
    if (!videoElement || !videoId) return;
    
    if (clickTimer) clearTimeout(clickTimer);
    
    const heart = document.createElement('div');
    heart.className = 'double-tap-heart';
    heart.innerHTML = '<i class="fas fa-heart"></i>';
    videoElement.parentElement.appendChild(heart);
    setTimeout(() => heart.remove(), 500);

    const card = videoElement.closest('.video-card');
    if (card) {
        const likeBtn = card.querySelector('.action-btn .fa-heart')?.closest('.action-btn');
        if (likeBtn) {
            toggleLike(videoId, likeBtn);
            likeBtn.classList.add('liked');
            setTimeout(() => likeBtn.classList.remove('liked'), 300);
        }
    }
}

// ===== LIKE FUNCTION =====
function toggleLike(id, btn) {
    let u = getActiveUser();
    if (!u) return;
    if (!u.likes) u.likes = [];

    const icon = btn.querySelector('i');
    const countSpan = btn.querySelector('.like-count');
    if (!icon || !countSpan) return;
    
    let c = parseInt(countSpan.innerText) || 0;

    if (u.likes.includes(id)) {
        u.likes = u.likes.filter(v => v !== id);
        icon.style.color = "white";
        countSpan.innerText = c > 0 ? c - 1 : 0;
    } else {
        u.likes.push(id);
        icon.style.color = "#fe2c55";
        countSpan.innerText = c + 1;
        
        btn.classList.add('liked');
        setTimeout(() => btn.classList.remove('liked'), 300);
        
        let video = allVideos.find(v => v && v.id === id);
        if (video && video.username && video.username !== u.username) {
            addNotification(video.username, '❤️ New Like', `${u.username} liked your video`, 'fas fa-heart', '#fe2c55', 'like');
        }
    }
    saveUser(u);
}

// ===== SAVE FUNCTION =====
function toggleSave(id, btn) {
    let u = getActiveUser();
    if (!u) return;
    if (!u.saved) u.saved = [];

    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    if (!icon || !span) return;

    if (u.saved.includes(id)) {
        u.saved = u.saved.filter(v => v !== id);
        icon.style.color = "white";
        span.innerText = 'Save';
        showToast('Removed from saved');
    } else {
        u.saved.push(id);
        icon.style.color = "#fe2c55";
        span.innerText = 'Saved';
        showToast('Added to saved');
    }
    saveUser(u);
}

// ===== FOLLOW FUNCTION =====
function handleFollow(targetUsername, btn) {
    let u = getActiveUser();
    if (!u) return;
    if (!targetUsername) return;
    if (u.username === targetUsername) return showToast("Cannot follow yourself");
    if (!u.following) u.following = [];

    if (u.following.includes(targetUsername)) {
        u.following = u.following.filter(x => x !== targetUsername);
        btn.innerText = "Follow";
        btn.classList.remove('following');
        showToast(`Unfollowed ${targetUsername}`);
    } else {
        u.following.push(targetUsername);
        btn.innerText = "Following";
        btn.classList.add('following');
        addNotification(targetUsername, '👥 New Follower', `${u.username} started following you`, 'fas fa-user-plus', '#00e5ff', 'follow');
        showToast(`You are now following ${targetUsername}`);
    }
    saveUser(u);
}

// ===== NOTIFICATION =====
function addNotification(username, title, body, icon = 'fas fa-bell', color = '#fe2c55', type = 'general') {
    if (!username) return;
    
    const allowedTypes = ['gift', 'pcoin', 'star', 'withdraw', 'coupon', 'follow', 'like', 'comment'];
    if (!allowedTypes.includes(type) && type !== 'general') return;
    
    let notifs = JSON.parse(localStorage.getItem('notifications_' + username)) || [];
    
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const isDuplicate = notifs.some(n => 
        n.type === type && 
        n.body === body && 
        n.timestamp > fiveMinAgo
    );
    
    if (isDuplicate) return;
    
    notifs.unshift({ 
        title, 
        body, 
        icon, 
        color, 
        type, 
        time: new Date().toLocaleTimeString(), 
        timestamp: Date.now() 
    });
    
    notifs = notifs.slice(0, 20);
    localStorage.setItem('notifications_' + username, JSON.stringify(notifs));
    
    if (contentDiv.innerHTML.includes('notify-container')) {
        renderNotify();
    }
}

// ===== NOTIFICATION & INBOX =====
async function renderNotify(tab = 'activity') {
    updateNavActive('Notify');
    const user = getActiveUser();
    if (!user) return;
    
    let notifs = JSON.parse(localStorage.getItem('notifications_' + user.username)) || [];
    notifs = notifs.filter(n => n && (n.type === 'gift' || n.type === 'pcoin' || n.type === 'withdraw' || n.type === 'star' || n.type === 'coupon'));

    let html = `
        <div class="page-container" style="background: var(--bg);">
            <div style="position: sticky; top: 0; background: var(--bg); z-index: 100; padding: 15px 15px 0; border-bottom: 1px solid var(--border);">
                
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <h2 style="font-size: 24px; font-weight: 700;">
                            <i class="${tab === 'activity' ? 'fas fa-bell' : 'fas fa-envelope'}" style="color: var(--primary); margin-right: 10px;"></i>
                            ${tab === 'activity' ? 'Notifications' : 'Inbox'}
                        </h2>
                        <button class="verified-earn-btn" onclick="openVerifiedLeaderboard()">
                            <i class="fas fa-crown"></i> Verified Earn
                        </button>
                    </div>
                    ${tab === 'activity' && notifs.length > 0 ? `
                        <button onclick="clearAllNotifications()" style="background: none; border: none; color: var(--muted-text); font-size: 18px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                
                <div style="display: flex; gap: 20px;">
                    <div onclick="renderNotify('activity')" style="padding: 10px 5px; font-weight: 600; cursor: pointer; border-bottom: 3px solid ${tab === 'activity' ? 'var(--primary)' : 'transparent'}; color: ${tab === 'activity' ? 'var(--text)' : 'var(--muted-text)'}; transition: all 0.3s;">
                        Activity
                    </div>
                    <div onclick="renderNotify('messages')" style="padding: 10px 5px; font-weight: 600; cursor: pointer; border-bottom: 3px solid ${tab === 'messages' ? 'var(--primary)' : 'transparent'}; color: ${tab === 'messages' ? 'var(--text)' : 'var(--muted-text)'}; transition: all 0.3s;">
                        Messages
                    </div>
                </div>
            </div>
            
            <div class="notifications-list" style="padding: 15px;" id="notifyContentArea">
    `;

    if (tab === 'activity') {
        if (notifs.length === 0) {
            html += `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px;">
                    <div style="width: 100px; height: 100px; background: var(--input-bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <i class="fas fa-bell-slash" style="font-size: 40px; color: var(--muted-text);"></i>
                    </div>
                    <h3 style="font-size: 18px; margin-bottom: 8px;">No Activity Yet</h3>
                    <p style="color: var(--muted-text); text-align: center;">When you receive stars, P Coins or coupons, they'll appear here</p>
                </div>
            `;
        } else {
            notifs.forEach((n, index) => {
                if (!n) return;
                const timeAgo = getTimeAgo(n.timestamp);
                html += `
                    <div class="notification-item-modern" style="background: var(--secondary-bg); border-radius: 20px; padding: 18px; margin-bottom: 12px; border: 1px solid var(--border); display: flex; align-items: center; gap: 15px; animation: slideIn 0.3s ease;">
                        <div class="notification-icon" style="width: 55px; height: 55px; border-radius: 50%; background: ${n.color || '#fe2c55'}; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; box-shadow: 0 5px 15px ${n.color}40;">
                            <i class="${n.icon || 'fas fa-star'}"></i>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 16px; margin-bottom: 4px; color: var(--text);">${n.title || 'Activity'}</div>
                            <div style="font-size: 14px; color: var(--muted-text); margin-bottom: 5px;">${n.body || ''}</div>
                            <div style="font-size: 11px; color: var(--muted-text); display: flex; align-items: center; gap: 5px;">
                                <i class="far fa-clock"></i> ${timeAgo}
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `
            </div>
            <div style="position: sticky; bottom: 80px; margin: 20px 15px; text-align: center;">
                <button onclick="renderAIAssistant()" class="ai-assistant-button">
                    <div class="ai-pulse"></div>
                    <i class="fas fa-robot"></i>
                    <span>Pikko AI Assistant</span>
                </button>
            </div>
        </div>`;
        contentDiv.innerHTML = html;
    } 
    else if (tab === 'messages') {
        html += `<div id="inboxListArea"><div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin" style="font-size:30px; color:var(--primary);"></i><p style="margin-top:10px;">Loading Inbox...</p></div></div>`;
        html += `</div></div>`;
        contentDiv.innerHTML = html;
        
        try {
            const snapshot = await db.collection('chats')
                .where('participants', 'array-contains', user.username)
                .get();
            
            let chats = [];
            snapshot.forEach(doc => chats.push(doc.data()));
            
            chats.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
            
            const inboxArea = document.getElementById('inboxListArea');
            
            if (chats.length === 0) {
                inboxArea.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px;">
                        <div style="width: 100px; height: 100px; background: var(--input-bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                            <i class="fas fa-envelope-open" style="font-size: 40px; color: var(--muted-text);"></i>
                        </div>
                        <h3 style="font-size: 18px; margin-bottom: 8px;">No Messages</h3>
                        <p style="color: var(--muted-text); text-align: center;">Start a conversation from someone's profile!</p>
                        <button class="primary-btn" style="width:auto; padding:10px 30px; margin-top:15px;" onclick="renderExplore()">Explore Profiles</button>
                    </div>
                `;
            } else {
                let inboxHtml = '';
                chats.forEach(chat => {
                    const otherUser = chat.participants.find(p => p !== user.username);
                    const timeStr = getTimeAgo(chat.lastMessageTime);
                    const isMe = chat.lastSender === user.username;
                    
                    const letter = otherUser.replace('@', '').charAt(0).toUpperCase();
                    const color = stringToColor(otherUser);
                    
                    inboxHtml += `
                        <div class="user-card" style="margin-bottom: 12px; cursor: pointer; transition: transform 0.2s;" onclick="openChatWindow('${otherUser}')">
                            <div class="user-avatar-lg" style="background: ${color}; width: 55px; height: 55px; font-size: 22px;">
                                ${letter}
                            </div>
                            <div class="user-info" style="flex: 1; margin-left: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div class="user-name" style="font-size: 16px; font-weight: bold;">${otherUser.replace('@', '')}</div>
                                    <div style="font-size: 12px; color: var(--muted-text);">${timeStr}</div>
                                </div>
                                <div style="font-size: 14px; color: ${!isMe ? 'var(--text)' : 'var(--muted-text)'}; font-weight: ${!isMe ? '600' : 'normal'}; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">
                                    ${isMe ? 'You: ' : ''}${chat.lastMessage || 'Sent a message'}
                                </div>
                            </div>
                        </div>
                    `;
                });
                inboxArea.innerHTML = inboxHtml;
            }
        } catch (err) {
            console.error("Error loading inbox:", err);
            document.getElementById('inboxListArea').innerHTML = '<p style="text-align:center; padding:20px; color:#ff4444;">Failed to load messages</p>';
        }
    }
}

function getTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    return Math.floor(seconds / 86400) + ' days ago';
}

function clearAllNotifications() {
    const user = getActiveUser();
    if (!user) return;
    localStorage.removeItem('notifications_' + user.username);
    renderNotify();
    showToast('All notifications cleared');
}

// ===== PROFESSIONAL AI ASSISTANT =====
function renderAIAssistant() {
    updateNavActive('AI Assistant');
    
    contentDiv.innerHTML = `
        <div class="ai-chat-container">
            <div class="ai-header">
                <div class="ai-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="ai-title">
                    <h2>Pikko AI Assistant</h2>
                    <div class="ai-status">
                        <span class="ai-status-dot"></span>
                        <span>Online • 24/7 Support</span>
                    </div>
                </div>
                <i class="fas fa-times" style="font-size: 24px; margin-left: auto; cursor: pointer; color: white;" onclick="renderNotify()"></i>
            </div>
            
            <div id="ai-messages" class="ai-messages">
                <div class="ai-message bot">
                    <div class="ai-message-bubble">
                        <i class="fas fa-robot" style="margin-right: 8px; color: #667eea;"></i>
                        👋 হ্যালো! আমি <strong>Pikko AI Assistant</strong>। আপনার যেকোনো প্রশ্নের উত্তর দিতে আমি এখানে আছি। নিচের অপশন থেকে বেছে নিন বা আপনার প্রশ্ন লিখুন।
                    </div>
                </div>
            </div>
            
            <div class="ai-quick-replies">
                <button class="ai-quick-chip" onclick="sendAIMessageFromChip('P coin কী?')">
                    <i class="fas fa-coins"></i> P coin কী?
                </button>
                <button class="ai-quick-chip" onclick="sendAIMessageFromChip('কীভাবে ব্লু টিক পাব?')">
                    <i class="fas fa-check-circle"></i> ব্লু টিক
                </button>
                <button class="ai-quick-chip" onclick="sendAIMessageFromChip('টাকা কীভাবে ইনকাম করব?')">
                    <i class="fas fa-money-bill"></i> ইনকাম
                </button>
                <button class="ai-quick-chip" onclick="sendAIMessageFromChip('স্টার এর কাজ কী?')">
                    <i class="fas fa-star"></i> স্টার
                </button>
                <button class="ai-quick-chip" onclick="sendAIMessageFromChip('লিডারবোর্ড কিভাবে কাজ করে?')">
                    <i class="fas fa-trophy"></i> লিডারবোর্ড
                </button>
            </div>
            
            <div class="ai-input-area-modern" style="padding-bottom: 85px;">
                <button class="ai-whatsapp-btn" onclick="openAIChatWhatsApp()" title="WhatsApp Support">
                    <i class="fab fa-whatsapp"></i>
                </button>
                <input type="text" id="aiMessageInput" class="ai-input-modern" placeholder="আপনার প্রশ্ন লিখুন..." autofocus>
                <button class="ai-send-modern" onclick="processAIMessage()">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        const input = document.getElementById('aiMessageInput');
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') processAIMessage();
            });
        }
    }, 100);
}

function sendAIMessageFromChip(text) {
    const input = document.getElementById('aiMessageInput');
    if (input) {
        input.value = text;
        processAIMessage();
    }
}

function openAIChatWhatsApp() {
    const phoneNumber = "918391921082";
    const message = encodeURIComponent("হ্যালো, আমার Pikko Shorts অ্যাপে সাহায্য প্রয়োজন।");
    window.location.href = `https://wa.me/${phoneNumber}?text=${message}`;
}

function processAIMessage() {
    const input = document.getElementById('aiMessageInput');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    const messagesDiv = document.getElementById('ai-messages');
    if (!messagesDiv) return;
    
    messagesDiv.innerHTML += `
        <div class="ai-message user">
            <div class="ai-message-bubble">
                ${escapeHtml(message)}
            </div>
        </div>
    `;
    
    input.value = '';
    messagesDiv.scrollTop =messagesDiv.scrollHeight;
    
    const typingId = 'typing-' + Date.now();
    messagesDiv.innerHTML += `
        <div class="ai-message bot" id="${typingId}">
            <div class="ai-message-bubble" style="background: var(--input-bg);">
                <div class="typing-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        </div>
    `;
    
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    setTimeout(() => {
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        
        const reply = getAIResponse(message);
        
        messagesDiv.innerHTML += `
            <div class="ai-message bot">
                <div class="ai-message-bubble">
                    <i class="fas fa-robot" style="margin-right: 8px; color: #667eea;"></i>
                    ${reply.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
        
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 1000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getAIResponse(question) {
    const q = question.toLowerCase();
    
    if (q.includes('what is p coin') || q.includes('p coin meaning') || q.includes('what is pcoin')) {
        return `💰 <strong>What is P Coin?</strong><br><br>P Coin is the virtual currency of Pikko Shorts.<br><br>✅ <strong>How to earn:</strong><br>• Claim 3 daily stars (3 P Coins)<br>• Get stars on your videos<br>• Receive gifts from followers<br><br>💵 <strong>Value:</strong><br>1000 P Coins = ₹100<br><br>📅 <strong>Withdrawal:</strong><br>Every Sunday via WhatsApp.`;
    }
    else if (q.includes('income') || q.includes('earn') || q.includes('money') || q.includes('withdraw')) {
        return `💵 <strong>How to Earn Money:</strong><br><br>1️⃣ <strong>Daily Stars</strong>: Claim 3 stars daily = 3 P Coins<br>2️⃣ <strong>Upload Videos</strong>: Get stars on popular videos<br>3️⃣ <strong>Gifts</strong>: Followers can send you stars<br>4️⃣ <strong>Referral</strong>: Invite friends to earn stars<br><br>💸 <strong>Withdrawal:</strong><br>1000 P Coins = ₹100 (via WhatsApp)`;
    }
    else if (q.includes('blue tick') || q.includes('verification') || q.includes('badge')) {
        return `🔵 <strong>Blue Tick Requirements:</strong><br><br>✅ <strong>White Tick</strong>: 50 Videos<br>✅ <strong>Gray Tick</strong>: White Tick + 5,000 Stars<br>✅ <strong>Blue Tick</strong>: Gray Tick + 100 Videos + 50,000 Stars + 10,000 P Coins<br><br>Badges are awarded automatically!`;
    }
    else if (q.includes('p coin') || q.includes('পি কয়েন') || q.includes('পি কইন')) {
        return `💰 <strong>P Coin কী?</strong><br><br>P Coin হলো Pikko Shorts অ্যাপের ভার্চুয়াল কারেন্সি।<br><br>✅ <strong>P Coin পাওয়ার উপায়:</strong><br>• প্রতিদিন ৩টি স্টার ক্লেইম করে (৩ P Coin)<br>• ভিডিও আপলোড করে স্টার পেয়ে<br>• ফলোয়ারদের কাছ থেকে গিফট হিসেবে<br><br>💵 <strong>টাকায় রূপান্তর:</strong><br>1000 P Coin = 100 টাকা<br><br>📅 <strong>উত্তোলন:</strong><br>প্রতি রবিবার WhatsApp এর মাধ্যমে`;
    }
    else if (q.includes('ইনকাম') || q.includes('টাকা') || q.includes('kivabe tk')) {
        return `💵 <strong>ইনকাম করার উপায়:</strong><br><br>1️⃣ <strong>ডেইলি স্টার ক্লেইম</strong><br>প্রতিদিন ৩টি স্টার = ৩ P Coin<br>2️⃣ <strong>ভিডিও আপলোড</strong><br>জনপ্রিয় ভিডিওতে স্টার পান<br>3️⃣ <strong>গিফট</strong><br>ফলোয়াররা স্টার পাঠাতে পারে<br>4️⃣ <strong>রেফারেল</strong><br>বন্ধুদের রেফার করে স্টার পান<br><br>💸 <strong>উত্তোলন:</strong><br>1000 P Coin = 100 টাকা (WhatsApp)`;
    }
    else if (q.includes('ব্লু টিক') || q.includes('ভেরিফিকেশন') || q.includes('blue tick kivabe')) {
        return `🔵 <strong>ব্লু টিক পাওয়ার শর্ত:</strong><br><br>✅ <strong>White Tick</strong> (শুরু)<br>• ৫০টি ভিডিও<br>✅ <strong>Gray Tick</strong> (জনপ্রিয়)<br>• White Tick + ৫০০০ স্টার<br>✅ <strong>Blue Tick</strong> (লিজেন্ড)<br>• Gray Tick + ১০০টি ভিডিও<br>• ৫০,০০০ স্টার<br>• ১০,০০০ P Coin<br><br>শর্ত পূরণ হলে অটোমেটিক ব্যাজ পাবেন!`;
    }
    else if (q.includes('hello') || q.includes('hi') || q.includes('হ্যালো') || q.includes('হাই') || q.includes('नमस्ते') || q.includes('namaste')) {
        return `👋 Hello / नमस्ते / হ্যালো!<br><br>I am Pikko AI. How can I help you today?<br>मैं आपकी कैसे मदद कर सकता हूँ?<br>আমি আপনাকে কীভাবে সাহায্য করতে পারি?`;
    }
    else if (q.includes('thank') || q.includes('ধন্যবাদ') || q.includes('shukriya') || q.includes('dhanyabad')) {
        return `🙏 Thank you! / धन्यवाद! / আপনাকে ধন্যবাদ!<br><br>Stay with Pikko Shorts! ❤️`;
    }
    else {
        return `🤖 <strong>Sorry / क्षमा करें / দুঃখিত</strong><br><br>🇬🇧 I didn't understand. Ask about: <b>P Coin, Earn Money, or Blue Tick</b>.<br><br>🇮🇳 मुझे समझ नहीं आया। पूछें: <b>P Coin क्या है, पैसे कैसे कमाएं, या Blue Tick</b>.<br><br>🇧🇩 আমি বুঝতে পারিনি। জিজ্ঞাসা করতে পারেন: <b>P Coin কী, ইনকাম বা ব্লু টিক</b> সম্পর্কে।<br><br>💬 WhatsApp Support: +918391921082`;
    }
}

// ===== PROFILE PAGE WITH WALLET =====
async function renderProfile() {
    updateNavActive('Profile');
    showLoader("Loading Profile...");
    
    const user = getActiveUser();
    if (!user) { 
        renderAuth(); 
        return; 
    }

    checkAndResetDailyStars(user);

    try {
        const transactions = user.transactions || [];
        
        hideLoader();

        const letter = user.username ? user.username.replace('@', '').charAt(0).toUpperCase() : 'U';
        const col = stringToColor(user.username);
        
        let verificationBadge = '';
        if (user.verification === 'blue') 
            verificationBadge = '<div class="modern-verification-badge verification-blue"><i class="fas fa-crown"></i></div>';
        else if (user.verification === 'gray') 
            verificationBadge = '<div class="modern-verification-badge verification-gray"><i class="fas fa-shield-alt"></i></div>';
        else if (user.verification === 'white') 
            verificationBadge = '<div class="modern-verification-badge verification-white"><i class="fas fa-check"></i></div>';

        const avatarStyle = user.profilePic 
            ? `background-image:url('${user.profilePic}'); background-size:cover; background-position:center;` 
            : `background:${col}; display:flex; align-items:center; justify-content:center;`;
            
        const avatarContent = user.profilePic ? '' : letter;

        const dailyStarsHtml = renderDailyStarsUI(user);

        let transactionsHtml = '';
        if (transactions.length > 0) {
            transactions.slice(0, 10).forEach(t => {
                transactionsHtml += `
                    <div class="transaction-item">
                        <div class="transaction-icon ${t.type === 'received' ? 'received' : 'sent'}">
                            <i class="${t.type === 'received' ? 'fas fa-arrow-down' : 'fas fa-arrow-up'}"></i>
                        </div>
                        <div class="transaction-details">
                            <div class="transaction-title">${t.title || 'Transaction'}</div>
                            <div class="transaction-time">${t.time || new Date(t.timestamp).toLocaleString()}</div>
                        </div>
                        <div class="transaction-amount ${t.type === 'received' ? 'positive' : 'negative'}">
                            ${t.type === 'received' ? '+' : '-'} ${t.amount} ⭐
                        </div>
                    </div>
                `;
            });
        } else {
            transactionsHtml = '<p style="text-align:center; padding:20px; color:var(--muted-text);">No transactions yet</p>';
        }

        let totalMoney = ((user.pCoinBalance || 0) * 0.1).toFixed(2);
        
        let lifetimePcoins = user.pCoinBalance || 0;
        if (transactions && transactions.length > 0) {
            let earned = transactions.filter(t => t.type === 'received').reduce((sum, t) => sum + (t.amount || 0), 0);
            if (earned > lifetimePcoins) lifetimePcoins = earned;
        }

        contentDiv.innerHTML = `
            <div class="page-container">
                <div class="profile-header" style="position: relative;">
                    
                    <button onclick="openExchangeModal()" style="position: absolute; top: 20px; right: 20px; background: linear-gradient(135deg, #ffd700, #ff8c00); color: #000; border: 2px solid rgba(255,255,255,0.5); padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 12px; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.5); cursor: pointer; display: flex; align-items: center; gap: 5px; z-index: 10;">
                        <i class="fas fa-exchange-alt"></i> Exchange
                    </button>

                    <div class="profile-avatar-wrapper" style="position: relative; width: 120px; height: 120px; margin: 0 auto 15px;">
                        <div class="profile-avatar-lg" style="${avatarStyle} width: 120px; height: 120px; border-radius: 50%; border: 3px solid var(--primary); object-fit: cover;">${avatarContent}</div>
                        ${verificationBadge}
                    </div>
                    <h2 style="font-size:24px;">${user.name || user.username}</h2>
                    <p style="opacity:0.9;">${user.username}</p>
                    <p style="font-size:14px; margin-top:5px;">${user.bio || "No Bio"}</p>
                    
                    <div class="stats-row">
                        <div class="stat-box">
                            <span class="stat-num">${lifetimePcoins}</span>
                            <span class="stat-label">Total P Coin</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-num">${user.starBalance || 0}</span>
                            <span class="stat-label">Stars</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-num">₹${totalMoney}</span>
                            <span class="stat-label">Current Value</span>
                        </div>
                    </div>
                    
                    <button class="primary-btn" style="width:auto; padding:10px 35px; background:#333;" onclick="openEditModal()">
                        Edit Profile
                    </button>
                </div>
                
                <div class="wallet-profile-container">
                    <div class="wallet-balance-card">
                        <div class="balance-label">P Coin Balance</div>
                        <div class="balance-amount" id="profilePcoinBalance">${user.pCoinBalance || 0}</div>
                        <div style="margin-top: 10px; font-size: 14px; opacity: 0.8;">
                            <i class="fas fa-star" style="color: #ffd700;"></i> Stars: ${user.starBalance || 0}
                        </div>
                    </div>
                    
                    <div class="daily-stars-section">
                        <div class="section-title">Daily Stars</div>
                        <div class="daily-star-grid" id="profileDailyStarContainer">
                            ${dailyStarsHtml}
                        </div>
                    </div>
                    
                    <div class="withdraw-btn-modern" onclick="withdrawPcoins()">
                        <div class="withdraw-btn-left">
                            <div class="withdraw-icon">
                                <i class="fas fa-wallet"></i>
                            </div>
                            <div class="withdraw-text">
                                <h4>WITHDRAW</h4>
                                <p><i class="fas fa-whatsapp" style="margin-right: 5px;"></i> 1000 P Coin = ₹100</p>
                            </div>
                        </div>
                        <div class="withdraw-arrow">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                    </div>
                    
                    <div class="transaction-history">
                        <div class="section-title" style="margin-bottom: 15px;">
                            <i class="fas fa-history"></i> Recent Transactions
                        </div>
                        ${transactionsHtml}
                    </div>
                </div>
            </div>`;

    } catch (error) {
        hideLoader();
        console.error("Profile loading error:", error);
        showToast('Error loading profile: ' + error.message);
    }
}

// ===== DAILY STARS FUNCTIONS =====
function checkAndResetDailyStars(user) {
    const today = new Date().toDateString();
    if (!user.dailyStars) {
        user.dailyStars = { lastClaimDate: today, claimed: [false, false, false] };
    } else if (user.dailyStars.lastClaimDate !== today) {
        user.dailyStars = { lastClaimDate: today, claimed: [false, false, false] };
        saveUser(user);
    }
    return user.dailyStars;
}

function renderDailyStarsUI(user) {
    const dailyStars = checkAndResetDailyStars(user);
    let html = '';
    
    for (let i = 0; i < 3; i++) {
        const claimed = dailyStars.claimed[i];
        html += `<div class="modern-star-btn ${claimed ? 'claimed' : 'available'}" 
                      onclick="claimDailyStar(${i}, this)">
                    <i class="fas fa-star"></i>
                    <span>+1</span>
                </div>`;
    }
    return html;
}

function claimDailyStar(index, element) {
    const user = getActiveUser();
    if (!user) return;

    const dailyStars = checkAndResetDailyStars(user);

    if (dailyStars.claimed[index]) {
        showToast('Already claimed today!');
        return;
    }

    window.currentClaimIndex = index;
    window.currentClaimElement = element;

    if (typeof AndroidBridge !== "undefined") {
        AndroidBridge.showRewardAd(); 
    } else {
        processStarClaimAfterAd();
    }
}

function processStarClaimAfterAd() {
    const index = window.currentClaimIndex;
    const element = window.currentClaimElement;
    const user = getActiveUser();
    if (!user) return;

    const dailyStars = checkAndResetDailyStars(user);
    
    dailyStars.claimed[index] = true;
    user.starBalance = (user.starBalance || 0) + 1;
    user.pCoinBalance = (user.pCoinBalance || 0) + 1;

    if (!user.transactions) user.transactions = [];
    user.transactions.unshift({
        type: 'received',
        amount: 1,
        title: 'Daily Star Claim',
        timestamp: Date.now(),
        time: new Date().toLocaleString()
    });

    saveUser(user);
    
    if (element) {
        element.classList.remove('available');
        element.classList.add('claimed');
        element.style.pointerEvents = 'none';
    }
    
    addNotification(user.username, '🌟 Daily Star', 'Claimed 1 Free Star today!', 'fas fa-star', '#ffd700', 'star');
    
    const balanceEl = document.getElementById('profilePcoinBalance');
    if (balanceEl) balanceEl.innerText = user.pCoinBalance || 0;

    showToast("Congratulations! You earned 1 Star! 🌟");
}

// ===== WITHDRAW FUNCTION =====
async function withdrawPcoins() {
    const user = getActiveUser();
    if (!user) return;
    
    if (user.pCoinBalance < 1000) { 
        showToast('Need at least 1000 P Coins to withdraw'); 
        return; 
    }
    
    const coinsToDeduct = Math.floor(user.pCoinBalance / 1000) * 1000;
    const rupees = (coinsToDeduct / 1000) * 100;
    
    user.pCoinBalance -= coinsToDeduct;
    
    if (!user.transactions) user.transactions = [];
    user.transactions.unshift({
        type: 'sent',
        amount: coinsToDeduct,
        title: 'Withdrawal Processed',
        timestamp: Date.now(),
        time: new Date().toLocaleString()
    });
    
    saveUser(user);
    
    try {
        await db.collection('users').doc(user.username).update({
            pCoinBalance: user.pCoinBalance,
            transactions: user.transactions
        });
    } catch(e) {
        console.log("Firebase sync error:", e);
    }
    
    const message = `🔹 *Pikko Shorts Withdrawal Request* 🔹\n\n👤 *User:* ${user.name} (${user.username})\n💵 *Withdraw Amount:* ₹${rupees} (${coinsToDeduct} P Coins)\n💰 *Remaining Balance:* ${user.pCoinBalance}\n📅 *Date:* ${new Date().toLocaleDateString()}\n\nPlease process the withdrawal. Thank you!`;
    
    window.location.href = `https://wa.me/${WITHDRAW_WHATSAPP}?text=${encodeURIComponent(message)}`;
    showToast('Withdrawal successful! Coins deducted.');
    renderProfile();
}

// ===== VIEW OTHER PROFILE =====
async function viewOtherProfile(username) {
    const currentUser = getActiveUser();
    if (!currentUser) return;
    
    if (!username) return;
    if (username === currentUser.username) { 
        renderProfile(); 
        return; 
    }

    showLoader('Loading profile...');
    
    try {
        let profileUser = null;
        try {
            const userRef = db.collection('users').doc(username);
            const userDoc = await userRef.get();
            if (userDoc.exists) {
                profileUser = userDoc.data();
            }
        } catch (e) {
            console.error("Error loading user from Firebase:", e);
        }
        
        if (!profileUser) {
            const localUser = localStorage.getItem('user_' + username);
            if (localUser) {
                profileUser = JSON.parse(localUser);
            } else {
                profileUser = {
                    name: username.replace('@', ''),
                    username: username,
                    bio: 'Content Creator',
                    profilePic: '',
                    following: [],
                    followers: [],
                    starsReceived: 0,
                    pCoinBalance: 0,
                    verification: 'none'
                };
            }
        }

        const currentMonth = new Date().toISOString().slice(0, 7);
        if (profileUser.lastMonthReset !== currentMonth) {
            profileUser.monthlyStars = 0;
            profileUser.monthlyPcoins = 0;
            profileUser.lastMonthReset = currentMonth;
        }

        let userVideos = [];
        try {
            const videosSnapshot = await db.collection('videos')
                .where('username', '==', username)
                .orderBy('createdAt', 'desc')
                .get();
                
            videosSnapshot.forEach(doc => {
                const videoData = doc.data();
                userVideos.push({ 
                    id: doc.id, 
                    url: videoData.video_url || videoData.url,
                    caption: videoData.caption || '',
                    username: videoData.username,
                    thumbnail_time: videoData.thumbnail_time || 1
                });
            });
        } catch (e) {
            console.error("Error loading user videos:", e);
        }

        hideLoader();

        const letter = username ? username.replace('@', '').charAt(0).toUpperCase() : 'U';
        const col = stringToColor(username);
        const isFollowing = currentUser.following && currentUser.following.includes(username);
        
        let verificationBadge = '';
        if (profileUser.verification === 'blue') 
            verificationBadge = '<div class="modern-verification-badge verification-blue"><i class="fas fa-crown"></i></div>';
        else if (profileUser.verification === 'gray') 
            verificationBadge = '<div class="modern-verification-badge verification-gray"><i class="fas fa-shield-alt"></i></div>';
        else if (profileUser.verification === 'white') 
            verificationBadge = '<div class="modern-verification-badge verification-white"><i class="fas fa-check"></i></div>';

        const avatarStyle = profileUser.profilePic 
            ? `background-image:url('${profileUser.profilePic}'); background-size:cover; background-position:center;` 
            : `background:${col}; display:flex; align-items:center; justify-content:center;`;
            
        const avatarContent = profileUser.profilePic ? '' : letter;

        let videoGridHtml = '';
        if (userVideos.length === 0) {
            videoGridHtml = '<p style="text-align:center; padding:30px; color:var(--muted-text);">No videos yet</p>';
        } else {
            userVideos.forEach(v => {
                if (!v || !v.url) return;
                const thumbnailUrl = getThumbnailUrl(v.url, v.thumbnail_time || 1);
                videoGridHtml += `<div class="grid-item" onclick="playProfileVideo('${v.url}')">
                    <video src="${v.url}" poster="${thumbnailUrl}" muted></video>
                </div>`;
            });
        }

        let totalMoney = ((profileUser.pCoinBalance || 0) * 0.1).toFixed(2);
        
        let lifetimePcoins = profileUser.pCoinBalance || 0;
        if (profileUser.transactions && profileUser.transactions.length > 0) {
            let earned = profileUser.transactions.filter(t => t.type === 'received').reduce((sum, t) => sum + (t.amount || 0), 0);
            if (earned > lifetimePcoins) lifetimePcoins = earned;
        }

        contentDiv.innerHTML = `
            <div class="page-container">
                <div class="profile-header">
                    <div class="profile-avatar-wrapper" style="position: relative; width: 120px; height: 120px; margin: 0 auto 15px;">
                        <div class="profile-avatar-lg" style="${avatarStyle} width: 120px; height: 120px; border-radius: 50%; border: 3px solid var(--primary); object-fit: cover;">${avatarContent}</div>
                        ${verificationBadge}
                    </div>
                    <h2 style="font-size:24px;">${profileUser.name || username}</h2>
                    <p style="opacity:0.9;">${username}</p>
                    <p style="font-size:14px; margin-top:5px;">${profileUser.bio || "Content Creator"}</p>
                    
                    <div class="stats-row">
                        <div class="stat-box">
                            <span class="stat-num">${lifetimePcoins}</span>
                            <span class="stat-label">Total P Coin</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-num">${profileUser.starBalance || 0}</span>
                            <span class="stat-label">Stars</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-num">₹${totalMoney}</span>
                            <span class="stat-label">Current Value</span>
                        </div>
                    </div>
                    
                    <button class="primary-btn follow-btn ${isFollowing ? 'following' : ''}" 
                            style="width:auto; padding:10px 35px;" 
                            onclick="handleFollow('${username}', this)">
                        ${isFollowing ? 'Following' : 'Follow'}
                    </button>
                </div>
                
                <div class="send-star-section">
                    <button class="send-star-btn" style="background: linear-gradient(135deg, #3498db, #2980b9); box-shadow: 0 6px 15px rgba(52, 152, 219, 0.3);" onclick="openChatWindow('${username}')">
                        <i class="fas fa-comment-dots" style="font-size: 24px;"></i> Message ${profileUser.name || username}
                    </button>
                    <p class="send-star-desc">Start a private conversation with ${profileUser.name || username}</p>
                </div>
            </div>`;
    } catch (error) {
        hideLoader();
        console.error("Profile view error:", error);
        showToast("Error loading profile");
    }
}

// ===== EXPLORE PAGE =====
async function renderExplore() {
    updateNavActive('Explore');
    showLoader('Loading users...');
    
    const currentUser = getActiveUser();
    if (!currentUser) return;

    try {
        const users = [];
        
        try {
            const snapshot = await db.collection('users').get();
            snapshot.forEach(doc => {
                const user = doc.data();
                if (user && user.username !== currentUser.username) {
                    users.push(user);
                }
            });
        } catch (e) {
            console.error("Error loading users from Firebase:", e);
        }
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('user_')) {
                try {
                    const user = JSON.parse(localStorage.getItem(key));
                    if (user && user.username !== currentUser.username && 
                        !users.find(u => u.username === user.username)) {
                        users.push(user);
                    }
                } catch (e) { }
            }
        }
        
        let searches = JSON.parse(localStorage.getItem('recentSearches_' + currentUser.username)) || [];
        let searchHistoryHtml = '';
        if (searches.length > 0) {
            searchHistoryHtml = '<div class="search-history">';
            searches.forEach(s => {
                searchHistoryHtml += `<span class="search-history-item" onclick="searchUsers('${s}')">
                                        <i class="fas fa-history"></i> ${s}
                                        <i class="fas fa-times" onclick="event.stopPropagation(); removeSearch('${s}')"></i>
                                      </span>`;
            });
            searchHistoryHtml += '</div>';
        }
        
        hideLoader();
        
        let html = `
            <div class="explore-container">
                <div class="search-bar">
                    <i class="fas fa-search" style="color:var(--muted-text);"></i>
                    <input type="text" id="searchInput" placeholder="Search users..." 
                           oninput="searchUsers(this.value)">
                </div>
                <div id="searchResults" style="display: none; margin-bottom: 15px;"></div>
                ${searchHistoryHtml}
                
                <div class="category-scroll">
                    <div class="category-chip" onclick="filterUsers('all')">👥 All</div>
                    <div class="category-chip" onclick="filterUsers('following')">✓ Following</div>
                    <div class="category-chip" onclick="filterUsers('verified')">✓ Verified</div>
                </div>
                
                <div class="users-container" id="usersContainer">
                    <h3 style="margin-bottom:15px; font-size:18px;">All Users (${users.length})</h3>
                    <div class="users-list" id="usersList">
        `;
        
        if (users.length === 0) {
            html += '<p style="text-align:center; color:var(--muted-text); padding:30px;">No users found</p>';
        } else {
            users.forEach(user => {
                if (!user) return;
                
                const isFollowing = currentUser.following && currentUser.following.includes(user.username);
                const userColor = stringToColor(user.username);
                const letter = user.username ? user.username.replace('@', '').charAt(0).toUpperCase() : 'U';
                
                const avatarStyle = user.profilePic 
                    ? `background-image:url('${user.profilePic}'); background-size:cover; background-position:center;` 
                    : `background:${userColor}; display:flex; align-items:center; justify-content:center;`;
                
                let badgeIcon = '';
                if (user.verification === 'blue') badgeIcon = '<i class="fas fa-crown" style="color:#1da1f2; margin-left:5px;"></i>';
                else if (user.verification === 'gray') badgeIcon = '<i class="fas fa-shield-alt" style="color:#95a5a6; margin-left:5px;"></i>';
                else if (user.verification === 'white') badgeIcon = '<i class="fas fa-check" style="color:#ecf0f1; margin-left:5px;"></i>';
                
                html += `
                    <div class="user-card" onclick="viewOtherProfile('${user.username}')">
                        <div class="user-avatar-lg" style="${avatarStyle}">
                            ${user.profilePic ? '' : letter}
                        </div>
                        <div class="user-info">
                            <div class="user-name">
                                ${user.name || user.username} ${badgeIcon}
                            </div>
                            <div class="user-username">${user.username}</div>
                            <div class="user-stats">
                                <span><i class="fas fa-star" style="color:#ffd700;"></i> ${user.starBalance || 0}</span>
                                <span><i class="fas fa-coins" style="color:#ffd700;"></i> ${user.pCoinBalance || 0}</span>
                            </div>
                        </div>
                        <button class="follow-small-btn ${isFollowing ? 'following' : ''}" 
                                onclick="event.stopPropagation(); handleFollow('${user.username}', this)">
                            ${isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>
                `;
            });
        }
        
        html += `
                    </div>
                </div>
            </div>
        `;
        
        contentDiv.innerHTML = html;
        
    } catch (error) {
        hideLoader();
        console.error("Explore error:", error);
        showToast('Error loading users');
    }
}

// ===== SEARCH USERS =====
function searchUsers(query) {
    if (!query || !query.trim()) {
        document.getElementById('searchResults').style.display = 'none';
        return;
    }
    
    query = query.toLowerCase();
    const resultsDiv = document.getElementById('searchResults');
    
    const userCards = document.querySelectorAll('.user-card');
    const usersList = document.getElementById('usersList');
    
    if (usersList) {
        let found = false;
        userCards.forEach(card => {
            const name = card.querySelector('.user-name')?.innerText.toLowerCase() || '';
            const username = card.querySelector('.user-username')?.innerText.toLowerCase() || '';
            
            if (name.includes(query) || username.includes(query)) {
                card.style.display = 'flex';
                found = true;
            } else {
                card.style.display = 'none';
            }
        });
        
        if (!found) {
            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = '<p style="color: var(--muted-text); text-align: center; padding: 15px;">No users found</p>';
        } else {
            resultsDiv.style.display = 'none';
        }
    }
}

function filterUsers(filter) {
    const userCards = document.querySelectorAll('.user-card');
    const currentUser = getActiveUser();
    
    userCards.forEach(card => {
        const username = card.querySelector('.user-username')?.innerText;
        const followBtn = card.querySelector('.follow-small-btn');
        const isFollowing = followBtn && followBtn.classList.contains('following');
        
        if (filter === 'all') {
            card.style.display = 'flex';
        } else if (filter === 'following') {
            card.style.display = isFollowing ? 'flex' : 'none';
        } else if (filter === 'verified') {
            const hasBadge = card.querySelector('.fa-crown, .fa-shield-alt, .fa-check');
            card.style.display = hasBadge ? 'flex' : 'none';
        }
    });
}

function saveSearch(query) {
    if (!query || !query.trim()) return;
    let user = getActiveUser();
    if (!user) return;

    let searches = JSON.parse(localStorage.getItem('recentSearches_' + user.username)) || [];
    if (!searches.includes(query)) {
        searches.unshift(query);
        searches = searches.slice(0, 5);
        localStorage.setItem('recentSearches_' + user.username, JSON.stringify(searches));
    }
}

function removeSearch(query) {
    let user = getActiveUser();
    if (!user) return;

    let searches = JSON.parse(localStorage.getItem('recentSearches_' + user.username)) || [];
    searches = searches.filter(s => s !== query);
    localStorage.setItem('recentSearches_' + user.username, JSON.stringify(searches));
    renderExplore();
}

// ===== COMMENTS =====
function openComments(id) {
    if (!id) return;
    currentVideoId = id;
    document.getElementById('commentModal').style.display = 'flex';
    loadComments();
}

function closeComments() {
    document.getElementById('commentModal').style.display = 'none';
}

function loadComments() {
    const l = document.getElementById('commentList');
    if (!l) return;
    
    const c = localStorage.getItem('comments_' + currentVideoId);
    let arr = c ? JSON.parse(c) : [];

    if (arr.length === 0) {
        arr = [
            { user: "@john_doe", text: "Nice video! 🔥", time: Date.now() - 3600000 },
            { user: "@jane_smith", text: "Love this 😍", time: Date.now() - 7200000 },
            { user: "@random_user", text: "Keep it up!", time: Date.now() - 86400000 }
        ];
        localStorage.setItem('comments_' + currentVideoId, JSON.stringify(arr));
    }

    const countSpan = document.getElementById('commentCount');
    if (countSpan) countSpan.innerText = `(${arr.length})`;
    
    l.innerHTML = arr.map(x => `
        <div style="display:flex; gap:10px; margin-bottom:15px;">
            <div style="width:40px; height:40px; border-radius:50%; background:${stringToColor(x.user)}; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold;">
                ${x.user.charAt(1).toUpperCase()}
            </div>
            <div style="flex:1;">
                <b>${x.user}</b>
                <p style="color:var(--text); margin:3px 0;">${x.text}</p>
                <small style="color:var(--muted-text);">${new Date(x.time).toLocaleTimeString()}</small>
            </div>
        </div>
    `).join('');
}

function postComment() {
    const t = document.getElementById('commentInput');
    if (!t) return;
    const text = t.value;
    if (!text) return;

    const u = getActiveUser();
    if (!u) return;

    const c = localStorage.getItem('comments_' + currentVideoId);
    const arr = c ? JSON.parse(c) : [];
    arr.push({ user: u.username, text: text, time: Date.now() });
    localStorage.setItem('comments_' + currentVideoId, JSON.stringify(arr));
    t.value = "";
    loadComments();

    let video = allVideos.find(v => v && v.id === currentVideoId);
    if (video && video.username && video.username !== u.username) {
        addNotification(video.username, '💬 New Comment', `${u.username} commented: ${text.substring(0, 20)}...`, 'fas fa-comment', '#00f2ea', 'comment');
    }
}

// ===== VIDEO OPTIONS =====
function openVideoOptions(username, videoId, videoUrl) {
    if (!username || !videoId) return;
    
    currentVideoUser = username;
    currentVideoId = videoId;

    let u = getActiveUser();
    if (!u) return;

    let isMuted = u.muted && u.muted.includes(username);
    let isReported = u.reported && u.reported.includes(videoId);
    let isOwnVideo = (u.username === username);

    let menuHtml = `
        <div class="user-row" onclick="addToPlaylistPrompt('${videoId}')">
            <i class="fas fa-list" style="width:30px;"></i>
            <span>Save to Playlist</span>
        </div>`;

    if (!isOwnVideo) {
        menuHtml += `
            <div class="user-row" onclick="toggleMuteUser('${username}')">
                <i class="fas fa-volume-mute" style="width:30px;"></i>
                <span>${isMuted ? 'Unmute' : 'Mute'} @${username}</span>
            </div>
            <div class="user-row" onclick="blockUser('${username}')">
                <i class="fas fa-ban" style="width:30px; color:#ff4444;"></i>
                <span style="color:#ff4444;">Block @${username}</span>
            </div>
            <div class="user-row" onclick="reportVideo('${videoId}')">
                <i class="fas fa-flag" style="width:30px; color:#ffaa00;"></i>
                <span style="color:#ffaa00;">${isReported ? 'Already Reported' : 'Report Video'}</span>
            </div>`;
    } else {
        menuHtml += `
            <div class="user-row" onclick="deleteVideo('${videoId}')" style="color:#ff4444;">
                <i class="fas fa-trash" style="width:30px;"></i>
                <span>Delete Video</span>
            </div>`;
    }

    const content = document.getElementById('videoMenuContent');
    if (content) content.innerHTML = menuHtml;
    document.getElementById('videoMenuModal').style.display = 'flex';
}

function deleteVideo(videoId) {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    db.collection('videos').doc(videoId).delete()
        .then(() => {
            showToast('Video deleted successfully');
            document.getElementById('videoMenuModal').style.display = 'none';
            renderHome();
        })
        .catch(error => {
            console.error("Error deleting video:", error);
            showToast('Error deleting video');
        });
}

function toggleMuteUser(username) {
    let u = getActiveUser();
    if (!u) return;
    if (!u.muted) u.muted = [];

    if (u.muted.includes(username)) {
        u.muted = u.muted.filter(x => x !== username);
        showToast(`@${username} unmuted`);
    } else {
        u.muted.push(username);
        showToast(`@${username} muted. Their videos won't appear in feed.`);
    }
    saveUser(u);
    document.getElementById('videoMenuModal').style.display = 'none';
    renderHome();
}

function blockUser(username) {
    if (!confirm(`Block @${username}? You won't see their videos.`)) return;
    
    let u = getActiveUser();
    if (!u) return;
    if (!u.blocked) u.blocked = [];
    u.blocked.push(username);
    saveUser(u);
    showToast(`@${username} blocked`);
    document.getElementById('videoMenuModal').style.display = 'none';
    renderHome();
}

function reportVideo(videoId) {
    let u = getActiveUser();
    if (!u) return;
    if (!u.reported) u.reported = [];

    if (u.reported.includes(videoId)) {
        showToast('Already reported this video');
    } else {
        u.reported.push(videoId);
        saveUser(u);
        showToast('Video reported. Thank you for keeping our community safe.');
    }
    document.getElementById('videoMenuModal').style.display = 'none';
}

// ===== UPLOAD FUNCTIONS =====
function showCameraOptions() { 
    document.getElementById('cameraOptionsModal').style.display = 'flex'; 
}

function openCamera(facingMode) {
    document.getElementById('cameraOptionsModal').style.display = 'none';
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    
    if (isMobile) {
        input.capture = facingMode;
    }
    
    input.onchange = function(e) { 
        if (e.target.files && e.target.files[0]) handleVideoFile(e.target.files[0]); 
    };
    input.click();
}

function openGallery() {
    document.getElementById('cameraOptionsModal').style.display = 'none';
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = function (e) { 
        if (e.target.files && e.target.files[0]) handleVideoFile(e.target.files[0]); 
    };
    input.click();
}

function handleVideoFile(file) { 
    renderUploadWithVideo(file); 
}

function generateVideoThumbnails(videoFile) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = function() {
            const duration = video.duration;
            const times = [1, 2, 3, 4, 5].filter(t => t < duration);
            
            if (times.length === 0) times.push(1);
            
            videoThumbnails = times;
            resolve(times);
        };
        
        video.src = URL.createObjectURL(videoFile);
    });
}

function renderUploadWithVideo(videoFile) {
    updateNavActive('Upload');
    windowSelectedVideoFile = videoFile;
    
    generateVideoThumbnails(videoFile).then(times => {
        selectedThumbnailTime = times[0] || 1;
        
        const reader = new FileReader();
        reader.onload = function (e) {
            contentDiv.innerHTML = `
                <div class="form-container" style="padding:20px; text-align:center; height:100%; overflow-y:auto; padding-bottom:90px;">
                    <h2 style="margin:20px 0;">Upload Video</h2>
                    <video id="uploadPreview" class="upload-preview" controls src="${e.target.result}"></video>
                    
                    <div style="margin:15px 0;">
                        <h4 style="margin-bottom:10px;">Select Thumbnail</h4>
                        <div class="thumbnail-selector" id="thumbnailSelector"></div>
                    </div>
                    
                    <input type="text" id="vCap" class="input-field" placeholder="Write a caption...">
                    
                    <div id="uploadProgress" style="display: none;">
                        <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
                        <div class="progress-text" id="progressPercent">0%</div>
                    </div>
                    
                    <button class="primary-btn" onclick="uploadVideo()" id="uploadBtn">Post Video</button>
                    <button class="primary-btn" style="background:#444; margin-top:10px;" onclick="renderHome()">Cancel</button>
                </div>`;
            
            const selector = document.getElementById('thumbnailSelector');
            if (selector) {
                times.forEach(time => {
                    selector.innerHTML += `
                        <div class="thumbnail-option ${time === selectedThumbnailTime ? 'selected' : ''}" 
                             onclick="selectThumbnailTime(${time})">
                            <video src="${URL.createObjectURL(videoFile)}" muted 
                                   onloadeddata="this.currentTime=${time}; this.pause();"></video>
                        </div>`;
                });
            }
        };
        reader.readAsDataURL(videoFile);
    });
}

function selectThumbnailTime(time) {
    selectedThumbnailTime = time;
    document.querySelectorAll('.thumbnail-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
}

async function uploadVideo() {
    const captionInput = document.getElementById('vCap');
    if (!captionInput) return;
    
    const caption = captionInput.value;
    const user = getActiveUser();
    let file = windowSelectedVideoFile;
    
    if (!file) return showToast("Select a video file");
    if (!caption) return showToast("Add a caption");

    showLoader("Uploading to Cloudinary...");
    
    const progressDiv = document.getElementById('uploadProgress');
    if (progressDiv) progressDiv.style.display = 'block';
    
    const fill = document.getElementById('progressFill');
    const percent = document.getElementById('progressPercent');

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_default');

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://api.cloudinary.com/v1_1/dtzjo3zdp/video/upload', true);

        xhr.upload.onprogress = function(e) {
            if (e.lengthComputable) {
                const p = Math.round((e.loaded / e.total) * 100);
                if (fill) fill.style.width = p + '%';
                if (percent) percent.innerText = p + '%';
            }
        };

        xhr.onload = async function() {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                const videoLink = response.secure_url;
                
                showLoader("Saving to database...");
                
                try {
                    const videoData = {
                        video_url: videoLink,
                        url: videoLink,
                        caption: caption,
                        username: user.username,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        likes_count: 0,
                        comment_count: 0,
                        thumbnail_time: selectedThumbnailTime || 1
                    };
                    
                    await db.collection('videos').add(videoData);
                    
                    hideLoader();
                    showToast("Video uploaded successfully!");
                    
                    setTimeout(() => renderProfile(), 1500);
                    
                } catch (dbError) {
                    hideLoader();
                    console.error("Firestore Error:", dbError);
                    showToast("Database error: " + dbError.message);
                }
            } else {
                hideLoader();
                try {
                    const err = JSON.parse(xhr.responseText);
                    showToast("Upload failed: " + (err.error?.message || "Unknown"));
                } catch {
                    showToast("Upload failed: Unknown error");
                }
            }
        };
        
        xhr.onerror = function() { 
            hideLoader(); 
            showToast("Upload failed! Check connection."); 
        };
        
        xhr.send(formData);
        
    } catch (error) {
        hideLoader();
        showToast("Upload failed: " + error.message);
    }
}

// ===== EDIT PROFILE =====
function openEditModal() {
    const u = getActiveUser();
    if (!u) return;

    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'flex';
    
    const nameInput = document.getElementById('editName');
    const usernameInput = document.getElementById('editUsername');
    const bioInput = document.getElementById('editBio');
    const previewPic = document.getElementById('previewPic');
    
    if (nameInput) nameInput.value = u.name || '';
    if (usernameInput) usernameInput.value = u.username ? u.username.replace('@', '') : '';
    if (bioInput) bioInput.value = u.bio || '';
    
    if (previewPic) {
        if (u.profilePic) {
            previewPic.style.backgroundImage = `url('${u.profilePic}')`;
            previewPic.style.backgroundSize = 'cover';
            previewPic.style.backgroundPosition = 'center';
            previewPic.innerHTML = '';
        } else {
            previewPic.style.backgroundImage = 'none';
            const letter = u.username ? u.username.replace('@', '').charAt(0).toUpperCase() : 'U';
            previewPic.innerHTML = `<span style="font-size: 40px; color: var(--muted-text);">${letter}</span>`;
        }
    }
}

function previewImage(input) {
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 300; 
            const MAX_HEIGHT = 300;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6); 
            
            const previewPic = document.getElementById('previewPic');
            if (previewPic) {
                previewPic.style.backgroundImage = `url('${compressedBase64}')`;
                previewPic.style.backgroundSize = 'cover';
                previewPic.style.backgroundPosition = 'center';
                previewPic.innerHTML = '';
                window.tempProfilePic = compressedBase64;
                showToast('Image optimized & selected!');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function saveProfileChanges() {
    let user = getActiveUser();
    if (!user) return;

    const nameInput = document.getElementById('editName');
    const bioInput = document.getElementById('editBio');
    const usernameInput = document.getElementById('editUsername');
    const previewPic = document.getElementById('previewPic');
    
    if (!nameInput || !bioInput || !usernameInput) return;
    
    const newName = nameInput.value.trim();
    const newBio = bioInput.value.trim();
    let newUsernameRaw = usernameInput.value.trim();
    
    if (!newName) {
        showToast('Name cannot be empty');
        return;
    }
    
    if (!newUsernameRaw) {
        showToast('Username cannot be empty');
        return;
    }
    
    const newUsername = '@' + newUsernameRaw.replace(/^@/, '');
    
    let profilePicSaved = false;
    
    if (previewPic) {
        const bg = previewPic.style.backgroundImage;
        if (bg && bg.includes('url')) {
            const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
            if (match && match[1]) {
                user.profilePic = match[1];
                profilePicSaved = true;
            }
        }
    }
    
    if (!profilePicSaved && window.tempProfilePic) {
        user.profilePic = window.tempProfilePic;
        profilePicSaved = true;
    }
    
    if (newUsername !== user.username) {
        if (localStorage.getItem('user_' + newUsername)) {
            showToast('Username already exists');
            return;
        }

        const oldUsername = user.username;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('user_')) {
                try {
                    const otherUser = JSON.parse(localStorage.getItem(key));
                    if (!otherUser || otherUser.username === oldUsername) continue;

                    let updated = false;
                    
                    if (otherUser.following && otherUser.following.includes(oldUsername)) {
                        otherUser.following = otherUser.following.map(u => u === oldUsername ? newUsername : u);
                        updated = true;
                    }
                    if (otherUser.followers && otherUser.followers.includes(oldUsername)) {
                        otherUser.followers = otherUser.followers.map(u => u === oldUsername ? newUsername : u);
                        updated = true;
                    }
                    
                    if (updated) {
                        localStorage.setItem(key, JSON.stringify(otherUser));
                    }
                } catch (e) {
                    console.error("Error updating other user:", e);
                }
            }
        }

        const notifKey = 'notifications_' + oldUsername;
        const notifData = localStorage.getItem(notifKey);
        if (notifData) {
            localStorage.setItem('notifications_' + newUsername, notifData);
            localStorage.removeItem(notifKey);
        }

        localStorage.removeItem('user_' + oldUsername);
        user.username = newUsername;
    }

    user.name = newName;
    user.bio = newBio;

    const saveResult = saveUser(user);
    
    try {
        db.collection('users').doc(user.username).update({
            name: user.name,
            bio: user.bio,
            profilePic: user.profilePic || ""
        });
    } catch(e) { 
        console.log("Firebase profile update error:", e); 
    }
    
    if (saveResult !== false) {
        window.tempProfilePic = null;
        
        const modal = document.getElementById('editModal');
        if (modal) modal.style.display = 'none';
        
        showToast('Profile updated successfully!');
        
        setTimeout(() => {
            renderProfile();
        }, 500);
    } else {
        showToast('Error saving profile');
    }
}

// ===== SHARE PROFILE =====
function shareProfile() {
    const user = getActiveUser();
    if (!user) return;
    const profileLink = `https://yourapp.com/profile/${user.username}`;
    navigator.clipboard?.writeText(profileLink);
    showToast('Profile link copied!');
    closeMenu();
}

// ===== REFER & EARN =====
function referEarn() {
    const user = getActiveUser();
    if (!user) return;
    const refLink = `https://yourapp.com/ref/${user.referralCode}`;
    navigator.clipboard?.writeText(refLink);
    showToast(`Referral link copied! You get 10 stars when someone signs up with your link.`);
    closeMenu();
}

// ===== BACKUP / RESTORE =====
function openBackupRestore() {
    const user = getActiveUser();
    if (!user) return;
    const dataStr = JSON.stringify(user);
    prompt('Copy this backup code (save it safely):', btoa(dataStr));
    closeMenu();
}

// ===== PLAYLIST FUNCTIONS =====
function renderPlaylists() {
    closeMenu();
    let u = getActiveUser();
    if (!u) return;
    if (!u.playlists) u.playlists = [];

    let html = `
        <div class="page-container">
            <div class="profile-header">
                <h2 style="font-size:24px;">My Playlists</h2>
                <button class="primary-btn" style="width:auto; padding:10px 35px; margin-top:15px;" onclick="openCreatePlaylistModal()">
                    <i class="fas fa-plus"></i> New Playlist
                </button>
            </div>
            <div id="playlistGrid" style="padding:15px;">
    `;

    if (u.playlists.length === 0) {
        html += `<p style="text-align:center; color:var(--muted-text); padding:30px;">No playlists yet</p>`;
    } else {
        u.playlists.forEach((pl, index) => {
            if (!pl) return;
            html += `
                <div class="playlist-item" onclick="viewPlaylist(${index})">
                    <div class="playlist-thumb">
                        <i class="fas fa-film"></i>
                    </div>
                    <div style="flex:1;">
                        <b>${pl.name || 'Unnamed'}</b>
                        <div style="font-size:13px; color:var(--muted-text);">${(pl.videos || []).length} videos</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color:var(--muted-text);"></i>
                </div>
            `;
        });
    }

    html += `</div></div>`;
    contentDiv.innerHTML = html;
}

function openCreatePlaylistModal() {
    document.getElementById('playlistModal').style.display = 'flex';
}

function createPlaylist() {
    let name = document.getElementById('playlistName');
    if (!name) return;
    
    let playlistName = name.value;
    if (!playlistName) return showToast('Enter playlist name');

    let u = getActiveUser();
    if (!u) return;
    if (!u.playlists) u.playlists = [];

    u.playlists.push({
        id: Date.now(),
        name: playlistName,
        videos: []
    });

    saveUser(u);
    document.getElementById('playlistModal').style.display = 'none';
    renderPlaylists();
}

function addToPlaylistPrompt(videoId) {
    let u = getActiveUser();
    if (!u) return;

    if (!u.playlists || u.playlists.length === 0) {
        if (confirm('No playlists found. Create one?')) {
            document.getElementById('videoMenuModal').style.display = 'none';
            openCreatePlaylistModal();
        }
        return;
    }

    let menuHtml = '<div style="padding:12px;"><h4>Select Playlist</h4></div>';
    u.playlists.forEach((pl, index) => {
        if (!pl) return;
        menuHtml += `
            <div class="user-row" onclick="addVideoToPlaylist(${index}, '${videoId}')">
                <i class="fas fa-list"></i>
                <span>${pl.name || 'Unnamed'} (${(pl.videos || []).length})</span>
            </div>
        `;
    });

    document.getElementById('videoMenuContent').innerHTML = menuHtml;
}

function addVideoToPlaylist(playlistIndex, videoId) {
    let u = getActiveUser();
    if (!u) return;
    if (!u.playlists || !u.playlists[playlistIndex]) return;

    if (!u.playlists[playlistIndex].videos) {
        u.playlists[playlistIndex].videos = [];
    }

    if (!u.playlists[playlistIndex].videos.includes(videoId)) {
        u.playlists[playlistIndex].videos.push(videoId);
        saveUser(u);
        showToast('Added to playlist');
    } else {
        showToast('Already in playlist');
    }
    document.getElementById('videoMenuModal').style.display = 'none';
}

function viewPlaylist(index) {
    let u = getActiveUser();
    if (!u) return;
    if (!u.playlists || !u.playlists[index]) return;
    
    let playlist = u.playlists[index];

    db.collection('videos').get().then((snapshot) => {
        let allVids = [];
        snapshot.forEach(doc => {
            const videoData = doc.data();
            allVids.push({ 
                id: doc.id, 
                url: videoData.video_url || videoData.url,
                caption: videoData.caption,
                username: videoData.username,
                thumbnail_time: videoData.thumbnail_time || 1
            });
        });
        
        let videos = allVids.filter(v => playlist.videos && playlist.videos.includes(v.id));

        let html = `
            <div class="page-container">
                <div class="profile-header">
                    <h2 style="font-size:22px;">${playlist.name || 'Playlist'}</h2>
                    <p style="margin-top:5px;">${videos.length} videos</p>
                    <button class="primary-btn" style="width:auto; padding:8px 25px; margin-top:15px;" onclick="deletePlaylist(${index})">
                        Delete Playlist
                    </button>
                </div>
                <div class="video-grid">
        `;

        if (videos.length === 0) {
            html += '<p style="text-align:center; padding:30px;">No videos in this playlist</p>';
        } else {
            videos.forEach(v => {
                if (!v || !v.url) return;
                const thumbnailUrl = getThumbnailUrl(v.url, v.thumbnail_time || 1);
                html += `<div class="grid-item" onclick="playProfileVideo('${v.url}')">
                    <video src="${v.url}" poster="${thumbnailUrl}" muted></video>
                </div>`;
            });
        }

        html += `</div></div>`;
        contentDiv.innerHTML = html;
    });
}

function deletePlaylist(index) {
    if (!confirm('Delete this playlist?')) return;
    
    let u = getActiveUser();
    if (!u) return;
    if (!u.playlists) return;
    
    u.playlists.splice(index, 1);
    saveUser(u);
    renderPlaylists();
}

// ===== VERIFICATION =====
function renderVerificationInfo() {
    closeMenu();
    const user = getActiveUser();
    if (!user) return;

    db.collection('videos').where('username', '==', user.username).get()
        .then((snapshot) => {
            const myVideosCount = snapshot.size;
            const starsReceived = user.starsReceived || 0;
            const pCoins = user.pCoinBalance || 0;

            const whiteProgress = Math.min(100, (myVideosCount / 50) * 100);
            const grayVideoProgress = Math.min(100, (myVideosCount / 50) * 100);
            const grayStarProgress = Math.min(100, (starsReceived / 5000) * 100);
            const blueVideoProgress = Math.min(100, (myVideosCount / 100) * 100);
            const blueStarProgress = Math.min(100, (starsReceived / 50000) * 100);
            const blueCoinProgress = Math.min(100, (pCoins / 10000) * 100);

            let whiteTick = myVideosCount >= 50;
            let grayTick = whiteTick && starsReceived >= 5000;
            let blueTick = grayTick && myVideosCount >= 100 && starsReceived >= 50000 && pCoins >= 10000;

            let currentTick = 'none';
            if (blueTick) currentTick = 'blue';
            else if (grayTick) currentTick = 'gray';
            else if (whiteTick) currentTick = 'white';

            user.verification = currentTick;
            saveUser(user);

            const html = `
                <div style="padding: 5px;">
                    <div class="verification-tier-card white-card">
                        <div class="verification-tier-title">
                            <div class="modern-verification-badge verification-white" style="position: static; border: none; width: 40px; height: 40px;">
                                <i class="fas fa-check"></i>
                            </div>
                            <div>
                                <span style="font-size: 20px; font-weight: bold;">White Tick</span>
                                <span style="font-size: 13px; color: var(--muted-text); display: block;">Beginner Creator</span>
                            </div>
                        </div>
                        
                        <div class="requirement-check">
                            <i class="fas ${myVideosCount >= 50 ? 'fa-check-circle' : 'fa-circle'}"></i>
                            <span>${myVideosCount}/50 Videos</span>
                        </div>
                        <div class="verification-progress">
                            <div class="verification-progress-bar progress-white" style="width: ${whiteProgress}%"></div>
                        </div>
                        
                        ${whiteTick ?
                    '<p style="color: #2ecc71; margin-top: 10px;"><i class="fas fa-check-circle"></i> White Tick Unlocked!</p>' :
                    '<p style="color: var(--muted-text); margin-top: 10px;">Need ' + (50 - myVideosCount) + ' more videos</p>'}
                    </div>
                    
                    <div class="verification-tier-card gray-card">
                        <div class="verification-tier-title">
                            <div class="modern-verification-badge verification-gray" style="position: static; border: none; width: 40px; height: 40px;">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <div>
                                <span style="font-size: 20px; font-weight: bold;">Gray Tick</span>
                                <span style="font-size: 13px; color: var(--muted-text); display:block;">Popular Creator</span>
                            </div>
                        </div>
                        
                        <div class="requirement-check">
                            <i class="fas ${myVideosCount >= 50 ? 'fa-check-circle' : 'fa-circle'}"></i>
                            <span>${myVideosCount}/50 Videos</span>
                        </div>
                        <div class="verification-progress">
                            <div class="verification-progress-bar progress-gray" style="width: ${grayVideoProgress}%"></div>
                        </div>
                        
                        <div class="requirement-check">
                            <i class="fas ${starsReceived >= 5000 ? 'fa-check-circle' : 'fa-circle'}"></i>
                            <span>${starsReceived.toLocaleString()}/5,000 Stars</span>
                        </div>
                        <div class="verification-progress">
                            <div class="verification-progress-bar progress-gray" style="width: ${grayStarProgress}%"></div>
                        </div>
                        
                        ${grayTick ?
                    '<p style="color: #2ecc71; margin-top: 10px;"><i class="fas fa-check-circle"></i> Gray Tick Unlocked!</p>' :
                    '<p style="color: var(--muted-text); margin-top: 10px;">Need ' + (5000 - starsReceived) + ' more stars</p>'}
                    </div>
                    
                    <div class="verification-tier-card blue-card">
                        <div class="verification-tier-title">
                            <div class="modern-verification-badge verification-blue" style="position: static; border: none; width: 40px; height: 40px;">
                                <i class="fas fa-crown"></i>
                            </div>
                            <div>
                                <span style="font-size: 20px; font-weight: bold;">Blue Tick</span>
                                <span style="font-size: 13px; color: var(--muted-text); display: block;">Legendary Creator</span>
                            </div>
                        </div>
                        
                        <div class="requirement-check">
                            <i class="fas ${myVideosCount >= 100 ? 'fa-check-circle' : 'fa-circle'}"></i>
                            <span>${myVideosCount}/100 Videos</span>
                        </div>
                        <div class="verification-progress">
                            <div class="verification-progress-bar progress-blue" style="width: ${blueVideoProgress}%"></div>
                        </div>
                        
                        <div class="requirement-check">
                            <i class="fas ${starsReceived >= 50000 ? 'fa-check-circle' : 'fa-circle'}"></i>
                            <span>${starsReceived.toLocaleString()}/50,000 Stars</span>
                        </div>
                        <div class="verification-progress">
                            <div class="verification-progress-bar progress-blue" style="width: ${blueStarProgress}%"></div>
                        </div>
                        
                        <div class="requirement-check">
                            <i class="fas ${pCoins >= 10000 ? 'fa-check-circle' : 'fa-circle'}"></i>
                            <span>${pCoins.toLocaleString()}/10,000 P Coins</span>
                        </div>
                        <div class="verification-progress">
                            <div class="verification-progress-bar progress-blue" style="width: ${blueCoinProgress}%"></div>
                        </div>
                        
                        ${blueTick ?
                    '<p style="color: #2ecc71; margin-top: 10px;"><i class="fas fa-check-circle"></i> Blue Tick Unlocked! You are legendary!</p>' :
                    '<p style="color: var(--muted-text); margin-top: 10px;">Keep creating amazing content!</p>'}
                    </div>
                    
                    <div style="background: var(--input-bg); border-radius: 15px; padding: 18px; margin-top: 20px;">
                        <p style="color: var(--muted-text); font-size: 14px;">
                            <i class="fas fa-info-circle" style="margin-right:5px;"></i> Verification badges are automatically updated when you meet the requirements.
                        </p>
                    </div>
                </div>
            `;

            document.getElementById('userVerificationDetails').innerHTML = html;
            document.getElementById('verificationModal').style.display = 'flex';
        })
        .catch(error => {
            console.error("Error loading videos for verification:", error);
            showToast("Error loading verification data");
        });
}

// ===== GIFT FUNCTIONS =====
function openGiftModal(creatorUsername) {
    if (!creatorUsername) return;
    
    currentGiftVideoCreator = creatorUsername;
    const user = getActiveUser();
    if (!user) return;
    if (user.username === creatorUsername) { 
        showToast("You can't gift yourself!"); 
        return; 
    }

    const balanceSpan = document.getElementById('senderStarBalance');
    if (balanceSpan) balanceSpan.innerText = user.starBalance || 0;
    
    const creatorSpan = document.getElementById('giftCreator');
    if (creatorSpan) creatorSpan.innerText = creatorUsername;
    
    const slider = document.getElementById('giftSlider');
    if (slider) {
        slider.value = 1;
        selectedStars = 1;
    }
    
    const sliderValue = document.getElementById('giftSliderValue');
    if (sliderValue) sliderValue.innerText = '1';

    document.querySelectorAll('.gift-package').forEach(p => p.classList.remove('selected'));
    const firstPackage = document.querySelector('.gift-package[data-stars="1"]');
    if (firstPackage) firstPackage.classList.add('selected');

    document.getElementById('giftModal').style.display = 'flex';
}

function selectGiftPackage(stars) {
    selectedStars = stars;
    const slider = document.getElementById('giftSlider');
    if (slider) slider.value = stars;
    
    const sliderValue = document.getElementById('giftSliderValue');
    if (sliderValue) sliderValue.innerText = stars;
    
    document.querySelectorAll('.gift-package').forEach(p => p.classList.remove('selected'));
    const selected = document.querySelector(`.gift-package[data-stars="${stars}"]`);
    if (selected) selected.classList.add('selected');
}

function updateGiftSlider() {
    const slider = document.getElementById('giftSlider');
    if (!slider) return;
    
    const val = slider.value;
    const sliderValue = document.getElementById('giftSliderValue');
    if (sliderValue) sliderValue.innerText = val;
    
    selectedStars = parseInt(val);
    document.querySelectorAll('.gift-package').forEach(p => p.classList.remove('selected'));
}

async function sendGift() {
    const user = getActiveUser();
    if (!user) return;
    
    if (!currentGiftVideoCreator) {
        showToast('Error: No recipient');
        return;
    }
    
    if (user.starBalance < selectedStars) { 
        showToast('Not enough stars!'); 
        return; 
    }

    user.starBalance -= selectedStars;
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (user.lastMonthReset !== currentMonth) {
        user.monthlyStars = 0;
        user.lastMonthReset = currentMonth;
    }
    
    if (!user.transactions) user.transactions = [];
    user.transactions.unshift({
        type: 'sent',
        amount: selectedStars,
        title: `Gift to ${currentGiftVideoCreator}`,
        timestamp: Date.now(),
        time: new Date().toLocaleString()
    });
    
    saveUser(user);
    document.getElementById('giftModal').style.display = 'none';
    showLoader("Syncing with Server...");

    try {
        await db.collection('users').doc(user.username).update({
            starBalance: user.starBalance,
            transactions: user.transactions
        });

        const receiverRef = db.collection('users').doc(currentGiftVideoCreator);
        const doc = await receiverRef.get();

        if (doc.exists) {
            let receiverDataFB = doc.data();
            let newStarsReceived = (receiverDataFB.starsReceived || 0) + selectedStars;
            let newPCoinBalance = (receiverDataFB.pCoinBalance || 0) + selectedStars;
            let newTransactions = receiverDataFB.transactions || [];
            
            newTransactions.unshift({
                type: 'received',
                amount: selectedStars,
                title: `Gift from ${user.username}`,
                timestamp: Date.now(),
                time: new Date().toLocaleString()
            });

            await receiverRef.update({
                starsReceived: newStarsReceived,
                pCoinBalance: newPCoinBalance,
                transactions: newTransactions
            });
        }
        
        hideLoader();
        showToast(`✅ Sent ${selectedStars} stars to ${currentGiftVideoCreator}!`);
        
        addNotification(currentGiftVideoCreator, '🎁 New Gift', `${user.username} sent you ${selectedStars} stars!`, 'fas fa-gift', '#ffaa00', 'gift');
        
        if (typeof renderProfile === 'function') renderProfile();
        
    } catch (error) {
        hideLoader();
        console.error("Firebase Gift Sync Error:", error);
        showToast("Gift sync failed! Check console.");
    }
}

// ===== VIDEO VIEWER =====
function playProfileVideo(url) {
    if (!url) return;
    
    const videoModal = document.getElementById('videoViewerModal');
    if (!videoModal) return;
    
    const videoElement = videoModal.querySelector('#fullScreenVideo');
    if (videoElement) {
        videoElement.src = url;
        videoElement.play().catch(e => console.log("Auto-play error:", e));
    } else {
        videoModal.innerHTML = `
            <i class="fas fa-times viewer-close" onclick="closeVideoViewer()" style="z-index: 7000;"></i>
            <video id="fullScreenVideo" class="viewer-video" src="${url}" controls autoplay style="width: 100%; height: 100%; object-fit: contain; background: #000;"></video>
        `;
    }

    videoModal.style.display = 'flex';
    videoModal.style.zIndex = '6000';
}

function closeVideoViewer() {
    const video = document.getElementById('fullScreenVideo');
    if (video) video.pause();
    const modal = document.getElementById('videoViewerModal');
    if (modal) modal.style.display = 'none';
}

// ===== MENU FUNCTIONS =====
function openMenu() {
    document.getElementById('sideMenu').classList.add('open');
    document.getElementById('menuOverlay').style.display = 'block';
}

function closeMenu() {
    document.getElementById('sideMenu').classList.remove('open');
    document.getElementById('menuOverlay').style.display = 'none';
}

// ===== NAVIGATION ACTIVE STATE =====
function updateNavActive(name) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        const span = item.querySelector('span');
        if (span && span.innerText.includes(name)) {
            item.classList.add('active');
        } else if (name === 'Home' && item.querySelector('i')?.className.includes('fa-home')) {
            item.classList.add('active');
        } else if (name === 'Explore' && item.querySelector('i')?.className.includes('fa-search')) {
            item.classList.add('active');
        } else if (name === 'Notify' && item.querySelector('i')?.className.includes('fa-bell')) {
            item.classList.add('active');
        } else if (name === 'Profile' && item.querySelector('i')?.className.includes('fa-user')) {
            item.classList.add('active');
        }
    });
}

// ===== LEADERBOARD =====
async function renderLeaderboard() {
    closeMenu();
    document.getElementById('leaderboardModal').style.display = 'flex';
    const leaderboardContent = document.getElementById('leaderboardContent');
    leaderboardContent.innerHTML = '<div style="text-align:center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 30px; color: var(--primary);"></i><p style="margin-top:10px;">Loading Leaderboard...</p></div>';
    
    const users = [];
    try {
        const snapshot = await db.collection('users').orderBy('pCoinBalance', 'desc').limit(50).get();
        snapshot.forEach(doc => {
            if (doc.data()) users.push(doc.data());
        });
    } catch (e) {
        console.error("Error loading leaderboard:", e);
    }
    
    if (users.length === 0) {
        leaderboardContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; padding:30px; text-align:center; color:var(--muted-text);">
                <i class="fas fa-user-slash" style="font-size:50px; margin-bottom:15px; opacity:0.5;"></i>
                <h3 style="color:var(--text);">No Profile Available</h3>
                <p>Not enough data to generate leaderboard.</p>
            </div>`;
        return;
    }

    let html = '<div class="leaderboard-list" style="display:flex; flex-direction:column; gap:12px;">';
    users.forEach((user, index) => {
        const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'var(--primary)';
        const avatarStyle = user.profilePic 
            ? `background-image: url('${user.profilePic}'); background-size: cover; background-position: center;` 
            : `background: ${stringToColor(user.username)};`;
            
        html += `
            <div class="leaderboard-item" style="display:flex; align-items:center; background:var(--secondary-bg); padding:15px; border-radius:15px; border:1px solid var(--border);" onclick="viewOtherProfile('${user.username}'); document.getElementById('leaderboardModal').style.display='none'">
                <div style="font-weight:bold; font-size:18px; color:${rankColor}; width:30px; text-align:center;">#${index + 1}</div>
                <div style="width:50px; height:50px; border-radius:50%; margin:0 15px; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; ${avatarStyle}">
                    ${user.profilePic ? '' : user.username.replace('@', '').charAt(0).toUpperCase()}
                </div>
                <div style="flex:1;">
                    <div style="font-weight:bold; font-size:16px;">${user.name || user.username}</div>
                    <div style="font-size:13px; color:var(--muted-text);">${user.username}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:bold; color:#ffd700; font-size:16px;"><i class="fas fa-coins"></i> ${user.pCoinBalance || 0}</div>
                </div>
            </div>`;
    });
    html += '</div>';
    leaderboardContent.innerHTML = html;
}

// ===== VERIFIED EARN LEADERBOARD =====
async function openVerifiedLeaderboard() {
    closeMenu();
    
    const modal = document.getElementById('verifiedLeaderboardModal');
    if (!modal) {
        createVerifiedLeaderboardModal();
    }
    
    document.getElementById('verifiedLeaderboardModal').style.display = 'flex';
    await loadVerifiedLeaderboard('monthly');
}

function createVerifiedLeaderboardModal() {
    const modalHtml = `
    <div id="verifiedLeaderboardModal" class="modal-overlay" style="z-index: 6000;">
        <div class="bottom-modal leaderboard-modal">
            <div class="leaderboard-header">
                <i class="fas fa-times" style="position: absolute; right: 20px; top: 20px; font-size: 24px; cursor: pointer; color: white;" onclick="document.getElementById('verifiedLeaderboardModal').style.display='none'"></i>
                <h2><i class="fas fa-crown" style="color: #FFD700;"></i> Verified Earn</h2>
                <p>Top P-Coin collectors this month</p>
                <div class="leaderboard-tabs">
                    <div class="leaderboard-tab active" onclick="loadVerifiedLeaderboard('monthly')" id="tab-monthly">Monthly</div>
                    <div class="leaderboard-tab" onclick="loadVerifiedLeaderboard('alltime')" id="tab-alltime">All Time</div>
                </div>
            </div>
            <div class="leaderboard-list" id="verifiedLeaderboardList">
                <div style="text-align:center; padding:40px;">
                    <i class="fas fa-spinner fa-pulse" style="font-size:30px; color:var(--primary);"></i>
                    <p style="margin-top:10px;">Loading leaderboard...</p>
                </div>
            </div>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function loadVerifiedLeaderboard(period = 'monthly') {
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`tab-${period}`).classList.add('active');
    
    const listDiv = document.getElementById('verifiedLeaderboardList');
    listDiv.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-pulse" style="font-size:30px; color:var(--primary);"></i><p style="margin-top:10px;">Loading...</p></div>';
    
    try {
        const snapshot = await db.collection('users').get();
        
        let verifiedUsers = [];
        snapshot.forEach(doc => {
            const user = doc.data();
            if (user.verification && user.verification !== 'none' && user.username) {
                
                let pCoins = 0;
                if (period === 'monthly') {
                    pCoins = user.monthlyPcoins || 0;
                    
                    if (pCoins === 0 && user.transactions) {
                        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                        pCoins = user.transactions
                            .filter(t => t.type === 'received' && t.timestamp > thirtyDaysAgo)
                            .reduce((sum, t) => sum + (t.amount || 0), 0);
                    }
                } else {
                    pCoins = user.pCoinBalance || 0;
                    
                    if (user.transactions) {
                        const totalReceived = user.transactions
                            .filter(t => t.type === 'received')
                            .reduce((sum, t) => sum + (t.amount || 0), 0);
                        pCoins = Math.max(pCoins, totalReceived);
                    }
                }
                
                if (pCoins > 0) {
                    verifiedUsers.push({
                        ...user,
                        pCoins: pCoins
                    });
                }
            }
        });
        
        verifiedUsers.sort((a, b) => (b.pCoins || 0) - (a.pCoins || 0));
        
        if (verifiedUsers.length === 0) {
            listDiv.innerHTML = `
                <div style="text-align:center; padding:40px;">
                    <i class="fas fa-trophy" style="font-size:50px; color:var(--muted-text);"></i>
                    <p style="margin-top:15px; color:var(--muted-text);">No verified users yet</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        verifiedUsers.slice(0, 50).forEach((user, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
            
            const avatarStyle = user.profilePic 
                ? `background-image:url('${user.profilePic}');` 
                : `background:${stringToColor(user.username)};`;
            
            const badgeIcon = user.verification === 'blue' ? '👑' : 
                             user.verification === 'gray' ? '🛡️' : 
                             user.verification === 'white' ? '✅' : '';
            
            html += `
                <div class="leaderboard-item" onclick="viewOtherProfile('${user.username}'); document.getElementById('verifiedLeaderboardModal').style.display='none'">
                    <div class="leaderboard-rank ${rankClass}">#${rank}</div>
                    <div class="leaderboard-avatar" style="${avatarStyle} display:flex; align-items:center; justify-content:center;">
                        ${user.profilePic ? '' : user.username.replace('@', '').charAt(0).toUpperCase()}
                    </div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">
                            ${user.name || user.username}
                            <span class="leaderboard-badge">${badgeIcon}</span>
                        </div>
                        <div class="leaderboard-username">${user.username}</div>
                        <div class="leaderboard-stats">
                            <span class="leaderboard-pcoins">
                                <i class="fas fa-coins"></i> ${user.pCoins.toLocaleString()} P-Coins
                            </span>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right" style="color:var(--muted-text);"></i>
                </div>
            `;
        });
        
        listDiv.innerHTML = html;
        
    } catch (error) {
        console.error("Error loading verified leaderboard:", error);
        listDiv.innerHTML = '<p style="text-align:center; padding:20px; color:#ff4444;">Failed to load leaderboard</p>';
    }
}

async function updateUserMonthlyPcoins(username) {
    try {
        const userRef = db.collection('users').doc(username);
        const doc = await userRef.get();
        
        if (doc.exists) {
            const user = doc.data();
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            
            let monthlyPcoins = 0;
            if (user.transactions) {
                monthlyPcoins = user.transactions
                    .filter(t => t.type === 'received' && t.timestamp > thirtyDaysAgo)
                    .reduce((sum, t) => sum + (t.amount || 0), 0);
            }
            
            await userRef.update({
                monthlyPcoins: monthlyPcoins
            });
        }
    } catch (error) {
        console.error("Error updating monthly P-coins:", error);
    }
}

// ===== EXCHANGE MODAL FUNCTIONS =====
function openExchangeModal() {
    const user = getActiveUser();
    if (!user) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    if (user.exchangeMonth !== currentMonth) {
        user.exchangeCount = 0;
        user.exchangeMonth = currentMonth;
        saveUser(user);
    }

    const exchangesLeft = Math.max(0, 3 - (user.exchangeCount || 0));

    let modal = document.getElementById('exchangeModal');
    if (!modal) {
        const modalHtml = `
        <div id="exchangeModal" class="modal-overlay" style="z-index: 6000;">
            <div class="bottom-modal gift-modal">
                <div class="gift-header" style="background: var(--gradient-3); color: #000;">
                    <span><i class="fas fa-exchange-alt"></i> Star Exchange</span>
                    <i class="fas fa-times" onclick="document.getElementById('exchangeModal').style.display='none'"></i>
                </div>
                <div class="gift-content" style="padding: 20px;" id="exchangeModalContent">
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modal = document.getElementById('exchangeModal');
    }

    const exchangeContent = document.getElementById('exchangeModalContent');

    if (exchangesLeft > 0) {
        exchangeContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <p style="color: var(--primary); font-weight: bold; font-size: 16px; margin-bottom: 5px;">100 Stars = 20 P Coins</p>
                <p style="color: var(--success); font-size: 12px; margin-bottom: 15px;">Exchanges left this month: ${exchangesLeft}/3</p>
                <div style="display: flex; justify-content: center; align-items: center; gap: 30px; font-size: 28px; font-weight: bold;">
                    <div style="text-align: center;">
                        <div style="font-size: 12px; color: var(--muted-text); text-transform: uppercase; margin-bottom: 5px;">Your Stars</div>
                        <span style="color: #ffd700;"><i class="fas fa-star"></i></span>
                        <span style="color: var(--text);" id="exchangeStarBal">${user.starBalance || 0}</span>
                    </div>
                    <i class="fas fa-arrow-right" style="color: var(--primary); font-size: 20px;"></i>
                    <div style="text-align: center;">
                        <div style="font-size: 12px; color: var(--muted-text); text-transform: uppercase; margin-bottom: 5px;">Get P Coins</div>
                        <span style="color: #ffd700;"><i class="fas fa-coins"></i></span>
                        <span style="color: var(--success);" id="receivePcoin">0</span>
                    </div>
                </div>
            </div>

            <div style="background: var(--input-bg); display: flex; align-items: center; padding: 8px 15px; margin-bottom: 20px; border-radius: 15px; border: 1px solid var(--border);">
                <input type="number" id="exchangeAmount" placeholder="Enter stars (min 5)..." oninput="document.getElementById('receivePcoin').innerText = Math.floor(this.value / 5) || 0" style="background: transparent; border: none; color: var(--text); flex: 1; outline: none; font-size: 16px; padding: 10px 0;" min="5">
                <button onclick="document.getElementById('exchangeAmount').value = ${user.starBalance || 0}; document.getElementById('receivePcoin').innerText = Math.floor(${user.starBalance || 0} / 5)" style="background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: bold;">MAX</button>
            </div>

            <button style="width: 100%; background: linear-gradient(135deg, #ffd700, #ff8c00); color: #000; border: none; padding: 16px; border-radius: 20px; font-size: 18px; font-weight: bold; cursor: pointer; box-shadow: 0 8px 20px rgba(255, 215, 0, 0.3);" onclick="processExchange()">
                Convert Now
            </button>
        `;
    } else {
        exchangeContent.innerHTML = `
            <div style="text-align:center;">
                <h3 style="color: #ff4444; margin-bottom: 10px;"><i class="fas fa-lock"></i> Limit Reached!</h3>
                <p style="font-size: 13px; color: var(--muted-text); margin-bottom: 20px;">You have used all 3 free exchanges this month.</p>

                <div style="background: var(--input-bg); padding: 15px; border-radius: 15px; margin-bottom: 15px; text-align: left;">
                    <p style="font-weight: bold; margin-bottom: 5px; color: var(--primary);">Unlock 1 More Exchange</p>
                    <p style="font-size: 13px; margin-bottom: 10px;">Pay ₹50 via UPI to: <br><b style="color: #fff; user-select: all; font-size: 16px;">8391921082@ibl</b></p>
                    <input type="text" id="txnIdInput" placeholder="Enter UPI Txn ID" class="input-field" style="margin-bottom: 10px;">
                    <button class="primary-btn" onclick="sendTxnIdToAdmin()" style="margin-top: 0; padding: 10px;">Send for Verification</button>
                </div>

                <div style="background: var(--input-bg); padding: 15px; border-radius: 15px; text-align: left;">
                    <p style="font-size: 12px; margin-bottom: 10px; font-weight: bold;">Have a 6-digit Coupon Code?</p>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="couponInput" placeholder="000000" maxlength="6" class="input-field" style="margin: 0; text-align: center; letter-spacing: 5px; font-weight: bold; font-size: 18px;">
                        <button class="primary-btn" onclick="applyExchangeCoupon()" style="margin: 0; width: 80px; padding: 10px;">Apply</button>
                    </div>
                </div>
            </div>
        `;
    }

    modal.style.display = 'flex';
}

async function processExchange() {
    const user = getActiveUser();
    if (!user) return;

    const input = document.getElementById('exchangeAmount');
    const amount = parseInt(input.value);

    if (!amount || amount < 5 || isNaN(amount)) {
        showToast('Minimum 5 stars required!');
        return;
    }

    if (amount > (user.starBalance || 0)) {
        showToast('Not enough stars!');
        return;
    }

    const pCoinsEarned = Math.floor(amount / 5);

    showLoader('Processing Exchange...');

    user.starBalance -= amount;
    user.pCoinBalance = (user.pCoinBalance || 0) + pCoinsEarned;
    user.exchangeCount = (user.exchangeCount || 0) + 1;

    if (!user.transactions) user.transactions = [];
    user.transactions.unshift({
        type: 'received',
        amount: pCoinsEarned,
        title: 'Exchanged Stars to P Coins',
        timestamp: Date.now(),
        time: new Date().toLocaleString()
    });

    saveUser(user);

    try {
        await db.collection('users').doc(user.username).update({
            starBalance: user.starBalance,
            pCoinBalance: user.pCoinBalance,
            transactions: user.transactions,
            exchangeCount: user.exchangeCount,
            exchangeMonth: user.exchangeMonth
        });

        hideLoader();
        document.getElementById('exchangeModal').style.display = 'none';
        showToast(`✅ Exchanged ${amount} stars for ${pCoinsEarned} P Coins!`);

        if (typeof renderProfile === 'function') renderProfile();

    } catch (error) {
        hideLoader();
        console.error('Exchange error:', error);
        showToast('Exchange failed! Try again.');
    }
}

function sendTxnIdToAdmin() {
    const txnId = document.getElementById('txnIdInput')?.value.trim();
    if (!txnId) return showToast('Please enter Transaction ID');

    const user = getActiveUser();
    const msg = `*Exchange Limit Unlock Request*\n\nUser: ${user.name} (${user.username})\nAmount: ₹50\nUPI ID Paid To: 8391921082@ibl\nTxn ID: ${txnId}\n\nPlease verify and send my 6-digit coupon code.`;

    window.location.href = `https://wa.me/918391921082?text=${encodeURIComponent(msg)}`;
    showToast('Redirecting to WhatsApp...');
}

async function applyExchangeCoupon() {
    const code = document.getElementById('couponInput')?.value.trim();
    if (!code || code.length !== 6) return showToast('Enter valid 6-digit code');

    showLoader('Verifying coupon...');
    const user = getActiveUser();

    try {
        const couponRef = db.collection('coupons').doc(code);
        const doc = await couponRef.get();

        if (doc.exists && doc.data().user === user.username && !doc.data().used) {
            await couponRef.update({ used: true });

            user.exchangeCount -= 1;
            saveUser(user);
            await db.collection('users').doc(user.username).update({ exchangeCount: user.exchangeCount });

            hideLoader();
            showToast('✅ Coupon applied! 1 Exchange unlocked.');
            openExchangeModal();
        } else {
            hideLoader();
            showToast('❌ Invalid, expired, or wrong user coupon');
        }
    } catch (e) {
        hideLoader();
        console.error("Coupon error:", e);
        showToast('Error verifying coupon');
    }
}

// ===== COUPON GENERATION SYSTEM =====
async function generateAdminCoupon() {
    if (!selectedTestUser) {
        showAdminMessage('❌ Please select a user first');
        return;
    }

    const couponCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    showLoader('Generating coupon & sending to user inbox...');
    
    try {
        await db.collection('coupons').doc(couponCode).set({
            code: couponCode,
            user: selectedTestUser.username,
            used: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: getActiveUser()?.username || 'admin'
        });

        const chatId = getChatId('@pikko_official', selectedTestUser.username);
        
        const pikkoRef = db.collection('users').doc('@pikko_official');
        const pikkoDoc = await pikkoRef.get();
        
        if (!pikkoDoc.exists) {
            await pikkoRef.set({
                name: 'Pikko AI',
                username: '@pikko_official',
                bio: 'Official Pikko Shorts Assistant',
                profilePic: '',
                verification: 'blue',
                isOfficial: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        await db.collection('chats').doc(chatId).set({
            participants: ['@pikko_official', selectedTestUser.username],
            lastMessage: `🎫 Your exchange coupon code: ${couponCode}`,
            lastMessageTime: Date.now(),
            lastSender: '@pikko_official',
            unreadCount: {
                [selectedTestUser.username]: 1
            }
        }, { merge: true });

        await db.collection('chats').doc(chatId).collection('messages').add({
            sender: '@pikko_official',
            receiver: selectedTestUser.username,
            text: `🎫 **Exchange Coupon Generated!**\n\nHello ${selectedTestUser.username}! Your exclusive 6-digit coupon code is ready:\n\n🔑 **${couponCode}**\n\n💫 This coupon will unlock **1 extra exchange** for you!\n\n👉 Go to Profile → Exchange → Enter this code to claim.\n\nHappy Creating! 🌟`,
            timestamp: Date.now(),
            type: 'coupon',
            couponCode: couponCode,
            isOfficial: true
        });

        addNotification(
            selectedTestUser.username, 
            '🎫 New Exchange Coupon!', 
            `Your exclusive coupon code: ${couponCode}`, 
            'fas fa-ticket-alt', 
            '#667eea', 
            'coupon'
        );

        hideLoader();
        showAdminMessage(`✅ Coupon generated & sent to ${selectedTestUser.username}'s inbox!`);

        const area = document.getElementById('adminMessageArea');
        if (area) {
            area.innerHTML = `
                <div style="margin-top: 10px; padding: 15px; background: linear-gradient(135deg, #00b09b, #96c93d); border-radius: 10px; text-align: center; animation: slideIn 0.3s ease;">
                    <p style="color: white; margin-bottom: 10px; font-size: 16px;">
                        <i class="fas fa-check-circle"></i> Coupon Sent Successfully!
                    </p>
                    <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                        <p style="color: #333; font-size: 24px; font-weight: bold; letter-spacing: 5px;">${couponCode}</p>
                        <p style="color: #666; font-size: 14px;">Sent to: ${selectedTestUser.username}</p>
                    </div>
                    <p style="color: white; font-size: 12px;">
                        <i class="fas fa-envelope"></i> Check user's inbox for the message
                    </p>
                </div>
            `;
        }
        
    } catch (error) {
        hideLoader();
        console.error("Coupon generation error:", error);
        showAdminMessage('❌ Failed to generate coupon: ' + error.message);
    }
}

// ===== ADMIN PANEL FUNCTIONS =====
function openAdminPanel() {
    closeMenu();
    
    let pass = prompt("Enter Admin Password");
    
    if (pass && btoa(pass) === btoa(ADMIN_PASS)) {
        showLoader("Loading admin panel...");
        
        db.collection('videos').orderBy('createdAt', 'desc').get()
        .then((snapshot) => {
            let allVideos = [];
            snapshot.forEach(doc => {
                const videoData = doc.data();
                allVideos.push({ 
                    id: doc.id, 
                    url: videoData.video_url || videoData.url,
                    caption: videoData.caption || '',
                    username: videoData.username || '@unknown',
                    createdAt: videoData.createdAt
                });
            });
            
            const users = getAllUsers();
            
            hideLoader();
            
            let html = `<div class="page-container" style="padding: 20px 20px 100px 20px;">
                <h2 style="margin-bottom:20px; font-size:28px;">👑 Admin Panel</h2>
                
                <div style="background: #2c3e50; padding: 20px; border-radius: 20px; margin-bottom: 25px; display: flex; gap: 15px; flex-wrap: wrap;">
                    <button onclick="openAdminPanel()" style="background: #3498db; color: white; border: none; padding: 12px 25px; border-radius: 12px; cursor: pointer;">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
                
                <h3 style="margin: 25px 0 15px; font-size:20px;">📹 All Videos (${allVideos.length})</h3>`;

            if (allVideos.length === 0) {
                html += '<p>No videos found</p>';
            } else {
                allVideos.forEach(v => {
                    if (!v) return;
                    html += `<div style="background:var(--secondary-bg); padding:18px; margin:12px 0; border-radius:15px; border-left: 4px solid #2ecc71;">
                        <div style="display: flex; gap: 15px;">
                            <div style="width: 70px; height: 90px; background: #333; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-video" style="font-size: 28px; opacity: 0.5; color: white;"></i>
                            </div>
                            <div style="flex: 1;">
                                <div style="display: flex; justify-content: space-between; align-items:center;">
                                    <b style="font-size:16px;"><i class="fas fa-user"></i> ${v.username || 'Unknown'}</b>
                                    <button onclick="deleteVideo('${v.id}')" style="background:#ff4444; border:none; color:white; padding:6px 15px; border-radius:8px; cursor:pointer;">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                                <p style="margin: 8px 0;">${v.caption || 'No caption'}</p>
                                <small style="color: var(--muted-text);">ID: ${v.id}</small>
                            </div>
                        </div>
                    </div>`;
                });
            }

            html += renderAdminTestingTools(users);
            html += `</div>`;
            contentDiv.innerHTML = html;
        })
        .catch((error) => {
            hideLoader();
            console.error("Admin Panel Error:", error);
            showToast("Failed to load database videos.");
        });
    } else if (pass !== null) {
        showToast("Wrong Password!");
    }
}

function renderAdminTestingTools(users) {
    if (!users) users = [];
    
    let html = `
        <div class="admin-testing-section">
            <div class="admin-testing-title">
                <i class="fas fa-flask"></i>
                <span>Admin Control Panel</span>
            </div>
            
            <div class="admin-user-selector">
                <select id="adminUserSelect" onchange="selectUser(this.value)">
                    <option value="">-- Select User --</option>
                    ${users.map(u => {
                        if (!u) return '';
                        return `<option value="${u.username || ''}">
                            ${u.name || u.username || 'Unknown'} (${u.username || 'No username'}) | P:${u.pCoinBalance || 0} | ⭐:${u.starBalance || 0}
                        </option>`;
                    }).join('')}
                </select>
            </div>
            
            <div id="selectedUserInfo" style="display: none; background: rgba(0,0,0,0.3); border-radius: 15px; padding: 18px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span><strong>Selected:</strong> <span id="selectedUserName"></span></span>
                    <span><strong>Badge:</strong> <span id="selectedUserBadge"></span></span>
                </div>
                <div class="admin-current-balance">
                    <span>💰 P Coins:</span>
                    <span id="selectedUserPcoins">0</span>
                </div>
                <div class="admin-current-balance">
                    <span>⭐ Stars:</span>
                    <span id="selectedUserStars">0</span>
                </div>
            </div>
            
            <div id="adminMessageArea"></div>
            
            <h4 style="margin: 20px 0 15px; color: white; font-size:18px;">🔰 Verification Badge</h4>
            <div class="admin-badge-group">
                <button class="admin-badge-btn white" onclick="setUserBadge('white')">
                    <i class="fas fa-check"></i> White
                </button>
                <button class="admin-badge-btn gray" onclick="setUserBadge('gray')">
                    <i class="fas fa-shield-alt"></i> Gray
                </button>
                <button class="admin-badge-btn blue" onclick="setUserBadge('blue')">
                    <i class="fas fa-crown"></i> Blue
                </button>
                <button class="admin-badge-btn remove" onclick="setUserBadge('none')">
                    <i class="fas fa-times"></i> Remove
                </button>
            </div>
            
            <h4 style="margin: 25px 0 15px; color: white; font-size:18px;">💰 P Coin Control</h4>
            <div class="admin-coin-control">
                <input type="number" id="adminCoinAmount" class="admin-coin-input" placeholder="Amount" min="1" value="1000">
                <button class="admin-coin-btn add" onclick="addUserCoins()">
                    <i class="fas fa-plus"></i> Add
                </button>
                <button class="admin-coin-btn remove" onclick="removeUserCoins()">
                    <i class="fas fa-minus"></i> Remove
                </button>
            </div>
            
            <h4 style="margin: 25px 0 15px; color: white; font-size:18px;">⭐ Star Control</h4>
            <div class="admin-star-control">
                <input type="number" id="adminStarAmount" class="admin-coin-input" placeholder="Amount" min="1" value="100">
                <button class="admin-coin-btn add" onclick="addUserStars()">
                    <i class="fas fa-plus"></i> Add Stars
                </button>
                <button class="admin-coin-btn remove" onclick="removeUserStars()">
                    <i class="fas fa-minus"></i> Remove Stars
                </button>
            </div>

            <h4 style="margin: 25px 0 15px; color: white; font-size:18px;">🎟️ Coupon Control</h4>
            <button class="admin-coin-btn add" style="width: 100%; margin-bottom: 20px;" onclick="generateAdminCoupon()">
                <i class="fas fa-ticket-alt"></i> Generate & Send Exchange Coupon
            </button>
        </div>
    `;
    return html;
}

function getAllUsers() {
    const users = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('user_')) {
            try {
                const user = JSON.parse(localStorage.getItem(key));
                if (user) users.push(user);
            } catch (e) { }
        }
    }
    return users;
}

function selectUser(username) {
    if (!username) return;

    const users = getAllUsers();
    const user = users.find(u => u && u.username === username);
    if (!user) return;

    selectedTestUser = user;

    const infoDiv = document.getElementById('selectedUserInfo');
    if (infoDiv) {
        infoDiv.style.display = 'block';
        
        const nameSpan = document.getElementById('selectedUserName');
        if (nameSpan) nameSpan.innerText = `${user.name || 'Unknown'} (${user.username})`;
        
        const badgeSpan = document.getElementById('selectedUserBadge');
        if (badgeSpan) badgeSpan.innerText = user.verification || 'none';
        
        const pSpan = document.getElementById('selectedUserPcoins');
        if (pSpan) pSpan.innerText = user.pCoinBalance || 0;
        
        const starSpan = document.getElementById('selectedUserStars');
        if (starSpan) starSpan.innerText = user.starBalance || 0;
    }

    showAdminMessage(`✅ Selected: ${user.username}`);
}

function showAdminMessage(msg) {
    if (adminMessageTimeout) clearTimeout(adminMessageTimeout);

    const area = document.getElementById('adminMessageArea');
    if (!area) return;

    area.innerHTML = `<div class="admin-success-message">${msg}</div>`;

    adminMessageTimeout = setTimeout(() => {
        area.innerHTML = '';
    }, 2000);
}

function setUserBadge(badgeType) {
    if (!selectedTestUser) {
        showAdminMessage('❌ Please select a user first');
        return;
    }

    const userKey = 'user_' + selectedTestUser.username;
    const userData = JSON.parse(localStorage.getItem(userKey));

    if (!userData) {
        showAdminMessage('❌ User data not found');
        return;
    }

    userData.verification = badgeType === 'none' ? undefined : badgeType;
    localStorage.setItem(userKey, JSON.stringify(userData));

    const currentUser = getActiveUser();
    if (currentUser && currentUser.username === selectedTestUser.username) {
        currentUser.verification = userData.verification;
        saveUser(currentUser);
    }

    selectedTestUser = userData;
    selectUser(userData.username);
    showAdminMessage(`✅ ${badgeType} badge assigned`);
}

function removeUserCoins() {
    if (!selectedTestUser) {
        showAdminMessage('❌ Please select a user first');
        return;
    }

    const amountInput = document.getElementById('adminCoinAmount');
    if (!amountInput) return;
    
    const amount = parseInt(amountInput.value);
    if (!amount || amount < 1) {
        showAdminMessage('❌ Enter a valid amount');
        return;
    }

    const userKey = 'user_' + selectedTestUser.username;
    const userData = JSON.parse(localStorage.getItem(userKey));

    if (!userData) {
        showAdminMessage('❌ User data not found');
        return;
    }

    const currentBalance = userData.pCoinBalance || 0;
    if (currentBalance < amount) {
        showAdminMessage('❌ Insufficient balance');
        return;
    }

    userData.pCoinBalance = currentBalance - amount;
    
    if (!userData.transactions) userData.transactions = [];
    userData.transactions.unshift({
        type: 'sent',
        amount: amount,
        title: 'Admin Removed',
        timestamp: Date.now(),
        time: new Date().toLocaleString()
    });
    
    localStorage.setItem(userKey, JSON.stringify(userData));

    const currentUser = getActiveUser();
    if (currentUser && currentUser.username === selectedTestUser.username) {
        currentUser.pCoinBalance = userData.pCoinBalance;
        saveUser(currentUser);
    }

    selectedTestUser = userData;
    selectUser(userData.username);
    showAdminMessage(`✅ Removed ${amount} P Coins`);
}

async function addUserCoins() {
    if (!selectedTestUser) return showAdminMessage('❌ Please select a user first');
    const amountInput = document.getElementById('adminCoinAmount');
    if (!amountInput) return;
    const amount = parseInt(amountInput.value);
    if (!amount || amount < 1) return showAdminMessage('❌ Enter a valid amount');

    const userKey = 'user_' + selectedTestUser.username;
    const userData = JSON.parse(localStorage.getItem(userKey));
    if (!userData) return showAdminMessage('❌ User data not found');

    userData.pCoinBalance = (userData.pCoinBalance || 0) + amount;
    
    if (!userData.transactions) userData.transactions = [];
    userData.transactions.unshift({ type: 'received', amount: amount, title: 'Admin Added P-Coins', timestamp: Date.now(), time: new Date().toLocaleString() });
    
    localStorage.setItem(userKey, JSON.stringify(userData));

    try {
        await db.collection('users').doc(userData.username).update({ pCoinBalance: userData.pCoinBalance });
    } catch(e) { console.log("Firebase error:", e); }

    addNotification(userData.username, '💰 P Coins Received', `Admin added ${amount} P Coins to your account!`, 'fas fa-coins', '#ffd700', 'pcoin');

    const currentUser = getActiveUser();
    if (currentUser && currentUser.username === selectedTestUser.username) saveUser(userData);
    
    selectUser(userData.username);
    showAdminMessage(`✅ Added ${amount} P Coins`);
}

async function addUserStars() {
    if (!selectedTestUser) return showAdminMessage('❌ Please select a user first');
    const amountInput = document.getElementById('adminStarAmount');
    if (!amountInput) return;
    const amount = parseInt(amountInput.value);
    if (!amount || amount < 1) return showAdminMessage('❌ Enter a valid amount');

    const userKey = 'user_' + selectedTestUser.username;
    const userData = JSON.parse(localStorage.getItem(userKey));
    if (!userData) return showAdminMessage('❌ User data not found');

    userData.starBalance = (userData.starBalance || 0) + amount;
    
    if (!userData.transactions) userData.transactions = [];
    userData.transactions.unshift({ type: 'received', amount: amount, title: 'Admin Added Stars', timestamp: Date.now(), time: new Date().toLocaleString() });
    
    localStorage.setItem(userKey, JSON.stringify(userData));

    try {
        await db.collection('users').doc(userData.username).update({ starBalance: userData.starBalance });
    } catch(e) { console.log("Firebase error:", e); }

    addNotification(userData.username, '⭐ Stars Received', `Admin added ${amount} Stars to your account!`, 'fas fa-star', '#ffd700', 'star');

    const currentUser = getActiveUser();
    if (currentUser && currentUser.username === selectedTestUser.username) saveUser(userData);

    selectUser(userData.username);
    showAdminMessage(`✅ Added ${amount} Stars`);
}

function removeUserStars() {
    if (!selectedTestUser) {
        showAdminMessage('❌ Please select a user first');
        return;
    }

    const amountInput = document.getElementById('adminStarAmount');
    if (!amountInput) return;
    
    const amount = parseInt(amountInput.value);
    if (!amount || amount < 1) {
        showAdminMessage('❌ Enter a valid amount');
        return;
    }

    const userKey = 'user_' + selectedTestUser.username;
    const userData = JSON.parse(localStorage.getItem(userKey));

    if (!userData) {
        showAdminMessage('❌ User data not found');
        return;
    }

    const currentBalance = userData.starBalance || 0;
    if (currentBalance < amount) {
        showAdminMessage('❌ Insufficient stars');
        return;
    }

    userData.starBalance = currentBalance - amount;
    
    if (!userData.transactions) userData.transactions = [];
    userData.transactions.unshift({
        type: 'sent',
        amount: amount,
        title: 'Admin Removed Stars',
        timestamp: Date.now(),
        time: new Date().toLocaleString()
    });
    
    localStorage.setItem(userKey, JSON.stringify(userData));

    const currentUser = getActiveUser();
    if (currentUser && currentUser.username === selectedTestUser.username) {
        currentUser.starBalance = userData.starBalance;
        saveUser(currentUser);
    }

    selectedTestUser = userData;
    selectUser(userData.username);
    showAdminMessage(`✅ Removed ${amount} Stars`);
}

// ===== CHAT FUNCTIONS =====
let currentChatUser = null;
let chatListener = null;

function getChatId(user1, user2) {
    return [user1, user2].sort().join('_');
}

function openChatWindow(targetUsername) {
    const currentUser = getActiveUser();
    if (!currentUser) return;
    
    currentChatUser = targetUsername;
    
    document.getElementById('chatUserName').innerText = targetUsername.replace('@', '');
    document.getElementById('chatUserHandle').innerText = targetUsername;
    
    const col = stringToColor(targetUsername);
    const letter = targetUsername.replace('@', '').charAt(0).toUpperCase();
    const avatarDiv = document.getElementById('chatUserAvatar');
    avatarDiv.style.background = col;
    avatarDiv.innerText = letter; 

    document.getElementById('chatModal').style.display = 'flex';
    document.getElementById('chatInput').value = '';
    
    const chatId = getChatId(currentUser.username, targetUsername);
    
    if (chatListener) chatListener(); 

    showLoader("Loading chat...");
    
    chatListener = db.collection('chats').doc(chatId).collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            hideLoader();
            const messagesDiv = document.getElementById('chatMessages');
            messagesDiv.innerHTML = '';
            
            snapshot.forEach(doc => {
                const msg = doc.data();
                const isMe = msg.sender === currentUser.username;
                const time = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                const msgHtml = `
                    <div style="display: flex; justify-content: ${isMe ? 'flex-end' : 'flex-start'};">
                        <div style="max-width: 75%; padding: 10px 15px; border-radius: 18px; font-size: 14px; line-height: 1.4; ${isMe ? 'background: var(--primary); color: white; border-bottom-right-radius: 4px;' : 'background: var(--input-bg); color: var(--text); border-bottom-left-radius: 4px; border: 1px solid var(--border);'}">
                            ${msg.text}
                            <div style="font-size: 10px; opacity: 0.7; margin-top: 5px; text-align: ${isMe ? 'right' : 'left'};">
                                ${time}
                            </div>
                        </div>
                    </div>
                `;
                messagesDiv.innerHTML += msgHtml;
            });
            
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }, error => {
            hideLoader();
            console.error("Chat Error:", error);
            showToast("Failed to load messages");
        });
}

function closeChat() {
    document.getElementById('chatModal').style.display = 'none';
    if (chatListener) {
        chatListener();
        chatListener = null;
    }
    currentChatUser = null;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || !currentChatUser) return;

    const currentUser = getActiveUser();
    const chatId = getChatId(currentUser.username, currentChatUser);
    
    input.value = '';

    try {
        await db.collection('chats').doc(chatId).collection('messages').add({
            sender: currentUser.username,
            receiver: currentChatUser,
            text: text,
            timestamp: Date.now()
        });

        await db.collection('chats').doc(chatId).set({
            participants: [currentUser.username, currentChatUser],
            lastMessage: text,
            lastMessageTime: Date.now(),
            lastSender: currentUser.username
        }, { merge: true });
        
        addNotification(currentChatUser, '💬 New Message', `${currentUser.username}: ${text.substring(0, 20)}...`, 'fas fa-envelope', '#3498db', 'general');
        
    } catch (error) {
        console.error("Error sending message:", error);
        showToast("Failed to send message");
    }
}

// ===== OFFLINE FUNCTIONS =====
function getOfflineVideos() {
    return JSON.parse(localStorage.getItem('offlineVideos') || '[]');
}

function saveOffline(id, url, caption, username) {
    if (!id || !url) {
        showToast('Invalid video');
        return;
    }
    
    let offlineVideos = JSON.parse(localStorage.getItem('offlineVideos') || '[]');
    if (offlineVideos.find(v => v.id === id)) {
        showToast('Already saved offline');
        return;
    }
    
    if (url.includes('cloudinary.com')) {
        url = url.replace('/upload/', '/upload/q_60,w_480/');
    }
    
    saveVideoOffline(id, url, caption, username)
        .catch(err => {
            if (err === 'Already saved offline') {
                showToast('Already saved');
            } else {
                showToast('Failed: ' + err);
            }
        });
}

function saveVideoOffline(videoId, videoUrl, caption, username) {
    return new Promise((resolve, reject) => {
        if (!videoUrl) {
            reject('No video URL');
            return;
        }
        
        showLoader('Downloading video...');
        showToast('Downloading video...');
        
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const targetUrl = encodeURIComponent(videoUrl);
        
        fetch(proxyUrl + targetUrl)
            .then(res => {
                if (!res.ok) throw new Error('Download failed');
                return res.blob();
            })
            .then(blob => {
                if (blob.size > 50 * 1024 * 1024) {
                    hideLoader();
                    reject('Video too large (max 50MB)');
                    return;
                }
                
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = function () {
                    const base64data = reader.result;
                    let offlineVideos = JSON.parse(localStorage.getItem('offlineVideos') || '[]');
                    
                    if (!offlineVideos.find(v => v.id === videoId)) {
                        offlineVideos.push({
                            id: videoId,
                            url: base64data,
                            caption: caption || '',
                            username: username || '',
                            savedAt: Date.now(),
                            size: blob.size,
                            fileName: 'video_' + Date.now() + '.mp4'
                        });
                        
                        if (offlineVideos.length > 10) {
                            offlineVideos = offlineVideos.slice(-10);
                        }
                        
                        localStorage.setItem('offlineVideos', JSON.stringify(offlineVideos));
                        hideLoader();
                        showToast('✅ Video saved offline successfully!');
                        resolve();
                    } else {
                        hideLoader();
                        reject('Already saved offline');
                    }
                };
            })
            .catch(error => {
                hideLoader();
                console.error("Offline save error:", error);
                
                fetch(videoUrl)
                    .then(res => res.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onloadend = function () {
                            const base64data = reader.result;
                            let offlineVideos = JSON.parse(localStorage.getItem('offlineVideos') || '[]');
                            
                            if (!offlineVideos.find(v => v.id === videoId)) {
                                offlineVideos.push({
                                    id: videoId,
                                    url: base64data,
                                    caption: caption || '',
                                    username: username || '',
                                    savedAt: Date.now(),
                                    size: blob.size
                                });
                                
                                if (offlineVideos.length > 10) {
                                    offlineVideos = offlineVideos.slice(-10);
                                }
                                
                                localStorage.setItem('offlineVideos', JSON.stringify(offlineVideos));
                                showToast('✅ Video saved offline');
                                resolve();
                            }
                        };
                    })
                    .catch(err => {
                        reject('Failed to download: ' + err.message);
                    });
            });
    });
}

function goOffline() {
    closeMenu();
    const offlineVids = getOfflineVideos();
    
    if (offlineVids.length === 0) { 
        contentDiv.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; background: var(--bg);">
                <div style="width: 120px; height: 120px; background: linear-gradient(135deg, #667eea20, #764ba220); border-radius: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 25px;">
                    <i class="fas fa-cloud-download-alt" style="font-size: 60px; color: var(--primary);"></i>
                </div>
                <h2 style="font-size: 24px; margin-bottom: 10px; color: var(--text);">No Offline Videos</h2>
                <p style="color: var(--muted-text); text-align: center; max-width: 250px; margin-bottom: 30px; line-height: 1.6;">
                    Download videos while you're online to watch them without internet connection
                </p>
                <button class="primary-btn" style="width: 220px; padding: 16px; font-size: 16px; border-radius: 30px;" onclick="renderHome()">
                    <i class="fas fa-compass" style="margin-right: 8px;"></i> Browse Videos
                </button>
            </div>
        `;
        return; 
    }
    
    const totalSize = offlineVids.reduce((sum, v) => sum + (v.size || 0), 0);
    const totalMB = (totalSize / (1024 * 1024)).toFixed(1);
    
    contentDiv.innerHTML = `
        <div style="position: sticky; top: 0; background: var(--bg); z-index: 100; border-bottom: 1px solid var(--border);">
            <div style="display: flex; align-items: center; padding: 15px;">
                <i class="fas fa-arrow-left" style="font-size: 24px; cursor: pointer; padding: 10px;" onclick="renderHome()"></i>
                <div style="flex: 1; margin-left: 10px;">
                    <h2 style="font-size: 20px; font-weight: 700;">Offline Videos</h2>
                    <p style="font-size: 13px; color: var(--muted-text);">
                        <i class="fas fa-video"></i> ${offlineVids.length}/10 videos • 
                        <i class="fas fa-database"></i> ${totalMB} MB
                    </p>
                </div>
                <button onclick="clearAllOffline()" style="background: none; border: none; color: var(--primary); font-size: 16px; padding: 10px;">
                    <i class="fas fa-trash"></i> Clear
                </button>
            </div>
            <div style="height: 4px; background: var(--input-bg); width: 100%;">
                <div style="height: 100%; width: ${(offlineVids.length/10)*100}%; background: linear-gradient(90deg, var(--primary), #667eea); border-radius: 0 2px 2px 0;"></div>
            </div>
        </div>
        
        <div id="offlineFeed" class="video-feed" style="height: calc(100% - 130px);"></div>
    `;
    
    const feed = document.getElementById('offlineFeed');
    
    offlineVids.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    
    offlineVids.forEach((vid, index) => {
        if (!vid || !vid.url) return;
        
        const size = vid.size ? (vid.size / (1024 * 1024)).toFixed(1) + ' MB' : 'Unknown';
        const date = vid.savedAt ? new Date(vid.savedAt).toLocaleString() : 'Unknown date';
        
        feed.innerHTML += `
            <div class="video-card" data-video-index="${index}" style="position: relative; height: 100%;">
                <video class="video-player" src="${vid.url}" loop playsinline></video>
                
                <div class="video-menu" style="top: 70px;" onclick="removeOfflineVideo('${vid.id}'); this.closest('.video-card').remove(); if(document.querySelectorAll('.video-card').length === 0) goOffline();">
                    <i class="fas fa-trash" style="color: #ff4444;"></i>
                </div>
                
                <div class="right-sidebar">
                    <div class="action-btn" onclick="this.closest('.video-card').querySelector('video').paused ? this.closest('.video-card').querySelector('video').play() : this.closest('.video-card').querySelector('video').pause()">
                        <i class="fas fa-play"></i>
                        <span>Play</span>
                    </div>
                    <div class="action-btn" onclick="showOfflineInfo('${vid.id}')">
                        <i class="fas fa-info-circle"></i>
                        <span>Info</span>
                    </div>
                </div>
                
                <div class="video-overlay">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                        <span style="background: var(--primary); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">
                            <i class="fas fa-cloud-download-alt"></i> OFFLINE
                        </span>
                        <span style="background: rgba(0,0,0,0.5); padding: 4px 12px; border-radius: 20px; font-size: 11px;">${size}</span>
                    </div>
                    <div class="user-info-row">
                        <div class="username" style="font-size: 18px;" onclick="viewOtherProfile('${vid.username}')">${vid.username || 'Unknown'}</div>
                    </div>
                    <div class="caption" style="font-size: 15px; margin-top: 5px;">${vid.caption || ''}</div>
                    <div style="font-size: 10px; color: var(--muted-text); margin-top: 8px;">
                        <i class="far fa-clock"></i> Saved: ${date}
                    </div>
                </div>
            </div>
        `;
    });
    
    initObserver();
}

function removeOfflineVideo(videoId) {
  let offline = JSON.parse(localStorage.getItem('offlineVideos') || '[]');
    offline = offline.filter(v => v.id !== videoId);
    localStorage.setItem('offlineVideos', JSON.stringify(offline));
    showToast('Removed from offline');
}

function clearAllOffline() {
    if (confirm('Delete all offline videos?')) {
        localStorage.removeItem('offlineVideos');
        goOffline();
        showToast('All offline videos deleted');
    }
}

function showOfflineInfo(videoId) {
    const offlineVids = getOfflineVideos();
    const video = offlineVids.find(v => v.id === videoId);
    
    if (!video) return;
    
    const sizeMB = video.size ? (video.size / (1024 * 1024)).toFixed(1) : 'Unknown';
    const savedDate = video.savedAt ? new Date(video.savedAt).toLocaleString() : 'Unknown';
    
    showToast(`Size: ${sizeMB} MB | Saved: ${savedDate}`, 3000);
}

// ===== SHARE VIDEO =====
function shareVideo(id) {
    if (!id) return;
    navigator.clipboard?.writeText(`Check out this video: ${window.location.origin}?video=${id}`);
    showToast('Link copied to clipboard!');
}

// ===== INIT =====
window.onload = function () {
    console.log("App starting...");
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);

    if (!localStorage.getItem('shortVideoUser')) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const today = new Date().toDateString();
        
        const defaultUser = {
            name: "Test User", 
            username: "@testuser", 
            password: "123456", 
            bio: "Content Creator", 
            profilePic: "",
            following: [], 
            followers: [], 
            likes: [], 
            saved: [], 
            blocked: [], 
            muted: [], 
            reported: [],
            playlists: [], 
            starBalance: 0, 
            pCoinBalance: 0, 
            starsReceived: 0,
            monthlyStars: 0,
            monthlyPcoins: 0,
            lastMonthReset: currentMonth,
            dailyStars: { lastClaimDate: today, claimed: [false, false, false] },
            referralCode: "REF123456", 
            referredBy: null, 
            appVersion: APP_VERSION,
            transactions: [],
            exchangeCount: 0,
            exchangeMonth: currentMonth
        };
        saveUser(defaultUser);
    }

    const user = getActiveUser();
    if (user) {
        renderHome();
    } else {
        renderAuth();
    }

    updateOnlineStatus();
    
    cleanupOldVideos();
}

setInterval(() => {
    const user = getActiveUser();
    if (user && user.username) {
        updateUserMonthlyPcoins(user.username);
    }
}, 7 * 24 * 60 * 60 * 1000);
// ===== FLOATING STAR REWARD SYSTEM =====
let floatingStarTimer = null;
let starProgress = 0;
const REWARD_INTERVAL = 20000; // ২০ সেকেন্ড
const MAX_DAILY_STARS = 50; // দৈনিক সর্বোচ্চ স্টার

function initFloatingStar() {
    const user = getActiveUser();
    if (!user) return;
    
    // দৈনিক লিমিট চেক
    const today = new Date().toDateString();
    if (!user.floatingStarData || user.floatingStarData.date !== today) {
        user.floatingStarData = { date: today, earned: 0 };
        saveUser(user);
    }
    
    const starContainer = document.getElementById('floatingStarContainer');
    const starText = document.getElementById('floatingStarText');
    const circle = document.querySelector('.progress-ring__circle');
    
    if (!starContainer || !circle) return;
    
    // শুধুমাত্র Feed কন্টেইনার থাকলে ফ্লোটিং স্টার দেখাবে
    if(document.getElementById('feedContainer')) {
        starContainer.style.display = 'flex';
    } else {
        starContainer.style.display = 'none';
        stopFloatingStarTimer();
        return;
    }

    if (user.floatingStarData.earned >= MAX_DAILY_STARS) {
        starText.innerText = `Limit Reached`;
        circle.style.strokeDashoffset = 0;
        circle.style.stroke = "#2ecc71"; // টার্গেট পূরণ হলে সবুজ হয়ে যাবে
        stopFloatingStarTimer();
        return;
    }
    
    starText.innerText = `${user.floatingStarData.earned}/${MAX_DAILY_STARS}`;
    circle.style.stroke = "#ffd700";
    
    startFloatingStarTimer();
}

function startFloatingStarTimer() {
    stopFloatingStarTimer();
    const circle = document.querySelector('.progress-ring__circle');
    const circumference = 132;
    starProgress = 0;
    
    floatingStarTimer = setInterval(() => {
        // ভিডিও প্লে থাকলেই কেবল টাইমার চলবে
        const videosPlaying = Array.from(document.querySelectorAll('video')).some(v => !v.paused);
        if(!videosPlaying) return; 
        
        starProgress += 100; // প্রতি ১০০ মিলিসেকেন্ডে আপডেট
        const percent = starProgress / REWARD_INTERVAL;
        const offset = circumference - (percent * circumference);
        
        if (circle) circle.style.strokeDashoffset = offset;
        
        if (starProgress >= REWARD_INTERVAL) {
            giveFloatingStarReward();
        }
    }, 100);
}

function stopFloatingStarTimer() {
    if (floatingStarTimer) clearInterval(floatingStarTimer);
    floatingStarTimer = null;
}

function giveFloatingStarReward() {
    stopFloatingStarTimer();
    
    const user = getActiveUser();
    if (!user) return;
    
    if (user.floatingStarData.earned >= MAX_DAILY_STARS) return;
    
    const rewardAmount = 2; // প্রতিবার ২টি স্টার
    user.starBalance = (user.starBalance || 0) + rewardAmount;
    user.pCoinBalance = (user.pCoinBalance || 0) + rewardAmount;
    user.floatingStarData.earned += rewardAmount;
    
    if (!user.transactions) user.transactions = [];
    user.transactions.unshift({
        type: 'received',
        amount: rewardAmount,
        title: 'Floating Star Reward',
        timestamp: Date.now(),
        time: new Date().toLocaleString()
    });
    
    saveUser(user);
    
    // +2 অ্যানিমেশন দেখানো
    showStarPopAnimation();
    
    // আবার নতুন করে টাইমার চালু করা
    initFloatingStar();
}

function showStarPopAnimation() {
    const container = document.getElementById('floatingStarContainer');
    if (!container) return;
    
    const pop = document.createElement('div');
    pop.className = 'star-pop-anim';
    pop.innerText = '+2 ⭐';
    container.appendChild(pop);
    
    setTimeout(() => {
        pop.remove();
    }, 1000);
}
// ===== FLOATING STAR VISIBILITY FIX =====
// ইউজার For You বা Following পেজ থেকে অন্য কোথাও গেলে স্টার যেন হাইড হয়ে যায়
setInterval(() => {
    const starContainer = document.getElementById('floatingStarContainer');
    if (starContainer) {
        // যদি স্ক্রিনে feedContainer (ভিডিও ফিড) না থাকে, তবে স্টার লুকাবে
        if (!document.getElementById('feedContainer')) {
            starContainer.style.display = 'none';
            // টাইমার চলন্ত অবস্থায় থাকলে সেটাও বন্ধ করে দিবে
            if (typeof stopFloatingStarTimer === 'function') {
                stopFloatingStarTimer();
            }
        }
    }
}, 300);
