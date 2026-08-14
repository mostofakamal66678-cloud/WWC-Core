import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import {
  getAuth,
  signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";


// ===============================
// 🔥 FIREBASE
// ===============================

const firebaseConfig = {
  apiKey: "AIzaSyC7Id7APerF7d6jdunQ3ny1MF6SW_t04",
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


// ===============================
// 🚪 LOGOUT
// ===============================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "./login.html";
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout করা যায়নি। আবার চেষ্টা করুন।");
    }
  });
}


// ===============================
// 🎬 VIDEO SYSTEM
// ===============================

document.addEventListener("DOMContentLoaded", () => {

  const videoItems = document.querySelectorAll(".video-item");
  const videos = document.querySelectorAll("video");

  let current = 0;


  // ===============================
  // ▶️ VIDEO PLAY
  // ===============================

  function playVideo(index) {
  if (!videos.length) return;

  if (index < 0) index = 0;
  if (index >= videos.length) index = videos.length - 1;

  current = index;

  videos.forEach((video, i) => {
    video.pause();

    if (i === current) {
      video.style.display = "block";
      video.muted = true;

      video.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      video.play().catch(() => {});
    } else {
      video.style.display = "block";
    }
  });
  }


  // প্রথম ভিডিও
  if (videos.length > 0) {
    playVideo(0);
  }


  // ===============================
  // ⏭️ VIDEO শেষ হলে পরের ভিডিও
  // ===============================

  videos.forEach((video, index) => {

    video.addEventListener("ended", () => {

      const next = index + 1;

      if (next < videos.length) {
        playVideo(next);
      } else {
        playVideo(0);
      }

    });

  });


  // ===============================
  // 🔊 VIDEO CLICK = SOUND
  // ===============================
// 📱 MOBILE SWIPE
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener("touchstart", (e) => {
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener("touchend", (e) => {
  touchEndY = e.changedTouches[0].screenY;

  const swipeDistance = touchStartY - touchEndY;

  // ⬆️ উপরে Swipe = পরের ভিডিও
  if (swipeDistance > 50) {
    playVideo(current + 1);
  }

  // ⬇️ নিচে Swipe = আগের ভিডিও
  if (swipeDistance < -50) {
    playVideo(current - 1);
  }
});
  videos.forEach((video) => {

    video.addEventListener("click", () => {

      video.muted = !video.muted;

      video.play().catch(() => {});

    });

  });


  // ===============================
  // ❤️ LIKE
  // ===============================

  const likeButtons = document.querySelectorAll(
    ".actions button:nth-child(1)"
  );

  likeButtons.forEach((button, index) => {

    const storageKey = `wwc_like_${index}`;

    let liked = localStorage.getItem(storageKey) === "true";

    updateLikeButton(button, liked);


    button.addEventListener("click", (event) => {

      event.stopPropagation();

      liked = !liked;

localStorage.setItem(storageKey, liked);

const countKey = `wwc_like_count_${index}`;
let count = parseInt(localStorage.getItem(countKey) || "0");

if (liked) {
  count++;
} else {
  count = Math.max(0, count - 1);
}

localStorage.setItem(countKey, count);

updateLikeButton(button, liked);

    

    });

  });


  function updateLikeButton(button, liked) {
  const countSpan = button.querySelector(".like-count");

  if (liked) {
    button.classList.add("liked");
    button.style.transform = "scale(1.2)";
  } else {
    button.classList.remove("liked");
    button.style.transform = "scale(1)";
  }

  if (countSpan) {
    const index = [...likeButtons].indexOf(button);
    const countKey = `wwc_like_count_${index}`;
    const count = parseInt(localStorage.getItem(countKey) || "0");
    countSpan.textContent = count;
  }
  }



  // ===============================
  // 💬 COMMENT
  // ===============================

  const commentButtons = document.querySelectorAll(
    ".actions button:nth-child(2)"
  );

  commentButtons.forEach((button, index) => {

    button.addEventListener("click", async (event) => {

      event.stopPropagation();

      const comment = prompt("আপনার মন্তব্য লিখুন:");

      if (!comment || !comment.trim()) {
        return;
      }

      const cleanComment = comment.trim();


      // 화면ে দেখানো
      const item = button.closest(".video-item");

      if (item) {

        let commentBox = item.querySelector(".wwc-comments");

        if (!commentBox) {

          commentBox = document.createElement("div");

          commentBox.className = "wwc-comments";

          commentBox.style.position = "absolute";
          commentBox.style.bottom = "90px";
          commentBox.style.left = "15px";
          commentBox.style.right = "15px";
          commentBox.style.zIndex = "20";
          commentBox.style.background = "rgba(0,0,0,0.75)";
          commentBox.style.color = "white";
          commentBox.style.padding = "10px";
          commentBox.style.borderRadius = "10px";
          commentBox.style.fontSize = "15px";

          item.appendChild(commentBox);

        }

        const newComment = document.createElement("div");

        newComment.textContent = "💬 " + cleanComment;

        newComment.style.marginBottom = "5px";

        commentBox.appendChild(newComment);

      }


      // Firestore-এ সংরক্ষণ
      try {

        await addDoc(collection(db, "comments"), {
          videoIndex: index,
          comment: cleanComment,
          createdAt: serverTimestamp()
        });

      } catch (error) {

        console.log("Comment save skipped:", error);

      }

    });

  });


  // ===============================
  // ↗️ SHARE
  // ===============================

  const shareButtons = document.querySelectorAll(
    ".actions button[id^='shareBtn']"
  );

  shareButtons.forEach((button) => {

    button.addEventListener("click", async (event) => {

      event.stopPropagation();

      const shareData = {
        title: "WWC Video Feed",
        text: "WWC-Core এ এই ভিডিওটি দেখুন ❤️",
        url: window.location.href
      };


      // Android / Browser Share
      if (navigator.share) {

        try {

          await navigator.share(shareData);

        } catch (error) {

          console.log("Share cancelled");

        }

      } else {

        // Share না থাকলে clipboard
        try {

          await navigator.clipboard.writeText(
            window.location.href
          );

          alert("লিংক কপি হয়েছে ✅");

        } catch (error) {

          alert("লিংক কপি করা যায়নি।");

        }

      }

    });

  });


  // ===============================
  // 👤 FOLLOW / UNFOLLOW
  // ===============================

  const followButtons = document.querySelectorAll(".follow-btn");

  followButtons.forEach((button) => {

    const username =
      button.dataset.user || "unknown";

    const storageKey =
      `wwc_follow_${username}`;

    let following =
      localStorage.getItem(storageKey) === "true";


    updateFollowButton(button, following);


    button.addEventListener("click", (event) => {

      event.stopPropagation();

      following = !following;

      localStorage.setItem(
        storageKey,
        following
      );

      updateFollowButton(
        button,
        following
      );

    });

  });


  function updateFollowButton(button, following) {

    if (following) {

      button.textContent = "Following ✓";

      button.style.background = "#444";
      button.style.color = "white";

    } else {

      button.textContent = "Follow";

      button.style.background = "";
      button.style.color = "";

    }

  }


  // ===============================
  // 🖱️ ACTION BUTTON CLICK
  // ===============================

  document
    .querySelectorAll(".actions button")
    .forEach((button) => {

      button.addEventListener("click", (event) => {
        event.stopPropagation();
      });

    });


  // ===============================
  // 📱 SWIPE / TOUCH
  // ===============================

  let touchStartY = 0;
  let touchEndY = 0;


  document.addEventListener("touchstart", (event) => {

    touchStartY =
      event.changedTouches[0].screenY;

  });


  document.addEventListener("touchend", (event) => {

    touchEndY =
      event.changedTouches[0].screenY;

    const difference =
      touchStartY - touchEndY;


    if (Math.abs(difference) < 50) {
      return;
    }


    if (difference > 0) {

      // Swipe up
      if (current < videos.length - 1) {

        playVideo(current + 1);

      } else {

        playVideo(0);

      }

    } else {

      // Swipe down
      if (current > 0) {

        playVideo(current - 1);

      }

    }

  });

});
