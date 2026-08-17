
/*
====================================================
WORLD WIDE CONNECT
NEW APP.JS
Works with current index.html + style.css
====================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    console.log("WWC-Core started");


    /* =================================================
       HELPERS
    ================================================= */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));

    const getItem = (element) =>
        element ? element.closest(".video-item") : null;

    const getVideos = () =>
        $$(".feed-video");

    const getItems = () =>
        $$(".video-item");


    /* =================================================
       STATE
    ================================================= */

    let currentVideo = null;
    let activeCommentItem = null;

    let followingUsers = JSON.parse(
        localStorage.getItem("wwc_following") || "[]"
    );

    let savedVideos = JSON.parse(
        localStorage.getItem("wwc_saved") || "[]"
    );


    /* =================================================
       LOCAL STORAGE
    ================================================= */

    function saveFollowing() {
        localStorage.setItem(
            "wwc_following",
            JSON.stringify(followingUsers)
        );
    }

    function saveSaved() {
        localStorage.setItem(
            "wwc_saved",
            JSON.stringify(savedVideos)
        );
    }


    /* =================================================
       VIDEO CONTROL
    ================================================= */

    function pauseAll(except = null) {

        getVideos().forEach(video => {

            if (video !== except) {
                video.pause();
            }

        });

    }


    function playVideo(video, sound = false) {

        if (!video) return;

        pauseAll(video);

        currentVideo = video;

        video.playsInline = true;
        video.setAttribute("playsinline", "");

        video.muted = !sound;

        const result = video.play();

        if (result && result.catch) {

            result.catch(error => {
                console.log("Video play blocked:", error);
            });

        }

    }


    /* =================================================
       INITIAL VIDEO
    ================================================= */

    const firstVideo = $(".feed-video");

    if (firstVideo) {

        setTimeout(() => {
            playVideo(firstVideo, false);
        }, 300);

    }


    /* =================================================
       INTERSECTION OBSERVER
    ================================================= */

    if ("IntersectionObserver" in window) {

        const observer = new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    const video = entry.target;

                    if (
                        entry.isIntersecting &&
                        entry.intersectionRatio >= 0.60
                    ) {

                        playVideo(video, false);

                    } else {

                        video.pause();

                    }

                });

            },
            {
                threshold: [0.60]
            }
        );

        getVideos().forEach(video => {
            observer.observe(video);
        });

    }


    /* =================================================
       VIDEO CLICK
    ================================================= */

    document.addEventListener("click", event => {

        const video = event.target.closest(".feed-video");

        if (!video) return;

        if (video.paused) {

            playVideo(video, true);

        } else {

            video.pause();

        }

    });


    /* =================================================
       NEXT VIDEO
    ================================================= */

    function goToVideo(index) {

        const items = getItems();

        if (!items.length) return;

        if (index < 0) {
            index = items.length - 1;
        }

        if (index >= items.length) {
            index = 0;
        }

        const item = items[index];

        item.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        const video = $(".feed-video", item);

        if (video) {

            setTimeout(() => {
                playVideo(video, false);
            }, 400);

        }

    }


    function nextVideo() {

        const items = getItems();

        if (!items.length) return;

        const item = getItem(currentVideo);

        let index = items.indexOf(item);

        if (index < 0) index = 0;

        goToVideo(index + 1);

    }


    function previousVideo() {

        const items = getItems();

        if (!items.length) return;

        const item = getItem(currentVideo);

        let index = items.indexOf(item);

        if (index < 0) index = 0;

        goToVideo(index - 1);

    }


    /* =================================================
       VIDEO END
    ================================================= */

    document.addEventListener("ended", event => {

        const video = event.target;

        if (!video.classList.contains("feed-video")) {
            return;
        }

        nextVideo();

    }, true);


    /* =================================================
       SWIPE
    ================================================= */

    let startY = 0;
    let startX = 0;

    document.addEventListener("touchstart", event => {

        if (!event.touches.length) return;

        if (
            event.target.closest("button") ||
            event.target.closest("input") ||
            event.target.closest("textarea") ||
            event.target.closest(".comment-box")
        ) {
            return;
        }

        startY = event.touches[0].clientY;
        startX = event.touches[0].clientX;

    }, { passive: true });


    document.addEventListener("touchend", event => {

        if (!event.changedTouches.length) return;

        const touch = event.changedTouches[0];

        const dy = startY - touch.clientY;
        const dx = startX - touch.clientX;

        if (Math.abs(dy) < 70) return;

        if (Math.abs(dx) > Math.abs(dy)) return;

        if (dy > 0) {
            nextVideo();
        } else {
            previousVideo();
        }

    }, { passive: true });


    /* =================================================
       LIKE
    ================================================= */

    document.addEventListener("click", event => {

        const button = event.target.closest(".like-btn");

        if (!button) return;

        event.preventDefault();
        event.stopPropagation();

        const item = getItem(button);

        if (!item) return;

        const count = $(".like-count", button);

        let number = parseInt(
            count ? count.textContent : "0",
            10
        ) || 0;

        const liked = button.classList.contains("liked");

        if (liked) {

            number = Math.max(0, number - 1);

            button.classList.remove("liked");

            button.setAttribute(
                "aria-pressed",
                "false"
            );

        } else {

            number++;

            button.classList.add("liked");

            button.setAttribute(
                "aria-pressed",
                "true"
            );

        }

        if (count) {
            count.textContent = number;
        }

    });


    /* =================================================
       DOUBLE TAP LIKE
    ================================================= */

    document.addEventListener("dblclick", event => {

        const video = event.target.closest(".feed-video");

        if (!video) return;

        const item = getItem(video);

        if (!item) return;

        const button = $(".like-btn", item);

        if (
            button &&
            !button.classList.contains("liked")
        ) {
            button.click();
        }

    });


    /* =================================================
       FOLLOW
    ================================================= */

    document.addEventListener("click", event => {

        const button = event.target.closest(".follow-btn");

        if (!button) return;

        event.preventDefault();
        event.stopPropagation();

        const item = getItem(button);

        if (!item) return;

        const usernameElement = $(".username", item);

        const username = usernameElement
            ? usernameElement.textContent.trim()
            : "unknown";

        const index = followingUsers.indexOf(username);

        if (index >= 0) {

            followingUsers.splice(index, 1);

            button.classList.remove("following");

            button.textContent = "Follow";

            button.setAttribute(
                "aria-pressed",
                "false"
            );

        } else {

            followingUsers.push(username);

            button.classList.add("following");

            button.textContent = "Following";

            button.setAttribute(
                "aria-pressed",
                "true"
            );

        }

        saveFollowing();

    });


    /* =================================================
       RESTORE FOLLOW
    ================================================= */

    $$(".video-item").forEach(item => {

        const button = $(".follow-btn", item);
        const username = $(".profile-area .username", item);

        if (!button || !username) return;

        if (
            followingUsers.includes(
                username.textContent.trim()
            )
        ) {

            button.classList.add("following");

            button.textContent = "Following";

            button.setAttribute(
                "aria-pressed",
                "true"
            );

        }

    });


    /* =================================================
       SAVE
    ================================================= */

    document.addEventListener("click", event => {

        const button = event.target.closest(".save-btn");

        if (!button) return;

        event.preventDefault();
        event.stopPropagation();

        const item = getItem(button);

        if (!item) return;

        const videoId = item.dataset.videoId;

        const count = $(".save-count", button);

        let number = parseInt(
            count ? count.textContent : "0",
            10
        ) || 0;

        const saved = button.classList.contains("saved");

        if (saved) {

            button.classList.remove("saved");

            button.setAttribute(
                "aria-pressed",
                "false"
            );

            if (videoId) {

                const index =
                    savedVideos.indexOf(videoId);

                if (index >= 0) {
                    savedVideos.splice(index, 1);
                }

            }

            number = Math.max(0, number - 1);

        } else {

            button.classList.add("saved");

            button.setAttribute(
                "aria-pressed",
                "true"
            );

            if (
                videoId &&
                !savedVideos.includes(videoId)
            ) {

                savedVideos.push(videoId);

            }

            number++;

        }

        if (count) {
            count.textContent = number;
        }

        saveSaved();

    });


    /* =================================================
       RESTORE SAVED
    ================================================= */

    $$(".video-item").forEach(item => {

        const id = item.dataset.videoId;

        const button = $(".save-btn", item);

        if (!id || !button) return;

        if (savedVideos.includes(id)) {

            button.classList.add("saved");

            button.setAttribute(
                "aria-pressed",
                "true"
            );

        }

    });


    /* =================================================
       SHARE
    ================================================= */

    document.addEventListener("click", async event => {

        const button = event.target.closest(".share-btn");

        if (!button) return;

        event.preventDefault();
        event.stopPropagation();

        const item = getItem(button);

        let url = window.location.href;

        if (item && item.dataset.videoId) {

            url =
                window.location.origin +
                window.location.pathname +
                "?video=" +
                encodeURIComponent(
                    item.dataset.videoId
                );

        }

        try {

            if (navigator.share) {

                await navigator.share({
                    title: "World Wide Connect",
                    text:
                        "Check this video on World Wide Connect 🌎",
                    url: url
                });

            } else if (
                navigator.clipboard &&
                navigator.clipboard.writeText
            ) {

                await navigator.clipboard.writeText(url);

                alert("Video link copied!");

            } else {

                window.prompt(
                    "Copy video link:",
                    url
                );

            }

        } catch (error) {

            console.log("Share cancelled");

        }

    });


    /* =================================================
       COMMENTS
    ================================================= */

    const commentBox = $("#commentBox");
    const commentInput = $("#commentInput");
    const commentSend = $("#commentSend");
    const commentCancel = $("#commentCancel");


    function getCommentKey(item) {

        return (
            "wwc_comments_" +
            (item?.dataset.videoId || "unknown")
        );

    }


    function getComments(item) {

        try {

            return JSON.parse(
                localStorage.getItem(
                    getCommentKey(item)
                ) || "[]"
            );

        } catch {

            return [];

        }

    }


    function saveComments(item, comments) {

        localStorage.setItem(
            getCommentKey(item),
            JSON.stringify(comments)
        );

    }


    function openComments(item) {

        if (!commentBox || !item) return;

        activeCommentItem = item;

        commentBox.classList.add("show");

        if (commentInput) {
            commentInput.value = "";
            commentInput.focus();
        }

    }


    function closeComments() {

        if (!commentBox) return;

        commentBox.classList.remove("show");

        activeCommentItem = null;

    }


    document.addEventListener("click", event => {

        const button =
            event.target.closest(".comment-btn");

        if (!button) return;

        event.preventDefault();
        event.stopPropagation();

        openComments(getItem(button));

    });


    if (commentCancel) {

        commentCancel.addEventListener("click", event => {

            event.preventDefault();

            closeComments();

        });

    }


    if (commentSend) {

        commentSend.addEventListener("click", event => {

            event.preventDefault();

            if (!activeCommentItem || !commentInput) {
                return;
            }

            const text =
                commentInput.value.trim();

            if (!text) {

                alert("Write a comment first.");

                return;

            }

            const comments =
                getComments(activeCommentItem);

            comments.push({
                text: text,
                time: new Date().toLocaleString()
            });

            saveComments(
                activeCommentItem,
                comments
            );

            commentInput.value = "";

            alert("Comment added!");

            closeComments();

        });

    }


    /* =================================================
       SEARCH
    ================================================= */

    const searchBtn = $("#searchBtn");

    let searchBox = null;


    function closeSearch() {

        if (searchBox) {

            searchBox.remove();

            searchBox = null;

            $$(".video-item").forEach(item => {
                item.style.display = "";
            });

        }

    }


    function openSearch() {

        if (searchBox) return;

        searchBox = document.createElement("div");

        searchBox.id = "wwcSearchBox";

        searchBox.style.cssText = `
            position:fixed;
            top:65px;
            left:10px;
            right:10px;
            z-index:5000;
            background:#111;
            padding:12px;
            border-radius:12px;
        `;

        searchBox.innerHTML = `
            <input
                id="wwcSearchInput"
                type="search"
                placeholder="Search videos or users..."
                style="
                    width:100%;
                    padding:12px;
                    border:none;
                    outline:none;
                    border-radius:8px;
                    font-size:16px;
                "
            >
            <div
                id="wwcSearchResult"
                style="
                    color:#aaa;
                    padding:8px;
                    text-align:center;
                "
            >
                Type something to search
            </div>
        `;

        document.body.appendChild(searchBox);

        const input = $("#wwcSearchInput");
        const result = $("#wwcSearchResult");

        input.focus();

        input.addEventListener("input", () => {

            const query =
                input.value.trim().toLowerCase();

            const items = getItems();

            if (!query) {

                items.forEach(item => {
                    item.style.display = "";
                });

                result.textContent =
                    "Type something to search";

                return;

            }

            let found = 0;

            items.forEach(item => {

                const username =
                    $(".username", item)
                        ?.textContent
                        .toLowerCase() || "";

                const caption =
                    $(".video-caption", item)
                        ?.textContent
                        .toLowerCase() || "";

                const match =
                    username.includes(query) ||
                    caption.includes(query);

                item.style.display =
                    match ? "" : "none";

                if (match) found++;

            });

            result.textContent =
                found +
                (found === 1
                    ? " video found"
                    : " videos found");

        });

    }


    if (searchBtn) {

        searchBtn.addEventListener("click", event => {

            event.preventDefault();
            event.stopPropagation();

            if (searchBox) {
                closeSearch();
            } else {
                openSearch();
            }

        });

    }


    /* =================================================
       TOP TABS
    ================================================= */

    $$(".wwc-top-tab").forEach(button => {

        button.addEventListener("click", event => {

            event.preventDefault();

            $$(".wwc-top-tab").forEach(btn => {
                btn.classList.remove("active");
            });

              button.classList.add("active");

        const tabName =
            button.textContent.trim().toLowerCase();

        if (tabName === "following") {

            showFollowingFeed();

        } else {

            showForYouFeed();

        }

    });

});


/* =========================================
   HOME BUTTON
========================================= */

const homeBtn =
    document.getElementById("homeBtn");

if (homeBtn) {

    homeBtn.addEventListener("click", event => {

        event.preventDefault();
        event.stopPropagation();

        document.querySelectorAll(
            ".wwc-nav-btn"
        ).forEach(btn => {
            btn.classList.remove("active");
        });

        homeBtn.classList.add("active");

        showForYouFeed();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}


/* =========================================
   FRIENDS BUTTON
========================================= */

const friendsBtn =
    document.getElementById("friendsBtn");

if (friendsBtn) {

    friendsBtn.addEventListener("click", event => {

        event.preventDefault();
        event.stopPropagation();

        document.querySelectorAll(
            ".wwc-nav-btn"
        ).forEach(btn => {
            btn.classList.remove("active");
        });

        friendsBtn.classList.add("active");

        alert("Friends feature coming soon.");

    });

}


/* =========================================
   INBOX BUTTON
========================================= */

const inboxBtn =
    document.getElementById("inboxBtn");

if (inboxBtn) {

    inboxBtn.addEventListener("click", event => {

        event.preventDefault();
        event.stopPropagation();

        document.querySelectorAll(
            ".wwc-nav-btn"
        ).forEach(btn => {
            btn.classList.remove("active");
        });

        inboxBtn.classList.add("active");

        alert("Inbox feature coming soon.");

    });

}


/* =========================================
   UPLOAD BUTTON
========================================= */

const uploadBtn =
    document.getElementById("uploadBtn");

const videoUpload =
    document.getElementById("videoUpload");

if (uploadBtn && videoUpload) {

    uploadBtn.addEventListener("click", event => {

        event.preventDefault();
        event.stopPropagation();

        videoUpload.click();

    });


    videoUpload.addEventListener(
        "change",
        event => {

            const file =
                event.target.files &&
                event.target.files[0];

            if (!file) return;


            if (!file.type.startsWith("video/")) {

                alert("Please select a video file.");

                videoUpload.value = "";

                return;

            }


            /*
             * এখন local preview দেখানো হবে।
             * Firebase / Cloudinary upload
             * পরে এখানে যোগ করা যাবে।
             */

            const videoURL =
                URL.createObjectURL(file);


            const feed =
                document.getElementById("video-feed");

            if (!feed) return;


            const item =
                document.createElement("section");

            item.className =
                "video-item";

            item.dataset.videoId =
                "local-" + Date.now();


            item.innerHTML = `
                <video
                    class="feed-video"
                    autoplay
                    muted
                    playsinline
                    loop
                >
                    <source
                        src="${videoURL}"
                        type="${file.type}"
                    >
                </video>

                <div class="profile-area">

                    <img
                        class="profile-photo"
                        src="./images/profile.png"
                        alt="Profile"
                    >

                    <div class="username">
                        @wwc_user
                    </div>

                    <button
                        class="follow-btn"
                        type="button"
                    >
                        Follow
                    </button>

                </div>

                <div class="actions">

                    <button
                        class="action-btn like-btn"
                        type="button"
                        aria-pressed="false"
                    >
                        ❤️
                        <span class="like-count">0</span>
                    </button>

                    <button
                        class="action-btn comment-btn"
                        type="button"
                    >
                        💬
                    </button>

                    <button
                        class="action-btn save-btn"
                        type="button"
                        aria-pressed="false"
                    >
                        🔖
                        <span class="save-count">0</span>
                    </button>

                    <button
                        class="action-btn share-btn"
                        type="button"
                    >
                        ↗️
                    </button>

                </div>

                <div class="video-info">

                    <div class="username">
                        @wwc_user
                    </div>

                    <div class="video-caption">
                        My new video 🌎
                    </div>

                </div>
            `;


            feed.appendChild(item);


            /*
             * নতুন ভিডিওর button-গুলো
             * কাজ করানোর জন্য event system
             * আবার initialize করা হবে।
             */

            if (typeof initializeVideoButtons === "function") {

                initializeVideoButtons();

            }


            item.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }
    );

}


/* =========================================
   PROFILE BUTTON
========================================= */

const profileBtn =
    document.getElementById("profileBtn");

const profileMenu =
    document.getElementById("profileMenu");

if (profileBtn && profileMenu) {

    profileBtn.addEventListener("click", event => {

        event.preventDefault();
        event.stopPropagation();

        document.querySelectorAll(
            ".wwc-nav-btn"
        ).forEach(btn => {
            btn.classList.remove("active");
        });

        profileBtn.classList.add("active");


        profileMenu.classList.add("show");

        profileMenu.setAttribute(
            "aria-hidden",
            "false"
        );

    });

}


/* =========================================
   CLOSE PROFILE MENU
========================================= */

const profileMenuClose =
    document.getElementById("profileMenuClose");

if (profileMenuClose) {

    profileMenuClose.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            closeProfileMenu();

        }
    );

}


/* =========================================
   PROFILE MENU BUTTON
========================================= */

const profileBtnMenu =
    document.getElementById("profileBtnMenu");

if (profileBtnMenu) {

    profileBtnMenu.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            window.location.href =
                "./profile.html";

        }
    );

}


/* =========================================
   LOGIN / REGISTER
========================================= */

const loginBtn =
    document.getElementById("loginBtn");

if (loginBtn) {

    loginBtn.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            window.location.href =
                "./auth.html";

        }
    );

}


/* =========================================
   LOGOUT
========================================= */

const logoutBtn =
    document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async event => {

            event.preventDefault();
            event.stopPropagation();


            /*
             * Firebase signOut থাকলে ব্যবহার করবে।
             */

            try {

                if (
                    typeof auth !== "undefined" &&
                    typeof signOut === "function"
                ) {

                    await signOut(auth);

                }

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }


            window.location.href =
                "./auth.html";

        }
    );

}


/* =========================================
   CLOSE PROFILE MENU OUTSIDE
========================================= */

document.addEventListener(
    "click",
    event => {

        if (!profileMenu) return;


        if (
            profileMenu.classList.contains("show") &&
            !profileMenu.contains(event.target) &&
            !profileBtn?.contains(event.target)
        ) {

            closeProfileMenu();

        }

    }
);


/* =========================================
   ESCAPE KEY
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") return;


        if (typeof closeSearch === "function") {
            closeSearch();
        }


        if (typeof closeCommentBox === "function") {
            closeCommentBox();
        }


        closeProfileMenu();

    }
);


/* =========================================
   INITIAL VIDEO
========================================= */

const firstVideo =
    document.querySelector(".feed-video");

if (firstVideo) {

    setTimeout(() => {

        firstVideo.muted = true;

        firstVideo
            .play()
            .catch(error => {
                console.log(
                    "Autoplay waiting:",
                    error
                );
            });

    }, 300);

}


/* =========================================
   APP READY
========================================= */

console.log(
    "WWC-Core: all navigation controls initialized."
);

});
