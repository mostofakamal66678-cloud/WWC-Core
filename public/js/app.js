// ========================================
// WWC - Complete Fixed App
// All buttons working: Like, Comment, Save, Follow, Profile
// ========================================

// ===== Firebase Config =====
const firebaseConfig = {
    apiKey: "AIzaSyCgio17aPEfR7d6juqIhn3yi6Mf65W_tO4",
    authDomain: "world-wide-connect-62c87.firebaseapp.com",
    projectId: "world-wide-connect-62c87",
    storageBucket: "world-wide-connect-62c87.firebasestorage.app",
    messagingSenderId: "93178453668",
    appId: "1:93178453668:web:2184630caa8e61f7445031",
    measurementId: "G-PKFJ5NEMGQ"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ===== Global State =====
let currentUser = null;
let currentProfile = null;
let allVideos = [];
let likedVideos = new Set();
let savedVideos = new Set();
let followingUsers = new Set();
let currentFeed = 'foryou';
let currentVideoId = null;
let isCommentOpen = false;

// ========================================
// AUTH
// ========================================
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'auth.html';
        return;
    }
    currentUser = user;
    await loadUserProfile();
    await loadUserInteractions();
    await loadVideos();
});

async function loadUserProfile() {
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        currentProfile = doc.exists ? doc.data() : { followingIds: [], savedVideoIds: [] };
        if (currentProfile.followingIds) {
            followingUsers = new Set(currentProfile.followingIds);
        }
        if (currentProfile.savedVideoIds) {
            savedVideos = new Set(currentProfile.savedVideoIds);
        }
    } catch (e) {
        console.error('Profile load error:', e);
        currentProfile = { followingIds: [], savedVideoIds: [] };
    }
}

async function loadUserInteractions() {
    try {
        // Load likes
        const likesSnap = await db.collection('likes').where('userId', '==', currentUser.uid).get();
        likesSnap.forEach(doc => likedVideos.add(doc.data().videoId));
        
        // Load saves
        const savesSnap = await db.collection('saves').where('userId', '==', currentUser.uid).get();
        savesSnap.forEach(doc => savedVideos.add(doc.data().videoId));
    } catch (e) {
        console.error('Interactions load error:', e);
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
            // Ensure uid field exists
            if (!data.uid) data.uid = data.userId || '';
            allVideos.push({ id: doc.id, ...data });
        });

        renderFeed();
    } catch (e) {
        console.error('Video load error:', e);
        document.getElementById('video-feed').innerHTML = `
            <div class="feed-loading error">❌ ভিডিও লোড করা যায়নি</div>
        `;
    }
}

// ========================================
// RENDER FEED
// ========================================
function renderFeed() {
    const feed = document.getElementById('video-feed');
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
// ✅ CREATE VIDEO CARD - ALL BUTTONS WORKING
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
    const displayName = video.name || username;
    const photoUrl = video.photoURL || '';
    const caption = video.caption || '';
    const sound = video.sound || '🎵 Original sound - WWC';

    card.innerHTML = `
        <video src="${videoUrl}" loop muted playsinline preload="metadata"></video>
        <div class="mute-indicator"><i class="fas fa-volume-mute"></i></div>

        <div class="side-actions">
            <div class="profile-pic-wrap">
                <img class="profile-pic" src="${photoUrl || './images/profile.png'}" alt="${displayName}" onerror="this.src='./images/profile.png'">
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

    // Click = mute toggle
    videoEl.addEventListener('click', (e) => {
        e.stopPropagation();
        videoEl.muted = !videoEl.muted;
        muteIndicator.classList.add('show');
        muteIndicator.innerHTML = videoEl.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        setTimeout(() => muteIndicator.classList.remove('show'), 800);
    });

    // Double click = like
    videoEl.addEventListener('dblclick', (e) => {
        e.preventDefault();
        const likeBtn = card.querySelector('.like-btn');
        if (likeBtn) toggleLike(likeBtn);
    });

    // ===== ✅ LIKE BUTTON =====
    card.querySelector('.like-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLike(e.currentTarget);
    });

    // ===== ✅ COMMENT BUTTON =====
    card.querySelector('.comment-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openCommentModal(e.currentTarget.dataset.videoId);
    });

    // ===== ✅ SAVE BUTTON =====
    card.querySelector('.save-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSave(e.currentTarget);
    });

    // ===== ✅ SHARE BUTTON =====
    card.querySelector('.share-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        shareVideo(e.currentTarget.dataset.videoId);
    });

    // ===== ✅ FOLLOW BUTTON =====
    const followBtn = card.querySelector('.follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFollow(e.currentTarget);
        });
    }

    // ===== ✅ PROFILE CLICK =====
    card.querySelector('.profile-pic').addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = e.target.closest('.profile-pic-wrap')?.querySelector('.follow-btn')?.dataset.uid || video.uid;
        if (uid) goToProfile(uid);
    });

    card.querySelector('.username').addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = e.currentTarget.dataset.uid;
        if (uid) goToProfile(uid);
    });

    card.querySelector('.music-disc').addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = video.uid;
        if (uid) goToProfile(uid);
    });

    card.querySelector('.music-info').addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = video.uid;
        if (uid) goToProfile(uid);
    });

    return card;
}

// ========================================
// ✅ LIKE - COMPLETE FIX
// ========================================
async function toggleLike(btn) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    if (btn.disabled) return;
    btn.disabled = true;

    const videoId = btn.dataset.videoId;
    const countSpan = btn.querySelector('.count');
    const isLiked = btn.classList.contains('liked');
    const currentCount = parseInt(countSpan.dataset.raw) || parseInt(countSpan.textContent) || 0;

    // Optimistic update
    btn.classList.toggle('liked', !isLiked);
    const newCount = isLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
    countSpan.textContent = formatNumber(newCount);
    countSpan.dataset.raw = newCount;

    try {
        const videoRef = db.collection('videos').doc(videoId);
        const likeId = `${currentUser.uid}_${videoId}`;
        const likeRef = db.collection('likes').doc(likeId);

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
        // Rollback on error
        btn.classList.toggle('liked', isLiked);
        countSpan.textContent = formatNumber(currentCount);
        countSpan.dataset.raw = currentCount;
        console.error('Like error:', e);
        showToast('❌ লাইক করতে ব্যর্থ হয়েছে');
    }
    btn.disabled = false;
}

// ========================================
// ✅ SAVE - COMPLETE FIX
// ========================================
async function toggleSave(btn) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    if (btn.disabled) return;
    btn.disabled = true;

    const videoId = btn.dataset.videoId;
    const countSpan = btn.querySelector('.count');
    const isSaved = btn.classList.contains('saved');
    const currentCount = parseInt(countSpan.dataset.raw) || parseInt(countSpan.textContent) || 0;

    // Optimistic update
    btn.classList.toggle('saved', !isSaved);
    const newCount = isSaved ? Math.max(0, currentCount - 1) : currentCount + 1;
    countSpan.textContent = formatNumber(newCount);
    countSpan.dataset.raw = newCount;

    try {
        const videoRef = db.collection('videos').doc(videoId);
        const userRef = db.collection('users').doc(currentUser.uid);
        const saveId = `${currentUser.uid}_${videoId}`;
        const saveRef = db.collection('saves').doc(saveId);

        if (isSaved) {
            await saveRef.delete();
            await videoRef.update({ saves: firebase.firestore.FieldValue.increment(-1) });
            savedVideos.delete(videoId);
            // Update user profile
            if (currentProfile?.savedVideoIds) {
                currentProfile.savedVideoIds = currentProfile.savedVideoIds.filter(id => id !== videoId);
                await userRef.update({ savedVideoIds: currentProfile.savedVideoIds });
            }
        } else {
            await saveRef.set({ userId: currentUser.uid, videoId, createdAt: Date.now() });
            await videoRef.update({ saves: firebase.firestore.FieldValue.increment(1) });
            savedVideos.add(videoId);
            // Update user profile
            if (currentProfile) {
                if (!currentProfile.savedVideoIds) currentProfile.savedVideoIds = [];
                if (!currentProfile.savedVideoIds.includes(videoId)) {
                    currentProfile.savedVideoIds.push(videoId);
                    await userRef.update({ savedVideoIds: currentProfile.savedVideoIds });
                }
            }
        }
        showToast(isSaved ? 'সেভ থেকে রিমুভ করা হয়েছে' : '🔖 ভিডিও সেভ করা হয়েছে');
    } catch (e) {
        // Rollback
        btn.classList.toggle('saved', isSaved);
        countSpan.textContent = formatNumber(currentCount);
        countSpan.dataset.raw = currentCount;
        console.error('Save error:', e);
        showToast('❌ সেভ করতে ব্যর্থ হয়েছে');
    }
    btn.disabled = false;
}

// ========================================
// ✅ FOLLOW - COMPLETE FIX
// ========================================
async function toggleFollow(btn) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    if (btn.disabled) return;

    const targetUid = btn.dataset.uid;
    if (!targetUid || targetUid === currentUser.uid) return;
    btn.disabled = true;

    const isFollowing = btn.classList.contains('following');

    try {
        const myRef = db.collection('users').doc(currentUser.uid);
        const targetRef = db.collection('users').doc(targetUid);
        const followId = `${currentUser.uid}_${targetUid}`;
        const followRef = db.collection('follows').doc(followId);

        if (isFollowing) {
            // Unfollow
            await followRef.delete();
            await myRef.update({
                followingIds: firebase.firestore.FieldValue.arrayRemove(targetUid),
                following: firebase.firestore.FieldValue.increment(-1)
            });
            await targetRef.update({
                followerIds: firebase.firestore.FieldValue.arrayRemove(currentUser.uid),
                followers: firebase.firestore.FieldValue.increment(-1)
            });
            followingUsers.delete(targetUid);
            btn.classList.remove('following');
            btn.textContent = '+';
            showToast('আনফলো করা হয়েছে');
        } else {
            // Follow
            await followRef.set({
                follower: currentUser.uid,
                following: targetUid,
                createdAt: Date.now()
            });
            await myRef.update({
                followingIds: firebase.firestore.FieldValue.arrayUnion(targetUid),
                following: firebase.firestore.FieldValue.increment(1)
            });
            await targetRef.update({
                followerIds: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
                followers: firebase.firestore.FieldValue.increment(1)
            });
            followingUsers.add(targetUid);
            btn.classList.add('following');
            btn.textContent = '✓';
            showToast('✅ ফলো করা হয়েছে');
        }

        // Update currentProfile
        const updatedProfile = await db.collection('users').doc(currentUser.uid).get();
        if (updatedProfile.exists) {
            currentProfile = updatedProfile.data();
        }
    } catch (e) {
        console.error('Follow error:', e);
        showToast('❌ ফলো করতে ব্যর্থ হয়েছে');
    }
    btn.disabled = false;
}

// ========================================
// ✅ PROFILE - COMPLETE FIX
// ========================================
function goToProfile(uid) {
    if (!uid) return;
    window.location.href = `profile.html?uid=${uid}`;
}

// ========================================
// ✅ COMMENT - COMPLETE FIX
// ========================================
function openCommentModal(videoId) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    currentVideoId = videoId;
    const modal = document.getElementById('comment-modal');
    if (modal) {
        modal.classList.add('open');
        loadComments(videoId);
    }
}

// Close comment modal
document.addEventListener('click', (e) => {
    if (e.target.closest('#close-comment') || e.target.closest('.comment-header button')) {
        const modal = document.getElementById('comment-modal');
        if (modal) modal.classList.remove('open');
    }
});

async function loadComments(videoId) {
    const list = document.getElementById('comment-list');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">⏳ লোড হচ্ছে...</div>';

    try {
        const snapshot = await db.collection('videos').doc(videoId)
            .collection('comments')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const countEl = document.getElementById('comment-count-title');
        if (countEl) countEl.textContent = `মন্তব্য (${snapshot.size})`;

        if (snapshot.empty) {
            list.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">💬 কোনো মন্তব্য নেই</div>';
            return;
        }

        list.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `
                <div class="comment-user">@${escapeHtml(data.username || 'WWC User')}</div>
                <div class="comment-text">${escapeHtml(data.text || '')}</div>
            `;
            list.appendChild(div);
        });
    } catch (e) {
        console.error('Comment load error:', e);
        list.innerHTML = '<div style="text-align:center;color:#f44336;padding:20px;">❌ মন্তব্য লোড করা যায়নি</div>';
    }
}

// Submit comment
document.getElementById('comment-submit')?.addEventListener('click', submitComment);
document.getElementById('comment-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitComment();
});

async function submitComment() {
    if (!currentUser || !currentVideoId) return;
    const input = document.getElementById('comment-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    input.disabled = true;
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

        input.value = '';
        await loadComments(currentVideoId);
        showToast('💬 মন্তব্য যোগ করা হয়েছে');

        // Update comment count in feed
        const card = document.querySelector(`.video-card[data-video-id="${currentVideoId}"]`);
        if (card) {
            const countSpan = card.querySelector('.comment-btn .count');
            if (countSpan) {
                const current = parseInt(countSpan.dataset.raw) || parseInt(countSpan.textContent) || 0;
                countSpan.textContent = formatNumber(current + 1);
                countSpan.dataset.raw = current + 1;
            }
        }
    } catch (e) {
        console.error('Comment error:', e);
        showToast('❌ মন্তব্য করতে ব্যর্থ হয়েছে');
    }
    input.disabled = false;
}

// ========================================
// ✅ SHARE - COMPLETE FIX
// ========================================
async function shareVideo(videoId) {
    const url = `${window.location.origin}${window.location.pathname}?video=${videoId}`;
    try {
        if (navigator.share) {
            await navigator.share({
                title: 'WWC - World Wide Connect',
                text: 'এই ভিডিওটি দেখুন! 🎬',
                url: url
            });
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
// ✅ SEARCH - COMPLETE FIX
// ========================================
document.getElementById('search-btn')?.addEventListener('click', () => {
    const overlay = document.getElementById('search-overlay');
    if (overlay) {
        overlay.classList.add('open');
        document.getElementById('search-input')?.focus();
    }
});

document.getElementById('search-back')?.addEventListener('click', () => {
    const overlay = document.getElementById('search-overlay');
    if (overlay) overlay.classList.remove('open');
});

document.getElementById('search-input')?.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    const results = document.getElementById('search-results');
    if (!results) return;

    if (!query) {
        results.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">ইউজারনেম লিখে খুঁজুন</div>';
        return;
    }

    const found = allVideos.filter(v => 
        (v.username || '').toLowerCase().includes(query) ||
        (v.name || '').toLowerCase().includes(query)
    );

    if (!found.length) {
        results.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">😕 কোনো ফলাফল পাওয়া যায়নি</div>';
        return;
    }

    results.innerHTML = '';
    found.forEach(v => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `
            <img src="${v.photoURL || './images/profile.png'}" onerror="this.src='./images/profile.png'">
            <span class="search-result-name">@${escapeHtml(v.username || 'WWC User')}</span>
        `;
        div.addEventListener('click', () => {
            if (v.uid) goToProfile(v.uid);
        });
        results.appendChild(div);
    });
});

// ========================================
// ✅ TABS - COMPLETE FIX
// ========================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        if (tab === 'following') {
            currentFeed = 'following';
        } else if (tab === 'foryou') {
            currentFeed = 'foryou';
        } else if (tab === 'live') {
            currentFeed = 'live';
        }
        renderFeed();
    });
});

// ========================================
// ✅ VIDEO OBSERVER - AUTOPLAY
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

    // Play first video
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
            max-width: 90%;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

console.log('✅ WWC App Loaded - All buttons working!');
