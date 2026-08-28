// ===============================
// WWC - TikTok Style App Logic (Firestore ফিক্স)
// ===============================

let currentUser = null;

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;
    loadFeed();
});

function loadFeed() {
    const feed = document.getElementById('video-feed');
    if (!feed) {
        console.error('video-feed এলিমেন্ট পাওয়া যায়নি!');
        return;
    }

    feed.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">ভিডিও লোড হচ্ছে...</div>';

    db.collection('videos')
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            console.log('ভিডিও সংখ্যা:', snapshot.size);
            
            if (snapshot.empty) {
                feed.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">কোনো ভিডিও নেই। প্রথম ভিডিও আপলোড করো!</div>';
                return;
            }

            feed.innerHTML = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const videoId = doc.id;
                // 🔥 এখানে videoURL (বড় হাতের URL) ব্যবহার করুন
                const videoSrc = data.videoURL || data.videoUrl || '';

                if (!videoSrc) {
                    console.warn('ভিডিও URL নেই:', videoId);
                    return;
                }

                const card = document.createElement('div');
                card.className = 'video-card';
                card.style.cssText = `
                    height: 100vh;
                    width: 100%;
                    scroll-snap-align: start;
                    position: relative;
                    background: #000;
                `;
                card.innerHTML = `
                    <video src="${videoSrc}" loop muted playsinline style="width:100%;height:100%;object-fit:cover;"></video>
                    <div style="position:absolute;bottom:0;left:0;right:0;padding:20px;background:linear-gradient(transparent,rgba(0,0,0,0.8));">
                        <div style="font-weight:bold;font-size:16px;">@${data.username || 'user'}</div>
                        <div style="font-size:14px;opacity:0.9;">${data.caption || ''}</div>
                    </div>
                    <div style="position:absolute;right:12px;bottom:120px;display:flex;flex-direction:column;gap:18px;align-items:center;">
                        <button onclick="likeVideo('${videoId}')" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer;">
                            ❤️ <span id="like-count-${videoId}">${data.likes || 0}</span>
                        </button>
                        <button onclick="shareVideo()" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer;">
                            📤
                        </button>
                    </div>
                `;
                feed.appendChild(card);

                // অটোপ্লে
                const video = card.querySelector('video');
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            video.play().catch(() => {});
                        } else {
                            video.pause();
                        }
                    });
                }, { threshold: 0.6 });
                observer.observe(card);
            });
        })
        .catch(err => {
            console.error('ফিড লোড সমস্যা:', err);
            feed.innerHTML = `<div style="text-align:center;color:#f44336;padding:40px;">ভিডিও লোড করতে সমস্যা হয়েছে: ${err.message}</div>`;
        });
}

// লাইক ফাংশন
function likeVideo(videoId) {
    const videoRef = db.collection('videos').doc(videoId);
    videoRef.get().then(doc => {
        const currentLikes = doc.data().likes || 0;
        videoRef.update({ likes: currentLikes + 1 });
        const countEl = document.getElementById(`like-count-${videoId}`);
        if (countEl) countEl.textContent = currentLikes + 1;
    }).catch(err => console.error('লাইক সমস্যা:', err));
}

// শেয়ার ফাংশন
function shareVideo() {
    if (navigator.share) {
        navigator.share({ title: 'WWC ভিডিও', url: window.location.href }).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => alert('লিংক কপি হয়েছে!'));
    }
}
