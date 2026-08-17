/*
========================================
WORLD WIDE CONNECT
APP.JS
========================================
*/

document.addEventListener("DOMContentLoaded", () => {

    console.log("WWC-Core started successfully");

    /* ========================================
       HELPERS
    ======================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));

    const getVideoItem = (element) =>
        element ? element.closest(".video-item") : null;


    /* ========================================
       VIDEO FEED
    ======================================== */

    let currentVideo = null;

    function getVideos() {
        return $$(".feed-video");
    }

    function getVideoItems() {
        return $$(".video-item");
    }

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
        video.setAttribute("playsinline", "");

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


    /* ========================================
       VIDEO CLICK
    ======================================== */

    document.addEventListener("click", event => {

        const video =
            event.target.closest(".feed-video");

        if (!video) return;

        event.preventDefault();
        event.stopPropagation();

        if (video.paused) {

            playVideo(video, true);

        } else {

            video.pause();

        }

    });


    /* ========================================
       DOUBLE TAP LIKE
    ======================================== */

    document.addEventListener("dblclick", event => {

        const video =
            event.target.closest(".feed-video");

        if (!video) return;

        event.preventDefault();
        event.stopPropagation();

        const item =
            getVideoItem(video);

        const likeButton =
            item
                ? $(".like-btn", item)
                : null;

        if (likeButton) {
            likeButton.click();
        }

    });


    /* ========================================
       AUTO PLAY / OBSERVER
    ======================================== */

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

    } else {

        const firstVideo =
            getVideos()[0];

        if (firstVideo) {
            playVideo(firstVideo, false);
        }

    }


    /* ========================================
       VIDEO ENDED
    ======================================== */

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

            const items =
                getVideoItems();

            const item =
                getVideoItem(video);

            const index =
                items.indexOf(item);

            if (
                index >= 0 &&
                index < items.length - 1
            ) {

                scrollToVideo(index + 1);

            } else if (items.length > 0) {

                scrollToVideo(0);

            }

        },
        true
    );


    /* ========================================
       SCROLL TO VIDEO
    ======================================== */

    function scrollToVideo(index) {

        const items =
            getVideoItems();

        if (!items.length) return;

        index =
            Math.max(
                0,
                Math.min(
                    index,
                    items.length - 1
                )
            );

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


    function getCurrentVideoIndex() {

        const items =
            getVideoItems();

        if (!currentVideo) {
            return 0;
        }

        const item =
            getVideoItem(currentVideo);

        const index =
            items.indexOf(item);

        return index >= 0
            ? index
            : 0;

    }


    function nextVideo() {

        const index =
            getCurrentVideoIndex();

        if (
            index <
            getVideoItems().length - 1
        ) {

            scrollToVideo(
                index + 1
            );

        }

    }


    function previousVideo() {

        const index =
            getCurrentVideoIndex();

        if (index > 0) {

            scrollToVideo(
                index - 1
            );

        }

    }


    /* ========================================
       TOUCH SWIPE
    ======================================== */

    let touchStartY = 0;
    let touchStartX = 0;

    document.addEventListener(
        "touchstart",
        event => {

            const target =
                event.target;

            if (
                target.closest("button") ||
                target.closest("input") ||
                target.closest("textarea") ||
                target.closest(".comment-box")
            ) {
                return;
            }

            if (!event.touches.length) {
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

            const endY =
                touch.clientY;

            const endX =
                touch.clientX;

            const distanceY =
                touchStartY - endY;

            const distanceX =
                touchStartX - endX;

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

            if (distanceY > 70) {

                nextVideo();

            } else if (distanceY < -70) {

                previousVideo();

            }

        },
        {
            passive: true
        }
    );


    /* ========================================
       KEYBOARD
    ======================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "ArrowDown"
            ) {

                event.preventDefault();
                nextVideo();

            }

            if (
                event.key === "ArrowUp"
            ) {

                event.preventDefault();
                previousVideo();

            }

        }
    );


    /* ========================================
       LIKE
    ======================================== */

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
                getVideoItem(button);

            if (!item) return;

            const countElement =
                $(".like-count", item);

            let count =
                countElement
                    ? parseInt(
                        countElement.textContent,
                        10
                    ) || 0
                    : 0;

            const liked =
                button.classList.contains(
                    "liked"
                );

            if (liked) {

                count =
                    Math.max(
                        0,
                        count - 1
                    );

                button.classList.remove(
                    "liked"
                );

                button.setAttribute(
                    "aria-pressed",
                    "false"
                );

            } else {

                count++;

                button.classList.add(
                    "liked"
                );

                button.setAttribute(
                    "aria-pressed",
                    "true"
                );

            }

            if (countElement) {

                countElement.textContent =
                    count;

            }

        }
    );


    /* ========================================
       FOLLOW
    ======================================== */

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

            const following =
                button.classList.toggle(
                    "following"
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
    );


    /* ========================================
       SAVE
    ======================================== */

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
                getVideoItem(button);

            const saved =
                button.classList.toggle(
                    "saved"
                );

            button.setAttribute(
                "aria-pressed",
                saved
                    ? "true"
                    : "false"
            );

            const countElement =
                item
                    ? $(".save-count", item)
                    : null;

            if (countElement) {

                let count =
                    parseInt(
                        countElement.textContent,
                        10
                    ) || 0;

                count =
                    saved
                        ? count + 1
                        : Math.max(
                            0,
                            count - 1
                        );

                countElement.textContent =
                    count;

            }

        }
    );


    /* ========================================
       SHARE
    ======================================== */

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
                getVideoItem(button);

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
                    "Check this video on World Wide Connect",

                url:
                    shareUrl

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

                } else if (
                    navigator.clipboard &&
                    navigator.clipboard.writeText
                ) {

                    await navigator.clipboard
                        .writeText(
                            shareUrl
                        );

                    alert(
                        "Video link copied!"
                    );

                } else {

                    window.prompt(
                        "Copy this video link:",
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


    /* ========================================
       COMMENTS
    ======================================== */

    let activeCommentVideo = null;

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".comment-btn"
                );

            if (!button) return;

            event.preventDefault();
            event.stopPropagation();

            activeCommentVideo =
                getVideoItem(button);

            const commentBox =
                $("#commentBox");

            const commentInput =
                $("#commentInput");

            if (!commentBox) {

                alert(
                    "Comment box not found."
                );

                return;
            }

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
    );


    /* ========================================
       COMMENT CANCEL
    ======================================== */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "#commentCancel"
                );

            if (!button) return;

            event.preventDefault();
            event.stopPropagation();

            closeCommentBox();

        }
    );


    function closeCommentBox() {

        const box =
            $("#commentBox");

        const input =
            $("#commentInput");

        if (box) {

            box.classList.remove(
                "show"
            );

        }

        if (input) {

            input.value = "";

        }

        activeCommentVideo = null;

    }


    /* ========================================
       COMMENT SEND
    ======================================== */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "#commentSend"
                );

            if (!button) return;

            event.preventDefault();
            event.stopPropagation();

            const input =
                $("#commentInput");

            if (!input) return;

            const text =
                input.value.trim();

            if (!text) {

                alert(
                    "Please write a comment."
                );

                return;

            }

            if (activeCommentVideo) {

                let list =
                    $(".comment-list",
                        activeCommentVideo);

                if (!list) {

                    list =
                        document.createElement(
                            "div"
                        );

                    list.className =
                        "comment-list";

                    activeCommentVideo.appendChild(
                        list
                    );

                }

                const comment =
                    document.createElement(
                        "div"
                    );

                comment.className =
                    "comment-item";

                comment.textContent =
                    text;

                list.appendChild(
                    comment
                );

            }

            closeCommentBox();

        }
    );


    /* ========================================
       PROFILE PHOTO / USERNAME
    ======================================== */

    document.addEventListener(
        "click",
        event => {

            const element =
                event.target.closest(
                    ".profile-photo, .profile-name, .username"
                );

            if (!element) return;

            event.preventDefault();
            event.stopPropagation();

            window.location.href =
                "./profile.html";

        }
    );


    /* ========================================
       PROFILE MENU
    ======================================== */

    const profileBtn =
        $("#profileBtn");

    const profileMenu =
        $("#profileMenu");

    const profileClose =
        $("#profileMenuClose");

    const profileBtnMenu =
        $("#profileBtnMenu");


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


    if (
        profileBtn &&
        profileMenu
    ) {

        profileBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

   
