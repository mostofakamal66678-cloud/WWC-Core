/* =========================================================
   WORLD WIDE CONNECT - WWC CORE
   COMPLETE APP.JS
   ========================================================= */

"use strict";

import { getApps, initializeApp }
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  getFirestore, doc, getDoc, setDoc, addDoc,
  collection, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* ================= FIREBASE ================= */

const firebaseConfig = {
  apiKey: "AIzaSyCgio17aPEfR7d6juqIhn3yi6Mf65W_tO4",
  authDomain: "world-wide-connect-62c87.firebaseapp.com",
  projectId: "world-wide-connect-62c87",
  storageBucket: "world-wide-connect-62c87.firebasestorage.app",
  messagingSenderId: "93178453668",
  appId: "1:93178453668:web:2184630caae8e61f7445031",
  measurementId: "G-PKFJ5NEMGQ"
};

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let activeCommentVideo = null;


/* ================= START ================= */

function startWWC() {
  console.log("🌍 WWC-Core starting...");

  setupAuth();
  setupNavigation();
  setupLogout();

  setupVideoFeed();
  setupLikes();
  setupComments();
  setupSaves();
  setupShares();
  setupFollows();

  setupSearch();
  setupSearchClear();
  setupMuteButtons();
  setupPlayButtons();
  setupProfileLinks();

  updateNotificationCount();

  console.log("✅ WWC-Core ready");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startWWC, { once:true });
} else {
  startWWC();
}


/* ================= AUTH ================= */

function setupAuth() {
  onAuthStateChanged(auth, async user => {
    currentUser = user || null;

    if (user) {
      await createProfile(user);
      updateLoginUI(true, user);
      console.log("✅ Login:", user.email || user.uid);
    } else {
      updateLoginUI(false, null);
      console.log("ℹ️ User not logged in");
    }
  });
}

async function createProfile(user) {
  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        name: user.displayName || "WWC User",
        username: "wwc_user",
        email: user.email || "",
        bio: "Welcome to my WWC profile 🌍",
        photoURL: user.photoURL || "",
        dob: "",
        age: "",
        gender: "",
        country: "Bangladesh",
        followers: 0,
        following: 0,
        likes: 0,
        createdAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Profile error:", error);
  }
}

function updateLoginUI(loggedIn, user) {
  document.querySelectorAll(".login-btn,#loginBtn").forEach(b => {
    b.style.display = loggedIn ? "none" : "";
  });

  document.querySelectorAll(".logout-btn,#logoutBtn,.logout-menu-btn").forEach(b => {
    b.style.display = loggedIn ? "" : "none";
  });

  document.querySelectorAll(".current-user-name").forEach(el => {
    el.textContent = user
      ? (user.displayName || user.email || "WWC User")
      : "Guest";
  });
}

async function logoutUser() {
  try {
    await signOut(auth);
    window.location.href = "./auth.html";
  } catch (error) {
    console.error("Logout error:", error);
    showMessage("❌ Logout করা যায়নি");
  }
}

function setupLogout() {
  document.querySelectorAll("#logoutBtn,.logout-btn,.logout-menu-btn").forEach(b => {
    if (b.dataset.wwcReady) return;
    b.dataset.wwcReady = "true";

    b.addEventListener("click", e => {
      e.preventDefault();
      logoutUser();
    });
  });
}


/* ================= NAVIGATION ================= */

function setupNavigation() {
  document.querySelectorAll("#homeBtn,.home-btn").forEach(b => {
    b.addEventListener("click", () => {
      location.href = "./index.html";
    });
  });

  document.querySelectorAll("#profileBtn,.profile-btn").forEach(b => {
    b.addEventListener("click", () => {
      location.href = currentUser ? "./profile.html" : "./auth.html";
    });
  });

  document.querySelectorAll("#uploadBtn,.upload-btn,#createBtn").forEach(b => {
    b.addEventListener("click", () => {
      location.href = currentUser ? "./upload.html" : "./auth.html";
    });
  });

  document.querySelectorAll("#friendsBtn").forEach(b => {
    b.addEventListener("click", () => showMessage("👥 Friends feature প্রস্তুত করা হচ্ছে"));
  });

  document.querySelectorAll("#inboxBtn").forEach(b => {
    b.addEventListener("click", () => showMessage("💬 Inbox feature প্রস্তুত করা হচ্ছে"));
  });
}


/* ================= VIDEO FEED ================= */

function setupVideoFeed() {
  const feed = document.getElementById("video-feed");
  if (!feed) return;

  const videos = [...feed.querySelectorAll("video")];
  if (!videos.length) return;

  videos.forEach(video => {
    video.setAttribute("playsinline", "");
    video.setAttribute("preload", "metadata");
    video.muted = true;

    video.addEventListener("play", () => {
      videos.forEach(other => {
        if (other !== video) other.pause();
      });
    });

    video.addEventListener("click", () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    });

    video.addEventListener("ended", () => {
      const item = video.closest(".video-item");
      const next = item?.nextElementSibling;

      if (next?.classList.contains("video-item")) {
        next.scrollIntoView({ behavior:"smooth", block:"start" });
        const nextVideo = next.querySelector("video");
        if (nextVideo) setTimeout(() => nextVideo.play().catch(() => {}), 250);
      }
    });
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;

        if (entry.isIntersecting && entry.intersectionRatio >= .65) {
          videos.forEach(v => {
            if (v !== video) v.pause();
          });
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold:[.25,.5,.65,.8,.95] });

    videos.forEach(v => observer.observe(v));
  }
}


/* ================= STORAGE ================= */

function getStore(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function setStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Storage error:", error);
  }
}

function getVideoId(item) {
  if (!item) return "";

  if (item.dataset.videoId) return item.dataset.videoId;

  const video = item.querySelector("video");
  const source = video?.querySelector("source");

  const url = video?.currentSrc || video?.src || source?.src || "";

  if (url) {
    try {
      item.dataset.videoId =
        "video-" + btoa(url).replace(/[^a-zA-Z0-9]/g,"").slice(0,30);
    } catch {
      item.dataset.videoId = "video-" + Date.now();
    }
  } else {
    item.dataset.videoId = "video-" + Date.now();
  }

  return item.dataset.videoId;
}


/* ================= LIKE ================= */

function setupLikes() {
  document.querySelectorAll(".like-btn,#likeBtn").forEach(button => {
    if (button.dataset.ready) return;
    button.dataset.ready = "true";

    const item = button.closest(".video-item");
    if (!item) return;

    const id = getVideoId(item);
    loadLike(button,id);

    button.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();

      const likes = getStore("wwc_likes",{});
      const liked = getStore("wwc_liked_videos",[]);
      const isLiked = liked.includes(id);

      let count = Number(likes[id] || 0);

      if (isLiked) {
        count = Math.max(0,count-1);
        liked.splice(liked.indexOf(id),1);
      } else {
        count++;
        liked.push(id);
      }

      likes[id] = count;

      setStore("wwc_likes",likes);
      setStore("wwc_liked_videos",liked);

      button.classList.toggle("liked",!isLiked);
      button.setAttribute("aria-pressed",String(!isLiked));

      const countEl = button.querySelector(".like-count");
      if (countEl) countEl.textContent = count;

      notify(isLiked ? "Like সরিয়ে নেওয়া হয়েছে" : "❤️ ভিডিওতে Like দিয়েছেন");
    });
  });
}

function loadLike(button,id) {
  const likes = getStore("wwc_likes",{});
  const liked = getStore("wwc_liked_videos",[]);
  const isLiked = liked.includes(id);

  const countEl = button.querySelector(".like-count");
  if (countEl) countEl.textContent = Number(likes[id] || 0);

  button.classList.toggle("liked",isLiked);
  button.setAttribute("aria-pressed",String(isLiked));
}


/* ================= COMMENT ================= */

function setupComments() {
  document.querySelectorAll(".comment-btn,#commentBtn").forEach(button => {
    if (button.dataset.ready) return;
    button.dataset.ready = "true";

    button.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();

      const item = button.closest(".video-item");
      activeCommentVideo = item ? getVideoId(item) : null;

      const box = document.getElementById("commentBox");
      const input = document.getElementById("commentInput");

      if (box) box.style.display = "block";
      if (input) input.focus();
    });
  });

  const cancel = document.getElementById("commentCancel");
  const send = document.getElementById("commentSend");

  cancel?.addEventListener("click", closeComment);

  send?.addEventListener("click", async () => {
    const input = document.getElementById("commentInput");
    const text = input?.value.trim();

    if (!text) {
      showMessage("⚠️ আগে Comment লিখুন");
      return;
    }

    if (!activeCommentVideo) {
      showMessage("❌ ভিডিও পাওয়া যায়নি");
      return;
    }

    const data = {
      videoId: activeCommentVideo,
      text,
      uid: currentUser?.uid || "guest",
      name: currentUser?.displayName || currentUser?.email || "Guest",
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db,"comments"),data);
    } catch (error) {
      console.error("Firestore comment error:",error);

      const comments = getStore("wwc_comments",{});
      comments[activeCommentVideo] ||= [];
      comments[activeCommentVideo].push({
        text,
        uid:data.uid,
        name:data.name,
        time:new Date().toISOString()
      });
      setStore("wwc_comments",comments);
    }

    notify("💬 Comment সংরক্ষণ হয়েছে");
    showMessage("✅ Comment পাঠানো হয়েছে");
    closeComment();
  });
}

function closeComment() {
  const box = document.getElementById("commentBox");
  const input = document.getElementById("commentInput");

  if (input) input.value = "";
  if (box) box.style.display = "none";

  activeCommentVideo = null;
}


/* ================= SAVE ================= */

function setupSaves() {
  document.querySelectorAll(".save-btn,#saveBtn").forEach(button => {
    if (button.dataset.ready) return;
    button.dataset.ready = "true";

    const item = button.closest(".video-item");
    if (!item) return;

    const id = getVideoId(item);
    const saved = getStore("wwc_saved_videos",[]);
    const active = saved.includes(id);

    updateSave(button,active);

    button.addEventListener("click",e => {
      e.preventDefault();
      e.stopPropagation();

      const list = getStore("wwc_saved_videos",[]);
      const index = list.indexOf(id);

      let nowSaved;

      if (index >= 0) {
        list.splice(index,1);
        nowSaved = false;
      } else {
        list.push(id);
        nowSaved = true;
      }

      setStore("wwc_saved_videos",list);
      updateSave(button,nowSaved);

      showMessage(nowSaved ? "🔖 ভিডিও Save হয়েছে" : "🔖 Save সরানো হয়েছে");
    });
  });
}

function updateSave(button,active) {
  button.classList.toggle("saved",active);
  button.setAttribute("aria-pressed",String(active));

  const count = button.querySelector(".save-count");
  if (count) count.textContent = active ? "1" : "0";
}


/* ================= SHARE ================= */

function setupShares() {
  document.querySelectorAll(".share-btn,#shareBtn").forEach(button => {
    if (button.dataset.ready) return;
    button.dataset.ready = "true";

    button.addEventListener("click",async e => {
      e.preventDefault();
      e.stopPropagation();

      const item = button.closest(".video-item");
      if (!item) return;

      const id = getVideoId(item);
      const url = new URL(location.href);
      url.searchParams.set("video",id);

      const data = {
        title:"World Wide Connect",
        text:"এই ভিডিওটি World Wide Connect-এ দেখুন 🌍",
        url:url.href
      };

      try {
        if (navigator.share) {
          await navigator.share(data);
          showMessage("✅ Share করা হয়েছে");
        } else {
          await copyText(url.href);
          showMessage("🔗 ভিডিও Link Copy হয়েছে");
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          try {
            await copyText(url.href);
            showMessage("🔗 Link Copy হয়েছে");
          } catch {
            showMessage("❌ Share করা যায়নি");
          }
        }
      }
    });
  });
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.focus();
  area.select();
  document.execCommand("copy");
  area.remove();
}


/* ================= FOLLOW ================= */

function setupFollows() {
  document.querySelectorAll(".follow-btn,#followBtn").forEach(button => {
    if (button.dataset.ready) return;
    button.dataset.ready = "true";

    const item = button.closest(".video-item");
    const userEl = item?.querySelector(".username");

    const target =
      button.dataset.uid ||
      item?.dataset.uid ||
      userEl?.textContent.trim() ||
      "wwc_user";

    const key = "wwc_following_" + target;
    updateFollow(button,getStore(key,false));

    button.addEventListener("click",e => {
      e.preventDefault();
      e.stopPropagation();

      if (!currentUser) {
        location.href = "./auth.html";
        return;
      }

      const now = !getStore(key,false);
      setStore(key,now);
      updateFollow(button,now);

      notify(now ? "✅ Follow করা হয়েছে" : "Follow সরিয়ে নেওয়া হয়েছে");
      showMessage(now ? "✅ Following" : "Follow সরানো হয়েছে");
    });
  });
}

function updateFollow(button,following) {
  button.textContent = following ? "Following" : "Follow";
  button.classList.toggle("following",following);
  button.setAttribute("aria-pressed",String(following));
}


/* ================= SEARCH ================= */

function setupSearch() {
  const input = document.querySelector("#searchInput,.search-input");
  const button = document.querySelector("#searchBtn,.search-btn");

  function search(value) {
    const q = String(value || "").trim().toLowerCase();

    if (!q) {
      showMessage("⚠️ কিছু লিখে Search করুন");
      return;
    }

    let found = 0;

    document.querySelectorAll(
      ".video-item,.user-item,.search-item"
    ).forEach(item => {
      const match = item.textContent.toLowerCase().includes(q);
      item.style.display = match ? "" : "none";
      if (match) found++;
    });

    showMessage(
      found
        ? `🔎 ${found} টি ফলাফল পাওয়া গেছে`
        : "❌ কিছু পাওয়া যায়নি"
    );
  }

  button?.addEventListener("click",e => {
    e.preventDefault();

    if (input) {
      search(input.value);
    } else {
      const q = prompt("কী খুঁজছেন?");
      if (q !== null) search(q);
    }
  });

  input?.addEventListener("keydown",e => {
    if (e.key === "Enter") {
      e.preventDefault();
      search(input.value);
    }
  });
}

function setupSearchClear() {
  const button = document.querySelector("#clearSearch,.clear-search");
  if (!button) return;

  button.addEventListener("click",() => {
    const input = document.querySelector("#searchInput,.search-input");
    if (input) input.value = "";

    document.querySelectorAll(
      ".video-item,.user-item,.search-item"
    ).forEach(item => item.style.display = "");
  });
}


/* ================= MUTE / PLAY ================= */

function setupMuteButtons() {
  document.querySelectorAll(".mute-btn,#muteBtn").forEach(button => {
    if (button.dataset.ready) return;
    button.dataset.ready = "true";

    button.addEventListener("click",e => {
      e.preventDefault();
      e.stopPropagation();

      const video =
        button.closest(".video-item")?.querySelector("video");

      if (!video) return;

      video.muted = !video.muted;
      button.textContent = video.muted ? "🔇" : "🔊";
    });
  });
}

function setupPlayButtons() {
  document.querySelectorAll(".play-btn,#playBtn").forEach(button => {
    if (button.dataset.ready) return;
    button.dataset.ready = "true";

    button.addEventListener("click",e => {
      e.preventDefault();
      e.stopPropagation();

      const video =
        button.closest(".video-item")?.querySelector("video");

      if (!video) return;

      if (video.paused) {
        video.play().catch(() => {});
        button.textContent = "⏸️";
      } else {
        video.pause();
        button.textContent = "▶️";
      }
    });
  });
}


/* ================= PROFILE LINKS ================= */

function setupProfileLinks() {
  document.querySelectorAll(
    "[data-profile-uid],.profile-link"
  ).forEach(element => {
    if (element.dataset.ready) return;
    element.dataset.ready = "true";

    element.addEventListener("click",e => {
      e.preventDefault();

      const uid =
        element.dataset.profileUid ||
        element.dataset.uid;

      if (uid) {
        location.href =
          "./profile.html?uid=" + encodeURIComponent(uid);
      } else {
        location.href =
          currentUser ? "./profile.html" : "./auth.html";
      }
    });
  });
}


/* ================= NOTIFICATIONS ================= */

function notify(text) {
  const list = getStore("wwc_notifications",[]);

  list.unshift({
    text,
    time:new Date().toISOString(),
    read:false
  });

  if (list.length > 50) list.pop();

  setStore("wwc_notifications",list);
  updateNotificationCount();
}

function updateNotificationCount() {
  const list = getStore("wwc_notifications",[]);
  const unread = list.filter(x => !x.read).length;

  document.querySelectorAll(
    ".notification-count,#notificationCount"
  ).forEach(el => {
    el.textContent = unread > 99 ? "99+" : String(unread);
    el.style.display = unread ? "" : "none";
  });
}


/* ================= MESSAGE ================= */

function showMessage(text) {
  let box = document.getElementById("wwcMessage");

  if (!box) {
    box = document.createElement("div");
    box.id = "wwcMessage";

    Object.assign(box.style,{
      position:"fixed",
      left:"50%",
      bottom:"25px",
      transform:"translateX(-50%)",
      zIndex:"99999",
      padding:"12px 18px",
      borderRadius:"10px",
      background:"#222",
      color:"#fff",
      fontSize:"14px",
      maxWidth:"90%",
      textAlign:"center",
      boxShadow:"0 5px 20px rgba(0,0,0,.4)"
    });

    document.body.appendChild(box);
  }

  box.textContent = text;
  box.style.display = "block";

  clearTimeout(window.wwcMessageTimer);

  window.wwcMessageTimer = setTimeout(() => {
    box.style.display = "none";
  },2500);
}


/* ================= GLOBAL API ================= */

window.WWC = {
  getCurrentUser: () => currentUser,
  logout: () => logoutUser(),
  getAuth: () => auth,
  getFirestore: () => db,
  getVideoId: item => getVideoId(item),
  showMessage: text => showMessage(text)
};

console.log("🌍 WWC-Core APP.JS loaded successfully");
