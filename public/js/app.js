// ========================================
// WWC (World Wide Connect) - টিকটক-স্টাইল ফিড (সব বাটন কার্যকরী + বাগ ফিক্সড)
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
let searchTimeout = null;
const userProfileCache = {}; // userId -> {username, photoURL} | null

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
    await Promise.all([loadMyLikes(), loadMySaves(), loadMyFollowing()]);
    loadFeed(true);
    setupInfiniteScroll();
    setupCommentModal();
    setupTopTabs();
    setupSearch();
}

// ===== প্রাথমিক ডাটা লোড =====
async function loadMyLikes() {
    try {
        const snap = await db.collection('likes').where('userId', '==', currentUser.uid).get();
        snap.forEach(doc => likedVideoIds.add(doc.data().videoId));
    } catch (e) { console.error('লাইক লোড সমস্যা:', e); }
}

async function loadMySaves() {
    try {
        const snap = await db.collection('saves').where('userId', '==', currentUser.uid).get();
        snap.forEach(doc => savedVideoIds.add(doc.data().videoId));
    } catch (e) { console.error('সেভ লোড সমস্যা:', e); }
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

// ===== ইউজারের আসল প্রোফাইল ছবি/নাম লোড (users কালেকশন থেকে, ক্যাশসহ) =====
function applyRealProfile(card, userId) {
    if (!userId) return;

    const apply = (profile) => {
        if (!profile) return;
        if (profile.photoURL) {
            card.querySelectorAll('.profile-pic, .music-disc img').forEach(img => img.src = profile.photoURL);
        }
    };

    if (userProfileCache[userId] !== undefined) {
        apply(userProfileCache[userId]);
        return;
    }

    db.collection('users').doc(userId).get()
        .then(doc => {
            const profile = doc.exists ? doc.data() : null;
            userProfileCache[userId] = profile;
            apply(profile);
        })
        .catch(() => { userProfileCache[userId] = null; });
}

// ===== সার্চ =====
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

    // ইউজারনেম সবসময় ছোট হাতের অক্ষরে সেভ করা হয়, তাই সার্চ কোয়েরিও lowercase করা হচ্ছে
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
                window.location.href = `public/js/profile.html?uid=${doc.id}`;
            });
            results.appendChild(item);
        });
    } catch (e) {
        results.innerHTML = `<div class="feed-loading error" style="height:auto;padding:40px 20px;">❌ ${e.message}</div>`;
    }
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

// ===== একটা ভিডিও কার্ড তৈরি (হুবহু TikTok লেআউট, সব বাটন কার্যকরী) =====
function buildVideoCard(videoId, data, src) {
    const isLiked = likedVideoIds.has(videoId);
    const isSaved = savedVideoIds.has(videoId);
    const isFollowing = followingIds.has(data.userId) || data.userId === currentUser.uid;

    const hasOwnAvatar = !!(data.userAvatar || data.avatar || data.photoURL);
    const avatar = data.userAvatar || data.avatar || data.photoURL ||
        'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.username || 'W') + '&background=25f4ee&color=000&bold=true';

    const card = document.createElement('div');
    card.className = 'video-card';
    card.dataset.id = videoId;
    card.dataset.userId = data.userId || '';

    card.innerHTML = `
        <video src="${src}" loop ${globalMuted ? 'muted' : ''} playsinline></video>
        <div class="mute-indicator"><i class="fas fa-volume-mute"></i></div>

        <div class="side-actions">
            <div class="profile-pic-wrap">
                <img class="profile-pic" src="${avatar}" alt="profile" data-uid="${data.userId || ''}">
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

            <button class="action-btn save-btn ${isSaved ? 'saved' : ''}" data-id="${videoId}">
                <i class="fas fa-bookmark"></i>
                <span class="count">${formatCount(data.saveCount || 0)}</span>
            </button>

            <button class="action-btn share-btn">
                <i class="fas fa-share"></i>
                <span class="count">শেয়ার</span>
            </button>

            <div class="music-disc" data-uid="${data.userId || ''}">
                <img src="${avatar}" alt="music">
            </div>
        </div>

        <div class="bottom-info">
            <div class="username" data-uid="${data.userId || ''}">@${escapeHtml(data.username || 'user')}</div>
            <div class="caption">${escapeHtml(data.caption || '')}</div>
            <div class="music-info" data-uid="${data.userId || ''}">
                <i class="fas fa-music"></i>
                <span class="music-text">${escapeHtml(data.musicName || 'অরিজিনাল সাউন্ড - ' + (data.username || 'user'))}</span>
            </div>
        </div>
    `;

    // ভিডিও ডকুমেন্টে নিজস্ব অ্যাভাটার না থাকলে, users কালেকশন থেকে আসল প্রোফাইল ছবি টেনে বসানো
    if (!hasOwnAvatar) {
        applyRealProfile(card, data.userId);
    }

    // অটোপ্লে / পজ
    const video = card.querySelector('video');
    const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
    }, { threshold: 0.6 });
    observer.observe(card);

    // ট্যাপ করলে মিউট টগল
    video.addEventListener('click', () => {
        globalMuted = !globalMuted;
        document.querySelectorAll('.video-card video').forEach(v => v.muted = globalMuted);
        const indicator = card.querySelector('.mute-indicator');
        indicator.classList.add('show');
        indicator.innerHTML = globalMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        setTimeout(() => indicator.classList.remove('show'), 600);
    });

    // মিউজিক ডিস্ক ঘুরবে শুধু প্লে অবস্থায়
    video.addEventListener('play', () => card.querySelector('.music-disc').classList.add('spinning'));
    video.addEventListener('pause', () => card.querySelector('.music-disc').classList.remove('spinning'));

    // লাইক
    card.querySelector('.like-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLike(videoId, e.currentTarget);
    });

    // কমেন্ট
    card.querySelector('.comment-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openComments(videoId);
    });

    // সেভ
    card.querySelector('.save-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSave(videoId, e.currentTarget);
    });

    // শেয়ার
    card.querySelector('.share-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        shareVideo(videoId);
    });

    // ফলো
    const followBtn = card.querySelector('.follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            followUser(data.userId, followBtn);
        });
    }

    // প্রোফাইলে যাওয়া (প্রোফাইল ছবি, ইউজারনেম, মিউজিক ডিস্ক — সবগুলোতে ক্লিক করলে)
    const goToProfile = (e) => {
        e.stopPropagation();
        const uid = e.currentTarget.dataset.uid;
        if (uid) window.location.href = `public/js/profile.html?uid=${uid}`;
    };
    card.querySelector('.profile-pic').addEventListener('click', goToProfile);
    card.querySelector('.username').addEventListener('click', goToProfile);
    card.querySelector('.music-disc').addEventListener('click', goToProfile);
    card.querySelector('.music-info').addEventListener('click', goToProfile);

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
    const currentRaw = countSpan.dataset.raw ? parseInt(countSpan.dataset.raw) : parseCountText(countSpan.textContent);

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

// ===== সেভ টগল =====
async function toggleSave(videoId, btnEl) {
    if (!currentUser) return alert('লগইন করুন');

    const saveId = `${currentUser.uid}_${videoId}`;
    const saveRef = db.collection('saves').doc(saveId);
    const videoRef = db.collection('videos').doc(videoId);
    const countSpan = btnEl.querySelector('.count');
    const isSaved = savedVideoIds.has(videoId);
    const currentRaw = countSpan.dataset.raw ? parseInt(countSpan.dataset.raw) : parseCountText(countSpan.textContent);

    btnEl.classList.toggle('saved', !isSaved);
    const newCount = isSaved ? Math.max(0, currentRaw - 1) : currentRaw + 1;
    countSpan.textContent = formatCount(newCount);
    countSpan.dataset.raw = newCount;

    try {
        if (isSaved) {
            await saveRef.delete();
            await videoRef.update({ saveCount: firebase.firestore.FieldValue.increment(-1) });
            savedVideoIds.delete(videoId);
        } else {
            await saveRef.set({ userId: currentUser.uid, videoId, createdAt: Date.now() });
            await videoRef.update({ saveCount: firebase.firestore.FieldValue.increment(1) });
            savedVideoIds.add(videoId);
        }
    } catch (e) {
        btnEl.classList.toggle('saved', isSaved);
        countSpan.textContent = formatCount(currentRaw);
        console.error('সেভ আপডেট সমস্যা:', e);
    }
}

// ===== ফলো (users ডকুমেন্টের followers/following কাউন্টও আপডেট হয়) =====
async function followUser(targetUid, btnEl) {
    if (!currentUser || !targetUid || targetUid === currentUser.uid) return;
    const followId = `${currentUser.uid}_${targetUid}`;
    try {
        await db.collection('follows').doc(followId).set({
            followerId: currentUser.uid,
            followingId: targetUid,
            createdAt: Date.now()
        });
        await db.collection('users').doc(targetUid).update({
            followers: firebase.firestore.FieldValue.increment(1)
        });
        await db.collection('users').doc(currentUser.uid).update({
            following: firebase.firestore.FieldValue.increment(1)
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
            const raw = (cardCountSpan.dataset.raw ? parseInt(cardCountSpan.dataset.raw) : parseCountText(cardCountSpan.textContent)) + 1;
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

function parseCountText(text) {
    if (!text) return 0;
    text = text.trim();
    if (text.endsWith('M')) return Math.round(parseFloat(text) * 1000000);
    if (text.endsWith('K')) return Math.round(parseFloat(text) * 1000);
    const n = parseInt(text);
    return isNaN(n) ? 0 : n;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
