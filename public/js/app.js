// ======================================================
// WWC-Core / World Wide Connect
// COMPLETE APP.JS
// ======================================================

import {
  getApps,
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";


// ======================================================
// FIREBASE CONFIG
// ======================================================

const firebaseConfig = {
  apiKey: "AIzaSyC7dA7P6dQ6Q3mjMFW5w_t04",
  authDomain: "world-wide-connect-62c87.firebaseapp.com",
  projectId: "world-wide-connect-62c87",
  storageBucket: "world-wide-connect-62c87.firebasestorage.app",
  messagingSenderId: "931784536688",
  appId: "1:931784536688:web:634f69070a082677445031",
  measurementId: "G-R2L5YXQXPHQ"
};


// ======================================================
// FIREBASE INITIALIZE
// ======================================================

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const auth = getAuth(app);


// ======================================================
// GLOBAL
// ======================================================

let currentUser = null;
let currentVideoIndex = 0;
let videos = [];
let videoItems = [];


// ======================================================
// WAIT FOR HTML
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  console.log("WWC-Core app.js started ✅");


  // ------------------------------------------
  // AUTH
  // ------------------------------------------

  onAuthStateChanged(auth, (user) => {

    currentUser = user;

    console.log(
      user
        ? "Logged in: " + (user.email || user.displayName || "User")
        : "Not logged in"
    );

  });


  // ------------------------------------------
  // START FEATURES
  // ------------------------------------------

  setupLogout();
  setupVideos();
  setupLike();
  setupComment();
  setupShare();
  setupFollow();
  setupActionProtection();

});


// ======================================================
// LOGOUT
// ======================================================

function setupLogout() {

  const buttons = document.querySelectorAll(
    "#logoutBtn, .logout-btn, [data-action='logout']"
  );


  buttons.forEach((button) => {

    button.addEventListener("click", async (event) => {

      event.preventDefault();
      event.stopPropagation();


      try {

        await signOut(auth);

        console.log("Logout successful");

        window.location.href = "./login.html";

      } catch (error) {

        console.error("Logout error:", error);

        alert("Logout করা যায়নি। আবার চেষ্টা করুন।");

      }

    });

  });

}


// ======================================================
// VIDEO SYSTEM
// ======================================================

function setupVideos() {

  videoItems = Array.from(
    document.querySelectorAll(".video-item")
  );


  videos = Array.from(
    document.querySelectorAll(".video-item video")
  );


  console.log("Video items:", videoItems.length);
  console.log("Videos:", videos.length);


  if (!videos.length) {

    console.warn("কোনো video পাওয়া যায়নি");

    return;

  }


  // Video setup
  videos.forEach((video, index) => {

    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    video.preload = "metadata";


    // Video শেষ হলে পরের ভিডিও
    video.addEventListener("ended", () => {

      if (index < videos.length - 1) {

        goToVideo(index + 1);

      } else {

        goToVideo(0);

      }

    });


    // Video click
    video.addEventListener("click", (event) => {

      event.stopPropagation();


      if (video.paused) {

        video.play().catch(() => {});

      } else {

        video.pause();

      }

    });

  });


  // প্রথম ভিডিও
  currentVideoIndex = 0;

  playCurrentVideo();


  // Swipe
  setupSwipe();


  // Scroll
  setupScroll();

}


// ======================================================
// PLAY CURRENT VIDEO
// ======================================================

function playCurrentVideo() {

  videos.forEach((video, index) => {

    if (index === currentVideoIndex) {

      video.muted = true;

      video.play().catch((error) => {

        console.log(
          "Autoplay blocked:",
          error
        );

      });

    } else {

      video.pause();

    }

  });

}


// ======================================================
// GO TO VIDEO
// ======================================================

function goToVideo(index) {

  if (!videos.length) return;


  if (index < 0) {

    index = 0;

  }


  if (index >= videos.length) {

    index = videos.length - 1;

  }


  currentVideoIndex = index;


  const item = videoItems[index];


  if (item) {

    item.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }


  setTimeout(() => {

    playCurrentVideo();

  }, 150);

}


// ======================================================
// SWIPE
// ======================================================

function setupSwipe() {

  const feed =
    document.getElementById("video-feed") ||
    document.querySelector(".video-feed");


  if (!feed) {

    console.warn("video-feed পাওয়া যায়নি");

    return;

  }


  let startY = 0;
  let startX = 0;


  feed.addEventListener(
    "touchstart",
    (event) => {

      if (!event.touches.length) return;


      startY =
        event.touches[0].clientY;


      startX =
        event.touches[0].clientX;

    },
    { passive: true }
  );


  feed.addEventListener(
    "touchend",
    (event) => {

      if (!event.changedTouches.length) return;


      const endY =
        event.changedTouches[0].clientY;


      const endX =
        event.changedTouches[0].clientX;


      const differenceY =
        startY - endY;


      const differenceX =
        startX - endX;


      // Horizontal swipe বাদ
      if (
        Math.abs(differenceX) >
        Math.abs(differenceY)
      ) {

        return;

      }


      // UP
      if (differenceY > 60) {

        goToVideo(
          currentVideoIndex + 1
        );

      }


      // DOWN
      else if (differenceY < -60) {

        goToVideo(
          currentVideoIndex - 1
        );

      }

    },
    { passive: true }
  );

}


// ======================================================
// SCROLL
// ======================================================

function setupScroll() {

  const feed =
    document.getElementById("video-feed") ||
    document.querySelector(".video-feed");


  if (!feed) return;


  let timer = null;


  feed.addEventListener(
    "scroll",
    () => {

      clearTimeout(timer);


      timer = setTimeout(() => {

        let closest = 0;
        let smallest = Infinity;


        videoItems.forEach(
          (item, index) => {

            const rect =
              item.getBoundingClientRect();


            const distance =
              Math.abs(rect.top);


            if (
              distance <
              smallest
            ) {

              smallest = distance;
              closest = index;

            }

          }
        );


        currentVideoIndex =
          closest;


        playCurrentVideo();

      }, 150);

    },
    { passive: true }
  );

}


// ======================================================
// LIKE
// ======================================================

function setupLike() {

  const buttons =
    document.querySelectorAll(
      ".like-btn, [data-action='like']"
    );


  buttons.forEach(
    (button, index) => {

      const likeKey =
        "wwc_like_" + index;


      const countKey =
        "wwc_like_count_" + index;


      let liked =
        localStorage.getItem(
          likeKey
        ) === "true";


      let count =
        parseInt(
          localStorage.getItem(
            countKey
          ) || "0",
          10
        );


      updateLike(
        button,
        liked,
        count
      );


      button.addEventListener(
        "click",
        (event) => {

          event.preventDefault();
          event.stopPropagation();


          liked =
            !liked;


          if (liked) {

            count++;

          } else {

            count =
              Math.max(
                0,
                count - 1
              );

          }


          localStorage.setItem(
            likeKey,
            liked
          );


          localStorage.setItem(
            countKey,
            count
          );


          updateLike(
            button,
            liked,
            count
          );

        }
      );

    }
  );

}


// ======================================================
// LIKE UPDATE
// ======================================================

function updateLike(
  button,
  liked,
  count
) {

  button.classList.toggle(
    "liked",
    liked
  );


  const countElement =
    button.querySelector(
      ".like-count"
    );


  if (countElement) {

    countElement.textContent =
      count;

  }


  button.setAttribute(
    "aria-pressed",
    liked
      ? "true"
      : "false"
  );

}


// ======================================================
// COMMENT
// ======================================================

function setupComment() {

  const buttons =
    document.querySelectorAll(
      ".comment-btn, [data-action='comment']"
    );


  buttons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        (event) => {

          event.preventDefault();
          event.stopPropagation();


          const text =
            prompt(
              "আপনার মন্তব্য লিখুন:"
            );


          if (
            !text ||
            !text.trim()
          ) {

            return;

          }


          const item =
            button.closest(
              ".video-item"
            );


          if (!item) return;


          let box =
            item.querySelector(
              ".wwc-comments"
            );


          if (!box) {

            box =
              document.createElement(
                "div"
              );


            box.className =
              "wwc-comments";


            box.style.position =
              "absolute";


            box.style.left =
              "15px";


            box.style.right =
              "15px";


            box.style.bottom =
              "100px";


            box.style.background =
              "rgba(0,0,0,.85)";


            box.style.color =
              "#fff";


            box.style.padding =
              "10px";


            box.style.borderRadius =
              "10px";


            box.style.zIndex =
              "9999";


            item.appendChild(box);

          }


          const comment =
            document.createElement(
              "div"
            );


          comment.textContent =
            "💬 " +
            text.trim();


          comment.style.marginBottom =
            "6px";


          box.appendChild(
            comment
          );

        }
      );

    }
  );

}


// ======================================================
// SHARE
// ======================================================

function setupShare() {

  const buttons =
    document.querySelectorAll(
      ".share-btn, [data-action='share']"
    );


  buttons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        async (event) => {

          event.preventDefault();
          event.stopPropagation();


          const url =
            window.location.href;


          try {

            if (
              navigator.share
            ) {

              await navigator.share({
                title:
                  "World Wide Connect",

                text:
                  "এই ভিডিওটি দেখুন ❤️",

                url: url

              });

            } else {

              await navigator.clipboard.writeText(
                url
              );


              alert(
                "লিংক কপি হয়েছে ✅"
              );

            }

          } catch (error) {

            console.log(
              "Share cancelled:",
              error
            );

          }

        }
      );

    }
  );

}


// ======================================================
// FOLLOW
// ======================================================

function setupFollow() {

  const buttons =
    document.querySelectorAll(
      ".follow-btn, [data-action='follow']"
    );


  buttons.forEach(
    (button, index) => {

      const key =
        "wwc_follow_" +
        index;


      let following =
        localStorage.getItem(
          key
        ) === "true";


      updateFollow(
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
            key,
            following
          );


          updateFollow(
            button,
            following
          );

        }
      );

    }
  );

}


// ======================================================
// FOLLOW UPDATE
// ======================================================

function updateFollow(
  button,
  following
) {

  if (following) {

    button.textContent =
      "Following ✓";

  } else {

    button.textContent =
      "Follow";

  }

}


// ======================================================
// ACTION BUTTON PROTECTION
// ======================================================

function setupActionProtection() {

  const buttons =
    document.querySelectorAll(
      ".actions button"
    );


  buttons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        (event) => {

          event.stopPropagation();

        }
      );

    }
  );

}


// ======================================================
// READY
// ======================================================

console.log(
  "WWC-Core app.js loaded ✅"
);
