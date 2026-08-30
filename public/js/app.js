// ========================================
// WWC - FINAL FIXED APP (Like + Comment Count Fixed + Search Improved)
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
let allUsersCache = null;
let searchDebounce = null;

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

async function loadVideos() {
    try {
        const snapshot = await db.collection('videos').orderBy('createdAt', 'desc').limit(50).get();
        allVideos = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.uid) data.uid = data.userId || '';
            allVideos.push({ id: doc.id, ...data });
        });
        if (allVideos.length === 0) {
            if (feed) feed.innerHTML = '<div class="feed-loading">কোনো ভিডিও নেই</div>';
            return;
        }
        renderFeed();
    } catch (e) {
        console.error(e);
        if (feed) feed.innerHTML = '<div class="feed-loading error">ভিডিও লোড হয়নি</div>';
    }
}

function renderFeed() {
    if (!feed) return;
    let videos = allVideos;
    if (currentFeed === 'following') {
        videos = allVideos.filter(v => followingUsers.has(v.uid));
    }
    if (!videos.length) {
        feed.innerHTML = '<div class="feed-loading">আপনি কাউকে Follow করেননি</div>';
        return;
    }
    feed.innerHTML = '';
    videos.forEach(video => feed.appendChild(createVideoCard(video)));
    setupVideoObserver();
}

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
    const uid = video.uid || '';

    let followBtnHtml = '';
    if (uid && uid !== currentUser?.uid) {
        followBtnHtml = '<button class="follow-btn ' + (isFollowing ? 'following' : '') + '" data-uid="' + uid + '">' + (isFollowing ? '✓' : '+') + '</button>';
    }

    card.innerHTML =
        '<video src="' + videoUrl + '" loop muted playsinline preload="metadata"></video>' +
        '<div class="mute-indicator"><i class="fas fa-volume-mute"></i></div>' +
        '<div class="side-actions">' +
            '<div class="profile-pic-wrap">' +
                '<img class="profile-pic" src="' + (photoUrl || './images/profile.png') + '" onerror="this.src=\'./images/profile.png\'" data-uid="' + uid + '">' +
                followBtnHtml +
            '</div>' +
            '<button class="action-btn like-btn ' + (isLiked ? 'liked' : '') + '" data-video-id="' + video.id + '">' +
                '<i class="fas fa-heart"></i><span class="count">' + formatNumber(video.likes || 0) + '</span>' +
            '</button>' +
            '<button class="action-btn comment-btn" data-video-id="' + video.id + '">' +
                '<i class="fas fa-comment"></i><span class="count">' + formatNumber(video.comments || 0) + '</span>' +
            '</button>' +
            '<button class="action-btn save-btn ' + (isSaved ? 'saved' : '') + '" data-video-id="' + video.id + '">' +
                '<i class="fas fa-bookmark"></i><span class="count">' + formatNumber(video.saves || 0) + '</span>' +
            '</button>' +
            '<button class="action-btn share-btn" data-video-id="' + video.id + '">' +
                '<i class="fas fa-share"></i><span>শেয়ার</span>' +
            '</button>' +
            '<div class="music-disc" data-uid="' + uid + '"><i class="fas fa-music"></i></div>' +
        '</div>' +
        '<div class="bottom-info">' +
            '<span class="username" data-uid="' + uid + '">@' + username + '</span>' +
            '<div class="caption">' + caption + '</div>' +
            '<div class="music-info" data-uid="' + uid + '"><i class="fas fa-music"></i><span class="music-text">' + sound + '</span></div>' +
        '</div>';

    const videoEl = card.querySelector('video');
    const muteIndicator = card.querySelector('.mute-indicator');

    videoEl.addEventListener('click', function (e) {
        e.stopPropagation();
        videoEl.muted = !videoEl.muted;
        muteIndicator.classList.add('show');
        muteIndicator.innerHTML = videoEl.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        setTimeout(function () { muteIndicator.classList.remove('show'); }, 800);
    });

    videoEl.addEventListener('dblclick', function (e) {
        e.preventDefault();
        var likeBtn = card.querySelector('.like-btn');
        if (likeBtn) toggleLike(likeBtn);
    });

    card.querySelectorAll('[data-uid]').forEach(function (el) {
        el.addEventListener('click', function (e) {
            e.stopPropagation();
            var id = el.getAttribute('data-uid');
            if (id) goToProfile(id);
        });
    });

    var likeBtn = card.querySelector('.like-btn');
    if (likeBtn) likeBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleLike(likeBtn); });

    var commentBtn = card.querySelector('.comment-btn');
    if (commentBtn) commentBtn.addEventListener('click', function (e) { e.stopPropagation(); openComment(commentBtn.dataset.videoId); });

    var saveBtn = card.querySelector('.save-btn');
    if (saveBtn) saveBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleSave(saveBtn); });

    var shareBtn = card.querySelector('.share-btn');
    if (shareBtn) shareBtn.addEventListener('click', function (e) { e.stopPropagation(); shareVideo(shareBtn.dataset.videoId); });

    var followBtn = card.querySelector('.follow-btn');
    if (followBtn) followBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleFollow(followBtn); });

    return card;
}

async function toggleLike(btn) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    if (btn.disabled) return;
    btn.disabled = true;

    var videoId = btn.dataset.videoId;
    var countSpan = btn.querySelector('.count');
    var isLiked = btn.classList.contains('liked');
    var currentCount = parseInt((countSpan.textContent || '0').replace(/[^\d]/g, '')) || 0;

    btn.classList.toggle('liked', !isLiked);
    countSpan.textContent = formatNumber(isLiked ? Math.max(0, currentCount - 1) : currentCount + 1);

    try {
        var videoRef = db.collection('videos').doc(videoId);
        var likeRef = db.collection('likes').doc(currentUser.uid + '_' + videoId);

        if (isLiked) {
            await likeRef.delete();
            await videoRef.update({ likes: firebase.firestore.FieldValue.increment(-1) });
            likedVideos.delete(videoId);
        } else {
            await likeRef.set({ userId: currentUser.uid, videoId: videoId, createdAt: Date.now() });
            await videoRef.update({ likes: firebase.firestore.FieldValue.increment(1) });
            likedVideos.add(videoId);

            try {
                var videoDoc = await videoRef.get();
                if (videoDoc.exists) {
                    var v = videoDoc.data();
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
        btn.classList.toggle('liked', isLiked);
        countSpan.textContent = formatNumber(currentCount);
        console.error('Like error:', e);
        showToast('লাইক সেভ হয়নি');
    }
    btn.disabled = false;
}

async function toggleSave(btn) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    if (btn.disabled) return;
    btn.disabled = true;

    var videoId = btn.dataset.videoId;
    var countSpan = btn.querySelector('.count');
    var isSaved = btn.classList.contains('saved');
    var currentCount = parseInt((countSpan.textContent || '0').replace(/[^\d]/g, '')) || 0;

    btn.classList.toggle('saved', !isSaved);
    countSpan.textContent = formatNumber(isSaved ? Math.max(0, currentCount - 1) : currentCount + 1);

    try {
        var videoRef = db.collection('videos').doc(videoId);
        var saveRef = db.collection('saves').doc(currentUser.uid + '_' + videoId);

        if (isSaved) {
            await saveRef.delete();
            await videoRef.update({ saves: firebase.firestore.FieldValue.increment(-1) });
            savedVideos.delete(videoId);
        } else {
            await saveRef.set({ userId: currentUser.uid, videoId: videoId, createdAt: Date.now() });
            await videoRef.update({ saves: firebase.firestore.FieldValue.increment(1) });
            savedVideos.add(videoId);
            showToast('সেভ করা হয়েছে');
        }
    } catch (e) {
        btn.classList.toggle('saved', isSaved);
        countSpan.textContent = formatNumber(currentCount);
        showToast('সেভ হয়নি');
    }
    btn.disabled = false;
}

async function toggleFollow(btn) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    if (btn.disabled) return;

    var targetUid = btn.dataset.uid;
    if (!targetUid || targetUid === currentUser.uid) return;
    btn.disabled = true;

    var isFollowing = btn.classList.contains('following');

    try {
        var followRef = db.collection('follows').doc(currentUser.uid + '_' + targetUid);

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
            showToast('ফলো করা হয়েছে');

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
        showToast('ফলো ব্যর্থ');
    }
    btn.disabled = false;
}

function openComment(videoId) {
    if (!currentUser) { showToast('লগইন করুন'); return; }
    currentVideoId = videoId;
    if (commentModal) commentModal.classList.add('open');
    loadComments(videoId);
}

if (closeComment) {
    closeComment.addEventListener('click', function () {
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
            div.innerHTML =
                '<div class="comment-user">@' + escapeHtml(data.username || 'WWC User') + '</div>' +
                '<div class="comment-text">' + escapeHtml(data.text || '') + '</div>';
            commentList.appendChild(div);
        });
    } catch (e) {
        commentList.innerHTML = '<div style="text-align:center;color:#f44336;padding:20px;">মন্তব্য লোড হয়নি</div>';
    }
}

if (commentSubmit) {
    commentSubmit.addEventListener('click', submitComment);
}
if (commentInput) {
    commentInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') submitComment();
    });
}

async function submitComment() {
    if (!currentUser || !currentVideoId || !commentInput) return;
    var text = commentInput.value.trim();
    if (!text) return;
    var username = (currentUserData && currentUserData.username) || currentUser.displayName || 'user';

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

        // ✅ সাইডের কমেন্ট কাউন্ট আপডেট
        var commentBtn = document.querySelector('.comment-btn[data-video-id="' + currentVideoId + '"]');
        if (commentBtn) {
            var countSpan = commentBtn.querySelector('.count');
            if (countSpan) {
                var current = parseInt((countSpan.textContent || '0').replace(/[^\d]/g, '')) || 0;
                countSpan.textContent = formatNumber(current + 1);
            }
        }

        // allVideos আপডেট
        var video = allVideos.find(function (v) { return v.id === currentVideoId; });
        if (video) video.comments = (video.comments || 0) + 1;

        showToast('মন্তব্য যোগ হয়েছে');

        try {
            var videoDoc = await db.collection('videos').doc(currentVideoId).get();
            if (videoDoc.exists) {
                var v = videoDoc.data();
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

async function shareVideo(videoId) {
    var url = window.location.origin + window.location.pathname + '?video=' + videoId;
    try {
        if (navigator.share) {
            await navigator.share({ title: 'WWC', text: 'এই ভিডিও দেখুন!', url: url });
        } else {
            await navigator.clipboard.writeText(url);
            showToast('লিংক কপি হয়েছে');
        }
    } catch (e) {
        if (e.name !== 'AbortError') showToast('শেয়ার ব্যর্থ');
    }
}

// ===== সার্চ (ইউজার + ভিডিও দুটোতেই খুঁজবে) =====
if (searchBtn) {
    searchBtn.addEventListener('click', function () {
        if (searchOverlay) searchOverlay.classList.add('open');
        if (searchInput) searchInput.focus();
    });
}
if (searchBack) {
    searchBack.addEventListener('click', function () {
        if (searchOverlay) searchOverlay.classList.remove('open');
        if (searchInput) searchInput.value = '';
    });
}

async function fetchAllUsersForSearch() {
    if (allUsersCache) return allUsersCache;
    try {
        const snap = await db.collection('users').limit(300).get();
        allUsersCache = [];
        snap.forEach(function (doc) {
            allUsersCache.push({ uid: doc.id, ...doc.data() });
        });
    } catch (e) {
        console.error('ইউজার লিস্ট লোড সমস্যা:', e);
        allUsersCache = [];
    }
    return allUsersCache;
}

async function runUserSearch(query) {
    if (!searchResults) return;
    if (!query) {
        searchResults.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">খুঁজতে কিছু লিখুন</div>';
        return;
    }

    searchResults.innerHTML = '<div style="text-align:center;color:#666;padding:20px;"><i class="fas fa-spinner fa-spin"></i></div>';

    const q = query.toLowerCase();

    // ===== ইউজার খোঁজা (username, name/displayName, email দিয়ে) =====
    const users = await fetchAllUsersForSearch();
    const matchedUsers = users.filter(function (u) {
        const uname = (u.username || '').toLowerCase();
        const name = (u.name || u.displayName || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return uname.indexOf(q) !== -1 || name.indexOf(q) !== -1 || email.indexOf(q) !== -1;
    });

    // ===== ভিডিও খোঁজা (ক্যাপশন, সাউন্ড, ইউজারনেম দিয়ে — যা লোড হয়ে আছে তার মধ্যে) =====
    const matchedVideos = allVideos.filter(function (v) {
        const caption = (v.caption || '').toLowerCase();
        const sound = (v.sound || '').toLowerCase();
        const uname = (v.username || '').toLowerCase();
        return caption.indexOf(q) !== -1 || sound.indexOf(q) !== -1 || uname.indexOf(q) !== -1;
    });

    if (!matchedUsers.length && !matchedVideos.length) {
        searchResults.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">😕 কোনো ফলাফল পাওয়া যায়নি</div>';
        return;
    }

    searchResults.innerHTML = '';

    if (matchedUsers.length) {
        var userHeader = document.createElement('div');
        userHeader.style.cssText = 'padding:12px 16px 4px;color:#666;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;';
        userHeader.textContent = 'ইউজার';
        searchResults.appendChild(userHeader);

        matchedUsers.forEach(function (u) {
            var avatar = (u.photoURL && u.photoURL.startsWith('http'))
                ? u.photoURL
                : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name || u.username || 'U') + '&background=25f4ee&color=000&bold=true';

            var div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML =
                '<img src="' + avatar + '" onerror="this.src=\'https://ui-avatars.com/api/?name=U&background=25f4ee&color=000\'">' +
                '<div>' +
                    '<div class="search-result-name">@' + escapeHtml(u.username || 'user') + '</div>' +
                    (u.name ? '<div style="font-size:12px;color:#888;margin-top:2px;">' + escapeHtml(u.name) + '</div>' : '') +
                '</div>';
            div.addEventListener('click', function () {
                goToProfile(u.uid);
            });
            searchResults.appendChild(div);
        });
    }

    if (matchedVideos.length) {
        var videoHeader = document.createElement('div');
        videoHeader.style.cssText = 'padding:16px 16px 4px;color:#666;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;';
        videoHeader.textContent = 'ভিডিও';
        searchResults.appendChild(videoHeader);

        matchedVideos.forEach(function (v) {
            var div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML =
                '<div style="width:42px;height:42px;border-radius:8px;background:#1a1a1a;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-play" style="color:#666;font-size:14px;"></i></div>' +
                '<div style="min-width:0;">' +
                    '<div class="search-result-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(v.caption || 'ক্যাপশন নেই') + '</div>' +
                    '<div style="font-size:12px;color:#888;margin-top:2px;">@' + escapeHtml(v.username || 'user') + '</div>' +
                '</div>';
            div.addEventListener('click', function () {
                goToVideo(v.id);
            });
            searchResults.appendChild(div);
        });
    }
}

function goToVideo(videoId) {
    if (searchOverlay) searchOverlay.classList.remove('open');
    var target = document.querySelector('.video-card[data-video-id="' + videoId + '"]');
    if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else {
        showToast('ভিডিওটা এই মুহূর্তে ফিডে লোড নেই');
    }
}

if (searchInput) {
    searchInput.addEventListener('input', function (e) {
        clearTimeout(searchDebounce);
        var query = e.target.value.trim();
        searchDebounce = setTimeout(function () { runUserSearch(query); }, 300);
    });
}

document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentFeed = btn.dataset.tab === 'following' ? 'following' : 'foryou';
        renderFeed();
    });
});

function setupVideoObserver() {
    var videos = document.querySelectorAll('.video-card video');
    if (!videos.length) return;

    if (videoObserver) videoObserver.disconnect();

    videoObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            var video = entry.target;
            var card = video.closest('.video-card');
            var disc = card ? card.querySelector('.music-disc') : null;

            if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
                document.querySelectorAll('.video-card video').forEach(function (v) {
                    if (v !== video) v.pause();
                });
                video.play().catch(function () {});
                if (disc) disc.classList.add('spinning');
            } else {
                video.pause();
                if (disc) disc.classList.remove('spinning');
            }
        });
    }, { threshold: 0.55 });

    videos.forEach(function (v) { videoObserver.observe(v); });

    setTimeout(function () {
        if (videos[0]) videos[0].play().catch(function () {});
    }, 400);
}

function goToProfile(uid) {
    if (!uid) return;
    window.location.href = 'public/js/profile.html?uid=' + uid;
}

function formatNumber(num) {
    num = Number(num) || 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
}

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(30,30,30,0.95);color:#fff;padding:10px 24px;border-radius:24px;font-size:14px;z-index:999;opacity:0;transition:opacity 0.3s;pointer-events:none;white-space:nowrap;border:1px solid rgba(255,255,255,0.1);';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { toast.style.opacity = '0'; }, 2500);
}

console.log('WWC App Loaded - Fixed');
