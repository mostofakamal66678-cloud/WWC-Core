// ===============================
// WWC - TikTok Style App Logic
// ===============================

let currentVideoId = null;
let currentUser = null;

// সাময়িকভাবে Auth চেক বন্ধ (আগে ফিড দেখার জন্য)
// পরে আবার চালু করব
/*
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'public/js/login.html';
        return;
    }
    currentUser = user;
    loadFeed();
});
*/

// সরাসরি ফিড লোড (টেস্টের জন্য)
loadFeed();

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
                            <button class="like-btn"><i class="far fa-heart"></i><span class="count">${data.likes || 0}</span></button>
                            <button class="comment-btn"><i class="far fa-comment"></i><span class="count">${data.comments || 0}</span></button>
                            <button class="share-btn"><i class="fas fa-share"></i><span>শেয়ার</span></button>
                            <button class="follow-btn"><i class="far fa-user-plus"></i><span>ফলো</span></button>
                            <button class="sound-btn"><i class="fas fa-volume-mute"></i></button>
                        </div>
                    </div>
                `;

                feed.appendChild(card);
                setupAutoplay(card);
                setupCardEvents(card, data, videoId);
            });
        }, err => {
            console.error(err);
            feed.innerHTML = `<div class="loading">ভিডিও লোড করতে সমস্যা</div>`;
        });
}

function setupAutoplay(card) {
    const video = card.querySelector('video');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) video.play().catch(() => {});
            else {
                video.pause();
                video.currentTime = 0;
            }
        });
    }, { threshold: 0.65 });
    observer.observe(card);
}

function setupCardEvents(card, data, videoId) {
    const video = card.querySelector('video');

    card.querySelector('.like-btn').addEventListener('click', function() {
        this.querySelector('i').className = 'fas fa-heart';
        this.classList.add('liked');
    });

    card.querySelector('.comment-btn').addEventListener('click', () => {
        openComment(videoId);
    });

    card.querySelector('.share-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href).then(() => alert('লিংক কপি!'));
    });

    card.querySelector('.sound-btn').addEventListener('click', function() {
        video.muted = !video.muted;
        this.innerHTML = video.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    });
}

function openComment(videoId) {
    currentVideoId = videoId;
    const modal = document.getElementById('comment-modal');
    modal.classList.add('active');
    document.getElementById('comment-list').innerHTML = '<div style="text-align:center;color:#888;padding:20px;">কমেন্ট লোড হচ্ছে...</div>';
}

document.getElementById('close-comment')?.addEventListener('click', () => {
    document.getElementById('comment-modal').classList.remove('active');
});
