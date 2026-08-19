/* =========================================================
   WORLD WIDE CONNECT - WWC CORE
   app.js
   ========================================================= */

import {
  getApps,
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyCgio17aPEfR7d6juqIhn3yi6Mf65W_tO4",
  authDomain: "world-wide-connect-62c87.firebaseapp.com",
  projectId: "world-wide-connect-62c87",
  storageBucket: "world-wide-connect-62c87.firebasestorage.app",
  messagingSenderId: "93178453668",
  appId: "1:93178453668:web:2184630caa8e61f7445031",
  measurementId: "G-PKFJ5NEMGQ"
};


/* =========================================================
   FIREBASE START
   ========================================================= */

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   ELEMENTS
   ========================================================= */

const feed = document.getElementById("video-feed");

const friendsBtn =
  document.getElementById("friendsBtn");

const uploadBtn =
  document.getElementById("uploadBtn");

const inboxBtn =
  document.getElementById("inboxBtn");

const profileBtn =
  document.getElementById("profileBtn");

const homeBtn =
  document.getElementById("homeBtn");

const searchBtn =
  document.getElementById("searchBtn");

const profileMenu =
  document.getElementById("profileMenu");

const profileMenuClose =
  document.getElementById("profileMenuClose");

const profileBtnMenu =
  document.getElementById("profileBtnMenu");

const loginBtn =
  document.getElementById("loginBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

const commentBox =
  document.getElementById("commentBox");

const commentInput =
  document.getElementById("commentInput");

const commentCancel =
  document.getElementById("commentCancel");

const commentSend =
  document.getElementById("commentSend");


let currentUser = null;
let currentCommentVideo = null;


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(auth, async (user) => {

  currentUser = user;

  if (user) {

    console.log(
      "WWC Login:",
      user.email || user.uid
    );

    await createUserProfileIfNeeded(user);

  } else {

    console.log("WWC: Guest user");

  }

});


/* =========================================================
   CREATE USER PROFILE
   ========================================================= */

async function createUserProfileIfNeeded(user) {

  try {

    const userRef =
      doc(db, "users", user.uid);

    const snapshot =
      await getDoc(userRef);

    if (!snapshot.exists()) {

      await setDoc(userRef, {

        uid: user.uid,

        name:
          user.displayName ||
          "WWC User",

        username:
          "wwc_user_" +
          user.uid.substring(0, 6),

        email:
          user.email || "",

        photoURL:
          user.photoURL ||
          "./images/profile.png",

        bio:
          "Welcome to World Wide Connect 🌍",

        followers: 0,

        following: 0,

        likes: 0,

        createdAt:
          new Date().toISOString()

      });

    }

  } catch (error) {

    console.error(
      "User profile error:",
      error
    );

  }

}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function goTo(page) {

  window.location.href = "./" + page;

}


/* =========================================================
   HOME
   ========================================================= */

if (homeBtn) {

  homeBtn.addEventListener(
    "click",
    () => {

      if (
        window.location.pathname.endsWith(
          "/index.html"
        )
      ) {

        if (feed) {

          feed.scrollTo({
            top: 0,
            behavior: "smooth"
          });

        }

      } else {

        goTo("index.html");

      }

    }
  );

}


/* =========================================================
   FRIENDS
   ========================================================= */

if (friendsBtn) {

  friendsBtn.addEventListener(
    "click",
    () => {

      goTo("friends.html");

    }
  );

}


/* =========================================================
   UPLOAD
   ========================================================= */

if (uploadBtn) {

  uploadBtn.addEventListener(
    "click",
    () => {

      if (!currentUser) {

        goTo("auth.html");

        return;

      }

      goTo("upload.html");

    }
  );

}


/* =========================================================
   INBOX
   ========================================================= */

if (inboxBtn) {

  inboxBtn.addEventListener(
    "click",
    () => {

      goTo("inbox.html");

    }
  );

}


/* =========================================================
   PROFILE BUTTON
   ========================================================= */

if (profileBtn) {

  profileBtn.addEventListener(
    "click",
    () => {

      if (!currentUser) {

        goTo("auth.html");

        return;

      }

      goTo("profile.html");

    }
  );

}


/* =========================================================
   SEARCH
   ========================================================= */

if (searchBtn) {

  searchBtn.addEventListener(
    "click",
    () => {

      const query =
        prompt(
          "🔍 Search username:"
        );

      if (!query) return;

      const username =
        query.trim().replace(/^@/, "");

      if (!username) return;

      window.location.href =
        "./profile.html?username=" +
        encodeURIComponent(username);

    }
  );

}


/* =========================================================
   VIDEO USER PROFILE
   ========================================================= */

document
  .querySelectorAll(
    ".video-item .profile-area .profile-photo, " +
    ".video-item .profile-area .username"
  )
  .forEach(element => {

    element.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        const videoItem =
          element.closest(".video-item");

        if (!videoItem) return;

        const usernameElement =
          videoItem.querySelector(
            ".profile-area .username"
          );

        if (!usernameElement) return;

        const username =
          usernameElement.textContent
            .trim()
            .replace(/^@/, "");

        if (!username) return;

        window.location.href =
          "./profile.html?username=" +
          encodeURIComponent(username);

      }
    );

  });


/* =========================================================
   FOLLOW BUTTON
   ========================================================= */

document
  .querySelectorAll(".follow-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      async event => {

        event.stopPropagation();

        if (!currentUser) {

          goTo("auth.html");

          return;

        }

        const videoItem =
          button.closest(".video-item");

        if (!videoItem) return;

        const usernameElement =
          videoItem.querySelector(
            ".profile-area .username"
          );

        if (!usernameElement) return;

        const username =
          usernameElement.textContent
            .trim()
            .replace(/^@/, "");

        if (!username) return;

        const following =
          button.classList.contains(
            "following"
          );

        if (following) {

          button.classList.remove(
            "following"
          );

          button.textContent =
            "Follow";

        } else {

          button.classList.add(
            "following"
          );

          button.textContent =
            "Following";

        }

      }
    );

  });


/* =========================================================
   LIKE
   ========================================================= */

document
  .querySelectorAll(".like-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      async event => {

        event.stopPropagation();

        const countElement =
          button.querySelector(
            ".like-count"
          );

        let count =
          Number(
            countElement?.textContent || 0
          );

        const liked =
          button.classList.contains(
            "liked"
          );

        if (liked) {

          count =
            Math.max(0, count - 1);

          button.classList.remove(
            "liked"
          );

          button.setAttribute(
            "aria-pressed",
            "false"
          );

        } else {

          count++;

          button.classList.add(
            "liked"
          );

          button.setAttribute(
            "aria-pressed",
            "true"
          );

        }

        if (countElement) {

          countElement.textContent =
            count;

        }

      }
    );

  });


/* =========================================================
   SAVE
   ========================================================= */

document
  .querySelectorAll(".save-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        const countElement =
          button.querySelector(
            ".save-count"
          );

        let count =
          Number(
            countElement?.textContent || 0
          );

        const saved =
          button.classList.contains(
            "saved"
          );

        if (saved) {

          count =
            Math.max(0, count - 1);

          button.classList.remove(
            "saved"
          );

          button.setAttribute(
            "aria-pressed",
            "false"
          );

        } else {

          count++;

          button.classList.add(
            "saved"
          );

          button.setAttribute(
            "aria-pressed",
            "true"
          );

        }

        if (countElement) {

          countElement.textContent =
            count;

        }

      }
    );

  });


/* =========================================================
   SHARE
   ========================================================= */

document
  .querySelectorAll(".share-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      async event => {

        event.stopPropagation();

        const videoItem =
          button.closest(".video-item");

        const url =
          window.location.origin +
          window.location.pathname +
          "#video-" +
          (
            videoItem?.dataset.videoId ||
            ""
          );

        try {

          if (
            navigator.share
          ) {

            await navigator.share({

              title:
                "World Wide Connect",

              text:
                "এই ভিডিওটি World Wide Connect-এ দেখুন 🌍",

              url: url

            });

          } else if (
            navigator.clipboard
          ) {

            await navigator.clipboard.writeText(
              url
            );

            alert(
              "✅ Video link কপি হয়েছে।"
            );

          } else {

            prompt(
              "Video link:",
              url
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

  });


/* =========================================================
   COMMENTS
   ========================================================= */

document
  .querySelectorAll(".comment-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        currentCommentVideo =
          button.closest(".video-item");

        if (!commentBox) return;

        commentBox.classList.add(
          "show"
        );

        if (commentInput) {

          commentInput.value = "";

          setTimeout(
            () => commentInput.focus(),
            100
          );

        }

      }
    );

  });


if (commentCancel) {

  commentCancel.addEventListener(
    "click",
    () => {

      if (commentBox) {

        commentBox.classList.remove(
          "show"
        );

      }

      currentCommentVideo =
        null;

    }
  );

}


if (commentSend) {

  commentSend.addEventListener(
    "click",
    () => {

      const text =
        commentInput?.value.trim();

      if (!text) {

        alert(
          "⚠️ Comment লিখুন।"
        );

        return;

      }

      console.log(
        "Comment:",
        text
      );

      if (commentBox) {

        commentBox.classList.remove(
          "show"
        );

      }

      if (commentInput) {

        commentInput.value = "";

      }

      alert(
        "✅ Comment পাঠানো হয়েছে।"
      );

    }
  );

}


/* =========================================================
   PROFILE MENU
   ========================================================= */

if (profileMenuClose) {

  profileMenuClose.addEventListener(
    "click",
    () => {

      closeProfileMenu();

    }
  );

}


function closeProfileMenu() {

  if (!profileMenu) return;

  profileMenu.classList.remove(
    "show"
  );

  profileMenu.setAttribute(
    "aria-hidden",
    "true"
  );

}


function openProfileMenu() {

  if (!profileMenu) return;

  profileMenu.classList.add(
    "show"
  );

  profileMenu.setAttribute(
    "aria-hidden",
    "false"
  );

}


/* =========================================================
   PROFILE MENU BUTTON
   ========================================================= */

if (profileBtnMenu) {

  profileBtnMenu.addEventListener(
    "click",
    () => {

      closeProfileMenu();

      if (!currentUser) {

        goTo("auth.html");

        return;

      }

      goTo("profile.html");

    }
  );

}


/* =========================================================
   LOGIN BUTTON
   ========================================================= */

if (loginBtn) {

  loginBtn.addEventListener(
    "click",
    () => {

      closeProfileMenu();

      goTo("auth.html");

    }
  );

}


/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

        closeProfileMenu();

        alert(
          "✅ Logout সফল হয়েছে।"
        );

        goTo("auth.html");

      } catch (error) {

        console.error(
          "Logout Error:",
          error
        );

        alert(
          "❌ Logout করা যায়নি।"
        );

      }

    }
  );

}


/* =========================================================
   CLOSE MENU OUTSIDE
   ========================================================= */

document.addEventListener(
  "click",
  event => {

    if (
      profileMenu &&
      profileMenu.classList.contains(
        "show"
      ) &&
      !profileMenu.contains(
        event.target
      ) &&
      event.target !== profileBtn
    ) {

      closeProfileMenu();

    }

  }
);


/* =========================================================
   VIDEO PLAY / PAUSE
   ========================================================= */

const videos =
  document.querySelectorAll(
    ".feed-video"
  );


videos.forEach(video => {

  video.addEventListener(
    "click",
    () => {

      if (video.paused) {

        video.play().catch(
          () => {}
        );

      } else {

        video.pause();

      }

    }
  );

});


/* =========================================================
   AUTO PLAY CURRENT VIDEO
   ========================================================= */

if (
  feed &&
  videos.length
) {

  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          const video =
            entry.target;

          if (
            entry.isIntersecting &&
            entry.intersectionRatio >= 0.65
          ) {

            videos.forEach(other => {

              if (
                other !== video
              ) {

                other.pause();

              }

            });

            video.play().catch(
              () => {}
            );

          } else {

            video.pause();

          }

        });

      },
      {
        root: feed,
        threshold: [0.65]
      }
    );


  videos.forEach(
    video => observer.observe(video)
  );

}


/* =========================================================
   VIDEO ENDED → NEXT VIDEO
   ========================================================= */

videos.forEach(video => {

  video.addEventListener(
    "ended",
    () => {

      const currentItem =
        video.closest(
          ".video-item"
        );

      if (!currentItem) return;

      const nextItem =
        currentItem.nextElementSibling;

      if (
        nextItem &&
        nextItem.classList.contains(
          "video-item"
        )
      ) {

        nextItem.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }

    }
  );

});


/* =========================================================
   TOP TABS
   ========================================================= */

document
  .querySelectorAll(".wwc-top-tab")
  .forEach(tab => {

    tab.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".wwc-top-tab"
          )
          .forEach(
            item =>
              item.classList.remove(
                "active"
              )
          );

        tab.classList.add(
          "active"
        );

      }
    );

  });


/* =========================================================
   VIDEO LOAD ERROR
   ========================================================= */

videos.forEach(video => {

  video.addEventListener(
    "error",
    () => {

      console.error(
        "Video load error:",
        video.currentSrc
      );

    }
  );

});


/* =========================================================
   ESC KEY
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeProfileMenu();

      if (commentBox) {

        commentBox.classList.remove(
          "show"
        );

      }

    }

  }
);


/* =========================================================
   START
   ========================================================= */

console.log(
  "🌍 World Wide Connect app.js loaded successfully."
);
