
/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   COMPLETE APP.JS
   Firebase Auth + Firestore + Storage
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
    increment
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";


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
const storage = getStorage(app);


/* =========================================================
   GLOBAL USER DATA
   ========================================================= */

let currentUser = null;

let currentProfile = {
    name: "",
    username: "wwc_user",
    age: "",
    bio: "Welcome to my WWC profile 🌍",
    photoURL: "",
    followers: 0,
    following: 0,
    likes: 0
};


/* =========================================================
   BASIC HELPERS
   ========================================================= */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));


const videoFeed = $("#video-feed");


/* =========================================================
   STORAGE HELPERS
   ========================================================= */

function getStorage(key, fallback) {

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


function setStorage(key, value) {

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
   DEFAULT PROFILE PHOTO
   ========================================================= */

const defaultPhoto =
    "./images/profile.png";


/* =========================================================
   VIDEO ID
   ========================================================= */

function getVideoId(item) {

    if (!item) {
        return "unknown-video";
    }

    if (!item.dataset.videoId) {

        item.dataset.videoId =
            "video-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2, 8);
    }

    return item.dataset.videoId;
}


/* =========================================================
   LIKE
   ========================================================= */

function initializeLike(button) {

    if (!button) return;

    if (button.dataset.wwcReady === "like") {
        return;
    }

    button.dataset.wwcReady = "like";

    button.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            const item =
                button.closest(".video-item");

            if (!item) return;

            const videoId =
                getVideoId(item);

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

            const liked =
                likedVideos.includes(
                    videoId
                );

            let count =
                Number(
                    likes[videoId] || 0
                );

            if (liked) {

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

            likes[videoId] = count;

            setStorage(
                "wwc_likes",
                likes
            );

            setStorage(
                "wwc_liked_videos",
                likedVideos
            );

            button.classList.toggle(
                "liked",
                !liked
            );

            button.setAttribute(
                "aria-pressed",
                String(!liked)
            );

            const countElement =
                $(".like-count", button);

            if (countElement) {

                countElement.textContent =
                    count;
            }
        }
    );
}


function loadLikeState(button) {

    if (!button) return;

    const item =
        button.closest(".video-item");

    if (!item) return;

    const videoId =
        getVideoId(item);

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
            likes[videoId] || 0
        );

    const liked =
        likedVideos.includes(
            videoId
        );

    const countElement =
        $(".like-count", button);

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
   COMMENTS
   ========================================================= */

let activeCommentItem = null;

const commentBox =
    $("#commentBox");

const commentInput =
    $("#commentInput");

const commentSend =
    $("#commentSend");

const commentCancel =
    $("#commentCancel");


function getComments(videoId) {

    return getStorage(
        "wwc_comments_" + videoId,
        []
    );
}


function saveComments(
    videoId,
    comments
) {

    setStorage(
        "wwc_comments_" + videoId,
        comments
    );
}


function openCommentBox(item) {

    if (!commentBox || !item) {
        return;
    }

    activeCommentItem = item;

    commentBox.classList.add(
        "show"
    );

    if (commentInput) {

        commentInput.value = "";

        setTimeout(
            () => {
                commentInput.focus();
            },
            100
        );
    }
}


function closeCommentBox() {

    if (!commentBox) {
        return;
    }

    commentBox.classList.remove(
        "show"
    );

    activeCommentItem = null;

    if (commentInput) {
        commentInput.value = "";
    }
}


function initializeComment(button) {

    if (!button) return;

    if (button.dataset.wwcReady === "comment") {
        return;
    }

    button.dataset.wwcReady = "comment";

    button.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            const item =
                button.closest(".video-item");

            if (!item) return;

            openCommentBox(item);
        }
    );
}


if (commentCancel) {

    commentCancel.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closeCommentBox();
        }
    );
}


if (commentSend) {

    commentSend.addEventListener(
        "click",
        event => {

            event.preventDefault();

            if (!activeCommentItem) {
                return;
            }

            if (!commentInput) {
                return;
            }

            const text =
                commentInput.value.trim();

            if (!text) {

                alert(
                    "Please write a comment."
                );

                return;
            }

            const videoId =
                getVideoId(
                    activeCommentItem
                );

            const comments =
                getComments(videoId);

            comments.push({

                text: text,

                time:
                    new Date()
                        .toISOString(),

                user:
                    currentProfile.username ||
                    "wwc_user"
            });

            saveComments(
                videoId,
                comments
            );

            commentInput.value = "";

            closeCommentBox();

            alert(
                "Comment added successfully."
            );
        }
    );
}


/* =========================================================
   SAVE VIDEO
   ========================================================= */

function initializeSave(button) {

    if (!button) return;

    if (button.dataset.wwcReady === "save") {
        return;
    }

    button.dataset.wwcReady = "save";

    button.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            const item =
                button.closest(".video-item");

            if (!item) return;

            const videoId =
                getVideoId(item);

            const savedVideos =
                getStorage(
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

            setStorage(
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

            const count =
                $(".save-count", button);

            if (count) {

                count.textContent =
                    saved ? "1" : "0";
            }
        }
    );
}


function loadSaveState(button) {

    if (!button) return;

    const item =
        button.closest(".video-item");

    if (!item) return;

    const videoId =
        getVideoId(item);

    const savedVideos =
        getStorage(
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

    const count =
        $(".save-count", button);

    if (count) {

        count.textContent =
            saved ? "1" : "0";
    }
}


/* =========================================================
   SHARE
   ========================================================= */

async function shareVideo(item) {

    if (!item) return;

    const videoId =
        getVideoId(item);

    const url =
        window.location.href.split("#")[0] +
        "#video=" +
        encodeURIComponent(
            videoId
        );

    const username =
        $(".username", item)
            ?.textContent
            ?.trim() ||
        "@wwc_user";

    const shareData = {

        title:
            "World Wide Connect",

        text:
            "Check out this video from " +
            username,

        url: url
    };

    try {

        if (
            navigator.share &&
            typeof navigator.share ===
            "function"
        ) {

            await navigator.share(
                shareData
            );

            return;
        }

        if (
            navigator.clipboard &&
            navigator.clipboard.writeText
        ) {

            await navigator.clipboard.writeText(
                url
            );

            alert(
                "Video link copied."
            );

            return;
        }

        window.prompt(
            "Copy this video link:",
            url
        );

    } catch (error) {

        if (
            error &&
            error.name === "AbortError"
        ) {
            return;
        }

        console.error(
            "Share error:",
            error
        );
    }
}


function initializeShare(button) {

    if (!button) return;

    if (button.dataset.wwcReady === "share") {
        return;
    }

    button.dataset.wwcReady = "share";

    button.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            const item =
                button.closest(
                    ".video-item"
                );

            shareVideo(item);
        }
    );
}


/* =========================================================
   FOLLOW
   ========================================================= */

function initializeFollow(button) {

    if (!button) return;

    if (button.dataset.wwcReady === "follow") {
        return;
    }

    button.dataset.wwcReady = "follow";

    button.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            const item =
                button.closest(
                    ".video-item"
                );

            if (!item) return;

            const username =
                $(".username", item)
                    ?.textContent
                    ?.trim() ||
                "@wwc_user";

            const following =
                getStorage(
                    "wwc_following",
                    []
                );

            const index =
                following.indexOf(
                    username
                );

            if (index === -1) {

                following.push(
                    username
                );

                button.textContent =
                    "Following";

                button.classList.add(
                    "following"
                );

            } else {

                following.splice(
                    index,
                    1
                );

                button.textContent =
                    "Follow";

                button.classList.remove(
                    "following"
                );
            }

            setStorage(
                "wwc_following",
                following
            );
        }
    );
}


function loadFollowState(button) {

    if (!button) return;

    const item =
        button.closest(
            ".video-item"
        );

    if (!item) return;

    const username =
        $(".username", item)
            ?.textContent
            ?.trim() ||
        "@wwc_user";

    const following =
        getStorage(
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
}


/* =========================================================
   VIDEO BUTTONS
   ========================================================= */

function initializeVideoButtons() {

    $$(".video-item").forEach(
        item => {

            const like =
                $(".like-btn", item);

            const comment =
                $(".comment-btn", item);

            const save =
                $(".save-btn", item);

            const share =
                $(".share-btn", item);

            const follow =
                $(".follow-btn", item);

            initializeLike(like);
            initializeComment(comment);
            initializeSave(save);
            initializeShare(share);
            initializeFollow(follow);

            loadLikeState(like);
            loadSaveState(save);
            loadFollowState(follow);
        }
    );
}


/* =========================================================
   VIDEO AUTOPLAY
   ========================================================= */

function setupVideoPlayback() {

    const videos =
        $$(".feed-video");

    if (!videos.length) {
        return;
    }

    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        const video =
                            entry.target;

                        if (
                            entry.isIntersecting &&
                            entry.intersectionRatio >=
                            0.60
                        ) {

                            videos.forEach(
                                other => {

                                    if (
                                        other !==
                                        video
                                    ) {
                                        other.pause();
                                    }
                                }
                            );

                            video.muted = true;

                            video.play()
                                .catch(
                                    () => {}
                                );

                        } else {

                            video.pause();
                        }
                    }
                );
            },
            {
                threshold: [0.60]
            }
        );

    videos.forEach(
        video => {

            observer.observe(video);

            video.addEventListener(
                "ended",
                () => {

                    const item =
                        video.closest(
                            ".video-item"
                        );

                    const next =
                        item?.nextElementSibling;

                    if (
                        next &&
                        next.classList.contains(
                            "video-item"
                        )
                    ) {

                        next.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });
            
