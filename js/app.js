import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";


// ==============================
// 🔥 FIREBASE
// ==============================

const firebaseConfig = {
  apiKey: "AIzaSyCgj017aPErF7d6juqhJn3y1MF6SW_t04",
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


// ==============================
// 🎥 VIDEO
// ==============================

document.addEventListener("DOMContentLoaded", () => {

  const videos = document.querySelectorAll("video");
  let current = 0;

  if (videos.length > 0) {
    videos[current].play().catch(() => {});
  }


  // ==============================
  // 🎥 ভিডিও পরিবর্তন
  // ==============================

  document.addEventListener("wheel", (e) => {

    if (videos.length === 0) return;

    videos[current].pause();

    if (e.deltaY > 0) {
      current = (current + 1) % videos.length;
    } else {
      current = (current - 1 + videos.length) % videos.length;
    }

    videos[current].play().catch(() => {});

    videos[current].scrollIntoView({
      behavior: "smooth"
    });

  });


  // ==============================
  // ❤️ LIKE
  // ==============================

  const actionButtons = document.querySelectorAll(".actions button");

  const likeButton = actionButtons[0];
  const commentButton = actionButtons[1];
  const shareButton = document.getElementById("shareBtn");


  if (likeButton) {

    const likedKey = "wwc-liked";
    const localLikeKey = "wwc-like-count";

    let liked =
      localStorage.getItem(likedKey) === "true";

    let likeCount =
      parseInt(
        localStorage.getItem(localLikeKey) || "0",
        10
      );


    function updateLike() {

      if (liked) {
        likeButton.textContent = "❤️ Liked " + likeCount;
      } else {
        likeButton.textContent = "❤️ Like " + likeCount;
      }

    }


    updateLike();


    likeButton.addEventListener("click", async (e) => {

      e.preventDefault();
      e.stopPropagation();


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
        localLikeKey,
        likeCount
      );


      updateLike();


      // Firebase
      try {

        const videoRef = doc(
          db,
          "videos",
          "video1"
        );

        const snapshot = await getDoc(videoRef);


        if (!snapshot.exists()) {

          await setDoc(videoRef, {
            likes: likeCount,
            comments: []
          });

        } else {

          await updateDoc(videoRef, {
            likes: likeCount
          });

        }

        console.log("Like saved to Firebase");

      } catch (error) {

        console.error(
          "Like save error:",
          error
        );

      }

    });

  }


  // ==============================
  // 💬 COMMENT
  // ==============================

  if (commentButton) {

    commentButton.addEventListener(
      "click",
      async (e) => {

        e.preventDefault();
        e.stopPropagation();


        const comment = prompt(
          "💬 আপনার মন্তব্য লিখুন:"
        );


        if (
          !comment ||
          comment.trim() === ""
        ) {
          return;
        }


        const newComment = {

          text: comment.trim(),

          time: new Date().toISOString()

        };


        // LocalStorage
        let comments = JSON.parse(
          localStorage.getItem("wwc-comments") || "[]"
        );


        comments.push(newComment);


        localStorage.setItem(
          "wwc-comments",
          JSON.stringify(comments)
        );


        // Firebase
        try {

          const videoRef = doc(
            db,
            "videos",
            "video1"
          );

          const snapshot = await getDoc(
            videoRef
          );


          if (!snapshot.exists()) {

            await setDoc(videoRef, {

              likes: 0,

              comments: [
                newComment
              ]

            });

          } else {

            await updateDoc(videoRef, {

              comments: arrayUnion(
                newComment
              )

            });

          }


          alert(
            "💬 আপনার মন্তব্য সংরক্ষণ হয়েছে!"
          );


        } catch (error) {

          console.error(
            "Comment save error:",
            error
          );

          alert(
            "মন্তব্য সংরক্ষণ করা যায়নি।"
          );

        }

      }
    );

  }


  // ==============================
  // 🔗 SHARE
  // ==============================

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
          if (navigator.share) {

            await navigator.share({

              title: "WWC-Core",

              text: "🌐 এই ভিডিওটি দেখুন ❤️",

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
              "🔗 লিংক কপি হয়েছে!"
            );

          }

          // পুরোনো Browser
          else {

            const input =
              document.createElement("input");

            input.value = shareUrl;

            document.body.appendChild(
              input
            );

            input.select();

            document.execCommand("copy");

            input.remove();


            alert(
              "🔗 লিংক কপি হয়েছে!"
            );

          }

        } catch (error) {

          // User share cancel করলে error দেখাবে না
          if (
            error.name !== "AbortError"
          ) {

            console.error(
              "Share error:",
              error
            );

            alert(
              "🔗 লিংক শেয়ার করা যায়নি।"
            );

          }

        }

      }
    );

  }

});
