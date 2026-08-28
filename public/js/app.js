// ===============================
// WWC - TikTok Style App Logic (v3.1 - Follow Fixed)
// ===============================

let currentVideoId = null;
let currentUser = null;
let currentTab = 'foryou';

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'public/js/login.html';
        return;
    }
    currentUser = user;
    setupTopBar();
    setupSearchUI();
    loadFeed();
});

function setupTopBar() {
    const tabs = document.querySelectorAll('.tab-btn');
    const followingBtn = tabs[0];
    const forYouBtn = tabs[1];
    const searchBtn = document.querySelector('.search-btn');

    if (forYouBtn) {
        forYouBtn.addEventListener('click', () => {
            currentTab = 'foryou';
            tabs.forEach(b => b.classList.remove('active'));
            forYouBtn.classList.add('active');
            loadFeed();
        });
    }
    if (followingBtn) {
        followingBtn.addEventListener('click', () => {
            currentTab = 'following';
            tabs.forEach(b => b.classList.remove('active'));
            followingBtn.classList.add('active');
            loadFeed();
        });
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', () => openSearch());
    }
}

function setupSearchUI() {
    if (!document.getElementById('search-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'search-overlay';
        overlay.className = 'search-overlay';
        overlay.innerHTML = `
            <div class="search-header">
                <button class="search-back" id="search-back"><i class="fas fa-arrow-left"></i></button>
                <div class="search-input-wrap">
                    <i class="fas fa-search"></i>
                    <input type="text" id="search-input" placeholder="সার্চ করুন..." autocomplete="off">
                    <button class="search-clear" id="search-clear" style="display:none"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div class="search-body">
                <div class="search-suggestions">
                    <div class="search-hint">জনপ্রিয় সার্চ</div>
                    <div class="suggestion-item" data-q="trending">🔥 ট্রেন্ডিং</div>
                    <div class="suggestion-item" data-q="funny">😂 ফানি</div>
                    <div class="suggestion-item" data-q="dance">💃 ডান্স</div>
                </div>
                <div id="search-results" class="search-results"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('search-back').addEventListener('click', closeSearch);
        document.getElementById('search-clear').addEventListener('click', () => {
            document.getElementById('search-input').value = '';
            document.getElementById('search-clear').style.display = 'none';
            document.getElementById('search-results').innerHTML = '';
        });

        const input = document.getElementById('search-input');
        input.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            document.getElementById('search-clear').style.display = val ? 'block' : 'none';
            if (val.length >= 2) doSearch(val);
            else document.getElementById('search-results').innerHTML = '';
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = input.value.trim();
                if (val) doSearch(val);
            }
        });
        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                input.value = item.dataset.q;
                document.getElementById('search-clear').style.display = 'block';
                doSearch(item.dataset.q);
            });
        });
    }
}

function openSearch() {
    const overlay = document.getElementById('search-overlay');
    if (overlay) {
        overlay.classList.add('active');
        setTimeout(() => document.getElementById('search-input')?.focus(), 200);
    }
}
function closeSearch() {
    document.getElementById('search-overlay')?.classList.remove('active');
}

function doSearch(query) {
    const results = document.getElementById('search-results');
    if (!results) return;
    results.innerHTML = '<div class="search-loading">সার্চ করা হচ্ছে...</div>';

    db.collection('videos').orderBy('createdAt', 'desc').limit(50).get()
        .then(snap => {
            const q = query.toLowerCase();
            const matched = [];
            snap.forEach(doc => {
                const d = doc.data();
                const caption = (d.caption || '').toLowerCase();
                const username = (d.username || d.name || '').toLowerCase();
                if (caption.includes(q) || username.includes(q)) {
                    matched.push({ id: doc.id, ...d });
                }
            });
            if (matched.length === 0) {
                results.innerHTML = '<div class="search-empty">কোনো ফলাফল পাওয়া যায়নি</div>';
                return;
            }
            results.innerHTML = matched.map(v => `
                <div class="search-result-item" data-id="${v.id}">
                    <div class="result-user">@${v.username || v.name || 'user'}</div>
                    <div class="result-caption">\( {(v.caption || '').substring(0, 60)} \){(v.caption || '').length > 60 ? '...' : ''}</div>
                </div>
            `).join('');
            results.querySelectorAll('.search-result-item').forEach(el => {
                el.addEventListener('click', () => {
                    closeSearch();
                    alert('ভিডিও খোলা হচ্ছে... (শীঘ্রই সরাসরি প্লে হবে)');
                });
            });
        })
        .catch(err => {
            console.error(err);
            results.innerHTML = '<div class="search-empty">সার্চ করতে সমস্যা হয়েছে</div>';
        });
}

function loadFeed() {
    const feed = document.getElementById('video-feed');
    if (!feed) return;
    feed.innerHTML = '<div class="loading">ভিডিও লোড হচ্ছে...</div>';

    db.collection('videos').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        feed.innerHTML = '';
        if (snapshot.empty) {
            feed.innerHTML = '<div class="loading">কোনো ভিডিও নেই। প্রথম ভিডিও আপলোড করো!</div>';
            return;
        }
        let count = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            const videoId = doc.id;
            if (currentTab === 'following' && data.uid === currentUser.uid) return;
            const videoSrc = data.videoURL || data.videoUrl || '';
            if (!videoSrc) return;
            count++;

            const card = document.createElement('div');
            card.className = 'video-card';
            card.dataset.id = videoId;
            card.innerHTML = `
                <video src="${videoSrc}" loop muted playsinline preload="auto" webkit-playsinline></video>
                <div class="overlay">
                    <div class="left-info">
                        <div class="username">@${data.username || data.name || 'user'}</div>
                        <div class="caption">${data.caption || ''}</div>
                    </div>
                    <div class="action-buttons">
                        <button class="like-btn" data-id="${videoId}">
                            <i class="far fa-heart"></i>
                            <span class="count">${data.likes || data.likeCount || 0}</span>
                        </button>
                        <button class="comment-btn" data-id="${videoId}">
                            <i class="far fa-comment"></i>
                            <span class="count">${data.comments || data.commentCount || 0}</span>
                        </button>
                        <button class="save-btn" data-id="${videoId}">
                            <i class="far fa-bookmark"></i>
                            <span class="count">${data.saves || 0}</span>
                        </button>
                        <button class="share-btn">
                            <i class="fas fa-share"></i>
                            <span>শেয়ার</span>
                        </button>
                        <button class="follow-btn" data-uid="${data.uid || ''}">
                            <i class="far fa-user-plus"></i>
                            <span>ফলো</span>
                        </button>
                        <button class="sound-btn">
                            <i class="fas fa-volume-mute"></i>
                        </button>
                    </div>
                </div>
            `;
            feed.appendChild(card);
            setupAutoplay(card);
            setupCardEvents(card, data, videoId);
            checkLikeStatus(videoId, card.querySelector('.like-btn'));
            checkSaveStatus(videoId, card.querySelector('.save-btn'));

            const fBtn = card.querySelector('.follow-btn');
            if (fBtn) {
                if (!data.uid || data.uid === currentUser.uid) {
                    fBtn.style.display = 'none';
                } else {
                    checkFollowStatus(data.uid, fBtn);
                }
            }
        });

        if (currentTab === 'following' && count === 0) {
            feed.innerHTML = '<div class="loading">আপনি এখনো কাউকে ফলো করেননি।<br>For You ট্যাবে যান।</div>';
        }
        setTimeout(() => {
            const firstVideo = feed.querySelector('.video-card video');
            if (firstVideo) firstVideo.play().catch(() => {});
        }, 400);
    }, error => {
        console.error('ফিড লোড সমস্যা:', error);
        feed.innerHTML = '<div class="loading">ভিডিও লোড করতে সমস্যা হয়েছে</div>';
    });
}

function setupAutoplay(card) {
    const video = card.querySelector('video');
    if (!video) return;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
                document.querySelectorAll('.video-card video').forEach(v => {
                    if (v !== video) {
                        v.pause();
                        try { v.currentTime = 0; } catch(e) {}
                    }
                });
                video.muted = true;
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, { threshold: [0.55, 0.75], root: document.getElementById('video-feed') });
    observer.observe(card);
}

function setupCardEvents(card, data, videoId) {
    const video = card.querySelector('video');

    const likeBtn = card.querySelector('.like-btn');
    if (likeBtn) likeBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleLike(videoId, likeBtn); });

    const commentBtn = card.querySelector('.comment-btn');
    if (commentBtn) commentBtn.addEventListener('click', (e) => { e.stopPropagation(); openComment(videoId); });

    const saveBtn = card.querySelector('.save-btn');
    if (saveBtn) saveBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSave(videoId, saveBtn); });

    const shareBtn = card.querySelector('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = window.location.href;
            if (navigator.share) {
                navigator.share({ title: 'WWC ভিডিও', text: data.caption || 'একটা ভিডিও দেখো', url }).catch(() => {});
            } else {
                navigator.clipboard.writeText(url).then(() => alert('লিংক কপি হয়েছে!')).catch(() => prompt('লিংক কপি করুন:', url));
            }
        });
    }

    const followBtn = card.querySelector('.follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const uid = data.uid || followBtn.getAttribute('data-uid') || '';
            toggleFollow(uid, followBtn);
        });
    }

    const soundBtn = card.querySelector('.sound-btn');
    if (soundBtn) {
        soundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            video.muted = !video.muted;
            soundBtn.innerHTML = video.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        });
    }

    video.addEventListener('click', () => {
        if (video.paused) video.play().catch(() => {});
        else video.pause();
    });
}

async function checkLikeStatus(videoId, btn) {
    if (!currentUser || !btn) return;
    try {
        const likeDoc = await db.collection('likes').doc(`\( {currentUser.uid}_ \){videoId}`).get();
        if (likeDoc.exists) {
            btn.classList.add('liked');
            btn.querySelector('i').className = 'fas fa-heart';
        }
    } catch (e) {}
}

async function checkSaveStatus(videoId, btn) {
    if (!currentUser || !btn) return;
    try {
        const saveDoc = await db.collection('saves').doc(`\( {currentUser.uid}_ \){videoId}`).get();
        if (saveDoc.exists) {
            btn.classList.add('saved');
            btn.querySelector('i').className = 'fas fa-bookmark';
        }
    } catch (e) {}
}

async function toggleLike(videoId, btn) {
    if (!currentUser) return;
    const likeRef = db.collection('likes').doc(`\( {currentUser.uid}_ \){videoId}`);
    const videoRef = db.collection('videos').doc(videoId);
    try {
        const likeDoc = await likeRef.get();
        if (likeDoc.exists) {
            await likeRef.delete();
            await videoRef.update({ likes: firebase.firestore.FieldValue.increment(-1) });
            btn.classList.remove('liked');
            btn.querySelector('i').className = 'far fa-heart';
            const countEl = btn.querySelector('.count');
            if (countEl) countEl.textContent = Math.max(0, (parseInt(countEl.textContent) || 0) - 1);
        } else {
            await likeRef.set({ userId: currentUser.uid, videoId, createdAt: Date.now() });
            await videoRef.update({ likes: firebase.firestore.FieldValue.increment(1) });
            btn.classList.add('liked');
            btn.querySelector('i').className = 'fas fa-heart';
            btn.querySelector('i').style.transform = 'scale(1.4)';
            setTimeout(() => { btn.querySelector('i').style.transform = ''; }, 200);
            const countEl = btn.querySelector('.count');
            if (countEl) countEl.textContent = (parseInt(countEl.textContent) || 0) + 1;
        }
    } catch (err) { console.error('লাইক সমস্যা:', err); }
}

async function toggleSave(videoId, btn) {
    if (!currentUser) return;
    const saveRef = db.collection('saves').doc(`\( {currentUser.uid}_ \){videoId}`);
    const videoRef = db.collection('videos').doc(videoId);
    try {
        const saveDoc = await saveRef.get();
        if (saveDoc.exists) {
            await saveRef.delete();
            await videoRef.update({ saves: firebase.firestore.FieldValue.increment(-1) });
            btn.classList.remove('saved');
            btn.querySelector('i').className = 'far fa-bookmark';
            const countEl = btn.querySelector('.count');
            if (countEl) countEl.textContent = Math.max(0, (parseInt(countEl.textContent) || 0) - 1);
        } else {
            await saveRef.set({ userId: currentUser.uid, videoId, createdAt: Date.now() });
            await videoRef.update({ saves: firebase.firestore.FieldValue.increment(1) });
            btn.classList.add('saved');
            btn.querySelector('i').className = 'fas fa-bookmark';
            btn.querySelector('i').style.transform = 'scale(1.3)';
            setTimeout(() => { btn.querySelector('i').style.transform = ''; }, 200);
            const countEl = btn.querySelector('.count');
            if (countEl) countEl.textContent = (parseInt(countEl.textContent) || 0) + 1;
        }
    } catch (err) { console.error('সেভ সমস্যা:', err); }
}

function openComment(videoId) {
    currentVideoId = videoId;
    const modal = document.getElementById('comment-modal');
    const list = document.getElementById('comment-list');
    if (!modal || !list) return;
    modal.classList.add('active');
    list.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">লোড হচ্ছে...</div>';
    db.collection('videos').doc(videoId).collection('comments').orderBy('createdAt', 'desc')
        .onSnapshot(snap => {
            list.innerHTML = '';
            if (snap.empty) {
                list.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">এখনো কোনো মন্তব্য নেই</div>';
                return;
            }
            snap.forEach(doc => {
                const c = doc.data();
                list.innerHTML += `<div class="comment-item"><strong>@${c.username || 'user'}</strong> ${c.text}</div>`;
            });
        });
}

document.getElementById('comment-submit')?.addEventListener('click', async () => {
    const input = document.getElementById('comment-input');
    const text = input?.value.trim();
    if (!text || !currentVideoId || !currentUser) return;
    try {
        await db.collection('videos').doc(currentVideoId).collection('comments').add({
            text, username: currentUser.displayName || 'ইউজার', uid: currentUser.uid, createdAt: Date.now()
        });
        await db.collection('videos').doc(currentVideoId).update({
            comments: firebase.firestore.FieldValue.increment(1)
        });
        input.value = '';
    } catch (err) { console.error('কমেন্ট সমস্যা:', err); }
});

document.getElementById('close-comment')?.addEventListener('click', () => {
    document.getElementById('comment-modal')?.classList.remove('active');
});

// ========== ফলো স্ট্যাটাস চেক ==========
async function checkFollowStatus(targetUid, btn) {
    if (!currentUser || !targetUid || !btn) return;
    try {
        const followId = `\( {currentUser.uid}_ \){targetUid}`;
        const doc = await db.collection('follows').doc(followId).get();
        if (doc.exists) {
            btn.innerHTML = '<i class="fas fa-user-check"></i><span>ফলোয়িং</span>';
            btn.classList.add('following');
        }
    } catch (e) {
        console.error('ফলো স্ট্যাটাস চেক সমস্যা:', e);
    }
}

// ========== ফলো টগল ==========
async function toggleFollow(targetUid, btn) {
    if (!currentUser) {
        alert('লগইন করুন');
        return;
    }
    if (!targetUid) {
        alert('ইউজার আইডি পাওয়া যায়নি। ভিডিওতে uid ফিল্ড নেই।');
        return;
    }
    if (currentUser.uid === targetUid) {
        alert('নিজেকে ফলো করা যায় না');
        return;
    }

    const followId = `\( {currentUser.uid}_ \){targetUid}`;
    const followRef = db.collection('follows').doc(followId);

    try {
        const doc = await followRef.get();
        if (doc.exists) {
            await followRef.delete();
            btn.innerHTML = '<i class="far fa-user-plus"></i><span>ফলো</span>';
            btn.classList.remove('following');
        } else {
            await followRef.set({
                follower: currentUser.uid,
                following: targetUid,
                createdAt: Date.now()
            });
            btn.innerHTML = '<i class="fas fa-user-check"></i><span>ফলোয়িং</span>';
            btn.classList.add('following');
        }
    } catch (err) {
        console.error('ফলো সমস্যা:', err);
        alert('ফলো করা যাচ্ছে না।\nসম্ভবত Firebase Rules-এ follows কালেকশন অনুমতি নেই।\n\nError: ' + (err.message || err));
    }
}
