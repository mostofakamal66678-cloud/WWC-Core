/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   COMPLETE APP.JS
   ========================================================= */

"use strict";


/* =========================================================
   FIREBASE
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
    serverTimestamp
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


/* =========================================================
   GLOBAL USER
   ========================================================= */

let currentUser = null;


/* =========================================================
   START
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log("🌍 WWC-Core starting...");

    setupAuth();

    setupNavigation();

    setupVideoFeed();

    setupLikeButtons();

    setupFollowButtons();

    setupCommentButtons();

    setupShareButtons();

    setupSaveButtons();

    setupSearch();

    setupTopTabs();

    setupProfileMenu();

    console.log("✅ WWC-Core ready");

});


/* =========================================================
   AUTHENTICATION
   ========================================================= */

function setupAuth() {

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

            console.log("ℹ️ Not logged in");

            updateLoginUI(false, null);

        }

    });

}


/* =========================================================
   CREATE PROFILE
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
                    user.displayName
                        ? user.displayName
                            .replace(/\s+/g, "_")
                            .toLowerCase()
                        : "wwc_user",

                email:
                    user.email || "",

                photoURL:
                    user.photoURL || "",

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

            });

            console.log("✅ Profile created");

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

    document
        .querySelectorAll("#loginBtn, .login-btn")
        .forEach(button => {

            button.style.display =
                loggedIn ? "none" : "";

        });


    document
        .querySelectorAll("#logoutBtn, .logout-btn, .logout-menu-btn")
        .forEach(button => {

            button.style.display =
                loggedIn ? "" : "none";

        });


    document
        .querySelectorAll(".current-user-name")
        .forEach(element => {

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
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    /* HOME */

    document
        .querySelectorAll("#homeBtn, .home-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                window.location.href =
                    "./index.html";

            });

        });


    /* PROFILE */

    document
        .querySelectorAll(
            "#profileBtn, #profileBtnMenu, .profile-btn"
        )
        .forEach(button => {

            button.addEventListener("click", () => {

                if (!currentUser) {

                    window.location.href =
                        "./auth.html";

                    return;

                }

                window.location.href =
                    "./profile.html?uid=" +
                    encodeURIComponent(
                        currentUser.uid
                    );

            });

        });


    /* UPLOAD */

    document
        .querySelectorAll(
            "#uploadBtn, .upload-btn, #createBtn"
        )
        .forEach(button => {

            button.addEventListener("click", () => {

                if (!currentUser) {

                    window.location.href =
                        "./auth.html";

                    return;

                }

                window.location.href =
                    "./upload.html";

            });

        });


    /* FRIENDS */

    document
        .querySelectorAll("#friendsBtn, .friends-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                if (!currentUser) {

                    window.location.href =
                        "./auth.html";

                    return;

                }

                /*
                 * friends.html থাকলে সেটি খুলবে।
                 * না থাকলে WWC message দেখাবে।
                 */

                window.location.href =
                    "./friends.html";

            });

        });


    /* INBOX */

    document
        .querySelectorAll("#inboxBtn, .inbox-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                if (!currentUser) {

                    window.location.href =
                        "./auth.html";

                    return;

                }

                /*
                 * inbox.html থাকলে সেটি খুলবে।
                 */

                window.location.href =
                    "./inbox.html";

            });

        });

}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

    document
        .querySelectorAll(
            "#logoutBtn, .logout-btn, .logout-menu-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    try {

                        await signOut(auth);

                        showMessage(
                            "✅ Logout হয়েছে"
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

                        showMessage(
                            "❌ Logout করা যায়নি"
                        );

                    }

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
            item.querySelector(
                ".feed-video"
            )
        ).filter(Boolean);


    if (!videos.length) {

        return;

    }


    /*
     * সব ভিডিও mobile-friendly autoplay
     */

    videos.forEach(video => {

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

        video.addEventListener(
            "play",
            () => {

                videos.forEach(other => {

                    if (
                        other !== video
                    ) {

                        other.pause();

                    }

                });

            }
        );

    });


    /*
     * এক ভিডিও থেকে পরের ভিডিও
     */

    videos.forEach((video, index) => {

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

                        next.play().catch(
                            () => {}
                        );

                    }, 400);

                }

            }
        );

    });


    /*
     * Swipe / scroll autoplay
     */

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
                                other !== video
                            ) {

                                other.pause();

                            }

                        });

                        video.play().catch(
                            () => {}
                        );

                    } else {

                        video.pause();

                    }

                });

            },
            {
                threshold: [0.65]
            }
        );


    videos.forEach(video => {

        observer.observe(video);

    });

}


/* =========================================================
   LIKE
   ========================================================= */

function setupLikeButtons() {

    document
        .querySelectorAll(
            ".like-btn, #likeBtn"
        )
        .forEach(button => {

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

                    const id =
                        item.dataset.videoId ||
                        "video";

                    const likes =
                        JSON.parse(
                            localStorage.getItem(
                                "wwc_likes"
                            ) || "{}"
                        );

                    const liked =
                        JSON.parse(
                            localStorage.getItem(
                                "wwc_liked_videos"
                            ) || "[]"
                        );


                    const alreadyLiked =
                        liked.includes(id);


                    let count =
                        Number(
                            likes[id] || 0
                        );


                    if (alreadyLiked) {

                        count =
                            Math.max(
                                0,
                                count - 1
                            );

                        const index =
                            liked.indexOf(id);

                        if (index !== -1) {

                            liked.splice(
                                index,
                                1
                            );

                        }

                    } else {

                        count++;

                        liked.push(id);

                    }


                    likes[id] =
                        count;


                    localStorage.setItem(
                        "wwc_likes",
                        JSON.stringify(likes)
                    );


                    localStorage.setItem(
                        "wwc_liked_videos",
                        JSON.stringify(liked)
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

        });

}


/* =========================================================
   FOLLOW
   ========================================================= */

function setupFollowButtons() {

    document
        .querySelectorAll(
            ".follow-btn"
        )
        .forEach(button => {

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


                    const usernameElement =
                        item.querySelector(
                            ".username"
                        );


                    const username =
                        usernameElement
                            ? usernameElement.textContent.trim()
                            : "wwc_user";


                    const key =
                        "wwc_follow_" +
                        username;


                    const following =
                        localStorage.getItem(
                            key
                        ) === "true";


                    const newState =
                        !following;


                    localStorage.setItem(
                        key,
                        String(newState)
                    );


                    button.textContent =
                        newState
                            ? "Following"
                            : "Follow";


                    button.classList.toggle(
                        "following",
                        newState
                    );


                    button.setAttribute(
                        "aria-pressed",
                        String(newState)
                    );

                }
            );

        });

}


/* =========================================================
   COMMENT
   ========================================================= */

let activeCommentItem = null;


function setupCommentButtons() {

    const box =
        document.getElementById(
            "commentBox"
        );

    const input =
        document.getElementById(
            "commentInput"
        );

    const send =
        document.getElementById(
            "commentSend"
        );

    const cancel =
        document.getElementById(
            "commentCancel"
        );


    document
        .querySelectorAll(
            ".comment-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    activeCommentItem =
                        button.closest(
                            ".video-item"
                        );


                    if (!box) {

                        showMessage(
                            "💬 Comment system প্রস্তুত"
                        );

                        return;

                    }


                    box.style.display =
                        "block";


                    if (input) {

                        input.value =
                            "";

                        input.focus();

                    }

                }
            );

        });


    if (cancel) {

        cancel.addEventListener(
            "click",
            () => {

                if (box) {

                    box.style.display =
                        "none";

                }

                activeCommentItem =
                    null;

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

                    showMessage(
                        "⚠️ Comment লিখুন"
                    );

                    return;

                }


                const comments =
                    JSON.parse(
                        localStorage.getItem(
                            "wwc_comments"
                        ) || "{}"
                    );


                const id =
                    activeCommentItem
                        ? (
                            activeCommentItem.dataset.videoId ||
                            "video"
                        )
                        : "video";


                if (!comments[id]) {

                    comments[id] = [];

                }


                comments[id].push({
                    text: text,
                    time: new Date().toISOString()
                });


                localStorage.setItem(
                    "wwc_comments",
                    JSON.stringify(comments)
                );


                if (box) {

                    box.style.display =
                        "none";

                }


                showMessage(
                    "✅ Comment যোগ হয়েছে"
                );


                if (input) {

                    input.value =
                        "";

                }

            }
        );

    }

}


/* =========================================================
   SAVE
   ========================================================= */

function setupSaveButtons() {

    document
        .querySelectorAll(
            ".save-btn"
        )
        .forEach(button => {

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


                    const id =
                        item.dataset.videoId ||
                        "video";


                    const saved =
                        JSON.parse(
                            localStorage.getItem(
                                "wwc_saved_videos"
                            ) || "[]"
                        );


                    const index =
                        saved.indexOf(id);


                    let isSaved;


                    if (index !== -1) {

                        saved.splice(
                            index,
                            1
                        );

                        isSaved =
                            false;

                    } else {

                        saved.push(id);

                        isSaved =
                            true;

                    }


                    localStorage.setItem(
                        "wwc_saved_videos",
                        JSON.stringify(saved)
                    );


                    button.classList.toggle(
                        "saved",
                        isSaved
                    );


                    button.setAttribute(
                        "aria-pressed",
                        String(isSaved)
                    );


                    const count =
                        button.querySelector(
                            ".save-count"
                        );


                    if (count) {

                        count.textContent =
                            saved.length;

                    }

                }
            );

        });

}


/* =========================================================
   SHARE
   ========================================================= */

function setupShareButtons() {

    document
        .querySelectorAll(
            ".share-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();
                    event.stopPropagation();


                    const item =
                        button.closest(
                            ".video-item"
                        );


                    const url =
                        window.location.href +
                        "#video-" +
                        (
                            item
                                ? item.dataset.videoId || ""
                                : ""
                        );


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

                        } else {

                            await navigator.clipboard.writeText(
                                url
                            );

                            showMessage(
                                "✅ Video link copied"
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


            /*
             * যদি search input থাকে
             * তাহলে সেটি ব্যবহার করবে।
             */

            let input =
                document.querySelector(
                    "#searchInput, .search-input"
                );


            /*
             * Input না থাকলে নিজেই তৈরি করবে।
             */

            if (!input) {

                input =
                    document.createElement(
                        "input"
                    );

                input.id =
                    "wwcSearchInput";

                input.placeholder =
                    "Search...";

                input.style.position =
                    "fixed";

                input.style.top =
                    "60px";

                input.style.left =
                    "50%";

                input.style.transform =
                    "translateX(-50%)";

                input.style.zIndex =
                    "99999";

                input.style.padding =
                    "12px";

                input.style.width =
                    "80%";

                input.style.borderRadius =
                    "10px";

                input.style.border =
                    "none";

                document.body.appendChild(
                    input
                );

            }


            input.focus();


            input.oninput =
                () => {

                    const query =
                        input.value
                            .trim()
                            .toLowerCase();


                    document
                        .querySelectorAll(
                            ".video-item"
                        )
                        .forEach(item => {

                            const text =
                                item.textContent
                                    .toLowerCase();


                            item.style.display =
                                !query ||
                                text.includes(query)
                                    ? ""
                                    : "none";

                        });

                };

        }
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


    tabs.forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                tabs.forEach(
                    item => {

                        item.classList.remove(
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
                    text === "following"
                ) {

                    showMessage(
                        "👥 Following feed"
                    );

                } else {

                    showMessage(
                        "🌎 For You feed"
                    );

                }

            }
        );

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

    const close =
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

            /*
             * Profile navigation-এর পরিবর্তে
             * menu খুলবে।
             */

            event.preventDefault();

            event.stopPropagation();


            const visible =
                menu.getAttribute(
                    "aria-hidden"
                ) !== "true";


            menu.setAttribute(
                "aria-hidden",
                String(visible)
            );


            menu.style.display =
                visible
                    ? "none"
                    : "block";

        }
    );


    if (close) {

        close.addEventListener(
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
   MESSAGE
   ========================================================= */

function showMessage(text) {

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
            "80px";


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
   GLOBAL WWC
   ========================================================= */

window.WWC = {

    getCurrentUser:
        () => currentUser,

    getAuth:
        () => auth,

    getFirestore:
        () => db,

    logout:
        () => signOut(auth)

};


/* =========================================================
   END
   ========================================================= */

console.log(
    "🌍 WWC-Core APP.JS loaded successfully"
);
