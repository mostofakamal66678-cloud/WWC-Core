// ========================================
// WWC - COMPLETE VIDEO FEED APP
// Like + Save + Comment + Follow
// Counter + Scroll + Auto Play + Search
// ========================================

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


// ========================================
// AUTH
// ========================================

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

        console.error("WWC startup error:", error);

        if (feed) {

            feed.innerHTML =
                '<div class="feed-loading error">' +
                'অ্যাপ লোড করতে সমস্যা হয়েছে' +
                '</div>';

        }
    }
});


// ========================================
// CURRENT USER PROFILE
// ========================================

async function loadCurrentUserProfile() {

    try {

        const ref = db
            .collection("users")
            .doc(currentUser.uid);

        const snap = await ref.get();

        if (snap.exists) {

            currentUserData = snap.data();

        } else {

            const username =
                currentUser.displayName ||
                ("wwc_" + currentUser.uid.substring(0, 8));

            currentUserData = {

                uid: currentUser.uid,

                username: username,

                displayName:
                    currentUser.displayName ||
                    "WWC User",

                email:
                    currentUser.email ||
                    "",

                photoURL:
                    currentUser.photoURL ||
                    "",

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
            "Profile error:",
            error
        );

        currentUserData = {

            uid: currentUser.uid,

            username:
                currentUser.displayName ||
                "wwc_user",

            displayName:
                currentUser.displayName ||
                "WWC User",

            photoURL:
                currentUser.photoURL ||
                ""
        };
    }
}


// ========================================
// LOAD USER DATA
// ========================================

async function loadUserData() {

    likedVideos.clear();
    savedVideos.clear();
    followingUsers.clear();

    try {

        // -------------------------------
        // LIKES
        // -------------------------------

        const likesSnap = await db
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


        // -------------------------------
        // SAVES
        // -------------------------------

        const savesSnap = await db
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


        // -------------------------------
        // FOLLOWS
        // -------------------------------

        const followsSnap = await db
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


// ========================================
// LOAD VIDEOS
// ========================================

async function loadVideos() {

    if (!feed) return;

    feed.innerHTML =
        '<div class="feed-loading">' +
        'ভিডিও লোড হচ্ছে...' +
        '</div>';

    try {

        const snapshot = await db
            .collection("videos")
            .orderBy(
                "createdAt",
                "desc"
            )
            .limit(50)
            .get();

        allVideos = [];

        snapshot.forEach(function (doc) {

            const data = doc.data();

            const video = {

                id: doc.id,

                ...data
            };

            if (!video.uid) {

                video.uid =
                    video.userId ||
                    "";
            }

            if (!video.likes) {

                video.likes = 0;
            }

            if (!video.comments) {

                video.comments = 0;
            }

            if (!video.saves) {

                video.saves = 0;
            }

            allVideos.push(video);
        });


        if (!allVideos.length) {

            feed.innerHTML =
                '<div class="feed-loading">' +
                'এখনো কোনো ভিডিও নেই' +
                '</div>';

            return;
        }


        renderFeed();

    } catch (error) {

        console.error(
            "Video loading error:",
            error
        );

        feed.innerHTML =
            '<div class="feed-loading error">' +
            'ভিডিও লোড হয়নি। Firebase Rules এবং createdAt চেক করুন।' +
            '</div>';
    }
}


// ========================================
// RENDER FEED
// ========================================

function renderFeed() {

    if (!feed) return;

    let videos = allVideos;


    if (currentFeed === "following") {

        videos = allVideos.filter(
            function (video) {

                return followingUsers.has(
                    video.uid
                );
            }
        );
    }


    if (!videos.length) {

        feed.innerHTML =
            '<div class="feed-loading">' +
            (
                currentFeed === "following"
                    ? "আপনি এখনো কাউকে Follow করেননি"
                    : "কোনো ভিডিও পাওয়া যায়নি"
            ) +
            '</div>';

        return;
    }


    feed.innerHTML = "";


    videos.forEach(function (video) {

        feed.appendChild(
            createVideoCard(video)
        );
    });


    setupVideoObserver();

    setupFeedTouch();
}


// ========================================
// CREATE VIDEO CARD
// ========================================

function createVideoCard(video) {

    const card =
        document.createElement("div");

    card.className =
        "video-card";

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


    let followHTML = "";


    if (
        uid &&
        uid !== currentUser.uid
    ) {

        followHTML =
            '<button class="follow-btn ' +
            (
                isFollowing
                    ? "following"
                    : ""
            ) +
            '" data-uid="' +
            escapeAttribute(uid) +
            '">' +
            (
                isFollowing
                    ? "✓"
                    : "+"
            ) +
            "</button>";
    }


    card.innerHTML =

        // VIDEO
        '<video ' +
        'src="' +
        escapeAttribute(videoUrl) +
        '" ' +
        'loop ' +
        'muted ' +
        'playsinline ' +
        'preload="metadata">' +
        "</video>" +


        // MUTE
        '<div class="mute-indicator">' +
        '<i class="fas fa-volume-mute"></i>' +
        "</div>" +


        // SIDE ACTIONS
        '<div class="side-actions">' +


        // PROFILE
        '<div class="profile-pic-wrap">' +

        '<img ' +
        'class="profile-pic" ' +
        'src="' +
        escapeAttribute(photoUrl) +
        '" ' +
        'data-uid="' +
        escapeAttribute(uid) +
        '" ' +
        'onerror="this.src=\'./images/profile.png\'">' +

        followHTML +

        "</div>" +


        // LIKE
        '<button ' +
        'class="action-btn like-btn ' +
        (
            isLiked
                ? "liked"
                : ""
        ) +
        '" ' +
        'data-video-id="' +
        escapeAttribute(video.id) +
        '">' +

        '<i class="fas fa-heart"></i>' +

        '<span class="count">' +
        formatNumber(video.likes) +
        "</span>" +

        "</button>" +


        // COMMENT
        '<button ' +
        'class="action-btn comment-btn" ' +
        'data-video-id="' +
        escapeAttribute(video.id) +
        '">' +

        '<i class="fas fa-comment"></i>' +

        '<span class="count">' +
        formatNumber(video.comments) +
        "</span>" +

        "</button>" +


        // SAVE
        '<button ' +
        'class="action-btn save-btn ' +
        (
            isSaved
                ? "saved"
                : ""
        ) +
        '" ' +
        'data-video-id="' +
        escapeAttribute(video.id) +
        '">' +

        '<i class="fas fa-bookmark"></i>' +

        '<span class="count">' +
        formatNumber(video.saves) +
        "</span>" +

        "</button>" +


        // SHARE
        '<button ' +
        'class="action-btn share-btn" ' +
        'data-video-id="' +
        escapeAttribute(video.id) +
        '">' +

        '<i class="fas fa-share"></i>' +

        "<span>শেয়ার</span>" +

        "</button>" +


        // MUSIC
        '<div class="music-disc">' +
        '<i class="fas fa-music"></i>' +
        "</div>" +


        "</div>" +


        // BOTTOM INFO
        '<div class="bottom-info">' +

        '<span ' +
        'class="username" ' +
        'data-uid="' +
        escapeAttribute(uid) +
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


    const videoEl =
        card.querySelector("video");


    const muteIndicator =
        card.querySelector(
            ".mute-indicator"
        );


    // -------------------------------
    // VIDEO CLICK = MUTE / UNMUTE
    // -------------------------------

    videoEl.addEventListener(
        "click",
        function (e) {

            e.stopPropagation();

            videoEl.muted =
                !videoEl.muted;


            muteIndicator.innerHTML =
                videoEl.muted
                    ? '<i class="fas fa-volume-mute"></i>'
                    : '<i class="fas fa-volume-up"></i>';


            muteIndicator.classList.add(
                "show"
            );


            setTimeout(
                function () {

                    muteIndicator.classList.remove(
                        "show"
                    );

                },
                700
            );
        }
    );


    // -------------------------------
    // DOUBLE CLICK LIKE
    // -------------------------------

    videoEl.addEventListener(
        "dblclick",
        function (e) {

            e.preventDefault();

            e.stopPropagation();

            const likeBtn =
                card.querySelector(
                    ".like-btn"
                );

            if (likeBtn) {

                toggleLike(
                    likeBtn
                );
            }
        }
    );


    // -------------------------------
    // PROFILE
    // -------------------------------

    card.querySelectorAll(
        "[data-uid]"
    ).forEach(
        function (element) {

            element.addEventListener(
                "click",
                function (e) {

                    e.stopPropagation();

                    const targetUid =
                        element.getAttribute(
                            "data-uid"
                        );

                    if (targetUid) {

                        goToProfile(
                            targetUid
                        );
                    }
                }
            );
        }
    );


    // -------------------------------
    // LIKE
    // -------------------------------

    const likeBtn =
        card.querySelector(
            ".like-btn"
        );

    if (likeBtn) {

        likeBtn.addEventListener(
            "click",
            function (e) {

                e.stopPropagation();

                toggleLike(
                    likeBtn
                );
            }
        );
    }


    // -------------------------------
    // COMMENT
    // -------------------------------

    const commentBtn =
        card.querySelector(
            ".comment-btn"
        );

    if (commentBtn) {

        commentBtn.addEventListener(
            "click",
            function (e) {

                e.stopPropagation();

                openComment(
                    commentBtn.dataset.videoId
                );
            }
        );
    }


    // -------------------------------
    // SAVE
    // -------------------------------

    const saveBtn =
        card.querySelector(
            ".save-btn"
        );

    if (saveBtn) {

        saveBtn.addEventListener(
            "click",
            function (e) {

                e.stopPropagation();

                toggleSave(
                    saveBtn
                );
            }
        );
    }


    // -------------------------------
    // SHARE
    // -------------------------------

    const shareBtn =
        card.querySelector(
            ".share-btn"
        );

    if (shareBtn) {

        shareBtn.addEventListener(
            "click",
            function (e) {

                e.stopPropagation();

                shareVideo(
                    shareBtn.dataset.videoId
                );
            }
        );
    }


    // -------------------------------
    // FOLLOW
    // -------------------------------

    const followBtn =
        card.querySelector(
            ".follow-btn"
        );

    if (followBtn) {

        followBtn.addEventListener(
            "click",
            function (e) {

                e.stopPropagation();

                toggleFollow(
                    followBtn
                );
            }
        );
    }


    return card;
}


// ========================================
// LIKE
// ========================================

async function toggleLike(btn) {

    if (!currentUser) {

        showToast("লগইন করুন");

        return;
    }


    if (btn.disabled) return;


    btn.disabled = true;


    const videoId =
        btn.dataset.videoId;


    const countSpan =
        btn.querySelector(".count");


    const isLiked =
        btn.classList.contains("liked");


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


    try {

        const videoSnap =
            await videoRef.get();


        if (!videoSnap.exists) {

            throw new Error(
                "Video does not exist"
            );
        }


        const videoData =
            videoSnap.data();


        const oldCount =
            Number(videoData.likes) || 0;


        if (isLiked) {

            // -------------------------
            // REMOVE LIKE
            // -------------------------

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


            btn.classList.remove(
                "liked"
            );


            countSpan.textContent =
                formatNumber(
                    Math.max(
                        0,
                        oldCount - 1
                    )
                );


            updateLocalVideoCount(
                videoId,
                "likes",
                Math.max(
                    0,
                    oldCount - 1
                )
            );


        } else {

            // -------------------------
            // ADD LIKE
            // -------------------------

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


            btn.classList.add(
                "liked"
            );


            countSpan.textContent =
                formatNumber(
                    oldCount + 1
                );


            updateLocalVideoCount(
                videoId,
                "likes",
                oldCount + 1
            );


            // notification
            if (
                videoData.uid &&
                videoData.uid !==
                currentUser.uid
            ) {

                try {

                    await db
                        .collection(
                            "notifications"
                        )
                        .add({

                            toUserId:
                                videoData.uid,

                            fromUserId:
                                currentUser.uid,

                            fromUsername:
                                getCurrentUsername(),

                            fromPhotoURL:
                                getCurrentPhoto(),

                            type:
                                "like",

                            videoId:
                                videoId,

                            createdAt:
                                firebase.firestore
                                .FieldValue
                                .serverTimestamp(),

                            read:
                                false
                        });

                } catch (notificationError) {

                    console.log(
                        "Notification skipped"
                    );
                }
            }
        }


    } catch (error) {

        console.error(
            "LIKE ERROR:",
            error
        );


        showToast(
            "লাইক সংরক্ষণ হয়নি। Firebase Rules চেক করুন।"
        );
    }


    btn.disabled = false;
}


// ========================================
// SAVE
// ========================================

async function toggleSave(btn) {

    if (!currentUser) {

        showToast("লগইন করুন");

        return;
    }


    if (btn.disabled) return;


    btn.disabled = true;


    const videoId =
        btn.dataset.videoId;


    const countSpan =
        btn.querySelector(".count");


    const isSaved =
        btn.classList.contains("saved");


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


    try {

        const videoSnap =
            await videoRef.get();


        if (!videoSnap.exists) {

            throw new Error(
                "Video not found"
            );
        }


        const videoData =
            videoSnap.data();


        const oldCount =
            Number(videoData.saves) || 0;


        if (isSaved) {

            // -------------------------
            // REMOVE SAVE
            // -------------------------

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


            btn.classList.remove(
                "saved"
            );


            countSpan.textContent =
                formatNumber(
                    Math.max(
                        0,
                        oldCount - 1
                    )
                );


            updateLocalVideoCount(
                videoId,
                "saves",
                Math.max(
                    0,
                    oldCount - 1
                )
            );


            showToast(
                "সংরক্ষণ থেকে সরানো হয়েছে"
            );


        } else {

            // -------------------------
            // ADD SAVE
            // -------------------------

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


            btn.classList.add(
                "saved"
            );


            countSpan.textContent =
                formatNumber(
                    oldCount + 1
                );


            updateLocalVideoCount(
                videoId,
                "saves",
                oldCount + 1
            );


            showToast(
                "ভিডিও সংরক্ষণ করা হয়েছে"
            );
        }


    } catch (error) {

        console.error(
            "SAVE ERROR:",
            error
        );


        showToast(
            "সংরক্ষণ হয়নি। Firebase Rules চেক করুন।"
        );
    }


    btn.disabled = false;
}


// ========================================
// FOLLOW
// ========================================

async function toggleFollow(btn) {

    if (!currentUser) {

        showToast("লগইন করুন");

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


    const isFollowing =
        btn.classList.contains(
            "following"
        );


    const followRef =
        db.collection("follows")
        .doc(
            currentUser.uid +
            "_" +
            targetUid
        );


    try {

        if (isFollowing) {

            await followRef.delete();


            followingUsers.delete(
                targetUid
            );


            btn.classList.remove(
                "following"
            );


            btn.textContent =
                "+";


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
                            getCurrentUsername(),

                        fromPhotoURL:
                            getCurrentPhoto(),

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

                console.log(
                    "Follow notification skipped"
                );
            }
        }


    } catch (error) {

        console.error(
            "FOLLOW ERROR:",
            error
        );


        showToast(
            "ফলো সংরক্ষণ হয়নি"
        );
    }


    btn.disabled = false;
}


// ========================================
// COMMENTS - OPEN
// ========================================

function openComment(videoId) {

    if (!currentUser) {

        showToast("লগইন করুন");

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


// ========================================
// CLOSE COMMENT
// ========================================

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


// ========================================
// LOAD COMMENTS
// ========================================

async function loadComments(videoId) {

    if (!commentList) return;


    commentList.innerHTML =
        '<div style="text-align:center;color:#666;padding:25px;">' +
        "মন্তব্য লোড হচ্ছে..." +
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
                '<div style="text-align:center;color:#666;padding:25px;">' +
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
            '<div style="text-align:center;color:#f44336;padding:25px;">' +
            "মন্তব্য লোড হয়নি" +
            "</div>";
    }
}


// ========================================
// COMMENT SUBMIT
// ========================================

if (commentSubmit) {

    commentSubmit.addEventListener(
        "click",
        submitComment
    );
}


if (commentInput) {

    commentInput.addEventListener(
        "keydown",
        function (e) {

            if (e.key === "Enter") {

                e.preventDefault();

                submitComment();
            }
        }
    );
}


// ========================================
// SUBMIT COMMENT
// ========================================

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
        getCurrentUsername();


    const videoId =
        currentVideoId;


    try {

        const videoRef =
            db.collection("videos")
            .doc(videoId);


        const commentRef =
            videoRef
                .collection("comments")
                .doc();


        // Add comment
        await commentRef.set({

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


        // Increase counter
        await videoRef.update({

            comments:
                firebase.firestore
                .FieldValue
                .increment(1)
        });


        commentInput.value = "";


        await loadComments(
            videoId
        );


        updateCommentCounter(
            videoId
        );


        showToast(
            "মন্তব্য যোগ হয়েছে"
        );


        // notification
        try {

            const videoSnap =
                await videoRef.get();


            if (videoSnap.exists) {

                const videoData =
                    videoSnap.data();


                if (
                    videoData.uid &&
                    videoData.uid !==
                    currentUser.uid
                ) {

                    await db
                        .collection(
                            "notifications"
                        )
                        .add({

                            toUserId:
                                videoData.uid,

                            fromUserId:
                                currentUser.uid,

                            fromUsername:
                                username,

                            fromPhotoURL:
                                getCurrentPhoto(),

                            type:
                                "comment",

                            text:
                                text,

                            videoId:
                                videoId,

                            createdAt:
                                firebase.firestore
                                .FieldValue
                                .serverTimestamp(),

                            read:
                                false
                        });
                }
            }

        } catch (notificationError) {

            console.log(
                "Comment notification skipped"
            );
        }


    } catch (error) {

        console.error(
            "COMMENT ERROR:",
            error
        );


        showToast(
            "মন্তব্য সংরক্ষণ হয়নি। Firebase Rules চেক করুন।"
        );
    }
}


// ========================================
// UPDATE COMMENT COUNTER
// ========================================

function updateCommentCounter(videoId) {

    const btn =
        document.querySelector(
            '.comment-btn[data-video-id="' +
            cssEscape(videoId) +
            '"]'
        );


    if (!btn) return;


    const span =
        btn.querySelector(
            ".count"
        );


    if (!span) return;


    const video =
        allVideos.find(
            function (v) {

                return v.id === videoId;
            }
        );


    if (!video) return;


    video.comments =
        Number(video.comments || 0) + 1;


    span.textContent =
        formatNumber(
            video.comments
        );
}


// ========================================
// SHARE
// ========================================

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
                    "WWC - World Wide Connect",

                text:
                    "এই ভিডিওটি দেখুন!",

                url:
                    url
            });

        } else {

            await navigator.clipboard.writeText(
                url
            );

            showToast(
                "ভিডিও লিংক কপি হয়েছে"
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


// ========================================
// SEARCH OPEN
// ========================================

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


// ========================================
// SEARCH CLOSE
// ========================================

if (searchBack) {

    searchBack.addEventListener(
        "click",
        function () {

            searchOverlay.classList.remove(
                "open"
            );

            searchInput.value = "";

            searchResults.innerHTML =
                '<div class="feed-loading" style="height:auto;padding:30px;">' +
                "ইউজারনেম লিখে খুঁজুন" +
                "</div>";
        }
    );
}


// ========================================
// SEARCH USERS
// ========================================

async function fetchAllUsersForSearch() {

    if (allUsersCache) {

        return allUsersCache;
    }


    try {

        const snap =
            await db
                .collection("users")
                .limit(300)
                .get();


        allUsersCache = [];


        snap.forEach(
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


// ========================================
// RUN SEARCH
// ========================================

async function runUserSearch(query) {

    if (!searchResults) return;


    if (!query) {

        searchResults.innerHTML =
            '<div style="text-align:center;color:#666;padding:25px;">' +
            "খুঁজতে কিছু লিখুন" +
            "</div>";

        return;
    }


    searchResults.innerHTML =
        '<div style="text-align:center;color:#666;padding:25px;">' +
        '<i class="fas fa-spinner fa-spin"></i>' +
        "</div>";


    const q =
        query.toLowerCase();


    const users =
        await fetchAllUsersForSearch();


    const matchedUsers =
        users.filter(
            function (u) {

                const username =
                    (
                        u.username ||
                        ""
                    ).toLowerCase();


                const name =
                    (
                        u.name ||
                        u.displayName ||
                        ""
                    ).toLowerCase();


                const email =
                    (
                        u.email ||
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
            function (v) {

                const caption =
                    (
                        v.caption ||
                        ""
                    ).toLowerCase();


                const sound =
                    (
                        v.sound ||
                        ""
                    ).toLowerCase();


                const username =
                    (
                        v.username ||
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
            '<div style="text-align:center;color:#666;padding:25px;">' +
            "😕 কোনো ফলাফল পাওয়া যায়নি" +
            "</div>";

        return;
    }


    searchResults.innerHTML = "";


    // USERS
    if (matchedUsers.length) {

        const header =
            document.createElement(
                "div"
            );

        header.style.cssText =
            "padding:14px 16px 5px;color:#777;font-size:12px;font-weight:700;";

        header.textContent =
            "ইউজার";

        searchResults.appendChild(
            header
        );


        matchedUsers.forEach(
            function (u) {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "search-result-item";


                const avatar =
                    u.photoURL ||
                    "./images/profile.png";


                div.innerHTML =

                    '<img src="' +
                    escapeAttribute(
                        avatar
                    ) +
                    '" onerror="this.src=\'./images/profile.png\'">' +

                    "<div>" +

                    '<div class="search-result-name">' +
                    "@" +
                    escapeHtml(
                        u.username ||
                        "user"
                    ) +
                    "</div>" +

                    (
                        u.name
                            ? '<div style="font-size:12px;color:#888;margin-top:2px;">' +
                              escapeHtml(
                                  u.name
                              ) +
                              "</div>"
                            : ""
                    ) +

                    "</div>";


                div.addEventListener(
                    "click",
                    function () {

                        goToProfile(
                            u.uid
                        );
                    }
                );


                searchResults.appendChild(
                    div
                );
            }
        );
    }


    // VIDEOS
    if (matchedVideos.length) {

        const header =
            document.createElement(
                "div"
            );


        header.style.cssText =
            "padding:16px 16px 5px;color:#777;font-size:12px;font-weight:700;";


        header.textContent =
            "ভিডিও";


        searchResults.appendChild(
            header
        );


        matchedVideos.forEach(
            function (v) {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "search-result-item";


                div.innerHTML =

                    '<div style="width:44px;height:44px;border-radius:8px;background:#1b1b1b;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +

                    '<i class="fas fa-play" style="color:#777;"></i>' +

                    "</div>" +

                    '<div style="min-width:0;">' +

                    '<div class="search-result-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +

                    escapeHtml(
                        v.caption ||
                        "ক্যাপশন নেই"
                    ) +

                    "</div>" +

                    '<div style="font-size:12px;color:#888;margin-top:2px;">@' +

                    escapeHtml(
                        v.username ||
                        "user"
                    ) +

                    "</div>" +

                    "</div>";


                div.addEventListener(
                    "click",
                    function () {

                        goToVideo(
                            v.id
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


// ========================================
// SEARCH INPUT
// ========================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function (e) {

            clearTimeout(
                searchDebounce
            );


            const query =
                e.target.value.trim();


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


// ========================================
// TABS
// ========================================

document
    .querySelectorAll(".tab-btn")
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


// ========================================
// VIDEO OBSERVER
// ========================================

function setupVideoObserver() {

    const videos =
        document.querySelectorAll(
            ".video-card video"
        );


    if (!videos.length) return;


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
                            entry.intersectionRatio >=
                                0.55
                        ) {

                            // Pause all other videos

                            document
                                .querySelectorAll(
                                    ".video-card video"
                                )
                                .forEach(
                                    function (v) {

                                        if (
                                            v !==
                                            video
                                        ) {

                                            v.pause();
                                        }
                                    }
                                );


                            video
                                .play()
                                .then(
                                    function () {}
                                )
                                .catch(
                                    function () {}
                                );


                            if (disc) {

                                disc.classList.add(
                                    "spinning"
                                );
                            }

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
                    0,
                    0.55,
                    0.8,
                    1
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


    // First video

    setTimeout(
        function () {

            if (videos[0]) {

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


// ========================================
// FEED TOUCH / SCROLL
// ========================================

function setupFeedTouch() {

    if (!feed) return;


    let startY = 0;
    let startTime = 0;


    feed.addEventListener(
        "touchstart",
        function (e) {

            if (!e.touches.length)
                return;


            startY =
                e.touches[0].clientY;


            startTime =
                Date.now();

        },
        {
            passive: true
        }
    );


    feed.addEventListener(
        "touchend",
        function (e) {

            if (!e.changedTouches.length)
                return;


            const endY =
                e.changedTouches[0].clientY;


            const diff =
                startY - endY;


            const elapsed =
                Date.now() - startTime;


            // Strong swipe

            if (
                Math.abs(diff) > 60 &&
                elapsed < 900
            ) {

                const cards =
                    Array.from(
                        feed.querySelectorAll(
                            ".video-card"
                        )
                    );


                if (!cards.length)
                    return;


                let currentIndex =
                    getCurrentCardIndex(
                        cards
                    );


                if (diff > 0) {

                    // SWIPE UP

                    currentIndex =
                        Math.min(
                            currentIndex + 1,
                            cards.length - 1
                        );

                } else {

                    // SWIPE DOWN

                    currentIndex =
                        Math.max(
                            currentIndex - 1,
                            0
                        );
                }


                if (cards[currentIndex]) {

                    cards[currentIndex].scrollIntoView(
                        {
                            behavior: "smooth",
                            block: "start"
                        }
                    );
                }
            }

        },
        {
            passive: true
        }
    );
}


// ========================================
// GET CURRENT CARD
// ========================================

function getCurrentCardIndex(cards) {

    let bestIndex = 0;

    let bestDistance =
        Infinity;


    const feedTop =
        feed.getBoundingClientRect().top;


    cards.forEach(
        function (card, index) {

            const rect =
                card.getBoundingClientRect();


            const distance =
                Math.abs(
                    rect.top -
                    feedTop
                );


            if (
                distance <
                bestDistance
            ) {

                bestDistance =
                    distance;

                bestIndex =
                    index;
            }
        }
    );


    return bestIndex;
}


// ========================================
// GO TO VIDEO
// ========================================

function goToVideo(videoId) {

    if (searchOverlay) {

        searchOverlay.classList.remove(
            "open"
        );
    }


    const target =
        document.querySelector(
            '.video-card[data-video-id="' +
            cssEscape(videoId) +
            '"]'
        );


    if (target) {

        target.scrollIntoView(
            {
                behavior: "smooth",
                block: "start"
            }
        );

    } else {

        showToast(
            "ভিডিওটি এখন ফিডে নেই"
        );
    }
}


// ========================================
// GO TO PROFILE
// ========================================

function goToProfile(uid) {

    if (!uid) return;


    window.location.href =
        "public/js/profile.html?uid=" +
        encodeURIComponent(uid);
}


// ========================================
// UPDATE LOCAL VIDEO COUNT
// ========================================

function updateLocalVideoCount(
    videoId,
    field,
    value
) {

    const video =
        allVideos.find(
            function (v) {

                return v.id === videoId;
            }
        );


    if (video) {

        video[field] =
            Number(value) || 0;
    }
}


// ========================================
// CURRENT USERNAME
// ========================================

function getCurrentUsername() {

    return (
        currentUserData &&
        (
            currentUserData.username ||
            currentUserData.displayName
        )
    ) ||
        currentUser.displayName ||
        "user";
}


// ========================================
// CURRENT PHOTO
// ========================================

function getCurrentPhoto() {

    return (
        currentUserData &&
        currentUserData.photoURL
    ) ||
        currentUser.photoURL ||
        "";
}


// ========================================
// FORMAT NUMBER
// ========================================

function formatNumber(num) {

    num =
        Number(num) || 0;


    if (num >= 1000000) {

        return (
            num / 1000000
        ).toFixed(1) + "M";
    }


    if (num >= 1000) {

        return (
            num / 1000
        ).toFixed(1) + "K";
    }


    return String(num);
}


// ========================================
// ESCAPE HTML
// ========================================

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


// ========================================
// ESCAPE ATTRIBUTE
// ========================================

function escapeAttribute(text) {

    if (
        text === null ||
        text === undefined
    ) {

        return "";
    }


    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


// ========================================
// CSS ESCAPE
// ========================================

function cssEscape(text) {

    if (
        window.CSS &&
        typeof window.CSS.escape ===
            "function"
    ) {

        return window.CSS.escape(
            String(text)
        );
    }


    return String(text).replace(
        /["\\]/g,
        "\\$&"
    );
}


// ========================================
// TOAST
// ========================================

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


// ========================================
// DEBUG
// ========================================

console.log(
    "WWC COMPLETE APP LOADED"
);
