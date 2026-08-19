/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   COMPLETE APP.JS
   ========================================================= */

"use strict";

/* =========================================================
   FIREBASE IMPORT
   ========================================================= */

import {
    getApps,
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {
    apiKey:
        "AIzaSyCgio17aPEfR7d6juqIhn3yi6Mf65W_tO4",

    authDomain:
        "world-wide-connect-62c87.firebaseapp.com",

    projectId:
        "world-wide-connect-62c87",

    storageBucket:
        "world-wide-connect-62c87.firebasestorage.app",

    messagingSenderId:
        "93178453668",

    appId:
        "1:93178453668:web:2184630caae8e61f7445031",

    measurementId:
        "G-PKFJ5NEMGQ"
};


/* =========================================================
   FIREBASE START
   ========================================================= */

const app =
    getApps().length
        ? getApps()[0]
        : initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let currentUser = null;

let activeVideoItem = null;

let commentTarget = null;

let feedObserver = null;


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "🌍 WWC-Core starting..."
        );

        setupAuthentication();

        setupNavigation();

        setupProfileMenu();

        setupVideoFeed();

        setupLikeButtons();

        setupCommentButtons();

        setupSaveButtons();

        setupShareButtons();

        setupFollowButtons();

        setupTopTabs();

        setupSearch();

        setupCommentBox();

        setupBottomNavigation();

        setupVideoClick();

        console.log(
            "✅ WWC-Core ready"
        );

    }
);


/* =========================================================
   AUTHENTICATION
   ========================================================= */

function setupAuthentication() {

    onAuthStateChanged(
        auth,
        async (user) => {

            currentUser = user;

            if (user) {

                console.log(
                    "✅ Logged in:",
                    user.email ||
                    user.displayName ||
                    user.uid
                );

                await createUserProfile(
                    user
                );

            } else {

                console.log(
                    "ℹ️ Guest mode"
                );

            }

            updateLoginUI(
                user
            );

            updateProfileUI(
                user
            );

        }
    );

}


/* =========================================================
   CREATE USER PROFILE
   ========================================================= */

async function createUserProfile(
    user
) {

    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const snapshot =
            await getDoc(
                userRef
            );

        if (!snapshot.exists()) {

            await setDoc(
                userRef,
                {

                    name:
                        user.displayName ||
                        "WWC User",

                    username:
                        "wwc_user_" +
                        user.uid
                            .slice(0, 6),

                    email:
                        user.email || "",

                    photoURL:
                        user.photoURL || "",

                    bio:
                        "Welcome to World Wide Connect 🌍",

                    followers:
                        0,

                    following:
                        0,

                    likes:
                        0,

                    createdAt:
                        new Date().toISOString()

                }
            );

            console.log(
                "✅ User profile created"
            );

        }

    } catch (error) {

        console.error(
            "Profile creation error:",
            error
        );

    }

}


/* =========================================================
   LOGIN UI
   ========================================================= */

function updateLoginUI(
    user
) {

    const loginButtons =
        document.querySelectorAll(
            "#loginBtn, .login-btn"
        );

    const logoutButtons =
        document.querySelectorAll(
            "#logoutBtn, .logout-btn, .logout-menu-btn"
        );

    loginButtons.forEach(
        button => {

            button.style.display =
                user
                    ? "none"
                    : "";

        }
    );

    logoutButtons.forEach(
        button => {

            button.style.display =
                user
                    ? ""
                    : "none";

        }
    );

}


/* =========================================================
   PROFILE UI
   ========================================================= */

function updateProfileUI(
    user
) {

    const names =
        document.querySelectorAll(
            ".current-user-name"
        );

    names.forEach(
        element => {

            element.textContent =
                user
                    ? (
                        user.displayName ||
                        user.email ||
                        "WWC User"
                    )
                    : "Guest";

        }
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutUser() {

    try {

        await signOut(
            auth
        );

        showMessage(
            "✅ Logout সফল হয়েছে"
        );

        setTimeout(
            () => {

                window.location.href =
                    "./auth.html";

            },
            700
        );

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        showMessage(
            "❌ Logout করা যায়নি"
        );

    }

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    /* LOGIN */

    const loginButtons =
        document.querySelectorAll(
            "#loginBtn, .login-btn"
        );

    loginButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    window.location.href =
                        "./auth.html";

                }
            );

        }
    );


    /* LOGOUT */

    const logoutButtons =
        document.querySelectorAll(
            "#logoutBtn, .logout-btn, .logout-menu-btn"
        );

    logoutButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    logoutUser();

                }
            );

        }
    );


    /* PROFILE */

    const profileButtons =
        document.querySelectorAll(
            "#profileBtn, #profileBtnMenu, .profile-btn"
        );

    profileButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    if (!currentUser) {

                        window.location.href =
                            "./auth.html";

                        return;

                    }

                    window.location.href =
                        "./profile.html";

                }
            );

        }
    );


    /* HOME */

    const homeButtons =
        document.querySelectorAll(
            "#homeBtn, .home-btn"
        );

    homeButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    window.location.href =
                        "./index.html";

                }
            );

        }
    );


    /* FRIENDS */

    const friendsButtons =
        document.querySelectorAll(
            "#friendsBtn, .friends-btn"
        );

    friendsButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    if (!currentUser) {

                        window.location.href =
                            "./auth.html";

                        return;

                    }

                    window.location.href =
                        "./friends.html";

                }
            );

        }
    );


    /* INBOX */

    const inboxButtons =
        document.querySelectorAll(
            "#inboxBtn, .inbox-btn"
        );

    inboxButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    if (!currentUser) {

                        window.location.href =
                            "./auth.html";

                        return;

                    }

                    window.location.href =
                        "./inbox.html";

                }
            );

        }
    );


    /* UPLOAD */

    const uploadButtons =
        document.querySelectorAll(
            "#uploadBtn, .upload-btn, #createBtn"
        );

    uploadButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    if (!currentUser) {

                        window.location.href =
                            "./auth.html";

                        return;

                    }

                    window.location.href =
                        "./upload.html";

                }
            );

        }
    );

}


/* =========================================================
   BOTTOM NAVIGATION
   ========================================================= */

function setupBottomNavigation() {

    const buttons =
        document.querySelectorAll(
            ".wwc-nav-btn"
        );

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    buttons.forEach(
                        other => {

                            other.classList.remove(
                                "active"
                            );

                        }
                    );

                    button.classList.add(
                        "active"
                    );

                }
            );

        }
    );

}


/* =========================================================
   PROFILE MENU
   ========================================================= */

function setupProfileMenu() {

    const profileButton =
        document.getElementById(
            "profileBtn"
        );

    const menu =
        document.getElementById(
            "profileMenu"
        );

    const closeButton =
        document.getElementById(
            "profileMenuClose"
        );


    if (
        !profileButton ||
        !menu
    ) {

        return;

    }


    profileButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            if (!currentUser) {

                window.location.href =
                    "./auth.html";

                return;

            }

            menu.classList.toggle(
                "show"
            );

            menu.setAttribute(
                "aria-hidden",
                menu.classList.contains(
                    "show"
                )
                    ? "false"
                    : "true"
            );

        }
    );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                menu.classList.remove(
                    "show"
                );

                menu.setAttribute(
                    "aria-hidden",
                    "true"
                );

            }
        );

    }

}


/* =========================================================
   VIDEO FEED
   ========================================================= */

function setupVideoFeed() {

    const feed =
        document.getElementById(
            "video-feed"
        );

    if (!feed) {

        return;

    }


    const items =
        Array.from(
            feed.querySelectorAll(
                ".video-item"
            )
        );


    const videos =
        items.map(
            item =>
                item.querySelector(
                    ".feed-video, video"
                )
        )
        .filter(
            Boolean
        );


    if (!videos.length) {

        console.log(
            "⚠️ No videos found"
        );

        return;

    }


    console.log(
        "🎬 Videos found:",
        videos.length
    );


    videos.forEach(
        video => {

            video.setAttribute(
                "playsinline",
                ""
            );

            video.setAttribute(
                "webkit-playsinline",
                ""
            );

            video.preload =
                "metadata";

            video.muted =
                true;

            video.loop =
                false;

        }
    );


    setupVideoObserver(
        videos
    );


    setupVideoEnd(
        videos
    );

}


/* =========================================================
   VIDEO OBSERVER
   ========================================================= */

function setupVideoObserver(
    videos
) {

    if (
        !("IntersectionObserver" in window)
    ) {

        return;

    }


    feedObserver =
        new IntersectionObserver(
            entries => {

                let bestEntry =
                    null;


                entries.forEach(
                    entry => {

                        if (
                            !bestEntry ||
                            entry.intersectionRatio >
                            bestEntry.intersectionRatio
                        ) {

                            bestEntry =
                                entry;

                        }

                    }
                );


                entries.forEach(
                    entry => {

                        const video =
                            entry.target;


                        if (
                            entry.isIntersecting &&
                            entry.intersectionRatio >= 0.65
                        ) {

                            activeVideoItem =
                                video.closest(
                                    ".video-item"
                                );


                            videos.forEach(
                                other => {

                                    if (
                                        other !== video
                                    ) {

                                        other.pause();

                                    }

                                }
                            );


                            const playPromise =
                                video.play();


                            if (
                                playPromise &&
                                typeof playPromise.catch ===
                                "function"
                            ) {

                                playPromise.catch(
                                    () => {

                                        console.log(
                                            "Autoplay blocked"
                                        );

                                    }
                                );

                            }

                        } else {

                            video.pause();

                        }

                    }
                );

            },
            {
                threshold: [
                    0.25,
                    0.50,
                    0.65,
                    0.80,
                    1
                ]
            }
        );


    videos.forEach(
        video => {

            feedObserver.observe(
                video
            );

        }
    );

}


/* =========================================================
   VIDEO END → NEXT VIDEO
   ========================================================= */

function setupVideoEnd(
    videos
) {

    videos.forEach(
        video => {

            video.addEventListener(
                "ended",
                () => {

                    const item =
                        video.closest(
                            ".video-item"
                        );


                    if (!item) {

                        return;

                    }


                    const next =
                        item.nextElementSibling;


                    if (
                        next &&
                        next.classList.contains(
                            "video-item"
                        )
                    ) {

                        next.scrollIntoView(
                            {
                                behavior:
                                    "smooth",
                                block:
                                    "start"
                            }
                        );


                        const nextVideo =
                            next.querySelector(
                                "video"
                            );


                        if (nextVideo) {

                            setTimeout(
                                () => {

                                    nextVideo.muted =
                                        true;

                                    nextVideo.play()
                                        .catch(
                                            () => {}
                                        );

                                },
                                500
                            );

                        }

                    }

                }
            );

        }
    );

}


/* =========================================================
   VIDEO CLICK
   ========================================================= */

function setupVideoClick() {

    const videos =
        document.querySelectorAll(
            ".feed-video, .video-item video"
        );


    videos.forEach(
        video => {

            video.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    if (video.paused) {

                        video.play()
                            .catch(
                                () => {}
                            );

                    } else {

                        video.pause();

                    }

                }
            );

        }
    );

}


/* =========================================================
   STORAGE
   ========================================================= */

function getStorage(
    key,
    fallback
) {

    try {

        const value =
            localStorage.getItem(
                key
            );

        if (value === null) {

            return fallback;

        }

        return JSON.parse(
            value
        );

    } catch {

        return fallback;

    }

}


function setStorage(
    key,
    value
) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(
                value
            )
        );

    } catch {

        console.log(
            "Storage unavailable"
        );

    }

}


/* =========================================================
   VIDEO ID
   ========================================================= */

function getVideoId(
    item
) {

    if (!item) {

        return "";

    }


    if (
        item.dataset.videoId
    ) {

        return item.dataset.videoId;

    }


    const video =
        item.querySelector(
            "video"
        );


    if (
        video &&
        video.currentSrc
    ) {

        item.dataset.videoId =
            "video-" +
            Math.abs(
                simpleHash(
                    video.currentSrc
                )
            );

    } else {

        item.dataset.videoId =
            "video-" +
            Date.now();

    }


    return item.dataset.videoId;

}


/* =========================================================
   SIMPLE HASH
   ========================================================= */

function simpleHash(
    text
) {

    let hash =
        0;

    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        hash =
            (
                (
                    hash << 5
                ) -
                hash
            ) +
            text.charCodeAt(i);

        hash |= 0;

    }

    return hash;

}


/* =========================================================
   LIKE
   ========================================================= */

function setupLikeButtons() {

    const buttons =
        document.querySelectorAll(
            ".like-btn, #likeBtn"
        );


    buttons.forEach(
        button => {

            if (
                button.dataset.ready ===
                "like"
            ) {

                return;

            }


            button.dataset.ready =
                "like";


            const item =
                button.closest(
                    ".video-item"
                );


            if (!item) {

                return;

            }


            const videoId =
                getVideoId(
                    item
                );


            loadLike(
                button,
                videoId
            );


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    const likes =
                        getStorage(
                            "wwc_likes",
                            {}
                        );

                    const likedVideos =
                        getStorage(
                            "wwc_liked_videos",
                            []
                        );


                    let count =
                        Number(
                            likes[videoId] ||
                            0
                        );


                    const alreadyLiked =
                        likedVideos.includes(
                            videoId
                        );


                    if (
                        alreadyLiked
                    ) {

                        count =
                            Math.max(
                                0,
                                count - 1
                            );


                        const index =
                            likedVideos.indexOf(
                                videoId
                            );


                        if (
                            index >= 0
                        ) {

                            likedVideos.splice(
                                index,
                                1
                            );

                        }

                    } else {

                        count++;

                        likedVideos.push(
                            videoId
                        );

                    }


                    likes[videoId] =
                        count;


                    setStorage(
                        "wwc_likes",
                        likes
                    );


                    setStorage(
                        "wwc_liked_videos",
                        likedVideos
                    );


                    updateLikeUI(
                        button,
                        count,
                        !alreadyLiked
                    );

                }
            );

        }
    );

}


function loadLike(
    button,
    videoId
) {

    const likes =
        getStorage(
            "wwc_likes",
            {}
        );

    const likedVideos =
        getStorage(
            "wwc_liked_videos",
            []
        );


    const count =
        Number(
            likes[videoId] ||
            0
        );


    updateLikeUI(
        button,
        count,
        likedVideos.includes(
            videoId
        )
    );

}


function updateLikeUI(
    button,
    count,
    liked
) {

    const counter =
        button.querySelector(
            ".like-count"
        );


    if (counter) {

        counter.textContent =
            count;

    }


    button.classList.toggle(
        "liked",
        liked
    );


    button.setAttribute(
        "aria-pressed",
        String(
            liked
        )
    );

}


/* =========================================================
   SAVE
   ========================================================= */

function setupSaveButtons() {

    const buttons =
        document.querySelectorAll(
            ".save-btn"
        );


    buttons.forEach(
        button => {

            const item =
                button.closest(
                    ".video-item"
                );


            if (!item) {

                return;

            }


            const videoId =
                getVideoId(
                    item
                );


            loadSave(
                button,
                videoId
            );


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    const saved =
                        getStorage(
                            "wwc_saved_videos",
                            []
                        );


                    const index =
                        saved.indexOf(
                            videoId
                        );


                    let isSaved;


                    if (
                        index >= 0
                    ) {

                        saved.splice(
                            index,
                            1
                        );

                        isSaved =
                            false;

                    } else {

                        saved.push(
                            videoId
                        );

                        isSaved =
                            true;

                    }


                    setStorage(
                        "wwc_saved_videos",
                        saved
                    );


                    updateSaveUI(
                        button,
                        isSaved
                    );


                    showMessage(
                        isSaved
                            ? "🔖 Video Saved"
                            : "🔖 Save সরানো হয়েছে"
                    );

                }
            );

        }
    );

}


function loadSave(
    button,
    videoId
) {

    const saved =
        getStorage(
            "wwc_saved_videos",
            []
        );


    updateSaveUI(
        button,
        saved.includes(
            videoId
        )
    );

}


function updateSaveUI(
    button,
    saved
) {

    const counter =
        button.querySelector(
            ".save-count"
        );


    if (counter) {

        counter.textContent =
            saved ? "1" : "0";

    }


    button.classList.toggle(
        "saved",
        saved
    );


    button.setAttribute(
        "aria-pressed",
        String(
            saved
        )
    );

}


/* =========================================================
   COMMENT
   ========================================================= */

function setupCommentButtons() {

    const buttons =
        document.querySelectorAll(
            ".comment-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    const item =
                        button.closest(
                            ".video-item"
                        );


                    commentTarget =
                        item;


                    const box =
                        document.getElementById(
                            "commentBox"
                        );


                    const input =
                        document.getElementById(
                            "commentInput"
                        );


                    if (!box) {

                        showMessage(
                            "💬 Comment box পাওয়া যায়নি"
                        );

                        return;

                    }


                    box.classList.add(
                        "show"
                    );


                    if (input) {

                        input.value =
                            "";

                        input.focus();

                    }

                }
            );

        }
    );

}


/* =========================================================
   COMMENT BOX
   ========================================================= */

function setupCommentBox() {

    const cancel =
        document.getElementById(
            "commentCancel"
        );

    const send =
        document.getElementById(
            "commentSend"
        );

    const box =
        document.getElementById(
            "commentBox"
        );


    if (cancel) {

        cancel.addEventListener(
            "click",
            () => {

                if (box) {

                    box.classList.remove(
                        "show"
                    );

                }

                commentTarget =
                    null;

            }
        );

    }


    if (send) {

        send.addEventListener(
            "click",
            () => {

                const input =
                    document.getElementById(
                        "commentInput"
                    );


                if (!input) {

                    return;

                }


                const text =
                    input.value.trim();


                if (!text) {

                    showMessage(
                        "⚠️ Comment লিখুন"
                    );

                    return;

                }


                if (!commentTarget) {

                    return;

                }


                const videoId =
                    getVideoId(
                        commentTarget
                    );


                const comments =
                    getStorage(
                        "wwc_comments",
                        {}
                    );


                if (
                    !comments[videoId]
                ) {

                    comments[videoId] =
                        [];

                }


                comments[videoId].push({

                    text:
                        text,

                    user:
                        currentUser
                            ? (
                                currentUser.displayName ||
                                currentUser.email ||
                                "WWC User"
                            )
                            : "Guest",

                    time:
                        new Date().toISOString()

                });


                setStorage(
                    "wwc_comments",
                    comments
                );


                input.value =
                    "";


                if (box) {

                    box.classList.remove(
                        "show"
                    );

                }


                showMessage(
                    "✅ Comment যোগ হয়েছে"
                );


                commentTarget =
                    null;

            }
        );

    }

}


/* =========================================================
   SHARE
   ========================================================= */

function setupShareButtons() {

    const buttons =
        document.querySelectorAll(
            ".share-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    event.stopPropagation();


                    const item =
                        button.closest(
                            ".video-item"
                        );


                    const video =
                        item
                            ? item.querySelector(
                                "video"
                            )
                            : null;


                    const url =
                        video
                            ? (
                                video.currentSrc ||
                                video.src
                            )
                            : window.location.href;


                    try {

                        if (
                            navigator.share
                        ) {

                            await navigator.share(
                                {
                                    title:
                                        "World Wide Connect",

                                    text:
                                        "দেখুন এই ভিডিওটি 🌍",

                                    url:
                                        url
                                }
                            );

                        } else {

                            await navigator.clipboard.writeText(
                                url
                            );

                            showMessage(
                                "🔗 Video link কপি হয়েছে"
                            );

                        }

                    } catch (error) {

                        console.log(
                            "Share cancelled"
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   FOLLOW
   ========================================================= */

function setupFollowButtons() {

    const buttons =
        document.querySelectorAll(
            ".follow-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    event.stopPropagation();


                    if (!currentUser) {

                        window.location.href =
                            "./auth.html";

                        return;

                    }


                    const item =
                        button.closest(
                            ".video-item"
                        );


                    if (!item) {

                        return;

                    }


                    const usernameElement =
                        item.querySelector(
                            ".username"
                        );


                    const username =
                        usernameElement
                            ? usernameElement.textContent.trim()
                            : "wwc_user";


                    const followed =
                        getStorage(
                            "wwc_following",
                            []
                        );


                    const index =
                        followed.indexOf(
                            username
                        );


                    if (index >= 0) {

                        followed.splice(
                            index,
                            1
                        );

                        updateFollowButton(
                            button,
                            false
                        );

                        showMessage(
                            "Following থেকে সরানো হয়েছে"
                        );

                    } else {

                        followed.push(
                            username
                        );

                        updateFollowButton(
                            button,
                            true
                        );

                        showMessage(
                            "✅ Following করা হয়েছে"
                        );

                    }


                    setStorage(
                        "wwc_following",
                        followed
                    );

                }
            );

        }
    );


    buttons.forEach(
        button => {

            const item =
                button.closest(
                    ".video-item"
                );


            if (!item) {

                return;

            }


            const usernameElement =
                item.querySelector(
                    ".username"
                );


            const username =
                usernameElement
                    ? usernameElement.textContent.trim()
                    : "";


            const followed =
                getStorage(
                    "wwc_following",
                    []
                );


            updateFollowButton(
                button,
                followed.includes(
                    username
                )
            );

        }
    );

}


function updateFollowButton(
    button,
    following
) {

    button.textContent =
        following
            ? "Following"
            : "Follow";


    button.classList.toggle(
        "following",
        following
    );


    button.setAttribute(
        "aria-pressed",
        String(
            following
        )
    );

}


/* =========================================================
   FOLLOWING / FOR YOU
   ========================================================= */

function setupTopTabs() {

    const tabs =
        document.querySelectorAll(
            ".wwc-top-tab"
        );


    if (!tabs.length) {

        return;

    }


    tabs.forEach(
        tab => {

            tab.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    tabs.forEach(
                        other => {

                            other.classList.remove(
                                "active"
                            );

                        }
                    );


                    tab.classList.add(
                        "active"
                    );


                    const text =
                        tab.textContent
                            .trim()
                            .toLowerCase();


                    if (
                        text.includes(
                            "following"
                        )
                    ) {

                        showFollowingVideos();

                    } else {

                        showAllVideos();

                    }

                }
            );

        }
    );

}


function showAllVideos() {

    const items =
        document.querySelectorAll(
            ".video-item"
        );


    items.forEach(
        item => {

            item.style.display =
                "";

        }
    );

}


function showFollowingVideos() {

    const following =
        getStorage(
            "wwc_following",
            []
        );


    const items =
        document.querySelectorAll(
            ".video-item"
        );


    let found =
        false;


    items.forEach(
        item => {

            const usernameElement =
                item.querySelector(
                    ".username"
                );


            const username =
                usernameElement
                    ? usernameElement.textContent.trim()
                    : "";


            if (
                following.includes(
                    username
                )
            ) {

                item.style.display =
                    "";

                found =
                    true;

            } else {

                item.style.display =
                    "none";

                const video =
                    item.querySelector(
                        "video"
                    );

                if (video) {

                    video.pause();

                }

            }

        }
    );


    if (!found) {

        showMessage(
            "ℹ️ আপনি এখনো কাউকে Follow করেননি"
        );

    }

}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

    const searchButton =
        document.getElementById(
            "searchBtn"
        );


    if (!searchButton) {

        return;

    }


    searchButton.addEventListener(
        "click",
        event => {

            event.preventDefault();


            let input =
                document.getElementById(
                    "searchInput"
                );


            if (!input) {

                const query =
                    window.prompt(
                        "🔍 কী Search করতে চান?"
                    );


                if (
                    query === null
                ) {

                    return;

                }


                performSearch(
                    query
                );

                return;

            }


            performSearch(
                input.value
            );

        }
    );

}


function performSearch(
    query
) {

    query =
        String(
            query || ""
        )
        .trim()
        .toLowerCase();


    if (!query) {

        showMessage(
            "⚠️ কিছু লিখে Search করুন"
        );

        return;

    }


    const items =
        document.querySelectorAll(
            ".video-item"
        );


    let found =
        0;


    items.forEach(
        item => {

            const text =
                item.textContent
                    .toLowerCase();


            if (
                text.includes(
                    query
                )
            ) {

                item.style.display =
                    "";

                found++;

            } else {

                item.style.display =
                    "none";

                const video =
                    item.querySelector(
                        "video"
                    );

                if (video) {

                    video.pause();

                }

            }

        }
    );


    if (!found) {

        showMessage(
            "❌ কিছু পাওয়া যায়নি"
        );

    } else {

        showMessage(
            "🔎 " +
            found +
            " টি ভিডিও পাওয়া গেছে"
        );

    }

}


/* =========================================================
   CAPTION + TITLE SUPPORT
   ========================================================= */

function setupVideoText() {

    const items =
        document.querySelectorAll(
            ".video-item"
        );


    items.forEach(
        item => {

            const caption =
                item.querySelector(
                    ".video-caption"
                );


            const title =
                item.dataset.title ||
                item.getAttribute(
                    "data-title"
                );


            if (
                title &&
                !item.querySelector(
                    ".video-title"
                )
            ) {

                const titleElement =
                    document.createElement(
                        "div"
                    );


                titleElement.className =
                    "video-title";


                titleElement.textContent =
                    title;


                if (caption) {

                    caption.parentNode.insertBefore(
                        titleElement,
                        caption
                    );

                } else {

                    item.appendChild(
                        titleElement
                    );

                }

            }

        }
    );

}


/* =========================================================
   GLOBAL MESSAGE
   ========================================================= */

function showMessage(
    text
) {

    let box =
        document.getElementById(
            "wwcMessage"
        );


    if (!box) {

        box =
            document.createElement(
                "div"
            );


        box.id =
            "wwcMessage";


        box.style.position =
            "fixed";

        box.style.left =
            "50%";

        box.style.bottom =
            "90px";

        box.style.transform =
            "translateX(-50%)";

        box.style.zIndex =
            "999999";

        box.style.background =
            "#222";

        box.style.color =
            "#fff";

        box.style.padding =
            "12px 18px";

        box.style.borderRadius =
            "12px";

        box.style.fontSize =
            "14px";

        box.style.maxWidth =
            "90%";

        box.style.textAlign =
            "center";

        box.style.boxShadow =
            "0 5px 25px rgba(0,0,0,.4)";


        document.body.appendChild(
            box
        );

    }


    box.textContent =
        text;


    box.style.display =
        "block";


    clearTimeout(
        window.wwcMessageTimer
    );


    window.wwcMessageTimer =
        setTimeout(
            () => {

                box.style.display =
                    "none";

            },
            2500
        );

}


/* =========================================================
   GLOBAL WWC OBJECT
   ========================================================= */

window.WWC = {

    getCurrentUser:
        () => currentUser,

    getAuth:
        () => auth,

    getFirestore:
        () => db,

    logout:
        () => logoutUser(),

    showMessage:
        text => showMessage(text),

    search:
        query => performSearch(query)

};


/* =========================================================
   START TEXT SUPPORT
   ========================================================= */

setupVideoText();


/* =========================================================
   FINAL
   ========================================================= */

console.log(
    "🌍 WWC-Core APP.JS loaded successfully"
);
