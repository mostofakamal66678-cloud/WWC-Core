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
    setDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyCgio17aPEf7d6juqIhn3yi6Mf65W_tO4",

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

let currentCommentVideo = null;


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        startWWC();

    }
);


/* =========================================================
   START WWC
   ========================================================= */

function startWWC() {

    console.log(
        "🌍 WWC-Core starting..."
    );


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


                await createProfile(
                    user
                );


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

async function createProfile(
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
            ".logout-btn, #logoutBtn, .logout-menu-btn"
        );


    loginButtons.forEach(
        button => {

            button.style.display =
                loggedIn
                    ? "none"
                    : "";

        }
    );


    logoutButtons.forEach(
        button => {

            button.style.display =
                loggedIn
                    ? ""
                    : "none";

        }
    );


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

    document
        .querySelectorAll(
            "#homeBtn, .home-btn"
        )
        .forEach(
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

    document
        .querySelectorAll(
            "#profileBtn, .profile-btn"
        )
        .forEach(
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

    document
        .querySelectorAll(
            "#uploadBtn, .upload-btn, #createBtn"
        )
        .forEach(
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


    /* FRIENDS */

    const friendsBtn =
        document.getElementById(
            "friendsBtn"
        );


    if (friendsBtn) {

        friendsBtn.addEventListener(
            "click",
            () => {

                showWWCMessage(
                    "👥 Friends feature শীঘ্রই আসছে"
                );

            }
        );

    }


    /* INBOX */

    const inboxBtn =
        document.getElementById(
            "inboxBtn"
        );


    if (inboxBtn) {

        inboxBtn.addEventListener(
            "click",
            () => {

                showWWCMessage(
                    "💬 Inbox feature শীঘ্রই আসছে"
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
        items
            .map(
                item =>
                    item.querySelector(
                        "video"
                    )
            )
            .filter(
                Boolean
            );


    if (!videos.length) {

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


            video.muted =
                true;


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
                                        other !== video
                                    ) {

                                        other.pause();

                                    }

                                }
                            );


                            const promise =
                                video.play();


                            if (
                                promise &&
                                typeof promise.catch ===
                                "function"
                            ) {

                                promise.catch(
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


    /* প্রথম ভিডিও চালানোর চেষ্টা */

    if (videos[0]) {

        videos[0]
            .play()
            .catch(
                () => {}
            );

    }

}


/* =========================================================
   STORAGE
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


        if (
            value === null
        ) {

            return fallback;

        }


        return JSON.parse(
            value
        );

    } catch (error) {

        console.error(
            "Storage read error:",
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
            "Storage save error:",
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
        video
    ) {

        const source =
            video.querySelector(
                "source"
            );


        const src =
            video.currentSrc ||
            video.src ||
            (
                source
                    ? source.src
                    : ""
            );


        if (src) {

            try {

                item.dataset.videoId =
                    "video-" +
                    btoa(src)
                        .replace(
                            /[^a-zA-Z0-9]/g,
                            ""
                        )
                        .slice(
                            0,
                            30
                        );

            } catch {

                item.dataset.videoId =
                    "video-" +
                    Date.now();

            }

        }

    }


    if (
        !item.dataset.videoId
    ) {

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

    document
        .querySelectorAll(
            ".like-btn, #likeBtn"
        )
        .forEach(
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


                        if (
                            isLiked
                        ) {

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


                            addWWCNotification(
                                "❤️ আপনি একটি ভিডিও Like করেছেন"
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
   COMMENT
   ========================================================= */

function setupCommentButtons() {

    document
        .querySelectorAll(
            ".comment-btn"
        )
        .forEach(
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


                        if (!item) {

                            return;

                        }


                        currentCommentVideo =
                            getWWCVideoId(
                                item
                            );


                        const box =
                            document.getElementById(
                                "commentBox"
                            );


                        const input =
                            document.getElementById(
                                "commentInput"
                            );


                        if (
                            box
                        ) {

                            box.style.display =
                                "block";

                        }


                        if (
                            input
                        ) {

                            input.value =
                                "";

                            input.focus();

                        }

                    }
                );

            }
        );


    const cancel =
        document.getElementById(
            "commentCancel"
        );


    if (cancel) {

        cancel.addEventListener(
            "click",
            closeCommentBox
        );

    }


    const send =
        document.getElementById(
            "commentSend"
        );


    if (send) {

        send.addEventListener(
            "click",
            sendComment
        );

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


    currentCommentVideo =
        null;

}


function sendComment() {

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
            "⚠️ আগে Comment লিখুন"
        );

        return;

    }


    if (!currentCommentVideo) {

        return;

    }


    const comments =
        wwcGetStorage(
            "wwc_comments",
            {}
        );


    if (
        !Array.isArray(
            comments[currentCommentVideo]
        )
    ) {

        comments[currentCommentVideo] =
            [];

    }


    comments[currentCommentVideo]
        .push({

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


    wwcSetStorage(
        "wwc_comments",
        comments
    );


    addWWCNotification(
        "💬 আপনার Comment সংরক্ষণ হয়েছে"
    );


    input.value =
        "";


    closeCommentBox();


    showWWCMessage(
        "✅ Comment যোগ হয়েছে"
    );

}


/* =========================================================
   SAVE
   ========================================================= */

function setupSaveButtons() {

    document
        .querySelectorAll(
            ".save-btn"
        )
        .forEach(
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


                        let saving =
                            false;


                        if (
                            index !== -1
                        ) {

                            saved.splice(
                                index,
                                1
                            );

                        } else {

                            saved.push(
                                videoId
                            );

                            saving =
                                true;

                        }


                        wwcSetStorage(
                            "wwc_saved_videos",
                            saved
                        );


                        button.classList.toggle(
                            "saved",
                            saving
                        );


                        button.setAttribute(
                            "aria-pressed",
                            String(
                                saving
                            )
                        );


                        const count =
                            button.querySelector(
                                ".save-count"
                            );


                        if (
                            count
                        ) {

                            count.textContent =
                                saving
                                    ? "1"
                                    : "0";

                        }


                        showWWCMessage(
                            saving
                                ? "🔖 Video Saved"
                                : "🔖 Video থেকে Save সরানো হয়েছে"
                        );

                    }
                );

            }
        );

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
        String(
            isSaved
        );


    const count =
        button.querySelector(
            ".save-count"
        );


    if (
        count
    ) {

        count.textContent =
            isSaved
                ? "1"
                : "0";

    }

}


/* =========================================================
   SHARE
   ========================================================= */

function setupShareButtons() {

    document
        .querySelectorAll(
            ".share-btn"
        )
        .forEach(
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


                        if (!item) {

                            return;

                        }


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


                        const url =
                            (
                                video &&
                                video.currentSrc
                            ) ||
                            (
                                source &&
                                source.src
                            ) ||
                            window.location.href;


                        try {

                            if (
                                navigator.share
                            ) {

                                await navigator.share({

                                    title:
                                        "World Wide Connect",

                                    text:
                                        getVideoTitle(
                                            item
                                        ),

                                    url:
                                        url

                                });

                            } else {

                                await navigator.clipboard.writeText(
                                    url
                                );


                                showWWCMessage(
                                    "🔗 Video link Copy হয়েছে"
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

    document
        .querySelectorAll(
            ".follow-btn"
        )
        .forEach(
            button => {

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


                const username =
                    (
                        item.querySelector(
                            ".username"
                        ) || {}
                    ).textContent
                        ? item.querySelector(
                            ".username"
                        ).textContent.trim()
                        : "wwc_user";


                const key =
                    "wwc_follow_" +
                    username;


                const following =
                    localStorage.getItem(
                        key
                    ) === "true";


                updateFollowButton(
                    button,
                    following
                );


                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();


                        const oldState =
                            localStorage.getItem(
                                key
                            ) === "true";


                        const newState =
                            !oldState;


                        localStorage.setItem(
                            key,
                            String(
                                newState
                            )
                        );


                        updateFollowButton(
                            button,
                            newState
                        );


                        showWWCMessage(
                            newState
                                ? "✅ Follow করা হয়েছে"
                                : "Follow সরানো হয়েছে"
                        );

                    }
                );

            }
        );

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
        String(
            following
        )
    );

}


/* =========================================================
   TITLE + CAPTION
   ========================================================= */

function getVideoTitle(
    item
) {

    if (!item) {

        return "World Wide Connect";

    }


    const title =
        item.querySelector(
            ".video-title"
        );


    if (
        title &&
        title.textContent.trim()
    ) {

        return title.textContent.trim();

    }


    return "World Wide Connect Video";

}


function setupVideoText() {

    document
        .querySelectorAll(
            ".video-item"
        )
        .forEach(
            item => {

                const caption =
                    item.querySelector(
                        ".video-caption"
                    );


                if (
                    caption &&
                    !caption.dataset.wwcReady
                ) {

                    caption.dataset.wwcReady =
                        "true";

                }

            }
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


    if (
        !searchInput
    ) {

        if (searchButton) {

            searchButton.addEventListener(
                "click",
                () => {

                    showWWCMessage(
                        "🔎 Search box পাওয়া যায়নি"
                    );

                }
            );

        }

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

                }

            }
        );


        showWWCMessage(
            found
                ? "🔎 " + found + " টি ফলাফল পাওয়া গেছে"
                : "❌ কিছু পাওয়া যায়নি"
        );

    }


    if (
        searchButton
    ) {

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


    if (
        !clearButton
    ) {

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


            document
                .querySelectorAll(
                    ".video-item, .user-item, .search-item"
                )
                .forEach(
                    item => {

                        item.style.display =
                            "";

                    }
                );

        }
    );

}


/* =========================================================
   NOTIFICATIONS
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


    document
        .querySelectorAll(
            ".notification-count, #notificationCount"
        )
        .forEach(
            counter => {

                counter.textContent =
                    unread;

                counter.style.display =
                    unread
                        ? ""
                        : "none";

            }
        );

}


function setupNotifications() {

    updateNotificationCount();

}


/* =========================================================
   MUTE BUTTON
   ========================================================= */

function setupMuteButtons() {

    document
        .querySelectorAll(
            ".mute-btn, #muteBtn"
        )
        .forEach(
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
   PLAY / PAUSE BUTTON
   ========================================================= */

function setupPlayButtons() {

    document
        .querySelectorAll(
            ".play-btn, #playBtn"
        )
        .forEach(
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

                            video
                                .play()
                                .catch(
                                    () => {}
                                );

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
   PROFILE LINKS
   ========================================================= */

function setupProfileLinks() {

    document
        .querySelectorAll(
            ".profile-photo, .profile-area, .username"
        )
        .forEach(
            element => {

                if (
                    element.dataset.wwcProfileReady ===
                    "true"
                ) {

                    return;

                }


                element.dataset.wwcProfileReady =
                    "true";


                element.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target.closest(
                                ".follow-btn"
                            )
                        ) {

                            return;

                        }


                        if (!currentUser) {

                            window.location.href =
                                "./auth.html";

                            return;

                        }


                        const item =
                            element.closest(
                                ".video-item"
                            );


                        const usernameElement =
                            item
                                ? item.querySelector(
                                    ".username"
                                )
                                : null;


                        const username =
                            usernameElement
                                ? usernameElement.textContent.trim()
                                : "";


                        if (
                            username
                        ) {

                            window.location.href =
                                "./profile.html?username=" +
                                encodeURIComponent(
                                    username
                                );

                        } else {

                            window.location.href =
                                "./profile.html";

                        }

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
            "85px";

        message.style.transform =
            "translateX(-50%)";

        message.style.zIndex =
            "99999";

        message.style.padding =
            "12px 18px";

        message.style.borderRadius =
            "12px";

        message.style.background =
            "#222";

        message.style.color =
            "#fff";

        message.style.fontSize =
            "14px";

        message.style.maxWidth =
            "85%";

        message.style.textAlign =
            "center";

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
   GLOBAL WWC API
   ========================================================= */

window.WWC = {

    getCurrentUser:
        () => currentUser,

    logout:
        () => logoutUser(),

    getAuth:
        () => auth,

    getFirestore:
        () => db,

    showMessage:
        text => showWWCMessage(text)

};


/* =========================================================
   FINAL INITIALIZATION
   ========================================================= */

setupVideoText();

updateNotificationCount();


console.log(
    "🌍 WWC-Core APP.JS loaded successfully"
);
