// ========================================
// WWC - TIKTOK STYLE COMPLETE APP (FINAL FIXED)
// Scroll, Like, Save, Follow, Comment, Notification, Profile
// ========================================

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

let currentUser = null;
let currentUserData = null;
let allVideos = [];
let likedVideos = new Set();
let savedVideos = new Set();
let followingUsers = new Set();
let currentFeed = 'foryou';
let currentVideoId = null;
let videoObserver = null;

// ========== AUTH ==========
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'public/js/auth.html';
        return;
    }
    currentUser = user;
    await loadCurrentUserProfile();
    await loadUserData();
    await loadVideos();
});

async function loadCurrentUserProfile() {
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (doc.exists) {
            currentUserData = doc.data();
        } else {
            currentUserData = {
                username: currentUser.displayName || 'wwc_user',
                displayName: currentUser.displayName || 'WWC User',
                photoURL: currentUser.photoURL || ''
            };
            await db.collection('users').doc(currentUser.uid).set({
                uid: currentUser.uid,
                username: currentUserData.username,
                displayName: currentUserData.displayName,
                photoURL: currentUserData.photoURL,
                bio: 'হ্যালো, আমি WWC ব্যবহার করছি',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
    } catch (e) {
        console.error(e);
        currentUserData = { username: 'wwc_user', displayName: 'WWC User' };
    }
}

async function loadUserData() {
    try {
        const likesSnap = await db.collection('likes').where('userId', '==', currentUser.uid).get();
        likesSnap.forEach(doc => likedVideos.add(doc.data().videoId));

        const savesSnap = await db.collection('saves').where('userId', '==', currentUser.uid).get();
        savesSnap.forEach(doc => savedVideos.add(doc.data().videoId));

        const followsSnap = await db.collection('follows').where('follower', '==', currentUser.uid).get();
        followsSnap.forEach(doc => followingUsers.add(doc.data().following));
    } catch (e) {
        console.error(e);
    }
}

// ========== LOAD VIDEOS ==========
async function loadVideos() {
    try {
        const snapshot = await db.collection('videos')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        allVideos = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.uid) data.uid = data.userId || '';
            allVideos.push({ id: doc.id, ...data });
        });

        if (allVideos.length === 0) {
            if (feed) feed.innerHTML = `<div class="feed-loading">🎬 কোনো ভিডিও নেই</div>`;
            return;
        }
        renderFeed();
    } catch (e) {
        console.error(e);
        if (feed) feed.innerHTML = `<div class="feed-loading error">❌ ভিডিও লোড হয়নি</div>`;
    }
}

// ========== RENDER FEED ==========
function renderFeed() {
    if (!feed) return;

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
        feed.appendChild(createVideoCard(video));
    });

    setupVideoObserver();
}

// ========== CREATE VIDEO CARD ==========
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.dataset.videoId = video.id;

    const isLiked = likedVideos.has(video.id);
    const isSaved = savedVideos.has(video.id);
    const isFollowing = followingUsers.has(video.uid) || (video.uid === currentUser?.uid);

    const videoUrl = video.videoURL || video.downloadURL || '';
    const username = video.username || 'wwc_user';
    const photoUrl = video.photoURL || '';
    const caption = video.caption || '';
    const sound = video.sound || 'Original sound';

    card.innerHTML = `
        <video src="${videoUrl}" loop muted playsinline preload="metadata"></video>
        <div class="mute-indicator"><i class="fas fa-volume-mute"></i></div>

        <div class="side-actions">
            <div class="profile-pic-wrap">
                <img class="profile-pic" 
                     src="${photoUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(username) + '&background=25f4ee&color=000'}" 
                     onerror="this.src='https://ui-avatars.com/api/?name=U&background=25f4ee&color=000'"
                     data-uid="${video.uid || ''}">
                ${video.uid && video.uid !== currentUser?.uid ? 
                    `<button class="follow-btn \( {isFollowing ? 'following' : ''}" data-uid=" \){video.uid}">${isFollowing ? '✓' : '+'}</button>` 
                    : ''}
            </div>

            <button class="action-btn like-btn \( {isLiked ? 'liked' : ''}" data-video-id=" \){video.id}">
                <i class="fas fa-heart"></i>
                <span class="count">${formatNumber(video.likes || 0)}</span>
            </button>

            <button class="action-btn comment-btn" data-video-id="${video.id}">
                <i class="fas fa-comment"></i>
                <span class="count">${formatNumber(video.comments || 0)}</span>
            </button>

            <button class="action-btn save-btn \( {isSaved ? 'saved' : ''}" data-video-id=" \){video.id}">
                <i class="fas fa-bookmark"></i>
                <span class="count">${formatNumber(video.saves || 0)}</span>
            </button>

            <button class="action-btn share-btn" data-video-id="${video.id}">
                <i class="fas fa-share"></i>
                <span>শেয়ার</span>
            </button>

            <div class="music-disc" data-uid="${video.uid || ''}">
                <i class="fas fa-music"></i>
            </div>
        </div>

        <div class="bottom-info">
            <span class="username" data-uid="\( {video.uid || ''}">@ \){username}</span>
            <div class="caption">${caption}</div>
            <div class="music-info" data-uid="${video.uid || ''}">
                <i class="fas fa-music"></i>
                <span class="music-text">${sound}</span>
            </div>
        </div>
    `;

    const videoEl = card.querySelector('video');
    const muteIndicator = card.querySelector('.mute-indicator');

    // Mute / Unmute
    videoEl.addEventListener('click', (e) => {
        e.stopPropagation();
        videoEl.muted = !videoEl.muted;
        muteIndicator.classList.add('show');
        muteIndicator.innerHTML = videoEl.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        setTimeout(() => muteIndicator.classList.remove('show'), 800);
    });

    // Double tap like
    videoEl.addEventListener('dblclick', (e) => {
        e.preventDefault();
        const likeBtn = card.querySelector('.like-btn');
        if (likeBtn) toggleLike(likeBtn);
    });

    // Profile clicks
    card.querySelectorAll('[data-uid]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const uid = el.getAttribute('data-uid');
            if (uid) goToProfile(uid);
        });
    });

    // Buttons
    const likeBtn = card.querySelector('.like-btn');
    if (likeBtn) likeBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleLike(likeBtn); });

    const commentBtn = card.querySelector('.comment-btn');
    if (commentBtn) commentBtn.addEventListener('click', (e) => { e.stopPropagation(); openComment(commentBtn.dataset.videoId); });

    const saveBtn = card.querySelector('.save-btn');
    if (saveBtn) saveBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSave(saveBtn); });

    const shareBtn = card.querySelector('.share-btn');
    if (shareBtn) shareBtn.addEventListener('click', (e) => { e.stopPropagation(); shareVideo(shareBtn.dataset.videoId); });

    const followBtn = card.querySelector('.follow-btn');
    if (followBtn) followBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFollow(followBtn); });

    return card;
}

// ========== LIKE ==========
async function toggleLike(btn) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    if (btn.disabled) return;
    btn.disabled = true;

    const videoId = btn.dataset.videoId;
    const countSpan = btn.querySelector('.count');
    const isLiked = btn.classList.contains('liked');
    const currentCount = parseInt(countSpan.textContent.replace(/[^\d]/g, '')) || 0;

    // Optimistic UI
    btn.classList.toggle('liked', !isLiked);
    countSpan.textContent = formatNumber(isLiked ? Math.max(0, currentCount - 1) : currentCount + 1);

    try {
        const videoRef = db.collection('videos').doc(videoId);
        const likeRef = db.collection('likes').doc(currentUser.uid + '_' + videoId);

        if (isLiked) {
            await likeRef.delete();
            await videoRef.update({ likes: firebase.firestore.FieldValue.increment(-1) });
            likedVideos.delete(videoId);
        } else {
            await likeRef.set({
                userId: currentUser.uid,
                videoId: videoId,
                createdAt: Date.now()
            });
            await videoRef.update({ likes: firebase.firestore.FieldValue.increment(1) });
            likedVideos.add(videoId);

            // Notification
            try {
                const videoDoc = await videoRef.get();
                if (videoDoc.exists) {
                    const v = videoDoc.data();
                    if (v.uid && v.uid !== currentUser.uid) {
                        await db.collection('notifications').add({
                            toUserId: v.uid,
                            fromUserId: currentUser.uid,
                            fromUsername: (currentUserData && currentUserData.username) || 'user',
                            fromPhotoURL: (currentUserData && currentUserData.photoURL) || '',
                            type: 'like',
                            videoId: videoId,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            read: false
                        });
                    }
                }
            } catch (ne) {}
        }
    } catch (e) {
        // Revert on error
        btn.classList.toggle('liked', isLiked);
        countSpan.textContent = formatNumber(currentCount);
        console.error('Like error:', e);
        showToast('লাইক সেভ হয়নি');
    }
    btn.disabled = false;
}

// ========== SAVE ==========
async function toggleSave(btn) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    if (btn.disabled) return;
    btn.disabled = true;

    const videoId = btn.dataset.videoId;
    const countSpan = btn.querySelector('.count');
    const isSaved = btn.classList.contains('saved');
    const currentCount = parseInt(countSpan.textContent.replace(/[^\d]/g, '')) || 0;

    btn.classList.toggle('saved', !isSaved);
    countSpan.textContent = formatNumber(isSaved ? Math.max(0, currentCount - 1) : currentCount + 1);

    try {
        const videoRef = db.collection('videos').doc(videoId);
        const saveRef = db.collection('saves').doc(currentUser.uid + '_' + videoId);

        if (isSaved) {
            await saveRef.delete();
            await videoRef.update({ saves: firebase.firestore.FieldValue.increment(-1) });
            savedVideos.delete(videoId);
        } else {
            await saveRef.set({
                userId: currentUser.uid,
                videoId: videoId,
                createdAt: Date.now()
            });
            await videoRef.update({ saves: firebase.firestore.FieldValue.increment(1) });
            savedVideos.add(videoId);
            showToast('🔖 সেভ করা হয়েছে');
        }
    } catch (e) {
        btn.classList.toggle('saved', isSaved);
        countSpan.textContent = formatNumber(currentCount);
        console.error(e);
        showToast('সেভ হয়নি');
    }
    btn.disabled = false;
}

// ========== FOLLOW ==========
async function toggleFollow(btn) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    if (btn.disabled) return;

    const targetUid = btn.dataset.uid;
    if (!targetUid || targetUid === currentUser.uid) return;
    btn.disabled = true;

    const isFollowing = btn.classList.contains('following');

    try {
        const followRef = db.collection('follows').doc(currentUser.uid + '_' + targetUid);

        if (isFollowing) {
            await followRef.delete();
            followingUsers.delete(targetUid);
            btn.classList.remove('following');
            btn.textContent = '+';
            showToast('আনফলো করা হয়েছে');
        } else {
            await followRef.set({
                follower: currentUser.uid,
                following: targetUid,
                createdAt: Date.now()
            });
            followingUsers.add(targetUid);
            btn.classList.add('following');
            btn.textContent = '✓';
            showToast('✅ ফলো করা হয়েছে');

            // Notification
            try {
                await db.collection('notifications').add({
                    toUserId: targetUid,
                    fromUserId: currentUser.uid,
                    fromUsername: (currentUserData && currentUserData.username) || 'user',
                    fromPhotoURL: (currentUserData && currentUserData.photoURL) || '',
                    type: 'follow',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    read: false
                });
            } catch (ne) {}
        }
    } catch (e) {
        console.error(e);
        showToast('ফলো ব্যর্থ');
    }
    btn.disabled = false;
}

// ========== COMMENT ==========
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
    commentList.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">লোড হচ্ছে...</div>';

    try {
        const snapshot = await db.collection('videos').doc(videoId)
            .collection('comments')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        if (snapshot.empty) {
            commentList.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">কোনো মন্তব্য নেই</div>';
            return;
        }

        commentList.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `
                <div class="comment-user">@${escapeHtml(data.username || 'user')}</div>
                <div class="comment-text">${escapeHtml(data.text || '')}</div>
            `;
            commentList.appendChild(div);
        });
    } catch (e) {
        commentList.innerHTML = '<div style="text-align:center;color:#f44336;padding:20px;">মন্তব্য লোড হয়নি</div>';
    }
}

if (commentSubmit) commentSubmit.addEventListener('click', submitComment);
if (commentInput) {
    commentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitComment();
    });
}

async function submitComment() {
    if (!currentUser || !currentVideoId || !commentInput) return;
    const text = commentInput.value.trim();
    if (!text) return;

    const username = (currentUserData && currentUserData.username) || currentUser.displayName || 'user';

    try {
        await db.collection('videos').doc(currentVideoId).collection('comments').add({
            uid: currentUser.uid,
            username: username,
            text: text,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('videos').doc(currentVideoId).update({
            comments: firebase.firestore.FieldValue.increment(1)
        });

        commentInput.value = '';
        await loadComments(currentVideoId);
        showToast('মন্তব্য যোগ হয়েছে');

        // Notification
        try {
            const videoDoc = await db.collection('videos').doc(currentVideoId).get();
            if (videoDoc.exists) {
                const v = videoDoc.data();
                if (v.uid && v.uid !== currentUser.uid) {
                    await db.collection('notifications').add({
                        toUserId: v.uid,
                        fromUserId: currentUser.uid,
                        fromUsername: username,
                        fromPhotoURL: (currentUserData && currentUserData.photoURL) || '',
                        type: 'comment',
                        text: text,
                        videoId: currentVideoId,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        read: false
                    });
                }
            }
        } catch (ne) {}
    } catch (e) {
        console.error(e);
        showToast('মন্তব্য ব্যর্থ');
    }
}

// ========== SHARE ==========
async function shareVideo(videoId) {
    const url = window.location.origin + window.location.pathname + '?video=' + videoId;
    try {
        if (navigator.share) {
            await navigator.share({ title: 'WWC', text: 'এই ভিডিও দেখুন!', url: url });
        } else {
            await navigator.clipboard.writeText(url);
            showToast('লিংক কপি হয়েছে');
        }
    } catch (e) {
        if (e.name !== 'AbortError') showToast('শেয়ার ব্যর্থ');
    }
}

// ========== SEARCH ==========
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
            searchResults.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">ইউজারনেম লিখুন</div>';
            return;
        }
        const found = allVideos.filter(v => (v.username || '').toLowerCase().includes(query));
        const unique = [];
        const seen = new Set();
        found.forEach(v => {
            if (v.uid && !seen.has(v.uid)) {
                seen.add(v.uid);
                unique.push(v);
            }
        });
        if (!unique.length) {
            searchResults.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">কোনো ফলাফল নেই</div>';
            return;
        }
        searchResults.innerHTML = '';
        unique.forEach(v => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
                <img src="${v.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(v.username || 'U') + '&background=25f4ee&color=000'}">
                <span class="search-result-name">@${escapeHtml(v.username || 'user')}</span>
            `;
            div.addEventListener('click', () => { if (v.uid) goToProfile(v.uid); });
            searchResults.appendChild(div);
        });
    });
}

// ========== TABS ==========
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFeed = btn.dataset.tab === 'following' ? 'following' : 'foryou';
        renderFeed();
    });
});

// ========== VIDEO OBSERVER (SCROLL FIX) ==========
function setupVideoObserver() {
    const videos = document.querySelectorAll('.video-card video');
    if (!videos.length) return;

    if (videoObserver) {
        videoObserver.disconnect();
    }

    videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            const card = video.closest('.video-card');
            const disc = card ? card.querySelector('.music-disc') : null;

            if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
                // Pause all other videos
                document.querySelectorAll('.video-card video').forEach(v => {
                    if (v !== video) {
                        v.pause();
                    }
                });
                video.play().catch(() => {});
                if (disc) disc.classList.add('spinning');
            } else {
                video.pause();
                if (disc) disc.classList.remove('spinning');
            }
        });
    }, {
        threshold: 0.55,
        root: null,
        rootMargin: '0px'
    });

    videos.forEach(v => videoObserver.observe(v));

    // Play first video
    setTimeout(() => {
        if (videos[0]) videos[0].play().catch(() => {});
    }, 400);
}

// ========== GO TO PROFILE ==========
function goToProfile(uid) {
    if (!uid) return;
    window.location.href = 'public/js/profile.html?uid=' + uid;
}

// ========== HELPERS ==========
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
        toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(30,30,30,0.95);color:#fff;padding:10px 24px;border-radius:24px;font-size:14px;z-index:999;opacity:0;transition:opacity 0.3s;pointer-events:none;white-space:nowrap;border:1px solid rgba(255,255,255,0.1);';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

console.log('✅ WWC App Loaded - Final Fixed');
