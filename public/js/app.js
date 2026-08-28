// ========================================
// WWC (World Wide Connect) - টিকটক-স্টাইল ফিড
// ========================================

let currentUser = null;
let lastVisible = null;
let isLoading = false;
let noMoreVideos = false;
let likedVideoIds = new Set();
let followingIds = new Set();
let globalMuted = true;
let activeCommentVideoId = null;

const PAGE_SIZE = 5;

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'public/js/login.html';
        return;
    }
    currentUser = user;
    initFeed();
});

async function initFeed() {
    await Promise.all([loadMyLikes(), loadMyFollowing()]);
    loadFeed(true);
    setupInfiniteScroll();
    setupCommentModal();
    setupTopTabs();
}

// ===== প্রাথমিক ডাটা লোড =====
async function loadMyLikes() {
    try {
        const snap = await db.collection('likes').where('userId', '==', currentUser.uid).get();
        snap.forEach(doc => likedVideoIds.add(doc.data().videoId));
    } catch (e) { console.error('লাইক লোড সমস্যা:', e); }
}

async function loadMyFollowing() {
    try {
        const snap = await db.collection('follows').where('followerId', '==', currentUser.uid).get();
        snap.forEach(doc => followingIds.add(doc.data().followingId));
    } catch (e) { console.error('ফলো লোড সমস্যা:', e); }
}

function setupTopTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// ===== ফিড লোড (ইনফিনিট স্ক্রল) =====
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

// ===== একটা ভিডিও কার্ড তৈরি (হুবহু TikTok লেআউট) =====
function buildVideoCard(videoId, data, src) {
    const isLiked = likedVideoIds.has(videoId);
    const isFollowing = followingIds.has(data.userId) || data.userId === currentUser.uid;
    const avatar = data.userAvatar || data.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.username || 'W') + '&background=25f4ee&color=000&bold=true';

    const card = document.createElement('div');
    card.className = 'video-card';
    card.dataset.id = videoId;
    card.dataset.userId = data.userId || '';

    card.innerHTML = `
        <video src="${src}" loop ${globalMuted ? 'muted' : ''} playsinline></video>
        <div class="mute-indicator"><i class="fas fa-volume-mute"></i></div>

        <div class="side-actions">
            <div class="profile-pic-wrap">
                <img class="profile-pic" src="${avatar}" alt="profile">
                ${!isFollowing ? `<button class="follow-btn" data-uid="${data.userId || ''}"><i class="fas fa-plus"></i></button>` : ''}
            </div>

            <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-id="${videoId}">
                <i class="fas fa-heart"></i>
                <span class="count">${formatCount(data.likes || 0)}</span>
            </button>

            <button class="action-btn comment-btn" data-id="${videoId}">
                <i class="fas fa-comment-dots"></i>
                <span class="count">${formatCount(data.commentCount || 0)}</span>
            </button>

            <button class="action-btn save-btn">
                <i class="fas fa-bookmark"></i>
                <span class="count">সংরক্ষণ</span>
            </button>

            <button class="action-btn share-btn">
                <i class="fas fa-share"></i>
                <span class="count">শেয়ার</span>
            </button>

            <div class="music-disc">
                <img src="${avatar}" alt="music">
            </div>
        </div>

        <div class="bottom-info">
            <div class="username">@${escapeHtml(data.username || 'user')}</div>
            <div class="caption">${escapeHtml(data.caption || '')}</div>
            <div class="music-info">
                <i class="fas fa-music"></i>
                <span class="music-text">${escapeHtml(data.musicName || 'অরিজিনাল সাউন্ড - ' + (data.username || 'user'))}</span>
            </div>
        </div>
    `;

    const video = card.querySelector('video');
    const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
    }, { threshold: 0.6 });
    observer.observe(card);

    video.addEventListener('click', () => {
        globalMuted = !globalMuted;
        document.querySelectorAll('.video-card video').forEach(v => v.muted = globalMuted);
        const indicator = card.querySelector('.mute-indicator');
        indicator.classList.add('show');
        indicator.innerHTML = globalMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        setTimeout(() => indicator.classList.remove('show'), 600);
    });

    video.addEventListener('play', () => card.querySelector('.music-disc').classList.add('spinning'));
    video.addEventListener('pause', () => card.querySelector('.music-disc').classList.remove('spinning'));

    card.querySelector('.like-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLike(videoId, e.currentTarget);
    });

    card.querySelector('.comment-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openComments(videoId);
    });

    card.querySelector('.share-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        shareVideo(videoId);
    });

    const followBtn = card.querySelector('.follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            followUser(data.userId, followBtn);
        });
    }

    return card;
}

// ===== লাইক টগল =====
async function toggleLike(videoId, btnEl) {
    if (!currentUser) return alert('লগইন করুন');

    const likeId = `${currentUser.uid}_${videoId}`;
    const likeRef = db.collection('likes').doc(likeId);
    const videoRef = db.collection('videos').doc(videoId);
    const countSpan = btnEl.querySelector('.count');
    const isLiked = likedVideoIds.has(videoId);
    const currentRaw = countSpan.dataset.raw ? parseInt(countSpan.dataset.raw) : 0;

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
        }
    } catch (e) {
        btnEl.classList.toggle('liked', isLiked);
        countSpan.textContent = formatCount(currentRaw);
        console.error('লাইক আপডেট সমস্যা:', e);
    }
}

// ===== ফলো =====
async function followUser(targetUid, btnEl) {
    if (!currentUser || !targetUid || targetUid === currentUser.uid) return;
    const followId = `${currentUser.uid}_${targetUid}`;
    try {
        await db.collection('follows').doc(followId).set({
            followerId: currentUser.uid,
            followingId: targetUid,
            createdAt: Date.now()
        });
        followingIds.add(targetUid);
        btnEl.remove();
    } catch (e) {
        console.error('ফলো সমস্যা:', e);
    }
}

// ===== শেয়ার =====
function shareVideo(videoId) {
    const url = `${location.origin}${location.pathname}?v=${videoId}`;
    if (navigator.share) {
        navigator.share({ title: 'WWC', url });
    } else {
        navigator.clipboard.writeText(url).then(() => alert('✅ লিংক কপি হয়েছে!'));
    }
}

// ===== কমেন্ট মোডাল =====
function setupCommentModal() {
    document.getElementById('close-comment').addEventListener('click', closeComments);
    document.getElementById('comment-submit').addEventListener('click', submitComment);
    document.getElementById('comment-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitComment();
    });
}

function openComments(videoId) {
    activeCommentVideoId = videoId;
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
            commentCount: firebase.firestore.FieldValue.increment(1)
        });

        const cardCountSpan = document.querySelector(`.comment-btn[data-id="${activeCommentVideoId}"] .count`);
        if (cardCountSpan) {
            const raw = (cardCountSpan.dataset.raw ? parseInt(cardCountSpan.dataset.raw) : 0) + 1;
            cardCountSpan.textContent = formatCount(raw);
            cardCountSpan.dataset.raw = raw;
        }

        loadComments(activeCommentVideoId);
    } catch (e) {
        alert('মন্তব্য পাঠাতে সমস্যা হয়েছে: ' + e.message);
    }
}

// ===== হেল্পার =====
function formatCount(n) {
    n = parseInt(n) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
    return String(n);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
