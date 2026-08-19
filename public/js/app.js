/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   MAIN APP.JS
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
   FIREBASE INITIALIZE
   ========================================================= */

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   GLOBAL USER
   ========================================================= */

let currentUser = null;


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(auth, async (user) => {

  currentUser = user;

  if (user) {

    console.log(
      "WWC logged in:",
      user.email || user.uid
    );

    await makeUserProfile(user);

  } else {

    console.log(
      "WWC guest mode"
    );

  }

});


/* =========================================================
   CREATE USER PROFILE
   ========================================================= */

async function makeUserProfile(user) {

  try {

    const userRef =
      doc(db, "users", user.uid);

    const snap =
      await getDoc(userRef);

    if (!snap.exists()) {

      await setDoc(userRef, {

        uid: user.uid,

        name:
          user.displayName ||
          "WWC User",

        username:
          "wwc_" +
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
   PAGE HELPER
   ========================================================= */

function openPage(file) {

  window.location.href =
    "./" + file;

}


/* =========================================================
   HOME BUTTON
   ========================================================= */

const homeBtn =
  document.getElementById("homeBtn");

if (homeBtn) {

  homeBtn.addEventListener(
    "click",
    () => {

      openPage("index.html");

    }
  );

}


/* =========================================================
   FRIENDS BUTTON
   ========================================================= */

const friendsBtn =
  document.getElementById("friendsBtn");

if (friendsBtn) {

  friendsBtn.addEventListener(
    "click",
    () => {

      openPage("friends.html");

    }
  );

}


/* =========================================================
   UPLOAD BUTTON
   ========================================================= */

const uploadBtn =
  document.getElementById("uploadBtn");

if (uploadBtn) {

  uploadBtn.addEventListener(
    "click",
    () => {

      if (!currentUser) {

        openPage("auth.html");

        return;

      }

      openPage("upload.html");

    }
  );

}


/* =========================================================
   INBOX BUTTON
   ========================================================= */

const inboxBtn =
  document.getElementById("inboxBtn");

if (inboxBtn) {

  inboxBtn.addEventListener(
    "click",
    () => {

      openPage("inbox.html");

    }
  );

}


/* =========================================================
   BOTTOM PROFILE BUTTON
   ========================================================= */

const profileBtn =
  document.getElementById("profileBtn");

if (profileBtn) {

  profileBtn.addEventListener(
    "click",
    () => {

      if (!currentUser) {

        openPage("auth.html");

        return;

      }

      openPage("profile.html");

    }
  );

}


/* =========================================================
   SEARCH BUTTON
   ========================================================= */

const searchBtn =
  document.getElementById("searchBtn");

if (searchBtn) {

  searchBtn.addEventListener(
    "click",
    () => {

      const search =
        prompt(
          "🔍 Username লিখুন"
        );

      if (!search) return;

      const username =
        search
          .trim()
          .replace(/^@/, "");

      if (!username) return;

      openPage(
        "profile.html?username=" +
        encodeURIComponent(username)
      );

    }
  );

}


/* =========================================================
   PROFILE MENU
   ========================================================= */

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


/*
   আপনার index.html-এ profile menu আছে।
   Bottom profile button চাপলে সরাসরি profile.html যাবে।
   Menu-এর profile button-ও profile.html যাবে।
*/

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
   PROFILE MENU PROFILE
   ========================================================= */

if (profileBtnMenu) {

  profileBtnMenu.addEventListener(
    "click",
    () => {

      closeProfileMenu();

      if (!currentUser) {

        openPage("auth.html");

        return;

      }

      openPage("profile.html");

    }
  );

}


/* =========================================================
   LOGIN / REGISTER
   ========================================================= */

if (loginBtn) {

  loginBtn.addEventListener(
    "click",
    () => {

      closeProfileMenu();

      openPage("auth.html");

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
          "✅ Logout সফল হয়েছে"
        );

        openPage("auth.html");

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

        alert(
          "❌ Logout করা যায়নি"
        );

      }

    }
  );

}


/* =========================================================
   VIDEO PROFILE
   ========================================================= */

document
  .querySelectorAll(
    ".video-item .profile-photo"
  )
  .forEach(photo => {

    photo.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        const item =
          photo.closest(
            ".video-item"
          );

        if (!item) return;

        const usernameElement =
          item.querySelector(
            ".profile-area .username"
          );

        if (!usernameElement) return;

        const username =
          usernameElement.textContent
            .trim()
            .replace(/^@/, "");

        if (!username) return;

        openPage(
          "profile.html?username=" +
          encodeURIComponent(username)
        );

      }
    );

  });


/* =========================================================
   VIDEO USERNAME PROFILE
   ========================================================= */

document
  .querySelectorAll(
    ".video-item .profile-area .username"
  )
  .forEach(usernameElement => {

    usernameElement.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        const username =
          usernameElement.textContent
            .trim()
            .replace(/^@/, "");

        if (!username) return;

        openPage(
          "profile.html?username=" +
          encodeURIComponent(username)
        );

      }
    );

  });


/* =========================================================
   FOLLOW
   ========================================================= */

document
  .querySelectorAll(".follow-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      async event => {

        event.stopPropagation();

        if (!currentUser) {

          openPage("auth.html");

          return;

        }

        if (
          button.classList.contains(
            "following"
          )
        ) {

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
      event => {

        event.stopPropagation();

        const count =
          button.querySelector(
            ".like-count"
          );

        let number =
          Number(
            count?.textContent || 0
          );

        const liked =
          button.classList.contains(
            "liked"
          );

        if (liked) {

          number =
            Math.max(
              0,
              number - 1
            );

          button.classList.remove(
            "liked"
          );

          button.setAttribute(
            "aria-pressed",
            "false"
          );

        } else {

          number++;

          button.classList.add(
            "liked"
          );

          button.setAttribute(
            "aria-pressed",
            "true"
          );

        }

        if (count) {

          count.textContent =
            number;

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

        const count =
          button.querySelector(
            ".save-count"
          );

        let number =
          Number(
            count?.textContent || 0
          );

        const saved =
          button.classList.contains(
            "saved"
          );

        if (saved) {

          number =
            Math.max(
              0,
              number - 1
            );

          button.classList.remove(
            "saved"
          );

          button.setAttribute(
            "aria-pressed",
            "false"
          );

        } else {

          number++;

          button.classList.add(
            "saved"
          );

          button.setAttribute(
            "aria-pressed",
            "true"
          );

        }

        if (count) {

          count.textContent =
            number;

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

        const item =
          button.closest(
            ".video-item"
          );

        const videoId =
          item?.dataset.videoId ||
          "";

        const url =
          window.location.href
            .split("#")[0] +
          "#" +
          videoId;

        try {

          if (
            navigator.share
          ) {

            await navigator.share({

              title:
                "World Wide Connect",

              text:
                "এই ভিডিওটি দেখুন 🌍",

              url:
                url

            });

          } else if (
            navigator.clipboard
          ) {

            await navigator.clipboard.writeText(
              url
            );

            alert(
              "✅ Video link কপি হয়েছে"
            );

          } else {

            prompt(
              "Video link:",
              url
            );

          }

        } catch (error) {

          console.log(
            "Share cancelled"
          );

        }

      }
    );

  });


/* =========================================================
   COMMENT
   ========================================================= */

const commentBox =
  document.getElementById("commentBox");

const commentInput =
  document.getElementById("commentInput");

const commentCancel =
  document.getElementById("commentCancel");

const commentSend =
  document.getElementById("commentSend");


document
  .querySelectorAll(".comment-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        if (!commentBox) return;

        commentBox.classList.add(
          "show"
        );

        if (commentInput) {

          commentInput.value =
            "";

          commentInput.focus();

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
          "⚠️ Comment লিখুন"
        );

        return;

      }

      if (commentBox) {

        commentBox.classList.remove(
          "show"
        );

      }

      if (commentInput) {

        commentInput.value =
          "";

      }

      alert(
        "✅ Comment পাঠানো হয়েছে"
      );

    }
  );

}


/* =========================================================
   VIDEO AUTO PLAY
   ========================================================= */

const videoFeed =
  document.getElementById(
    "video-feed"
  );

const videos =
  document.querySelectorAll(
    ".feed-video"
  );


if (
  videoFeed &&
  videos.length > 0
) {

  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

            const video =
              entry.target;

            if (
              entry.isIntersecting &&
              entry.intersectionRatio >= 0.65
            ) {

              videos.forEach(
                otherVideo => {

                  if (
                    otherVideo !== video
                  ) {

                    otherVideo.pause();

                  }

                }
              );

              video.play().catch(
                () => {}
              );

            } else {

              video.pause();

            }

          }
        );

      },
      {
        root: videoFeed,
        threshold: 0.65
      }
    );


  videos.forEach(
    video => {

      observer.observe(
        video
      );

    }
  );

}


/* =========================================================
   NEXT VIDEO AFTER END
   ========================================================= */

videos.forEach(
  video => {

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

  }
);


/* =========================================================
   TOP TABS
   ========================================================= */

document
  .querySelectorAll(
    ".wwc-top-tab"
  )
  .forEach(tab => {

    tab.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".wwc-top-tab"
          )
          .forEach(
            item => {

              item.classList.remove(
                "active"
              );

            }
          );

        tab.classList.add(
          "active"
        );

      }
    );

  });


/* =========================================================
   CLOSE PROFILE MENU
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
      )
    ) {

      closeProfileMenu();

    }

  }
);


/* =========================================================
   ESCAPE
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
   VIDEO CLICK = PLAY / PAUSE
   ========================================================= */

videos.forEach(
  video => {

    video.addEventListener(
      "click",
      event => {

        /*
          শুধু ভিডিওতে ক্লিক করলে play/pause।
          Button-এ ক্লিক করলে এখানে আসবে না।
        */

        if (
          event.target.closest(
            "button"
          )
        ) {

          return;

        }

        if (video.paused) {

          video.play().catch(
            () => {}
          );

        } else {

          video.pause();

        }

      }
    );

  }
);


/* =========================================================
   INITIAL LOG
   ========================================================= */

console.log(
  "🌍 WWC-Core app.js loaded"
);
