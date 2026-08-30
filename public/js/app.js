// =====================================================
// WWC - WORLD WIDE CONNECT
// FINAL FEED
// Like + Save + Comment + Follow
// Swipe Video + Auto Play + Search
// =====================================================

const feed = document.getElementById("video-feed");

const searchBtn = document.getElementById("search-btn");
const searchOverlay = document.getElementById("search-overlay");
const searchBack = document.getElementById("search-back");
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");

const commentModal = document.getElementById("comment-modal");
const commentList = document.getElementById("comment-list");
const commentInput = document.getElementById("comment-input");
const commentSubmit = document.getElementById("comment-submit");
const closeComment = document.getElementById("close-comment");

let currentUser = null;
let currentUserData = null;

let allVideos = [];

let likedVideos = new Set();
let savedVideos = new Set();
let followingUsers = new Set();

let currentFeed = "foryou";

let currentVideoId = null;

let videoObserver = null;

let allUsersCache = null;

let searchDebounce = null;

let isChangingVideo = false;


/* =====================================================
   AUTH
===================================================== */

auth.onAuthStateChanged(async function (user) {

    if (!user) {
        window.location.href = "public/js/auth.html";
        return;
    }

    currentUser = user;

    try {
        await loadCurrentUserProfile();
        await loadUserData();
        await loadVideos();
    } catch (error) {
        console.error("WWC initialization error:", error);

        if (feed) {
            feed.innerHTML =
                '<div class="feed-loading error">' +
                "অ্যাপ লোড করতে সমস্যা হয়েছে" +
                "</div>";
        }
    }
});


/* =====================================================
   CURRENT USER PROFILE
===================================================== */

async function loadCurrentUserProfile() {

    try {

        const ref =
            db.collection("users")
            .doc(currentUser.uid);

        const snap = await ref.get();

        if (snap.exists) {

            currentUserData = snap.data();

        } else {

            currentUserData = {

                uid: currentUser.uid,

                username:
                    currentUser.displayName ||
                    "wwc_user",

                displayName:
                    currentUser.displayName ||
                    "WWC User",

                email:
                    currentUser.email || "",

                photoURL:
                    currentUser.photoURL || "",

                bio:
                    "হ্যালো, আমি WWC ব্যবহার করছি",

                createdAt:
                    firebase.firestore.FieldValue.serverTimestamp()
            };

            await ref.set(
                currentUserData,
                { merge: true }
            );
        }

    } catch (error) {

        console.error(
            "Profile load error:",
            error
        );

        currentUserData = {

            username: "wwc_user",

            displayName: "WWC User",

            photoURL: ""
        };
    }
}


/* =====================================================
   LOAD USER DATA
===================================================== */

async function loadUserData() {

    likedVideos.clear();
    savedVideos.clear();
    followingUsers.clear();

    try {

        /* ---------- LIKES ---------- */

        const likesSnap =
            await db
            .collection("likes")
            .where(
                "userId",
                "==",
                currentUser.uid
            )
            .get();

        likesSnap.forEach(function (doc) {

            const data = doc.data();

            if (data.videoId) {
                likedVideos.add(
                    data.videoId
                );
            }
        });


        /* ---------- SAVES ---------- */

        const savesSnap =
            await db
            .collection("saves")
            .where(
                "userId",
                "==",
                currentUser.uid
            )
            .get();

        savesSnap.forEach(function (doc) {

            const data = doc.data();

            if (data.videoId) {
                savedVideos.add(
                    data.videoId
                );
            }
        });


        /* ---------- FOLLOWS ---------- */

        const followsSnap =
            await db
            .collection("follows")
            .where(
                "follower",
                "==",
                currentUser.uid
            )
            .get();

        followsSnap.forEach(function (doc) {

            const data = doc.data();

            if (data.following) {
                followingUsers.add(
                    data.following
                );
            }
        });

    } catch (error) {

        console.error(
            "User data error:",
            error
        );
    }
}


/* =====================================================
   LOAD VIDEOS
===================================================== */

async function loadVideos() {

    if (!feed) return;

    feed.innerHTML =
        '<div class="feed-loading">' +
        "ভিডিও লোড হচ্ছে..." +
        "</div>";

    try {

        /*
         * orderBy ব্যবহার না করে সব ভিডিও এনে
         * client-side sort করছি।
         *
         * এতে createdAt/index সমস্যা কম হবে।
         */

        const snapshot =
            await db
            .collection("videos")
            .limit(100)
            .get();

        allVideos = [];

        snapshot.forEach(function (doc) {

            const data = doc.data();

            let uid =
                data.uid ||
                data.userId ||
                "";

            let createdAt = 0;

            if (
                data.createdAt &&
                typeof data.createdAt.toMillis === "function"
            ) {

                createdAt =
                    data.createdAt.toMillis();

            } else if (
                typeof data.createdAt === "number"
            ) {

                createdAt =
                    data.createdAt;
            }

            allVideos.push({

                id: doc.id,

                ...data,

                uid: uid,

                createdAtValue:
                    createdAt
            });
        });


        /* ---------- NEWEST FIRST ---------- */

        allVideos.sort(function (a, b) {

            return (
                b.createdAtValue -
                a.createdAtValue
            );
        });


        if (!allVideos.length) {

            feed.innerHTML =
                '<div class="feed-loading">' +
                "কোনো ভিডিও নেই" +
                "</div>";

            return;
        }


        renderFeed();

    } catch (error) {

        console.error(
            "Video load error:",
            error
        );

        feed.innerHTML =
            '<div class="feed-loading error">' +
            "ভিডিও লোড হয়নি" +
            "</div>";
    }
}


/* =====================================================
   RENDER FEED
===================================================== */

function renderFeed() {

    if (!feed) return;

    let videos = allVideos;

    if (currentFeed === "following") {

        videos =
            allVideos.filter(function (video) {

                return followingUsers.has(
                    video.uid
                );
            });
    }


    if (!videos.length) {

        feed.innerHTML =
            '<div class="feed-loading">' +
            (
                currentFeed === "following"
                    ? "আপনি কাউকে Follow করেননি"
                    : "কোনো ভিডিও পাওয়া যায়নি"
            ) +
            "</div>";

        return;
    }


    feed.innerHTML = "";


    videos.forEach(function (video) {

        feed.appendChild(
            createVideoCard(video)
        );
    });


    setupVideoObserver();

    setupSwipeNavigation();
}


/* =====================================================
   CREATE VIDEO CARD
===================================================== */

function createVideoCard(video) {

    const card =
        document.createElement("div");

    card.className = "video-card";

    card.dataset.videoId =
        video.id;


    const isLiked =
        likedVideos.has(video.id);

    const isSaved =
        savedVideos.has(video.id);

    const isFollowing =
        followingUsers.has(video.uid) ||
        video.uid === currentUser.uid;


    const videoUrl =
        video.videoURL ||
        video.downloadURL ||
        video.url ||
        "";


    const username =
        video.username ||
        "wwc_user";


    const photoUrl =
        video.photoURL ||
        "./images/profile.png";


    const caption =
        video.caption ||
        "";


    const sound =
        video.sound ||
        "Original sound";


    const uid =
        video.uid ||
        "";


    let followButton = "";


    if (
        uid &&
        uid !== currentUser.uid
    ) {

        followButton =
            '<button class="follow-btn ' +
            (
                isFollowing
                    ? "following"
                    : ""
            ) +
            '" data-uid="' +
            escapeAttr(uid) +
            '">' +
            (
                isFollowing
                    ? "✓"
                    : "+"
            ) +
            "</button>";
    }


    card.innerHTML =

        '<video ' +
        'src="' +
        escapeAttr(videoUrl) +
        '" ' +
        'loop ' +
        'muted ' +
        'playsinline ' +
        'preload="metadata">' +
        "</video>" +


        '<div class="mute-indicator">' +
        '<i class="fas fa-volume-mute"></i>' +
        "</div>" +


        '<div class="side-actions">' +


            '<div class="profile-pic-wrap">' +

                '<img ' +
                'class="profile-pic" ' +
                'src="' +
                escapeAttr(photoUrl) +
                '" ' +
                'data-uid="' +
                escapeAttr(uid) +
                '">' +

                followButton +

            "</div>" +


            '<button ' +
            'class="action-btn like-btn ' +
            (
                isLiked
                    ? "liked"
                    : ""
            ) +
            '" ' +
            'data-video-id="' +
            escapeAttr(video.id) +
            '">' +

                '<i class="fas fa-heart"></i>' +

                '<span class="count">' +
                formatNumber(
                    video.likes || 0
                ) +
                "</span>" +

            "</button>" +


            '<button ' +
            'class="action-btn comment-btn" ' +
            'data-video-id="' +
            escapeAttr(video.id) +
            '">' +

                '<i class="fas fa-comment"></i>' +

                '<span class="count">' +
                formatNumber(
                    video.comments || 0
                ) +
                "</span>" +

            "</button>" +


            '<button ' +
            'class="action-btn save-btn ' +
            (
                isSaved
                    ? "saved"
                    : ""
            ) +
            '" ' +
            'data-video-id="' +
            escapeAttr(video.id) +
            '">' +

                '<i class="fas fa-bookmark"></i>' +

                '<span class="count">' +
                formatNumber(
                    video.saves || 0
                ) +
                "</span>" +

            "</button>" +


            '<button ' +
            'class="action-btn share-btn" ' +
            'data-video-id="' +
            escapeAttr(video.id) +
            '">' +

                '<i class="fas fa-share"></i>' +

                "<span>শেয়ার</span>" +

            "</button>" +


            '<div class="music-disc">' +
                '<i class="fas fa-music"></i>' +
            "</div>" +

        "</div>" +


        '<div class="bottom-info">' +

            '<span ' +
            'class="username" ' +
            'data-uid="' +
            escapeAttr(uid) +
            '">' +

                "@" +
                escapeHtml(username) +

            "</span>" +


            '<div class="caption">' +
                escapeHtml(caption) +
            "</div>" +


            '<div class="music-info">' +

                '<i class="fas fa-music"></i>' +

                '<span class="music-text">' +
                    escapeHtml(sound) +
                "</span>" +

            "</div>" +

        "</div>";


    /* =================================================
       VIDEO
    ================================================= */

    const videoEl =
        card.querySelector("video");

    const muteIndicator =
        card.querySelector(
            ".mute-indicator"
        );


    if (videoEl) {

        videoEl.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                videoEl.muted =
                    !videoEl.muted;

                if (muteIndicator) {

                    muteIndicator.innerHTML =
                        videoEl.muted

                            ? '<i class="fas fa-volume-mute"></i>'

                            : '<i class="fas fa-volume-up"></i>';

                    muteIndicator.classList.add(
                        "show"
                    );

                    clearTimeout(
                        muteIndicator._timer
                    );

                    muteIndicator._timer =
                        setTimeout(
                            function () {

                                muteIndicator.classList.remove(
                                    "show"
                                );

                            },
                            700
                        );
                }
            }
        );


        /* DOUBLE CLICK LIKE */

        videoEl.addEventListener(
            "dblclick",
            function (event) {

                event.preventDefault();

                const likeBtn =
                    card.querySelector(
                        ".like-btn"
                    );

                if (likeBtn) {
                    toggleLike(likeBtn);
                }
            }
        );
    }


    /* =================================================
       PROFILE / USERNAME
    ================================================= */

    card.querySelectorAll(
        "[data-uid]"
    ).forEach(function (element) {

        element.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                const uid =
                    element.dataset.uid;

                if (uid) {
                    goToProfile(uid);
                }
            }
        );
    });


    /* =================================================
       LIKE
    ================================================= */

    const likeBtn =
        card.querySelector(
            ".like-btn"
        );

    if (likeBtn) {

        likeBtn.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                toggleLike(likeBtn);
            }
        );
    }


    /* =================================================
       COMMENT
    ================================================= */

    const commentBtn =
        card.querySelector(
            ".comment-btn"
        );

    if (commentBtn) {

        commentBtn.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                openComment(
                    commentBtn.dataset.videoId
                );
            }
        );
    }


    /* =================================================
       SAVE
    ================================================= */

    const saveBtn =
        card.querySelector(
            ".save-btn"
        );

    if (saveBtn) {

        saveBtn.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                toggleSave(saveBtn);
            }
        );
    }


    /* =================================================
       SHARE
    ================================================= */

    const shareBtn =
        card.querySelector(
            ".share-btn"
        );

    if (shareBtn) {

        shareBtn.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                shareVideo(
                    shareBtn.dataset.videoId
                );
            }
        );
    }


    /* =================================================
       FOLLOW
    ================================================= */

    const followBtn =
        card.querySelector(
            ".follow-btn"
        );

    if (followBtn) {

        followBtn.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                toggleFollow(
                    followBtn
                );
            }
        );
    }


    return card;
}


/* =====================================================
   LIKE
===================================================== */

async function toggleLike(btn) {

    if (!currentUser) {

        showToast(
            "লগইন করুন"
        );

        return;
    }


    if (btn.disabled) return;

    btn.disabled = true;


    const videoId =
        btn.dataset.videoId;


    const countSpan =
        btn.querySelector(".count");


    const currentlyLiked =
        btn.classList.contains(
            "liked"
        );


    const oldCount =
        getCount(
            countSpan
        );


    /* ---------- UI UPDATE ---------- */

    btn.classList.toggle(
        "liked",
        !currentlyLiked
    );


    countSpan.textContent =
        formatNumber(
            currentlyLiked
                ? Math.max(
                    0,
                    oldCount - 1
                )
                : oldCount + 1
        );


    try {

        const videoRef =
            db.collection("videos")
            .doc(videoId);


        const likeRef =
            db.collection("likes")
            .doc(
                currentUser.uid +
                "_" +
                videoId
            );


        if (currentlyLiked) {

            /*
             * DELETE
             */

            await likeRef.delete();


            await videoRef.update({

                likes:
                    firebase.firestore
                    .FieldValue
                    .increment(-1)
            });


            likedVideos.delete(
                videoId
            );


        } else {

            /*
             * CREATE
             */

            await likeRef.set({

                userId:
                    currentUser.uid,

                videoId:
                    videoId,

                createdAt:
                    firebase.firestore
                    .FieldValue
                    .serverTimestamp()
            });


            await videoRef.update({

                likes:
                    firebase.firestore
                    .FieldValue
                    .increment(1)
            });


            likedVideos.add(
                videoId
            );


            showToast(
                "লাইক হয়েছে ❤️"
            );
        }


        updateLocalVideoCount(
            videoId,
            "likes",
            currentlyLiked
                ? -1
                : 1
        );


    } catch (error) {

        console.error(
            "LIKE ERROR:",
            error
        );


        /* rollback */

        btn.classList.toggle(
            "liked",
            currentlyLiked
        );


        countSpan.textContent =
            formatNumber(
                oldCount
            );


        showToast(
            "লাইক সেভ হয়নি"
        );
    }


    btn.disabled = false;
}


/* =====================================================
   SAVE
===================================================== */

async function toggleSave(btn) {

    if (!currentUser) {

        showToast(
            "লগইন করুন"
        );

        return;
    }


    if (btn.disabled) return;

    btn.disabled = true;


    const videoId =
        btn.dataset.videoId;


    const countSpan =
        btn.querySelector(".count");


    const currentlySaved =
        btn.classList.contains(
            "saved"
        );


    const oldCount =
        getCount(
            countSpan
        );


    /* ---------- UI ---------- */

    btn.classList.toggle(
        "saved",
        !currentlySaved
    );


    countSpan.textContent =
        formatNumber(
            currentlySaved
                ? Math.max(
                    0,
                    oldCount - 1
                )
                : oldCount + 1
        );


    try {

        const videoRef =
            db.collection("videos")
            .doc(videoId);


        const saveRef =
            db.collection("saves")
            .doc(
                currentUser.uid +
                "_" +
                videoId
            );


        if (currentlySaved) {

            /*
             * REMOVE SAVE
             */

            await saveRef.delete();


            await videoRef.update({

                saves:
                    firebase.firestore
                    .FieldValue
                    .increment(-1)
            });


            savedVideos.delete(
                videoId
            );


            showToast(
                "সংরক্ষণ থেকে সরানো হয়েছে"
            );


        } else {

            /*
             * ADD SAVE
             */

            await saveRef.set({

                userId:
                    currentUser.uid,

                videoId:
                    videoId,

                createdAt:
                    firebase.firestore
                    .FieldValue
                    .serverTimestamp()
            });


            await videoRef.update({

                saves:
                    firebase.firestore
                    .FieldValue
                    .increment(1)
            });


            savedVideos.add(
                videoId
            );


            showToast(
                "সংরক্ষণ করা হয়েছে 🔖"
            );
        }


        updateLocalVideoCount(
            videoId,
            "saves",
            currentlySaved
                ? -1
                : 1
        );


    } catch (error) {

        console.error(
            "SAVE ERROR:",
            error
        );


        btn.classList.toggle(
            "saved",
            currentlySaved
        );


        countSpan.textContent =
            formatNumber(
                oldCount
            );


        showToast(
            "সংরক্ষণ হয়নি"
        );
    }


    btn.disabled = false;
}


/* =====================================================
   FOLLOW
===================================================== */

async function toggleFollow(btn) {

    if (!currentUser) {

        showToast(
            "লগইন করুন"
        );

        return;
    }


    if (btn.disabled) return;


    const targetUid =
        btn.dataset.uid;


    if (
        !targetUid ||
        targetUid === currentUser.uid
    ) {
        return;
    }


    btn.disabled = true;


    const currentlyFollowing =
        btn.classList.contains(
            "following"
        );


    try {

        const followRef =
            db.collection("follows")
            .doc(
                currentUser.uid +
                "_" +
                targetUid
            );


        if (currentlyFollowing) {

            await followRef.delete();


            followingUsers.delete(
                targetUid
            );


            btn.classList.remove(
                "following"
            );

            btn.textContent = "+";


            showToast(
                "আনফলো করা হয়েছে"
            );


        } else {

            await followRef.set({

                follower:
                    currentUser.uid,

                following:
                    targetUid,

                createdAt:
                    firebase.firestore
                    .FieldValue
                    .serverTimestamp()
            });


            followingUsers.add(
                targetUid
            );


            btn.classList.add(
                "following"
            );

            btn.textContent =
                "✓";


            showToast(
                "ফলো করা হয়েছে"
            );


            try {

                await db
                .collection(
                    "notifications"
                )
                .add({

                    toUserId:
                        targetUid,

                    fromUserId:
                        currentUser.uid,

                    fromUsername:
                        (
                            currentUserData &&
                            currentUserData.username
                        ) ||
                        "user",

                    fromPhotoURL:
                        (
                            currentUserData &&
                            currentUserData.photoURL
                        ) ||
                        "",

                    type:
                        "follow",

                    createdAt:
                        firebase.firestore
                        .FieldValue
                        .serverTimestamp(),

                    read:
                        false
                });

            } catch (notificationError) {

                console.error(
                    "Follow notification error:",
                    notificationError
                );
            }
        }

    } catch (error) {

        console.error(
            "FOLLOW ERROR:",
            error
        );

        showToast(
            "ফলো ব্যর্থ"
        );
    }


    btn.disabled = false;
}


/* =====================================================
   COMMENT OPEN
===================================================== */

function openComment(videoId) {

    if (!currentUser) {

        showToast(
            "লগইন করুন"
        );

        return;
    }


    currentVideoId =
        videoId;


    if (commentModal) {

        commentModal.classList.add(
            "open"
        );
    }


    loadComments(
        videoId
    );
}


/* =====================================================
   COMMENT CLOSE
===================================================== */

if (closeComment) {

    closeComment.addEventListener(
        "click",
        function () {

            commentModal.classList.remove(
                "open"
            );

            currentVideoId = null;
        }
    );
}


/* =====================================================
   LOAD COMMENTS
===================================================== */

async function loadComments(videoId) {

    if (!commentList) return;


    commentList.innerHTML =
        '<div style="text-align:center;color:#666;padding:20px;">' +
        "লোড হচ্ছে..." +
        "</div>";


    try {

        const snapshot =
            await db
            .collection("videos")
            .doc(videoId)
            .collection("comments")
            .orderBy(
                "createdAt",
                "desc"
            )
            .limit(50)
            .get();


        if (snapshot.empty) {

            commentList.innerHTML =
                '<div style="text-align:center;color:#666;padding:20px;">' +
                "কোনো মন্তব্য নেই" +
                "</div>";

            return;
        }


        commentList.innerHTML = "";


        snapshot.forEach(
            function (doc) {

                const data =
                    doc.data();


                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "comment-item";


                div.innerHTML =

                    '<div class="comment-user">' +
                    "@" +
                    escapeHtml(
                        data.username ||
                        "WWC User"
                    ) +
                    "</div>" +

                    '<div class="comment-text">' +
                    escapeHtml(
                        data.text ||
                        ""
                    ) +
                    "</div>";


                commentList.appendChild(
                    div
                );
            }
        );


    } catch (error) {

        console.error(
            "COMMENT LOAD ERROR:",
            error
        );


        commentList.innerHTML =
            '<div style="text-align:center;color:#f44336;padding:20px;">' +
            "মন্তব্য লোড হয়নি" +
            "</div>";
    }
}


/* =====================================================
   COMMENT SUBMIT
===================================================== */

if (commentSubmit) {

    commentSubmit.addEventListener(
        "click",
        submitComment
    );
}


if (commentInput) {

    commentInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                submitComment();
            }
        }
    );
}


async function submitComment() {

    if (
        !currentUser ||
        !currentVideoId ||
        !commentInput
    ) {
        return;
    }


    const text =
        commentInput.value.trim();


    if (!text) return;


    const username =
        (
            currentUserData &&
            currentUserData.username
        ) ||
        currentUser.displayName ||
        "user";


    try {

        const videoRef =
            db.collection("videos")
            .doc(currentVideoId);


        await videoRef
            .collection("comments")
            .add({

                uid:
                    currentUser.uid,

                username:
                    username,

                text:
                    text,

                createdAt:
                    firebase.firestore
                    .FieldValue
                    .serverTimestamp()
            });


        await videoRef.update({

            comments:
                firebase.firestore
                .FieldValue
                .increment(1)
        });


        commentInput.value = "";


        await loadComments(
            currentVideoId
        );


        /* ---------- UPDATE UI COUNT ---------- */

        const commentBtn =
            document.querySelector(
                '.comment-btn[data-video-id="' +
                currentVideoId +
                '"]'
            );


        if (commentBtn) {

            const countSpan =
                commentBtn.querySelector(
                    ".count"
                );


            if (countSpan) {

                const oldCount =
                    getCount(
                        countSpan
                    );


                countSpan.textContent =
                    formatNumber(
                        oldCount + 1
                    );
            }
        }


        updateLocalVideoCount(
            currentVideoId,
            "comments",
            1
        );


        showToast(
            "মন্তব্য যোগ হয়েছে 💬"
        );


    } catch (error) {

        console.error(
            "COMMENT ERROR:",
            error
        );

        showToast(
            "মন্তব্য ব্যর্থ"
        );
    }
}


/* =====================================================
   SHARE
===================================================== */

async function shareVideo(videoId) {

    const url =
        window.location.origin +
        window.location.pathname +
        "?video=" +
        encodeURIComponent(
            videoId
        );


    try {

        if (
            navigator.share
        ) {

            await navigator.share({

                title:
                    "WWC",

                text:
                    "এই ভিডিও দেখুন!",

                url:
                    url
            });

        } else {

            await navigator.clipboard.writeText(
                url
            );

            showToast(
                "লিংক কপি হয়েছে"
            );
        }

    } catch (error) {

        if (
            error.name !==
            "AbortError"
        ) {

            showToast(
                "শেয়ার ব্যর্থ"
            );
        }
    }
}


/* =====================================================
   VIDEO OBSERVER
===================================================== */

function setupVideoObserver() {

    const videos =
        document.querySelectorAll(
            ".video-card video"
        );


    if (!videos.length) {
        return;
    }


    if (videoObserver) {

        videoObserver.disconnect();
    }


    videoObserver =
        new IntersectionObserver(
            function (entries) {

                entries.forEach(
                    function (entry) {

                        const video =
                            entry.target;

                        const card =
                            video.closest(
                                ".video-card"
                            );


                        const disc =
                            card
                                ? card.querySelector(
                                    ".music-disc"
                                )
                                : null;


                        if (
                            entry.isIntersecting &&
                            entry.intersectionRatio >= 0.55
                        ) {

                            /*
                             * অন্য ভিডিও বন্ধ
                             */

                            document
                                .querySelectorAll(
                                    ".video-card video"
                                )
                                .forEach(
                                    function (otherVideo) {

                                        if (
                                            otherVideo !==
                                            video
                                        ) {

                                            otherVideo.pause();
                                        }
                                    }
                                );


                            video.play()
                                .then(
                                    function () {

                                        if (disc) {

                                            disc.classList.add(
                                                "spinning"
                                            );
                                        }
                                    }
                                )
                                .catch(
                                    function (error) {

                                        console.log(
                                            "Autoplay:",
                                            error
                                        );
                                    }
                                );

                        } else {

                            video.pause();


                            if (disc) {

                                disc.classList.remove(
                                    "spinning"
                                );
                            }
                        }
                    }
                );

            },
            {
                threshold: [
                    0.25,
                    0.55,
                    0.75
                ]
            }
        );


    videos.forEach(
        function (video) {

            videoObserver.observe(
                video
            );
        }
    );


    /*
     * প্রথম ভিডিও চালু
     */

    setTimeout(
        function () {

            if (
                videos[0] &&
                videos[0].paused
            ) {

                videos[0]
                    .play()
                    .catch(
                        function () {}
                    );
            }

        },
        500
    );
}


/* =====================================================
   MOBILE SWIPE NAVIGATION
===================================================== */

function setupSwipeNavigation() {

    if (!feed) return;


    let startY = 0;
    let startX = 0;

    let startTime = 0;


    /*
     * পুরোনো listener আটকানোর জন্য
     */

    if (feed._swipeReady) {
        return;
    }

    feed._swipeReady = true;


    feed.addEventListener(
        "touchstart",
        function (event) {

            if (
                event.touches.length !== 1
            ) {
                return;
            }


            startY =
                event.touches[0].clientY;

            startX =
                event.touches[0].clientX;

            startTime =
                Date.now();

        },
        {
            passive: true
        }
    );


    feed.addEventListener(
        "touchend",
        function (event) {

            if (
                event.changedTouches.length !== 1
            ) {
                return;
            }


            const endY =
                event.changedTouches[0].clientY;

            const endX =
                event.changedTouches[0].clientX;


            const diffY =
                startY - endY;

            const diffX =
                startX - endX;


            const duration =
                Date.now() -
                startTime;


            /*
             * Horizontal swipe হলে ignore
             */

            if (
                Math.abs(diffX) >
                Math.abs(diffY)
            ) {
                return;
            }


            /*
             * খুব ছোট movement ignore
             */

            if (
                Math.abs(diffY) < 60
            ) {
                return;
            }


            /*
             * খুব দ্রুত/অস্বাভাবিক gesture ignore
             */

            if (
                duration < 50
            ) {
                return;
            }


            if (
                isChangingVideo
            ) {
                return;
            }


            if (diffY > 0) {

                /*
                 * Swipe UP
                 * পরবর্তী ভিডিও
                 */

                scrollToNextVideo();

            } else {

                /*
                 * Swipe DOWN
                 * আগের ভিডিও
                 */

                scrollToPreviousVideo();
            }

        },
        {
            passive: true
        }
    );
}


/* =====================================================
   NEXT VIDEO
===================================================== */

function scrollToNextVideo() {

    if (!feed) return;


    const cards =
        Array.from(
            feed.querySelectorAll(
                ".video-card"
            )
        );


    if (!cards.length) return;


    const current =
        getCurrentVisibleCard(
            cards
        );


    let index =
        cards.indexOf(current);


    if (index < 0) {
        index = 0;
    }


    const next =
        cards[index + 1];


    if (!next) {
        return;
    }


    isChangingVideo = true;


    next.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    setTimeout(
        function () {

            isChangingVideo = false;

        },
        550
    );
}


/* =====================================================
   PREVIOUS VIDEO
===================================================== */

function scrollToPreviousVideo() {

    if (!feed) return;


    const cards =
        Array.from(
            feed.querySelectorAll(
                ".video-card"
            )
        );


    if (!cards.length) return;


    const current =
        getCurrentVisibleCard(
            cards
        );


    let index =
        cards.indexOf(current);


    if (index <= 0) {
        return;
    }


    const previous =
        cards[index - 1];


    isChangingVideo = true;


    previous.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    setTimeout(
        function () {

            isChangingVideo = false;

        },
        550
    );
}


/* =====================================================
   FIND CURRENT VIDEO
===================================================== */

function getCurrentVisibleCard(
    cards
) {

    let bestCard = cards[0];

    let bestVisibility = 0;


    cards.forEach(
        function (card) {

            const rect =
                card.getBoundingClientRect();


            const visibleTop =
                Math.max(
                    0,
                    rect.top
                );


            const visibleBottom =
                Math.min(
                    window.innerHeight,
                    rect.bottom
                );


            const visibleHeight =
                Math.max(
                    0,
                    visibleBottom -
                    visibleTop
                );


            const ratio =
                visibleHeight /
                Math.max(
                    1,
                    window.innerHeight
                );


            if (
                ratio >
                bestVisibility
            ) {

                bestVisibility =
                    ratio;

                bestCard =
                    card;
            }
        }
    );


    return bestCard;
}


/* =====================================================
   TAB BUTTONS
===================================================== */

document
    .querySelectorAll(
        ".tab-btn"
    )
    .forEach(
        function (btn) {

            btn.addEventListener(
                "click",
                function () {

                    document
                        .querySelectorAll(
                            ".tab-btn"
                        )
                        .forEach(
                            function (b) {

                                b.classList.remove(
                                    "active"
                                );
                            }
                        );


                    btn.classList.add(
                        "active"
                    );


                    currentFeed =
                        btn.dataset.tab ===
                        "following"

                            ? "following"

                            : "foryou";


                    renderFeed();
                }
            );
        }
    );


/* =====================================================
   SEARCH OPEN
===================================================== */

if (searchBtn) {

    searchBtn.addEventListener(
        "click",
        function () {

            searchOverlay.classList.add(
                "open"
            );

            setTimeout(
                function () {

                    searchInput.focus();

                },
                250
            );
        }
    );
}


/* =====================================================
   SEARCH CLOSE
===================================================== */

if (searchBack) {

    searchBack.addEventListener(
        "click",
        function () {

            searchOverlay.classList.remove(
                "open"
            );

            searchInput.value = "";

            searchResults.innerHTML =
                '<div style="text-align:center;color:#666;padding:20px;">' +
                "ইউজারনেম লিখে খুঁজুন" +
                "</div>";
        }
    );
}


/* =====================================================
   LOAD USERS FOR SEARCH
===================================================== */

async function fetchAllUsersForSearch() {

    if (allUsersCache) {

        return allUsersCache;
    }


    try {

        const snapshot =
            await db
            .collection("users")
            .limit(300)
            .get();


        allUsersCache = [];


        snapshot.forEach(
            function (doc) {

                allUsersCache.push({

                    uid:
                        doc.id,

                    ...doc.data()
                });
            }
        );


    } catch (error) {

        console.error(
            "Search users error:",
            error
        );

        allUsersCache = [];
    }


    return allUsersCache;
}


/* =====================================================
   SEARCH
===================================================== */

async function runUserSearch(query) {

    if (!searchResults) return;


    if (!query) {

        searchResults.innerHTML =
            '<div style="text-align:center;color:#666;padding:20px;">' +
            "খুঁজতে কিছু লিখুন" +
            "</div>";

        return;
    }


    searchResults.innerHTML =
        '<div style="text-align:center;color:#666;padding:20px;">' +
        '<i class="fas fa-spinner fa-spin"></i>' +
        "</div>";


    const q =
        query.toLowerCase();


    const users =
        await fetchAllUsersForSearch();


    const matchedUsers =
        users.filter(
            function (user) {

                const username =
                    (
                        user.username ||
                        ""
                    ).toLowerCase();


                const name =
                    (
                        user.name ||
                        user.displayName ||
                        ""
                    ).toLowerCase();


                const email =
                    (
                        user.email ||
                        ""
                    ).toLowerCase();


                return (
                    username.includes(q) ||
                    name.includes(q) ||
                    email.includes(q)
                );
            }
        );


    const matchedVideos =
        allVideos.filter(
            function (video) {

                const caption =
                    (
                        video.caption ||
                        ""
                    ).toLowerCase();


                const sound =
                    (
                        video.sound ||
                        ""
                    ).toLowerCase();


                const username =
                    (
                        video.username ||
                        ""
                    ).toLowerCase();


                return (
                    caption.includes(q) ||
                    sound.includes(q) ||
                    username.includes(q)
                );
            }
        );


    if (
        !matchedUsers.length &&
        !matchedVideos.length
    ) {

        searchResults.innerHTML =
            '<div style="text-align:center;color:#666;padding:20px;">' +
            "😕 কোনো ফলাফল পাওয়া যায়নি" +
            "</div>";

        return;
    }


    searchResults.innerHTML = "";


    /* ---------- USERS ---------- */

    if (matchedUsers.length) {

        const header =
            document.createElement(
                "div"
            );

        header.style.cssText =
            "padding:12px 16px 4px;" +
            "color:#666;" +
            "font-size:12px;" +
            "font-weight:700;";

        header.textContent =
            "ইউজার";

        searchResults.appendChild(
            header
        );


        matchedUsers.forEach(
            function (user) {

                const div =
                    document.createElement(
                        "div"
                    );

                div.className =
                    "search-result-item";


                const avatar =
                    user.photoURL ||
                    "./images/profile.png";


                div.innerHTML =

                    '<img src="' +
                    escapeAttr(avatar) +
                    '">' +

                    "<div>" +

                        '<div class="search-result-name">' +
                        "@" +
                        escapeHtml(
                            user.username ||
                            "user"
                        ) +
                        "</div>" +

                        (
                            user.name
                                ? '<div style="font-size:12px;color:#888;margin-top:2px;">' +
                                  escapeHtml(
                                      user.name
                                  ) +
                                  "</div>"
                                : ""
                        ) +

                    "</div>";


                div.addEventListener(
                    "click",
                    function () {

                        goToProfile(
                            user.uid
                        );
                    }
                );


                searchResults.appendChild(
                    div
                );
            }
        );
    }


    /* ---------- VIDEOS ---------- */

    if (matchedVideos.length) {

        const header =
            document.createElement(
                "div"
            );

        header.style.cssText =
            "padding:16px 16px 4px;" +
            "color:#666;" +
            "font-size:12px;" +
            "font-weight:700;";

        header.textContent =
            "ভিডিও";

        searchResults.appendChild(
            header
        );


        matchedVideos.forEach(
            function (video) {

                const div =
                    document.createElement(
                        "div"
                    );

                div.className =
                    "search-result-item";


                div.innerHTML =

                    '<div style="width:42px;height:42px;border-radius:8px;background:#1a1a1a;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +

                        '<i class="fas fa-play" style="color:#666;font-size:14px;"></i>' +

                    "</div>" +

                    '<div style="min-width:0;">' +

                        '<div class="search-result-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +

                            escapeHtml(
                                video.caption ||
                                "ক্যাপশন নেই"
                            ) +

                        "</div>" +

                        '<div style="font-size:12px;color:#888;margin-top:2px;">' +

                            "@" +
                            escapeHtml(
                                video.username ||
                                "user"
                            ) +

                        "</div>" +

                    "</div>";


                div.addEventListener(
                    "click",
                    function () {

                        goToVideo(
                            video.id
                        );
                    }
                );


                searchResults.appendChild(
                    div
                );
            }
        );
    }
}


/* =====================================================
   SEARCH INPUT
===================================================== */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function (event) {

            clearTimeout(
                searchDebounce
            );


            const query =
                event.target.value.trim();


            searchDebounce =
                setTimeout(
                    function () {

                        runUserSearch(
                            query
                        );

                    },
                    300
                );
        }
    );
}


/* =====================================================
   GO TO VIDEO
===================================================== */

function goToVideo(videoId) {

    if (searchOverlay) {

        searchOverlay.classList.remove(
            "open"
        );
    }


    const target =
        document.querySelector(
            '.video-card[data-video-id="' +
            videoId +
            '"]'
        );


    if (target) {

        target.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"
        });

    } else {

        showToast(
            "ভিডিওটি ফিডে লোড নেই"
        );
    }
}


/* =====================================================
   GO TO PROFILE
===================================================== */

function goToProfile(uid) {

    if (!uid) return;


    window.location.href =
        "public/js/profile.html?uid=" +
        encodeURIComponent(uid);
}


/* =====================================================
   UPDATE LOCAL COUNT
===================================================== */

function updateLocalVideoCount(
    videoId,
    field,
    amount
) {

    const video =
        allVideos.find(
            function (item) {

                return item.id === videoId;
            }
        );


    if (!video) return;


    video[field] =
        Math.max(
            0,
            Number(
                video[field] || 0
            ) + amount
        );
}


/* =====================================================
   GET COUNT
===================================================== */

function getCount(span) {

    if (!span) {
        return 0;
    }


    const text =
        span.textContent || "0";


    /*
     * K / M count এখানে দরকার হলে
     * approximate করা হচ্ছে।
     */

    const clean =
        text
            .trim()
            .toUpperCase();


    if (
        clean.endsWith("M")
    ) {

        return Math.round(
            parseFloat(
                clean
                    .replace("M", "")
            ) * 1000000
        );
    }


    if (
        clean.endsWith("K")
    ) {

        return Math.round(
            parseFloat(
                clean
                    .replace("K", "")
            ) * 1000
        );
    }


    return (
        parseInt(
            clean.replace(
                /[^\d]/g,
                ""
            )
        ) || 0
    );
}


/* =====================================================
   FORMAT NUMBER
===================================================== */

function formatNumber(num) {

    num =
        Number(num) || 0;


    if (
        num >= 1000000
    ) {

        return (
            num / 1000000
        ).toFixed(1) + "M";
    }


    if (
        num >= 1000
    ) {

        return (
            num / 1000
        ).toFixed(1) + "K";
    }


    return String(num);
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(text) {

    if (
        text === null ||
        text === undefined
    ) {
        return "";
    }


    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(text);


    return div.innerHTML;
}


/* =====================================================
   ESCAPE ATTRIBUTE
===================================================== */

function escapeAttr(text) {

    if (
        text === null ||
        text === undefined
    ) {
        return "";
    }


    return String(text)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#39;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );
}


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

    let toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "toast";


        toast.style.cssText =
            "position:fixed;" +
            "bottom:110px;" +
            "left:50%;" +
            "transform:translateX(-50%);" +
            "background:rgba(30,30,30,0.95);" +
            "color:#fff;" +
            "padding:10px 24px;" +
            "border-radius:24px;" +
            "font-size:14px;" +
            "z-index:999;" +
            "opacity:0;" +
            "transition:opacity 0.25s;" +
            "pointer-events:none;" +
            "white-space:nowrap;" +
            "border:1px solid rgba(255,255,255,0.1);";


        document.body.appendChild(
            toast
        );
    }


    toast.textContent =
        message;


    toast.style.opacity =
        "1";


    clearTimeout(
        toast._timer
    );


    toast._timer =
        setTimeout(
            function () {

                toast.style.opacity =
                    "0";

            },
            2500
        );
}


/* =====================================================
   INITIAL LOG
===================================================== */

console.log(
    "WWC FINAL APP LOADED"
);
