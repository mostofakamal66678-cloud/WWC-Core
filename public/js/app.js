/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   APP.JS - PART 1
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";


    /* =====================================================
       BASIC HELPERS
    ===================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));


    const videoFeed = $("#video-feed");


    /* =====================================================
       STORAGE
    ===================================================== */

    function getStorage(key, fallback) {

        try {

            const value =
                localStorage.getItem(key);

            if (value === null) {
                return fallback;
            }

            return JSON.parse(value);

        } catch (error) {

            console.error(
                "Storage read error:",
                error
            );

            return fallback;
        }

    }


    function setStorage(key, value) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

        } catch (error) {

            console.error(
                "Storage save error:",
                error
            );

        }

    }


    /* =====================================================
       VIDEO ID
    ===================================================== */

    function getVideoId(item) {

        if (!item) {
            return "unknown-video";
        }

        if (!item.dataset.videoId) {

            item.dataset.videoId =
                "video-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 8);

        }

        return item.dataset.videoId;

    }


    /* =====================================================
       ALGORITHM DATA
    ===================================================== */

    function getAlgorithmData(videoId) {

        const data =
            getStorage(
                "wwc_algorithm_data",
                {}
            );


        if (!data[videoId]) {

            data[videoId] = {

                views: 0,

                completed: 0,

                likes: 0,

                comments: 0,

                shares: 0,

                watchTime: 0,

                lastWatched: 0

            };

        }


        return data;

    }


    function saveAlgorithmData(data) {

        setStorage(
            "wwc_algorithm_data",
            data
        );

    }


    /* =====================================================
       VIDEO VIEW
    ===================================================== */

    function registerVideoView(video) {

        if (!video) return;


        const item =
            video.closest(".video-item");

        if (!item) return;


        const videoId =
            getVideoId(item);


        const data =
            getAlgorithmData(videoId);


        data[videoId].views += 1;

        data[videoId].lastWatched =
            Date.now();


        saveAlgorithmData(data);

    }


    /* =====================================================
       WATCH TIME
    ===================================================== */

    const watchTimers =
        new Map();


    function startWatchTimer(video) {

        if (!video) return;


        if (
            watchTimers.has(video)
        ) {
            return;
        }


        const item =
            video.closest(".video-item");

        if (!item) return;


        const videoId =
            getVideoId(item);


        const startTime =
            Date.now();


        watchTimers.set(
            video,
            startTime
        );

    }


    function stopWatchTimer(video) {

        if (!video) return;


        const startTime =
            watchTimers.get(video);


        if (!startTime) return;


        watchTimers.delete(video);


        const seconds =
            Math.floor(
                (Date.now() - startTime) /
                1000
            );


        if (seconds <= 0) return;


        const item =
            video.closest(".video-item");

        if (!item) return;


        const videoId =
            getVideoId(item);


        const data =
            getAlgorithmData(videoId);


        data[videoId].watchTime +=
            seconds;


        data[videoId].lastWatched =
            Date.now();


        saveAlgorithmData(data);

    }


    /* =====================================================
       VIDEO COMPLETED
    ===================================================== */

    function registerVideoCompleted(video) {

        if (!video) return;


        const item =
            video.closest(".video-item");

        if (!item) return;


        const videoId =
            getVideoId(item);


        const data =
            getAlgorithmData(videoId);


        data[videoId].completed += 1;


        data[videoId].lastWatched =
            Date.now();


        saveAlgorithmData(data);

    }


    /* =====================================================
       LIKE
    ===================================================== */

    function initializeLike(button) {

        if (!button) return;


        if (
            button.dataset.wwcReady ===
            "like"
        ) {
            return;
        }


        button.dataset.wwcReady =
            "like";


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


                const videoId =
                    getVideoId(item);


                const likes =
                    getStorage(
                        "wwc_likes",
                        {}
                    );


                const likedVideos =
                    getStorage(
                        "wwc_liked_videos",
                        []
                    );


                const liked =
                    likedVideos.includes(
                        videoId
                    );


                let count =
                    Number(
                        likes[videoId] || 0
                    );


                if (!liked) {

                    count += 1;

                    likes[videoId] =
                        count;


                    likedVideos.push(
                        videoId
                    );


                } else {

                    count =
                        Math.max(
                            0,
                            count - 1
                        );


                    likes[videoId] =
                        count;


                    const index =
                        likedVideos.indexOf(
                            videoId
                        );


                    if (index !== -1) {

                        likedVideos.splice(
                            index,
                            1
                        );

                    }

                }


                setStorage(
                    "wwc_likes",
                    likes
                );


                setStorage(
                    "wwc_liked_videos",
                    likedVideos
                );


                button.classList.toggle(
                    "liked",
                    !liked
                );


                button.setAttribute(
                    "aria-pressed",
                    String(!liked)
                );


                const countElement =
                    $(".like-count", button);


                if (countElement) {

                    countElement.textContent =
                        count;

                }


                /* ALGORITHM */

                const data =
                    getAlgorithmData(
                        videoId
                    );


                if (!liked) {

                    data[videoId].likes += 1;

                } else {

                    data[videoId].likes =
                        Math.max(
                            0,
                            data[videoId].likes - 1
                        );

                }


                saveAlgorithmData(
                    data
                );

            }
        );

    }


    function loadLikeState(button) {

        if (!button) return;


        const item =
            button.closest(
                ".video-item"
            );


        if (!item) return;


        const videoId =
            getVideoId(item);


        const likes =
            getStorage(
                "wwc_likes",
                {}
            );


        const likedVideos =
            getStorage(
                "wwc_liked_videos",
                []
            );


        const count =
            Number(
                likes[videoId] || 0
            );


        const countElement =
            $(".like-count", button);


        if (countElement) {

            countElement.textContent =
                count;

        }


        const liked =
            likedVideos.includes(
                videoId
            );


        button.classList.toggle(
            "liked",
            liked
        );


        button.setAttribute(
            "aria-pressed",
            String(liked)
        );

    }


    /* =====================================================
       COMMENT
    ===================================================== */

    let activeCommentItem = null;


    const commentBox =
        $("#commentBox");

    const commentInput =
        $("#commentInput");

    const commentSend =
        $("#commentSend");

    const commentCancel =
        $("#commentCancel");


    function getComments(videoId) {

        return getStorage(
            "wwc_comments_" +
            videoId,
            []
        );

    }


    function saveComments(
        videoId,
        comments
    ) {

        setStorage(
            "wwc_comments_" +
            videoId,
            comments
        );

    }


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


            setTimeout(
                () => {

                    commentInput.focus();

                },
                100
            );

        }

    }


    function closeCommentBox() {

        if (!commentBox) {
            return;
        }


        commentBox.classList.remove(
            "show"
        );


        activeCommentItem =
            null;


        if (commentInput) {

            commentInput.value =
                "";

        }

    }


    function initializeComment(button) {

        if (!button) return;


        if (
            button.dataset.wwcReady ===
            "comment"
        ) {
            return;
        }


        button.dataset.wwcReady =
            "comment";


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


                openCommentBox(item);

            }
        );

    }


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


                if (!activeCommentItem) {
                    return;
                }


                if (!commentInput) {
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
                    getVideoId(
                        activeCommentItem
                    );


                const comments =
                    getComments(videoId);


                comments.push({

                    text: text,

                    time:
                        new Date()
                            .toISOString()

                });


                saveComments(
                    videoId,
                    comments
                );


                const data =
                    getAlgorithmData(
                        videoId
                    );


                data[videoId].comments +=
                    1;


                saveAlgorithmData(
                    data
                );


                commentInput.value =
                    "";


                alert(
                    "Comment added successfully."
                );


                closeCommentBox();

            }
        );

                          }

       /* =====================================================
       SAVE
    ===================================================== */

    function initializeSave(button) {

        if (!button) return;

        if (
            button.dataset.wwcReady ===
            "save"
        ) {
            return;
        }

        button.dataset.wwcReady =
            "save";


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


                const videoId =
                    getVideoId(item);


                const savedVideos =
                    getStorage(
                        "wwc_saved_videos",
                        []
                    );


                const index =
                    savedVideos.indexOf(
                        videoId
                    );


                let saved;


                if (index === -1) {

                    savedVideos.push(
                        videoId
                    );

                    saved = true;

                } else {

                    savedVideos.splice(
                        index,
                        1
                    );

                    saved = false;

                }


                setStorage(
                    "wwc_saved_videos",
                    savedVideos
                );


                button.classList.toggle(
                    "saved",
                    saved
                );


                button.setAttribute(
                    "aria-pressed",
                    String(saved)
                );


                const count =
                    $(".save-count", button);


                if (count) {

                    count.textContent =
                        saved ? "1" : "0";

                }

            }
        );

    }


    function loadSaveState(button) {

        if (!button) return;


        const item =
            button.closest(
                ".video-item"
            );


        if (!item) return;


        const videoId =
            getVideoId(item);


        const savedVideos =
            getStorage(
                "wwc_saved_videos",
                []
            );


        const saved =
            savedVideos.includes(
                videoId
            );


        button.classList.toggle(
            "saved",
            saved
        );


        button.setAttribute(
            "aria-pressed",
            String(saved)
        );


        const count =
            $(".save-count", button);


        if (count) {

            count.textContent =
                saved ? "1" : "0";

        }

    }


    /* =====================================================
       SHARE
    ===================================================== */

    async function shareVideo(item) {

        if (!item) return;


        const videoId =
            getVideoId(item);


        const url =
            window.location.href
                .split("#")[0] +
            "#video=" +
            encodeURIComponent(
                videoId
            );


        const username =
            $(".username", item)
                ?.textContent
                ?.trim() ||
            "@wwc_user";


        const shareData = {

            title:
                "World Wide Connect",

            text:
                "Check out this video from " +
                username,

            url: url

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


                const data =
                    getAlgorithmData(
                        videoId
                    );


                data[videoId].shares += 1;


                saveAlgorithmData(
                    data
                );


                return;

            }


            if (
                navigator.clipboard &&
                navigator.clipboard.writeText
            ) {

                await navigator.clipboard.writeText(
                    url
                );


                const data =
                    getAlgorithmData(
                        videoId
                    );


                data[videoId].shares += 1;


                saveAlgorithmData(
                    data
                );


                alert(
                    "Video link copied."
                );


                return;

            }


            window.prompt(
                "Copy this video link:",
                url
            );

        } catch (error) {

            if (
                error &&
                error.name ===
                "AbortError"
            ) {

                return;

            }


            console.error(
                "Share error:",
                error
            );

        }

    }


    function initializeShare(button) {

        if (!button) return;


        if (
            button.dataset.wwcReady ===
            "share"
        ) {
            return;
        }


        button.dataset.wwcReady =
            "share";


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                const item =
                    button.closest(
                        ".video-item"
                    );


                shareVideo(item);

            }
        );

    }


    /* =====================================================
       FOLLOW
    ===================================================== */

    function initializeFollow(button) {

        if (!button) return;


        if (
            button.dataset.wwcReady ===
            "follow"
        ) {
            return;
        }


        button.dataset.wwcReady =
            "follow";


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
                    $(".username", item);


                const username =
                    usernameElement
                        ?.textContent
                        ?.trim() ||
                    "@wwc_user";


                const following =
                    getStorage(
                        "wwc_following",
                        []
                    );


                const index =
                    following.indexOf(
                        username
                    );


                if (index === -1) {

                    following.push(
                        username
                    );


                    button.textContent =
                        "Following";


                    button.classList.add(
                        "following"
                    );

                } else {

                    following.splice(
                        index,
                        1
                    );


                    button.textContent =
                        "Follow";


                    button.classList.remove(
                        "following"
                    );

                }


                setStorage(
                    "wwc_following",
                    following
                );

            }
        );

    }


    function loadFollowState(button) {

        if (!button) return;


        const item =
            button.closest(
                ".video-item"
            );


        if (!item) return;


        const username =
            $(".username", item)
                ?.textContent
                ?.trim() ||
            "@wwc_user";


        const following =
            getStorage(
                "wwc_following",
                []
            );


        const isFollowing =
            following.includes(
                username
            );


        button.textContent =
            isFollowing
                ? "Following"
                : "Follow";


        button.classList.toggle(
            "following",
            isFollowing
        );

    }


    /* =====================================================
       INITIALIZE VIDEO BUTTONS
    ===================================================== */

    function initializeVideoButtons() {

        $$(".video-item").forEach(
            item => {

                const like =
                    $(".like-btn", item);

                const comment =
                    $(".comment-btn", item);

                const save =
                    $(".save-btn", item);

                const share =
                    $(".share-btn", item);

                const follow =
                    $(".follow-btn", item);


                initializeLike(like);

                initializeComment(
                    comment
                );

                initializeSave(save);

                initializeShare(
                    share
                );

                initializeFollow(
                    follow
                );


                loadLikeState(
                    like
                );

                loadSaveState(
                    save
                );

                loadFollowState(
                    follow
                );

            }
        );

    }


    /* =====================================================
       VIDEO PLAYBACK + ALGORITHM
    ===================================================== */

    function setupVideoPlayback() {

        const videos =
            $$(".feed-video");


        if (!videos.length) {
            return;
        }


        const observer =
            new IntersectionObserver(
                entries => {

                    entries.forEach(
                        entry => {

                            const video =
                                entry.target;


                            if (
                                entry.isIntersecting &&
                                entry.intersectionRatio >=
                                0.60
                            ) {

                                videos.forEach(
                                    other => {

                                        if (
                                            other !==
                                            video
                                        ) {

                                            stopWatchTimer(
                                                other
                                            );


                                            other.pause();

                                        }

                                    }
                                );


                                video.muted =
                                    true;


                                video.play()
                                    .then(
                                        () => {

                                            registerVideoView(
                                                video
                                            );

                                            startWatchTimer(
                                                video
                                            );

                                        }
                                    )
                                    .catch(
                                        () => {}
                                    );


                            } else {

                                stopWatchTimer(
                                    video
                                );


                                video.pause();

                            }

                        }
                    );

                },
                {
                    threshold: [0.60]
                }
            );


        videos.forEach(
            video => {

                observer.observe(
                    video
                );


                video.addEventListener(
                    "timeupdate",
                    () => {

                        if (
                            !video.duration ||
                            !isFinite(
                                video.duration
                            )
                        ) {
                            return;
                        }


                        const progress =
                            video.currentTime /
                            video.duration;


                        if (
                            progress >= 0.90 &&
                            !video.dataset.completed
                        ) {

                            video.dataset.completed =
                                "true";


                            registerVideoCompleted(
                                video
                            );

                        }

                    }
                );


                video.addEventListener(
                    "ended",
                    () => {

                        stopWatchTimer(
                            video
                        );


                        const item =
                            video.closest(
                                ".video-item"
                            );


                        const next =
                            item?.nextElementSibling;


                        if (
                            next &&
                            next.classList.contains(
                                "video-item"
                            )
                        ) {

                            next.scrollIntoView({
                                behavior:
                                    "smooth",
                                block:
                                    "start"
                            });

                        }

                    }
                );

            }
        );

    }


    /* =====================================================
       FOR YOU FEED
    ===================================================== */

    function showForYouFeed() {

        if (!videoFeed) return;


        $$(".video-item").forEach(
            item => {

                item.style.display =
                    "block";

            }
        );


        const videos =
            $$(".feed-video");


        videos.forEach(
            video => {

                video.pause();

            }
        );


        const first =
            videos[0];


        if (first) {

            first.muted =
                true;


            first.play()
                .then(
                    () => {

                        registerVideoView(
                            first
                        );

                        startWatchTimer(
                            first
                        );

                    }
                )
                .catch(
                    () => {}
                );

        }

    }


    /* =====================================================
       FOLLOWING FEED
    ===================================================== */

    function showFollowingFeed() {

        if (!videoFeed) return;


        const following =
            getStorage(
                "wwc_following",
                []
            );


        if (!following.length) {

            alert(
                "You are not following anyone yet."
            );


            showForYouFeed();

            return;

        }


        let firstVisible =
            null;


        $$(".video-item").forEach(
            item => {

                const username =
                    $(".username", item)
                        ?.textContent
                        ?.trim() ||
                    "";


                const match =
                    following.includes(
                        username
                    );


                item.style.display =
                    match
                        ? "block"
                        : "none";


                if (
                    match &&
                    !firstVisible
                ) {

                    firstVisible =
                        item;

                }

            }
        );


        $$(".feed-video").forEach(
            video => {

                video.pause();

            }
        );


        if (firstVisible) {

            firstVisible.scrollIntoView({
                behavior:
                    "smooth",
                block:
                    "start"
            });


            const video =
                $(".feed-video",
                    firstVisible);


            if (video) {

                video.muted =
                    true;


                video.play()
                    .catch(
                        () => {}
                    );

            }

        }

            }
   
   
