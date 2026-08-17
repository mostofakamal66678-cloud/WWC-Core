/*
====================================================
WORLD WIDE CONNECT
CLEAN APP.JS
Home + Following + For You + Search
Like + Comment + Save + Share + Follow
Home + Friends + Upload + Inbox + Profile
====================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    console.log("WWC-Core: CLEAN APP STARTED");


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

    const getItem = (element) =>
        element ? element.closest(".video-item") : null;

    const getVideoId = (item) =>
        item?.dataset?.videoId || "";

    const getUsername = (item) => {

        if (!item) return "@wwc_user";

        const username =
            $(".username", item);

        return username
            ? username.textContent.trim()
            : "@wwc_user";
    };


    /* =================================================
       STATE
    ================================================= */

    let currentVideo = null;

    let currentFeed = "for-you";

    let activeCommentItem = null;

    let searchPanel = null;

    let touchStartY = 0;

    let touchStartX = 0;


    /* =================================================
       LOCAL STORAGE
    ================================================= */

    function readArray(key) {

        try {

            const data =
                JSON.parse(
                    localStorage.getItem(key) || "[]"
                );

            return Array.isArray(data)
                ? data
                : [];

        } catch {

            return [];

        }

    }


    const followedUsers =
        readArray("wwc_following");


    const savedVideos =
        readArray("wwc_saved");


    const likedVideos =
        readArray("wwc_liked");


    function writeArray(key, value) {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    }


    function saveFollowing() {

        writeArray(
            "wwc_following",
            followedUsers
        );

    }


    function saveSaved() {

        writeArray(
            "wwc_saved",
            savedVideos
        );

    }


    function saveLiked() {

        writeArray(
            "wwc_liked",
            likedVideos
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


    function playVideo(
        video,
        sound = false
    ) {

        if (!video) return;

        pauseAllVideos(video);

        currentVideo = video;

        video.playsInline = true;

        video.setAttribute(
            "playsinline",
            ""
        );

        video.muted = !sound;

        const promise =
            video.play();

        if (
            promise &&
            typeof promise.catch === "function"
        ) {

            promise.catch(error => {

                console.log(
                    "Video play blocked:",
                    error
                );

            });

        }

    }


    function currentIndex() {

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


    function scrollToVideo(index) {

        const list =
            getItems();

        if (!list.length) return;

        const safeIndex =
            Math.max(
                0,
                Math.min(
                    index,
                    list.length - 1
                )
            );

        const item =
            list[safeIndex];

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

            }, 450);

        }

    }


    function nextVideo() {

        const list =
            getItems();

        if (!list.length) return;

        const index =
            currentIndex();

        scrollToVideo(
            index < list.length - 1
                ? index + 1
                : 0
        );

    }


    function previousVideo() {

        const index =
            currentIndex();

        if (index > 0) {

            scrollToVideo(
                index - 1
            );

        }

    }


    /* =================================================
       VIDEO OBSERVER
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
                            entry.intersectionRatio >= 0.6
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
                    threshold: [0.6]
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
                event.target.closest(
                    ".feed-video"
                );

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

            nextVideo();

        },
        true
    );


    /* =================================================
       SWIPE
    ================================================= */

    document.addEventListener(
        "touchstart",
        event => {

            if (!event.touches.length) {
                return;
            }

            const target =
                event.target;

            if (
                target.closest("button") ||
                target.closest("input") ||
                target.closest("textarea") ||
                target.closest(".comment-box") ||
                target.closest(".profile-menu") ||
                target.closest(".wwc-search-panel")
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
                "INPUT" ||
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

    function toggleLike(button) {

        const item =
            getItem(button);

        if (!item) return;

        const videoId =
            getVideoId(item);

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


            const index =
                likedVideos.indexOf(
                    videoId
                );

            if (index >= 0) {

                likedVideos.splice(
                    index,
                    1
                );

            }

        } else {

            number++;

            button.classList.add(
                "liked"
            );

            button.setAttribute(
                "aria-pressed",
                "true"
            );


            if (
                videoId &&
                !likedVideos.includes(
                    videoId
                )
            ) {

                likedVideos.push(
                    videoId
                );

            }

        }


        if (count) {

            count.textContent =
                String(number);

        }

        saveLiked();

    }


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

            toggleLike(button);

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

                toggleLike(button);

            }

        }
    );


    /* =================================================
       FOLLOW
    ================================================= */

    function updateFollowButton(item) {

        const button =
            $(".follow-btn", item);

        if (!button) return;

        const username =
            getUsername(item);

        const following =
            followedUsers.includes(
                username
            );

        button.classList.toggle(
            "following",
            following
        );

        button.textContent =
            following
                ? "Following"
                : "Follow";

        button.setAttribute(
            "aria-pressed",
            following
                ? "true"
                : "false"
        );

    }


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

            const username =
                getUsername(item);

            const index =
                followedUsers.indexOf(
                    username
                );


            if (index >= 0) {

                followedUsers.splice(
                    index,
                    1
                );

            } else {

                followedUsers.push(
                    username
                );

            }


            saveFollowing();

            updateFollowButton(item);


            if (
                currentFeed ===
                "following"
            ) {

                showFollowingFeed();

            }

        }
    );


    function restoreFollowState() {

        getItems().forEach(
            updateFollowButton
        );

    }


    /* =================================================
       SAVE
    ================================================= */

    function toggleSave(button) {

        const item =
            getItem(button);

        if (!item) return;

        const videoId =
            getVideoId(item);

        if (!videoId) return;

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
                !savedVideos.includes(
                    videoId
                )
            ) {

                savedVideos.push(
                    videoId
                );

                number++;

            }

        }


        if (count) {

            count.textContent =
                String(number);

        }

        saveSaved();

    }


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

            toggleSave(button);

        }
    );


    /* =================================================
       SHARE
    ================================================= */

    async function shareVideo(button) {

        const item =
            getItem(button);

        let shareUrl =
            window.location.href;


        if (
            item &&
            getVideoId(item)
        ) {

            const url =
                new URL(
                    window.location.href
                );

            url.searchParams.set(
                "video",
                getVideoId(item)
            );

            shareUrl =
                url.toString();

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

            if (navigator.share) {

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
                    shareUrl
                );

                alert(
                    "Video link copied!"
                );

                return;

            }


            window.prompt(
                "Copy video link:",
                shareUrl
            );


        } catch (error) {

            console.log(
                "Share cancelled"
            );

        }

    }


    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".share-btn"
                );

            if (!button) return;

            event.preventDefault();
            event.stopPropagation();

            shareVideo(button);

        }
    );


    /* =================================================
       COMMENTS
    ================================================= */

    const commentBox =
        $("#commentBox");

    const commentInput =
        $("#commentInput");

    const commentSend =
        $("#commentSend");

    const commentCancel =
        $("#commentCancel");


    function getComments(videoId) {

        if (!videoId) return [];

        try {

            const data =
                JSON.parse(
                    localStorage.getItem(
                        "wwc_comments_" +
                        videoId
                    ) || "[]"
                );

            return Array.isArray(data)
                ? data
                : [];

        } catch {

            return [];

        }

    }


    function saveComments(
        videoId,
        comments
    ) {

        localStorage.setItem(
            "wwc_comments_" +
            videoId,
            JSON.stringify(
                comments
            )
        );

    }


    function renderComments(item) {

        if (
            !commentBox ||
            !item
        ) {

           return;
    }

    const videoId =
        item.dataset.videoId;

    if (!videoId) return;

    const comments =
        getComments(videoId);

    let list =
        commentBox.querySelector(
            ".wwc-comments-list"
        );

    if (!list) {

        list =
            document.createElement("div");

        list.className =
            "wwc-comments-list";

        list.style.cssText = `
            max-height:220px;
            overflow-y:auto;
            margin:12px 0;
            padding:4px;
        `;

        commentBox.insertBefore(
            list,
            commentInput
        );

    }

    list.innerHTML = "";

    if (!comments.length) {

        list.innerHTML = `
            <div style="
                color:#999;
                text-align:center;
                padding:12px;
            ">
                No comments yet
            </div>
        `;

    } else {

        comments.forEach(comment => {

            const row =
                document.createElement("div");

            row.style.cssText = `
                padding:9px 5px;
                border-bottom:1px solid rgba(255,255,255,.1);
                color:#fff;
                word-break:break-word;
            `;

            const user =
                document.createElement("strong");

            user.textContent =
                comment.user || "@wwc_user";

            user.style.marginRight = "6px";

            const text =
                document.createElement("span");

            text.textContent =
                comment.text || "";

            row.appendChild(user);
            row.appendChild(text);

            list.appendChild(row);

        });

    }

}


/* =========================================
   OPEN COMMENTS
========================================= */

document.addEventListener(
    "click",
    e => {

        const button =
            e.target.closest(".comment-btn");

        if (!button) return;

        e.preventDefault();
        e.stopPropagation();

        const item =
            getItem(button);

        if (!item || !commentBox) return;

        activeCommentItem =
            item;

        renderComments(item);

        commentBox.classList.add("show");

        commentBox.setAttribute(
            "aria-hidden",
            "false"
        );

        if (commentInput) {

            commentInput.value = "";

            setTimeout(() => {

                commentInput.focus();

            }, 100);

        }

    }
);


/* =========================================
   SEND COMMENT
========================================= */

if (commentSend) {

    commentSend.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            if (!activeCommentItem) {

                alert(
                    "Please select a video first."
                );

                return;

            }

            if (!commentInput) return;

            const text =
                commentInput.value.trim();

            if (!text) {

                alert(
                    "Please write a comment."
                );

                commentInput.focus();

                return;

            }

            const videoId =
                activeCommentItem.dataset.videoId;

            if (!videoId) {

                alert(
                    "Video ID not found."
                );

                return;

            }

            const comments =
                getComments(videoId);

            comments.push({

                user:
                    "@wwc_user",

                text:
                    text,

                time:
                    Date.now()

            });

            saveComments(
                videoId,
                comments
            );

            renderComments(
                activeCommentItem
            );

            commentInput.value = "";

            alert(
                "Comment added successfully!"
            );

        }
    );

}


/* =========================================
   CANCEL COMMENT
========================================= */

if (commentCancel) {

    commentCancel.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            closeCommentBox();

        }
    );

}


function closeCommentBox() {

    if (!commentBox) return;

    commentBox.classList.remove(
        "show"
    );

    commentBox.setAttribute(
        "aria-hidden",
        "true"
    );

    activeCommentItem =
        null;

}


/* =========================================
   SEARCH SYSTEM
========================================= */

const wwcSearchBtn =
    document.getElementById(
        "searchBtn"
    );


function openSearch() {

    let searchBox =
        document.getElementById(
            "wwcSearchBox"
        );

    if (searchBox) {

        searchBox.classList.add(
            "show"
        );

        const input =
            searchBox.querySelector(
                "input"
            );

        if (input) input.focus();

        return;

    }


    searchBox =
        document.createElement("div");

    searchBox.id =
        "wwcSearchBox";

    searchBox.innerHTML = `

        <div class="wwc-search-inner">

            <input
                id="wwcSearchInput"
                type="search"
                placeholder="Search videos..."
                autocomplete="off"
            >

            <button
                id="wwcSearchClose"
                type="button"
            >
                ✕
            </button>

        </div>

        <div
            id="wwcSearchResults"
            class="wwc-search-results"
        ></div>

    `;


    searchBox.style.cssText = `
        position:fixed;
        top:0;
        left:0;
        right:0;
        z-index:99999;
        background:#111;
        padding:12px;
        box-sizing:border-box;
    `;


    const inner =
        searchBox.querySelector(
            ".wwc-search-inner"
        );

    inner.style.cssText = `
        display:flex;
        gap:8px;
        align-items:center;
    `;


    const input =
        searchBox.querySelector(
            "#wwcSearchInput"
        );

    input.style.cssText = `
        flex:1;
        padding:12px 15px;
        border:0;
        outline:none;
        border-radius:25px;
        background:#222;
        color:#fff;
        font-size:16px;
    `;


    const close =
        searchBox.querySelector(
            "#wwcSearchClose"
        );

    close.style.cssText = `
        width:44px;
        height:44px;
        border:0;
        border-radius:50%;
        background:#333;
        color:#fff;
        font-size:20px;
    `;


    document.body.appendChild(
        searchBox
    );


    const results =
        searchBox.querySelector(
            "#wwcSearchResults"
        );


    function performSearch() {

        const query =
            input.value.trim().toLowerCase();

        const list =
            getItems();

        let found = 0;


        list.forEach(item => {

            const username =
                (
                    $(".username", item)
                    ?.textContent || ""
                ).toLowerCase();

            const caption =
                (
                    $(".video-caption", item)
                    ?.textContent || ""
                ).toLowerCase();

            const match =
                query &&
                (
                    username.includes(query) ||
                    caption.includes(query)
                );


            if (match) {

                item.style.display =
                    "block";

                found++;

            } else {

                item.style.display =
                    "none";

            }

        });


        if (!query) {

            results.innerHTML = `
                <div style="
                    color:#aaa;
                    padding:15px;
                    text-align:center;
                ">
                    Type something to search
                </div>
            `;

            return;

        }


        if (!found) {

            results.innerHTML = `
                <div style="
                    color:#aaa;
                    padding:15px;
                    text-align:center;
                ">
                    No videos found
                </div>
            `;

        } else {

            results.innerHTML = `
                <div style="
                    color:#aaa;
                    padding:10px;
                ">
                    ${found} video found
                </div>
            `;

        }

    }


    input.addEventListener(
        "input",
        performSearch
    );


    close.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            closeSearch();

        }
    );


    input.focus();

}


function closeSearch() {

    const searchBox =
        document.getElementById(
            "wwcSearchBox"
        );

    if (searchBox) {

        searchBox.remove();

    }

    getItems().forEach(item => {

        item.style.display =
            "";

    });

}


if (wwcSearchBtn) {

    wwcSearchBtn.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            openSearch();

        }
    );

}


/* =========================================
   FOLLOWING / FOR YOU
========================================= */

const topTabs =
    $$(".wwc-top-tab");


function showForYouFeed() {

    currentFeed =
        "for-you";

    topTabs.forEach(tab => {

        const text =
            tab.textContent
                .trim()
                .toLowerCase();

        tab.classList.toggle(
            "active",
            text === "for you"
        );

    });


    getItems().forEach(item => {

        item.style.display =
            "block";

    });


    const first =
        getItems()[0];

    if (first) {

        const video =
            $(".feed-video", first);

        if (video) {

            setTimeout(() => {

                playVideo(
                    video,
                    false
                );

            }, 150);

        }

    }

}


function showFollowingFeed() {

    currentFeed =
        "following";

    topTabs.forEach(tab => {

        const text =
            tab.textContent
                .trim()
                .toLowerCase();

        tab.classList.toggle(
            "active",
            text === "following"
        );

    });


    let found = 0;


    getItems().forEach(item => {

        const usernameElement =
            $(".username", item);

        const username =
            usernameElement
                ? usernameElement.textContent.trim()
                : "";

        if (
            followedUsers.includes(
                username
            )
        ) {

            item.style.display =
                "block";

            found++;

        } else {

            item.style.display =
                "none";

            const video =
                $(".feed-video", item);

            if (video) {

                video.pause();

            }

        }

    });


    if (!found) {

        alert(
            "You are not following anyone yet."
        );

        showForYouFeed();

    }

}


topTabs.forEach(tab => {

    tab.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            const text =
                tab.textContent
                    .trim()
                    .toLowerCase();

            if (
                text === "following"
            ) {

                showFollowingFeed();

            } else {

                showForYouFeed();

            }

        }
    );

});


/* =========================================
   HOME BUTTON
========================================= */

const wwcHomeBtn =
    document.getElementById(
        "homeBtn"
    );

if (wwcHomeBtn) {

    wwcHomeBtn.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            showForYouFeed();

            window.scrollTo({
                top:0,
                behavior:"smooth"
            });

        }
    );

}


/* =========================================
   FRIENDS BUTTON
========================================= */

const wwcFriendsBtn =
    document.getElementById(
        "friendsBtn"
    );

if (wwcFriendsBtn) {

    wwcFriendsBtn.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            window.location.href =
                "./friends.html";

        }
    );

}


/* =========================================
   UPLOAD BUTTON
========================================= */

const wwcUploadBtn =
    document.getElementById(
        "uploadBtn"
    );

const wwcVideoUpload =
    document.getElementById(
        "videoUpload"
    );


if (
    wwcUploadBtn &&
    wwcVideoUpload
) {

    wwcUploadBtn.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            wwcVideoUpload.click();

        }
    );


    wwcVideoUpload.addEventListener(
        "change",
        e => {

            const file =
                e.target.files &&
                e.target.files[0];

            if (!file) return;


            if (
                !file.type.startsWith(
                    "video/"
                )
            ) {

                alert(
                    "Please select a video file."
                );

                wwcVideoUpload.value =
                    "";

                return;

            }


            alert(
                "Video selected: " +
                file.name
            );

            console.log(
                "WWC upload selected:",
                file.name
            );

        }
    );

}


/* =========================================
   INBOX BUTTON
========================================= */

const wwcInboxBtn =
    document.getElementById(
        "inboxBtn"
    );

if (wwcInboxBtn) {

    wwcInboxBtn.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            window.location.href =
                "./inbox.html";

        }
    );

}


/* =========================================
   PROFILE BUTTON
========================================= */

const wwcProfileBtn =
    document.getElementById(
        "profileBtn"
    );

const wwcProfileMenu =
    document.getElementById(
        "profileMenu"
    );


if (wwcProfileBtn) {

    wwcProfileBtn.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            if (!wwcProfileMenu) {

                window.location.href =
                    "./profile.html";

                return;

            }


            const opened =
                wwcProfileMenu.classList.toggle(
                    "show"
                );

            wwcProfileMenu.setAttribute(
                "aria-hidden",
                opened
                    ? "false"
                    : "true"
            );

        }
    );

}


/* =========================================
   PROFILE MENU BUTTON
========================================= */

const wwcProfileMenuBtn =
    document.getElementById(
        "profileBtnMenu"
    );

if (wwcProfileMenuBtn) {

    wwcProfileMenuBtn.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            window.location.href =
                "./profile.html";

        }
    );

}


/* =========================================
   LOGIN / REGISTER
========================================= */

const wwcLoginBtn =
    document.getElementById(
        "loginBtn"
    );

if (wwcLoginBtn) {

    wwcLoginBtn.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            window.location.href =
                "./auth.html";

        }
    );

}


/* =========================================
   LOGOUT
========================================= */

const wwcLogoutBtn =
    document.getElementById(
        "logoutBtn"
    );

if (wwcLogoutBtn) {

    wwcLogoutBtn.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            /*
             * Firebase Auth থাকলে
             * পরে signOut(auth) এখানে
             * যোগ করা হবে।
             */

            localStorage.removeItem(
                "wwc_following"
            );

            window.location.href =
                "./auth.html";

        }
    );

}


/* =========================================
   CLOSE PROFILE MENU
========================================= */

const wwcProfileMenuClose =
    document.getElementById(
        "profileMenuClose"
    );

if (wwcProfileMenuClose) {

    wwcProfileMenuClose.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            if (!wwcProfileMenu) return;

            wwcProfileMenu.classList.remove(
                "show"
            );

            wwcProfileMenu.setAttribute(
                "aria-hidden",
                "true"
            );

        }
    );

}


/* =========================================
   CLOSE PROFILE MENU OUTSIDE
========================================= */

document.addEventListener(
    "click",
    e => {

        if (
            !wwcProfileMenu ||
            !wwcProfileBtn
        ) {

            return;

        }


        if (
            wwcProfileMenu.classList.contains(
                "show"
            ) &&
            !wwcProfileMenu.contains(
                e.target
            ) &&
            !wwcProfileBtn.contains(
                e.target
            )
        ) {

            wwcProfileMenu.classList.remove(
                "show"
            );

            wwcProfileMenu.setAttribute(
                "aria-hidden",
                "true"
            );

        }

    }
);


/* =========================================
   ESCAPE KEY
========================================= */

document.addEventListener(
    "keydown",
    e => {

        if (e.key !== "Escape") return;


        closeSearch();

        closeCommentBox();


        if (wwcProfileMenu) {

            wwcProfileMenu.classList.remove(
                "show"
            );

            wwcProfileMenu.setAttribute(
                "aria-hidden",
                "true"
            );

        }

    }
);


/* =========================================
   INITIAL FEED
========================================= */

showForYouFeed();


console.log(
    "WWC-Core: New app.js system ready."
);

});
