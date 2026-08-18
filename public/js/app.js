/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   NEW APP.JS
   PART 1 / 3
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";


    /* =====================================================
       HELPERS
       ===================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));


    const videoFeed = $("#video-feed");


    /* =====================================================
       LOCAL STORAGE
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
            return "";
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
       LIKE
       ===================================================== */

    function initializeLike(button) {

        if (!button) {
            return;
        }

        if (button.dataset.wwcReady === "like") {
            return;
        }

        button.dataset.wwcReady = "like";


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                const item =
                    button.closest(".video-item");


                if (!item) {
                    return;
                }


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


                const alreadyLiked =
                    likedVideos.includes(
                        videoId
                    );


                let count =
                    Number(
                        likes[videoId] || 0
                    );


                if (alreadyLiked) {

                    count =
                        Math.max(
                            0,
                            count - 1
                        );


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

                } else {

                    count++;

                    likedVideos.push(
                        videoId
                    );

                }


                likes[videoId] =
                    count;


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
                    !alreadyLiked
                );


                button.setAttribute(
                    "aria-pressed",
                    String(!alreadyLiked)
                );


                const countElement =
                    $(".like-count", button);


                if (countElement) {

                    countElement.textContent =
                        count;

                }

            }
        );

    }


    function loadLikeState(button) {

        if (!button) {
            return;
        }


        const item =
            button.closest(".video-item");


        if (!item) {
            return;
        }


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


        const liked =
            likedVideos.includes(
                videoId
            );


        const countElement =
            $(".like-count", button);


        if (countElement) {

            countElement.textContent =
                count;

        }


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
       SAVE
       ===================================================== */

    function initializeSave(button) {

        if (!button) {
            return;
        }

        if (button.dataset.wwcReady === "save") {
            return;
        }

        button.dataset.wwcReady = "save";


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                const item =
                    button.closest(".video-item");


                if (!item) {
                    return;
                }


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

        if (!button) {
            return;
        }


        const item =
            button.closest(".video-item");


        if (!item) {
            return;
        }


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
       FOLLOW
       ===================================================== */

    function initializeFollow(button) {

        if (!button) {
            return;
        }

        if (button.dataset.wwcReady === "follow") {
            return;
        }

        button.dataset.wwcReady = "follow";


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                const item =
                    button.closest(".video-item");


                if (!item) {
                    return;
                }


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


                const index =
                    following.indexOf(
                        username
                    );


                let isFollowing;


                if (index === -1) {

                    following.push(
                        username
                    );

                    isFollowing = true;

                } else {

                    following.splice(
                        index,
                        1
                    );

                    isFollowing = false;

                }


                setStorage(
                    "wwc_following",
                    following
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
        );

    }


    function loadFollowState(button) {

        if (!button) {
            return;
        }


        const item =
            button.closest(".video-item");


        if (!item) {
            return;
        }


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


    function openCommentBox(item) {

        if (!commentBox || !item) {
            return;
        }


        activeCommentItem = item;


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


        activeCommentItem = null;


        if (commentInput) {
            commentInput.value = "";
        }

    }


    function initializeComment(button) {

        if (!button) {
            return;
        }

        if (button.dataset.wwcReady === "comment") {
            return;
        }

        button.dataset.wwcReady = "comment";


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                const item =
                    button.closest(
                        ".video-item"
                    );


                if (!item) {
                    return;
                }


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
                    getVideoId(
                        activeCommentItem
                    );


                const key =
                    "wwc_comments_" +
                    videoId;


                const comments =
                    getStorage(
                        key,
                        []
                    );


                comments.push({

                    text: text,

                    time:
                        new Date()
                            .toISOString()

                });


                setStorage(
                    key,
                    comments
                );


                commentInput.value = "";


                closeCommentBox();


                alert(
                    "Comment added successfully."
                );

            }
        );

    }


    /* =====================================================
       END OF PART 1
       ===================================================== */
