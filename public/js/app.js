/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   APP.JS
   COMPLETE VERSION

   Main functions:
   1. Firebase Authentication
   2. Upload Button
   3. Inbox
   4. Friends
   5. User Profile
   6. Caption + Title support
   7. Basic video feed autoplay
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
    authStateReady,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    addDoc,
    serverTimestamp
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

let authReady = false;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "🌍 WWC-Core starting..."
        );

        try {

            /*
             * Firebase-এর login state সম্পূর্ণ
             * ready হওয়া পর্যন্ত অপেক্ষা করবে।
             */

            await authStateReady();

            authReady = true;

        } catch (error) {

            console.error(
                "Auth state error:",
                error
            );

        }


        setupAuthentication();

        setupUploadButton();

        setupProfileButton();

        setupFriendsButton();

        setupInboxButton();

        setupLogoutButton();

        setupVideoFeed();

        setupCaptionSupport();

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


                /*
                 * নতুন user হলে profile তৈরি করবে।
                 */

                await createUserProfile(
                    user
                );


                updateLoginUI(
                    true,
                    user
                );

            } else {

                console.log(
                    "ℹ️ User is not logged in"
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


        if (
            !snapshot.exists()
        ) {

            await setDoc(
                userRef,
                {

                    name:
                        user.displayName ||
                        "WWC User",

                    username:
                        user.displayName
                            ? user.displayName
                                .replace(
                                    /\s+/g,
                                    "_"
                                )
                                .toLowerCase()
                            : "wwc_user",

                    email:
                        user.email ||
                        "",

                    photoURL:
                        user.photoURL ||
                        "",

                    bio:
                        "Welcome to World Wide Connect 🌍",

                    country:
                        "Bangladesh",

                    followers:
                        0,

                    following:
                        0,

                    likes:
                        0,

                    createdAt:
                        serverTimestamp()

                }
            );


            console.log(
                "✅ User profile created"
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
            "#loginBtn, .login-btn"
        );


    const logoutButtons =
        document.querySelectorAll(
            "#logoutBtn, .logout-btn, .logout-menu-btn"
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
   WAIT FOR AUTH
   ========================================================= */

async function waitForAuth() {

    if (
        authReady
    ) {

        return currentUser;

    }


    try {

        await authStateReady();

        authReady = true;

    } catch (error) {

        console.error(
            "Auth ready error:",
            error
        );

    }


    return auth.currentUser;

}


/* =========================================================
   UPLOAD BUTTON
   ========================================================= */

function setupUploadButton() {

    const buttons =
        document.querySelectorAll(
            "#uploadBtn, .upload-btn, #createBtn"
        );


    buttons.forEach(
        button => {

            if (
                button.dataset.wwcUploadReady ===
                "true"
            ) {

                return;

            }


            button.dataset.wwcUploadReady =
                "true";


            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    event.stopPropagation();


                    const user =
                        await waitForAuth();


                    if (!user) {

                        showWWCMessage(
                            "⚠️ আগে Login করুন"
                        );


                        setTimeout(
                            () => {

                                window.location.href =
                                    "./auth.html";

                            },
                            600
                        );


                        return;

                    }


                    /*
                     * Login থাকলে সরাসরি
                     * upload.html
                     */

                    window.location.href =
                        "./upload.html";

                }
            );

        }
    );

}


/* =========================================================
   PROFILE BUTTON
   ========================================================= */

function setupProfileButton() {

    const buttons =
        document.querySelectorAll(
            "#profileBtn, #profileBtnMenu, .profile-btn"
        );


    buttons.forEach(
        button => {

            if (
                button.dataset.wwcProfileReady ===
                "true"
            ) {

                return;

            }


            button.dataset.wwcProfileReady =
                "true";


            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    event.stopPropagation();


                    const user =
                        await waitForAuth();


                    if (!user) {

                        showWWCMessage(
                            "⚠️ আগে Login / Register করুন"
                        );


                        setTimeout(
                            () => {

                                window.location.href =
                                    "./auth.html";

                            },
                            600
                        );


                        return;

                    }


                    /*
                     * নিজের profile
                     */

                    window.location.href =
                        "./profile.html?uid=" +
                        encodeURIComponent(
                            user.uid
                        );

                }
            );

        }
    );

}


/* =========================================================
   FRIENDS BUTTON
   ========================================================= */

function setupFriendsButton() {

    const buttons =
        document.querySelectorAll(
            "#friendsBtn, .friends-btn"
        );


    buttons.forEach(
        button => {

            if (
                button.dataset.wwcFriendsReady ===
                "true"
            ) {

                return;

            }


            button.dataset.wwcFriendsReady =
                "true";


            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    event.stopPropagation();


                    const user =
                        await waitForAuth();


                    /*
                     * Friends page ব্যবহার করতে
                     * Login প্রয়োজন।
                     */

                    if (!user) {

                        showWWCMessage(
                            "⚠️ Friends দেখতে আগে Login করুন"
                        );


                        setTimeout(
                            () => {

                                window.location.href =
                                    "./auth.html";

                            },
                            600
                        );


                        return;

                    }


                    /*
                     * friends.html থাকলে
                     * সেখানে যাবে।
                     */

                    window.location.href =
                        "./friends.html";

                }
            );

        }
    );

}


/* =========================================================
   INBOX BUTTON
   ========================================================= */

function setupInboxButton() {

    const buttons =
        document.querySelectorAll(
            "#inboxBtn, .inbox-btn"
        );


    buttons.forEach(
        button => {

            if (
                button.dataset.wwcInboxReady ===
                "true"
            ) {

                return;

            }


            button.dataset.wwcInboxReady =
                "true";


            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    event.stopPropagation();


                    const user =
                        await waitForAuth();


                    if (!user) {

                        showWWCMessage(
                            "⚠️ Inbox দেখতে আগে Login করুন"
                        );


                        setTimeout(
                            () => {

                                window.location.href =
                                    "./auth.html";

                            },
                            600
                        );


                        return;

                    }


                    /*
                     * inbox.html থাকলে সেখানে যাবে।
                     * না থাকলে একটি সুন্দর message দেখাবে।
                     */

                    window.location.href =
                        "./inbox.html";

                }
            );

        }
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogoutButton() {

    const buttons =
        document.querySelectorAll(
            "#logoutBtn, .logout-btn, .logout-menu-btn"
        );


    buttons.forEach(
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
                async event => {

                    event.preventDefault();

                    event.stopPropagation();


                    try {

                        await signOut(
                            auth
                        );


                        showWWCMessage(
                            "✅ Logout হয়েছে"
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


                        showWWCMessage(
                            "❌ Logout করা যায়নি"
                        );

                    }

                }
            );

        }
    );

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


    const videos =
        Array.from(
            feed.querySelectorAll(
                ".feed-video"
            )
        );


    if (
        !videos.length
    ) {

        return;

    }


    videos.forEach(
        video => {

            video.setAttribute(
                "playsinline",
                ""
            );


            video.preload =
                "metadata";


            /*
             * Mobile autoplay-এর জন্য
             * শুরুতে muted থাকবে।
             */

            video.muted =
                true;


            video.addEventListener(
                "play",
                () => {

                    videos.forEach(
                        other => {

                            if (
                                other !== video
                            ) {

                                other.pause();

                            }

                        }
                    );

                }
            );

        }
    );


    /*
     * যে ভিডিও screen-এর মাঝখানে
     * আসবে সেটি play হবে।
     */

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
                                promise.catch
                            ) {

                                promise.catch(
                                    () => {}
                                );

                            }

                        }

                    }
                );

            },
            {
                threshold: [
                    0.65
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
   CAPTION + TITLE SUPPORT
   ========================================================= */

function setupCaptionSupport() {

    /*
     * Upload page বা অন্য কোনো page-এ
     * title/caption input থাকলে এগুলো
     * automaticভাবে localStorage-এ রাখবে।
     */


    const titleInput =
        document.querySelector(
            "#videoTitle, #title, .video-title-input"
        );


    const captionInput =
        document.querySelector(
            "#videoCaption, #caption, .caption-input"
        );


    if (
        titleInput
    ) {

        titleInput.addEventListener(
            "input",
            () => {

                sessionStorage.setItem(
                    "wwc_video_title",
                    titleInput.value
                );

            }
        );

    }


    if (
        captionInput
    ) {

        captionInput.addEventListener(
            "input",
            () => {

                sessionStorage.setItem(
                    "wwc_video_caption",
                    captionInput.value
                );

            }
        );

    }


    /*
     * Feed-এ caption/title থাকলে
     * data attributes থেকেও দেখাতে পারবে।
     */

    const videoItems =
        document.querySelectorAll(
            ".video-item"
        );


    videoItems.forEach(
        item => {

            const title =
                item.dataset.title;


            const caption =
                item.dataset.caption;


            const titleElement =
                item.querySelector(
                    ".video-title"
                );


            const captionElement =
                item.querySelector(
                    ".video-caption"
                );


            if (
                titleElement &&
                title
            ) {

                titleElement.textContent =
                    title;

            }


            if (
                captionElement &&
                caption
            ) {

                captionElement.textContent =
                    caption;

            }

        }
    );

}


/* =========================================================
   SAVE CAPTION + TITLE
   ========================================================= */

async function saveVideoInfo(
    videoId,
    title,
    caption
) {

    const user =
        await waitForAuth();


    if (!user) {

        return false;

    }


    try {

        await setDoc(
            doc(
                db,
                "videos",
                videoId
            ),
            {

                title:
                    title ||
                    "",

                caption:
                    caption ||
                    "",

                userId:
                    user.uid,

                updatedAt:
                    serverTimestamp()

            },
            {
                merge: true
            }
        );


        return true;

    } catch (error) {

        console.error(
            "Video info error:",
            error
        );


        return false;

    }

}


/* =========================================================
   GLOBAL WWC OBJECT
   ========================================================= */

window.WWC = {

    getCurrentUser:
        () => {

            return currentUser;

        },


    getAuth:
        () => {

            return auth;

        },


    getFirestore:
        () => {

            return db;

        },


    logout:
        async () => {

            try {

                await signOut(
                    auth
                );

            } catch (error) {

                console.error(
                    error
                );

            }

        },


    saveVideoInfo:
        saveVideoInfo

};


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
            "30px";


        message.style.transform =
            "translateX(-50%)";


        message.style.zIndex =
            "999999";


        message.style.padding =
            "12px 20px";


        message.style.borderRadius =
            "12px";


        message.style.background =
            "#222";


        message.style.color =
            "#fff";


        message.style.fontSize =
            "15px";


        message.style.textAlign =
            "center";


        message.style.maxWidth =
            "90%";


        message.style.boxShadow =
            "0 5px 25px rgba(0,0,0,.4)";


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
   END
   ========================================================= */

console.log(
    "🌍 WWC-Core APP.JS loaded successfully"
);
