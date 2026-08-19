/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   APP.JS — COMPLETE VERSION

   Features:
   Firebase Authentication
   User Profile
   Login / Logout
   Video Feed
   Auto Play
   Like
   Comment
   Save
   Share
   Follow
   Search
   Notifications
   Play / Pause
   Mute / Unmute
   Upload Navigation
   Title + Caption support
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
    messagingSenderId: "931784536688",
    appId: "1:931784536688:web:2184630caae8e61f7445031",
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
let currentCommentVideo = null;


/* =========================================================
   START
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
    setupSearchClear();

    setupNotifications();
    setupMuteButtons();
    setupPlayButtons();
    setupProfileLinks();

    setupCommentBox();

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
                user.email || user.uid
            );

            await createProfile(user);

            updateLoginUI(true, user);

        } else {

            console.log(
                "ℹ️ User not logged in"
            );

            updateLoginUI(false, null);

        }

    });

}


/* =========================================================
   CREATE PROFILE
   ========================================================= */

async function createProfile(user) {

    try {

        const userRef =
            doc(db, "users", user.uid);

        const snapshot =
            await getDoc(userRef);

        if (!snapshot.exists()) {

            await setDoc(userRef, {

                name:
                    user.displayName ||
                    "WWC User",

                username:
                    "wwc_user",

                email:
                    user.email || "",

                bio:
                    "Welcome to my WWC profile 🌍",

                photoURL:
                    user.photoURL || "",

                dob: "",
                age: "",
                gender: "",
                country: "Bangladesh",

                followers: 0,
                following: 0,
                likes: 0,

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
            "❌ Logout error:",
            error
        );

        showWWCMessage(
            "❌ Logout করা যায়নি"
        );

    }

}


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
        "#profileBtn, .profile-btn"
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


    /* LOGIN */

    const loginBtn =
        document.getElementById("loginBtn");

    if (loginBtn) {

        loginBtn.addEventListener(
            "click",
            () => {

                window.location.href =
                    "./auth.html";

            }
        );

    }

}


/* =========================================================
   VIDEO FEED
   ========================================================= */

function setupVideoFeed() {

    const feed =
        document.getElementById("video-feed");

    if (!feed) {

        console.log(
            "ℹ️ Video feed নেই"
        );

        return;

    }

    const videos =
        Array.from(
            feed.querySelectorAll(
                ".feed-video, video"
            )
        );

    if (!videos.length) {

        console.log(
            "ℹ️ কোনো video নেই"
        );

        return;

    }

    console.log(
        "🎬 Videos:",
        videos.length
    );


    videos.forEach(video => {

        video.setAttribute(
            "playsinline",
            ""
        );

        video.setAttribute(
            "preload",
            "metadata"
        );

        video.muted = true;


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


        video.addEventListener(
            "click",
            () => {

                if (video.paused) {

                    video.play().catch(() => {});

                } else {

                    video.pause();

                }

            }
        );

    });


    setupVideoObserver(videos);

}


/* =========================================================
   VIDEO OBSERVER
   ========================================================= */

function setupVideoObserver(videos) {

    if (
        typeof IntersectionObserver ===
        "undefined"
    ) {

        videos[0].play().catch(() => {});

        return;

    }


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

}


/* =========================================================
   STORAGE
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
            source?.src ||
            video.currentSrc ||
            video.src ||
            "";

        if (src) {

            item.dataset.videoId =
                "video-" +
                btoa(src)
                    .replace(
                        /[^a-zA-Z0-9]/g,
                        ""
                    )
                    .slice(0, 30);

        }

    }

    if (!item.dataset.videoId) {

        item.dataset.videoId =
            "video-" +
            Date.now();

    }

    return item.dataset.videoId;

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
            button.closest(".video-item");

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
                    liked.includes(videoId);


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

                    addWWCNotification(
                        "❤️ আপনি একটি ভিডিওতে Like দিয়েছেন"
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
        liked.includes(videoId);

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

                if (!item) {

                    return;

                }

                currentCommentVideo =
                    getWWCVideoId(item);

                openCommentBox();

            }
        );

    });

}


function setupCommentBox() {

    const box =
        document.getElementById(
            "commentBox"
        );

    const cancel =
        document.getElementById(
            "commentCancel"
        );

    const send =
        document.getElementById(
            "commentSend"
        );

    const input =
        document.getElementById(
            "commentInput"
        );

    if (!box) {

        return;

    }


    if (cancel) {

        cancel.addEventListener(
            "click",
            () => {

                closeCommentBox();

            }
        );

    }


    if (send) {

        send.addEventListener(
            "click",
            () => {

                const text =
                    input
                        ? input.value.trim()
                        : "";

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


                if (
                    !comments[currentCommentVideo]
                ) {

                    comments[
                        currentCommentVideo
                    ] = [];

                }


                comments[
                    currentCommentVideo
                ].push({

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


                if (input) {

                    input.value = "";

                }


                closeCommentBox();


                addWWCNotification(
                    "💬 নতুন Comment যোগ হয়েছে"
                );


                showWWCMessage(
                    "✅ Comment যোগ হয়েছে"
                );

            }
        );

    }

}


function openCommentBox() {

    const box =
        document.getElementById(
            "commentBox"
        );

    if (box) {

        box.style.display =
            "block";

    }

}


function closeCommentBox() {

    const box =
        document.getElementById(
            "commentBox"
        );

    if (box) {

        box.style.display =
            "none";

    }

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
            button.closest(".video-item");

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
                    saved.indexOf(videoId);

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
                        isSaved ? "1" : "0";

                }


                showWWCMessage(
                    isSaved
                        ? "🔖 Saved"
                        : "🔖 Unsaved"
                );

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
        saved.includes(videoId);

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
            isSaved ? "1" : "0";

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

                const video =
                    item
                        ? item.querySelector(
                            "video"
                        )
                        : null;

                const url =
                    video?.currentSrc ||
                    window.location.href;


                try {

                    if (
                        navigator.share
                    ) {

                        await navigator.share({

                            title:
                                "World Wide Connect",

                            text:
                                "Check this video on World Wide Connect 🌍",

                            url:
                                url

                        });

                    } else if (
                        navigator.clipboard
                    ) {

                        await navigator.clipboard.writeText(
                            window.location.href
                        );

                        showWWCMessage(
                            "✅ Link কপি হয়েছে"
                        );

                    } else {

                        showWWCMessage(
                            "📤 Share করার অপশন পাওয়া যায়নি"
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
        ".follow-btn, #followBtn"
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

        const usernameElement =
            item?.querySelector(
                ".username"
            );

        const username =
            usernameElement
                ? usernameElement.textContent.trim()
                : "wwc_user";


        const following =
            wwcGetStorage(
                "wwc_following",
                []
            );


        updateFollowButton(
            button,
            following.includes(username)
        );


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                const list =
                    wwcGetStorage(
                        "wwc_following",
                        []
                    );

                const index =
                    list.indexOf(username);

                let isFollowing = false;


                if (index !== -1) {

                    list.splice(
                        index,
                        1
                    );

                } else {

                    list.push(
                        username
                    );

                    isFollowing = true;

                }


                wwcSetStorage(
                    "wwc_following",
                    list
                );


                updateFollowButton(
                    button,
                    isFollowing
                );


                showWWCMessage(
                    isFollowing
                        ? "✅ Following"
                        : "Following থেকে সরানো হয়েছে"
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

    const searchInput =
        document.querySelector(
            "#searchInput, .search-input"
        );

    const searchButton =
        document.querySelector(
            "#searchBtn, .search-btn"
        );


    if (!searchInput) {

        return;

    }


    function performSearch() {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();


        if (!query) {

            showWWCMessage(
                "⚠️ কিছু লিখে Search করুন"
            );

            return;

        }


        const items =
            document.querySelectorAll(
                ".video-item, .user-item, .search-item"
            );


        let found = 0;


        items.forEach(item => {

            const text =
                item.textContent
                    .toLowerCase();


            if (
                text.includes(query)
            ) {

                item.style.display =
                    "";

                found++;

            } else {

                item.style.display =
                    "none";

            }

        });


        showWWCMessage(
            found
                ? "🔎 " + found + " টি ফলাফল পাওয়া গেছে"
                : "❌ কিছু পাওয়া যায়নি"
        );

    }


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                performSearch();

            }
        );

    }


    searchInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                performSearch();

            }

        }
    );

}


/* =========================================================
   CLEAR SEARCH
   ========================================================= */

function setupSearchClear() {

    const clearButton =
        document.querySelector(
            "#clearSearch, .clear-search"
        );

    if (!clearButton) {

        return;

    }


    clearButton.addEventListener(
        "click",
        () => {

            const input =
                document.querySelector(
                    "#searchInput, .search-input"
                );

            if (input) {

                input.value = "";

            }


            document.querySelectorAll(
                ".video-item, .user-item, .search-item"
            ).forEach(item => {

                item.style.display = "";

            });

        }
    );

}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function addWWCNotification(text) {

    const notifications =
        wwcGetStorage(
            "wwc_notifications",
            []
        );


    notifications.unshift({

        text: text,

        time:
            new Date().toISOString(),

        read: false

    });


    if (
        notifications.length > 50
    ) {

        notifications.pop();

    }


    wwcSetStorage(
        "wwc_notifications",
        notifications
    );


    updateNotificationCount();

}


function updateNotificationCount() {

    const notifications =
        wwcGetStorage(
            "wwc_notifications",
            []
        );


    const unread =
        notifications.filter(
            item => !item.read
        ).length;


    document.querySelectorAll(
        ".notification-count, #notificationCount"
    ).forEach(counter => {

        counter.textContent =
            unread;

        counter.style.display =
            unread > 0
                ? ""
                : "none";

    });

}


function setupNotifications() {

    updateNotificationCount();

}


/* =========================================================
   MUTE BUTTON
   ========================================================= */

function setupMuteButtons() {

    document.querySelectorAll(
        "#muteBtn, .mute-btn"
    ).forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                const item =
                    button.closest(
                        ".video-item"
                    );

                const video =
                    item?.querySelector(
                        "video"
                    );

                if (!video) {

                    return;

                }


                video.muted =
                    !video.muted;


                button.textContent =
                    video.muted
                        ? "🔇"
                        : "🔊";

            }
        );

    });

}


/* =========================================================
   PLAY BUTTON
   ========================================================= */

function setupPlayButtons() {

    document.querySelectorAll(
        "#playBtn, .play-btn"
    ).forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                const item =
                    button.closest(
                        ".video-item"
                    );

                const video =
                    item?.querySelector(
                        "video"
                    );

                if (!video) {

                    return;

                }


                if (video.paused) {

                    video.play().catch(() => {});

                    button.textContent =
                        "⏸️";

                } else {

                    video.pause();

                    button.textContent =
                        "▶️";

                }

            }
        );

    });

}


/* =========================================================
   PROFILE LINKS
   ========================================================= */

function setupProfileLinks() {

    document.querySelectorAll(
        "[data-profile-uid]"
    ).forEach(element => {

        element.addEventListener(
            "click",
            () => {

                const uid =
                    element.dataset.profileUid;

                if (!uid) {

                    return;

                }


                if (!currentUser) {

                    window.location.href =
                        "./auth.html";

                    return;

                }


                window.location.href =
                    "./profile.html?uid=" +
                    encodeURIComponent(uid);

            }
        );

    });

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
   FINAL
   ========================================================= */

console.log(
    "🌍 WWC-Core APP.JS loaded successfully"
);

