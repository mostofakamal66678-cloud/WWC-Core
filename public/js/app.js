// =========================================================
// WORLD WIDE CONNECT - WWC-CORE
// MAIN APP.JS - ALL BUTTONS WORKING
// =========================================================

import { auth, db } from "../core/firebase.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// =========================================================
// GLOBAL STATE
// =========================================================

let currentUser = null;
let currentUserProfile = null;
let currentCommentVideoId = null;
const DEFAULT_PHOTO = "./images/profile.png";

// =========================================================
// PAGE NAVIGATION - ALL BUTTONS
// =========================================================

function goTo(page) {
    window.location.href = "./" + page;
}

// =========================================================
// AUTH STATE
// =========================================================

onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        console.log("🌍 WWC Login:", user.email || user.uid);
        currentUserProfile = await loadCurrentUserProfile(user);
        updateLoginUI();
        refreshUserStates();
    } else {
        console.log("WWC Guest Mode");
        currentUserProfile = null;
        updateLoginUI();
    }
});

// =========================================================
// LOAD USER PROFILE
// =========================================================

async function loadCurrentUserProfile(user) {
    if (!user) return null;
    try {
        const userRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
            return { uid: user.uid, ...snapshot.data() };
        }
        const profile = {
            uid: user.uid,
            name: user.displayName || "WWC User",
            username: "wwc_" + user.uid.substring(0, 6),
            email: user.email || "",
            photoURL: user.photoURL || DEFAULT_PHOTO,
            bio: "Welcome to World Wide Connect 🌍",
            gender: "",
            country: "",
            dob: "",
            followersCount: 0,
            followingCount: 0,
            likesCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        await setDoc(userRef, profile);
        return { uid: user.uid, ...profile };
    } catch (error) {
        console.error("Profile loading error:", error);
        return null;
    }
}

// =========================================================
// UPDATE LOGIN UI
// =========================================================

function updateLoginUI() {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    if (!loginBtn || !logoutBtn) return;
    if (currentUser) {
        loginBtn.style.display = "none";
        logoutBtn.style.display = "flex";
    } else {
        loginBtn.style.display = "flex";
        logoutBtn.style.display = "none";
    }
}

// =========================================================
// ========== ALL NAVIGATION BUTTONS ==========
// =========================================================

// 1. HOME BUTTON
document.getElementById("homeBtn")?.addEventListener("click", () => goTo("index.html"));

// 2. FRIENDS BUTTON
document.getElementById("friendsBtn")?.addEventListener("click", () => {
    if (!currentUser) { goTo("auth.html"); return; }
    goTo("friends.html");
});

// 3. UPLOAD BUTTON
document.getElementById("uploadBtn")?.addEventListener("click", () => {
    if (!currentUser) { alert("🔐 Video Upload করতে Login করুন।"); goTo("auth.html"); return; }
    goTo("upload.html");
});

// 4. INBOX BUTTON
document.getElementById("inboxBtn")?.addEventListener("click", () => {
    if (!currentUser) { goTo("auth.html"); return; }
    goTo("inbox.html");
});

// 5. PROFILE BUTTON
document.getElementById("profileBtn")?.addEventListener("click", () => {
    if (!currentUser) { goTo("auth.html"); return; }
    goTo("profile.html");
});

// =========================================================
// SEARCH BUTTON
// =========================================================

document.getElementById("searchBtn")?.addEventListener("click", async () => {
    const text = prompt("🔍 Username লিখুন");
    if (!text) return;
    const username = text.trim().replace(/^@/, "");
    if (!username) return;
    try {
        const usersQuery = query(collection(db, "users"), where("username", "==", username), limit(1));
        const result = await getDocs(usersQuery);
        if (result.empty) {
            alert("❌ এই username-এর কোনো User পাওয়া যায়নি।");
            return;
        }
        const userDoc = result.docs[0];
        goTo("user-profile.html?uid=" + encodeURIComponent(userDoc.id));
    } catch (error) {
        console.error("Search error:", error);
        alert("❌ Search করা যায়নি।");
    }
});

// =========================================================
// PROFILE MENU
// =========================================================

const profileMenu = document.getElementById("profileMenu");
const profileMenuClose = document.getElementById("profileMenuClose");
const profileBtnMenu = document.getElementById("profileBtnMenu");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

function openProfileMenu() {
    if (!profileMenu) return;
    profileMenu.classList.add("show");
    profileMenu.setAttribute("aria-hidden", "false");
}

function closeProfileMenu() {
    if (!profileMenu) return;
    profileMenu.classList.remove("show");
    profileMenu.setAttribute("aria-hidden", "true");
}

profileMenuClose?.addEventListener("click", closeProfileMenu);

profileBtnMenu?.addEventListener("click", () => {
    closeProfileMenu();
    if (!currentUser) { goTo("auth.html"); return; }
    goTo("profile.html");
});

loginBtn?.addEventListener("click", () => {
    closeProfileMenu();
    goTo("auth.html");
});

logoutBtn?.addEventListener("click", async () => {
    try {
        await signOut(auth);
        closeProfileMenu();
        alert("✅ Logout সফল হয়েছে।");
        goTo("auth.html");
    } catch (error) {
        console.error("Logout error:", error);
        alert("❌ Logout করা যায়নি।");
    }
});

// =========================================================
// TOGGLE PROFILE MENU FROM PROFILE BUTTON
// =========================================================

document.getElementById("profileBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!currentUser) { goTo("auth.html"); return; }
    // Toggle profile menu
    if (profileMenu?.classList.contains("show")) {
        closeProfileMenu();
    } else {
        openProfileMenu();
    }
});

// =========================================================
// CLOSE PROFILE MENU ON OUTSIDE CLICK
// =========================================================

document.addEventListener("click", (event) => {
    if (profileMenu?.classList.contains("show") && 
        !profileMenu.contains(event.target) &&
        !document.getElementById("profileBtn")?.contains(event.target)) {
        closeProfileMenu();
    }
});

// =========================================================
// ESCAPE KEY
// =========================================================

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeProfileMenu();
        document.getElementById("commentBox")?.classList.remove("show");
    }
});

// =========================================================
// FOLLOW BUTTON ON VIDEO
// =========================================================

async function toggleFollow(button) {
    if (!currentUser) {
        alert("🔐 Follow করতে Login করুন।");
        goTo("auth.html");
        return;
    }
    const videoItem = button.closest(".video-item");
    if (!videoItem) return;
    const usernameElement = videoItem.querySelector(".profile-area .username");
    if (!usernameElement) return;
    const username = usernameElement.textContent.trim().replace(/^@/, "");
    if (!username) return;
    try {
        button.disabled = true;
        const targetUser = await findUserByUsername(username);
        if (!targetUser) { alert("❌ User পাওয়া যায়নি।"); return; }
        if (targetUser.uid === currentUser.uid) return;
        const followId = currentUser.uid + "_" + targetUser.uid;
        const followRef = doc(db, "follows", followId);
        const snapshot = await getDoc(followRef);
        if (snapshot.exists()) {
            await setDoc(followRef, { followerUid: currentUser.uid, followingUid: targetUser.uid, active: false, updatedAt: serverTimestamp() });
            await updateDoc(doc(db, "users", currentUser.uid), { followingCount: increment(-1), updatedAt: serverTimestamp() });
            await updateDoc(doc(db, "users", targetUser.uid), { followersCount: increment(-1), updatedAt: serverTimestamp() });
            button.classList.remove("following");
            button.textContent = "Follow";
        } else {
            await setDoc(followRef, { followerUid: currentUser.uid, followingUid: targetUser.uid, active: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
            await updateDoc(doc(db, "users", currentUser.uid), { followingCount: increment(1), updatedAt: serverTimestamp() });
            await updateDoc(doc(db, "users", targetUser.uid), { followersCount: increment(1), updatedAt: serverTimestamp() });
            button.classList.add("following");
            button.textContent = "Following";
        }
    } catch (error) {
        console.error("Follow error:", error);
        alert("❌ Follow পরিবর্তন করা যায়নি।");
    } finally {
        button.disabled = false;
    }
}

async function findUserByUsername(username) {
    const cleanUsername = String(username || "").trim().replace(/^@/, "");
    if (!cleanUsername) return null;
    const usersQuery = query(collection(db, "users"), where("username", "==", cleanUsername), limit(1));
    const snapshot = await getDocs(usersQuery);
    if (snapshot.empty) return null;
    const userDoc = snapshot.docs[0];
    return { uid: userDoc.id, ...userDoc.data() };
}

// =========================================================
// FOLLOW BUTTON EVENTS
// =========================================================

document.querySelectorAll(".video-item .follow-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleFollow(button);
    });
});

// =========================================================
// LIKE BUTTON
// =========================================================

async function toggleLike(button) {
    if (!currentUser) {
        alert("🔐 Like করতে Login করুন।");
        goTo("auth.html");
        return;
    }
    const videoItem = button.closest(".video-item");
    if (!videoItem) return;
    const videoId = videoItem.dataset.videoId;
    if (!videoId) return;
    const likeId = currentUser.uid + "_" + videoId;
    const likeRef = doc(db, "likes", likeId);
    const videoRef = doc(db, "videos", videoId);
    try {
        button.disabled = true;
        const snapshot = await getDoc(likeRef);
        if (snapshot.exists()) {
            await updateDoc(videoRef, { likeCount: increment(-1), updatedAt: serverTimestamp() });
            await setDoc(likeRef, { removed: true, uid: currentUser.uid, videoId, updatedAt: serverTimestamp() });
            button.classList.remove("liked");
            button.setAttribute("aria-pressed", "false");
        } else {
            await setDoc(likeRef, { uid: currentUser.uid, videoId, createdAt: serverTimestamp(), removed: false });
            await updateDoc(videoRef, { likeCount: increment(1), updatedAt: serverTimestamp() });
            button.classList.add("liked");
            button.setAttribute("aria-pressed", "true");
        }
        await loadVideoData(videoItem);
    } catch (error) {
        console.error("Like error:", error);
        alert("❌ Like পরিবর্তন করা যায়নি।");
    } finally {
        button.disabled = false;
    }
}

document.querySelectorAll(".like-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleLike(button);
    });
});

// =========================================================
// SAVE BUTTON
// =========================================================

async function toggleSave(button) {
    if (!currentUser) {
        alert("🔐 Video Save করতে Login করুন।");
        goTo("auth.html");
        return;
    }
    const videoItem = button.closest(".video-item");
    if (!videoItem) return;
    const videoId = videoItem.dataset.videoId;
    if (!videoId) return;
    const saveId = currentUser.uid + "_" + videoId;
    const saveRef = doc(db, "saves", saveId);
    const videoRef = doc(db, "videos", videoId);
    try {
        button.disabled = true;
        const snapshot = await getDoc(saveRef);
        const active = snapshot.exists() ? snapshot.data().active !== false : false;
        if (active) {
            await setDoc(saveRef, { uid: currentUser.uid, videoId, active: false, updatedAt: serverTimestamp() });
            await updateDoc(videoRef, { saveCount: increment(-1), updatedAt: serverTimestamp() });
            button.classList.remove("saved");
            button.setAttribute("aria-pressed", "false");
        } else {
            await setDoc(saveRef, { uid: currentUser.uid, videoId, active: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
            await updateDoc(videoRef, { saveCount: increment(1), updatedAt: serverTimestamp() });
            button.classList.add("saved");
            button.setAttribute("aria-pressed", "true");
        }
        await loadVideoData(videoItem);
    } catch (error) {
        console.error("Save error:", error);
        alert("❌ Video Save পরিবর্তন করা যায়নি।");
    } finally {
        button.disabled = false;
    }
}

document.querySelectorAll(".save-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleSave(button);
    });
});

// =========================================================
// LOAD VIDEO DATA
// =========================================================

async function loadVideoData(videoItem) {
    if (!videoItem) return;
    const videoId = videoItem.dataset.videoId;
    if (!videoId) return;
    try {
        const videoRef = doc(db, "videos", videoId);
        const snapshot = await getDoc(videoRef);
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        const likeCount = videoItem.querySelector(".like-count");
        const saveCount = videoItem.querySelector(".save-count");
        if (likeCount) likeCount.textContent = data.likeCount || 0;
        if (saveCount) saveCount.textContent = data.saveCount || 0;
    } catch (error) {
        console.warn("Video data error:", error);
    }
}

// =========================================================
// REFRESH USER STATES
// =========================================================

async function refreshUserStates() {
    if (!currentUser) return;
    const items = document.querySelectorAll(".video-item");
    for (const item of items) {
        await checkLikeState(item);
        await checkSaveState(item);
    }
}

async function checkLikeState(videoItem) {
    if (!currentUser || !videoItem) return;
    const videoId = videoItem.dataset.videoId;
    if (!videoId) return;
    const likeId = currentUser.uid + "_" + videoId;
    try {
        const likeRef = doc(db, "likes", likeId);
        const snapshot = await getDoc(likeRef);
        const button = videoItem.querySelector(".like-btn");
        if (!button) return;
        if (snapshot.exists()) {
            button.classList.add("liked");
            button.setAttribute("aria-pressed", "true");
        } else {
            button.classList.remove("liked");
            button.setAttribute("aria-pressed", "false");
        }
    } catch (error) {
        console.warn("Like state:", error);
    }
}

async function checkSaveState(videoItem) {
    if (!currentUser || !videoItem) return;
    const videoId = videoItem.dataset.videoId;
    if (!videoId) return;
    const saveId = currentUser.uid + "_" + videoId;
    try {
        const saveRef = doc(db, "saves", saveId);
        const snapshot = await getDoc(saveRef);
        const button = videoItem.querySelector(".save-btn");
        if (!button) return;
        if (snapshot.exists() && snapshot.data().active !== false) {
            button.classList.add("saved");
            button.setAttribute("aria-pressed", "true");
        }
    } catch (error) {
        console.warn("Save state:", error);
    }
}

// =========================================================
// VIDEO AUTOPLAY
// =========================================================

const videoFeed = document.getElementById("video-feed");
const videos = document.querySelectorAll(".feed-video");

if (videoFeed && videos.length) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const video = entry.target;
            if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
                videos.forEach((otherVideo) => {
                    if (otherVideo !== video) otherVideo.pause();
                });
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, { root: videoFeed, threshold: 0.65 });
    videos.forEach((video) => observer.observe(video));
}

// =========================================================
// VIDEO CLICK TO PLAY/PAUSE
// =========================================================

videos.forEach((video) => {
    video.addEventListener("click", (event) => {
        if (event.target.closest("button")) return;
        if (video.paused) {
            video.play().catch(() => {});
        } else {
            video.pause();
        }
    });
});

console.log("🌍 WWC-Core app.js loaded successfully - All buttons working!");
