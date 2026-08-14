// ======================================================
// WWC-Core / World Wide Connect
// COMPLETE APP.JS
// ======================================================

import {
  getApps,
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";


// ======================================================
// FIREBASE
// ======================================================

const firebaseConfig = {
  apiKey: "AIzaSyC7dA7P6dQ6Q3mjMFW5w_t04",
  authDomain: "world-wide-connect-62c87.firebaseapp.com",
  projectId: "world-wide-connect-62c87",
  storageBucket: "world-wide-connect-62c87.firebasestorage.app",
  messagingSenderId: "931784536688",
  appId: "1:931784536688:web:634f69070a082677445031",
  measurementId: "G-R2L5YXQXPH"
};

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);


// ======================================================
// GLOBAL VARIABLES
// ======================================================

let currentUser = null;
let currentVideoIndex = 0;
let videos = [];
let videoItems = [];


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(auth, (user) => {

  currentUser = user;

  console.log(
    user
      ? "Logged in:",
        user.email || user.displayName
      : "Not logged in"
  );

});


// ======================================================
// LOGOUT
// ======================================================

const logoutButtons = document.querySelectorAll(
  "#logoutBtn, .logout-btn, [data-action='logout']"
);

logoutButtons.forEach((button) => {

  button.addEventListener("click", async (event) => {

    event.preventDefault();
    event.stopPropagation();

    try {

      await signOut(auth);

      alert("Logout সফল হয়েছে");

      window.location.href = "./auth.html";

    } catch (error) {

      console.error("Logout error:", error);

      alert("Logout করা যায়নি");

    }

  });

});


// ======================================================
// START APP
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  setupVideoSystem();
  setupLikeButtons();
  setupCommentButtons();
  setupShareButtons();
  setupFollowButtons();
  setupActionButtons();

});


// ======================================================
// VIDEO SYSTEM
// ======================================================

function setupVideoSystem() {

  videoItems = Array.from(
    document.querySelectorAll(".video-item")
  );

  videos = Array.from(
    document.querySelectorAll(".video-item video, video")
  );

  console.log("Video items:", videoItems.length);
  console.log("Videos:", videos.length);

  if (!videos.length) {

    console.warn("কোনো video পাওয়া যায়নি");

    return;

  }


  // প্রথম ভিডিও
  currentVideoIndex = 0;

  prepareVideos();

  playVideo(0);


  // ভিডিও শেষ হলে পরের ভিডিও
  videos.forEach((video, index) => {

    video.addEventListener("ended", () => {

      let next = index + 1;

      if (next >= videos.length) {
        next = 0;
      }

      playVideo(next);

    });

  });


  // ভিডিওতে click = sound / pause
  videos.forEach((video) => {

    video.addEventListener("click", (event) => {

      event.stopPropagation();

      if (video.paused) {

        video.play().catch(() => {});

      } else {

        video.pause();

      }

    });

  });


  // Intersection Observer
  setupVideoObserver();

}


// ======================================================
// PREPARE VIDEOS
// ======================================================

function prepareVideos() {

  videos.forEach((video, index) => {

    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    video.preload = "auto";

    if (index !== currentVideoIndex) {

      video.pause();

    }

  });

}


// ======================================================
// PLAY VIDEO
// ======================================================

function playVideo(index) {

  if (!videos.length) return;


  if (index < 0) {
    index = 0;
  }

  if (index >= videos.length) {
    index = videos.length - 1;
  }


  currentVideoIndex = index;


  videos.forEach((video, i) => {

    if (i === index) {

      video.style.display = "block";

      video.currentTime = 0;

      video.muted = true;

      video.play().catch((error) => {

        console.log("Autoplay blocked:", error);

      });

    } else {

      video.pause();

    }

  });


  if (videoItems[index]) {

    videoItems[index].scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

}


// ======================================================
// NEXT VIDEO
// ======================================================

function nextVideo() {

  if (!videos.length) return;


  let next = currentVideoIndex + 1;

  if (next >= videos.length) {

    next = 0;

  }

  playVideo(next);

}


// ======================================================
// PREVIOUS VIDEO
// ======================================================

function previousVideo() {

  if (!videos.length) return;


  let previous = currentVideoIndex - 1;

  if (previous < 0) {

    previous = videos.length - 1;

  }

  playVideo(previous);

}


// ======================================================
// SWIPE / TOUCH
// ======================================================

let touchStartY = 0;
let touchEndY = 0;

let touchStartX = 0;
let touchEndX = 0;

const feed =
  document.getElementById("video-feed") ||
  document.querySelector("#video-feed") ||
  document.body;


feed.addEventListener(
  "touchstart",
  (event) => {

    if (!event.touches.length) return;

    touchStartY = event.touches[0].clientY;
    touchStartX = event.touches[0].clientX;

  },
  { passive: true }
);


feed.addEventListener(
  "touchend",
  (event) => {

    if (!event.changedTouches.length) return;

    touchEndY = event.changedTouches[0].clientY;
    touchEndX = event.changedTouches[0].clientX;


    const differenceY =
      touchStartY - touchEndY;

    const differenceX =
      touchStartX - touchEndX;


    // horizontal swipe হলে কিছু করবে না
    if (Math.abs(differenceX) > Math.abs(differenceY)) {
      return;
    }


    // Swipe Up
    if (differenceY > 60) {

      nextVideo();

    }


    // Swipe Down
    else if (differenceY < -60) {

      previousVideo();

    }

  },
  { passive: true }
);


// ======================================================
// MOUSE WHEEL / DESKTOP SCROLL
// ======================================================

let wheelLocked = false;

feed.addEventListener(
  "wheel",
  (event) => {

    if (wheelLocked) return;

    if (Math.abs(event.deltaY) < 20) return;


    wheelLocked = true;


    if (event.deltaY > 0) {

      nextVideo();

    } else {

      previousVideo();

    }


    setTimeout(() => {

      wheelLocked = false;

    }, 500);

  },
  { passive: true }
);


// ======================================================
// KEYBOARD
// ======================================================

document.addEventListener("keydown", (event) => {

  if (event.key === "ArrowDown") {

    event.preventDefault();

    nextVideo();

  }


  if (event.key === "ArrowUp") {

    event.preventDefault();

    previousVideo();

  }

});


// ======================================================
// VIDEO OBSERVER
// ======================================================

function setupVideoObserver() {

  const observer = new IntersectionObserver(
    (entries) => {

      entries.forEach((entry) => {

        if (
          entry.isIntersecting &&
          entry.intersectionRatio >= 0.6
        ) {

          const video = entry.target;

          const index = videos.indexOf(video);

          if (index !== -1) {

            currentVideoIndex = index;

            videos.forEach((v) => {

              if (v !== video) {

                v.pause();

              }

            });

            video.play().catch(() => {});

          }

        }

      });

    },
    {
      threshold: [0.6]
    }
  );


  videos.forEach((video) => {

    observer.observe(video);

  });

}


// ======================================================
// LIKE
// ======================================================

function setupLikeButtons() {

  const likeButtons = document.querySelectorAll(
    ".actions button:nth-child(1), .like-btn, [data-action='like']"
  );


  likeButtons.forEach((button, index) => {

    const storageKey = `wwc_like_${index}`;

    const countKey = `wwc_like_count_${index}`;


    let liked =
      localStorage.getItem(storageKey) === "true";


    let count =
      parseInt(
        localStorage.getItem(countKey) || "0"
      );


    updateLikeButton(
      button,
      liked,
      count
    );


    button.addEventListener("click", (event) => {

      event.preventDefault();
      event.stopPropagation();


      liked = !liked;


      if (liked) {

        count++;

      } else {

        count = Math.max(0, count - 1);

      }


      localStorage.setItem(
        storageKey,
        liked
      );


      localStorage.setItem(
        countKey,
        count
      );


      updateLikeButton(
        button,
        liked,
        count
      );

    });

  });

}


// ======================================================
// UPDATE LIKE BUTTON
// ======================================================

function updateLikeButton(
  button,
  liked,
  count
) {

  if (!button) return;


  button.classList.toggle(
    "liked",
    liked
  );


  button.style.transform =
    liked
      ? "scale(1.15)"
      : "scale(1)";


  const countSpan =
    button.querySelector(
      ".like-count"
    );


  if (countSpan) {

    countSpan.textContent = count;

  }


  // count না থাকলে text-এর মধ্যে count যোগ
  const countElement =
    button.parentElement?.querySelector(
      ".like-count"
    );


  if (countElement) {

    countElement.textContent = count;

  }

}


// ======================================================
// COMMENT
// ======================================================

function setupCommentButtons() {

  const commentButtons = document.querySelectorAll(
    ".actions button:nth-child(2), .comment-btn, [data-action='comment']"
  );


  commentButtons.forEach((button, index) => {

    button.addEventListener("click", async (event) => {

      event.preventDefault();
      event.stopPropagation();


      const comment =
        prompt("আপনার মন্তব্য লিখুন:");


      if (!comment || !comment.trim()) {

        return;

      }


      const cleanComment =
        comment.trim();


      const item =
        button.closest(".video-item");


      if (!item) return;


      let commentBox =
        item.querySelector(".wwc-comments");


      if (!commentBox) {

        commentBox =
          document.createElement("div");

        commentBox.className =
          "wwc-comments";


        commentBox.style.position =
          "absolute";

        commentBox.style.bottom =
          "90px";

        commentBox.style.left =
          "15px";

        commentBox.style.right =
          "15px";

        commentBox.style.maxHeight =
          "150px";

        commentBox.style.overflowY =
          "auto";

        commentBox.style.background =
          "rgba(0,0,0,.75)";

        commentBox.style.color =
          "#fff";

        commentBox.style.padding =
          "10px";

        commentBox.style.borderRadius =
          "10px";

        commentBox.style.zIndex =
          "1000";


        item.appendChild(
          commentBox
        );

      }


      const newComment =
        document.createElement("div");


      newComment.textContent =
        "💬 " + cleanComment;


      newComment.style.marginBottom =
        "6px";


      commentBox.appendChild(
        newComment
      );


      // Firestore save
      try {

        await addDoc(
          collection(db, "comments"),
          {
            videoIndex: index,
            comment: cleanComment,
            user:
              currentUser?.email ||
              "guest",
            createdAt:
              serverTimestamp()
          }
        );

      } catch (error) {

        console.log(
          "Comment Firestore save failed:",
          error
        );

      }

    });

  });

}


// ======================================================
// SHARE
// ======================================================

function setupShareButtons() {

  const shareButtons = document.querySelectorAll(
    ".actions button:nth-child(3), .share-btn, [data-action='share']"
  );


  shareButtons.forEach((button) => {

    button.addEventListener(
      "click",
      async (event) => {

        event.preventDefault();
        event.stopPropagation();


        const shareData = {

          title:
            "WWC Video",

          text:
            "WWC-Core এ ভিডিও দেখুন ❤️",

          url:
            window.location.href

        };


        // Android / Browser Share
        if (
          navigator.share
        ) {

          try {

            await navigator.share(
              shareData
            );

          } catch (error) {

            console.log(
              "Share cancelled"
            );

          }

          return;

        }


        // Clipboard
        try {

          await navigator.clipboard.writeText(
            window.location.href
          );


          alert(
            "লিংক কপি হয়েছে ✅"
          );

        } catch (error) {

          prompt(
            "এই লিংকটি কপি করুন:",
            window.location.href
          );

        }

      }
    );

  });

}


// ======================================================
// FOLLOW
// ======================================================

function setupFollowButtons() {

  const followButtons =
    document.querySelectorAll(
      ".follow-btn, .follow-btn, [data-action='follow']"
    );


  followButtons.forEach((button, index) => {

    const username =
      button.dataset.user ||
      button.dataset.username ||
      `user_${index}`;


    const storageKey =
      `wwc_follow_${username}`;


    let following =
      localStorage.getItem(
        storageKey
      ) === "true";


    updateFollowButton(
      button,
      following
    );


    button.addEventListener(
      "click",
      (event) => {

        event.preventDefault();
        event.stopPropagation();


        following =
          !following;


        localStorage.setItem(
          storageKey,
          following
        );


        updateFollowButton(
          button,
          following
        );

      }
    );

  });

}


// ======================================================
// UPDATE FOLLOW BUTTON
// ======================================================

function updateFollowButton(
  button,
  following
) {

  if (!button) return;


  if (following) {

    button.textContent =
      "Following ✓";

    button.style.background =
      "#444";

    button.style.color =
      "#fff";

  } else {

    button.textContent =
      "Follow";

    button.style.background =
      "";

    button.style.color =
      "";

  }

}


// ======================================================
// ACTION BUTTON PROTECTION
// ======================================================

function setupActionButtons() {

  const buttons =
    document.querySelectorAll(
      ".actions button"
    );


  buttons.forEach((button) => {

    button.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

      }
    );

  });

}


// ======================================================
// PREVENT VIDEO DRAG
// ======================================================

videos.forEach((video) => {

  video.addEventListener(
    "dragstart",
    (event) => {

      event.preventDefault();

    }
  );

});


// ======================================================
// PAGE VISIBILITY
// ======================================================

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.hidden
    ) {

      videos.forEach(
        (video) => video.pause()
      );

    } else {

      if (
        videos[currentVideoIndex]
      ) {

        videos[
          currentVideoIndex
        ]
          .play()
          .catch(() => {});

      }

    }

  }
);


// ======================================================
// CONSOLE
// ======================================================

console.log(
  "WWC-Core app.js loaded successfully ✅"
);
