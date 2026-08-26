import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";


// =====================================================
// 🔥 FIREBASE
// =====================================================

const firebaseConfig = {
    apiKey: "AIzaSyCgj017aPEfR7d6juqhJn3y1MF6SW_t04",
    authDomain: "world-wide-connect-62c87.firebaseapp.com",
    projectId: "world-wide-connect-62c87",
    storageBucket: "world-wide-connect-62c87.firebasestorage.app",
    messagingSenderId: "931784536688",
    appId: "1:931784536688:web:634f69070a082677445031",
    measurementId: "G-R2L5YXQPH"
};

const app = getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);


// =====================================================
// 🎬 WWC VIDEO SYSTEM
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    const videoItems = Array.from(
        document.querySelectorAll(".video-item")
    );

    const videos = videoItems
        .map(item => item.querySelector("video"))
        .filter(Boolean);

    if (videos.length === 0) {
        console.warn("⚠️ কোনো ভিডিও পাওয়া যায়নি।");
        return;
    }


    // =================================================
    // STATE
    // =================================================

    let current = 0;
    let isMoving = false;

    let touchStartY = 0;
    let touchStartX = 0;

    let currentUser = null;


    // =================================================
    // 👤 AUTH STATE
    // =================================================

    onAuthStateChanged(auth, async (user) => {

        currentUser = user || null;

        if (currentUser) {
            await loadSavedVideos();
        }

    });


    // =================================================
    // 🎬 VIDEO ID
    // =================================================

    function getVideoId(index) {

        const item = videoItems[index];

        if (!item) {
            return `video${index + 1}`;
        }

        return (
            item.dataset.videoId ||
            item.getAttribute("data-id") ||
            videos[index].dataset.videoId ||
            `video${index + 1}`
        );
    }


    // =================================================
    // 🎬 STOP ALL VIDEOS
    // =================================================

    function stopAllVideos() {

        videos.forEach(video => {

            try {
                video.pause();
                video.currentTime = video.currentTime;
            } catch (error) {
                console.warn(error);
            }

        });

    }


    // =================================================
    // ▶️ PLAY CURRENT VIDEO
    // =================================================

    function playVideo(index) {

        if (!videos[index]) return;

        stopAllVideos();

        current = index;

        const video = videos[current];

        video.muted = true;

        const playPromise = video.play();

        if (playPromise !== undefined) {

            playPromise.catch(() => {
                // Browser autoplay block করলে এখানে error দেখাব না
            });

        }

    }


    // =================================================
    // 📍 SCROLL TO VIDEO
    // =================================================

    function scrollToVideo(index) {

        if (
            index < 0 ||
            index >= videoItems.length ||
            isMoving
        ) {
            return;
        }

        isMoving = true;

        current = index;

        const item = videoItems[current];

        item.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        playVideo(current);

        setTimeout(() => {
            isMoving = false;
        }, 650);

    }


    // =================================================
    // ⬆️ NEXT VIDEO
    // =================================================

    function nextVideo() {

        if (videos.length <= 1) {
            console.log("⚠️ আরও কোনো ভিডিও HTML-এ নেই।");
            return;
        }

        const nextIndex = current + 1;

        if (nextIndex >= videos.length) {

            // শেষ ভিডিওতে গেলে প্রথমটিতে ফিরে যাবে
            scrollToVideo(0);

        } else {

            scrollToVideo(nextIndex);

        }

    }


    // =================================================
    // ⬇️ PREVIOUS VIDEO
    // =================================================

    function previousVideo() {

        if (videos.length <= 1) {
            return;
        }

        const previousIndex = current - 1;

        if (previousIndex < 0) {

            scrollToVideo(videos.length - 1);

        } else {

            scrollToVideo(previousIndex);

        }

    }


    // =================================================
    // 🎬 FIRST VIDEO
    // =================================================

    playVideo(0);


    // =================================================
    // 🖥️ DESKTOP MOUSE WHEEL
    // =================================================

    let wheelLocked = false;

    document.addEventListener(
        "wheel",
        (event) => {

            if (
                window.innerWidth <= 768 ||
                wheelLocked
            ) {
                return;
            }

            if (
                event.target.closest(
                    "button, input, textarea, select, a"
                )
            ) {
                return;
            }

            wheelLocked = true;

            if (event.deltaY > 0) {

                nextVideo();

            } else if (event.deltaY < 0) {

                previousVideo();

            }

            setTimeout(() => {
                wheelLocked = false;
            }, 700);

        },
        {
            passive: true
        }
    );


    // =================================================
    // 📱 MOBILE TOUCH SWIPE
    // =================================================

    document.addEventListener(
        "touchstart",
        (event) => {

            if (!event.touches || !event.touches.length) {
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
        (event) => {

            if (!event.changedTouches || !event.changedTouches.length) {
                return;
            }

            const touchEndY =
                event.changedTouches[0].clientY;

            const touchEndX =
                event.changedTouches[0].clientX;

            const deltaY =
                touchStartY - touchEndY;

            const deltaX =
                touchStartX - touchEndX;


            // Horizontal swipe হলে video change করবে না
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                return;
            }


            // Minimum swipe distance
            if (Math.abs(deltaY) < 70) {
                return;
            }


            if (deltaY > 0) {

                // ⬆️ Swipe Up
                nextVideo();

            } else {

                // ⬇️ Swipe Down
                previousVideo();

            }

        },
        {
            passive: true
        }
    );


    // =================================================
    // 🎬 VIDEO ENDED
    // =================================================

    videos.forEach((video, index) => {

        video.addEventListener(
            "ended",
            () => {

                if (index === current) {
                    nextVideo();
                }

            }
        );

    });


    // =================================================
    // 👀 INTERSECTION OBSERVER
    // =================================================

    const observer =
        new IntersectionObserver(
            (entries) => {

                entries.forEach(entry => {

                    if (
                        entry.isIntersecting &&
                        entry.intersectionRatio >= 0.65
                    ) {

                        const index =
                            videoItems.indexOf(
                                entry.target
                            );

                        if (index !== -1 && index !== current) {

                            current = index;
                            playVideo(index);

                        }

                    }

                });

            },
            {
                threshold: [0.65]
            }
        );


    videoItems.forEach(item => {
        observer.observe(item);
    });


    // =================================================
    // ❤️ LIKE SYSTEM
    // =================================================

    videoItems.forEach((item, index) => {

        const buttons =
            item.querySelectorAll(
                ".actions button"
            );

        const likeButton =
            buttons[0];

        const commentButton =
            buttons[1];

        const shareButton =
            item.querySelector(
                '[id^="shareBtn"]'
            );


        if (!likeButton) {
            return;
        }


        const likedKey =
            `wwc-liked-${getVideoId(index)}`;

        const countKey =
            `wwc-like-count-${getVideoId(index)}`;


        let liked =
            localStorage.getItem(
                likedKey
            ) === "true";


        let likeCount =
            parseInt(
                localStorage.getItem(
                    countKey
                ) || "0",
                10
            );


        // ---------------------------------------------
        // LIKE BUTTON UI
        // ---------------------------------------------

        function updateLike() {

            if (liked) {

                likeButton.textContent =
                    `❤️ Liked ${likeCount}`;

            } else {

                likeButton.textContent =
                    `❤️ Like ${likeCount}`;

            }

        }


        updateLike();


        // ---------------------------------------------
        // LIKE CLICK
        // ---------------------------------------------

        likeButton.addEventListener(
            "click",
            async (event) => {

                event.preventDefault();
                event.stopPropagation();


                if (!liked) {

                    liked = true;
                    likeCount++;

                } else {

                    liked = false;

                    if (likeCount > 0) {
                        likeCount--;
                    }

                }


                localStorage.setItem(
                    likedKey,
                    liked
                );

                localStorage.setItem(
                    countKey,
                    likeCount
                );


                updateLike();


                // Firebase
                try {

                    const videoRef =
                        doc(
                            db,
                            "videos",
                            getVideoId(index)
                        );


                    const snapshot =
                        await getDoc(
                            videoRef
                        );


                    if (snapshot.exists()) {

                        await updateDoc(
                            videoRef,
                            {
                                likes: likeCount
                            }
                        );

                    } else {

                        await setDoc(
                            videoRef,
                            {
                                likes: likeCount,
                                comments: []
                            }
                        );

                    }


                    console.log(
                        "❤️ Like saved"
                    );

                } catch (error) {

                    console.error(
                        "Like save error:",
                        error
                    );

                }

            }
        );


        // =================================================
        // 💬 COMMENT
        // =================================================

        if (commentButton) {

            commentButton.addEventListener(
                "click",
                async (event) => {

                    event.preventDefault();
                    event.stopPropagation();


                    const comment =
                        prompt(
                            "💬 আপনার মন্তব্য লিখুন:"
                        );


                    if (
                        !comment ||
                        !comment.trim()
                    ) {
                        return;
                    }


                    const newComment = {

                        text:
                            comment.trim(),

                        time:
                            new Date()
                                .toISOString()

                    };


                    const commentKey =
                        `wwc-comments-${getVideoId(index)}`;


                    let comments = [];


                    try {

                        comments =
                            JSON.parse(
                                localStorage.getItem(
                                    commentKey
                                ) || "[]"
                            );

                    } catch {

                        comments = [];

                    }


                    comments.push(
                        newComment
                    );


                    localStorage.setItem(
                        commentKey,
                        JSON.stringify(comments)
                    );


                    // Firebase
                    try {

                        const videoRef =
                            doc(
                                db,
                                "videos",
                                getVideoId(index)
                            );


                        const snapshot =
                            await getDoc(
                                videoRef
                            );


                        let firebaseComments = [];


                        if (
                            snapshot.exists()
                        ) {

                            firebaseComments =
                                snapshot.data()
                                    .comments || [];

                        }


                        firebaseComments.push(
                            newComment
                        );


                        await setDoc(
                            videoRef,
                            {
                                comments:
                                    firebaseComments
                            },
                            {
                                merge: true
                            }
                        );


                        alert(
                            "💬 মন্তব্য সফলভাবে সংরক্ষণ হয়েছে!"
                        );


                    } catch (error) {

                        console.error(
                            "Comment save error:",
                            error
                        );


                        alert(
                            "মন্তব্য সংরক্ষণ করা যায়নি।"
                        );

                    }

                }
            );

        }


        // =================================================
        // 🔖 SAVE SYSTEM
        // =================================================

        const saveButton =
            item.querySelector(
                '[id^="saveBtn"], .save-btn, [data-action="save"]'
            );


        if (saveButton) {

            saveButton.addEventListener(
                "click",
                async (event) => {

                    event.preventDefault();
                    event.stopPropagation();


                    if (!currentUser) {

                        alert(
                            "🔐 Save করতে আগে Sign In করুন।"
                        );

                        return;

                    }


                    const videoId =
                        getVideoId(index);


                    const userRef =
                        doc(
                            db,
                            "users",
                            currentUser.uid
                        );


                    try {

                        const userSnap =
                            await getDoc(
                                userRef
                            );


                        const saved =
                            userSnap.exists()
                                ? (
                                    userSnap.data()
                                        .savedVideoIds || []
                                )
                                : [];


                        if (
                            saved.includes(
                                videoId
                            )
                        ) {

                            await updateDoc(
                                userRef,
                                {
                                    savedVideoIds:
                                        arrayRemove(
                                            videoId
                                        )
                                }
                            );


                            saveButton.classList.remove(
                                "saved"
                            );


                            updateSaveButton(
                                saveButton,
                                false
                            );


                            console.log(
                                "🔖 Video unsaved"
                            );


                        } else {

                            if (
                                userSnap.exists()
                            ) {

                                await updateDoc(
                                    userRef,
                                    {
                                        savedVideoIds:
                                            arrayUnion(
                                                videoId
                                            )
                                    }
                                );

                            } else {

                                await setDoc(
                                    userRef,
                                    {
                                        savedVideoIds:
                                            [videoId]
                                    },
                                    {
                                        merge: true
                                    }
                                );

                            }


                            saveButton.classList.add(
                                "saved"
                            );


                            updateSaveButton(
                                saveButton,
                                true
                            );


                            console.log(
                                "🔖 Video saved"
                            );

                        }


                    } catch (error) {

                        console.error(
                            "Save error:",
                            error
                        );


                        alert(
                            "❌ ভিডিও সংরক্ষণ করা যায়নি।"
                        );

                    }

                }
            );

        }


        // =================================================
        // ↗️ SHARE
        // =================================================

        if (shareButton) {

            shareButton.addEventListener(
                "click",
                async (event) => {

                    event.preventDefault();
                    event.stopPropagation();


                    const shareUrl =
                        window.location.href;


                    try {

                        if (
                            navigator.share
                        ) {

                            await navigator.share({

                                title:
                                    "WWC-Core",

                                text:
                                    "🌍 এই ভিডিওটি দেখুন ❤️",

                                url:
                                    shareUrl

                            });

                        } else if (
                            navigator.clipboard
                        ) {

                            await navigator.clipboard.writeText(
                                shareUrl
                            );


                            alert(
                                "🔗 লিংক কপি হয়েছে!"
                            );

                        } else {

                            const input =
                                document.createElement(
                                    "input"
                                );


                            input.value =
                                shareUrl;


                            document.body.appendChild(
                                input
                            );


                            input.select();


                            document.execCommand(
                                "copy"
                            );


                            input.remove();


                            alert(
                                "🔗 লিংক কপি হয়েছে!"
                            );

                        }

                    } catch (error) {

                        if (
                            error.name !==
                            "AbortError"
                        ) {

                            console.error(
                                "Share error:",
                                error
                            );


                            alert(
                                "🔗 শেয়ার করা যায়নি।"
                            );

                        }

                    }

                }
            );

        }

    });


    // =================================================
    // 🔖 UPDATE SAVE BUTTON
    // =================================================

    function updateSaveButton(
        button,
        saved
    ) {

        const icon =
            button.querySelector("i");


        if (icon) {

            icon.className =
                saved
                    ? "fas fa-bookmark"
                    : "far fa-bookmark";

        }


        const text =
            button.querySelector(
                ".save-text"
            );


        if (text) {

            text.textContent =
                saved
                    ? "Saved"
                    : "Save";

        }

    }


    // =================================================
    // 🔖 LOAD SAVED VIDEOS
    // =================================================

    async function loadSavedVideos() {

        if (!currentUser) {
            return;
        }


        try {

            const userRef =
                doc(
                    db,
                    "users",
                    currentUser.uid
                );


            const snapshot =
                await getDoc(
                    userRef
                );


            if (!snapshot.exists()) {
                return;
            }


            const savedIds =
                snapshot.data()
                    .savedVideoIds || [];


            videoItems.forEach(
                (item, index) => {

                    const button =
                        item.querySelector(
                            '[id^="saveBtn"], .save-btn, [data-action="save"]'
                        );


                    if (!button) {
                        return;
                    }


                    const videoId =
                        getVideoId(index);


                    const saved =
                        savedIds.includes(
                            videoId
                        );


                    button.classList.toggle(
                        "saved",
                        saved
                    );


                    updateSaveButton(
                        button,
                        saved
                    );

                }
            );


        } catch (error) {

            console.error(
                "Load saved videos error:",
                error
            );

        }

    }


    // =================================================
    // 🖱️ PREVENT BUTTON CLICK FROM CHANGING VIDEO
    // =================================================

    document
        .querySelectorAll(
            "button, a, input, textarea"
        )
        .forEach(element => {

            element.addEventListener(
                "touchstart",
                event => {
                    event.stopPropagation();
                },
                {
                    passive: true
                }
            );

        });


    // =================================================
    // ⌨️ KEYBOARD
    // =================================================

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
                event.key === "ArrowDown" ||
                event.key === "PageDown"
            ) {

                event.preventDefault();

                nextVideo();

            }


            if (
                event.key === "ArrowUp" ||
                event.key === "PageUp"
            ) {

                event.preventDefault();

                previousVideo();

            }

        }
    );


    // =================================================
    // 📌 DEBUG
    // =================================================

    console.log(
        `✅ WWC Video System Loaded: ${videos.length} video(s)`
    );

    console.log(
        "📱 Swipe Up = Next Video"
    );

    console.log(
        "📱 Swipe Down = Previous Video"
    );

});
