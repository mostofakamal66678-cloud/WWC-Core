/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   APP.JS
   PART 1 / 3

   Firebase
   Authentication
   User Profile
   Login / Logout
   Navigation
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
   GLOBAL USER
   ========================================================= */

let currentUser = null;


/* =========================================================
   START WWC
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        startWWC();

    }
);


/* =========================================================
   MAIN START
   ========================================================= */

function startWWC() {

    console.log(
        "🌍 WWC-Core starting..."
    );

    setupAuthentication();

    setupNavigation();

    setupLogout();

    console.log(
        "✅ WWC-Core ready"
    );

}


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
                    "✅ Login:",
                    user.email || user.uid
                );

                await createProfile(user);

                updateLoginUI(
                    true,
                    user
                );

            } else {

                console.log(
                    "ℹ️ User not logged in"
                );

                updateLoginUI(
                    false,
                    null
                );

            }

        }
    );

}


/* =========================================================
   CREATE USER PROFILE
   ========================================================= */

async function createProfile(user) {

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

            const profile = {

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

                dob:
                    "",

                age:
                    "",

                gender:
                    "",

                country:
                    "Bangladesh",

                followers:
                    0,

                following:
                    0,

                likes:
                    0,

                createdAt:
                    new Date().toISOString()

            };

            await setDoc(
                userRef,
                profile
            );

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

function updateLoginUI(
    loggedIn,
    user
) {

    const loginButtons =
        document.querySelectorAll(
            ".login-btn, #loginBtn"
        );

    const logoutButtons =
        document.querySelectorAll(
            ".logout-btn, #logoutBtn"
        );


    /* LOGIN BUTTON */

    loginButtons.forEach(
        button => {

            button.style.display =
                loggedIn
                    ? "none"
                    : "";

        }
    );


    /* LOGOUT BUTTON */

    logoutButtons.forEach(
        button => {

            button.style.display =
                loggedIn
                    ? ""
                    : "none";

        }
    );


    /* USER NAME */

    const userNames =
        document.querySelectorAll(
            ".current-user-name"
        );

    userNames.forEach(
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

        console.log(
            "✅ Logout successful"
        );

        window.location.href =
            "./auth.html";

    } catch (error) {

        console.error(
            "❌ Logout error:",
            error
        );

        alert(
            "Logout করা যায়নি। আবার চেষ্টা করুন।"
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

    buttons.forEach(
        button => {

            if (
                button.dataset.wwcReady ===
                "true"
            ) {

                return;

            }

            button.dataset.wwcReady =
                "true";

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    logoutUser();

                }
            );

        }
    );

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {


    /* HOME */

    const homeButtons =
        document.querySelectorAll(
            "#homeBtn, .home-btn"
        );

    homeButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "./index.html";

                }
            );

        }
    );


    /* PROFILE */

    const profileButtons =
        document.querySelectorAll(
            "#profileBtn, .profile-btn"
        );

    profileButtons.forEach(
        button => {

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

        }
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

    }

};


/* =========================================================
   END PART 1 / 3
   ========================================================= */
/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   APP.JS
   PART 2 / 3

   Video Feed
   Auto Play
   Like
   Comment
   Save
   Share
   ========================================================= */


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

    const videos =
        Array.from(
            feed.querySelectorAll(
                "video, .feed-video"
            )
        );

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


    videos.forEach(
        video => {

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

                    videos.forEach(
                        other => {

                            if (
                                other !== video &&
                                !other.paused
                            ) {

                                other.pause();

                            }

                        }
                    );

                }
            );

        }
    );


    setupVideoObserver(
        videos
    );

}


/* =========================================================
   VIDEO AUTO PLAY OBSERVER
   ========================================================= */

function setupVideoObserver(
    videos
) {

    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        const video =
                            entry.target;


                        if (
                            entry.isIntersecting &&
                            entry.intersectionRatio >= 0.65
                        ) {

                            videos.forEach(
                                other => {

                                    if (
                                        other !== video &&
                                        !other.paused
                                    ) {

                                        other.pause();

                                    }

                                }
                            );


                            const play =
                                video.play();


                            if (
                                play &&
                                typeof play.catch ===
                                "function"
                            ) {

                                play.catch(
                                    () => {

                                        console.log(
                                            "Autoplay blocked"
                                        );

                                    }
                                );

                            }

                        } else {

                            if (
                                !video.paused
                            ) {

                                video.pause();

                            }

                        }

                    }
                );

            },
            {
                threshold: [
                    0.25,
                    0.50,
                    0.65,
                    0.80
                ]
            }
        );


    videos.forEach(
        video => {

            observer.observe(
                video
            );

        }
    );

}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function wwcGetStorage(
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

    } catch (error) {

        console.error(
            "Storage Read Error:",
            error
        );

        return fallback;

    }

}


function wwcSetStorage(
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

    } catch (error) {

        console.error(
            "Storage Save Error:",
            error
        );

    }

}


/* =========================================================
   VIDEO ID
   ========================================================= */

function getWWCVideoId(
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
        video.src
    ) {

        item.dataset.videoId =
            "video-" +
            btoa(
                video.src
            )
            .replace(
                /[^a-zA-Z0-9]/g,
                ""
            )
            .slice(
                0,
                30
            );

    } else {

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

    const buttons =
        document.querySelectorAll(
            ".like-btn, #likeBtn"
        );


    buttons.forEach(
        button => {

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
                getWWCVideoId(
                    item
                );


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
                            likes[videoId] ||
                            0
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


                        if (
                            index !== -1
                        ) {

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
                        String(
                            !isLiked
                        )
                    );


                    const countElement =
                        button.querySelector(
                            ".like-count"
                        );


                    if (
                        countElement
                    ) {

                        countElement.textContent =
                            count;

                    }

                }
            );

        }
    );

}


/* =========================================================
   LOAD LIKE STATE
   ========================================================= */

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
            likes[videoId] ||
            0
        );


    const isLiked =
        liked.includes(
            videoId
        );


    const countElement =
        button.querySelector(
            ".like-count"
        );


    if (
        countElement
    ) {

        countElement.textContent =
            count;

    }


    button.classList.toggle(
        "liked",
        isLiked
    );


    button.setAttribute(
        "aria-pressed",
        String(
            isLiked
        )
    );

}


/* =========================================================
   SAVE VIDEO
   ========================================================= */

function setupSaveButtons() {

    const buttons =
        document.querySelectorAll(
            ".save-btn, #saveBtn"
        );


    buttons.forEach(
        button => {

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
                getWWCVideoId(
                    item
                );


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


                    if (
                        index !== -1
                    ) {

                        saved.splice(
                            index,
                            1
                        );

                        button.classList.remove(
                            "saved"
                        );

                        button.setAttribute(
                            "aria-pressed",
                            "false"
                        );

                    } else {

                        saved.push(
                            videoId
                        );

                        button.classList.add(
                            "saved"
                        );

                        button.setAttribute(
                            "aria-pressed",
                            "true"
                        );

                    }


                    wwcSetStorage(
                        "wwc_saved_videos",
                        saved
                    );

                }
            );

        }
    );

}


/* =========================================================
   LOAD SAVE STATE
   ========================================================= */

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
        String(
            isSaved
        )
    );

}


/* =========================================================
   COMMENT
   ========================================================= */

function setupCommentButtons() {

    const buttons =
        document.querySelectorAll(
            ".comment-btn, #commentBtn"
        );


    buttons.forEach(
        button => {

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


                    const videoId =
                        getWWCVideoId(
                            item
                        );


                    const text =
                        prompt(
                            "আপনার Comment লিখুন:"
                        );


                    if (
                        !text ||
                        !text.trim()
                    ) {

                        return;

                    }


                    const comments =
                        wwcGetStorage(
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
                            text.trim(),

                        user:
                            currentUser
                                ? (
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


                    alert(
                        "✅ Comment যোগ হয়েছে"
                    );

                }
            );

        }
    );

}


/* =========================================================
   SHARE
   ========================================================= */

function setupShareButtons() {

    const buttons =
        document.querySelectorAll(
            ".share-btn, #shareBtn"
        );


    buttons.forEach(
        button => {

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


                    let url =
                        window.location.href;


                    if (item) {

                        const video =
                            item.querySelector(
                                "video"
                            );


                        if (
                            video &&
                            video.currentSrc
                        ) {

                            url =
                                video.currentSrc;

                        }

                    }


                    try {

                        if (
                            navigator.share
                        ) {

                            await navigator.share({

                                title:
                                    "WWC Video",

                                text:
                                    "World Wide Connect",

                                url:
                                    url

                            });

                        } else {

                            await navigator.clipboard.writeText(
                                url
                            );

                            alert(
                                "✅ Video link copy হয়েছে"
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
   PART 2 INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupVideoFeed();

        setupLikeButtons();

        setupSaveButtons();

        setupCommentButtons();

        setupShareButtons();
setupFollowButtons();
        console.log(
            "✅ WWC Part 2 loaded"
        );

    }
);


/* =========================================================
   END PART 2 / 3
   ========================================================= */
/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   APP.JS
   PART 3 / 3

   Follow
   Search
   Notifications
   Video Controls
   Extra Buttons
   ========================================================= */


/* =========================================================
   FOLLOW SYSTEM
   ========================================================= */

function setupFollowButtons() {

    const buttons =
        document.querySelectorAll(
            ".follow-btn, #followBtn"
        );

    buttons.forEach(
        button => {

            if (
                button.dataset.wwcFollowReady ===
                "true"
            ) {
                return;
            }

            button.dataset.wwcFollowReady =
                "true";


            const targetId =
                button.dataset.userId ||
                button.dataset.uid ||
                "";


            if (!targetId) {
                return;
            }


            const key =
                "wwc_following";


            let following =
                wwcGetStorage(
                    key,
                    []
                );


            updateFollowButton(
                button,
                following.includes(
                    targetId
                )
            );


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();


                    following =
                        wwcGetStorage(
                            key,
                            []
                        );


                    const index =
                        following.indexOf(
                            targetId
                        );


                    let isFollowing;


                    if (index !== -1) {

                        following.splice(
                            index,
                            1
                        );

                        isFollowing = false;

                    } else {

                        following.push(
                            targetId
                        );

                        isFollowing = true;

                    }


                    wwcSetStorage(
                        key,
                        following
                    );


                    updateFollowButton(
                        button,
                        isFollowing
                    );


                    showWWCMessage(
                        isFollowing
                            ? "✅ Follow করা হয়েছে"
                            : "ℹ️ Unfollow করা হয়েছে"
                    );

                }
            );

        }
    );

}


/* =========================================================
   FOLLOW BUTTON UI
   ========================================================= */

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
        String(
            following
        )
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

                }

            }
        );


        if (!found) {

            showWWCMessage(
                "❌ কিছু পাওয়া যায়নি"
            );

        } else {

            showWWCMessage(
                "🔎 " +
                found +
                " টি ফলাফল পাওয়া গেছে"
            );

        }

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

                input.value =
                    "";

            }


            const items =
                document.querySelectorAll(
                    ".video-item, .user-item, .search-item"
                );


            items.forEach(
                item => {

                    item.style.display =
                        "";

                }
            );

        }
    );

}


/* =========================================================
   NOTIFICATION SYSTEM
   ========================================================= */

function addWWCNotification(
    text
) {

    const notifications =
        wwcGetStorage(
            "wwc_notifications",
            []
        );


    notifications.unshift({

        text:
            text,

        time:
            new Date().toISOString(),

        read:
            false

    });


    if (
        notifications.length >
        50
    ) {

        notifications.pop();

    }


    wwcSetStorage(
        "wwc_notifications",
        notifications
    );


    updateNotificationCount();

}


/* =========================================================
   NOTIFICATION COUNT
   ========================================================= */

function updateNotificationCount() {

    const notifications =
        wwcGetStorage(
            "wwc_notifications",
            []
        );


    const unread =
        notifications.filter(
            item =>
                !item.read
        ).length;


    const counters =
        document.querySelectorAll(
            ".notification-count, #notificationCount"
        );


    counters.forEach(
        counter => {

            counter.textContent =
                unread;

            counter.style.display =
                unread > 0
                    ? ""
                    : "none";

        }
    );

}


/* =========================================================
   SHOW NOTIFICATIONS
   ========================================================= */

function setupNotifications() {

    const buttons =
        document.querySelectorAll(
            "#notificationBtn, .notification-btn"
        );


    updateNotificationCount();


    buttons.forEach(
        button => {

            if (
                button.dataset.wwcNotificationReady ===
                "true"
            ) {

                return;

            }


            button.dataset.wwcNotificationReady =
                "true";


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    const notifications =
                        wwcGetStorage(
                            "wwc_notifications",
                            []
                        );


                    if (
                        !notifications.length
                    ) {

                        showWWCMessage(
                            "🔔 কোনো Notification নেই"
                        );

                        return;

                    }


                    const unread =
                        notifications.filter(
                            item =>
                                !item.read
                        ).length;


                    showWWCMessage(
                        "🔔 " +
                        notifications.length +
                        " টি Notification আছে (" +
                        unread +
                        " টি নতুন)"
                    );


                    notifications.forEach(
                        item => {

                            item.read =
                                true;

                        }
                    );


                    wwcSetStorage(
                        "wwc_notifications",
                        notifications
                    );


                    updateNotificationCount();

                }
            );

        }
    );

}


/* =========================================================
   VIDEO MUTE BUTTON
   ========================================================= */

function setupMuteButtons() {

    const buttons =
        document.querySelectorAll(
            ".mute-btn, #muteBtn"
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


                    const video =
                        item
                            ? item.querySelector(
                                "video"
                              )
                            : null;


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

        }
    );

}


/* =========================================================
   VIDEO PLAY / PAUSE BUTTON
   ========================================================= */

function setupPlayButtons() {

    const buttons =
        document.querySelectorAll(
            ".play-btn, #playBtn"
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


                    const video =
                        item
                            ? item.querySelector(
                                "video"
                              )
                            : null;


                    if (!video) {
                        return;
                    }


                    if (
                        video.paused
                    ) {

                        video.play();

                        button.textContent =
                            "⏸️";

                    } else {

                        video.pause();

                        button.textContent =
                            "▶️";

                    }

                }
            );

        }
    );

}


/* =========================================================
   PROFILE BUTTONS
   ========================================================= */

function setupProfileLinks() {

    const buttons =
        document.querySelectorAll(
            ".user-profile-btn, .view-profile-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    const uid =
                        button.dataset.userId ||
                        button.dataset.uid;


                    if (!uid) {

                        window.location.href =
                            "./profile.html";

                        return;

                    }


                    window.location.href =
                        "./profile.html?uid=" +
                        encodeURIComponent(
                            uid
                        );

                }
            );

        }
    );

}


/* =========================================================
   GLOBAL MESSAGE
   ========================================================= */

function showWWCMessage(
    text
) {

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
            "99999";

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
   INITIALIZE PART 3
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupFollowButtons();

        setupSearch();

        setupSearchClear();

        setupNotifications();

        setupMuteButtons();

        setupPlayButtons();

        setupProfileLinks();

        console.log(
            "✅ WWC Part 3 loaded"
        );

    }
);


/* =========================================================
   FINAL WWC START
   ========================================================= */

console.log(
    "🌍 WWC-Core APP.JS loaded successfully"
);


/* =========================================================
   END PART 3 / 3
   ========================================================= */
