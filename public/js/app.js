// ===============================
// WWC - TikTok Style App Logic (Improved v2)
// ===============================

let currentVideoId = null;
let currentUser = null;
let currentTab = 'foryou'; // foryou | following

// ========== Auth Check ==========
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'public/js/login.html';
        return;
    }
    currentUser = user;
    setupTopBar();
    loadFeed();
});

// ========== টপ বার সেটআপ ==========
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
        searchBtn.addEventListener('click', () => {
            const q = prompt('কী খুঁজতে চান? (ইউজারনেম বা ক্যাপশন)');
            if (q && q.trim()) {
                alert('সার্চ ফিচার শীঘ্রই আসছে!\nআপনি লিখেছেন: ' + q.trim());
            }
        });
    }
}

// ========== ভিডিও ফিড লোড ==========
function loadFeed() {
    const feed = document.getElementById('video-feed');
    if (!feed) return;

    feed.innerHTML = '<div class="loading">ভিডিও লোড হচ্ছে...</div>';

    db.collection('videos')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            feed.innerHTML = '';

            if (snapshot.empty) {
                feed.innerHTML = '<div class="loading">কোনো ভিডিও নেই। প্রথম ভিডিও আপলোড করো!</div>';
                return;
            }

            let count = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                const videoId = doc.id;

                if (currentTab === 'following' && data.uid === currentUser.uid) {
                    return;
                }

                const videoSrc = data.videoURL || data.videoUrl || '';
                if (!videoSrc) return;

                count++;

                const card = document.createElement('div');
                card.className = 'video-card';
                card.dataset.id = videoId;

                card.innerHTML = `
                    <video 
                        src="${videoSrc}" 
                        loop 
                        muted 
                        playsinline 
                        preload="auto"
                        webkit-playsinline
                    ></video>
                    
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
            });

            if (currentTab === 'following' && count === 0) {
                feed.innerHTML = '<div class="loading">আপনি এখনো কাউকে ফলো করেননি।<br>For You ট্যাবে যান।</div>';
            }

            setTimeout(() => {
                const firstVideo = feed.querySelector('.video-card video');
                if (firstVideo) {
                    firstVideo.play().catch(() => {});
                }
            }, 400);
        }, error => {
            console.error('ফিড লোড সমস্যা:', error);
            feed.innerHTML = '<div class="loading">ভিডিও লোড করতে সমস্যা হয়েছে</div>';
        });
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
    }, {
        threshold: [0.55, 0.75],
        root: document.getElementById('video-feed')
    });

    observer.observe(card);
}

// ========== কার্ড ইভেন্ট ==========
function setupCardEvents(card, data, videoId) {
    const video = card.querySelector('video');

    const likeBtn = card.querySelector('.like-btn');
    if (likeBtn) {
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLike(videoId, likeBtn);
        });
    }

    const commentBtn = card.querySelector('.comment-btn');
    if (commentBtn) {
        commentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openComment(videoId);
        });
    }

    const shareBtn = card.querySelector('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
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
                }).catch(() => {
                    prompt('লিংক কপি করুন:', url);
                });
            }
        });
    }

    const followBtn = card.querySelector('.follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFollow(data.uid, followBtn);
        });
    }

    const soundBtn = card.querySelector('.sound-btn');
    if (soundBtn) {
        soundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            video.muted = !video.muted;
            soundBtn.innerHTML = video.muted
                ? '<i class="fas fa-volume-mute"></i>'
                : '<i class="fas fa-volume-up"></i>';
        });
    }

    video.addEventListener('click', () => {
        if (video.paused) {
            video.play().catch(() => {});
        } else {
            video.pause();
        }
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
            await likeRef.delete();
            await videoRef.update({
                likes: firebase.firestore.FieldValue.increment(-1)
            });
            btn.classList.remove('liked');
            btn.querySelector('i').className = 'far fa-heart';
            const countEl = btn.querySelector('.count');
            if (countEl) {
                const n = parseInt(countEl.textContent) || 0;
                countEl.textContent = Math.max(0, n - 1);
            }
        } else {
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
            const countEl = btn.querySelector('.count');
            if (countEl) {
                const n = parseInt(countEl.textContent) || 0;
                countEl.textContent = n + 1;
            }
        }
    } catch (err) {
        console.error('লাইক সমস্যা:', err);
    }
}

// ========== কমেন্ট ==========
function openComment(videoId) {
    currentVideoId = videoId;
    const modal = document.getElementById('comment-modal');
    const list = document.getElementById('comment-list');

    if (!modal || !list) return;

    modal.classList.add('active');
    list.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">লোড হচ্ছে...</div>';

    db.collection('videos').doc(videoId)
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snap => {
            list.innerHTML = '';
            if (snap.empty) {
                list.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">এখনো কোনো মন্তব্য নেই</div>';
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
            btn.innerHTML = '<i class="far fa-user-plus"></i><span>ফলো</span>';
        } else {
            await followRef.set({
                follower: currentUser.uid,
                following: targetUid,
                createdAt: Date.now()
            });
            btn.innerHTML = '<i class="fas fa-user-check"></i><span>ফলোয়িং</span>';
        }
    } catch (err) {
        console.error('ফলো সমস্যা:', err);
    }
}
