/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   COMPLETE APP.JS
   ========================================================= */

"use strict";

/* =========================================================
   FIREBASE
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
  setDoc
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
  appId: "1:93178453668:web:2184630caae8e61f7445031",
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

let currentUser = null;


/* =========================================================
   VIDEO INFORMATION
   ========================================================= */

const videoInfo = {
  video1: {
    title: "Welcome to World Wide Connect",
    caption: "Welcome to World Wide Connect 🌎"
  },

  video2: {
    title: "Share Your World",
    caption: "Share your world with everyone 🌎"
  },

  video3: {
    title: "Connect With The World",
    caption: "Connect with the world 🌍"
  }
};


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function getStorage(key, fallback) {

  try {

    const value = localStorage.getItem(key);

    if (value === null) {
      return fallback;
    }

    return JSON.parse(value);

  } catch (error) {

    console.error("Storage error:", error);

    return fallback;
  }
}


function setStorage(key, value) {

  try {

    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

  } catch (error) {

    console.error("Storage save error:", error);
  }
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(text) {

  let box = document.getElementById("wwcMessage");

  if (!box) {

    box = document.createElement("div");

    box.id = "wwcMessage";

    box.style.position = "fixed";
    box.style.left = "50%";
    box.style.bottom = "80px";
    box.style.transform = "translateX(-50%)";
    box.style.zIndex = "999999";
    box.style.background = "#222";
    box.style.color = "#fff";
    box.style.padding = "12px 18px";
    box.style.borderRadius = "12px";
    box.style.fontSize = "14px";
    box.style.maxWidth = "90%";
    box.style.textAlign = "center";
    box.style.boxShadow = "0 5px 25px rgba(0,0,0,.4)";

    document.body.appendChild(box);
  }

  box.textContent = text;
  box.style.display = "block";

  clearTimeout(window.wwcMessageTimer);

  window.wwcMessageTimer = setTimeout(() => {

    box.style.display = "none";

  }, 2500);
}


/* =========================================================
   PROFILE CREATION
   ========================================================= */

async function createProfile(user) {

  if (!user) {
    return;
  }

  try {

    const userRef = doc(
      db,
      "users",
      user.uid
    );

    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {

      await setDoc(
        userRef,
        {
          name: user.displayName || "WWC User",
          username: "wwc_user",
          email: user.email || "",
          bio: "Welcome to my WWC profile 🌍",
          photoURL: user.photoURL || "",
          country: "Bangladesh",
          followers: 0,
          following: 0,
          likes: 0,
          createdAt: new Date().toISOString()
        }
      );

      console.log("Profile created");

    }

  } catch (error) {

    console.error(
      "Profile creation error:",
      error
    );
  }
}


/* =========================================================
   AUTH
   ========================================================= */

function setupAuth() {

  onAuthStateChanged(
    auth,
    async (user) => {

      currentUser = user;

      if (user) {

        console.log(
          "Login:",
          user.email || user.uid
        );

        await createProfile(user);

        updateLoginUI(true);

      } else {

        console.log(
          "User not logged in"
        );

        updateLoginUI(false);
      }
    }
  );
}


/* =========================================================
   LOGIN UI
   ========================================================= */

function updateLoginUI(loggedIn) {

  const loginButtons =
    document.querySelectorAll(
      "#loginBtn, .login-btn"
    );

  const logoutButtons =
    document.querySelectorAll(
      "#logoutBtn, .logout-btn, .logout-menu-btn"
    );

  loginButtons.forEach(button => {

    button.style.display =
      loggedIn ? "none" : "";

  });

  logoutButtons.forEach(button => {

    button.style.display =
      loggedIn ? "" : "none";

  });
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutUser() {

  try {

    await signOut(auth);

    showMessage(
      "✅ Logout সফল হয়েছে"
    );

    setTimeout(() => {

      window.location.href =
        "./auth.html";

    }, 500);

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

    showMessage(
      "❌ Logout করা যায়নি"
    );
  }
}


/* =========================================================
   VIDEO TITLES + CAPTIONS
   ========================================================= */

function setupVideoText() {

  const items =
    document.querySelectorAll(
      ".video-item"
    );

  items.forEach(item => {

    const id =
      item.dataset.videoId;

    const info =
      videoInfo[id];

    if (!info) {
      return;
    }

    const videoInfoBox =
      item.querySelector(
        ".video-info"
      );

    if (!videoInfoBox) {
      return;
    }

    let title =
      videoInfoBox.querySelector(
        ".video-title"
      );

    if (!title) {

      title =
        document.createElement(
          "div"
        );

      title.className =
        "video-title";

      title.style.fontSize =
        "18px";

      title.style.fontWeight =
        "bold";

      title.style.marginBottom =
        "6px";

      videoInfoBox.prepend(
        title
      );
    }

    title.textContent =
      info.title;

    const caption =
      videoInfoBox.querySelector(
        ".video-caption"
      );

    if (caption) {

      caption.textContent =
        info.caption;
    }

  });
}


/* =========================================================
   VIDEO FEED
   ========================================================= */

function setupVideoFeed() {

  const feed =
    document.getElementById(
      "video-feed"
    );

  if (!feed) {
    return;
  }

  const items =
    Array.from(
      feed.querySelectorAll(
        ".video-item"
      )
    );

  const videos =
    items
      .map(item =>
        item.querySelector(
          ".feed-video"
        )
      )
      .filter(Boolean);

  if (!videos.length) {
    return;
  }

  videos.forEach(video => {

    video.setAttribute(
      "playsinline",
      ""
    );

    video.setAttribute(
      "webkit-playsinline",
      ""
    );

    video.preload =
      "metadata";

    video.muted = true;

    video.addEventListener(
      "ended",
      () => {

        const currentIndex =
          videos.indexOf(video);

        if (
          currentIndex >= 0 &&
          currentIndex <
          videos.length - 1
        ) {

          const next =
            items[currentIndex + 1];

          next.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

        }

      }
    );

    video.addEventListener(
      "play",
      () => {

        videos.forEach(other => {

          if (
            other !== video &&
            !other.paused
          ) {

            other.pause();
          }

        });

      }
    );

  });


  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          const video =
            entry.target;

          if (
            entry.isIntersecting &&
            entry.intersectionRatio >= 0.60
          ) {

            videos.forEach(other => {

              if (
                other !== video &&
                !other.paused
              ) {

                other.pause();
              }

            });

            video.play().catch(() => {});

          } else {

            video.pause();
          }

        });

      },
      {
        threshold: [
          0.40,
          0.60,
          0.80
        ]
      }
    );


  videos.forEach(video => {

    observer.observe(video);

  });


  /* প্রথম ভিডিও চালু */

  if (videos[0]) {

    videos[0].play().catch(() => {});

  }
}


/* =========================================================
   LIKE
   ========================================================= */

function setupLikeButtons() {

  const buttons =
    document.querySelectorAll(
      ".like-btn"
    );

  buttons.forEach(button => {

    if (
      button.dataset.ready ===
      "true"
    ) {
      return;
    }

    button.dataset.ready =
      "true";

    const item =
      button.closest(
        ".video-item"
      );

    if (!item) {
      return;
    }

    const videoId =
      item.dataset.videoId;

    const counts =
      getStorage(
        "wwc_likes",
        {}
      );

    const liked =
      getStorage(
        "wwc_liked",
        []
      );

    const countElement =
      button.querySelector(
        ".like-count"
      );

    if (countElement) {

      countElement.textContent =
        counts[videoId] || 0;

    }

    button.classList.toggle(
      "liked",
      liked.includes(videoId)
    );

    button.addEventListener(
      "click",
      event => {

        event.preventDefault();
        event.stopPropagation();

        let count =
          Number(
            counts[videoId] || 0
          );

        const index =
          liked.indexOf(
            videoId
          );

        if (index >= 0) {

          liked.splice(
            index,
            1
          );

          count =
            Math.max(
              0,
              count - 1
            );

        } else {

          liked.push(
            videoId
          );

          count++;
        }

        counts[videoId] =
          count;

        setStorage(
          "wwc_likes",
          counts
        );

        setStorage(
          "wwc_liked",
          liked
        );

        button.classList.toggle(
          "liked",
          index < 0
        );

        button.setAttribute(
          "aria-pressed",
          String(index < 0)
        );

        if (countElement) {

          countElement.textContent =
            count;
        }

      }
    );

  });
}


/* =========================================================
   SAVE
   ========================================================= */

function setupSaveButtons() {

  const buttons =
    document.querySelectorAll(
      ".save-btn"
    );

  buttons.forEach(button => {

    if (
      button.dataset.ready ===
      "true"
    ) {
      return;
    }

    button.dataset.ready =
      "true";

    const item =
      button.closest(
        ".video-item"
      );

    if (!item) {
      return;
    }

    const videoId =
      item.dataset.videoId;

    const saved =
      getStorage(
        "wwc_saved",
        []
      );

    const countElement =
      button.querySelector(
        ".save-count"
      );

    button.classList.toggle(
      "saved",
      saved.includes(videoId)
    );

    button.addEventListener(
      "click",
      event => {

        event.preventDefault();
        event.stopPropagation();

        const index =
          saved.indexOf(
            videoId
          );

        if (index >= 0) {

          saved.splice(
            index,
            1
          );

          button.classList.remove(
            "saved"
          );

          showMessage(
            "🔖 Save সরানো হয়েছে"
          );

        } else {

          saved.push(
            videoId
          );

          button.classList.add(
            "saved"
          );

          showMessage(
            "🔖 ভিডিও Save হয়েছে"
          );
        }

        setStorage(
          "wwc_saved",
          saved
        );

        if (countElement) {

          countElement.textContent =
            saved.includes(videoId)
              ? "1"
              : "0";

        }

      }
    );

  });
}


/* =========================================================
   SHARE
   ========================================================= */

function setupShareButtons() {

  const buttons =
    document.querySelectorAll(
      ".share-btn"
    );

  buttons.forEach(button => {

    if (
      button.dataset.ready ===
      "true"
    ) {
      return;
    }

    button.dataset.ready =
      "true";

    button.addEventListener(
      "click",
      async event => {

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
                "Check this video on World Wide Connect 🌎",
              url: url
            });

          } else if (
            navigator.clipboard
          ) {

            await navigator.clipboard.writeText(
              url
            );

            showMessage(
              "🔗 Link কপি হয়েছে"
            );

          } else {

            showMessage(
              "🔗 " + url
            );
          }

        } catch (error) {

          if (
            error.name !==
            "AbortError"
          ) {

            showMessage(
              "❌ Share করা যায়নি"
            );

          }
        }

      }
    );

  });
}


/* =========================================================
   FOLLOW
   ========================================================= */

function setupFollowButtons() {

  const buttons =
    document.querySelectorAll(
      ".follow-btn"
    );

  buttons.forEach(button => {

    if (
      button.dataset.ready ===
      "true"
    ) {
      return;
    }

    button.dataset.ready =
      "true";

    const item =
      button.closest(
        ".video-item"
      );

    if (!item) {
      return;
    }

    const usernameElement =
      item.querySelector(
        ".profile-area .username"
      );

    const username =
      usernameElement
        ? usernameElement.textContent.trim()
        : "wwc_user";

    const following =
      getStorage(
        "wwc_following",
        []
      );

    button.textContent =
      following.includes(username)
        ? "Following"
        : "Follow";

    button.addEventListener(
      "click",
      event => {

        event.preventDefault();
        event.stopPropagation();

        const index =
          following.indexOf(
            username
          );

        if (index >= 0) {

          following.splice(
            index,
            1
          );

          button.textContent =
            "Follow";

          showMessage(
            "Unfollow করা হয়েছে"
          );

        } else {

          following.push(
            username
          );

          button.textContent =
            "Following";

          showMessage(
            "✅ Follow করা হয়েছে"
          );
        }

        setStorage(
          "wwc_following",
          following
        );

      }
    );

  });
}


/* =========================================================
   COMMENT
   ========================================================= */

function setupComments() {

  const commentBox =
    document.getElementById(
      "commentBox"
    );

  const input =
    document.getElementById(
      "commentInput"
    );

  const send =
    document.getElementById(
      "commentSend"
    );

  const cancel =
    document.getElementById(
      "commentCancel"
    );

  let activeVideoId = null;

  const buttons =
    document.querySelectorAll(
      ".comment-btn"
    );

  buttons.forEach(button => {

    button.addEventListener(
      "click",
      event => {

        event.preventDefault();
        event.stopPropagation();

        const item =
          button.closest(
            ".video-item"
          );

        if (!item) {
          return;
        }

        activeVideoId =
          item.dataset.videoId;

        if (commentBox) {

          commentBox.style.display =
            "block";

        }

        if (input) {

          input.value = "";

          input.focus();

        }

      }
    );

  });


  if (cancel) {

    cancel.addEventListener(
      "click",
      () => {

        if (commentBox) {

          commentBox.style.display =
            "none";

        }

      }
    );

  }


  if (send) {

    send.addEventListener(
      "click",
      () => {

        const text =
          input
            ? input.value.trim()
            : "";

        if (!text) {

          showMessage(
            "⚠️ Comment লিখুন"
          );

          return;
        }

        const comments =
          getStorage(
            "wwc_comments",
            {}
          );

        if (
          !comments[activeVideoId]
        ) {

          comments[activeVideoId] =
            [];

        }

        comments[activeVideoId].push({
          text: text,
          time:
            new Date().toISOString()
        });

        setStorage(
          "wwc_comments",
          comments
        );

        if (commentBox) {

          commentBox.style.display =
            "none";

        }

        if (input) {

          input.value = "";

        }

        showMessage(
          "✅ Comment যোগ হয়েছে"
        );

      }
    );

  }
}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

  const searchBtn =
    document.getElementById(
      "searchBtn"
    );

  if (!searchBtn) {
    return;
  }

  searchBtn.addEventListener(
    "click",
    () => {

      let input =
        document.getElementById(
          "wwcSearchInput"
        );

      if (!input) {

        input =
          document.createElement(
            "input"
          );

        input.id =
          "wwcSearchInput";

        input.type =
          "search";

        input.placeholder =
          "Search video, username...";

        input.style.position =
          "fixed";

        input.style.top =
          "65px";

        input.style.left =
          "10px";

        input.style.right =
          "10px";

        input.style.zIndex =
          "99999";

        input.style.padding =
          "14px";

        input.style.borderRadius =
          "12px";

        input.style.border =
          "none";

        input.style.fontSize =
          "16px";

        document.body.appendChild(
          input
        );

        input.focus();

      } else {

        input.focus();
      }

      input.oninput =
        () => {

          const query =
            input.value
              .trim()
              .toLowerCase();

          document
            .querySelectorAll(
              ".video-item"
            )
            .forEach(item => {

              const text =
                item.textContent
                  .toLowerCase();

              item.style.display =
                !query ||
                text.includes(query)
                  ? ""
                  : "none";

            });

        };

    }
  );
}


/* =========================================================
   FOLLOWING / FOR YOU
   ========================================================= */

function setupFeedTabs() {

  const tabs =
    document.querySelectorAll(
      ".wwc-top-tab"
    );

  tabs.forEach(tab => {

    tab.addEventListener(
      "click",
      () => {

        tabs.forEach(item => {

          item.classList.remove(
            "active"
          );

        });

        tab.classList.add(
          "active"
        );

        const text =
          tab.textContent
            .trim()
            .toLowerCase();

        if (
          text.includes(
            "following"
          )
        ) {

          const following =
            getStorage(
              "wwc_following",
              []
            );

          document
            .querySelectorAll(
              ".video-item"
            )
            .forEach(item => {

              const usernameElement =
                item.querySelector(
                  ".profile-area .username"
                );

              const username =
                usernameElement
                  ? usernameElement.textContent.trim()
                  : "";

              item.style.display =
                following.length === 0 ||
                following.includes(username)
                  ? ""
                  : "none";

            });

          showMessage(
            following.length
              ? "👥 Following videos"
              : "ℹ️ এখনো কাউকে Follow করেননি"
          );

        } else {

          document
            .querySelectorAll(
              ".video-item"
            )
            .forEach(item => {

              item.style.display =
                "";

            });

          showMessage(
            "🌎 For You videos"
          );
        }

      }
    );

  });
}


/* =========================================================
   PROFILE MENU
   ========================================================= */

function setupProfileMenu() {

  const profileBtn =
    document.getElementById(
      "profileBtn"
    );

  const menu =
    document.getElementById(
      "profileMenu"
    );

  const close =
    document.getElementById(
      "profileMenuClose"
    );

  const menuProfile =
    document.getElementById(
      "profileBtnMenu"
    );

  if (profileBtn) {

    profileBtn.addEventListener(
      "click",
      event => {

        event.preventDefault();

        if (!currentUser) {

          window.location.href =
            "./auth.html";

          return;
        }

        if (menu) {

          menu.style.display =
            "block";

          menu.setAttribute(
            "aria-hidden",
            "false"
          );

        } else {

          openProfile();
        }

      }
    );

  }


  if (close) {

    close.addEventListener(
      "click",
      () => {

        if (menu) {

          menu.style.display =
            "none";

          menu.setAttribute(
            "aria-hidden",
            "true"
          );

        }

      }
    );

  }


  if (menuProfile) {

    menuProfile.addEventListener(
      "click",
      () => {

        openProfile();

      }
    );

  }
}


/* =========================================================
   PROFILE
   ========================================================= */

function openProfile() {

  if (!currentUser) {

    window.location.href =
      "./auth.html";

    return;
  }

  window.location.href =
    "./profile.html?uid=" +
    encodeURIComponent(
      currentUser.uid
    );
}


/* =========================================================
   USERNAME PROFILE
   ========================================================= */

function setupUserProfiles() {

  const usernames =
    document.querySelectorAll(
      ".profile-area .username"
    );

  usernames.forEach(element => {

    element.style.cursor =
      "pointer";

    element.addEventListener(
      "click",
      event => {

        event.preventDefault();
        event.stopPropagation();

        const username =
          element.textContent.trim();

        showMessage(
          "👤 " +
          username
        );

        if (currentUser) {

          window.location.href =
            "./profile.html?uid=" +
            encodeURIComponent(
              currentUser.uid
            );

        } else {

          window.location.href =
            "./auth.html";
        }

      }
    );

  });
}


/* =========================================================
   FRIENDS
   ========================================================= */

function setupFriends() {

  const button =
    document.getElementById(
      "friendsBtn"
    );

  if (!button) {
    return;
  }

  button.addEventListener(
    "click",
    event => {

      event.preventDefault();

      showMessage(
        "👥 Friends section প্রস্তুত হচ্ছে..."
      );

      setTimeout(() => {

        window.location.href =
          "./friends.html";

      }, 500);

    }
  );
}


/* =========================================================
   UPLOAD
   ========================================================= */

function setupUpload() {

  const button =
    document.getElementById(
      "uploadBtn"
    );

  if (!button) {
    return;
  }

  button.addEventListener(
    "click",
    event => {

      event.preventDefault();

      if (!currentUser) {

        showMessage(
          "🔐 Video Upload করতে Login করুন"
        );

        setTimeout(() => {

          window.location.href =
            "./auth.html";

        }, 600);

        return;
      }

      window.location.href =
        "./upload.html";

    }
  );
}


/* =========================================================
   INBOX
   ========================================================= */

function setupInbox() {

  const button =
    document.getElementById(
      "inboxBtn"
    );

  if (!button) {
    return;
  }

  button.addEventListener(
    "click",
    event => {

      event.preventDefault();

      showMessage(
        "💬 Inbox শীঘ্রই আসছে"
      );

    }
  );
}


/* =========================================================
   HOME
   ========================================================= */

function setupHome() {

  const button =
    document.getElementById(
      "homeBtn"
    );

  if (!button) {
    return;
  }

  button.addEventListener(
    "click",
    () => {

      window.location.href =
        "./index.html";

    }
  );
}


/* =========================================================
   LOGIN / LOGOUT
   ========================================================= */

function setupLoginLogout() {

  const login =
    document.getElementById(
      "loginBtn"
    );

  const logout =
    document.getElementById(
      "logoutBtn"
    );

  if (login) {

    login.addEventListener(
      "click",
      () => {

        window.location.href =
          "./auth.html";

      }
    );

  }

  if (logout) {

    logout.addEventListener(
      "click",
      () => {

        logoutUser();

      }
    );

  }
}


/* =========================================================
   START
   ========================================================= */

function startWWC() {

  console.log(
    "🌍 WWC-Core starting..."
  );

  setupAuth();

  setupVideoText();

  setupVideoFeed();

  setupLikeButtons();

  setupSaveButtons();

  setupShareButtons();

  setupFollowButtons();

  setupComments();

  setupSearch();

  setupFeedTabs();

  setupProfileMenu();

  setupUserProfiles();

  setupFriends();

  setupUpload();

  setupInbox();

  setupHome();

  setupLoginLogout();

  console.log(
    "✅ WWC-Core fully loaded"
  );
}


/* =========================================================
   DOM READY
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    startWWC
  );

} else {

  startWWC();

}


/* =========================================================
   GLOBAL WWC
   ========================================================= */

window.WWC = {

  getCurrentUser: () => {
    return currentUser;
  },

  getAuth: () => {
    return auth;
  },

  getFirestore: () => {
    return db;
  },

  logout: () => {
    return logoutUser();
  }

};

console.log(
  "🌎 WWC-Core app.js loaded successfully"
);
