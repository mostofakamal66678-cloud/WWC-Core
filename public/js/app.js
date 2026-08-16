/*
========================================
WORLD WIDE CONNECT
APP.JS
========================================
*/

document.addEventListener("DOMContentLoaded", function () {

    console.log("WWC-Core started successfully");

    /* ========================================
       VIDEO FEED
    ======================================== */

    const videos = Array.from(
        document.querySelectorAll(".feed-video")
    );

    let currentVideo = null;


    /* ========================================
       PAUSE ALL VIDEOS
    ======================================== */

    function pauseAllVideos(exceptVideo = null) {

        videos.forEach(function (video) {

            if (video !== exceptVideo) {
                video.pause();
            }

        });

    }


    /* ========================================
       PLAY VIDEO
    ======================================== */

    function playVideo(video, withSound = false) {

        if (!video) return;

        pauseAllVideos(video);

        currentVideo = video;

        video.playsInline = true;

        video.muted = !withSound;

        const promise = video.play();

        if (promise && typeof promise.catch === "function") {

            promise.catch(function (error) {

                console.log(
                    "Video play blocked:",
                    error
                );

            });

        }

    }


    /* ========================================
       VIDEO CLICK
    ======================================== */

    videos.forEach(function (video) {

        video.playsInline = true;

        video.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                if (video.paused) {

                    playVideo(video, true);

                } else {

                    video.pause();

                }

            }
        );


        /* ====================================
           DOUBLE TAP LIKE
        ==================================== */

        video.addEventListener(
            "dblclick",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                const videoItem =
                    video.closest(".video-item");

                if (!videoItem) return;

                const likeButton =
                    videoItem.querySelector(".like-btn");

                if (likeButton) {

                    likeButton.click();

                }

            }
        );


        /* ====================================
           VIDEO ENDED
        ==================================== */

        video.addEventListener(
            "ended",
            function () {

                const index =
                    getCurrentVideoIndex();

                if (index < videos.length - 1) {

                    scrollToVideo(index + 1);

                } else {

                    scrollToVideo(0);

                }

            }
        );


        /* ====================================
           VIDEO ERROR
        ==================================== */

        video.addEventListener(
            "error",
            function () {

                console.log(
                    "Video load error:",
                    video.currentSrc
                );

            }
        );

    });


    /* ========================================
       AUTO PLAY WHEN VIDEO IS VISIBLE
    ======================================== */

    const videoObserver =
        new IntersectionObserver(

            function (entries) {

                entries.forEach(function (entry) {

                    const video = entry.target;

                    if (
                        entry.isIntersecting &&
                        entry.intersectionRatio >= 0.60
                    ) {

                        playVideo(video);

                    } else {

                        video.pause();

                    }

                });

            },

            {
                threshold: [0.50, 0.60]
            }

        );


    videos.forEach(function (video) {

        videoObserver.observe(video);

    });


    /* ========================================
       GET VIDEO ITEMS
    ======================================== */

    function getVideoItems() {

        return Array.from(
            document.querySelectorAll(".video-item")
        );

    }


    /* ========================================
       GET CURRENT VIDEO INDEX
    ======================================== */

    function getCurrentVideoIndex() {

        const items = getVideoItems();

        if (!items.length) return 0;

        if (!currentVideo) return 0;

        const currentItem =
            currentVideo.closest(".video-item");

        if (!currentItem) return 0;

        const index =
            items.indexOf(currentItem);

        return index >= 0 ? index : 0;

    }


    /* ========================================
       SCROLL TO VIDEO
    ======================================== */

    function scrollToVideo(index) {

        const items = getVideoItems();

        if (!items.length) return;

        if (index < 0) {
            index = 0;
        }

        if (index >= items.length) {
            index = items.length - 1;
        }

        const item = items[index];

        item.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        const video =
            item.querySelector(".feed-video");

        if (video) {

            setTimeout(function () {

                playVideo(video);

            }, 500);

        }

    }


    /* ========================================
       NEXT VIDEO
    ======================================== */

    function goToNextVideo() {

        const index =
            getCurrentVideoIndex();

        if (index < videos.length - 1) {

            scrollToVideo(index + 1);

        }

    }


    /* ========================================
       PREVIOUS VIDEO
    ======================================== */

    function goToPreviousVideo() {

        const index =
            getCurrentVideoIndex();

        if (index > 0) {

            scrollToVideo(index - 1);

        }

    }


    /* ========================================
       TOUCH SWIPE
    ======================================== */

    let touchStartY = 0;
    let touchEndY = 0;

    document.addEventListener(
        "touchstart",
        function (event) {

            if (
                !event.touches ||
                !event.touches.length
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
        function (event) {

            if (
                !event.changedTouches ||
                !event.changedTouches.length
            ) {
                return;
            }

            touchEndY =
                event.changedTouches[0].clientY;

            const distance =
                touchStartY - touchEndY;


            /* SWIPE UP */

            if (distance > 70) {

                goToNextVideo();

            }


            /* SWIPE DOWN */

            if (distance < -70) {

                goToPreviousVideo();

            }

        },
        {
            passive: true
        }
    );


    /* ========================================
       DESKTOP KEYBOARD
    ======================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "ArrowDown") {

                event.preventDefault();

                goToNextVideo();

            }

            if (event.key === "ArrowUp") {

                event.preventDefault();

                goToPreviousVideo();

            }

        }
    );


    /* ========================================
       LIKE
    ======================================== */

    const likeButtons =
        document.querySelectorAll(".like-btn");


    likeButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                const videoItem =
                    button.closest(".video-item");

                if (!videoItem) return;

                const countElement =
                    videoItem.querySelector(".like-count");

                if (!countElement) return;

                let count =
                    parseInt(
                        countElement.textContent,
                        10
                    ) || 0;


                if (
                    button.classList.contains("liked")
                ) {

                    count--;

                    if (count < 0) {
                        count = 0;
                    }

                    button.classList.remove(
                        "liked"
                    );

                } else {

                    count++;

                    button.classList.add(
                        "liked"
                    );

                }

                countElement.textContent =
                    count;

            }
        );

    });


    /* ========================================
       FOLLOW
    ======================================== */

    const followButtons =
        document.querySelectorAll(".follow-btn");


    followButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                if (
                    button.classList.contains(
                        "following"
                    )
                ) {

                    button.classList.remove(
                        "following"
                    );

                    button.textContent =
                        "Follow";

                } else {

                    button.classList.add(
                        "following"
                    );

                    button.textContent =
                        "Following";

                }

            }
        );

    });


    /* ========================================
       PROFILE CLICK
    ======================================== */

    const profileButtons =
        document.querySelectorAll(
            ".profile-photo, .profile-name, .username"
        );


    profileButtons.forEach(function (element) {

        element.style.cursor = "pointer";

        element.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                const profile =
                    element.closest(".video-item");

                if (!profile) return;

                const usernameElement =
                    profile.querySelector(
                        ".profile-name, .username"
                    );

                const username =
                    usernameElement
                        ? usernameElement.textContent.trim()
                        : "WWC User";

                alert(
                    "Profile: " + username
                );

            }
        );

    });


    /* ========================================
       SHARE
    ======================================== */

    const shareButtons =
        document.querySelectorAll(".share-btn");


    shareButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();
                event.stopPropagation();

                const shareData = {

                    title:
                        "World Wide Connect",

                    text:
                        "Check this video on World Wide Connect",

                    url:
                        window.location.href

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
                        typeof navigator.clipboard
                            .writeText ===
                            "function"
                    ) {

                        await navigator.clipboard
                            .writeText(
                                window.location.href
                            );

                        alert(
                            "Video link copied!"
                        );

                    } else {

                        prompt(
                            "Copy this video link:",
                            window.location.href
                        );

                    }

                } catch (error) {

                    console.log(
                        "Share cancelled or failed:",
                        error
                    );

                }

            }
        );

    });


    /* ========================================
       COMMENT
    ======================================== */

    const commentButtons =
        document.querySelectorAll(".comment-btn");

    const commentBox =
        document.getElementById("commentBox");

    const commentInput =
        document.getElementById("commentInput");

    const commentCancel =
        document.getElementById("commentCancel");

    const commentSend =
        document.getElementById("commentSend");

    let activeCommentVideo = null;


    commentButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                activeCommentVideo =
                    button.closest(".video-item");

                if (!commentBox) return;

                commentBox.classList.add(
                    "show"
                );

                if (commentInput) {

                    commentInput.value = "";

                    setTimeout(function () {

                        commentInput.focus();

                    }, 100);

                }

            }
        );

    });


    /* ========================================
       COMMENT CANCEL
    ======================================== */

    if (commentCancel) {

        commentCancel.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                if (commentBox) {

                    commentBox.classList.remove(
                        "show"
                    );

                }

                if (commentInput) {

                    commentInput.value = "";

                }

            }
        );

    }


    /* ========================================
       COMMENT SEND
    ======================================== */

    if (commentSend) {

        commentSend.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                if (!commentInput) return;

                const text =
                    commentInput.value.trim();


                if (!text) {

                    alert(
                        "Please write a comment."
                    );

                    return;

                }


                if (activeCommentVideo) {

                    let commentList =
                        activeCommentVideo.querySelector(
                            ".comment-list"
                        );


                    if (!commentList) {

                        commentList =
                            document.createElement(
                                "div"
                            );

                        commentList.className =
                            "comment-list";

                        activeCommentVideo.appendChild(
                            commentList
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

                    commentList.appendChild(
                        comment
                    );

                }


                commentInput.value = "";


                if (commentBox) {

                    commentBox.classList.remove(
                        "show"
                    );

                }

            }
        );

    }


    /* ========================================
       PROFILE MENU - PROFILE BUTTON
    ======================================== */

    const profileBtnMenu =
        document.getElementById(
            "profileBtnMenu"
        );


    if (profileBtnMenu) {

        profileBtnMenu.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                window.location.href =
                    "./profile.html";

            }
        );

    }


    /* ========================================
       LOGIN / REGISTER
    ======================================== */

    const loginBtn =
        document.getElementById(
            "loginBtn"
        );


    if (loginBtn) {

        loginBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                window.location.href =
                    "./auth.html";

            }
        );

    }


    /* ========================================
       REGISTER BUTTON
    ======================================== */

    const registerBtn =
        document.getElementById(
            "registerBtn"
        );


    if (registerBtn) {

        registerBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                window.location.href =
                    "./auth.html";

            }
        );

    }


    /* ========================================
       LOGOUT
    ======================================== */

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                const confirmLogout =
                    confirm(
                        "Do you want to logout?"
                    );


                if (!confirmLogout) {
                    return;
                }


                localStorage.removeItem(
                    "wwc_user"
                );

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


    /* ========================================
       UPLOAD VIDEO
    ======================================== */

    const uploadBtn =
        
