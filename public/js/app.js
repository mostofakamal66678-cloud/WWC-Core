/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   NEW APP.JS
   PART 1 / 5
   FIREBASE + AUTH + VIDEO FEED
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
    apiKey: "AIzaSyCgio17aPEfR7d6juqIhn3yi6Mf65W_tO4",
    authDomain: "world-wide-connect-62c87.firebaseapp.com",
    projectId: "world-wide-connect-62c87",
    storageBucket: "world-wide-connect-62c87.firebasestorage.app",
    messagingSenderId: "93178453668",
    appId: "1:93178453668:web:2184630caa8e61f7445031",
    measurementId: "G-PKFJ5NEMGQ"
};


/* =========================================================
   FIREBASE START
   ========================================================= */

const app = getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let currentUser = null;
let currentVideoIndex = 0;


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";


    /* =====================================================
       HELPERS
       ===================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));


    const videoFeed = $("#video-feed");


    /* =====================================================
       AUTH STATE
       ===================================================== */

    onAuthStateChanged(auth, async (user) => {

        currentUser = user || null;


        if (user) {

            console.log(
                "✅ WWC User logged in:",
                user.email || user.uid
            );

            await ensureUserProfile(user);

        } else {

            console.log(
                "ℹ️ No user currently logged in."
            );

        }

    });


    /* =====================================================
       ENSURE USER PROFILE
       ===================================================== */

    async function ensureUserProfile(user) {

        try {

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const snapshot =
                await getDoc(userRef);


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
                        user.photoURL ||
                        "./images/profile.png",

                    dob: "",
                    age: "",
                    gender: "",
                    country: "Bangladesh",

                    followers: 0,
                    following: 0,
                    likes: 0,

                    createdAt:
                        new Date().toISOString()

                };


                await setDoc(
                    userRef,
                    profile
                );


                console.log(
                    "✅ WWC profile created."
                );

            }

        } catch (error) {

            console.error(
                "Profile check error:",
                error
            );

        }

    }


    /* =====================================================
       VIDEO ELEMENTS
       ===================================================== */

    function getVideos() {

        if (!videoFeed) {
            return [];
        }

        return $$(
            ".feed-video",
            videoFeed
        );

    }


    function getVideoItems() {

        if (!videoFeed) {
            return [];
        }

        return $$(
            ".video-item",
            videoFeed
        );

    }


    /* =====================================================
       VIDEO ID
       ===================================================== */

    function getVideoId(item) {

        if (!item) {
            return "";
        }


        if (!item.dataset.videoId) {

            item.dataset.videoId =
                "video-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .substring(2, 9);

        }


        return item.dataset.videoId;

    }


    /* =====================================================
       PREPARE VIDEOS
       ===================================================== */

    function prepareVideos() {

        const videos =
            getVideos();


        videos.forEach((video) => {

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


            video.addEventListener(
                "loadedmetadata",
                () => {

                    console.log(
                        "Video ready:",
                        video.currentSrc ||
                        video.src
                    );

                }
            );


            video.addEventListener(
                "error",
                () => {

                    console.error(
                        "❌ Video load error:",
                        video.currentSrc ||
                        video.src
                    );

                }
            );

        });


        const items =
            getVideoItems();


        items.forEach((item) => {

            getVideoId(item);

        });

    }


    /* =====================================================
       STOP ALL VIDEOS
       ===================================================== */

    function stopAllVideos() {

        const videos =
            getVideos();


        videos.forEach((video) => {

            try {

                video.pause();

            } catch (error) {

                console.error(
                    "Video pause error:",
                    error
                );

            }

        });

    }


    /* =====================================================
       PLAY ACTIVE VIDEO
       ===================================================== */

    async function playActiveVideo(video) {

        if (!video) {
            return;
        }


        stopAllVideos();


        try {

            video.currentTime = 0;

            await video.play();


        } catch (error) {

            console.log(
                "Autoplay blocked:",
                error.message
            );

        }

    }


    /* =====================================================
       VIDEO INTERSECTION OBSERVER
       ===================================================== */

    function setupVideoObserver() {

        const items =
            getVideoItems();


        if (!items.length) {

            console.log(
                "ℹ️ No video items found."
            );

            return;

        }


        const observer =
            new IntersectionObserver(
                (entries) => {

                    entries.forEach(
                        (entry) => {

                            if (
                                entry.isIntersecting &&
                                entry.intersectionRatio >= 0.65
                            ) {

                                const item =
                                    entry.target;


                                currentVideoIndex =
                                    items.indexOf(
                                        item
                                    );


                                const video =
                                    $(".feed-video", item);


                                if (video) {

                                    playActiveVideo(
                                        video
                                    );

                                }

                            }

                        }
                    );

                },
                {
                    threshold: [
                        0.65,
                        0.8,
                        0.95
                    ]
                }
            );


        items.forEach((item) => {

            observer.observe(item);

        });


        /* =========================================
           FIRST VIDEO
           ========================================= */

        setTimeout(() => {

            const firstVideo =
                $(".feed-video", items[0]);


            if (firstVideo) {

                playActiveVideo(
                    firstVideo
                );

            }

        }, 300);

    }


    /* =====================================================
       VIDEO CLICK
       ===================================================== */

    function setupVideoClick() {

        const videos =
            getVideos();


        videos.forEach((video) => {

            if (
                video.dataset.wwcClickReady ===
                "true"
            ) {

                return;

            }


            video.dataset.wwcClickReady =
                "true";


            video.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();


                    if (video.paused) {

                        video.play().catch(
                            () => {}
                        );

                    } else {

                        video.pause();

                    }

                }
            );

        });

    }


    /* =====================================================
       KEYBOARD VIDEO CONTROL
       ===================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            const videos =
                getVideos();


            if (!videos.length) {
                return;
            }


            if (
                event.key ===
                "ArrowDown"
            ) {

                event.preventDefault();

                goToVideo(
                    currentVideoIndex + 1
                );

            }


            if (
                event.key ===
                "ArrowUp"
            ) {

                event.preventDefault();

                goToVideo(
                    currentVideoIndex - 1
                );

            }

        }
    );


    /* =====================================================
       GO TO VIDEO
       ===================================================== */

    function goToVideo(index) {

        const items =
            getVideoItems();


        if (!items.length) {
            return;
        }


        if (index < 0) {
            index = 0;
        }


        if (index >= items.length) {
            index = items.length - 1;
        }


        currentVideoIndex =
            index;


        items[index].scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    /* =====================================================
       TOUCH / SWIPE
       ===================================================== */

    let touchStartY = 0;
    let touchEndY = 0;


    if (videoFeed) {

        videoFeed.addEventListener(
            "touchstart",
            (event) => {

                if (
                    event.touches &&
                    event.touches.length
                ) {

                    touchStartY =
                        event.touches[0].clientY;

                }

            },
            {
                passive: true
            }
        );


        videoFeed.addEventListener(
            "touchend",
            (event) => {

                if (
                    event.changedTouches &&
                    event.changedTouches.length
                ) {

                    touchEndY =
                        event.changedTouches[0].clientY;

                }


                const difference =
                    touchStartY -
                    touchEndY;


                if (
                    Math.abs(difference) < 50
                ) {

                    return;

                }


                if (difference > 0) {

                    goToVideo(
                        currentVideoIndex + 1
                    );

                } else {

                    goToVideo(
                        currentVideoIndex - 1
                    );

                }

            },
            {
                passive: true
            }
        );

    }


    /* =====================================================
       LOGOUT
       ===================================================== */

    window.wwcLogout = async function () {

        try {

            await signOut(auth);

            console.log(
                "✅ Logout successful."
            );


            window.location.href =
                "./auth.html";


        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            alert(
                "❌ Logout করা যায়নি। আবার চেষ্টা করুন।"
            );

        }

    };


    /* =====================================================
       INITIALIZE PART 1
       ===================================================== */

    prepareVideos();

    setupVideoClick();

    setupVideoObserver();


    console.log(
        "🌍 WWC-Core app.js Part 1 loaded successfully."
    );

});


/* =========================================================
   END OF PART 1 / 5
   ========================================================= */
/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   NEW APP.JS
   PART 2 / 5
   LIKE + SAVE + FOLLOW
   ========================================================= */


/* =========================================================
   LOCAL STORAGE HELPERS
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
            "WWC Storage Read Error:",
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
            "WWC Storage Save Error:",
            error
        );

    }

}


/* =========================================================
   GET VIDEO ID
   ========================================================= */

function wwcGetVideoId(item) {

    if (!item) {
        return "";
    }


    if (!item.dataset.videoId) {

        item.dataset.videoId =
            "video-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 9);

    }


    return item.dataset.videoId;

}


/* =========================================================
   LIKE BUTTON
   ========================================================= */

function wwcInitializeLike(button) {

    if (!button) {
        return;
    }


    if (
        button.dataset.wwcLikeReady ===
        "true"
    ) {

        return;

    }


    button.dataset.wwcLikeReady =
        "true";


    button.addEventListener(
        "click",
        (event) => {

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
                wwcGetVideoId(item);


            const likes =
                wwcGetStorage(
                    "wwc_likes",
                    {}
                );


            const likedVideos =
                wwcGetStorage(
                    "wwc_liked_videos",
                    []
                );


            const alreadyLiked =
                likedVideos.includes(
                    videoId
                );


            let count =
                Number(
                    likes[videoId] || 0
                );


            if (alreadyLiked) {

                count =
                    Math.max(
                        0,
                        count - 1
                    );


                const index =
                    likedVideos.indexOf(
                        videoId
                    );


                if (index !== -1) {

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


            wwcSetStorage(
                "wwc_likes",
                likes
            );


            wwcSetStorage(
                "wwc_liked_videos",
                likedVideos
            );


            button.classList.toggle(
                "liked",
                !alreadyLiked
            );


            button.setAttribute(
                "aria-pressed",
                String(!alreadyLiked)
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

}


/* =========================================================
   LOAD LIKE STATE
   ========================================================= */

function wwcLoadLikeState(button) {

    if (!button) {
        return;
    }


    const item =
        button.closest(
            ".video-item"
        );


    if (!item) {
        return;
    }


    const videoId =
        wwcGetVideoId(item);


    const likes =
        wwcGetStorage(
            "wwc_likes",
            {}
        );


    const likedVideos =
        wwcGetStorage(
            "wwc_liked_videos",
            []
        );


    const count =
        Number(
            likes[videoId] || 0
        );


    const liked =
        likedVideos.includes(
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
        liked
    );


    button.setAttribute(
        "aria-pressed",
        String(liked)
    );

}


/* =========================================================
   SAVE BUTTON
   ========================================================= */

function wwcInitializeSave(button) {

    if (!button) {
        return;
    }


    if (
        button.dataset.wwcSaveReady ===
        "true"
    ) {

        return;

    }


    button.dataset.wwcSaveReady =
        "true";


    button.addEventListener(
        "click",
        (event) => {

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
                wwcGetVideoId(item);


            const savedVideos =
                wwcGetStorage(
                    "wwc_saved_videos",
                    []
                );


            const index =
                savedVideos.indexOf(
                    videoId
                );


            let saved;


            if (index === -1) {

                savedVideos.push(
                    videoId
                );

                saved = true;

            } else {

                savedVideos.splice(
                    index,
                    1
                );

                saved = false;

            }


            wwcSetStorage(
                "wwc_saved_videos",
                savedVideos
            );


            button.classList.toggle(
                "saved",
                saved
            );


            button.setAttribute(
                "aria-pressed",
                String(saved)
            );


            const countElement =
                button.querySelector(
                    ".save-count"
                );


            if (countElement) {

                countElement.textContent =
                    saved ? "1" : "0";

            }

        }
    );

}


/* =========================================================
   LOAD SAVE STATE
   ========================================================= */

function wwcLoadSaveState(button) {

    if (!button) {
        return;
    }


    const item =
        button.closest(
            ".video-item"
        );


    if (!item) {
        return;
    }


    const videoId =
        wwcGetVideoId(item);


    const savedVideos =
        wwcGetStorage(
            "wwc_saved_videos",
            []
        );


    const saved =
        savedVideos.includes(
            videoId
        );


    button.classList.toggle(
        "saved",
        saved
    );


    button.setAttribute(
        "aria-pressed",
        String(saved)
    );


    const countElement =
        button.querySelector(
            ".save-count"
        );


    if (countElement) {

        countElement.textContent =
            saved ? "1" : "0";

    }

}


/* =========================================================
   FOLLOW BUTTON
   ========================================================= */

function wwcInitializeFollow(button) {

    if (!button) {
        return;
    }


    if (
        button.dataset.wwcFollowReady ===
        "true"
    ) {

        return;

    }


    button.dataset.wwcFollowReady =
        "true";


    button.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            event.stopPropagation();


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


            let username =
                usernameElement
                    ?.textContent
                    ?.trim()
                    || "@wwc_user";


            username =
                username.replace(
                    /^@/,
                    ""
                );


            const following =
                wwcGetStorage(
                    "wwc_following",
                    []
                );


            const index =
                following.indexOf(
                    username
                );


            let isFollowing;


            if (index === -1) {

                following.push(
                    username
                );

                isFollowing = true;

            } else {

                following.splice(
                    index,
                    1
                );

                isFollowing = false;

            }


            wwcSetStorage(
                "wwc_following",
                following
            );


            button.textContent =
                isFollowing
                    ? "Following"
                    : "Follow";


            button.classList.toggle(
                "following",
                isFollowing
            );


            button.setAttribute(
                "aria-pressed",
                String(isFollowing)
            );

        }
    );

}


/* =========================================================
   LOAD FOLLOW STATE
   ========================================================= */

function wwcLoadFollowState(button) {

    if (!button) {
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


    let username =
        usernameElement
            ?.textContent
            ?.trim()
            || "@wwc_user";


    username =
        username.replace(
            /^@/,
            ""
        );


    const following =
        wwcGetStorage(
            "wwc_following",
            []
        );


    const isFollowing =
        following.includes(
            username
        );


    button.textContent =
        isFollowing
            ? "Following"
            : "Follow";


    button.classList.toggle(
        "following",
        isFollowing
    );


    button.setAttribute(
        "aria-pressed",
        String(isFollowing)
    );

}


/* =========================================================
   INITIALIZE ALL LIKE / SAVE / FOLLOW BUTTONS
   ========================================================= */

function wwcInitializeSocialButtons() {

    const videoItems =
        document.querySelectorAll(
            ".video-item"
        );


    videoItems.forEach(
        (item) => {


            /* =============================================
               VIDEO ID
               ============================================= */

            wwcGetVideoId(item);


            /* =============================================
               LIKE
               ============================================= */

            const likeButton =
                item.querySelector(
                    ".like-btn"
                );


            if (likeButton) {

                wwcInitializeLike(
                    likeButton
                );

                wwcLoadLikeState(
                    likeButton
                );

            }


            /* =============================================
               SAVE
               ============================================= */

            const saveButton =
                item.querySelector(
                    ".save-btn"
                );


            if (saveButton) {

                wwcInitializeSave(
                    saveButton
                );

                wwcLoadSaveState(
                    saveButton
                );

            }


            /* =============================================
               FOLLOW
               ============================================= */

            const followButton =
                item.querySelector(
                    ".follow-btn"
                );


            if (followButton) {

                wwcInitializeFollow(
                    followButton
                );

                wwcLoadFollowState(
                    followButton
                );

            }

        }
    );

}


/* =========================================================
   WATCH FOR NEW VIDEOS
   ========================================================= */

function wwcSocialMutationObserver() {

    const feed =
        document.querySelector(
            "#video-feed"
        );


    if (!feed) {
        return;
    }


    const observer =
        new MutationObserver(
            () => {

                wwcInitializeSocialButtons();

            }
        );


    observer.observe(
        feed,
        {
            childList: true,
            subtree: true
        }
    );

}


/* =========================================================
   START PART 2
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        wwcInitializeSocialButtons();

        wwcSocialMutationObserver();


        console.log(
            "❤️ WWC Like ready."
        );

        console.log(
            "🔖 WWC Save ready."
        );

        console.log(
            "👤 WWC Follow ready."
        );

    }
);


/* =========================================================
   END OF PART 2 / 5
   ========================================================= */
/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   NEW APP.JS
   PART 3 / 5
   COMMENT + SHARE + VIDEO CONTROLS
   ========================================================= */


/* =========================================================
   COMMENT VARIABLES
   ========================================================= */

let wwcActiveCommentItem = null;


/* =========================================================
   COMMENT BOX ELEMENTS
   ========================================================= */

const wwcCommentBox =
    document.querySelector("#commentBox");

const wwcCommentInput =
    document.querySelector("#commentInput");

const wwcCommentSend =
    document.querySelector("#commentSend");

const wwcCommentCancel =
    document.querySelector("#commentCancel");


/* =========================================================
   OPEN COMMENT BOX
   ========================================================= */

function wwcOpenCommentBox(item) {

    if (!item) {
        return;
    }


    if (!wwcCommentBox) {

        alert(
            "Comment Box পাওয়া যায়নি।"
        );

        return;

    }


    wwcActiveCommentItem =
        item;


    wwcCommentBox.classList.add(
        "show"
    );


    if (wwcCommentInput) {

        wwcCommentInput.value = "";


        setTimeout(
            () => {

                wwcCommentInput.focus();

            },
            100
        );

    }

}


/* =========================================================
   CLOSE COMMENT BOX
   ========================================================= */

function wwcCloseCommentBox() {

    if (wwcCommentBox) {

        wwcCommentBox.classList.remove(
            "show"
        );

    }


    wwcActiveCommentItem =
        null;


    if (wwcCommentInput) {

        wwcCommentInput.value =
            "";

    }

}


/* =========================================================
   GET COMMENTS
   ========================================================= */

function wwcGetComments(videoId) {

    return wwcGetStorage(
        "wwc_comments_" + videoId,
        []
    );

}


/* =========================================================
   SAVE COMMENTS
   ========================================================= */

function wwcSaveComments(
    videoId,
    comments
) {

    wwcSetStorage(
        "wwc_comments_" + videoId,
        comments
    );

}


/* =========================================================
   COMMENT BUTTON
   ========================================================= */

function wwcInitializeComment(button) {

    if (!button) {
        return;
    }


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
        (event) => {

            event.preventDefault();

            event.stopPropagation();


            const item =
                button.closest(
                    ".video-item"
                );


            if (!item) {
                return;
            }


            wwcOpenCommentBox(
                item
            );

        }
    );

}


/* =========================================================
   COMMENT SEND
   ========================================================= */

function wwcSendComment() {

    if (
        !wwcActiveCommentItem ||
        !wwcCommentInput
    ) {

        return;

    }


    const text =
        wwcCommentInput.value.trim();


    if (!text) {

        alert(
            "⚠️ Comment লিখুন।"
        );

        return;

    }


    const videoId =
        wwcGetVideoId(
            wwcActiveCommentItem
        );


    const comments =
        wwcGetComments(
            videoId
        );


    comments.push({

        text: text,

        time:
            new Date()
                .toISOString(),

        user:
            currentUser?.email ||
            "WWC User"

    });


    wwcSaveComments(
        videoId,
        comments
    );


    wwcCommentInput.value =
        "";


    wwcCloseCommentBox();


    wwcUpdateCommentCount(
        wwcActiveCommentItem
    );


    alert(
        "✅ Comment যোগ হয়েছে।"
    );

}


/* =========================================================
   UPDATE COMMENT COUNT
   ========================================================= */

function wwcUpdateCommentCount(item) {

    if (!item) {
        return;
    }


    const videoId =
        wwcGetVideoId(item);


    const comments =
        wwcGetComments(
            videoId
        );


    const commentButton =
        item.querySelector(
            ".comment-btn"
        );


    if (!commentButton) {
        return;
    }


    const countElement =
        commentButton.querySelector(
            ".comment-count"
        );


    if (countElement) {

        countElement.textContent =
            comments.length;

    }

}


/* =========================================================
   LOAD COMMENT COUNT
   ========================================================= */

function wwcLoadCommentCount(
    button
) {

    if (!button) {
        return;
    }


    const item =
        button.closest(
            ".video-item"
        );


    if (!item) {
        return;
    }


    const videoId =
        wwcGetVideoId(item);


    const comments =
        wwcGetComments(
            videoId
        );


    const countElement =
        button.querySelector(
            ".comment-count"
        );


    if (countElement) {

        countElement.textContent =
            comments.length;

    }

}


/* =========================================================
   COMMENT CANCEL
   ========================================================= */

if (wwcCommentCancel) {

    wwcCommentCancel.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            event.stopPropagation();

            wwcCloseCommentBox();

        }
    );

}


/* =========================================================
   COMMENT SEND BUTTON
   ========================================================= */

if (wwcCommentSend) {

    wwcCommentSend.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            event.stopPropagation();

            wwcSendComment();

        }
    );

}


/* =========================================================
   ENTER KEY COMMENT
   ========================================================= */

if (wwcCommentInput) {

    wwcCommentInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                wwcSendComment();

            }

        }
    );

}


/* =========================================================
   SHARE
   ========================================================= */

function wwcInitializeShare(button) {

    if (!button) {
        return;
    }


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
        async (event) => {

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
                    ".feed-video"
                );


            let shareUrl =
                window.location.href;


            if (
                video &&
                video.currentSrc
            ) {

                shareUrl =
                    video.currentSrc;

            }


            const shareData = {

                title:
                    "World wide connect",

                text:
                    "🌍 WWC-Core এ এই ভিডিওটি দেখুন",

                url:
                    shareUrl

            };


            try {

                if (
                    navigator.share
                ) {

                    await navigator.share(
                        shareData
                    );


                    console.log(
                        "✅ Video shared."
                    );


                } else if (
                    navigator.clipboard
                ) {

                    await navigator.clipboard.writeText(
                        shareUrl
                    );


                    alert(
                        "✅ Video link Copy হয়েছে।"
                    );


                } else {

                    window.prompt(
                        "Video link Copy করুন:",
                        shareUrl
                    );

                }

            } catch (error) {

                if (
                    error.name !==
                    "AbortError"
                ) {

                    console.error(
                        "Share error:",
                        error
                    );

                }

            }

        }
    );

}


/* =========================================================
   VIDEO PLAY / PAUSE BUTTON
   ========================================================= */

function wwcInitializeVideoControls() {

    const videos =
        document.querySelectorAll(
            ".feed-video"
        );


    videos.forEach(
        (video) => {

            if (
                video.dataset.wwcControlReady ===
                "true"
            ) {

                return;

            }


            video.dataset.wwcControlReady =
                "true";


            video.addEventListener(
                "dblclick",
                (event) => {

                    event.preventDefault();


                    if (
                        video.paused
                    ) {

                        video.play().catch(
                            () => {}
                        );

                    } else {

                        video.pause();

                    }

                }
            );


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


                    const items =
                        Array.from(
                            document.querySelectorAll(
                                ".video-item"
                            )
                        );


                    const index =
                        items.indexOf(
                            item
                        );


                    if (
                        index !== -1 &&
                        index <
                        items.length - 1
                    ) {

                        items[
                            index + 1
                        ].scrollIntoView({
                            behavior:
                                "smooth",
                            block:
                                "start"
                        });

                    }

                }
            );

        }
    );

}


/* =========================================================
   INITIALIZE PART 3
   ========================================================= */

function wwcInitializePart3() {

    const videoItems =
        document.querySelectorAll(
            ".video-item"
        );


    videoItems.forEach(
        (item) => {


            /* =============================================
               COMMENT
               ============================================= */

            const commentButton =
                item.querySelector(
                    ".comment-btn"
                );


            if (commentButton) {

                wwcInitializeComment(
                    commentButton
                );

                wwcLoadCommentCount(
                    commentButton
                );

            }


            /* =============================================
               SHARE
               ============================================= */

            const shareButton =
                item.querySelector(
                    ".share-btn"
                );


            if (shareButton) {

                wwcInitializeShare(
                    shareButton
                );

            }

        }
    );


    wwcInitializeVideoControls();


    console.log(
        "💬 WWC Comment ready."
    );


    console.log(
        "↗️ WWC Share ready."
    );


    console.log(
        "🎬 WWC Video Controls ready."
    );

}


/* =========================================================
   START PART 3
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        wwcInitializePart3
    );

} else {

    wwcInitializePart3();

}


/* =========================================================
   END OF PART 3 / 5
   ========================================================= */
