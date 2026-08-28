// ===============================
// WWC - TikTok Style App Logic
// ===============================

let currentVideoId = null;
let currentUser = null;

// ========== Auth Check ==========
auth.onAuthStateChanged(user => {
    if (!user) {
        // লগইন না থাকলে লগইন পেজে পাঠাও
        window.location.href = 'public/js/login.html';
        return;
    }
    currentUser = user;
    loadFeed();
});

// ========== ভিডিও ফিড লোড ==========
function loadFeed() {
    const feed = document.getElementById('video-feed');
    if (!feed) return;

    feed.innerHTML = `<div class="loading">ভিডিও লোড হচ্ছে...</div>`;

    db.collection('videos')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            feed.innerHTML = '';

            if (snapshot.empty) {
                feed.innerHTML = `<div class="loading">কোনো ভিডিও নেই। প্রথম ভিডিও আপলোড করো!</div>`;
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const videoId = doc.id;

                const card = document.createElement('div');
                card.className = 'video-card';
                card.dataset.id = videoId;

                card.innerHTML = `
                    <video src="${data.videoUrl}" loop muted playsinline preload="metadata"></video>
                    
                    <div class="overlay">
                        <div class="left-info">
                            <div class="username">@${data.username || 'user'}</div>
                            <div class="caption">${data.caption || ''}</div>
                        </div>

                        <div class="action-buttons">
                            <button class="like-btn" data-id="${videoId}">
                                <i class="far fa-heart"></i>
                                <span class="count">${data.likes || 0}</span>
                            </button>

                            <button class="comment-btn" data-id="${videoId}">
                                <i class="far fa-comment"></i>
                                <span class="count">${data.comments || 0}</span>
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

                // অটোপ্লে
                setupAutoplay(card);

                // বাটন ইভেন্ট
                setupCardEvents(card, data, videoId);
            });
        }, error => {
            console.error('ফিড লোড সমস্যা:', error);
            feed.innerHTML = `<div class="loading">ভিডিও লোড করতে সমস্যা হয়েছে</div>`;
        });
}

// ========== অটোপ্লে ==========
function setupAutoplay(card) {
    const video = card.querySelector('video');
    if (!video) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                video.play().catch(() => {});
            } else {
                video.pause();
                video.currentTime = 0;
            }
        });
    }, { threshold: 0.65 });

    observer.observe(card);
}

// ========== কার্ড ইভেন্ট ==========
function setupCardEvents(card, data, videoId) {
    const video = card.querySelector('video');

    // লাইক
    const likeBtn = card.querySelector('.like-btn');
    likeBtn.addEventListener('click', () => toggleLike(videoId, likeBtn));

    // কমেন্ট
    card.querySelector('.comment-btn').addEventListener('click', () => {
        openComment(videoId);
    });

    // শেয়ার
    card.querySelector('.share-btn').addEventListener('click', () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: 'WWC ভিডিও',
                text: data.caption || 'একটা ভিডিও দেখো',
                url: url
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url).then(() => {
                alert('লিংক কপি হয়েছে!');
            });
        }
    });

    // ফলো
    const followBtn = card.querySelector('.follow-btn');
    followBtn.addEventListener('click', () => toggleFollow(data.uid, followBtn));

    // সাউন্ড
    const soundBtn = card.querySelector('.sound-btn');
    soundBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        soundBtn.innerHTML = video.muted
            ? `<i class="fas fa-volume-mute"></i>`
            : `<i class="fas fa-volume-up"></i>`;
    });
}

// ========== লাইক টগল ==========
async function toggleLike(videoId, btn) {
    if (!currentUser) return;

    const likeRef = db.collection('likes').doc(`\( {currentUser.uid}_ \){videoId}`);
    const videoRef = db.collection('videos').doc(videoId);

    try {
        const likeDoc = await likeRef.get();

        if (likeDoc.exists) {
            // আনলাইক
            await likeRef.delete();
            await videoRef.update({
                likes: firebase.firestore.FieldValue.increment(-1)
            });
            btn.classList.remove('liked');
            btn.querySelector('i').className = 'far fa-heart';
        } else {
            // লাইক
            await likeRef.set({
                userId: currentUser.uid,
                videoId: videoId,
                createdAt: Date.now()
            });
            await videoRef.update({
                likes: firebase.firestore.FieldValue.increment(1)
            });
            btn.classList.add('liked');
            btn.querySelector('i').className = 'fas fa-heart';
        }
    } catch (err) {
        console.error('লাইক সমস্যা:', err);
    }
}

// ========== কমেন্ট ওপেন ==========
function openComment(videoId) {
    currentVideoId = videoId;
    const modal = document.getElementById('comment-modal');
    const list = document.getElementById('comment-list');

    if (!modal || !list) return;

    modal.classList.add('active');
    list.innerHTML = `<div style="text-align:center;color:#888;padding:20px;">লোড হচ্ছে...</div>`;

    db.collection('videos').doc(videoId)
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snap => {
            list.innerHTML = '';
            if (snap.empty) {
                list.innerHTML = `<div style="text-align:center;color:#888;padding:20px;">এখনো কোনো মন্তব্য নেই</div>`;
                return;
            }
            snap.forEach(doc => {
                const c = doc.data();
                list.innerHTML += `
                    <div class="comment-item">
                        <strong>@${c.username || 'user'}</strong>
                        ${c.text}
                    </div>
                `;
            });
        });
}

// কমেন্ট সাবমিট
document.getElementById('comment-submit')?.addEventListener('click', async () => {
    const input = document.getElementById('comment-input');
    const text = input?.value.trim();
    if (!text || !currentVideoId || !currentUser) return;

    try {
        await db.collection('videos').doc(currentVideoId)
            .collection('comments')
            .add({
                text: text,
                username: currentUser.displayName || 'ইউজার',
                uid: currentUser.uid,
                createdAt: Date.now()
            });

        await db.collection('videos').doc(currentVideoId).update({
            comments: firebase.firestore.FieldValue.increment(1)
        });

        input.value = '';
    } catch (err) {
        console.error('কমেন্ট সমস্যা:', err);
    }
});

// কমেন্ট বন্ধ
document.getElementById('close-comment')?.addEventListener('click', () => {
    document.getElementById('comment-modal')?.classList.remove('active');
});

// ========== ফলো টগল ==========
async function toggleFollow(targetUid, btn) {
    if (!currentUser || !targetUid || currentUser.uid === targetUid) return;

    const followId = `\( {currentUser.uid}_ \){targetUid}`;
    const followRef = db.collection('follows').doc(followId);

    try {
        const doc = await followRef.get();

        if (doc.exists) {
            await followRef.delete();
            btn.innerHTML = `<i class="far fa-user-plus"></i><span>ফলো</span>`;
        } else {
            await followRef.set({
                follower: currentUser.uid,
                following: targetUid,
                createdAt: Date.now()
            });
            btn.innerHTML = `<i class="fas fa-user-check"></i><span>ফলোয়িং</span>`;
        }
    } catch (err) {
        console.error('ফলো সমস্যা:', err);
    }
}
