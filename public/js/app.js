/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   APP.JS
   PART 1 / 5
   Firebase + Authentication + Video Feed
   ========================================================= */

"use strict";


/* =========================================================
   FIREBASE IMPORTS
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
        "1:93178453668:web:2184630caa8e61f7445031",

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


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeWWC();

    }
);


/* =========================================================
   MAIN INITIALIZATION
   ========================================================= */

function initializeWWC() {

    console.log(
        "🌍 WWC-Core starting..."
    );


    setupAuthentication();

    setupVideoFeed();

    setupNavigation();

    setupBasicButtons();


    console.log(
        "✅ WWC-Core initialized"
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
                    "✅ User logged in:",
                    user.email || user.uid
                );


                await createUserProfileIfNeeded(
                    user
                );


                updateLoginUI(
                    true,
                    user
                );


            } else {

                console.log(
                    "ℹ️ No user logged in"
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

async function createUserProfileIfNeeded(
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
                "✅ New WWC profile created"
            );

        }

    } catch (error) {

        console.error(
            "❌ Profile creation error:",
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


    const userNameElements =
        document.querySelectorAll(
            ".current-user-name"
        );


    userNameElements.forEach(
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
   VIDEO FEED
   ========================================================= */

function setupVideoFeed() {

    const feed =
        document.getElementById(
            "video-feed"
        );


    if (!feed) {

        console.log(
            "ℹ️ #video-feed পাওয়া যায়নি"
        );

        return;

    }


    const videos =
        Array.from(
            feed.querySelectorAll(
                ".feed-video"
            )
        );


    if (!videos.length) {

        console.log(
            "ℹ️ কোনো ভিডিও পাওয়া যায়নি"
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
                "preload",
                "metadata"
            );


            video.addEventListener(
                "play",
                () => {

                    videos.forEach(
                        otherVideo => {

                            if (
                                otherVideo !== video &&
                                !otherVideo.paused
                            ) {

                                otherVideo.pause();

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
   VIDEO OBSERVER
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
                                otherVideo => {

                                    if (
                                        otherVideo !== video &&
                                        !otherVideo.paused
                                    ) {

                                        otherVideo.pause();

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
                                    error => {

                                        console.log(
                                            "Autoplay blocked:",
                                            error.message
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
   NAVIGATION
   ========================================================= */

function setupNavigation() {

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
   BASIC BUTTONS
   ========================================================= */

function setupBasicButtons() {

    const logoutButtons =
        document.querySelectorAll(
            "#logoutBtn, .logout-btn, .logout-menu-btn"
        );


    logoutButtons.forEach(
        button => {

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

        }
    );

}


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.WWC = {

    getCurrentUser: () =>
        currentUser,

    logout: logoutUser,

    getAuth: () =>
        auth,

    getFirestore: () =>
        db

};


/* =========================================================
   END OF PART 1 / 5
   ========================================================= */
/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   APP.JS
   PART 2 / 5
   LIKE + COMMENT + SAVE
   ========================================================= */


/* =========================================================
   STORAGE HELPERS
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
   VIDEO ID
   ========================================================= */

function wwcGetVideoId(videoItem) {

    if (!videoItem) {
        return "";
    }


    if (!videoItem.dataset.videoId) {

        const video =
            videoItem.querySelector(
                ".feed-video"
            );


        if (
            video &&
            video.currentSrc
        ) {

            videoItem.dataset.videoId =
                "video-" +
                btoa(
                    video.currentSrc
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

            videoItem.dataset.videoId =
                "video-" +
                Array.from(
                    videoItem.parentElement
                    ? videoItem.parentElement.children
                    : []
                ).indexOf(
                    videoItem
                );

        }

    }


    return videoItem.dataset.videoId;

}


/* =========================================================
   LIKE
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
                wwcGetVideoId(
                    item
                );


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
                String(
                    !alreadyLiked
                )
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
        wwcGetVideoId(
            item
        );


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
        String(
            liked
        )
    );

}


/* =========================================================
   SAVE
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
                wwcGetVideoId(
                    item
                );


            const savedVideos =
                wwcGetStorage(
                    "wwc_saved_videos",
                    []
                );


            const index =
                savedVideos.indexOf(
                    videoId
                );


            let saved = false;


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
                String(
                    saved
                )
            );


            const countElement =
                button.querySelector(
                    ".save-count"
                );


            if (countElement) {

                countElement.textContent =
                    saved
                        ? "1"
                        : "0";

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
        wwcGetVideoId(
            item
        );


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
        String(
            saved
        )
    );


    const countElement =
        button.querySelector(
            ".save-count"
        );


    if (countElement) {

        countElement.textContent =
            saved
                ? "1"
                : "0";

    }

}


/* =========================================================
   COMMENT SYSTEM
   ========================================================= */

let wwcActiveCommentItem =
    null;


function wwcGetCommentElements() {

    return {

        box:
            document.getElementById(
                "commentBox"
            ),

        input:
            document.getElementById(
                "commentInput"
            ),

        send:
            document.getElementById(
                "commentSend"
            ),

        cancel:
            document.getElementById(
                "commentCancel"
            )

    };

}


/* =========================================================
   OPEN COMMENT BOX
   ========================================================= */

function wwcOpenCommentBox(item) {

    const elements =
        wwcGetCommentElements();


    if (
        !elements.box ||
        !item
    ) {

        return;

    }


    wwcActiveCommentItem =
        item;


    elements.box.classList.add(
        "show"
    );


    if (elements.input) {

        elements.input.value =
            "";


        setTimeout(
            () => {

                elements.input.focus();

            },
            100
        );

    }

}


/* =========================================================
   CLOSE COMMENT BOX
   ========================================================= */

function wwcCloseCommentBox() {

    const elements =
        wwcGetCommentElements();


    if (!elements.box) {
        return;
    }


    elements.box.classList.remove(
        "show"
    );


    wwcActiveCommentItem =
        null;


    if (elements.input) {

        elements.input.value =
            "";

    }

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


            wwcOpenCommentBox(
                item
            );

        }
    );

}


/* =========================================================
   SEND COMMENT
   ========================================================= */

function wwcSendComment() {

    const elements =
        wwcGetCommentElements();


    if (
        !wwcActiveCommentItem ||
        !elements.input
    ) {

        return;

    }


    const text =
        elements.input.value.trim();


    if (!text) {

        alert(
            "কমেন্ট লিখুন।"
        );

        return;

    }


    const videoId =
        wwcGetVideoId(
            wwcActiveCommentItem
        );


    const storageKey =
        "wwc_comments_" +
        videoId;


    const comments =
        wwcGetStorage(
            storageKey,
            []
        );


    comments.push({

        text:
            text,

        time:
            new Date()
                .toISOString(),

        user:
            window.WWC &&
            window.WWC.getCurrentUser
                ? (
                    window.WWC
                        .getCurrentUser()
                        ?.email ||
                    "WWC User"
                )
                : "WWC User"

    });


    wwcSetStorage(
        storageKey,
        comments
    );


    elements.input.value =
        "";


    wwcCloseCommentBox();


    alert(
        "✅ Comment added successfully."
    );

}


/* =========================================================
   COMMENT CANCEL
   ========================================================= */

function wwcInitializeCommentBox() {

    const elements =
        wwcGetCommentElements();


    if (elements.cancel) {

        elements.cancel.addEventListener(
            "click",
            event => {

                event.preventDefault();

                wwcCloseCommentBox();

            }
        );

    }


    if (elements.send) {

        elements.send.addEventListener(
            "click",
            event => {

                event.preventDefault();

                wwcSendComment();

            }
        );

    }

}


/* =========================================================
   INITIALIZE VIDEO ACTIONS
   ========================================================= */

function wwcInitializeVideoActions() {

    const feed =
        document.getElementById(
            "video-feed"
        );


    if (!feed) {

        console.log(
            "ℹ️ Video feed not found"
        );

        return;

    }


    const items =
        Array.from(
            feed.querySelectorAll(
                ".video-item"
            )
        );


    items.forEach(
        item => {

            wwcGetVideoId(
                item
            );


            const likeButton =
                item.querySelector(
                    ".like-btn"
                );


            const saveButton =
                item.querySelector(
                    ".save-btn"
                );


            const commentButton =
                item.querySelector(
                    ".comment-btn"
                );


            if (likeButton) {

                wwcInitializeLike(
                    likeButton
                );

                wwcLoadLikeState(
                    likeButton
                );

            }


            if (saveButton) {

                wwcInitializeSave(
                    saveButton
                );

                wwcLoadSaveState(
                    saveButton
                );

            }


            if (commentButton) {

                wwcInitializeComment(
                    commentButton
                );

            }

        }
    );


    wwcInitializeCommentBox();


    console.log(
        "✅ Like / Comment / Save ready"
    );

}


/* =========================================================
   RUN PART 2
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        wwcInitializeVideoActions,
        {
            once: true
        }
    );

} else {

    wwcInitializeVideoActions();

}


/* =========================================================
   END OF PART 2 / 5
   ========================================================= */
/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   APP.JS
   PART 3 / 5
   FOLLOW + SHARE + VIDEO CONTROLS
   ========================================================= */


/* =========================================================
   FOLLOW SYSTEM
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
                String(
                    isFollowing
                )
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
        String(
            isFollowing
        )
    );

}


/* =========================================================
   SHARE SYSTEM
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
                    ".feed-video"
                );


            const videoURL =
                video?.currentSrc ||
                video?.src ||
                window.location.href;


            const shareData = {

                title:
                    "World wide connect",

                text:
                    "Check out this video on WWC-Core 🌍",

                url:
                    videoURL

            };


            try {

                if (
                    navigator.share
                ) {

                    await navigator.share(
                        shareData
                    );


                    console.log(
                        "✅ Video shared"
                    );

                } else {

                    await wwcCopyToClipboard(
                        videoURL
                    );


                    alert(
                        "✅ Video link copied!"
                    );

                }

            } catch (error) {

                if (
                    error.name ===
                    "AbortError"
                ) {

                    return;

                }


                console.error(
                    "Share error:",
                    error
                );


                try {

                    await wwcCopyToClipboard(
                        videoURL
                    );


                    alert(
                        "✅ Video link copied!"
                    );

                } catch {

                    alert(
                        "❌ Share করা যায়নি।"
                    );

                }

            }

        }
    );

}


/* =========================================================
   COPY TO CLIPBOARD
   ========================================================= */

async function wwcCopyToClipboard(
    text
) {

    if (
        navigator.clipboard &&
        window.isSecureContext
    ) {

        await navigator.clipboard.writeText(
            text
        );

        return;

    }


    const textarea =
        document.createElement(
            "textarea"
        );


    textarea.value =
        text;


    textarea.style.position =
        "fixed";

    textarea.style.left =
        "-9999px";


    document.body.appendChild(
        textarea
    );


    textarea.select();


    const successful =
        document.execCommand(
            "copy"
        );


    document.body.removeChild(
        textarea
    );


    if (!successful) {

        throw new Error(
            "Clipboard copy failed"
        );

    }

}


/* =========================================================
   VIDEO PLAY / PAUSE
   ========================================================= */

function wwcInitializeVideoControls(
    video
) {

    if (!video) {
        return;
    }


    if (
        video.dataset.wwcControlsReady ===
        "true"
    ) {

        return;

    }


    video.dataset.wwcControlsReady =
        "true";


    video.setAttribute(
        "playsinline",
        ""
    );


    video.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();


            if (video.paused) {

                const promise =
                    video.play();


                if (
                    promise &&
                    typeof promise.catch ===
                    "function"
                ) {

                    promise.catch(
                        error => {

                            console.log(
                                "Play blocked:",
                                error.message
                            );

                        }
                    );

                }

            } else {

                video.pause();

            }

        }
    );


    video.addEventListener(
        "dblclick",
        event => {

            event.preventDefault();

            event.stopPropagation();

        }
    );


    video.addEventListener(
        "play",
        () => {

            const item =
                video.closest(
                    ".video-item"
                );


            if (!item) {
                return;
            }


            const allVideos =
                document.querySelectorAll(
                    ".feed-video"
                );


            allVideos.forEach(
                otherVideo => {

                    if (
                        otherVideo !== video &&
                        !otherVideo.paused
                    ) {

                        otherVideo.pause();

                    }

                }
            );

        }
    );

}


/* =========================================================
   SOUND / MUTE
   ========================================================= */

function wwcCreateSoundButton(
    item,
    video
) {

    if (
        !item ||
        !video
    ) {

        return;

    }


    if (
        item.querySelector(
            ".wwc-sound-btn"
        )
    ) {

        return;

    }


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "wwc-sound-btn";


    button.setAttribute(
        "aria-label",
        video.muted
            ? "Unmute"
            : "Mute"
    );


    button.textContent =
        video.muted
            ? "🔇"
            : "🔊";


    button.style.position =
        "absolute";


    button.style.left =
        "15px";


    button.style.top =
        "75px";


    button.style.width =
        "46px";


    button.style.height =
        "46px";


    button.style.border =
        "0";


    button.style.borderRadius =
        "50%";


    button.style.background =
        "rgba(0,0,0,.45)";


    button.style.color =
        "#fff";


    button.style.fontSize =
        "20px";


    button.style.zIndex =
        "100";


    button.style.cursor =
        "pointer";


    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();


            video.muted =
                !video.muted;


            button.textContent =
                video.muted
                    ? "🔇"
                    : "🔊";


            button.setAttribute(
                "aria-label",
                video.muted
                    ? "Unmute"
                    : "Mute"
            );


            try {

                localStorage.setItem(
                    "wwc_video_muted",
                    String(
                        video.muted
                    )
                );

            } catch {

                // Ignore storage errors

            }

        }
    );


    item.appendChild(
        button
    );

}


/* =========================================================
   RESTORE MUTE STATE
   ========================================================= */

function wwcRestoreMuteState(
    video
) {

    if (!video) {
        return;
    }


    try {

        const saved =
            localStorage.getItem(
                "wwc_video_muted"
            );


        if (
            saved ===
            "false"
        ) {

            video.muted =
                false;

        } else {

            video.muted =
                true;

        }

    } catch {

        video.muted =
            true;

    }

}


/* =========================================================
   INITIALIZE PART 3
   ========================================================= */

function wwcInitializePart3() {

    const feed =
        document.getElementById(
            "video-feed"
        );


    if (!feed) {

        console.log(
            "ℹ️ Video feed not found for Part 3"
        );

        return;

    }


    const items =
        Array.from(
            feed.querySelectorAll(
                ".video-item"
            )
        );


    items.forEach(
        item => {

            const followButton =
                item.querySelector(
                    ".follow-btn"
                );


            const shareButton =
                item.querySelector(
                    ".share-btn"
                );


            const video =
                item.querySelector(
                    ".feed-video"
                );


            if (followButton) {

                wwcInitializeFollow(
                    followButton
                );

                wwcLoadFollowState(
                    followButton
                );

            }


            if (shareButton) {

                wwcInitializeShare(
                    shareButton
                );

            }


            if (video) {

                wwcRestoreMuteState(
                    video
                );


                wwcInitializeVideoControls(
                    video
                );


                wwcCreateSoundButton(
                    item,
                    video
                );

            }

        }
    );


    console.log(
        "✅ Follow / Share / Video controls ready"
    );

}


/* =========================================================
   RUN PART 3
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        wwcInitializePart3,
        {
            once: true
        }
    );

} else {

    wwcInitializePart3();

}


/* =========================================================
   END OF PART 3 / 5
   ========================================================= */

/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   NEW APP.JS
   PART 4 / 5
   ========================================================= */


/* =====================================================
   VIDEO PLAY / PAUSE
   ===================================================== */

function initializeVideo(video) {

    if (!video) {
        return;
    }

    if (video.dataset.wwcReady === "video") {
        return;
    }

    video.dataset.wwcReady = "video";

    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    video.addEventListener("click", event => {

        event.preventDefault();
        event.stopPropagation();

        if (video.paused) {

            video.play().catch(error => {

                console.log(
                    "Video play blocked:",
                    error
                );

            });

        } else {

            video.pause();

        }

    });

}


/* =====================================================
   AUTOPLAY ACTIVE VIDEO
   ===================================================== */

function playActiveVideo(item) {

    if (!item) {
        return;
    }

    const videos =
        $$("video", item);

    videos.forEach(video => {

        video.muted = true;

        video.play().catch(() => {});

    });

}


/* =====================================================
   PAUSE OTHER VIDEOS
   ===================================================== */

function pauseOtherVideos(activeItem) {

    $$(".video-item").forEach(item => {

        if (item === activeItem) {
            return;
        }

        $$("video", item).forEach(video => {

            video.pause();

        });

    });

}


/* =====================================================
   VIDEO INTERSECTION OBSERVER
   ===================================================== */

let videoObserver = null;


function initializeVideoObserver() {

    if (!videoFeed) {
        return;
    }

    if (videoObserver) {

        videoObserver.disconnect();

    }


    videoObserver =
        new IntersectionObserver(

            entries => {

                entries.forEach(entry => {

                    const item =
                        entry.target;


                    if (entry.isIntersecting) {

                        pauseOtherVideos(
                            item
                        );

                        playActiveVideo(
                            item
                        );

                    } else {

                        $$(
                            "video",
                            item
                        ).forEach(video => {

                            video.pause();

                        });

                    }

                });

            },

            {
                threshold: 0.65
            }

        );


    $$(".video-item").forEach(item => {

        videoObserver.observe(item);

    });

}


/* =====================================================
   INITIALIZE VIDEO ITEMS
   ===================================================== */

function initializeVideoItems() {

    if (!videoFeed) {
        return;
    }


    const items =
        $$(".video-item", videoFeed);


    items.forEach(item => {

        getVideoId(item);


        const likeButton =
            $(".like-btn", item);

        const saveButton =
            $(".save-btn", item);

        const followButton =
            $(".follow-btn", item);

        const commentButton =
            $(".comment-btn", item);

        const video =
            $(".feed-video", item);


        if (likeButton) {

            initializeLike(
                likeButton
            );

            loadLikeState(
                likeButton
            );

        }


        if (saveButton) {

            initializeSave(
                saveButton
            );

            loadSaveState(
                saveButton
            );

        }


        if (followButton) {

            initializeFollow(
                followButton
            );

            loadFollowState(
                followButton
            );

        }


        if (commentButton) {

            initializeComment(
                commentButton
            );

        }


        if (video) {

            initializeVideo(
                video
            );

        }

    });


    initializeVideoObserver();

}


/* =====================================================
   SHARE
   ===================================================== */

function initializeShare(button) {

    if (!button) {
        return;
    }

    if (button.dataset.wwcReady === "share") {
        return;
    }

    button.dataset.wwcReady = "share";


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
                $(".feed-video", item);


            const videoId =
                getVideoId(item);


            const shareUrl =
                window.location.origin +
                window.location.pathname +
                "#video=" +
                encodeURIComponent(
                    videoId
                );


            try {

                if (
                    navigator.share
                ) {

                    await navigator.share({

                        title:
                            "World wide connect",

                        text:
                            "WWC Video",

                        url:
                            shareUrl

                    });

                } else if (
                    navigator.clipboard
                ) {

                    await navigator.clipboard.writeText(
                        shareUrl
                    );


                    alert(
                        "✅ Video link copied!"
                    );

                } else {

                    prompt(
                        "এই লিংকটি Copy করুন:",
                        shareUrl
                    );

                }

            } catch (error) {

                console.log(
                    "Share cancelled:",
                    error
                );

            }

        }
    );

}


/* =====================================================
   SEARCH
   ===================================================== */

const searchButton =
    $(".wwc-search-btn");


function createSearchBox() {

    if (
        document.getElementById(
            "wwcSearchBox"
        )
    ) {

        return;

    }


    const box =
        document.createElement(
            "div"
        );


    box.id =
        "wwcSearchBox";


    box.innerHTML = `

        <div style="
            position:fixed;
            top:65px;
            left:50%;
            transform:translateX(-50%);
            width:min(92%,420px);
            z-index:5000;
            background:#181818;
            padding:12px;
            border-radius:14px;
            box-shadow:0 10px 30px rgba(0,0,0,.6);
        ">

            <input
                id="wwcSearchInput"
                type="search"
                placeholder="Search..."
                style="
                    width:100%;
                    padding:13px;
                    border:0;
                    outline:none;
                    border-radius:9px;
                    background:#292929;
                    color:#fff;
                    font-size:16px;
                "
            >

        </div>

    `;


    document.body.appendChild(box);


    const input =
        document.getElementById(
            "wwcSearchInput"
        );


    if (input) {

        input.focus();


        input.addEventListener(
            "input",
            () => {

                const search =
                    input.value
                        .trim()
                        .toLowerCase();


                $$(".video-item").forEach(
                    item => {

                        const username =
                            $(".username", item)
                                ?.textContent
                                ?.toLowerCase()
                            || "";


                        const caption =
                            $(".video-caption", item)
                                ?.textContent
                                ?.toLowerCase()
                            || "";


                        const match =
                            !search ||
                            username.includes(
                                search
                            ) ||
                            caption.includes(
                                search
                            );


                        item.style.display =
                            match
                                ? ""
                                : "none";

                    }
                );

            }
        );

    }

}


if (searchButton) {

    searchButton.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            createSearchBox();

        }
    );

}


/* =====================================================
   CLOSE SEARCH
   ===================================================== */

document.addEventListener(
    "click",
    event => {

        const searchBox =
            document.getElementById(
                "wwcSearchBox"
            );


        if (
            !searchBox ||
            !searchBox.contains(
                event.target
            )
        ) {

            if (
                searchButton &&
                searchButton.contains(
                    event.target
                )
            ) {

                return;

            }


            searchBox?.remove();


            $$(".video-item").forEach(
                item => {

                    item.style.display =
                        "";

                }
            );

        }

    }
);


/* =====================================================
   PROFILE MENU
   ===================================================== */

const profileMenu =
    $("#profileMenu");


const profileNavButton =
    document.querySelector(
        '[data-nav="profile"]'
    );


function openProfileMenu() {

    if (!profileMenu) {
        return;
    }

    profileMenu.classList.add(
        "show"
    );

}


function closeProfileMenu() {

    if (!profileMenu) {
        return;
    }

    profileMenu.classList.remove(
        "show"
    );

}


if (profileNavButton) {

    profileNavButton.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            profileMenu?.classList.toggle(
                "show"
            );

        }
    );

}


/* =====================================================
   PROFILE MENU CLOSE
   ===================================================== */

const profileMenuClose =
    $(".profile-menu-close");


if (profileMenuClose) {

    profileMenuClose.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closeProfileMenu();

        }
    );

}


/* =====================================================
   PROFILE MENU OUTSIDE CLICK
   ===================================================== */

document.addEventListener(
    "click",
    event => {

        if (!profileMenu) {
            return;
        }


        if (
            profileMenu.classList.contains(
                "show"
            ) &&
            !profileMenu.contains(
                event.target
            ) &&
            !profileNavButton?.contains(
                event.target
            )
        ) {

            closeProfileMenu();

        }

    }
);


/* =====================================================
   HOME BUTTON
   ===================================================== */

const homeButtons =
    $$('[data-nav="home"]');


homeButtons.forEach(button => {

    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closeProfileMenu();

            if (videoFeed) {

                videoFeed.scrollTo({

                    top: 0,

                    behavior: "smooth"

                });

            }

        }
    );

});


/* =====================================================
   UPLOAD BUTTON
   ===================================================== */

const createButton =
    $(".wwc-create-btn");


if (createButton) {

    createButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            window.location.href =
                "./upload.html";

        }
    );

}


/* =====================================================
   END OF PART 4
   ===================================================== */
/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   NEW APP.JS
   PART 5 / 5
   FINAL
   ========================================================= */


/* =====================================================
   PROFILE MENU BUTTONS
   ===================================================== */

const profileButtons =
    $$(".profile-menu-btn");


profileButtons.forEach(button => {

    button.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();


            const action =
                button.dataset.action
                || button.getAttribute(
                    "data-action"
                );


            /* =========================================
               PROFILE
               ========================================= */

            if (
                action === "profile" ||
                button.id === "profileMenuBtn"
            ) {

                window.location.href =
                    "./profile.html";

                return;

            }


            /* =========================================
               LOGIN
               ========================================= */

            if (
                action === "login" ||
                button.id === "loginMenuBtn"
            ) {

                window.location.href =
                    "./auth.html";

                return;

            }


            /* =========================================
               UPLOAD
               ========================================= */

            if (
                action === "upload" ||
                button.id === "uploadMenuBtn"
            ) {

                window.location.href =
                    "./upload.html";

                return;

            }


            /* =========================================
               LOGOUT
               ========================================= */

            if (
                action === "logout" ||
                button.id === "logoutMenuBtn"
            ) {

                logoutUser();

                return;

            }

        }
    );

});


/* =====================================================
   LOGOUT
   ===================================================== */

async function logoutUser() {

    const confirmed =
        confirm(
            "আপনি কি Logout করতে চান?"
        );


    if (!confirmed) {
        return;
    }


    try {

        /*
         * Firebase থাকলে Firebase logout
         * করার চেষ্টা করবে।
         */

        if (
            window.firebase &&
            window.firebase.auth
        ) {

            await window.firebase
                .auth()
                .signOut();

        }


    } catch (error) {

        console.log(
            "Firebase logout:",
            error
        );

    }


    /*
     * Local WWC session data পরিষ্কার।
     * Like / Save / Follow রাখা হবে।
     */

    try {

        localStorage.removeItem(
            "wwc_user"
        );

    } catch (error) {

        console.log(error);

    }


    window.location.href =
        "./auth.html";

}


/* =====================================================
   LOGIN / AUTH BUTTON
   ===================================================== */

const authButtons =
    $$(
        '[data-action="login"], [data-action="auth"]'
    );


authButtons.forEach(button => {

    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            window.location.href =
                "./auth.html";

        }
    );

});


/* =====================================================
   COMMENT BOX ESCAPE
   ===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeCommentBox();

            closeProfileMenu();

            const searchBox =
                document.getElementById(
                    "wwcSearchBox"
                );


            if (searchBox) {

                searchBox.remove();

            }


            $$(".video-item").forEach(
                item => {

                    item.style.display =
                        "";

                }
            );

        }

    }
);


/* =====================================================
   SHARE BUTTONS
   ===================================================== */

const shareButtons =
    $$(".share-btn");


shareButtons.forEach(button => {

    initializeShare(
        button
    );

});


/* =====================================================
   INITIALIZE EXISTING VIDEO FEED
   ===================================================== */

initializeVideoItems();


/* =====================================================
   WATCH FOR NEW VIDEO ITEMS
   ===================================================== */

if (videoFeed) {

    const feedObserver =
        new MutationObserver(
            mutations => {

                let hasNewItems =
                    false;


                mutations.forEach(
                    mutation => {

                        mutation.addedNodes
                            .forEach(node => {

                                if (
                                    node.nodeType ===
                                    Node.ELEMENT_NODE
                                ) {

                                    if (
                                        node.matches?.(
                                            ".video-item"
                                        ) ||
                                        node.querySelector?.(
                                            ".video-item"
                                        )
                                    ) {

                                        hasNewItems =
                                            true;

                                    }

                                }

                            });

                    }
                );


                if (hasNewItems) {

                    initializeVideoItems();

                    $$(".share-btn").forEach(
                        button => {

                            initializeShare(
                                button
                            );

                        }
                    );

                }

            }
        );


    feedObserver.observe(
        videoFeed,
        {
            childList: true,
            subtree: true
        }
    );

}


/* =====================================================
   LOAD VIDEO FROM URL HASH
   ===================================================== */

function openVideoFromHash() {

    const hash =
        window.location.hash;


    if (
        !hash.startsWith(
            "#video="
        )
    ) {

        return;

    }


    const videoId =
        decodeURIComponent(
            hash.substring(
                "#video=".length
            )
        );


    const item =
        $(
            `.video-item[data-video-id="${CSS.escape(videoId)}"]`
        );


    if (!item) {

        return;

    }


    setTimeout(
        () => {

            item.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });


            setTimeout(
                () => {

                    playActiveVideo(
                        item
                    );

                },
                500
            );

        },
        300
    );

}


openVideoFromHash();


/* =====================================================
   HASH CHANGE
   ===================================================== */

window.addEventListener(
    "hashchange",
    () => {

        openVideoFromHash();

    }
);


/* =====================================================
   PAGE VISIBILITY
   ===================================================== */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.hidden
        ) {

            $$(".feed-video").forEach(
                video => {

                    video.pause();

                }
            );

        } else {

            const visibleItem =
                $$(".video-item")
                    .find(item => {

                        const rect =
                            item.getBoundingClientRect();


                        return (
                            rect.top >= -100 &&
                            rect.top <=
                            window.innerHeight * 0.5
                        );

                    });


            if (visibleItem) {

                playActiveVideo(
                    visibleItem
                );

            }

        }

    }
);


/* =====================================================
   RESIZE SAFETY
   ===================================================== */

window.addEventListener(
    "resize",
    () => {

        const activeItem =
            $$(".video-item")
                .find(item => {

                    const rect =
                        item.getBoundingClientRect();


                    return (
                        rect.top >= -50 &&
                        rect.top <=
                        window.innerHeight * 0.5
                    );

                });


        if (activeItem) {

            playActiveVideo(
                activeItem
            );

        }

    }
);


/* =====================================================
   PREVENT DOUBLE TOUCH ACTION
   ===================================================== */

$$(
    "button"
).forEach(button => {

    button.addEventListener(
        "touchstart",
        event => {

            event.stopPropagation();

        },
        {
            passive: true
        }
    );

});


/* =====================================================
   FINAL READY MESSAGE
   ===================================================== */

console.log(
    "🌍 WWC-Core App.js loaded successfully."
);

console.log(
    "🎬 Video feed ready."
);

console.log(
    "❤️ Like ready."
);

console.log(
    "💬 Comment ready."
);

console.log(
    "↗️ Share ready."
);

console.log(
    "🔖 Save ready."
);

console.log(
    "👤 Follow ready."
);

console.log(
    "📤 Upload navigation ready."
);

console.log(
    "👤 Profile navigation ready."
);


/* =====================================================
   END OF APP.JS
   PART 5 / 5
   ===================================================== */

});
