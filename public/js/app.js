// ========================================
// WWC - SIMPLE WORKING APP
// ========================================

// Firebase ইতিমধ্যে firebase-config.js এ initialized আছে
// তাই এখানে শুধু ব্যবহার করছি

// ===== DOM REFS =====
const feed = document.getElementById('video-feed');
const searchBtn = document.getElementById('search-btn');
const searchOverlay = document.getElementById('search-overlay');
const searchBack = document.getElementById('search-back');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const commentModal = document.getElementById('comment-modal');
const commentList = document.getElementById('comment-list');
const commentInput = document.getElementById('comment-input');
const commentSubmit = document.getElementById('comment-submit');
const closeComment = document.getElementById('close-comment');

// ===== STATE =====
let currentUser = null;
let allVideos = [];
let likedVideos = new Set();
let savedVideos = new Set();
let followingUsers = new Set();
let currentFeed = 'foryou';
let currentVideoId = null;

// ========================================
// AUTH
// ========================================
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'auth.html';
        return;
    }
    currentUser = user;
    await loadUserData();
    await loadVideos();
});

async function loadUserData() {
    try {
        // Load likes
        const likesSnap = await db.collection('likes').where('userId', '==', currentUser.uid).get();
        likesSnap.forEach(doc => likedVideos.add(doc.data().videoId));
        
        // Load saves
        const savesSnap = await db.collection('saves').where('userId', '==', currentUser.uid).get();
        savesSnap.forEach(doc => savedVideos.add(doc.data().videoId));
        
        // Load following
        const followsSnap = await db.collection('follows').where('follower', '==', currentUser.uid).get();
        followsSnap.forEach(doc => followingUsers.add(doc.data().following));
    } catch (e) {
        console.error('User data load error:', e);
    }
}

// ========================================
// LOAD VIDEOS
// ========================================
async function loadVideos() {
    try {
        const snapshot = await db.collection('videos')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        allVideos = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Make sure uid exists
            if (!data.uid) data.uid = data.userId || '';
            allVideos.push({ id: doc.id, ...data });
        });

        console.log('✅ Videos loaded:', allVideos.length);
        renderFeed();
    } catch (e) {
        console.error('Video load error:', e);
        if (feed) feed.innerHTML = `<div class="feed-loading error">❌ ${e.message}</div>`;
    }
}

// ========================================
// RENDER FEED
// ========================================
function renderFeed() {
    if (!feed) return;

    if (!allVideos.length) {
        feed.innerHTML = `<div class="feed-loading">🎬 কোনো ভিডিও নেই</div>`;
        return;
    }

    let videos = allVideos;
    if (currentFeed === 'following') {
        videos = allVideos.filter(v => followingUsers.has(v.uid));
    }

    if (!videos.length) {
        feed.innerHTML = `<div class="feed-loading">👥 আপনি কাউকে Follow করেননি</div>`;
        return;
    }

    feed.innerHTML = '';
    videos.forEach(video => {
        const card = createVideoCard(video);
        feed.appendChild(card);
    });

    setupVideoObserver();
}

// ========================================
// CREATE VIDEO CARD
// ========================================
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.dataset.videoId = video.id;

    const isLiked = likedVideos.has(video.id);
    const isSaved = savedVideos.has(video.id);
    const isFollowing = followingUsers.has(video.uid) || video.uid === currentUser?.uid;

    const videoUrl = video.videoURL || video.downloadURL || '';
    const username = video.username || 'wwc_user';
    const photoUrl = video.photoURL || '';
    const caption = video.caption || '';
    const sound = video.sound || '🎵 Original sound';

    card.innerHTML = `
        <video src="${videoUrl}" loop muted playsinline preload="metadata"></video>
        <div class="mute-indicator"><i class="fas fa-volume-mute"></i></div>

        <div class="side-actions">
            <div class="profile-pic-wrap">
                <img class="profile-pic" src="${photoUrl || './images/profile.png'}" onerror="this.src='./images/profile.png'">
                ${video.uid && video.uid !== currentUser?.uid ? `
                    <button class="follow-btn ${isFollowing ? 'following' : ''}" data-uid="${video.uid}">${isFollowing ? '✓' : '+'}</button>
                ` : ''}
            </div>

            <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-video-id="${video.id}">
                <i class="fas fa-heart"></i>
                <span class="count">${formatNumber(video.likes || 0)}</span>
            </button>

            <button class="action-btn comment-btn" data-video-id="${video.id}">
                <i class="fas fa-comment"></i>
                <span class="count">${formatNumber(video.comments || 0)}</span>
            </button>

            <button class="action-btn save-btn ${isSaved ? 'saved' : ''}" data-video-id="${video.id}">
                <i class="fas fa-bookmark"></i>
                <span class="count">${formatNumber(video.saves || 0)}</span>
            </button>

            <button class="action-btn share-btn" data-video-id="${video.id}">
                <i class="fas fa-share"></i>
                <span>শেয়ার</span>
            </button>

            <div class="music-disc">
                <i class="fas fa-music"></i>
            </div>
        </div>

        <div class="bottom-info">
            <span class="username" data-uid="${video.uid}">@${username}</span>
            <div class="caption">${caption}</div>
            <div class="music-info">
                <i class="fas fa-music"></i>
                <span class="music-text">${sound}</span>
            </div>
        </div>
    `;

    // ===== VIDEO EVENTS =====
    const videoEl = card.querySelector('video');
    const muteIndicator = card.querySelector('.mute-indicator');

    videoEl.addEventListener('click', (e) => {
        e.stopPropagation();
        videoEl.muted = !videoEl.muted;
        muteIndicator.classList.add('show');
        muteIndicator.innerHTML = videoEl.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        setTimeout(() => muteIndicator.classList.remove('show'), 800);
    });

    videoEl.addEventListener('dblclick', (e) => {
        e.preventDefault();
        const likeBtn = card.querySelector('.like-btn');
        if (likeBtn) toggleLike(likeBtn);
    });

    // ===== BUTTON EVENTS =====
    card.querySelector('.like-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLike(e.currentTarget);
    });

    card.querySelector('.comment-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openComment(e.currentTarget.dataset.videoId);
    });

    card.querySelector('.save-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSave(e.currentTarget);
    });

    card.querySelector('.share-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        shareVideo(e.currentTarget.dataset.videoId);
    });

    const followBtn = card.querySelector('.follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFollow(e.currentTarget);
        });
    }

    // ===== PROFILE CLICK =====
    card.querySelector('.profile-pic').addEventListener('click', (e) => {
        e.stopPropagation();
        if (video.uid) window.location.href = `profile.html?uid=${video.uid}`;
    });

    card.querySelector('.username').addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = e.currentTarget.dataset.uid;
        if (uid) window.location.href = `profile.html?uid=${uid}`;
    });

    return card;
}

// ========================================
// ✅ LIKE
// ========================================
async function toggleLike(btn) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    if (btn.disabled) return;
    btn.disabled = true;

    const videoId = btn.dataset.videoId;
    const countSpan = btn.querySelector('.count');
    const isLiked = btn.classList.contains('liked');
    const currentCount = parseInt(countSpan.textContent) || 0;

    btn.classList.toggle('liked', !isLiked);
    const newCount = isLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
    countSpan.textContent = formatNumber(newCount);

    try {
        const videoRef = db.collection('videos').doc(videoId);
        const likeRef = db.collection('likes').doc(`${currentUser.uid}_${videoId}`);

        if (isLiked) {
            await likeRef.delete();
            await videoRef.update({ likes: firebase.firestore.FieldValue.increment(-1) });
            likedVideos.delete(videoId);
        } else {
            await likeRef.set({ userId: currentUser.uid, videoId, createdAt: Date.now() });
            await videoRef.update({ likes: firebase.firestore.FieldValue.increment(1) });
            likedVideos.add(videoId);
        }
    } catch (e) {
        btn.classList.toggle('liked', isLiked);
        countSpan.textContent = formatNumber(currentCount);
        console.error('Like error:', e);
    }
    btn.disabled = false;
}

// ========================================
// ✅ SAVE
// ========================================
async function toggleSave(btn) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    if (btn.disabled) return;
    btn.disabled = true;

    const videoId = btn.dataset.videoId;
    const countSpan = btn.querySelector('.count');
    const isSaved = btn.classList.contains('saved');
    const currentCount = parseInt(countSpan.textContent) || 0;

    btn.classList.toggle('saved', !isSaved);
    const newCount = isSaved ? Math.max(0, currentCount - 1) : currentCount + 1;
    countSpan.textContent = formatNumber(newCount);

    try {
        const videoRef = db.collection('videos').doc(videoId);
        const saveRef = db.collection('saves').doc(`${currentUser.uid}_${videoId}`);

        if (isSaved) {
            await saveRef.delete();
            await videoRef.update({ saves: firebase.firestore.FieldValue.increment(-1) });
            savedVideos.delete(videoId);
        } else {
            await saveRef.set({ userId: currentUser.uid, videoId, createdAt: Date.now() });
            await videoRef.update({ saves: firebase.firestore.FieldValue.increment(1) });
            savedVideos.add(videoId);
            showToast('🔖 ভিডিও সেভ করা হয়েছে');
        }
    } catch (e) {
        btn.classList.toggle('saved', isSaved);
        countSpan.textContent = formatNumber(currentCount);
        console.error('Save error:', e);
    }
    btn.disabled = false;
}

// ========================================
// ✅ FOLLOW
// ========================================
async function toggleFollow(btn) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    if (btn.disabled) return;

    const targetUid = btn.dataset.uid;
    if (!targetUid || targetUid === currentUser.uid) return;
    btn.disabled = true;

    const isFollowing = btn.classList.contains('following');

    try {
        const followRef = db.collection('follows').doc(`${currentUser.uid}_${targetUid}`);

        if (isFollowing) {
            await followRef.delete();
            followingUsers.delete(targetUid);
            btn.classList.remove('following');
            btn.textContent = '+';
            showToast('আনফলো করা হয়েছে');
        } else {
            await followRef.set({ follower: currentUser.uid, following: targetUid, createdAt: Date.now() });
            followingUsers.add(targetUid);
            btn.classList.add('following');
            btn.textContent = '✓';
            showToast('✅ ফলো করা হয়েছে');
        }
    } catch (e) {
        console.error('Follow error:', e);
        showToast('❌ ফলো করতে ব্যর্থ হয়েছে');
    }
    btn.disabled = false;
}

// ========================================
// ✅ COMMENT
// ========================================
function openComment(videoId) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    currentVideoId = videoId;
    if (commentModal) commentModal.classList.add('open');
    loadComments(videoId);
}

if (closeComment) {
    closeComment.addEventListener('click', () => {
        if (commentModal) commentModal.classList.remove('open');
    });
}

async function loadComments(videoId) {
    if (!commentList) return;
    commentList.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">⏳ লোড হচ্ছে...</div>';

    try {
        const snapshot = await db.collection('videos').doc(videoId)
            .collection('comments')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        if (snapshot.empty) {
            commentList.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">💬 কোনো মন্তব্য নেই</div>';
            return;
        }

        commentList.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `
                <div class="comment-user">@${escapeHtml(data.username || 'WWC User')}</div>
                <div class="comment-text">${escapeHtml(data.text || '')}</div>
            `;
            commentList.appendChild(div);
        });
    } catch (e) {
        commentList.innerHTML = '<div style="text-align:center;color:#f44336;padding:20px;">❌ মন্তব্য লোড করা যায়নি</div>';
    }
}

if (commentSubmit) {
    commentSubmit.addEventListener('click', submitComment);
}

if (commentInput) {
    commentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitComment();
    });
}

async function submitComment() {
    if (!currentUser || !currentVideoId) return;
    if (!commentInput) return;
    const text = commentInput.value.trim();
    if (!text) return;

    try {
        await db.collection('videos').doc(currentVideoId).collection('comments').add({
            uid: currentUser.uid,
            username: currentUser.displayName || 'WWC User',
            text: text,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('videos').doc(currentVideoId).update({
            comments: firebase.firestore.FieldValue.increment(1)
        });

        commentInput.value = '';
        await loadComments(currentVideoId);
        showToast('💬 মন্তব্য যোগ করা হয়েছে');
    } catch (e) {
        console.error('Comment error:', e);
        showToast('❌ মন্তব্য করতে ব্যর্থ হয়েছে');
    }
}

// ========================================
// ✅ SHARE
// ========================================
async function shareVideo(videoId) {
    const url = `${window.location.origin}${window.location.pathname}?video=${videoId}`;
    try {
        if (navigator.share) {
            await navigator.share({ title: 'WWC', text: 'এই ভিডিওটি দেখুন! 🎬', url });
        } else {
            await navigator.clipboard.writeText(url);
            showToast('🔗 লিংক কপি করা হয়েছে');
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            showToast('❌ শেয়ার করতে ব্যর্থ হয়েছে');
        }
    }
}

// ========================================
// ✅ SEARCH
// ========================================
if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        if (searchOverlay) searchOverlay.classList.add('open');
        if (searchInput) searchInput.focus();
    });
}

if (searchBack) {
    searchBack.addEventListener('click', () => {
        if (searchOverlay) searchOverlay.classList.remove('open');
        if (searchInput) searchInput.value = '';
    });
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!searchResults) return;

        if (!query) {
            searchResults.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">ইউজারনেম লিখে খুঁজুন</div>';
            return;
        }

        const found = allVideos.filter(v => 
            (v.username || '').toLowerCase().includes(query) ||
            (v.name || '').toLowerCase().includes(query)
        );

        if (!found.length) {
            searchResults.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">😕 কোনো ফলাফল পাওয়া যায়নি</div>';
            return;
        }

        searchResults.innerHTML = '';
        found.forEach(v => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
                <img src="${v.photoURL || './images/profile.png'}" onerror="this.src='./images/profile.png'">
                <span class="search-result-name">@${escapeHtml(v.username || 'WWC User')}</span>
            `;
            div.addEventListener('click', () => {
                if (v.uid) window.location.href = `profile.html?uid=${v.uid}`;
            });
            searchResults.appendChild(div);
        });
    });
}

// ========================================
// ✅ TABS
// ========================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFeed = btn.dataset.tab === 'following' ? 'following' : 'foryou';
        renderFeed();
    });
});

// ========================================
// ✅ VIDEO OBSERVER
// ========================================
function setupVideoObserver() {
    const videos = document.querySelectorAll('.video-card video');
    if (!videos.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            const card = video.closest('.video-card');
            const disc = card?.querySelector('.music-disc');

            if (entry.isIntersecting) {
                video.play().catch(() => {});
                if (disc) disc.classList.add('spinning');
            } else {
                video.pause();
                if (disc) disc.classList.remove('spinning');
            }
        });
    }, { threshold: 0.6 });

    videos.forEach(v => observer.observe(v));

    setTimeout(() => {
        const first = videos[0];
        if (first) first.play().catch(() => {});
    }, 500);
}

// ========================================
// ✅ HELPERS
// ========================================
function formatNumber(num) {
    num = Number(num) || 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
            background: rgba(30,30,30,0.95); color: #fff; padding: 10px 24px;
            border-radius: 24px; font-size: 14px; z-index: 999;
            opacity: 0; transition: opacity 0.3s ease;
            pointer-events: none; white-space: nowrap;
            border: 1px solid rgba(255,255,255,0.1);
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

console.log('✅ WWC App Loaded!');
