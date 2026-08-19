/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   APP.JS
   COMPLETE VERSION
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
    setDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyCgio17aPErF7d6juqIhn3yi6Mf65W_tO4",
    authDomain: "world-wide-connect-62c87.firebaseapp.com",
    projectId: "world-wide-connect-62c87",
    storageBucket: "world-wide-connect-62c87.firebasestorage.app",
    messagingSenderId: "93178453668",
    appId: "1:93178453668:web:2184630caae8e61f7445031",
    measurementId: "G-PKFJ5NEMGQ"
};


/* =========================================================
   FIREBASE START
   ========================================================= */

const app =
    getApps().length
        ? getApps()[0]
        : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentVideoItem = null;


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log("🌍 WWC-Core starting...");

    setupAuthentication();
    setupNavigation();
    setupLogout();

    setupVideoFeed();
    setupLikeButtons();
    setupCommentButtons();
    setupSaveButtons();
    setupShareButtons();
    setupFollowButtons();

    setupSearch();
    setupTopTabs();
    setupProfileMenu();

    console.log("✅ WWC-Core ready");

});


/* =========================================================
   AUTHENTICATION
   ========================================================= */

function setupAuthentication() {

    onAuthStateChanged(auth, async (user) => {

        currentUser = user;

        if (user) {

            console.log(
                "✅ Login:",
                user.email || user.displayName || user.uid
            );

            await createProfile(user);

            updateLoginUI(true, user);

        } else {

            console.log("ℹ️ User not logged in");

            updateLoginUI(false, null);

        }

    });

}


/* =========================================================
   CREATE USER PROFILE
   ========================================================= */

async function createProfile(user) {

    try {

        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) {

            await setDoc(userRef, {

                name:
                    user.displayName ||
                    "WWC User",

                username:
                    "wwc_user_" +
                    user.uid.substring(0, 6),

                email:
                    user.email || "",

                bio:
                    "Welcome to my WWC profile 🌍",

                photoURL:
                    user.photoURL || "",

                followers: 0,

                following: 0,

                likes: 0,

                country: "Bangladesh",

                createdAt:
                    new Date().toISOString()

            });

            console.log(
                "✅ New profile created"
            );

        }

    } catch (error) {

        console.error(
            "❌ Profile error:",
            error
        );

    }

}


/* =========================================================
   LOGIN UI
   ========================================================= */

function updateLoginUI(loggedIn, user) {

    const loginButtons =
        document.querySelectorAll(
            ".login-btn, #loginBtn"
        );

    const logoutButtons =
        document.querySelectorAll(
            ".logout-btn, #logoutBtn, .logout-menu-btn"
        );

    loginButtons.forEach(button => {

        button.style.display =
            loggedIn ? "none" : "";

    });

    logoutButtons.forEach(button => {

        button.style.display =
            loggedIn ? "" : "none";

    });

    const userNames =
        document.querySelectorAll(
            ".current-user-name"
        );

    userNames.forEach(element => {

        element.textContent =
            user
                ? (
                    user.displayName ||
                    user.email ||
                    "WWC User"
                )
                : "Guest";

    });

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutUser() {

    try {

        await signOut(auth);

        showWWCMessage(
            "✅ Logout সফল হয়েছে"
        );

        setTimeout(() => {

            window.location.href =
                "./auth.html";

        }, 500);

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        showWWCMessage(
            "❌ Logout করা যায়নি"
        );

    }

}


/* =========================================================
   LOGOUT BUTTON
   ========================================================= */

function setupLogout() {

    const buttons =
        document.querySelectorAll(
            "#logoutBtn, .logout-btn, .logout-menu-btn"
        );

    buttons.forEach(button => {

        if (
            button.dataset.wwcLogoutReady ===
            "true"
        ) {
            return;
        }

        button.dataset.wwcLogoutReady =
            "true";

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();

                logoutUser();

            }
        );

    });

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    /* HOME */

    document.querySelectorAll(
        "#homeBtn, .home-btn"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                window.location.href =
                    "./index.html";

            }
        );

    });


    /* PROFILE */

    document.querySelectorAll(
        "#profileBtn, .profile-btn, #profileBtnMenu"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                if (!currentUser) {

                    window.location.href =
                        "./auth.html";

                    return;

                }

                window.location.href =
                    "./profile.html";

            }
        );

    });


    /* LOGIN */

    document.querySelectorAll(
        "#loginBtn"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                window.location.href =
                    "./auth.html";

            }
        );

    });


    /* UPLOAD */

    document.querySelectorAll(
        "#uploadBtn, .upload-btn, #createBtn"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                if (!currentUser) {

                    window.location.href =
                        "./auth.html";

                    return;

                }

                window.location.href =
                    "./upload.html";

            }
        );

    });


    /* FRIENDS */

    document.querySelectorAll(
        "#friendsBtn, .friends-btn"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                if (!currentUser) {

                    showWWCMessage(
                        "⚠️ Friends দেখতে Login করুন"
                    );

                    setTimeout(() => {

                        window.location.href =
                            "./auth.html";

                    }, 700);

                    return;

                }

                window.location.href =
                    "./friends.html";

            }
        );

    });


    /* INBOX */

    document.querySelectorAll(
        "#inboxBtn, .inbox-btn"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showWWCMessage(
                    "💬 Inbox শীঘ্রই আসছে"
                );

            }
        );

    });

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

        console.log(
            "ℹ️ Video feed পাওয়া যায়নি"
        );

        return;

    }

    const items =
        Array.from(
            feed.querySelectorAll(
                ".video-item"
            )
        );

    const videos =
        items.map(item =>
            item.querySelector("video")
        ).filter(Boolean);


    if (!videos.length) {

        console.log(
            "ℹ️ কোনো ভিডিও নেই"
        );

        return;

    }

    console.log(
        "🎬 Videos:",
        videos.length
    );


    videos.forEach((video, index) => {

        video.setAttribute(
            "playsinline",
            ""
        );

        video.setAttribute(
            "preload",
            "metadata"
        );

        video.muted = true;


        /* VIDEO ENDED */

        video.addEventListener(
            "ended",
            () => {

                const next =
                    videos[index + 1];

                if (next) {

                    next.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                    setTimeout(() => {

                        next.play().catch(() => {});

                    }, 400);

                } else {

                    /* শেষ ভিডিও হলে আবার প্রথম ভিডিও */

                    const first =
                        videos[0];

                    if (first) {

                        first.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });

                        setTimeout(() => {

                            first.currentTime = 0;

                            first.play().catch(() => {});

                        }, 400);

                    }

                }

            }
        );


        /* PLAY হলে অন্য ভিডিও বন্ধ */

        video.addEventListener(
            "play",
            () => {

                videos.forEach(other => {

                    if (
                        other !== video &&
                        !other.paused
                    ) {

                        other.pause();

                    }

                });

            }
        );

    });


    /* INTERSECTION OBSERVER */

    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    const video =
                        entry.target;


                    if (
                        entry.isIntersecting &&
                        entry.intersectionRatio >= 0.65
                    ) {

                        currentVideoItem =
                            video.closest(
                                ".video-item"
                            );


                        videos.forEach(other => {

                            if (
                                other !== video &&
                                !other.paused
                            ) {

                                other.pause();

                            }

                        });


                        video.play().catch(() => {});


                    } else {

                        if (!video.paused) {

                            video.pause();

                        }

                    }

                });

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


    videos.forEach(video => {

        observer.observe(video);

    });


    /* প্রথম ভিডিও চালু */

    setTimeout(() => {

        if (videos[0]) {

            videos[0].play().catch(() => {});

        }

    }, 500);

}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function wwcGetStorage(key, fallback) {

    try {

        const value =
            localStorage.getItem(key);

        if (value === null) {

            return fallback;

        }

        return JSON.parse(value);

    } catch (error) {

        console.error(
            "Storage read error:",
            error
        );

        return fallback;

    }

}


function wwcSetStorage(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    } catch (error) {

        console.error(
            "Storage save error:",
            error
        );

    }

}


/* =========================================================
   VIDEO ID
   ========================================================= */

function getWWCVideoId(item) {

    if (!item) {
        return "";
    }

    if (item.dataset.videoId) {

        return item.dataset.videoId;

    }

    const video =
        item.querySelector("video");

    if (video) {

        const source =
            video.querySelector("source");

        const src =
            source
                ? source.src
                : video.src;

        item.dataset.videoId =
            "video-" +
            btoa(
                src || String(Date.now())
            )
            .replace(
                /[^a-zA-Z0-9]/g,
                ""
            )
            .slice(0, 30);

    }

    return item.dataset.videoId ||
        "video-" + Date.now();

}


/* =========================================================
   LIKE
   ========================================================= */

function setupLikeButtons() {

    document.querySelectorAll(
        ".like-btn, #likeBtn"
    ).forEach(button => {

        if (
            button.dataset.wwcLikeReady ===
            "true"
        ) {
            return;
        }

        button.dataset.wwcLikeReady =
            "true";

        const item =
            button.closest(
                ".video-item"
            );

        if (!item) {
            return;
        }

        const videoId =
            getWWCVideoId(item);

        loadLikeState(
            button,
            videoId
        );


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                const likes =
                    wwcGetStorage(
                        "wwc_likes",
                        {}
                    );

                const liked =
                    wwcGetStorage(
                        "wwc_liked_videos",
                        []
                    );

                let count =
                    Number(
                        likes[videoId] || 0
                    );

                const isLiked =
                    liked.includes(
                        videoId
                    );


                if (isLiked) {

                    count =
                        Math.max(
                            0,
                            count - 1
                        );

                    const index =
                        liked.indexOf(
                            videoId
                        );

                    if (index !== -1) {

                        liked.splice(
                            index,
                            1
                        );

                    }

                } else {

                    count++;

                    liked.push(
                        videoId
                    );

                }


                likes[videoId] =
                    count;


                wwcSetStorage(
                    "wwc_likes",
                    likes
                );

                wwcSetStorage(
                    "wwc_liked_videos",
                    liked
                );


                button.classList.toggle(
                    "liked",
                    !isLiked
                );


                button.setAttribute(
                    "aria-pressed",
                    String(!isLiked)
                );


                const countElement =
                    button.querySelector(
                        ".like-count"
                    );

                if (countElement) {

                    countElement.textContent =
                        count;

                }

            }
        );

    });

}


function loadLikeState(
    button,
    videoId
) {

    const likes =
        wwcGetStorage(
            "wwc_likes",
            {}
        );

    const liked =
        wwcGetStorage(
            "wwc_liked_videos",
            []
        );

    const count =
        Number(
            likes[videoId] || 0
        );

    const isLiked =
        liked.includes(
            videoId
        );

    const countElement =
        button.querySelector(
            ".like-count"
        );

    if (countElement) {

        countElement.textContent =
            count;

    }

    button.classList.toggle(
        "liked",
        isLiked
    );

    button.setAttribute(
        "aria-pressed",
        String(isLiked)
    );

}


/* =========================================================
   SAVE
   ========================================================= */

function setupSaveButtons() {

    document.querySelectorAll(
        ".save-btn, #saveBtn"
    ).forEach(button => {

        if (
            button.dataset.wwcSaveReady ===
            "true"
        ) {
            return;
        }

        button.dataset.wwcSaveReady =
            "true";

        const item =
            button.closest(
                ".video-item"
            );

        if (!item) {
            return;
        }

        const videoId =
            getWWCVideoId(item);

        loadSaveState(
            button,
            videoId
        );


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                const saved =
                    wwcGetStorage(
                        "wwc_saved_videos",
                        []
                    );

                const index =
                    saved.indexOf(
                        videoId
                    );

                let isSaved = false;


                if (index !== -1) {

                    saved.splice(
                        index,
                        1
                    );

                } else {

                    saved.push(
                        videoId
                    );

                    isSaved = true;

                }


                wwcSetStorage(
                    "wwc_saved_videos",
                    saved
                );


                button.classList.toggle(
                    "saved",
                    isSaved
                );

                button.setAttribute(
                    "aria-pressed",
                    String(isSaved)
                );


                const countElement =
                    button.querySelector(
                        ".save-count"
                    );

                if (countElement) {

                    countElement.textContent =
                        saved.length;

                }

            }
        );

    });

}


function loadSaveState(
    button,
    videoId
) {

    const saved =
        wwcGetStorage(
            "wwc_saved_videos",
            []
        );

    const isSaved =
        saved.includes(
            videoId
        );

    button.classList.toggle(
        "saved",
        isSaved
    );

    button.setAttribute(
        "aria-pressed",
        String(isSaved)
    );

    const countElement =
        button.querySelector(
            ".save-count"
        );

    if (countElement) {

        countElement.textContent =
            saved.length;

    }

}


/* =========================================================
   COMMENT
   ========================================================= */

function setupCommentButtons() {

    document.querySelectorAll(
        ".comment-btn, #commentBtn"
    ).forEach(button => {

        if (
            button.dataset.wwcCommentReady ===
            "true"
        ) {
            return;
        }

        button.dataset.wwcCommentReady =
            "true";

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                const item =
                    button.closest(
                        ".video-item"
                    );

                window.wwcCurrentCommentVideo =
                    item
                        ? getWWCVideoId(item)
                        : "";

                const box =
                    document.getElementById(
                        "commentBox"
                    );

                const input =
                    document.getElementById(
                        "commentInput"
                    );

                if (box) {

                    box.style.display =
                        "block";

                }

                if (input) {

                    input.focus();

                }

            }
        );

    });


    const cancel =
        document.getElementById(
            "commentCancel"
        );

    if (cancel) {

        cancel.addEventListener(
            "click",
            () => {

                const box =
                    document.getElementById(
                        "commentBox"
                    );

                if (box) {

                    box.style.display =
                        "none";

                }

            }
        );

    }


    const send =
        document.getElementById(
            "commentSend"
        );

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

                    showWWCMessage(
                        "⚠️ Comment লিখুন"
                    );

                    return;

                }


                const comments =
                    wwcGetStorage(
                        "wwc_comments",
                        {}
                    );

                const videoId =
                    window.wwcCurrentCommentVideo ||
                    "general";

                if (!comments[videoId]) {

                    comments[videoId] = [];

                }

                comments[videoId].push({

                    text: text,

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


                wwcSetStorage(
                    "wwc_comments",
                    comments
                );


                input.value = "";


                const box =
                    document.getElementById(
                        "commentBox"
                    );

                if (box) {

                    box.style.display =
                        "none";

                }


                showWWCMessage(
                    "✅ Comment যোগ হয়েছে"
                );

            }
        );

    }

}


/* =========================================================
   SHARE
   ========================================================= */

function setupShareButtons() {

    document.querySelectorAll(
        ".share-btn, #shareBtn"
    ).forEach(button => {

        if (
            button.dataset.wwcShareReady ===
            "true"
        ) {
            return;
        }

        button.dataset.wwcShareReady =
            "true";

        button.addEventListener(
            "click",
            async event => {

                event.preventDefault();
                event.stopPropagation();

                const item =
                    button.closest(
                        ".video-item"
                    );

                let shareUrl =
                    window.location.href;

                if (item) {

                    const video =
                        item.querySelector(
                            "video"
                        );

                    const source =
                        video
                            ? video.querySelector(
                                "source"
                            )
                            : null;

                    if (
                        source &&
                        source.src
                    ) {

                        shareUrl =
                            source.src;

                    } else if (
                        video &&
                        video.src
                    ) {

                        shareUrl =
                            video.src;

                    }

                }


                try {

                    if (
                        navigator.share
                    ) {

                        await navigator.share({

                            title:
                                "World Wide Connect",

                            text:
                                "Watch this video on World Wide Connect 🌍",

                            url:
                                shareUrl

                        });

                    } else if (
                        navigator.clipboard
                    ) {

                        await navigator.clipboard.writeText(
                            shareUrl
                        );

                        showWWCMessage(
                            "✅ Link Copy হয়েছে"
                        );

                    } else {

                        window.prompt(
                            "এই Link Copy করুন:",
                            shareUrl
                        );

                    }

                } catch (error) {

                    console.log(
                        "Share cancelled"
                    );

                }

            }
        );

    });

}


/* =========================================================
   FOLLOW
   ========================================================= */

function setupFollowButtons() {

    document.querySelectorAll(
        ".follow-btn"
    ).forEach(button => {

        if (
            button.dataset.wwcFollowReady ===
            "true"
        ) {
            return;
        }

        button.dataset.wwcFollowReady =
            "true";

        const item =
            button.closest(
                ".video-item"
            );

        if (!item) {
            return;
        }

        const usernameElement =
            item.querySelector(
                ".profile-area .username"
            );

        const username =
            usernameElement
                ? usernameElement.textContent.trim()
                : "wwc_user";

        const key =
            "wwc_following_" +
            username;


        const following =
            wwcGetStorage(
                key,
                false
            );

        updateFollowButton(
            button,
            following
        );


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                const current =
                    wwcGetStorage(
                        key,
                        false
                    );

                const newState =
                    !current;

                wwcSetStorage(
                    key,
                    newState
                );

                updateFollowButton(
                    button,
                    newState
                );


                showWWCMessage(
                    newState
                        ? "✅ Following করা হয়েছে"
                        : "Following বাতিল করা হয়েছে"
                );

            }
        );

    });

}


function updateFollowButton(
    button,
    following
) {

    if (!button) {
        return;
    }

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
        String(following)
    );

}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

    const searchButton =
        document.querySelector(
            "#searchBtn, .search-btn"
        );

    if (!searchButton) {
        return;
    }

    if (
        searchButton.dataset.wwcSearchReady ===
        "true"
    ) {
        return;
    }

    searchButton.dataset.wwcSearchReady =
        "true";


    searchButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            openSearch();

        }
    );

}


/* =========================================================
   SEARCH WINDOW
   ========================================================= */

function openSearch() {

    let overlay =
        document.getElementById(
            "wwcSearchOverlay"
        );


    if (!overlay) {

        overlay =
            document.createElement(
                "div"
            );

        overlay.id =
            "wwcSearchOverlay";

        overlay.style.position =
            "fixed";

        overlay.style.inset =
            "0";

        overlay.style.zIndex =
            "99999";

        overlay.style.background =
            "rgba(0,0,0,.95)";

        overlay.style.padding =
            "25px";

        overlay.style.boxSizing =
            "border-box";


        overlay.innerHTML = `

            <div style="
                max-width:500px;
                margin:30px auto;
            ">

                <button
                    id="wwcSearchClose"
                    type="button"
                    style="
                        float:right;
                        background:none;
                        border:0;
                        color:white;
                        font-size:25px;
                    "
                >
                    ✕
                </button>

                <h2 style="color:white;">
                    🔍 Search
                </h2>

                <input
                    id="wwcSearchInput"
                    type="search"
                    placeholder="Search..."
                    style="
                        width:100%;
                        padding:15px;
                        border-radius:10px;
                        border:0;
                        font-size:16px;
                    "
                >

                <div
                    id="wwcSearchResults"
                    style="
                        color:white;
                        margin-top:20px;
                    "
                ></div>

            </div>
        `;


        document.body.appendChild(
            overlay
        );


        document.getElementById(
            "wwcSearchClose"
        ).addEventListener(
            "click",
            () => {

                overlay.remove();

            }
        );


        const input =
            document.getElementById(
                "wwcSearchInput"
            );

        input.focus();


        input.addEventListener(
            "input",
            () => {

                performWWCSearch(
                    input.value
                );

            }
        );

    }

}


function performWWCSearch(query) {

    const results =
        document.getElementById(
            "wwcSearchResults"
        );

    if (!results) {
        return;
    }

    query =
        query.trim().toLowerCase();


    if (!query) {

        results.innerHTML =
            "🔎 Search করার জন্য কিছু লিখুন";

        return;

    }


    const items =
        document.querySelectorAll(
            ".video-item"
        );

    let found = 0;

    results.innerHTML = "";


    items.forEach(item => {

        const text =
            item.textContent.toLowerCase();

        if (
            text.includes(query)
        ) {

            found++;

            const caption =
                item.querySelector(
                    ".video-caption"
                );

            const username =
                item.querySelector(
                    ".username"
                );

            const result =
                document.createElement(
                    "div"
                );

            result.style.padding =
                "15px";

            result.style.marginBottom =
                "10px";

            result.style.background =
                "#222";

            result.style.borderRadius =
                "10px";

            result.innerHTML =
                "🎬 " +
                (
                    caption
                        ? caption.textContent
                        : "WWC Video"
                ) +
                "<br>" +
                (
                    username
                        ? username.textContent
                        : ""
                );

            result.addEventListener(
                "click",
                () => {

                    item.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                    const overlay =
                        document.getElementById(
                            "wwcSearchOverlay"
                        );

                    if (overlay) {
                        overlay.remove();
                    }

                }
            );

            results.appendChild(
                result
            );

        }

    });


    if (!found) {

        results.innerHTML =
            "❌ কিছু পাওয়া যায়নি";

    }

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


    tabs.forEach(tab => {

        if (
            tab.dataset.wwcTabReady ===
            "true"
        ) {
            return;
        }

        tab.dataset.wwcTabReady =
            "true";


        tab.addEventListener(
            "click",
            event => {

                event.preventDefault();

                tabs.forEach(t => {

                    t.classList.remove(
                        "active"
                    );

                });

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

                    filterFollowingVideos();

                } else {

                    showAllVideos();

                }

            }
        );

    });

}


function filterFollowingVideos() {

    const items =
        document.querySelectorAll(
            ".video-item"
        );

    let found = false;


    items.forEach(item => {

        const usernameElement =
            item.querySelector(
                ".profile-area .username"
            );

        const username =
            usernameElement
                ? usernameElement.textContent.trim()
                : "wwc_user";

        const following =
            wwcGetStorage(
                "wwc_following_" +
                username,
                false
            );


        if (following) {

            item.style.display =
                "";

            found = true;

        } else {

            item.style.display =
                "none";

        }

    });


    if (!found) {

        showWWCMessage(
            "ℹ️ এখনো কোনো Following ভিডিও নেই"
        );

    }

}


function showAllVideos() {

    document.querySelectorAll(
        ".video-item"
    ).forEach(item => {

        item.style.display =
            "";

    });

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
        profileButton &&
        menu
    ) {

        profileButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                if (currentUser) {

                    window.location.href =
                        "./profile.html";

                    return;

                }

                menu.style.display =
                    "block";

                menu.setAttribute(
                    "aria-hidden",
                    "false"
                );

            }
        );

    }


    if (
        closeButton &&
        menu
    ) {

        closeButton.addEventListener(
            "click",
            () => {

                menu.style.display =
                    "none";

                menu.setAttribute(
                    "aria-hidden",
                    "true"
                );

            }
        );

    }

}


/* =========================================================
   GLOBAL MESSAGE
   ========================================================= */

function showWWCMessage(text) {

    let message =
        document.getElementById(
            "wwcMessage"
        );


    if (!message) {

        message =
            document.createElement(
                "div"
            );

        message.id =
            "wwcMessage";

        message.style.position =
            "fixed";

        message.style.left =
            "50%";

        message.style.bottom =
            "25px";

        message.style.transform =
            "translateX(-50%)";

        message.style.zIndex =
            "999999";

        message.style.padding =
            "12px 18px";

        message.style.borderRadius =
            "10px";

        message.style.background =
            "#222";

        message.style.color =
            "#fff";

        message.style.fontSize =
            "14px";

        message.style.boxShadow =
            "0 5px 20px rgba(0,0,0,.4)";

        message.style.maxWidth =
            "85%";

        message.style.textAlign =
            "center";

        document.body.appendChild(
            message
        );

    }


    message.textContent =
        text;

    message.style.display =
        "block";


    clearTimeout(
        window.wwcMessageTimer
    );


    window.wwcMessageTimer =
        setTimeout(
            () => {

                message.style.display =
                    "none";

            },
            2500
        );

}


/* =========================================================
   GLOBAL WWC
   ========================================================= */

window.WWC = {

    getCurrentUser: () => {
        return currentUser;
    },

    logout: () => {
        return logoutUser();
    },

    getAuth: () => {
        return auth;
    },

    getFirestore: () => {
        return db;
    },

    showMessage: text => {
        showWWCMessage(text);
    }

};


/* =========================================================
   FINISHED
   ========================================================= */

console.log(
    "🌍 WWC-Core APP.JS loaded successfully"
);
