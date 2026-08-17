/*
====================================================
WORLD WIDE CONNECT
CLEAN APP.JS
Home + Video Feed
Like + Comment + Save + Share + Follow
Search + Profile + Upload
====================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    console.log("WWC-Core: app.js started");


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
       STATE
    ================================================= */

    let currentVideo = null;
    let activeCommentItem = null;


    let followedUsers = JSON.parse(
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

        video.muted = !sound;
        video.playsInline = true;

        video.setAttribute(
            "playsinline",
            ""
        );

        const promise = video.play();

        if (promise && promise.catch) {

            promise.catch(() => {

                /*
                 * Browser autoplay restriction.
                 * Video remains available for manual play.
                 */

            });

        }

    }


    /* =================================================
       VIDEO INTERSECTION
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
       NEXT / PREVIOUS VIDEO
    ================================================= */

    function getCurrentIndex() {

        if (!currentVideo) {
            return 0;
        }

        const item =
            getItem(currentVideo);

        if (!item) {
            return 0;
        }

        const index =
            getItems().indexOf(item);

        return index >= 0 ? index : 0;

    }


    function scrollToVideo(index) {

        const items =
            getItems();

        if (!items.length) return;

        if (index < 0) {
            index = 0;
        }

        if (index >= items.length) {
            index = items.length - 1;
        }

        const item =
            items[index];

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


    function nextVideo() {

        const items =
            getItems();

        if (!items.length) return;

        const index =
            getCurrentIndex();

        if (index < items.length - 1) {

            scrollToVideo(
                index + 1
            );

        } else {

            scrollToVideo(0);

        }

    }


    function previousVideo() {

        const index =
            getCurrentIndex();

        if (index > 0) {

            scrollToVideo(
                index - 1
            );

        }

    }


    /* =================================================
       VIDEO END
    ================================================= */

    getVideos().forEach(video => {

        video.addEventListener(
            "ended",
            () => {

                nextVideo();

            }
        );

    });


    /* =================================================
       TOUCH SWIPE
    ================================================= */

    let touchStartY = 0;


    document.addEventListener(
        "touchstart",
        event => {

            if (!event.touches.length) return;

            if (
                event.target.closest("button") ||
                event.target.closest("textarea") ||
                event.target.closest("input") ||
                event.target.closest(".comment-box")
            ) {

                return;

            }

            touchStartY =
                event.touches[0].clientY;

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

            const endY =
                event.changedTouches[0].clientY;

            const distance =
                touchStartY - endY;


            if (Math.abs(distance) < 70) {
                return;
            }


            if (distance > 0) {

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
                event.target.tagName === "TEXTAREA" ||
                event.target.tagName === "INPUT"
            ) {

                return;

            }


            if (event.key === "ArrowDown") {

                event.preventDefault();

                nextVideo();

            }


            if (event.key === "ArrowUp") {

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
                event.target.closest(".like-btn");

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
                button.classList.contains("liked");


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
                event.target.closest(".feed-video");

            if (!video) return;


            const item =
                getItem(video);

            if (!item) return;


            const button =
                $(".like-btn", item);


            if (
                button &&
                !button.classList.contains("liked")
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
                event.target.closest(".follow-btn");

            if (!button) return;


            event.preventDefault();
            event.stopPropagation();


            const item =
                getItem(button);

            if (!item) return;


            const usernameElement =
                $(".profile-area .username", item);


            const username =
                usernameElement
                    ? usernameElement.textContent.trim()
                    : "";


            if (!username) return;


            const index =
                followedUsers.indexOf(username);


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
       RESTORE FOLLOW
    ================================================= */

    function restoreFollowState() {

        getItems().forEach(item => {

            const button =
                $(".follow-btn", item);

            const usernameElement =
                $(".profile-area .username", item);


            if (
                !button ||
                !usernameElement
            ) {

                return;

            }


            const username =
                usernameElement.textContent.trim();


            if (
                followedUsers.includes(username)
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
                event.target.closest(".save-btn");

            if (!button) return;


            event.preventDefault();
            event.stopPropagation();


            const item =
                getItem(button);

            if (!item) return;


            const videoId =
                item.dataset.videoId;


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
                button.classList.contains("saved");


            if (saved) {

                button.classList.remove(
                    "saved"
                );

                button.setAttribute(
                    "aria-pressed",
                    "false"
                );


                const index =
                    savedVideos.indexOf(videoId);


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
                    !savedVideos.includes(videoId)
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
       RESTORE SAVE
    ================================================= */

    function restoreSavedState() {

        getItems().forEach(item => {

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
                savedVideos.includes(videoId)
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
                event.target.closest(".share-btn");

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
                    navigator.clipboard
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

    const commentBox =
        $("#commentBox");

    const commentInput =
        $("#commentInput");

    const commentSend =
        $("#commentSend");

    const commentCancel =
        $("#commentCancel");


    function openCommentBox(item) {

        if (!commentBox || !item) {
            return;
        }


        activeCommentItem =
            item;


        commentBox.classList.add(
            "show"
        );


        if (commentInput) {

            commentInput.value = "";

            setTimeout(() => {

                commentInput.focus();

            }, 100);

        }

    }


    function closeCommentBox() {

        if (!commentBox) return;

        commentBox.classList.remove(
            "show"
        );

        activeCommentItem =
            null;

    }


    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(".comment-btn");

            if (!button) return;


            event.preventDefault();
            event.stopPropagation();


            const item =
                getItem(button);

            openCommentBox(item);

        }
    );


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


                if (
                    !activeCommentItem ||
                    !commentInput
                ) {

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
                    activeCommentItem.dataset.videoId;


                const key =
                    "wwc_comments_" +
                    videoId;


                let comments =
                    JSON.parse(
                        localStorage.getItem(key) ||
                        "[]"
                    );


                comments.push({

                    text: text,

                    time:
                        new Date().toISOString()

                });


                localStorage.setItem(
                    key,
                    JSON.stringify(comments)
                );


                alert(
                    "Comment added!"
                );


                closeCommentBox();

            }
        );

    }


    /* =================================================
       SEARCH
    ================================================= */

    const searchBtn =
        $("#searchBtn");


    let searchBox = null;


    function openSearch() {

        if (searchBox) return;


        searchBox =
            document.createElement("div");


        searchBox.id =
            "wwcSearchBox";


        searchBox.style.position =
            "fixed";

        searchBox.style.top =
            "65px";

        searchBox.style.left =
            "10px";

        searchBox.style.right =
            "10px";

        searchBox.style.zIndex =
            "5000";

        searchBox.style.padding =
            "12px";

        searchBox.style.background =
            "rgba(20,20,20,.98)";

        searchBox.style.borderRadius =
            "14px";


        searchBox.innerHTML = `

            <input
                id="wwcSearchInput"
                type="search"
                placeholder="Search videos or users..."
                style="
                    width:100%;
                    height:45px;
                    border:none;
                    outline:none;
                    border-radius:10px;
                    padding:0 14px;
                    font-size:15px;
                "
            >

        `;


        document.body.appendChild(
            searchBox
        );


        const input =
            $("#wwcSearchInput");


        if (input) {

            input.focus();


            input.addEventListener(
                "input",
                () => {

                    const query =
                        input.value
                            .trim()
                            .toLowerCase();


                    getItems().forEach(item => {

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
                            !query ||
                            username.includes(query) ||
                            caption.includes(query);


                        item.style.display =
                            match
                                ? "block"
                                : "none";

                    });

                }
            );

        }

    }


    function closeSearch() {

        if (!searchBox) return;


        getItems().forEach(item => {

            item.style.display =
                "block";

        });


        searchBox.remove();


        searchBox =
            null;

    }


    if (searchBtn) {

        searchBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                if (searchBox) {

                    closeSearch();

                } else {

                    openSearch();

                }

            }
        );

    }


    /* =================================================
       TOP TABS
    ================================================= */

    $$(".wwc-top-tab").forEach(tab => {

        tab.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                $$(".wwc-top-tab").forEach(
                    other => {

                        other.classList.remove(
                            "active"
                        );

                    }
                );


                tab.classList.add(
                    "active"
                );

            }
        );

    });


    /* =================================================
       HOME BUTTON
    ================================================= */

    const homeBtn =
        $("#homeBtn");


    if (homeBtn) {

        homeBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                getItems().forEach(item => {

                    item.style.display =
                        "block";

                });


                scrollToVideo(0);

            }
        );

    }


    /* =================================================
       FRIENDS BUTTON
    ================================================= */

    const friendsBtn =
        $("#friendsBtn");


    if (friendsBtn) {

        friendsBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                alert(
                    "Friends feature coming soon."
                );

            }
        );

    }


    /* =================================================
       INBOX BUTTON
    ================================================= */

    const inboxBtn =
        $("#inboxBtn");


    if (inboxBtn) {

        inboxBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                alert(
                    "Inbox feature coming soon."
                );

            }
        );

    }


    /* =================================================
       UPLOAD BUTTON
    ================================================= */

    const uploadBtn =
        $("#uploadBtn");


    const videoUpload =
        $("#videoUpload");


    if (uploadBtn && videoUpload) {

        uploadBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                videoUpload.click();

            }
        );


        videoUpload.addEventListener(
            "change",
            event => {

                const file =
                    event.target.files[0];


                if (!file) return;


                if (
                    !file.type.startsWith("video/")
                ) {

                    alert(
                        "Please select a video file."
                    );

                    return;

                }


                const url =
                    URL.createObjectURL(file);


                const item =
                    document.createElement("section");


                const id =
                    "upload_" +
                    Date.now();


                item.className =
                    "video-item";


                item.dataset.videoId =
                    id;


                item.innerHTML = `

                    <video
                        class="feed-video"
                        autoplay
                        muted
                        playsinline
                        preload="metadata"
                    >
                        <source
                            src="${url}"
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
                            ${file.name}
                        </div>

                    </div>

                `;


                const feed =
                    $("#video-feed");


                if (!feed) return;


                feed.appendChild(item);


                const video =
                    $(".feed-video", item);


                if (video) {

                    video.addEventListener(
                        "ended",
                        () => {

                            nextVideo();

                        }
                    );


                    playVideo(
                        video,
                        false
                    );

                }


                alert(
                    "Video added to the feed."
                );

            }
        );

    }


    /* =================================================
       PROFILE MENU
    ================================================= */

    const profileBtn =
        $("#profileBtn");


    const profileMenu =
        $("#profileMenu");


    const profileMenuClose =
        $("#profileMenuClose");


    function openProfileMenu() {

        if (!profileMenu) return;


        profileMenu.classList.add(
            "show"
        );


        profileMenu.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    function closeProfileMenu() {

        if (!profileMenu) return;


        profileMenu.classList.remove(
            "show"
        );


        profileMenu.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    if (profileBtn) {

        profileBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                if (
                    profileMenu &&
                    profileMenu.classList.contains("show")
                ) {

                    closeProfileMenu();

                } else {

                    openProfileMenu();

                }

            }
        );

    }


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


    /* =================================================
       PROFILE MENU → PROFILE
    ================================================= */

    const profileBtnMenu =
        $("#profileBtnMenu");


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


    /* =================================================
       LOGIN / REGISTER
    ================================================= */

    const loginBtn =
        $("#loginBtn");


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


    /* =================================================
       LOGOUT
    ================================================= */

    const logoutBtn =
        $("#logoutBtn");


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                localStorage.removeItem(
                    "wwc_logged_in"
                );


                alert(
                    "Logged out."
                );


                window.location.href =
                    "./auth.html";

            }
        );

    }


    /* =================================================
       CLOSE PROFILE MENU OUTSIDE
    ================================================= */

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


    /* =================================================
       ESCAPE KEY
    ================================================= */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {
                return;
            }


            closeSearch();

            closeCommentBox();

            closeProfileMenu();

        }
    );


    /* =================================================
       INITIAL VIDEO
    ================================================= */

    const firstVideo =
        $(".feed-video");


    if (firstVideo) {

        setTimeout(() => {

            playVideo(
                firstVideo,
                false
            );

        }, 300);

    }


    /* =================================================
       APP READY
    ================================================= */

    console.log(
        "WWC-Core: all controls initialized successfully."
    );

});
