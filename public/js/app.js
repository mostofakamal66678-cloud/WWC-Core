import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  addDoc,
  updateDoc,
  runTransaction,
  query,
  orderBy,
  serverTimestamp,
  where
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgio17aPEfR7d6juqIhn3yi6Mf65W_tO4",
  authDomain: "world-wide-connect-62c87.firebaseapp.com",
  projectId: "world-wide-connect-62c87",
  storageBucket: "world-wide-connect-62c87.firebasestorage.app",
  messagingSenderId: "93178453668",
  appId: "1:93178453668:web:2184630caa8e61f7445031",
  measurementId: "G-PKFJ5NEMGQ"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log("✅ Firebase Initialized!");

let currentUser = null;
let currentProfile = { followingIds: [], savedVideoIds: [] };
let allVideos = [];
let currentFeed = "foryou";
let currentVideoId = null;
let observer = null;
let currentPlayingVideo = null;
const defaultPhoto = "./images/profile.png";

function escapeHtml(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function number(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatNumber(num) {
  num = Number(num) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return String(num);
}

function getFollowingIds() {
  return Array.isArray(currentProfile?.followingIds) ? currentProfile.followingIds : [];
}

function getUsername(video) {
  return String(video.username || video.userName || video.handle || "wwc_user").replace(/^@/, "");
}

function showToast(text) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove("show"), 2000);
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))]);
}

window.goHome = function() {
  window.location.href = "./index.html";
};
window.goFriends = function() {
  window.location.href = "./friends.html";
};
window.goUpload = function() {
  window.location.href = "./upload.html";
};
window.goInbox = function() {
  window.location.href = "./inbox.html";
};
window.goProfile = function() {
  if (currentUser) {
    window.location.href = `./profile.html?uid=${currentUser.uid}`;
  } else {
    window.location.href = "./auth.html";
  }
};

async function resolveVideoURL(video) {
  const directUrl = video.videoURL || video.videoUrl || video.downloadURL || video.downloadUrl || video.fileURL || video.fileUrl || video.url || video.src;
  if (directUrl && directUrl.startsWith('http')) return directUrl;
  if (video.localPath || video.localUrl || video.file) return video.localPath || video.localUrl || video.file;
  const storagePath = video.storagePath || video.filePath || video.storage || video.path;
  if (storagePath) {
    try {
      return await withTimeout(getDownloadURL(ref(storage, storagePath)), 10000);
    } catch (e) {
      console.error("Storage error:", e);
      return "";
    }
  }
  return "";
}

async function loadVideos() {
  if (!currentUser) return;
  try {
    const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    const snap = await withTimeout(getDocs(q), 10000);
    allVideos = [];
    snap.forEach(doc => {
      allVideos.push({ id: doc.id, ...doc.data() });
    });

    for (let i = 0; i < allVideos.length; i++) {
      allVideos[i].resolvedVideoURL = await resolveVideoURL(allVideos[i]);
    }
    allVideos = allVideos.filter(v => !!v.resolvedVideoURL);
    renderFeed();
  } catch (e) {
    console.error("Load videos error:", e);
    document.getElementById("feed").innerHTML = `<div class="feed-message"><div class="feed-message-inner"><div class="feed-message-icon">⚠️</div><div>Could not load videos</div></div></div>`;
  }
}

function renderFeed() {
  const feed = document.getElementById("feed");
  if (!feed) return;
  feed.innerHTML = "";

  let videos = currentFeed === "foryou" ? [...allVideos] : allVideos.filter(v => getFollowingIds().includes(v.uid));

  if (!videos.length) {
    feed.innerHTML = `<div class="feed-message"><div class="feed-message-inner"><div class="feed-message-icon">🎬</div><div>${currentFeed === "following" ? "You're not following anyone yet" : "No videos found"}</div></div></div>`;
    return;
  }

  videos.forEach(video => {
    const item = createVideoItem(video);
    feed.appendChild(item);
  });
  setupVideoObserver();
}

function createVideoItem(video) {
  const item = document.createElement("section");
  item.className = "video-item";
  item.dataset.videoId = video.id;

  const username = getUsername(video);
  const name = video.name || video.displayName || username;
  const avatar = video.photoURL || video.photo || defaultPhoto;
  const caption = video.caption || video.description || "";
  const sound = video.sound || "🎵 Original sound - WWC";
  const creatorId = video.uid || video.creatorId || video.userId || "";

  const isFollowing = getFollowingIds().includes(creatorId);
  const isLiked = Array.isArray(video.likedBy) && video.likedBy.includes(currentUser?.uid);
  const isSaved = Array.isArray(video.savedBy) && video.savedBy.includes(currentUser?.uid);

  const likes = number(video.likes);
  const comments = number(video.comments);
  const saves = number(video.saves);
  const shares = number(video.shares);
  const url = video.resolvedVideoURL || "";

  item.innerHTML = `
    <video class="video" src="${escapeHtml(url)}" loop muted playsinline webkit-playsinline preload="metadata"></video>
    <div class="video-loader"><span></span></div>
    <div class="top-bar">
      <div class="tabs">
        <button class="tab ${currentFeed === "following" ? "active" : ""}" data-tab="following">Following</button>
        <button class="tab ${currentFeed === "foryou" ? "active" : ""}" data-tab="foryou">For You</button>
      </div>
      <button class="search-btn" onclick="showToast('🔍 Search coming soon')"><i class="fas fa-search"></i></button>
    </div>
    <div class="action-bar">
      <div class="action">
        <div class="creator-avatar" onclick="window.location.href='./profile.html?uid=${creatorId}'" style="cursor:pointer;">
          <img src="${escapeHtml(avatar)}" alt="${escapeHtml(name)}" onerror="this.src='${defaultPhoto}'">
          ${creatorId && creatorId !== currentUser?.uid ? `
            <button class="follow-plus ${isFollowing ? "following" : ""}" data-action="follow" data-creator="${escapeHtml(creatorId)}">${isFollowing ? "✓" : "+"}</button>
          ` : ""}
        </div>
      </div>
      <button class="action like-btn ${isLiked ? "liked" : ""}" data-action="like"><span class="action-icon"><i class="fas fa-heart"></i></span><span class="action-count">${formatNumber(likes)}</span></button>
      <button class="action comment-btn" data-action="comment"><span class="action-icon"><i class="fas fa-comment"></i></span><span class="action-count">${formatNumber(comments)}</span></button>
      <button class="action save-btn ${isSaved ? "saved" : ""}" data-action="save"><span class="action-icon"><i class="fas fa-bookmark"></i></span><span class="action-count">${formatNumber(saves)}</span></button>
      <button class="action share-btn" data-action="share"><span class="action-icon"><i class="fas fa-share"></i></span><span class="action-count">${formatNumber(shares)}</span></button>
    </div>
    <button class="sound-btn" data-action="sound"><i class="fas fa-volume-up"></i></button>
    <div class="video-info">
      <div class="username" onclick="window.location.href='./profile.html?uid=${creatorId}'" style="cursor:pointer;">@${escapeHtml(username)}</div>
      <div class="caption">${escapeHtml(caption)}</div>
      <div class="sound">${escapeHtml(sound)}</div>
    </div>
    <div class="pause-indicator"><i class="fas fa-pause"></i></div>
  `;

  const videoEl = item.querySelector(".video");
  const loader = item.querySelector(".video-loader");

  videoEl.addEventListener("loadeddata", () => {
    loader.style.display = "none";
  });
  videoEl.addEventListener("playing", () => {
    loader.style.display = "none";
  });
  videoEl.addEventListener("waiting", () => {
    loader.style.display = "flex";
  });
  videoEl.addEventListener("error", () => {
    loader.style.display = "none";
    console.error("Video error:", url);
  });

  item.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    togglePlayPause(item);
  });

  return item;
}

function togglePlayPause(item) {
  const video = item.querySelector(".video");
  const indicator = item.querySelector(".pause-indicator");
  if (video.paused) {
    playVideo(video);
    indicator.classList.remove("show");
  } else {
    video.pause();
    indicator.classList.add("show");
  }
}

async function playVideo(video) {
  if (currentPlayingVideo && currentPlayingVideo !== video) {
    try {
      currentPlayingVideo.pause();
    } catch (e) {}
  }
  currentPlayingVideo = video;
  video.muted = true;
  try {
    await video.play();
  } catch (e) {
    console.warn("Play error:", e);
  }
}

function setupVideoObserver() {
  if (observer) observer.disconnect();
  const items = [...document.querySelectorAll(".video-item")];
  if (!items.length) return;
  observer = new IntersectionObserver(() => {
    items.forEach(item => {
      const video = item.querySelector(".video");
      const rect = item.getBoundingClientRect();
      const visible = Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top);
      const percentage = visible / window.innerHeight;
      if (percentage > 0.6) playVideo(video);
      else video.pause();
    });
  }, {
    threshold: [0.3, 0.5, 0.7, 0.9]
  });
  items.forEach(item => observer.observe(item));
  const first = items[0];
  if (first) {
    setTimeout(() => {
      const v = first.querySelector(".video");
      if (v) playVideo(v);
    }, 300);
  }
}

document.getElementById("feed")?.addEventListener("click", async (e) => {
  const tab = e.target.closest("[data-tab]");
  if (tab) {
    currentFeed = tab.dataset.tab === "following" ? "following" : "foryou";
    renderFeed();
    return;
  }

  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const item = btn.closest(".video-item");
  if (!item) return;
  const videoId = item.dataset.videoId;
  const action = btn.dataset.action;

  if (action === "like") await toggleLike(videoId, btn);
  else if (action === "save") await toggleSave(videoId, btn);
  else if (action === "comment") await openComments(videoId);
  else if (action === "share") await shareVideo(videoId, btn);
  else if (action === "follow") await toggleFollow(btn.dataset.creator, btn);
  else if (action === "sound") toggleSound(item, btn);
});

async function toggleLike(videoId, btn) {
  if (!currentUser) {
    showToast("Please login first");
    return;
  }
  if (btn.disabled) return;
  btn.disabled = true;

  try {
    const videoRef = doc(db, "videos", videoId);
    const result = await runTransaction(db, async (t) => {
      const snap = await t.get(videoRef);
      if (!snap.exists()) throw new Error("NOT_FOUND");
      const data = snap.data();
      const likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
      const already = likedBy.includes(currentUser.uid);
      const newLikedBy = already ? likedBy.filter(u => u !== currentUser.uid) : [...likedBy, currentUser.uid];
      const newLikes = Math.max(0, number(data.likes) + (already ? -1 : 1));
      t.update(videoRef, {
        likedBy: newLikedBy,
        likes: newLikes
      });
      return {
        liked: !already,
        likes: newLikes
      };
    });

    btn.classList.toggle("liked", result.liked);
    btn.querySelector(".action-count").textContent = formatNumber(result.likes);
    showToast(result.liked ? "❤️ Liked" : "Like removed");
  } catch (e) {
    console.error("Like error:", e);
    showToast("Like failed");
  }
  btn.disabled = false;
}

async function toggleSave(videoId, btn) {
  if (!currentUser) {
    showToast("Please login first");
    return;
  }
  if (btn.disabled) return;
  btn.disabled = true;

  try {
    const videoRef = doc(db, "videos", videoId);
    const userRef = doc(db, "users", currentUser.uid);

    const result = await runTransaction(db, async (t) => {
      const vs = await t.get(videoRef);
      if (!vs.exists()) throw new Error("NOT_FOUND");
      const data = vs.data();
      const savedBy = Array.isArray(data.savedBy) ? data.savedBy : [];
      const already = savedBy.includes(currentUser.uid);
      const newSavedBy = already ? savedBy.filter(u => u !== currentUser.uid) : [...savedBy, currentUser.uid];
      const newSaves = Math.max(0, number(data.saves) + (already ? -1 : 1));
      t.update(videoRef, {
        savedBy: newSavedBy,
        saves: newSaves
      });

      const us = await t.get(userRef);
      const uData = us.exists() ? us.data() : {};
      const oldSaved = Array.isArray(uData.savedVideoIds) ? uData.savedVideoIds : [];
      const newUserSaved = already ? oldSaved.filter(id => id !== videoId) : (oldSaved.includes(videoId) ? oldSaved : [...oldSaved, videoId]);
      t.set(userRef, {
        savedVideoIds: newUserSaved
      }, {
        merge: true
      });

      return {
        saved: !already,
        saves: newSaves
      };
    });

    btn.classList.toggle("saved", result.saved);
    btn.querySelector(".action-count").textContent = formatNumber(result.saves);
    showToast(result.saved ? "🔖 Saved" : "Removed from saved");
  } catch (e) {
    console.error("Save error:", e);
    showToast("Save failed");
  }
  btn.disabled = false;
}

async function toggleFollow(targetUid, btn) {
  if (!currentUser || !targetUid || targetUid === currentUser.uid) return;
  btn.disabled = true;

  try {
    const myRef = doc(db, "users", currentUser.uid);
    const targetRef = doc(db, "users", targetUid);

    const result = await runTransaction(db, async (t) => {
      const ms = await t.get(myRef);
      const ts = await t.get(targetRef);
      if (!ms.exists() || !ts.exists()) throw new Error("PROFILE_NOT_FOUND");
      const mData = ms.data(),
        tData = ts.data();
      const following = Array.isArray(mData.followingIds) ? mData.followingIds : [];
      const followers = Array.isArray(tData.followerIds) ? tData.followerIds : [];
      const already = following.includes(targetUid);

      if (already) {
        t.update(myRef, {
          followingIds: following.filter(id => id !== targetUid),
          following: Math.max(0, number(mData.following) - 1)
        });
        t.update(targetRef, {
          followerIds: followers.filter(id => id !== currentUser.uid),
          followers: Math.max(0, number(tData.followers) - 1)
        });
      } else {
        t.update(myRef, {
          followingIds: [...following, targetUid],
          following: number(mData.following) + 1
        });
        t.update(targetRef, {
          followerIds: [...followers, currentUser.uid],
          followers: number(tData.followers) + 1
        });
      }
      return {
        following: !already
      };
    });

    btn.classList.toggle("following", result.following);
    btn.textContent = result.following ? "✓" : "+";
    const ms = await getDoc(doc(db, "users", currentUser.uid));
    if (ms.exists()) currentProfile = ms.data();
    showToast(result.following ? "✅ Following" : "Unfollowed");
  } catch (e) {
    console.error("Follow error:", e);
    showToast("Follow failed");
  }
  btn.disabled = false;
}

function toggleSound(item, btn) {
  const video = item.querySelector(".video");
  if (video.muted) {
    video.muted = false;
    btn.innerHTML = '<i class="fas fa-volume-up"></i>';
    playVideo(video);
    showToast("🔊 Sound On");
  } else {
    video.muted = true;
    btn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    showToast("🔇 Sound Off");
  }
}

async function shareVideo(videoId, btn) {
  if (!currentUser) {
    showToast("Please login first");
    return;
  }
  if (btn.disabled) return;
  btn.disabled = true;

  try {
    const videoRef = doc(db, "videos", videoId);
    const snap = await getDoc(videoRef);
    if (snap.exists()) {
      const newShares = number(snap.data().shares) + 1;
      await updateDoc(videoRef, {
        shares: newShares
      });
      btn.querySelector(".action-count").textContent = formatNumber(newShares);
    }

    const url = new URL(window.location.href);
    url.searchParams.set("video", videoId);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "WWC",
          text: "Check this video",
          url: url.toString()
        });
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(url.toString());
      showToast("🔗 Link Copied");
    }
  } catch (e) {
    console.error("Share error:", e);
    showToast("Share failed");
  }
  btn.disabled = false;
}

async function openComments(videoId) {
  currentVideoId = videoId;
  document.getElementById("commentPanel").classList.add("open");
  await loadComments(videoId);
}

window.closeComments = function() {
  document.getElementById("commentPanel").classList.remove("open");
};

async function loadComments(videoId) {
  const list = document.getElementById("commentsList");
  if (!list) return;
  list.innerHTML = '<div style="text-align:center;color:#888;padding:25px;">Loading...</div>';
  try {
    const snap = await withTimeout(getDocs(collection(db, "videos", videoId, "comments")), 8000);
    list.innerHTML = "";
    if (snap.empty) {
      list.innerHTML = '<div style="text-align:center;color:#777;padding:30px;">No comments yet.</div>';
      return;
    }
    const comments = [];
    snap.forEach(d => comments.push({ id: d.id, ...d.data() }));
    comments.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    comments.forEach(data => {
      const div = document.createElement("div");
      div.className = "comment";
      div.innerHTML = `<strong>${escapeHtml(data.username || data.name || "WWC User")}</strong>${escapeHtml(data.text || "")}`;
      list.appendChild(div);
    });
  } catch (e) {
    list.innerHTML = '<div style="text-align:center;color:#ff667f;padding:25px;">Could not load comments</div>';
  }
}

window.addComment = async function() {
  const input = document.getElementById("commentInput");
  if (!input) return;
  const text = input.value.trim();
  if (!text || !currentUser || !currentVideoId) return;

  try {
    const videoRef = doc(db, "videos", currentVideoId);
    const username = String(currentProfile.username || currentProfile.name || "WWC User").replace(/^@/, "");

    await addDoc(collection(db, "videos", currentVideoId, "comments"), {
      uid: currentUser.uid,
      username: username,
      name: currentProfile.name || "WWC User",
      photoURL: currentProfile.photoURL || defaultPhoto,
      text: text,
      createdAt: serverTimestamp()
    });

    const vs = await getDoc(videoRef);
    const newComments = number(vs.data()?.comments) + 1;
    await updateDoc(videoRef, {
      comments: newComments
    });

    input.value = "";
    await loadComments(currentVideoId);
    const item = document.querySelector(`.video-item[data-video-id="${CSS.escape(currentVideoId)}"]`);
    if (item) {
      const btn = item.querySelector('[data-action="comment"]');
      if (btn) btn.querySelector(".action-count").textContent = formatNumber(newComments);
    }
    showToast("💬 Comment Added");
  } catch (e) {
    console.error("Comment error:", e);
    showToast("Comment failed");
  }
};

document.getElementById("commentInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    window.addComment();
  }
});

async function loadCurrentProfile() {
  if (!currentUser) return;
  try {
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    if (snap.exists()) {
      currentProfile = snap.data();
    }
  } catch (e) {
    console.error("Profile error:", e);
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    document.getElementById("feed").innerHTML = `
      <div class="feed-message">
        <div class="feed-message-inner">
          <div class="feed-message-icon">🔐</div>
          <div>Please login to continue</div>
          <button class="retry-btn" onclick="window.location.href='./auth.html'">Login</button>
        </div>
      </div>`;
    return;
  }
  currentUser = user;
  await loadCurrentProfile();
  await loadVideos();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    document.querySelectorAll(".video").forEach(v => v.pause());
  } else {
    const items = [...document.querySelectorAll(".video-item")];
    let best = null,
      bestRatio = 0;
    items.forEach(item => {
      const rect = item.getBoundingClientRect();
      const visible = Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top);
      const ratio = visible / window.innerHeight;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = item;
      }
    });
    if (best) {
      const v = best.querySelector(".video");
      if (v) playVideo(v);
    }
  }
});

console.log('✅ WWC Home Page Loaded - All buttons fixed!');
