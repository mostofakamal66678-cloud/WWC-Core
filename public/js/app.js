// ===============================
// WWC - TikTok Style App Logic (v3.2 - Fixed)
// ===============================

let currentVideoId = null;
let currentUser = null;
let currentTab = 'foryou';

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'login.html';
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
    const searchBtn = document.getElementById('search-btn');

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

// ========== ফিড লোড ==========
function loadFeed() {
    const feed = document.getElementById('video-feed');
    if (!feed) {
        console.error('video-feed এলিমেন্ট পাওয়া যায়নি!');
        return;
    }
    feed.innerHTML = '<div class="loading">ভিডিও লোড হচ্ছে...</div>';

    let query = db.collection('videos').orderBy('createdAt', 'desc');

    if (currentTab === 'following') {
        loadFollowingFeed(feed);
        return;
    }

    // For You ফিড
    query.onSnapshot(snapshot => {
        console.log('ভিডিও ফিড আপডেট:', snapshot.size);
        renderFeed(snapshot, feed);
    }, error => {
        console.error('ফিড লোড সমস্যা:', error);
        feed.innerHTML = '<div class="loading">ভিডিও লোড করতে সমস্যা হয়েছে</div>';
    });
}

// ========== ফলোইং ফিড ==========
async function loadFollowingFeed(feed) {
    try {
        const followsSnap = await db.collection('follows')
            .where('follower', '==', currentUser.uid)
            .get();
        
        const followingUids = [];
        followsSnap.forEach(doc => {
            const data = doc.data();
            if (data.following) followingUids.push(data.following);
        });

        if (followingUids.length === 0) {
            feed.innerHTML = '<div class="loading">আপনি এখনো কাউকে ফলো করেননি।<br>For You ট্যাবে যান।</div>';
            return;
        }

        const videosSnap = await db.collection('videos')
            .where('uid', 'in', followingUids)
            .orderBy('createdAt', 'desc')
            .get();

        if (videosSnap.empty) {
            feed.innerHTML = '<div class="loading">আপনি ফলো করা ইউজারদের কোনো ভিডিও নেই।</div>';
            return;
        }

        renderFeed(videosSnap, feed, true);

    } catch (err) {
        console.error('ফলোইং ফিড সমস্যা:', err);
        feed.innerHTML = '<div class="loading">ফলোইং ফিড লোড করতে সমস্যা হয়েছে</div>';
    }
}

// ========== ফিড রেন্ডার ==========
function renderFeed(snapshot, feed, isFollowing = false) {
    feed.innerHTML = '';
    if (snapshot.empty) {
        feed.innerHTML = '<div class="loading">কোনো ভিডিও নেই। প্রথম ভিডিও আপলোড করো!</div>';
        return;
    }

    let count = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        const videoId = doc.id;
        const videoSrc = data.videoURL || data.videoUrl || '';
        if (!videoSrc) {
            console.warn('ভিডিও URL নেই:', videoId);
            return;
        }

        if (isFollowing && data.uid === currentUser.uid) return;

        count++;
        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.id = videoId;
        card.innerHTML = `
            <video src="${videoSrc}" loop muted playsinline preload="auto" webkit-playsinline></video>
            <div class="overlay">
                <div class="left-info">
                    <div class="username" data-uid="${data.uid || ''}">@${data.username || data.name || 'user'}</div>
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

        // ইউজারনেমে ক্লিক করলে প্রোফাইল খোলা
        const usernameEl = card.querySelector('.username');
        if (usernameEl) {
            usernameEl.style.cursor = 'pointer';
            usernameEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const uid = usernameEl.dataset.uid || data.uid || '';
                if (uid) {
                    window.location.href = `profile.html?uid=${uid}`;
                }
            });
        }
    });

    if (count === 0 && isFollowing) {
        feed.innerHTML = '<div class="loading">আপনি ফলো করা ইউজারদের কোনো ভিডিও নেই।</div>';
    }

    setTimeout(() => {
        const firstVideo = feed.querySelector('.video-card video');
        if (firstVideo) firstVideo.play().catch(() => {});
    }, 400);
}

// ========== অটোপ্লে ==========
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

// ========== কার্ড ইভেন্ট ==========
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

// ========== লাইক চেক ==========
async function checkLikeStatus(videoId, btn) {
    if (!currentUser || !btn) return;
    try {
        const likeDoc = await db.collection('likes').doc(`${currentUser.uid}_${videoId}`).get();
        if (likeDoc.exists) {
            btn.classList.add('liked');
            btn.querySelector('i').className = 'fas fa-heart';
        }
    } catch (e) {}
}

// ========== সেভ চেক ==========
async function checkSaveStatus(videoId, btn) {
    if (!currentUser || !btn) return;
    try {
        const saveDoc = await db.collection('saves').doc(`${currentUser.uid}_${videoId}`).get();
        if (saveDoc.exists) {
            btn.classList.add('saved');
            btn.querySelector('i').className = 'fas fa-bookmark';
        }
    } catch (e) {}
}

// ========== লাইক টগল ==========
async function toggleLike(videoId, btn) {
    if (!currentUser) return;
    const likeRef = db.collection('likes').doc(`${currentUser.uid}_${videoId}`);
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

// ========== সেভ টগল ==========
async function toggleSave(videoId, btn) {
    if (!currentUser) return;
    const saveRef = db.collection('saves').doc(`${currentUser.uid}_${videoId}`);
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

// ========== কমেন্ট ==========
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
        const followId = `${currentUser.uid}_${targetUid}`;
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

    const followId = `${currentUser.uid}_${targetUid}`;
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
