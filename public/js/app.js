/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   COMPLETE APP.JS
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
       STORAGE HELPERS
    ===================================================== */

    function getStorage(key, fallback) {

        try {

            const value = localStorage.getItem(key);

            if (value === null) {
                return fallback;
            }

            return JSON.parse(value);

        } catch (error) {

            console.error("Storage read error:", error);

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

            console.error("Storage save error:", error);
        }
    }


    /* =====================================================
       VIDEO DATA
    ===================================================== */

    function getVideoId(item) {

        return (
            item?.dataset?.videoId ||
            "video-" + Math.random().toString(36).slice(2)
        );

    }


    /* =====================================================
       LIKE
    ===================================================== */

    function initializeLike(button) {

        if (!button) return;

        if (button.dataset.wwcReady === "like") {
            return;
        }

        button.dataset.wwcReady = "like";


        button.addEventListener("click", event => {

            event.preventDefault();
            event.stopPropagation();


            const item =
                button.closest(".video-item");

            if (!item) return;


            const videoId =
                getVideoId(item);


            const likes =
                getStorage("wwc_likes", {});


            const current =
                Number(likes[videoId] || 0);


            const liked =
                button.classList.contains("liked");


            const count =
                liked
                    ? Math.max(0, current - 1)
                    : current + 1;


            likes[videoId] = count;

            setStorage(
                "wwc_likes",
                likes
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

        });

    }


    function loadLikeState(button) {

        if (!button) return;

        const item =
            button.closest(".video-item");

        if (!item) return;


        const videoId =
            getVideoId(item);


        const likes =
            getStorage("wwc_likes", {});


        const count =
            Number(likes[videoId] || 0);


        const countElement =
            $(".like-count", button);


        if (countElement) {

            countElement.textContent =
                count;

        }


        const likedVideos =
            getStorage(
                "wwc_liked_videos",
                []
            );


        const liked =
            likedVideos.includes(videoId);


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
            "wwc_comments_" + videoId,
            []
        );

    }


    function saveComments(
        videoId,
        comments
    ) {

        setStorage(
            "wwc_comments_" + videoId,
            comments
        );

    }


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

            setTimeout(() => {

                commentInput.focus();

            }, 100);

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

        if (!button) return;

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
                    button.closest(".video-item");


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


                commentInput.value = "";


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
            button.closest(".video-item");

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
            window.location.href.split("#")[0] +
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
                typeof navigator.share === "function"
            ) {

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
                    url
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
                error.name === "AbortError"
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

        if (button.dataset.wwcReady === "share") {
            return;
        }

        button.dataset.wwcReady = "share";


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
                initializeComment(comment);
                initializeSave(save);
                initializeShare(share);
                initializeFollow(follow);


                loadLikeState(like);
                loadSaveState(save);
                loadFollowState(follow);

            }
        );

    }


    /* =====================================================
       VIDEO AUTOPLAY / PAUSE
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
                                entry.intersectionRatio >= 0.60
                            ) {

                                videos.forEach(
                                    other => {

                                        if (
                                            other !== video
                                        ) {

                                            other.pause();

                                        }

                                    }
                                );


                                video.muted = true;


                                video.play()
                                    .catch(() => {});


                            } else {

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
                    "ended",
                    () => {

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
                                behavior: "smooth",
                                block: "start"
                            });

                        }

                    }
                );

            }
        );

    }


    /* =====================================================
       FOR YOU
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

            first.muted = true;

            first.play()
                .catch(() => {});

        }

    }


    /* =====================================================
       FOLLOWING
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


        let visibleCount = 0;


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


                if (match) {
                    visibleCount++;
                }

            }
        );


        if (!visibleCount) {

            alert(
                "No videos from followed users yet."
            );

            showForYouFeed();

        }

    }


    /* =====================================================
       TOP TABS
    ===================================================== */

    $$(".wwc-top-tab").forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();


                    $$(".wwc-top-tab")
                        .forEach(
                            tab => {
                                tab.classList.remove(
                                    "active"
                                );
                            }
                        );


                    button.classList.add(
                        "active"
                    );


                    const text =
                        button.textContent
                            .trim()
                            .toLowerCase();


                    if (
                        text ===
                        "following"
                    ) {

                        showFollowingFeed();

                    } else {

                        showForYouFeed();

                    }

                }
            );

        }
    );


    /* =====================================================
       SEARCH
    ===================================================== */

    const searchBtn =
        $("#searchBtn");


    let searchBox = null;


    function openSearch() {

        if (searchBox) {

            searchBox.classList.add(
                "show"
            );

            const input =
                $("#wwcSearchInput");

            input?.focus();

            return;
        }


        searchBox =
            document.createElement(
                "div"
            );


        searchBox.id =
            "wwcSearchBox";


        searchBox.style.cssText = `
            position:fixed;
            top:70px;
            left:50%;
            transform:translateX(-50%);
            width:min(92%,420px);
            padding:12px;
            background:rgba(20,20,20,.98);
            border:1px solid rgba(255,255,255,.15);
            border-radius:16px;
            z-index:5000;
            box-shadow:0 10px 40px rgba(0,0,0,.6);
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
                    placeholder="Search videos or users..."
                    autocomplete="off"
                    style="
                        flex:1;
                        height:44px;
                        border:0;
                        outline:0;
                        border-radius:10px;
                        padding:0 12px;
                        font-size:15px;
                    "
                >

                <button
                    id="wwcSearchClose"
                    type="button"
                    style="
                        width:44px;
                        height:44px;
                        border:0;
                        border-radius:10px;
                        background:#333;
                        color:#fff;
                        font-size:18px;
                    "
                >
                    ✕
                </button>

            </div>

            <div
                id="wwcSearchResult"
                style="
                    color:#aaa;
                    padding:10px 4px 2px;
                    text-align:center;
                "
            >
                Type something to search
            </div>
        `;


        document.body.appendChild(
            searchBox
        );


        const input =
            $("#wwcSearchInput");


        const close =
            $("#wwcSearchClose");


        if (close) {

            close.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    closeSearch();

                }
            );

        }


        if (input) {

            input.addEventListener(
                "input",
                () => {

                    performSearch(
                        input.value
                    );

                }
            );


            input.focus();

        }

    }


    function closeSearch() {

        if (!searchBox) {
            return;
        }


        searchBox.remove();

        searchBox = null;


        $$(".video-item").forEach(
            item => {

                item.style.display =
                    "block";

            }
        );

    }


    function performSearch(query) {

        const result =
            $("#wwcSearchResult");


        if (!query.trim()) {

            $$(".video-item").forEach(
                item => {

                    item.style.display =
                        "block";

                }
            );


            if (result) {

                result.textContent =
                    "Type something to search";

            }

            return;
        }


        const q =
            query
                .trim()
                .toLowerCase();


        let found = 0;


        $$(".video-item").forEach(
            item => {

                const username =
                    $(".username", item)
                        ?.textContent
                        ?.toLowerCase() ||
                    "";


                const caption =
                    $(".video-caption", item)
                        ?.textContent
                        ?.toLowerCase() ||
                    "";


                const match =
                    username.includes(q) ||
                    caption.includes(q);


                item.style.display =
                    match
                        ? "block"
                        : "none";


                if (match) {
                    found++;
                }

            }
        );


        if (result) {

            result.textContent =
                found +
                (
                    found === 1
                        ? " video found"
                        : " videos found"
                );

        }

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


    /* =====================================================
       BOTTOM NAVIGATION
    ===================================================== */

    const homeBtn =
        $("#homeBtn");

    const friendsBtn =
        $("#friendsBtn");

    const inboxBtn =
        $("#inboxBtn");

    const profileBtn =
        $("#profileBtn");


    function setActiveNav(button) {

        $$(".wwc-nav-btn")
            .forEach(
                btn => {

                    btn.classList.remove(
                        "active"
                    );

                }
            );


        if (button) {

            button.classList.add(
                "active"
            );

        }

    }


    if (homeBtn) {

        homeBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                setActiveNav(
                    homeBtn
                );


                $$(".wwc-top-tab")
                    .forEach(
                        tab => {

                            tab.classList.remove(
                                "active"
                            );

                        }
                    );


                const forYou =
                    $$(".wwc-top-tab")
                        .find(
                            tab =>
                                tab.textContent
                                    .trim()
                                    .toLowerCase() ===
                                "for you"
                        );


                if (forYou) {

                    forYou.classList.add(
                        "active"
                    );

                }


                showForYouFeed();


                if (videoFeed) {

                    videoFeed.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }

            }
        );

    }


    if (friendsBtn) {

        friendsBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                setActiveNav(
                    friendsBtn
                );


                alert(
                    "Friends feature is ready for the next step."
                );

            }
        );

    }


    if (inboxBtn) {

        inboxBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                setActiveNav(
                    inboxBtn
                );


                alert(
                    "Inbox feature is ready for the next step."
                );

            }
        );

    }


    /* =====================================================
       PROFILE MENU
    ===================================================== */

    const profileMenu =
        $("#profileMenu");

    const profileMenuClose =
        $("#profileMenuClose");


    function openProfileMenu() {

        if (!profileMenu) {
            return;
        }


        profileMenu.classList.add(
            "show"
        );


        profileMenu.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    function closeProfileMenu() {

        if (!profileMenu) {
            return;
        }


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


                setActiveNav(
                    profileBtn
                );


                if (
                    profileMenu &&
                    profileMenu.classList.contains(
                        "show"
                    )
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


    document.addEventListener(
        "click",
        event => {

            if (!profileMenu) {
                return;
            }


            if (
                profileMenu.classList.contains(
                    "show"
                ) &&
                !profileMenu.contains(
                    event.target
                ) &&
                !profileBtn?.contains(
                    event.target
                )
            ) {

                closeProfileMenu();

            }

        }
    );


    /* =====================================================
       PROFILE MENU BUTTON
    ===================================================== */

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


    /* =====================================================
       LOGIN / REGISTER
    ===================================================== */

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


    /* =====================================================
       LOGOUT
    ===================================================== */

    const logoutBtn =
        $("#logoutBtn");


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async event => {

                event.preventDefault();
                event.stopPropagation();


                /*
                 * Firebase Auth থাকলে
                 * auth.html থেকে session
                 * handle করা যাবে।
                 */

                try {

                    localStorage.removeItem(
                        "wwc_user"
                    );

                } catch (error) {

                    console.error(
                        error
                    );

                }


                window.location.href =
                    "./auth.html";

            }
        );

    }


    /* =====================================================
       UPLOAD
    ===================================================== */

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
                    event.target.files?.[0];


                if (!file) {
                    return;
                }


                if (
                    !file.type.startsWith(
                        "video/"
                    )
                ) {

                    alert(
                        "Please select a video file."
                    );


                    videoUpload.value =
                        "";


                    return;

                }


                const videoURL =
                    URL.createObjectURL(
                        file
                    );


                if (!videoFeed) {
                    return;
                }


                const item =
                    document.createElement(
                        "section"
                    );


                item.className =
                    "video-item";


                item.dataset.videoId =
                    "uploaded-" +
                    Date.now();


                item.innerHTML = `

                    <video
                        class="feed-video"
                        autoplay
                        muted
                        playsinline
                        controls
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
                            <span class="like-count">
                                0
                            </span>
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
                            <span class="save-count">
                                0
                            </span>
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


                videoFeed.appendChild(
                    item
                );


                initializeVideoButtons();


                setupVideoPlayback();


                item.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });


                videoUpload.value =
                    "";

            }
        );

    }


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            closeSearch();

            closeCommentBox();

            closeProfileMenu();

        }
    );


    /* =====================================================
       INITIALIZE EVERYTHING
    ===================================================== */

    initializeVideoButtons();

    setupVideoPlayback();

    showForYouFeed();


    /* =====================================================
       INITIAL AUTOPLAY
    ===================================================== */

    const firstVideo =
        $(".feed-video");


    if (firstVideo) {

        setTimeout(
            () => {

                firstVideo.muted =
                    true;


                firstVideo
                    .play()
                    .catch(
                        () => {}
                    );

            },
            300
        );

    }


    /* =====================================================
       READY
    ===================================================== */

    console.log(
        "WWC-Core: App initialized successfully."
    );

});
