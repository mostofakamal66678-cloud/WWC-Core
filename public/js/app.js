// ========================================
// WWC - ভিডিও ফিড (ডান পাশের বাটন সহ)
// ========================================

let currentUser = null;

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;
    console.log('✅ লগইন:', user.uid);
    loadFeed();
});

function loadFeed() {
    const feed = document.getElementById('video-feed');
    if (!feed) return;

    feed.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">⏳ লোড হচ্ছে...</div>';

    db.collection('videos')
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            console.log('📹 ভিডিও পেয়েছি:', snapshot.size);
            if (snapshot.empty) {
                feed.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">🎬 কোনো ভিডিও নেই</div>';
                return;
            }

            feed.innerHTML = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const src = data.videoURL || data.videoUrl || '';
                if (!src) return;

                const card = document.createElement('div');
                card.className = 'video-card';
                card.innerHTML = `
                    <video src="${src}" loop muted playsinline></video>
                    <div class="video-overlay">
                        <div class="left-info">
                            <div class="username">@${data.username || 'user'}</div>
                            <div class="caption">${data.caption || ''}</div>
                        </div>
                        <div class="action-buttons">
                            <button onclick="likeVideo('${doc.id}')">
                                <i class="fas fa-heart"></i>
                                <span>${data.likes || 0}</span>
                            </button>
                            <button onclick="shareVideo()">
                                <i class="fas fa-share"></i>
                                <span>শেয়ার</span>
                            </button>
                        </div>
                    </div>
                `;
                feed.appendChild(card);

                // অটোপ্লে
                const video = card.querySelector('video');
                const observer = new IntersectionObserver(([entry]) => {
                    if (entry.isIntersecting) video.play().catch(() => {});
                    else video.pause();
                }, { threshold: 0.6 });
                observer.observe(card);
            });
        })
        .catch(err => {
            console.error('❌ এরর:', err);
            feed.innerHTML = `<div style="color:#f44336;padding:40px;">❌ ${err.message}</div>`;
        });
}

// ========== লাইক ==========
function likeVideo(videoId) {
    if (!currentUser) return alert('লগইন করুন');
    const ref = db.collection('videos').doc(videoId);
    ref.get().then(doc => {
        const likes = (doc.data().likes || 0) + 1;
        ref.update({ likes });
        // UI আপডেট
        document.querySelector(`#video-feed .video-card`)?.querySelector('.action-buttons button span')?.textContent = likes;
    });
}

// ========== শেয়ার ==========
function shareVideo() {
    if (navigator.share) {
        navigator.share({ title: 'WWC', url: location.href });
    } else {
        navigator.clipboard.writeText(location.href).then(() => alert('✅ লিংক কপি!'));
    }
}
