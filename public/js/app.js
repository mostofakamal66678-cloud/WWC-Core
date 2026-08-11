import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
// ========================================
// 🔥 FIREBASE
// ========================================

const firebaseConfig = {
  apiKey: "AIzaSyCgJ017APerF7d6jdunQ3ny1MF6SW_t04",
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

// ========================================
// 🎬 WWC-CORE VIDEO SYSTEM
// ========================================

document.addEventListener("DOMContentLoaded", () => {

  const videoItems = document.querySelectorAll(".video-item");
  const videos = document.querySelectorAll("video");

  let current = 0;


  // ========================================
  // ▶️ প্রথম ভিডিও চালু
  // ========================================

  if (videos.length > 0) {
    videos[0].play().catch(() => {});
  }


  // ========================================
  // 🔄 ভিডিও শেষ হলে পরের ভিডিও
  // ========================================

  videos.forEach((video, index) => {

    video.addEventListener("ended", () => {

      current = (index + 1) % videos.length;

      videos[current].scrollIntoView({
        behavior: "smooth"
      });

      videos[current].play().catch(() => {});
    });

  });

// ===============================
// 👤 FOLLOW SYSTEM
// ===============================

const followButtons = document.querySelectorAll(".follow-btn");

followButtons.forEach((button) => {
  const username = button.dataset.user;
  const followKey = `wwc-follow-${username}`;

  if (localStorage.getItem(followKey) === "true") {
    button.textContent = "Following";
  }

  button.addEventListener("click", () => {
    const isFollowing =
      localStorage.getItem(followKey) === "true";

    if (isFollowing) {
      localStorage.removeItem(followKey);
      button.textContent = "Follow";
    } else {
      localStorage.setItem(followKey, "true");
      button.textContent = "Following";
    }
  });
});
  // ========================================
  // 📱 Swipe / Mouse Wheel
  // ========================================

  document.addEventListener("wheel", (e) => {

    if (videos.length === 0) return;

    videos[current].pause();

    if (e.deltaY > 0) {
      current = (current + 1) % videos.length;
    } else {
      current = (current - 1 + videos.length) % videos.length;
    }

    videos[current].scrollIntoView({
      behavior: "smooth"
    });

    videos[current].play().catch(() => {});

  }, { passive: true });

// 📱 TOUCH SWIPE SYSTEM

let touchStartY = 0;
let touchEndY = 0;

document.addEventListener("touchstart", (e) => {
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener("touchend", (e) => {
  touchEndY = e.changedTouches[0].screenY;

  const swipeDistance = touchStartY - touchEndY;

  // 👆 Swipe Up
  if (swipeDistance > 50) {
    if (videos.length === 0) return;

    videos[current].pause();

    current = (current + 1) % videos.length;

    videos[current].scrollIntoView({
      behavior: "smooth"
    });

    videos[current].play().catch(() => {});
  }

  // 👇 Swipe Down
  if (swipeDistance < -50) {
    if (videos.length === 0) return;

    videos[current].pause();

    current =
      (current - 1 + videos.length) % videos.length;

    videos[current].scrollIntoView({
      behavior: "smooth"
    });

    videos[current].play().catch(() => {});
  }
}, { passive: true });
  // ========================================
  // ❤️ LIKE + 💬 COMMENT + ↗️ SHARE
  // ========================================

  videoItems.forEach((item, index) => {

    const buttons = item.querySelectorAll(".actions button");

    const likeButton = buttons[0];
    const commentButton = buttons[1];

    const shareButton =
      item.querySelector('[id^="shareBtn"]') ||
      buttons[2];


    // ========================================
    // ❤️ LIKE SYSTEM
    // ========================================

    if (likeButton) {

      const likedKey = `wwc-liked-${index}`;
      const countKey = `wwc-like-count-${index}`;

      let liked =
        localStorage.getItem(likedKey) === "true";

      let likeCount =
        parseInt(
          localStorage.getItem(countKey) || "0",
          10
        );


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


      likeButton.addEventListener("click", async (e) => {

        e.preventDefault();
        e.stopPropagation();


        if (liked) {

          liked = false;

          if (likeCount > 0) {
            likeCount--;
          }

        } else {

          liked = true;
          likeCount++;

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


        // ========================================
        // 🔥 Firebase Like Save
        // ========================================

        try {

          const videoRef = doc(
            db,
            "videos",
            `video${index + 1}`
          );


          const snapshot =
            await getDoc(videoRef);


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

        } catch (error) {

          console.error(
            "Like save error:",
            error
          );

        }

      });

    }


    // ========================================
    // 💬 COMMENT SYSTEM
    // ========================================

    if (commentButton) {

      commentButton.addEventListener(
        "click",
        async (e) => {

          e.preventDefault();
          e.stopPropagation();


          const comment =
            prompt("💬 আপনার মন্তব্য লিখুন:");


          if (
            !comment ||
            comment.trim() === ""
          ) {
            return;
          }


          const newComment = {

            text: comment.trim(),

            time:
              new Date().toISOString()

          };


          // ========================================
          // LocalStorage
          // ========================================

          let comments =
            JSON.parse(
              localStorage.getItem(
                `wwc-comments-${index}`
              ) || "[]"
            );


          comments.push(newComment);


          localStorage.setItem(
            `wwc-comments-${index}`,
            JSON.stringify(comments)
          );


          // ========================================
          // Firebase
          // ========================================

          try {

            const videoRef = doc(
              db,
              "videos",
              `video${index + 1}`
            );


            const snapshot =
              await getDoc(videoRef);


            let firebaseComments = [];


            if (snapshot.exists()) {

              firebaseComments =
                snapshot.data().comments || [];

            }


            firebaseComments.push(
              newComment
            );


            await setDoc(
              videoRef,
              {
                comments: firebaseComments
              },
              {
                merge: true
              }
            );


            alert("💬 মন্তব্য সফলভাবে সংরক্ষণ হয়েছে!");

          } catch (error) {

            console.error(
              "Comment save error:",
              error
            );

            alert("❌ মন্তব্য সংরক্ষণ করা যায়নি।");

          }

        }
      );

    }


    // ========================================
    // ↗️ SHARE SYSTEM
    // ========================================

    if (shareButton) {

      shareButton.addEventListener(
        "click",
        async (e) => {

          e.preventDefault();
          e.stopPropagation();


          const shareUrl =
            window.location.href;


          try {

            // Android / Chrome Share
            if (
              navigator.share
            ) {

              await navigator.share({

                title: "WWC-Core",

                text:
                  "🌐 WWC-Core ভিডিও দেখুন ❤️",

                url: shareUrl

              });

            }

            // Clipboard
            else if (
              navigator.clipboard
            ) {

              await navigator.clipboard.writeText(
                shareUrl
              );

              alert(
                "🔗 লিংক কপি হয়েছে!"
              );

            }

            // পুরোনো Browser
            else {

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

            // User share cancel করলে কিছু না
            if (
              error.name ===
              "AbortError"
            ) {

              return;

            }


            console.error(
              "Share error:",
              error
            );


            alert(
              "❌ শেয়ার করা যায়নি।"
            );

          }

        }
      );

    }

  });

});
