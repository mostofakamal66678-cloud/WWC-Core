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

