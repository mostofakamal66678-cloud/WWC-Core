
import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";


// ==============================
// 🔥 FIREBASE
// ==============================

const firebaseConfig = {
  apiKey: "AIzaSyCgi017aPErF7d6juqIhn3yIMF6SW_t04",
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
// 🎬 VIDEO
// ==============================

const videos = document.querySelectorAll("video");
let current = 0;

if (videos.length > 0) {
  videos[current].play().catch(() => {});
}


// ভিডিও পরিবর্তন
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

const buttons = document.querySelectorAll(
  'button, [role="button"], a'
);

buttons.forEach((button) => {

  const text = button.textContent.trim();

  if (
    text.includes("❤️") ||
    text.includes("♥️") ||
    text.toLowerCase().includes("like")
  ) {

    const likedKey = "wwc-liked";
    const localLikeKey = "wwc-like-count";

    let liked = localStorage.getItem(likedKey) === "true";

    let likeCount = parseInt(
      localStorage.getItem(localLikeKey) || "0"
    );

    function updateLike() {
      if (liked) {
        button.textContent = "❤️ Liked " + likeCount;
      } else {
        button.textContent = "❤️ Like " + likeCount;
      }
    }

    updateLike();

    button.addEventListener("click", async (e) => {

      e.preventDefault();

      if (!liked) {
        liked = true;
        likeCount++;
      } else {
        liked = false;

        if (likeCount > 0) {
          likeCount--;
        }
      }

      localStorage.setItem(likedKey, liked);
      localStorage.setItem(localLikeKey, likeCount);

      updateLike();

      // Firebase
      try {

        const videoRef = doc(db, "videos", "video1");
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

        console.error("Like save error:", error);

      }

    });

  }

});


// ==============================
// 💬 COMMENT
// ==============================

buttons.forEach((button) => {

  const text = button.textContent.trim();

  if (
    text.includes("💬") ||
    text.toLowerCase().includes("comment")
  ) {

    button.addEventListener("click", async (e) => {

      e.preventDefault();

      const comment = prompt("💬 আপনার মন্তব্য লিখুন:");

      if (comment && comment.trim() !== "") {

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

          const videoRef = doc(db, "videos", "video1");
          const snapshot = await getDoc(videoRef);

          if (!snapshot.exists()) {

            await setDoc(videoRef, {
              likes: 0,
              comments: [newComment]
            });

          } else {

            await updateDoc(videoRef, {
              comments: arrayUnion(newComment)
            });

          }

          alert("💬 আপনার মন্তব্য সংরক্ষণ হয়েছে!");

        } catch (error) {

          console.error("Comment save error:", error);

          alert("মন্তব্য সংরক্ষণ করা যায়নি।");

        }

      }

    });

  }

});


// ==============================
// 📤 SHARE
// ==============================

buttons.forEach((button) => {

  const text = button.textContent.trim();

  if (
    text.includes("📤") ||
    text.toLowerCase().includes("share")
  ) {

    button.addEventListener("click", async (e) => {

      e.preventDefault();

      const shareData = {
        title: "WWC-Core",
        text: "এই ভিডিওটি দেখুন ❤️",
        url: window.location.href
      };

      try {

        if (navigator.share) {

          await navigator.share(shareData);

        } else {

          await navigator.clipboard.writeText(
            window.location.href
          );

          alert("🔗 লিংক কপি হয়েছে!");

        }

      } catch (error) {

        console.log("Share cancelled");

      }

    });

  }

});
