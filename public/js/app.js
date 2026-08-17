/*
====================================================
WORLD WIDE CONNECT
NEW APP.JS
Main Feed + Following + For You + Search
Like + Comment + Save + Share + Follow
Home + Friends + Upload + Inbox + Profile
====================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    console.log("WWC-Core NEW APP STARTED");


    /* =================================================
       HELPERS
    ================================================= */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));

    const getItems = () =>
        $$(".video-item");

    const getVideos = () =>
        $$(".feed-video");

    const getItem = element =>
        element ? element.closest(".video-item") : null;


    /* =================================================
       APP STATE
    ================================================= */

    let currentVideo = null;

    let currentFeed = "for-you";

    let activeCommentItem = null;

    const followedUsers =
        JSON.parse(
            localStorage.getItem("wwc_following") || "[]"
        );

    const savedVideos =
        JSON.parse(
            localStorage.getItem("wwc_saved") || "[]"
        );


    /* =================================================
       SAVE LOCAL DATA
    ================================================= */

    function saveFollowing() {

        localStorage.setItem(
            "wwc_following",
            JSON.stringify(followedUsers)
        );

    }


    function saveSavedVideos() {

        localStorage.setItem(
            "wwc_saved",
            JSON.stringify(savedVideos)
        );

    }


    /* =================================================
       VIDEO CONTROL
    ================================================= */

    function pauseAllVideos(except = null) {

        getVideos().forEach(video => {

            if (video !== except) {

                video.pause();

            }

        });

    }


    function playVideo(video, sound = false) {

        if (!video) return;

        pauseAllVideos(video);

        currentVideo = video;

        video.playsInline = true;

        video.setAttribute(
            "playsinline",
            ""
        );

        video.muted = !sound;

        const promise = video.play();

        if (promise && promise.catch) {

            promise.catch(error => {

                console.log(
                    "Video autoplay blocked:",
                    error
                );

            });

        }

    }


    /* =================================================
       INTERSECTION OBSERVER
    ================================================= */

    if ("IntersectionObserver" in window) {

        const observer =
            new IntersectionObserver(
                entries => {

                    entries.forEach(entry => {

                        const video =
                            entry.target;

                        if (
                            entry.isIntersecting &&
                            entry.intersectionRatio >= 0.60
                        ) {

                            playVideo(
                                video,
                                false
                            );

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

    document.addEventListener(
        "click",
        event => {

            const video =
                event.target.closest(".feed-video");

            if (!video) return;

            if (video.paused) {

                playVideo(
                    video,
                    true
                );

            } else {

                video.pause();

            }

        }
    );


    /* =================================================
       VIDEO END
    ================================================= */

    document.addEventListener(
        "ended",
        event => {

            const video =
                event.target;

            if (
                !video.classList.contains(
                    "feed-video"
                )
            ) {

                return;

            }

            const list =
                getItems();

            const item =
                getItem(video);

            const index =
                list.indexOf(item);

            if (
                index >= 0 &&
                index < list.length - 1
            ) {

                scrollToVideo(
                    index + 1
                );

            } else if (list.length) {

                scrollToVideo(0);

            }

        },
        true
    );


    /* =================================================
       SCROLL TO VIDEO
    ================================================= */

    function scrollToVideo(index) {

        const list =
            getItems();

        if (!list.length) return;

        index = Math.max(
            0,
            Math.min(
                index,
                list.length - 1
            )
        );

        const item =
            list[index];

        item.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        const video =
            $(".feed-video", item);

        if (video) {

            setTimeout(() => {

                playVideo(
                    video,
                    false
                );

            }, 500);

        }

    }


    function currentVideoIndex() {

        if (!currentVideo) {

            return 0;

        }

        const item =
            getItem(currentVideo);

        const index =
            getItems().indexOf(item);

        return index >= 0
            ? index
            : 0;

    }


    function nextVideo() {

        const index =
            currentVideoIndex();

        const list =
            getItems();

        if (!list.length) return;

        scrollToVideo(
            index < list.length - 1
                ? index + 1
                : 0
        );

    }


    function previousVideo() {

        const index =
            currentVideoIndex();

        if (index > 0) {

            scrollToVideo(
                index - 1
            );

        }

    }


    /* =================================================
       TOUCH SWIPE
    ================================================= */

    let touchStartY = 0;
    let touchStartX = 0;

    document.addEventListener(
        "touchstart",
        event => {

            if (!event.touches.length) return;

            const target =
                event.target;

            if (
                target.closest("button") ||
                target.closest("textarea") ||
                target.closest("input") ||
                target.closest(".comment-box")
            ) {

                return;

            }

            touchStartY =
                event.touches[0].clientY;

            touchStartX =
                event.touches[0].clientX;

        },
        {
            passive: true
        }
    );


    document.addEventListener(
        "touchend",
        event => {

            if (
                !event.changedTouches.length
            ) {

                return;

            }

            const touch =
                event.changedTouches[0];

            const distanceY =
                touchStartY -
                touch.clientY;

            const distanceX =
                touchStartX -
                touch.clientX;

            if (
                Math.abs(distanceY) < 70
            ) {

                return;

            }

            if (
                Math.abs(distanceX) >
                Math.abs(distanceY)
            ) {

                return;

            }

            if (distanceY > 0) {

                nextVideo();

            } else {

                previousVideo();

            }

        },
        {
            passive: true
        }
    );


    /* =================================================
       KEYBOARD
    ================================================= */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.target.tagName ===
                "TEXTAREA"
            ) {

                return;

            }

            if (
                event.key ===
                "ArrowDown"
            ) {

                event.preventDefault();

                nextVideo();

            }

            if (
                event.key ===
                "ArrowUp"
            ) {

                event.preventDefault();

                previousVideo();

            }

        }
    );


    /* =================================================
       LIKE
    ================================================= */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".like-btn"
                );

            if (!button) return;

            event.preventDefault();
            event.stopPropagation();

            const item =
                getItem(button);

            if (!item) return;

            const count =
                $(".like-count", item);

            let number =
                count
                    ? parseInt(
                        count.textContent,
                        10
                    ) || 0
                    : 0;

            const liked =
                button.classList.contains(
                    "liked"
                );

            if (liked) {

                number =
                    Math.max(
                        0,
                        number - 1
                    );

                button.classList.remove(
                    "liked"
                );

                button.setAttribute(
                    "aria-pressed",
                    "false"
                );

            } else {

                number++;

                button.classList.add(
                    "liked"
                );

                button.setAttribute(
                    "aria-pressed",
                    "true"
                );

            }

            if (count) {

                count.textContent =
                    number;

            }

        }
    );


    /* =================================================
       DOUBLE TAP LIKE
    ================================================= */

    document.addEventListener(
        "dblclick",
        event => {

            const video =
                event.target.closest(
                    ".feed-video"
                );

            if (!video) return;

            const item =
                getItem(video);

            const button =
                item
                    ? $(".like-btn", item)
                    : null;

            if (
                button &&
                !button.classList.contains(
                    "liked"
                )
            ) {

                button.click();

            }

        }
    );


    /* =================================================
       FOLLOW
    ================================================= */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".follow-btn"
                );

            if (!button) return;

            event.preventDefault();
            event.stopPropagation();

            const item =
                getItem(button);

            if (!item) return;

            const usernameElement =
                $(".username", item);

            const username =
                usernameElement
                    ? usernameElement.textContent.trim()
                    : "unknown";

            const index =
                followedUsers.indexOf(
                    username
                );

            if (index >= 0) {

                followedUsers.splice(
                    index,
                    1
                );

                button.classList.remove(
                    "following"
                );

                button.textContent =
                    "Follow";

                button.setAttribute(
                    "aria-pressed",
                    "false"
                );

            } else {

                followedUsers.push(
                    username
                );

                button.classList.add(
                    "following"
                );

                button.textContent =
                    "Following";

                button.setAttribute(
                    "aria-pressed",
                    "true"
                );

            }

            saveFollowing();

        }
    );


    /* =================================================
       RESTORE FOLLOW STATE
    ================================================= */

    function restoreFollowState() {

        $$(".video-item").forEach(item => {

            const button =
                $(".follow-btn", item);

            const usernameElement =
                $(".username", item);

            if (
                !button ||
                !usernameElement
            ) {

                return;

            }

            const username =
                usernameElement.textContent.trim();

            if (
                followedUsers.includes(
                    username
                )
            ) {

                button.classList.add(
                    "following"
                );

                button.textContent =
                    "Following";

                button.setAttribute(
                    "aria-pressed",
                    "true"
                );

            }

        });

    }


    restoreFollowState();


    /* =================================================
       SAVE
    ================================================= */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".save-btn"
                );

            if (!button) return;

            event.preventDefault();
            event.stopPropagation();

            const item =
                getItem(button);

            if (!item) return;

            const videoId =
                item.dataset.videoId;

            const count =
                $(".save-count", item);

            let number =
                count
                    ? parseInt(
                        count.textContent,
                        10
                    ) || 0
                    : 0;

            const saved =
                button.classList.contains(
                    "saved"
                );

            if (saved) {

                button.classList.remove(
                    "saved"
                );

                button.setAttribute(
                    "aria-pressed",
                    "false"
                );

                if (videoId) {

                    const index =
                        savedVideos.indexOf(
                            videoId
                        );

                    if (index >= 0) {

                        savedVideos.splice(
                            index,
                            1
                        );

                    }

                }

                number =
                    Math.max(
                        0,
                        number - 1
                    );

            } else {

                button.classList.add(
                    "saved"
                );

                button.setAttribute(
                    "aria-pressed",
                    "true"
                );

                if (
                    videoId &&
                    !savedVideos.includes(
                        videoId
                    )
                ) {

                    savedVideos.push(
                        videoId
                    );

                }

                number++;

            }

            if (count) {

                count.textContent =
                    number;

            }

            saveSavedVideos();

        }
    );


    /* =================================================
       RESTORE SAVED
    ================================================= */

    function restoreSavedState() {

        $$(".video-item").forEach(item => {

            const videoId =
                item.dataset.videoId;

            const button =
                $(".save-btn", item);

            if (
                !videoId ||
                !button
            ) {

                return;

            }

            if (
                savedVideos.includes(
                    videoId
                )
            ) {

                button.classList.add(
                    "saved"
                );

                button.setAttribute(
                    "aria-pressed",
                    "true"
                );

            }

        });

    }


    restoreSavedState();


    /* =================================================
       SHARE
    ================================================= */

    document.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    ".share-btn"
                );

            if (!button) return;

            event.preventDefault();
            event.stopPropagation();

            const item =
                getItem(button);

            let shareUrl =
                window.location.href;

            if (
                item &&
                item.dataset.videoId
            ) {

                shareUrl =
                    window.location.origin +
                    window.location.pathname +
                    "?video=" +
                    encodeURIComponent(
                        item.dataset.videoId
                    );

            }

            const shareData = {

                title:
                    "World Wide Connect",

                text:
                    "Check this video on World Wide Connect 🌎",

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

                } else if (
                    navigator.clipboard &&
                    navigator.clipboard.writeText
                ) {

                    await navigator.clipboard.writeText(
                        shareUrl
                    );

                    alert(
                        "Video link copied!"
                    );

                } else {

                    window.prompt(
                        "Copy video link:",
                        shareUrl
                    );

                }

            } catch (error) {

                console.log(
                    "Share cancelled"
                );

            }

        }
    );


    /* =================================================
       COMMENTS
    ================================================= */

  document.addEventListener("click", e => {

    const button = e.target.closest(".comment-btn");

    if (!button) return;

    e.preventDefault();
    e.stopPropagation();

    const box = document.getElementById("commentBox");

    if (!box) return;

    activeCommentVideo =
        button.closest(".video-item");

    box.classList.add("show");

    const input =
        document.getElementById("commentInput");

    if (input) {

        input.value = "";

        setTimeout(() => {
            input.focus();
        }, 100);
    }

});


/* =========================================
   COMMENT CANCEL
========================================= */

const wwcCommentCancel =
    document.getElementById("commentCancel");

if (wwcCommentCancel) {

    wwcCommentCancel.addEventListener("click", e => {

        e.preventDefault();
        e.stopPropagation();

        const box =
            document.getElementById("commentBox");

        if (box) {
            box.classList.remove("show");
        }

        activeCommentVideo = null;

    });
}


/* =========================================
   COMMENT SEND
========================================= */

const wwcCommentSend =
    document.getElementById("commentSend");

if (wwcCommentSend) {

    wwcCommentSend.addEventListener("click", e => {

        e.preventDefault();
        e.stopPropagation();

        const input =
            document.getElementById("commentInput");

        const box =
            document.getElementById("commentBox");

        if (!input || !box) return;

        const text =
            input.value.trim();

        if (!text) {

            alert("Please write a comment.");

            input.focus();

            return;
        }

        if (activeCommentVideo) {

            let comments =
                activeCommentVideo.querySelector(
                    ".comment-list"
                );

            if (!comments) {

                comments =
                    document.createElement("div");

                comments.className =
                    "comment-list";

                comments.style.cssText = `
                    margin-top:10px;
                    max-height:180px;
                    overflow-y:auto;
                    color:#fff;
                    font-size:13px;
                `;

                activeCommentVideo.appendChild(comments);
            }

            const comment =
                document.createElement("div");

            comment.style.cssText = `
                padding:8px 0;
                border-bottom:1px solid rgba(255,255,255,0.10);
            `;

            comment.textContent =
                "@wwc_user: " + text;

            comments.appendChild(comment);
        }

        input.value = "";

        box.classList.remove("show");

        activeCommentVideo = null;

    });
}


/* =========================================
   FOLLOWING / FOR YOU
========================================= */

const wwcTopTabs =
    document.querySelectorAll(".wwc-top-tab");

wwcTopTabs.forEach((tab, index) => {

    tab.addEventListener("click", e => {

        e.preventDefault();
        e.stopPropagation();

        wwcTopTabs.forEach(t => {
            t.classList.remove("active");
        });

        tab.classList.add("active");

        if (index === 0) {

            showFollowingFeed();

        } else {

            showForYouFeed();

        }

    });

});


function showForYouFeed() {

    const list =
        document.querySelectorAll(".video-item");

    list.forEach(item => {

        item.style.display = "block";

    });

    const feed =
        document.getElementById("video-feed");

    if (feed) {

        feed.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }

    setTimeout(() => {

        const first =
            document.querySelector(".video-item .feed-video");

        if (first) {
            playVideo(first, false);
        }

    }, 400);
}


function showFollowingFeed() {

    const list =
        document.querySelectorAll(".video-item");

    let found = false;

    list.forEach(item => {

        const follow =
            item.querySelector(".follow-btn");

        if (
            follow &&
            follow.classList.contains("following")
        ) {

            item.style.display = "block";

            found = true;

        } else {

            item.style.display = "none";

        }

    });


    const feed =
        document.getElementById("video-feed");

    if (feed) {

        feed.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    if (!found) {

        setTimeout(() => {

            alert(
                "You are not following anyone yet."
            );

        }, 300);

        const activeTab =
            document.querySelector(".wwc-top-tab.active");

        if (activeTab) {

            activeTab.classList.remove("active");

        }

        if (wwcTopTabs[1]) {

            wwcTopTabs[1].classList.add("active");

        }

        showForYouFeed();

    } else {

        setTimeout(() => {

            const first =
                document.querySelector(
                    '.video-item[style*="display: block"] .feed-video'
                );

            if (first) {

                playVideo(first, false);

            }

        }, 400);

    }

}


/* =========================================
   SEARCH BUTTON
========================================= */

const wwcSearchBtn =
    document.getElementById("searchBtn");

if (wwcSearchBtn) {

    wwcSearchBtn.addEventListener("click", e => {

        e.preventDefault();
        e.stopPropagation();

        openWWCSearch();

    });

}


function openWWCSearch() {

    let searchBox =
        document.getElementById("wwcSearchBox");

    if (searchBox) {

        searchBox.classList.add("show");

        const input =
            searchBox.querySelector("input");

        if (input) input.focus();

        return;
    }


    searchBox =
        document.createElement("div");

    searchBox.id =
        "wwcSearchBox";

    searchBox.style.cssText = `
        position:fixed;
        top:60px;
        left:50%;
        transform:translateX(-50%);
        width:calc(100% - 24px);
        max-width:420px;
        padding:12px;
        background:rgba(20,20,20,0.98);
        border:1px solid rgba(255,255,255,0.12);
        border-radius:14px;
        z-index:5000;
        box-shadow:0 10px 30px rgba(0,0,0,.5);
    `;


    searchBox.innerHTML = `

        <div style="
            display:flex;
            gap:8px;
            align-items:center;
        ">

            <input
                id="wwcSearchInput"
                type="search"
                placeholder="Search username or video..."
                autocomplete="off"
                style="
                    flex:1;
                    height:44px;
                    border:none;
                    outline:none;
                    border-radius:10px;
                    padding:0 12px;
                    font-size:15px;
                    background:#fff;
                    color:#000;
                "
            >

            <button
                id="wwcSearchClose"
                type="button"
                style="
                    width:44px;
                    height:44px;
                    border:none;
                    border-radius:10px;
                    background:#444;
                    color:#fff;
                    font-size:18px;
                "
            >
                ✕
            </button>

        </div>

        <div
            id="wwcSearchResults"
            style="
                margin-top:10px;
                max-height:220px;
                overflow-y:auto;
            "
        ></div>
    `;


    document.body.appendChild(searchBox);


    const input =
        document.getElementById("wwcSearchInput");

    const close =
        document.getElementById("wwcSearchClose");

    if (input) {

        input.addEventListener("input", () => {

            searchWWCVideos(
                input.value.trim()
            );

        });

        setTimeout(() => {
            input.focus();
        }, 100);
    }


    if (close) {

        close.addEventListener("click", () => {

            searchBox.remove();

            showForYouFeed();

        });

    }

}


function searchWWCVideos(query) {

    const results =
        document.getElementById("wwcSearchResults");

    if (!results) return;

    const list =
        document.querySelectorAll(".video-item");


    if (!query) {

        results.innerHTML = `
            <div style="
                color:#aaa;
                padding:12px;
                text-align:center;
            ">
                Type something to search
            </div>
        `;

        return;
    }


    const q =
        query.toLowerCase();

    let found = 0;

    list.forEach(item => {

        const username =
            (
                item.querySelector(".username")
                ?.textContent || ""
            ).toLowerCase();

        const caption =
            (
                item.querySelector(".video-caption")
                ?.textContent || ""
            ).toLowerCase();

        const match =
            username.includes(q) ||
            caption.includes(q);


        if (match) {

            item.style.display = "block";

            found++;

        } else {

            item.style.display = "none";

        }

    });


    if (found === 0) {

        results.innerHTML = `
            <div style="
                color:#aaa;
                padding:12px;
                text-align:center;
            ">
                No videos found
            </div>
        `;

    } else {

        results.innerHTML = `
            <div style="
                color:#aaa;
                padding:8px;
            ">
                ${found} video found
            </div>
        `;

    }

}


/* =========================================
   HOME BUTTON
========================================= */

const wwcHomeBtn =
    document.getElementById("homeBtn");

if (wwcHomeBtn) {

    wwcHomeBtn.addEventListener("click", e => {

        e.preventDefault();
        e.stopPropagation();

        document.querySelectorAll(
            ".wwc-nav-btn"
        ).forEach(btn => {
            btn.classList.remove("active");
        });

        wwcHomeBtn.classList.add("active");

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

const wwcFriendsBtn =
    document.getElementById("friendsBtn");

if (wwcFriendsBtn) {

    wwcFriendsBtn.addEventListener("click", e => {

        e.preventDefault();
        e.stopPropagation();

        document.querySelectorAll(
            ".wwc-nav-btn"
        ).forEach(btn => {
            btn.classList.remove("active");
        });

        wwcFriendsBtn.classList.add("active");

        window.location.href =
            "./friends.html";

    });

}


/* =========================================
   UPLOAD BUTTON
========================================= */

const wwcUploadBtn =
    document.getElementById("uploadBtn");

const wwcVideoUpload =
    document.getElementById("videoUpload");

if (wwcUploadBtn && wwcVideoUpload) {

    wwcUploadBtn.addEventListener("click", e => {

        e.preventDefault();
        e.stopPropagation();

        wwcVideoUpload.click();

    });


    wwcVideoUpload.addEventListener("change", e => {

        const file =
            e.target.files[0];

        if (!file) return;

        if (!file.type.startsWith("video/")) {

            alert("Please select a video file.");

            wwcVideoUpload.value = "";

            return;
        }


        alert(
            "Video selected: " +
            file.name
        );

        console.log(
            "WWC upload selected:",
            file
        );

    });

}


/* =========================================
   INBOX BUTTON
========================================= */

const wwcInboxBtn =
    document.getElementById("inboxBtn");

if (wwcInboxBtn) {

    wwcInboxBtn.addEventListener("click", e => {

        e.preventDefault();
        e.stopPropagation();

        document.querySelectorAll(
            ".wwc-nav-btn"
        ).forEach(btn => {
            btn.classList.remove("active");
        });

        wwcInboxBtn.classList.add("active");

        window.location.href =
            "./inbox.html";

    });

}


/* =========================================
   PROFILE BUTTON
========================================= */

const wwcProfileBtn =
    document.getElementById("profileBtn");

const wwcProfileMenu =
    document.getElementById("profileMenu");

if (wwcProfileBtn) {

    wwcProfileBtn.addEventListener("click", e => {

        e.preventDefault();
        e.stopPropagation();

        document.querySelectorAll(
            ".wwc-nav-btn"
        ).forEach(btn => {
            btn.classList.remove("active");
        });

        wwcProfileBtn.classList.add("active");


        if (wwcProfileMenu) {

            wwcProfileMenu.classList.toggle("show");

            wwcProfileMenu.setAttribute(
                "aria-hidden",
                wwcProfileMenu.classList.contains("show")
                    ? "false"
                    : "true"
            );

        } else {

            window.location.href =
                "./profile.html";

        }

    });

}


/* =========================================
   PROFILE MENU CLOSE
========================================= */

const wwcProfileClose =
    document.getElementById("profileMenuClose");

if (wwcProfileClose) {

    wwcProfileClose.addEventListener("click", e => {

        e.preventDefault();
        e.stopPropagation();

        if (wwcProfileMenu) {

            wwcProfileMenu.classList.remove("show");

            wwcProfileMenu.setAttribute(
                "aria-hidden",
                "true"
            );

        }

    });

}


/* =========================================
   PROFILE MENU → PROFILE
========================================= */

const wwcProfileMenuBtn =
    document.getElementById("profileBtnMenu");

if (wwcProfileMenuBtn) {

    wwcProfileMenuBtn.addEventListener("click", e => {

        e.preventDefault();
        e.stopPropagation();

        window.location.href =
            "./profile.html";

    });

}


/* =========================================
   LOGIN / REGISTER
========================================= */

const wwcLoginBtn =
    document.getElementById("loginBtn");

if (wwcLoginBtn) {

    wwcLoginBtn.addEventListener("click", e => {

        e.preventDefault();
        e.stopPropagation();

        window.location.href =
            "./auth.html";

    });

}


/* =========================================
   LOGOUT
========================================= */

const wwcLogoutBtn =
    document.getElementById("logoutBtn");

if (wwcLogoutBtn) {

    wwcLogoutBtn.addEventListener("click", e => {

        e.preventDefault();
        e.stopPropagation();

        /*
         * Firebase logout থাকলে পরে এখানে
         * signOut(auth) যোগ করা যাবে।
         */

        window.location.href =
            "./auth.html";

    });

}


/* =========================================
   CLOSE PROFILE MENU OUTSIDE
========================================= */

document.addEventListener("click", e => {

    if (!wwcProfileMenu || !wwcProfileBtn) {
        return;
    }

    if (
        wwcProfileMenu.classList.contains("show") &&
        !wwcProfileMenu.contains(e.target) &&
        !wwcProfileBtn.contains(e.target)
    ) {

        wwcProfileMenu.classList.remove("show");

        wwcProfileMenu.setAttribute(
            "aria-hidden",
            "true"
        );

    }

});


/* =========================================
   ESCAPE KEY
========================================= */

document.addEventListener("keydown", e => {

    if (e.key !== "Escape") return;


    const search =
        document.getElementById("wwcSearchBox");

    if (search) {
        search.remove();
    }


    if (wwcProfileMenu) {

        wwcProfileMenu.classList.remove("show");

        wwcProfileMenu.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    const commentBox =
        document.getElementById("commentBox");

    if (commentBox) {
        commentBox.classList.remove("show");
    }

});


/* =========================================
   INITIAL FEED
========================================= */

showForYouFeed();


console.log(
    "WWC-Core: New app.js navigation system ready."
);

});
