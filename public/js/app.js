// =========== অথেন্টিকেশন চেক ===========
auth.onAuthStateChanged(user => {
    if (!user) window.location.href = 'login.html';
    else loadFeed();
});

// =========== ভিডিও ফিড লোড ===========
let currentVideoId = null;

function loadFeed() {
    const feed = document.getElementById('video-feed');
    feed.innerHTML = '<p style="text-align:center;padding:40px;color:#888;">ভিডিও লোড হচ্ছে...</p>';

    db.collection('videos').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        feed.innerHTML = '';
        if (snapshot.empty) {
            feed.innerHTML = '<p style="text-align:center;padding:40px;color:#888;">কোনো ভিডিও নেই। প্রথম ভিডিও আপলোড করুন!</p>';
            return;
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'video-card';
            card.dataset.id = doc.id;

            card.innerHTML = `
                <video src="${data.videoUrl}" loop muted playsinline></video>
                <div class="overlay">
                    <div class="left-info">
                        <div class="username">@${data.username}</div>
                        <div class="caption">${data.caption || ''}</div>
                    </div>
                    <div class="action-buttons">
                        <button class="like-btn"><i class="far fa-heart"></i><span class="count">${data.likes || 0}</span></button>
                        <button class="comment-btn"><i class="far fa-comment"></i><span class="count">${data.comments || 0}</span></button>
                        <button class="share-btn"><i class="fas fa-share"></i><span>শেয়ার</span></button>
                        <button class="follow-btn"><i class="far fa-user-plus"></i><span>ফলো</span></button>
                        <button class="sound-btn"><i class="fas fa-volume-up"></i><span>সাউন্ড</span></button>
                    </div>
                </div>
            `;
            feed.append(card);

            // অটোপ্লে
            const video = card.querySelector('video');
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) video.play().catch(() => {});
                    else video.pause();
                });
            }, { threshold: 0.6 });
            observer.observe(card);

            // লাইক
            card.querySelector('.like-btn').addEventListener('click', () => toggleLike(doc.id));
            // কমেন্ট
            card.querySelector('.comment-btn').addEventListener('click', () => openComment(doc.id));
            // শেয়ার
            card.querySelector('.share-btn').addEventListener('click', () => {
                navigator.clipboard?.writeText(window.location.href).then(() => alert('লিংক কপি!'));
            });
            // ফলো
            card.querySelector('.follow-btn').addEventListener('click', () => toggleFollow(data.uid));
            // সাউন্ড
            card.querySelector('.sound-btn').addEventListener('click', () => {
                video.muted = !video.muted;
                card.querySelector('.sound-btn i').className = video.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
            });
        });
    });
}

// =========== লাইক টগল ===========
function toggleLike(videoId) {
    const videoRef = db.collection('videos').doc(videoId);
    videoRef.get().then(doc => {
        const likes = doc.data().likes || 0;
        videoRef.update({ likes: likes + 1 });
    });
}

// =========== কমেন্ট ===========
function openComment(videoId) {
    currentVideoId = videoId;
    const modal = document.getElementById('comment-modal');
    const list = document.getElementById('comment-list');
    modal.classList.add('active');

    db.collection('videos').doc(videoId).collection('comments').orderBy('createdAt', 'desc').onSnapshot(snap => {
        list.innerHTML = '';
        snap.forEach(doc => {
            const c = doc.data();
            list.innerHTML += `<div class="comment-item"><strong>@${c.username}</strong> ${c.text}</div>`;
        });
    });
}

document.getElementById('comment-submit').addEventListener('click', () => {
    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    if (!text || !currentVideoId) return;
    const user = auth.currentUser;
    db.collection('videos').doc(currentVideoId).collection('comments').add({
        text: text,
        username: user.displayName || 'ইউজার',
        uid: user.uid,
        createdAt: Date.now()
    });
    // কমেন্ট কাউন্ট বাড়ানো
    db.collection('videos').doc(currentVideoId).update({
        comments: firebase.firestore.FieldValue.increment(1)
    });
    input.value = '';
});

document.getElementById('close-comment').addEventListener('click', () => {
    document.getElementById('comment-modal').classList.remove('active');
});

// =========== ফলো ===========
function toggleFollow(targetUid) {
    const user = auth.currentUser;
    if (!user) return;
    const followRef = db.collection('follows').doc(`${user.uid}_${targetUid}`);
    followRef.get().then(doc => {
        if (doc.exists) followRef.delete();
        else followRef.set({ follower: user.uid, following: targetUid, createdAt: Date.now() });
    });
}
