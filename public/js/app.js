/* =========================================
   WORLD WIDE CONNECT
   CLEAN APP.JS
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("WWC-Core started successfully");

    /* =========================================
       VIDEO FEED
       ========================================= */

    const videos = Array.from(
        document.querySelectorAll(".feed-video")
    );

    let currentVideo = null;

    function pauseAllVideos(exceptVideo = null) {
        videos.forEach(function (video) {
            if (video !== exceptVideo) {
                video.pause();
            }
        });
    }

    function playVideo(video) {
        if (!video) return;

        pauseAllVideos(video);

        video.muted = true;

        const promise = video.play();

        if (promise && typeof promise.catch === "function") {
            promise.catch(function (error) {
                console.log("Autoplay blocked:", error);
            });
        }

        currentVideo = video;
    }

    /* =========================================
       AUTO PLAY WHEN VIDEO IS VISIBLE
       ========================================= */

    const videoObserver = new IntersectionObserver(
        function (entries) {

            entries.forEach(function (entry) {

                const video = entry.target;

                if (entry.isIntersecting && entry.intersectionRatio >= 0.60) {
                    playVideo(video);
                } else {
                    video.pause();
                }

            });

        },
        {
            threshold: [0.60]
        }
    );

    videos.forEach(function (video) {

        videoObserver.observe(video);

        video.playsInline = true;

        video.addEventListener("click", function (event) {

            event.stopPropagation();

            if (video.paused) {
                playVideo(video);
            } else {
                video.pause();
            }

        });

        video.addEventListener("error", function () {
            console.error("Video load error:", video.currentSrc);
        });

    });

    /* =========================================
       TOUCH SWIPE
       ========================================= */

    const feed =
        document.querySelector("#feed") ||
        document.querySelector(".feed") ||
        document.querySelector(".video-feed") ||
        document.body;

    let touchStartY = 0;
    let touchEndY = 0;

    document.addEventListener(
        "touchstart",
        function (event) {

            if (!event.touches || !event.touches.length) return;

            touchStartY = event.touches[0].clientY;

        },
        { passive: true }
    );

    document.addEventListener(
        "touchend",
        function (event) {

            if (!event.changedTouches || !event.changedTouches.length) return;

            touchEndY = event.changedTouches[0].clientY;

            const distance = touchStartY - touchEndY;

            /* Swipe UP */
            if (distance > 70) {
                goToNextVideo();
            }

            /* Swipe DOWN */
            if (distance < -70) {
                goToPreviousVideo();
            }

        },
        { passive: true }
    );

    function getVideoItems() {
        return Array.from(
            document.querySelectorAll(".video-item")
        );
    }

    function getCurrentVideoIndex() {

        const items = getVideoItems();

        if (!items.length || !currentVideo) {
            return 0;
        }

        const currentItem = currentVideo.closest(".video-item");

        const index = items.indexOf(currentItem);

        return index >= 0 ? index : 0;
    }

    function scrollToVideo(index) {

        const items = getVideoItems();

        if (!items.length) return;

        if (index < 0) index = 0;

        if (index >= items.length) {
            index = items.length - 1;
        }

        const item = items[index];

        item.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        const video = item.querySelector(".feed-video");

        if (video) {
            setTimeout(function () {
                playVideo(video);
            }, 250);
        }
    }

    function goToNextVideo() {

        const index = getCurrentVideoIndex();

        scrollToVideo(index + 1);
    }

    function goToPreviousVideo() {

        const index = getCurrentVideoIndex();

        scrollToVideo(index - 1);
    }

    /* =========================================
       KEYBOARD / DESKTOP SCROLL
       ========================================= */

    document.addEventListener("keydown", function (event) {

        if (event.key === "ArrowDown") {
            event.preventDefault();
            goToNextVideo();
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            goToPreviousVideo();
        }

    });

    /* =========================================
       LIKE
       ========================================= */

    const likeButtons =
        document.querySelectorAll(".like-btn");

    likeButtons.forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            const countElement =
                button.querySelector(".like-count");

            if (!countElement) return;

            let count =
                parseInt(countElement.textContent, 10) || 0;

            if (button.classList.contains("liked")) {

                count--;

                if (count < 0) count = 0;

                button.classList.remove("liked");

            } else {

                count++;

                button.classList.add("liked");
            }

            countElement.textContent = count;

        });

    });

    /* =========================================
       FOLLOW
       ========================================= */

    const followButtons =
        document.querySelectorAll(".follow-btn");

    followButtons.forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            if (button.classList.contains("following")) {

                button.classList.remove("following");

                button.textContent = "Follow";

            } else {

                button.classList.add("following");

                button.textContent = "Following ✓";
            }

        });

    });

    /* =========================================
       PROFILE CLICK
       ========================================= */

    const profileButtons =
        document.querySelectorAll(
            ".profile-photo, .profile-name, .username"
        );

    profileButtons.forEach(function (element) {

        element.style.cursor = "pointer";

        element.addEventListener("click", function (event) {

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

            alert("Profile: " + username);

        });

    });

    /* =========================================
       SHARE
       ========================================= */

    const shareButtons =
        document.querySelectorAll(".share-btn");

    shareButtons.forEach(function (button) {

        button.addEventListener("click", async function (event) {

            event.preventDefault();
            event.stopPropagation();

            const shareData = {
                title: "World Wide Connect",
                text: "Check this video on World Wide Connect",
                url: window.location.href
            };

            try {

                if (
                    navigator.share &&
                    typeof navigator.share === "function"
                ) {

                    await navigator.share(shareData);

                } else if (navigator.clipboard) {

                    await navigator.clipboard.writeText(
                        window.location.href
                    );

                    alert("Video link copied!");

                } else {

                    alert("Share is not available on this browser.");

                }

            } catch (error) {

                console.log("Share cancelled.");

            }

        });

    });

    /* =========================================
       COMMENT
       ========================================= */

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

    commentButtons.forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            if (!commentBox) return;

            commentBox.classList.add("show");

            if (commentInput) {
                commentInput.focus();
            }

        });

    });

    if (commentCancel) {

        commentCancel.addEventListener("click", function () {

            if (commentBox) {
                commentBox.classList.remove("show");
            }

            if (commentInput) {
                commentInput.value = "";
            }

        });

    }

    if (commentSend) {

        commentSend.addEventListener("click", function () {

            if (!commentInput) return;

            const text =
                commentInput.value.trim();

            if (!text) {

                alert("Please write a comment.");

                return;
            }

            alert("Comment added: " + text);

            commentInput.value = "";

            if (commentBox) {
                commentBox.classList.remove("show");
            }

        });

    }

    /* =========================================
       LOGIN / REGISTER
       ========================================= */

    const loginBtn =
        document.getElementById("loginBtn");

    if (loginBtn) {

        loginBtn.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            window.location.href = "./login.html";

        });

    }

    /* =========================================
       LOGOUT
       ========================================= */

    const logoutBtn =
        document.getElementById("logoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            const confirmLogout =
                confirm("Do you want to logout?");

            if (!confirmLogout) return;

            localStorage.removeItem("wwc_user");

            alert("Logged out.");

        });

    }

    /* =========================================
       UPLOAD VIDEO
       ========================================= */

    const uploadBtn =
        document.getElementById("uploadBtn");

    if (uploadBtn) {

        uploadBtn.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            window.location.href = "./upload.html";

        });

    }

    /* =========================================
       INITIAL VIDEO
       ========================================= */

    if (videos.length > 0) {

        videos.forEach(function (video) {
            video.pause();
            video.muted = true;
        });

        setTimeout(function () {

            const firstVideo = videos[0];

            if (firstVideo) {
                playVideo(firstVideo);
            }

        }, 300);

    }

    /* =========================================
       DEBUG
       ========================================= */

    console.log("Videos:", videos.length);
    console.log("Likes:", likeButtons.length);
    console.log("Comments:", commentButtons.length);
    console.log("Follows:", followButtons.length);
    console.log("Shares:", shareButtons.length);

});
