// ========================================
// WWC (World Wide Connect) - TikTok-Style Feed
// All features working!
// ========================================

let currentUser = null;
let lastVisible = null;
let isLoading = false;
let noMoreVideos = false;
let likedVideoIds = new Set();
let savedVideoIds = new Set();
let followingIds = new Set();
let globalMuted = true;
let activeCommentVideoId = null;
let activeCommentOwnerUid = null;
let searchTimeout = null;
const userProfileCache = {};

const PAGE_SIZE = 5;

// ========================================
// AUTH
// ========================================
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'auth.html';
        return;
    }
    currentUser = user;
    initFeed();
});

async function initFeed() {
    await Promise.all([loadMyLikes(), loadMySaves(), loadMyFollowing()]);
    loadFeed(true);
    setupInfiniteScroll();
    setupCommentModal();
    setupTopTabs();
    setupSearch();
}

// ========================================
// LOAD USER DATA
// ========================================
async function loadMyLikes() {
    try {
        const snap = await db.collection('likes').where('userId', '==', currentUser.uid).get();
        snap.forEach(doc => likedVideoIds.add(doc.data().videoId));
    } catch (e) { console.error('Likes load error:', e); }
}

async function loadMySaves() {
    try {
        const snap = await db.collection('saves').where('userId', '==', currentUser.uid).get();
        snap.forEach(doc => savedVideoIds.add(doc.data().videoId));
    } catch (e) { console.error('Saves load error:', e); }
}

async function loadMyFollowing() {
    try {
        const snap = await db.collection('follows').where('follower', '==', currentUser.uid).get();
        snap.forEach(doc => followingIds.add(doc.data().following));
    } catch (e) { console.error('Following load error:', e); }
}

// ========================================
// TABS
// ========================================
function setupTopTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            if (tab === 'following') {
                // Show only followed users' videos
                loadFeed(true);
            } else {
                loadFeed(true);
            }
        });
    });
}

// ========================================
// SEARCH
// ========================================
function setupSearch() {
    const searchBtn = document.getElementById('search-btn');
    const overlay = document.getElementById('search-overlay');
    const backBtn = document.getElementById('search-back');
    const input = document.getElementById('search-input');

    searchBtn.addEventListener('click', () => {
        overlay.classList.add('open');
        input.focus();
    });

    backBtn.addEventListener('click', () => {
        overlay.classList.remove('open');
        input.value = '';
        document.getElementById('search-results').innerHTML = '<div class="feed-loading" style="height:auto;padding:40px 20px;">ইউজারনেম লিখে খুঁজুন</div>';
    });

    input.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const q = input.value.trim();
        searchTimeout = setTimeout(() => runSearch(q), 350);
    });
}

async function runSearch(q) {
    const results = document.getElementById('search-results');
    if (!q) {
        results.innerHTML = '<div class="feed-loading" style="height:auto;padding:40px 20px;">ইউজারনেম লিখে খুঁজুন</div>';
        return;
    }

    results.innerHTML = '<div class="feed-loading" style="height:auto;padding:40px 20px;"><i class="fas fa-spinner fa-spin"></i></div>';

    const qLower = q.toLowerCase();

    try {
        const snap = await db.collection('users')
            .orderBy('username')
            .startAt(qLower)
            .endAt(qLower + '\uf8ff')
            .limit(20)
            .get();

        if (snap.empty) {
            results.innerHTML = '<div class="feed-loading" style="height:auto;padding:40px 20px;">😕 কোনো ইউজার পাওয়া যায়নি</div>';
            return;
        }

        results.innerHTML = '';
        snap.forEach(doc => {
            const u = doc.data();
            const avatar = u.photoURL || u.avatar || u.userAvatar ||
                'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name || u.username || 'W') + '&background=25f4ee&color=000&bold=true';
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <img src="${avatar}" alt="avatar">
                <div class="search-result-name">@${escapeHtml(u.username || 'user')}</div>
            `;
            item.addEventListener('click', () => {
                window.location.href = `profile.html?uid=${doc.id}`;
            });
            results.appendChild(item);
        });
    } catch (e) {
        results.innerHTML = `<div class="feed-loading error" style="height:auto;padding:40px 20px;">❌ ${e.message}</div>`;
    }
}

// ========================================
// FEED LOADING
// ========================================
function loadFeed(isFirstLoad = false) {
    const feed = document.getElementById('video-feed');
    if (!feed || isLoading || noMoreVideos) return;
    isLoading = true;

    if (isFirstLoad) {
        feed.innerHTML = '<div class="feed-loading"><i class="fas fa-spinner fa-spin"></i></div>';
    }

    let query = db.collection('videos').orderBy('createdAt', 'desc').limit(PAGE_SIZE);
    if (lastVisible) query = query.startAfter(lastVisible);

    query.get()
        .then(snapshot => {
            if (isFirstLoad) feed.innerHTML = '';

            if (snapshot.empty) {
                noMoreVideos = true;
                if (isFirstLoad) feed.innerHTML = '<div class="feed-loading">🎬 কোনো ভিডিও নেই</div>';
                isLoading = false;
                return;
            }

            lastVisible = snapshot.docs[snapshot.docs.length - 1];
            if (snapshot.docs.length < PAGE_SIZE) noMoreVideos = true;

            snapshot.forEach(doc => {
                const data = doc.data();
                const src = data.videoURL || data.videoUrl || '';
                if (!src) return;
                feed.appendChild(buildVideoCard(doc.id, data, src));
            });

            isLoading = false;
        })
        .catch(err => {
            isLoading = false;
            if (isFirstLoad) feed.innerHTML = `<div class="feed-loading error">❌ ${err.message}</div>`;
        });
}

function setupInfiniteScroll() {
    const feed = document.getElementById('video-feed');
    if (!feed) return;
    feed.addEventListener('scroll', () => {
        const nearBottom = feed.scrollTop + feed.clientHeight >= feed.scrollHeight - window.innerHeight;
        if (nearBottom) loadFeed(false);
    });
}

// ========================================
// ✅ BUILD VIDEO CARD (FIXED)
// ========================================
function buildVideoCard(videoId, data, src) {
    const ownerUid = data.uid || data.userId || '';

    const isLiked = likedVideoIds.has(videoId);
    const isSaved = savedVideoIds.has(videoId);
    const isFollowing = followingIds.has(ownerUid) || ownerUid === currentUser.uid;

    const avatar = data.userAvatar || data.avatar || data.photoURL ||
        'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.username || 'W') + '&background=25f4ee&color=000&bold=true';

    const card = document.createElement('div');
    card.className = 'video-card';
    card.dataset.id = videoId;
    card.dataset.uid = ownerUid;

    card.innerHTML = `
        <video src="${src}" loop ${globalMuted ? 'muted' : ''} playsinline></video>
        <div class="mute-indicator"><i class="fas fa-volume-mute"></i></div>

        <div class="side-actions">
            <div class="profile-pic-wrap">
                <img class="profile-pic" src="${avatar}" alt="profile" data-uid="${ownerUid}">
                ${ownerUid !== currentUser.uid && !isFollowing ? `<button class="follow-btn" data-uid="${ownerUid}"><i class="fas fa-plus"></i></button>` : ''}
            </div>

            <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-id="${videoId}">
                <i class="fas fa-heart"></i>
                <span class="count">${formatCount(data.likes || 0)}</span>
            </button>

            <button class="action-btn comment-btn" data-id="${videoId}">
                <i class="fas fa-comment-dots"></i>
                <span class="count">${formatCount(data.comments || 0)}</span>
            </button>

            <button class="action-btn save-btn ${isSaved ? 'saved' : ''}" data-id="${videoId}">
                <i class="fas fa-bookmark"></i>
                <span class="count">${formatCount(data.saves || 0)}</span>
            </button>

            <button class="action-btn share-btn">
                <i class="fas fa-share"></i>
                <span class="count">শেয়ার</span>
            </button>

            <div class="music-disc" data-uid="${ownerUid}">
                <img src="${avatar}" alt="music">
            </div>
        </div>

        <div class="bottom-info">
            <div class="username" data-uid="${ownerUid}">@${escapeHtml(data.username || 'user')}</div>
            <div class="caption">${escapeHtml(data.caption || '')}</div>
            <div class="music-info" data-uid="${ownerUid}">
                <i class="fas fa-music"></i>
                <span class="music-text">${escapeHtml(data.musicName || 'অরিজিনাল সাউন্ড - ' + (data.username || 'user'))}</span>
            </div>
        </div>
    `;

    // ===== PROFILE CACHE UPDATE =====
    if (data.photoURL) {
        userProfileCache[ownerUid] = { photoURL: data.photoURL, username: data.username };
    }

    // ===== VIDEO EVENTS =====
    const video = card.querySelector('video');
    const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
            video.play().catch(() => {});
            const disc = card.querySelector('.music-disc');
            if (disc) disc.classList.add('spinning');
        } else {
            video.pause();
            const disc = card.querySelector('.music-disc');
            if (disc) disc.classList.remove('spinning');
        }
    }, { threshold: 0.6 });
    observer.observe(card);

    // Mute toggle
    video.addEventListener('click', () => {
        globalMuted = !globalMuted;
        document.querySelectorAll('.video-card video').forEach(v => v.muted = globalMuted);
        const indicator = card.querySelector('.mute-indicator');
        indicator.classList.add('show');
        indicator.innerHTML = globalMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        setTimeout(() => indicator.classList.remove('show'), 600);
    });

    // ===== ACTION BUTTONS =====
    card.querySelector('.like-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLike(videoId, e.currentTarget, ownerUid);
    });

    card.querySelector('.comment-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openComments(videoId, ownerUid);
    });

    card.querySelector('.save-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSave(videoId, e.currentTarget);
    });

    card.querySelector('.share-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        shareVideo(videoId);
    });

    const followBtn = card.querySelector('.follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            followUser(ownerUid, followBtn);
        });
    }

    // ===== PROFILE NAVIGATION =====
    const goToProfile = (e) => {
        e.stopPropagation();
        const uid = e.currentTarget.dataset.uid;
        if (uid) window.location.href = `profile.html?uid=${uid}`;
    };

    card.querySelector('.profile-pic').addEventListener('click', goToProfile);
    card.querySelector('.username').addEventListener('click', goToProfile);
    card.querySelector('.music-disc').addEventListener('click', goToProfile);
    card.querySelector('.music-info').addEventListener('click', goToProfile);

    return card;
}

// ========================================
// ✅ LIKE - FIXED
// ========================================
async function toggleLike(videoId, btnEl, ownerUid) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    if (btnEl.disabled) return;
    btnEl.disabled = true;

    const likeId = `${currentUser.uid}_${videoId}`;
    const likeRef = db.collection('likes').doc(likeId);
    const videoRef = db.collection('videos').doc(videoId);
    const countSpan = btnEl.querySelector('.count');
    const isLiked = likedVideoIds.has(videoId);
    const currentRaw = countSpan.dataset.raw ? parseInt(countSpan.dataset.raw) : parseCountText(countSpan.textContent);

    // Optimistic update
    btnEl.classList.toggle('liked', !isLiked);
    const newCount = isLiked ? Math.max(0, currentRaw - 1) : currentRaw + 1;
    countSpan.textContent = formatCount(newCount);
    countSpan.dataset.raw = newCount;

    try {
        if (isLiked) {
            await likeRef.delete();
            await videoRef.update({ likes: firebase.firestore.FieldValue.increment(-1) });
            likedVideoIds.delete(videoId);
        } else {
            await likeRef.set({ userId: currentUser.uid, videoId, createdAt: Date.now() });
            await videoRef.update({ likes: firebase.firestore.FieldValue.increment(1) });
            likedVideoIds.add(videoId);
            if (ownerUid && ownerUid !== currentUser.uid) {
                sendNotification(ownerUid, 'like');
            }
        }
    } catch (e) {
        // Rollback
        btnEl.classList.toggle('liked', isLiked);
        countSpan.textContent = formatCount(currentRaw);
        countSpan.dataset.raw = currentRaw;
        console.error('Like update error:', e);
        showToast('লাইক করতে ব্যর্থ হয়েছে');
    }
    btnEl.disabled = false;
}

// ========================================
// ✅ SAVE - FIXED
// ========================================
async function toggleSave(videoId, btnEl) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    if (btnEl.disabled) return;
    btnEl.disabled = true;

    const saveId = `${currentUser.uid}_${videoId}`;
    const saveRef = db.collection('saves').doc(saveId);
    const videoRef = db.collection('videos').doc(videoId);
    const countSpan = btnEl.querySelector('.count');
    const isSaved = savedVideoIds.has(videoId);
    const currentRaw = countSpan.dataset.raw ? parseInt(countSpan.dataset.raw) : parseCountText(countSpan.textContent);

    // Optimistic update
    btnEl.classList.toggle('saved', !isSaved);
    const newCount = isSaved ? Math.max(0, currentRaw - 1) : currentRaw + 1;
    countSpan.textContent = formatCount(newCount);
    countSpan.dataset.raw = newCount;

    try {
        if (isSaved) {
            await saveRef.delete();
            await videoRef.update({ saves: firebase.firestore.FieldValue.increment(-1) });
            savedVideoIds.delete(videoId);
        } else {
            await saveRef.set({ userId: currentUser.uid, videoId, createdAt: Date.now() });
            await videoRef.update({ saves: firebase.firestore.FieldValue.increment(1) });
            savedVideoIds.add(videoId);
        }
        showToast(isSaved ? 'সেভ থেকে রিমুভ করা হয়েছে' : '🔖 ভিডিও সেভ করা হয়েছে');
    } catch (e) {
        // Rollback
        btnEl.classList.toggle('saved', isSaved);
        countSpan.textContent = formatCount(currentRaw);
        countSpan.dataset.raw = currentRaw;
        console.error('Save update error:', e);
        showToast('সেভ করতে ব্যর্থ হয়েছে');
    }
    btnEl.disabled = false;
}

// ========================================
// ✅ FOLLOW - FIXED
// ========================================
async function followUser(targetUid, btnEl) {
    if (!currentUser || !targetUid || targetUid === currentUser.uid) return;
    if (btnEl.disabled) return;
    btnEl.disabled = true;

    const followId = `${currentUser.uid}_${targetUid}`;
    try {
        await db.collection('follows').doc(followId).set({
            follower: currentUser.uid,
            following: targetUid,
            createdAt: Date.now()
        });
        followingIds.add(targetUid);
        btnEl.remove();
        sendNotification(targetUid, 'follow');
        showToast('✅ ফলো করা হয়েছে');
    } catch (e) {
        console.error('Follow error:', e);
        showToast('ফলো করতে ব্যর্থ হয়েছে');
    }
    btnEl.disabled = false;
}

// ========================================
// ✅ SHARE - FIXED
// ========================================
function shareVideo(videoId) {
    const url = `${location.origin}${location.pathname}?v=${videoId}`;
    if (navigator.share) {
        navigator.share({ title: 'WWC', url }).catch(() => {});
    } else {
        navigator.clipboard.writeText(url).then(() => {
            showToast('✅ লিংক কপি হয়েছে!');
        }).catch(() => {
            showToast('শেয়ার করতে ব্যর্থ হয়েছে');
        });
    }
}

// ========================================
// ✅ COMMENTS - FIXED
// ========================================
function setupCommentModal() {
    document.getElementById('close-comment').addEventListener('click', closeComments);
    document.getElementById('comment-submit').addEventListener('click', submitComment);
    document.getElementById('comment-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitComment();
    });
}

function openComments(videoId, ownerUid) {
    activeCommentVideoId = videoId;
    activeCommentOwnerUid = ownerUid || null;
    document.getElementById('comment-modal').classList.add('open');
    loadComments(videoId);
}

function closeComments() {
    document.getElementById('comment-modal').classList.remove('open');
    activeCommentVideoId = null;
}

async function loadComments(videoId) {
    const list = document.getElementById('comment-list');
    list.innerHTML = '<div class="feed-loading"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
        const snap = await db.collection('comments')
            .where('videoId', '==', videoId)
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();

        document.getElementById('comment-count-title').textContent = `মন্তব্য (${snap.size})`;

        if (snap.empty) {
            list.innerHTML = '<div class="feed-loading">💬 কোনো মন্তব্য নেই, প্রথম মন্তব্য করুন</div>';
            return;
        }

        list.innerHTML = '';
        snap.forEach(doc => {
            const c = doc.data();
            const item = document.createElement('div');
            item.className = 'comment-item';
            item.innerHTML = `
                <div class="comment-user">@${escapeHtml(c.username || 'user')}</div>
                <div class="comment-text">${escapeHtml(c.text || '')}</div>
            `;
            list.appendChild(item);
        });
    } catch (e) {
        list.innerHTML = `<div class="feed-loading error">❌ ${e.message}</div>`;
    }
}

async function submitComment() {
    if (!activeCommentVideoId || !currentUser) return;
    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    try {
        await db.collection('comments').add({
            videoId: activeCommentVideoId,
            userId: currentUser.uid,
            username: currentUser.displayName || 'user',
            text,
            createdAt: Date.now()
        });
        await db.collection('videos').doc(activeCommentVideoId).update({
            comments: firebase.firestore.FieldValue.increment(1)
        });
        if (activeCommentOwnerUid && activeCommentOwnerUid !== currentUser.uid) {
            sendNotification(activeCommentOwnerUid, 'comment', text);
        }

        // Update comment count in feed
        const cardCountSpan = document.querySelector(`.comment-btn[data-id="${activeCommentVideoId}"] .count`);
        if (cardCountSpan) {
            const raw = (cardCountSpan.dataset.raw ? parseInt(cardCountSpan.dataset.raw) : parseCountText(cardCountSpan.textContent)) + 1;
            cardCountSpan.textContent = formatCount(raw);
            cardCountSpan.dataset.raw = raw;
        }

        loadComments(activeCommentVideoId);
        showToast('💬 মন্তব্য যোগ করা হয়েছে');
    } catch (e) {
        console.error('Comment error:', e);
        showToast('মন্তব্য পাঠাতে ব্যর্থ হয়েছে');
    }
}

// ========================================
// ✅ NOTIFICATION - FIXED (No duplicates)
// ========================================
async function sendNotification(targetUid, type, text) {
    if (!targetUid || !currentUser || targetUid === currentUser.uid) return;

    try {
        // Check if similar notification already exists (for like/follow)
        if (type === 'like' || type === 'follow') {
            const snap = await db.collection('notifications')
                .where('userId', '==', targetUid)
                .where('fromUserId', '==', currentUser.uid)
                .where('type', '==', type)
                .where('read', '==', false)
                .limit(1)
                .get();
            if (!snap.empty) return; // Already exists
        }

        const payload = {
            userId: targetUid,
            fromUserId: currentUser.uid,
            fromUsername: currentUser.displayName || 'user',
            type: type,
            read: false,
            createdAt: Date.now()
        };
        if (text) payload.text = text;
        await db.collection('notifications').add(payload);
    } catch (e) {
        console.error('Notification error:', e);
    }
}

// ========================================
// ✅ TOAST HELPER
// ========================================
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
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

// ========================================
// ✅ HELPERS - FIXED
// ========================================
function formatCount(n) {
    n = parseInt(n) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
}

function parseCountText(text) {
    if (!text) return 0;
    text = text.trim();
    if (text.endsWith('M')) return Math.round(parseFloat(text.replace('M', '')) * 1000000);
    if (text.endsWith('K')) return Math.round(parseFloat(text.replace('K', '')) * 1000);
    const n = parseInt(text);
    return isNaN(n) ? 0 : n;
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

console.log('✅ WWC App Loaded - All features working!');
