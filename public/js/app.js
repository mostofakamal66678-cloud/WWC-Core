// ========================================
// WWC - TikTok স্টাইল অ্যাপ (ভিডিও ফিড ঠিক করা)
// ========================================

let currentUser = null;
let currentVideoId = null;
let currentTab = 'foryou';

// ========== ইউজার লগইন চেক ==========
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;
    console.log('✅ ইউজার লগইন:', user.uid);
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
            alert('🔍 সার্চ ফিচার শীঘ্রই আসছে!');
        });
    }
}

// ========== ফিড লোড ==========
function loadFeed() {
    const feed = document.getElementById('video-feed');
    if (!feed) {
        console.error('❌ video-feed এলিমেন্ট পাওয়া যায়নি!');
        return;
    }

    feed.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">⏳ ভিডিও লোড হচ্ছে...</div>';

    let query = db.collection('videos').orderBy('createdAt', 'desc');

    if (currentTab === 'following') {
        loadFollowingFeed(feed);
        return;
    }

    // For You ফিড
    query.get()
        .then(snapshot => {
            console.log('📹 মোট ভিডিও পাওয়া গেছে:', snapshot.size);
            
            if (snapshot.empty) {
                feed.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">🎬 কোনো ভিডিও নেই। প্রথম ভিডিও আপলোড করো!</div>';
                return;
            }

            renderFeed(snapshot, feed);
        })
        .catch(err => {
            console.error('❌ ফিড লোড সমস্যা:', err);
            feed.innerHTML = `<div style="text-align:center;color:#f44336;padding:40px;">❌ ভিডিও লোড করতে সমস্যা হয়েছে: ${err.message}</div>`;
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
            feed.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">👤 আপনি এখনো কাউকে ফলো করেননি।<br>For You ট্যাবে যান।</div>';
            return;
        }

        const videosSnap = await db.collection('videos')
            .where('uid', 'in', followingUids)
            .orderBy('createdAt', 'desc')
            .get();

        if (videosSnap.empty) {
            feed.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">📭 আপনি ফলো করা ইউজারদের কোনো ভিডিও নেই।</div>';
            return;
        }

        renderFeed(videosSnap, feed, true);

    } catch (err) {
        console.error('❌ ফলোইং ফিড সমস্যা:', err);
        feed.innerHTML = `<div style="text-align:center;color:#f44336;padding:40px;">❌ ফলোইং ফিড লোড করতে সমস্যা হয়েছে: ${err.message}</div>`;
    }
}

// ========== ফিড রেন্ডার ==========
function renderFeed(snapshot, feed, isFollowing = false) {
    feed.innerHTML = '';
    
    if (snapshot.empty) {
        feed.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">🎬 কোনো ভিডিও নেই। প্রথম ভিডিও আপলোড করো!</div>';
        return;
    }

    let count = 0;
    
    snapshot.forEach(doc => {
        const data = doc.data();
        const videoId = doc.id;
        
        // 🔥 গুরুত্বপূর্ণ: videoURL ফিল্ড চেক করুন (বড় হাতের URL)
        const videoSrc = data.videoURL || data.videoUrl || '';

        if (!videoSrc) {
            console.warn('⛔ ভিডিও URL নেই:', videoId);
            return;
        }

        // ফলোইং ট্যাবে নিজের ভিডিও বাদ দিন
        if (isFollowing && data.uid === currentUser.uid) return;

        count++;
        
        // ভিডিও কার্ড তৈরি
        const card = document.createElement('div');
        card.className = 'video-card';
        card.style.cssText = `
            height: 100vh;
            width: 100%;
            scroll-snap-align: start;
            position: relative;
            background: #000;
            overflow: hidden;
        `;

        card.innerHTML = `
            <video src="${videoSrc}" loop muted playsinline style="width:100%;height:100%;object-fit:cover;"></video>
            <div style="position:absolute;bottom:0;left:0;right:0;padding:20px;background:linear-gradient(transparent,rgba(0,0,0,0.8));">
                <div style="font-weight:bold;font-size:16px;color:#fff;">@${data.username || 'user'}</div>
                <div style="font-size:14px;opacity:0.9;color:#fff;">${data.caption || ''}</div>
            </div>
            <div style="position:absolute;right:12px;bottom:120px;display:flex;flex-direction:column;gap:18px;align-items:center;">
                <button onclick="toggleLike('${videoId}')" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer;">
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

    if (count === 0 && isFollowing) {
        feed.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">📭 আপনি ফলো করা ইউজারদের কোনো ভিডিও নেই।</div>';
    }
}

// ========== লাইক টগল ==========
async function toggleLike(videoId) {
    if (!currentUser) {
        alert('লগইন করুন');
        return;
    }

    const likeRef = db.collection('likes').doc(`${currentUser.uid}_${videoId}`);
    const videoRef = db.collection('videos').doc(videoId);
    
    try {
        const likeDoc = await likeRef.get();
        const countEl = document.getElementById(`like-count-${videoId}`);
        let currentCount = parseInt(countEl?.textContent || 0);

        if (likeDoc.exists) {
            // আনলাইক
            await likeRef.delete();
            await videoRef.update({ likes: firebase.firestore.FieldValue.increment(-1) });
            if (countEl) countEl.textContent = Math.max(0, currentCount - 1);
        } else {
            // লাইক
            await likeRef.set({ userId: currentUser.uid, videoId, createdAt: Date.now() });
            await videoRef.update({ likes: firebase.firestore.FieldValue.increment(1) });
            if (countEl) countEl.textContent = currentCount + 1;
        }
    } catch (err) {
        console.error('❌ লাইক সমস্যা:', err);
        alert('লাইক করতে সমস্যা হয়েছে!');
    }
}

// ========== শেয়ার ফাংশন ==========
function shareVideo() {
    if (navigator.share) {
        navigator.share({ title: 'WWC ভিডিও', url: window.location.href }).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href)
            .then(() => alert('✅ লিংক কপি হয়েছে!'))
            .catch(() => prompt('লিংক কপি করুন:', window.location.href));
    }
}

console.log('🚀 WWC অ্যাপ সফলভাবে লোড হয়েছে!');
