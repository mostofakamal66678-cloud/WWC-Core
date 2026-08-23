/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   COMPLETE MAIN APP.JS
   Firebase + Firestore + Video Feed
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
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
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
   GLOBAL STATE
   ========================================================= */

let currentUser = null;
let currentProfile = null;

let activeCommentVideoId = null;
let activeCommentButton = null;

let videoObserver = null;

const DEFAULT_PHOTO = "./images/profile.png";


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function openPage(file) {

  if (!file) return;

  window.location.href = "./" + file;

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

  return escapeHTML(value);

}


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(auth, async (user) => {

  currentUser = user || null;

  if (user) {

    console.log(
      "🌍 WWC Login:",
      user.email || user.uid
    );

    await createOrLoadUserProfile(user);

  } else {

    currentProfile = null;

    console.log(
      "🌍 WWC Guest Mode"
    );

  }

  await loadVideoFeed();

  updateLoginUI();

});


/* =========================================================
   USER PROFILE
   ========================================================= */

async function createOrLoadUserProfile(user) {

  try {

    const userRef = doc(
      db,
      "users",
      user.uid
    );

    const snapshot =
      await getDoc(userRef);


    if (!snapshot.exists()) {

      currentProfile = {

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
          DEFAULT_PHOTO,

        bio:
          "Welcome to World Wide Connect 🌍",

        followers: 0,

        following: 0,

        likes: 0,

        followingIds: [],

        followerIds: [],

        videos: [],

        createdAt:
          serverTimestamp()

      };


      await setDoc(
        userRef,
        currentProfile
      );

    } else {

      currentProfile =
        snapshot.data();

    }

  } catch (error) {

    console.error(
      "Profile error:",
      error
    );

  }

}


/* =========================================================
   LOGIN REQUIRED
   ========================================================= */

function requireLogin() {

  if (currentUser) {

    return true;

  }


  alert(
    "🔐 এই কাজটি করতে আগে Login করুন।"
  );


  openPage(
    "auth.html"
  );


  return false;

}


/* =========================================================
   LOGIN UI
   ========================================================= */

function updateLoginUI() {

  const loginBtn =
    document.getElementById(
      "loginBtn"
    );

  const logoutBtn =
    document.getElementById(
      "logoutBtn"
    );


  if (currentUser) {

    if (loginBtn) {

      loginBtn.style.display =
        "none";

    }

    if (logoutBtn) {

      logoutBtn.style.display =
        "flex";

    }

  } else {

    if (loginBtn) {

      loginBtn.style.display =
        "flex";

    }

    if (logoutBtn) {

      logoutBtn.style.display =
        "none";

    }

  }

}


/* =========================================================
   HOME
   ========================================================= */

const homeBtn =
  document.getElementById(
    "homeBtn"
  );


if (homeBtn) {

  homeBtn.addEventListener(
    "click",
    () => {

      openPage(
        "index.html"
      );

    }
  );

}


/* =========================================================
   FRIENDS
   ========================================================= */

const friendsBtn =
  document.getElementById(
    "friendsBtn"
  );


if (friendsBtn) {

  friendsBtn.addEventListener(
    "click",
    () => {

      openPage(
        "friends.html"
      );

    }
  );

}


/* =========================================================
   UPLOAD
   ========================================================= */

const uploadBtn =
  document.getElementById(
    "uploadBtn"
  );


if (uploadBtn) {

  uploadBtn.addEventListener(
    "click",
    () => {

      if (!requireLogin()) {
        return;
      }

      openPage(
        "upload.html"
      );

    }
  );

}


/* =========================================================
   INBOX
   ========================================================= */

const inboxBtn =
  document.getElementById(
    "inboxBtn"
  );


if (inboxBtn) {

  inboxBtn.addEventListener(
    "click",
    () => {

      if (!requireLogin()) {
        return;
      }

      openPage(
        "inbox.html"
      );

    }
  );

}


/* =========================================================
   PROFILE
   ========================================================= */

const profileBtn =
  document.getElementById(
    "profileBtn"
  );


if (profileBtn) {

  profileBtn.addEventListener(
    "click",
    () => {

      if (!requireLogin()) {
        return;
      }

      openPage(
        "profile.html"
      );

    }
  );

}


/* =========================================================
   SEARCH
   ========================================================= */

const searchBtn =
  document.getElementById(
    "searchBtn"
  );


if (searchBtn) {

  searchBtn.addEventListener(
    "click",
    () => {

      const value =
        prompt(
          "🔍 Username লিখুন"
        );


      if (!value) {
        return;
      }


      const username =
        value
          .trim()
          .replace(/^@/, "");


      if (!username) {
        return;
      }


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
  document.getElementById(
    "profileMenu"
  );

const profileMenuClose =
  document.getElementById(
    "profileMenuClose"
  );

const profileBtnMenu =
  document.getElementById(
    "profileBtnMenu"
  );

const loginBtn =
  document.getElementById(
    "loginBtn"
  );

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );


function openProfileMenu() {

  if (!profileMenu) {
    return;
  }

  profileMenu.classList.add(
    "show"
  );

  profileMenu.setAttribute(
    "aria-hidden",
    "false"
  );

}


function closeProfileMenu() {

  if (!profileMenu) {
    return;
  }

  profileMenu.classList.remove(
    "show"
  );

  profileMenu.setAttribute(
    "aria-hidden",
    "true"
  );

}


if (profileMenuClose) {

  profileMenuClose.addEventListener(
    "click",
    closeProfileMenu
  );

}


if (profileBtnMenu) {

  profileBtnMenu.addEventListener(
    "click",
    () => {

      closeProfileMenu();

      if (!requireLogin()) {
        return;
      }

      openPage(
        "profile.html"
      );

    }
  );

}


if (loginBtn) {

  loginBtn.addEventListener(
    "click",
    () => {

      closeProfileMenu();

      openPage(
        "auth.html"
      );

    }
  );

}


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

        openPage(
          "auth.html"
        );

      } catch (error) {

        console.error(
          "Logout error:",
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
   PROFILE BUTTON LONG/OPTION
   ========================================================= */

if (profileBtn) {

  profileBtn.addEventListener(
    "contextmenu",
    event => {

      event.preventDefault();

      openProfileMenu();

    }
  );

}


/* =========================================================
   LOAD VIDEO FEED
   ========================================================= */

async function loadVideoFeed() {

  const feed =
    document.getElementById(
      "video-feed"
    );


  if (!feed) {
    return;
  }


  /*
   * Firebase video থাকলে সেটি ব্যবহার করব।
   * Firebase video না থাকলে HTML-এর
   * existing videos রাখা হবে।
   */

  try {

    const usersSnapshot =
      await getDocs(
        collection(
          db,
          "users"
        )
      );


    const allVideos = [];


    usersSnapshot.forEach(
      userDoc => {

        const userData =
          userDoc.data();


        const videos =
          Array.isArray(
            userData.videos
          )
            ? userData.videos
            : [];


        videos.forEach(
          video => {

            if (!video) {
              return;
            }


            allVideos.push({

              ...video,

              uid:
                video.uid ||
                userDoc.id,

              username:
                video.username ||
                userData.username ||
                "wwc_user",

              name:
                video.name ||
                userData.name ||
                "WWC User",

              photoURL:
                video.photoURL ||
                userData.photoURL ||
                DEFAULT_PHOTO

            });

          }
        );

      }
    );


    /*
     * যদি Firebase-এ ভিডিও থাকে,
     * তাহলে Firebase feed দেখানো হবে।
     */

    if (allVideos.length > 0) {

      allVideos.sort(
        (a, b) => {

          const aTime =
            getTimeValue(
              a.createdAt
            );

          const bTime =
            getTimeValue(
              b.createdAt
            );

          return bTime - aTime;

        }
      );


      feed.innerHTML = "";


      allVideos.forEach(
        videoData => {

          createVideoElement(
            feed,
            videoData
          );

        }
      );

    }


    /*
     * Firebase video না থাকলে
     * HTML-এর existing video থাকবে।
     */

    attachVideoEvents();

    setupVideoObserver();

    setupVideoEndEvents();

    setupVideoClickEvents();

    setupFeedScroll();

    restoreVideoFromHash();


  } catch (error) {

    console.error(
      "Feed error:",
      error
    );


    /*
     * Firebase error হলেও
     * HTML-এর existing videos যেন থাকে।
     */

    attachVideoEvents();

    setupVideoObserver();

    setupVideoEndEvents();

    setupVideoClickEvents();

    setupFeedScroll();

  }

}


/* =========================================================
   TIME VALUE
   ========================================================= */

function getTimeValue(value) {

  if (!value) {
    return 0;
  }


  if (
    typeof value === "number"
  ) {

    return value;

  }


  if (
    typeof value === "string"
  ) {

    const time =
      new Date(value).getTime();

    return isNaN(time)
      ? 0
      : time;

  }


  if (
    value?.toMillis
  ) {

    return value.toMillis();

  }


  return 0;

}


/* =========================================================
   CREATE VIDEO ELEMENT
   ========================================================= */

function createVideoElement(
  feed,
  data
) {

  const videoId =
    String(
      data.id ||
      data.videoId ||
      (
        "video_" +
        Date.now() +
        "_" +
        Math.random()
          .toString(36)
          .substring(2, 8)
      )
    );


  const username =
    String(
      data.username ||
      "wwc_user"
    )
      .replace(
        /^@/,
        ""
      );


  const name =
    data.name ||
    "WWC User";


  const photoURL =
    data.photoURL ||
    DEFAULT_PHOTO;


  const videoURL =
    data.videoURL ||
    data.url ||
    data.downloadURL ||
    "";


  const caption =
    data.caption ||
    "";


  const likes =
    Number(
      data.likes ??
      data.likeCount ??
      0
    );


  const comments =
    Number(
      data.comments ??
      data.commentCount ??
      0
    );


  const saves =
    Number(
      data.saves ??
      data.saveCount ??
      0
    );


  if (!videoURL) {
    return;
  }


  const section =
    document.createElement(
      "section"
    );


  section.className =
    "video-item";


  section.dataset.videoId =
    videoId;


  section.dataset.uid =
    data.uid || "";


  section.dataset.username =
    username;


  section.innerHTML = `

    <video
      class="feed-video"
      muted
      playsinline
      preload="metadata"
    >

      <source
        src="${escapeAttribute(videoURL)}"
        type="video/mp4"
      >

      Your browser does not support video playback.

    </video>


    <div class="profile-area">

      <button
        class="profile-photo-btn"
        type="button"
        aria-label="Open profile"
      >

        <img
          class="profile-photo"
          src="${escapeAttribute(photoURL)}"
          alt="${escapeAttribute(name)}"
        >

      </button>


      <button
        class="username profile-username"
        type="button"
      >
        @${escapeHTML(username)}
      </button>


      <button
        class="follow-btn"
        type="button"
        data-username="${escapeAttribute(username)}"
      >
        Follow
      </button>

    </div>


    <div class="actions">

      <button
        class="action-btn like-btn"
        type="button"
        aria-label="Like"
        aria-pressed="false"
      >

        <span class="action-icon">
          ❤️
        </span>

        <span class="like-count">
          ${likes}
        </span>

      </button>


      <button
        class="action-btn comment-btn"
        type="button"
        aria-label="Comment"
      >

        <span class="action-icon">
          💬
        </span>

        <span class="comment-count">
          ${comments}
        </span>

      </button>


      <button
        class="action-btn save-btn"
        type="button"
        aria-label="Save"
        aria-pressed="false"
      >

        <span class="action-icon">
          🔖
        </span>

        <span class="save-count">
          ${saves}
        </span>

      </button>


      <button
        class="action-btn share-btn"
        type="button"
        aria-label="Share"
      >

        <span class="action-icon">
          ↗️
        </span>

        <span class="share-label">
          Share
        </span>

      </button>

    </div>


    <div class="video-info">

      <button
        class="username video-info-username"
        type="button"
      >
        @${escapeHTML(username)}
      </button>


      <div class="video-caption">
        ${escapeHTML(caption)}
      </div>


      <div class="video-music">
        🎵 Original sound - WWC
      </div>

    </div>

  `;


  feed.appendChild(
    section
  );

}


/* =========================================================
   ATTACH EVENTS
   ========================================================= */

function attachVideoEvents() {

  /*
   * Profile photo
   */

  document
    .querySelectorAll(
      ".video-item .profile-photo-btn"
    )
    .forEach(button => {

      button.onclick = event => {

        event.stopPropagation();

        const item =
          button.closest(
            ".video-item"
          );


        const username =
          item?.dataset.username;


        if (!username) {
          return;
        }


        openPage(
          "profile.html?username=" +
          encodeURIComponent(
            username
          )
        );

      };

    });


  /*
   * Username
   */

  document
    .querySelectorAll(
      ".video-item .profile-username, " +
      ".video-item .video-info-username"
    )
    .forEach(button => {

      button.onclick = event => {

        event.stopPropagation();


        const item =
          button.closest(
            ".video-item"
          );


        const username =
          item?.dataset.username;


        if (!username) {
          return;
        }


        openPage(
          "profile.html?username=" +
          encodeURIComponent(
            username
          )
        );

      };

    });


  /*
   * Follow
   */

  document
    .querySelectorAll(
      ".video-item .follow-btn"
    )
    .forEach(button => {

      button.onclick =
        async event => {

          event.stopPropagation();


          if (!requireLogin()) {
            return;
          }


          const username =
            button.dataset.username;


          if (!username) {
            return;
          }


          await toggleFollowByUsername(
            username,
            button
          );

        };

    });


  /*
   * Like
   */

  document
    .querySelectorAll(
      ".video-item .like-btn"
    )
    .forEach(button => {

      button.onclick =
        async event => {

          event.stopPropagation();


          if (!requireLogin()) {
            return;
          }


          const item =
            button.closest(
              ".video-item"
            );


          const videoId =
            item?.dataset.videoId;


          if (!videoId) {
            return;
          }


          await toggleLike(
            videoId,
            button
          );

        };

    });


  /*
   * Comment
   */

  document
    .querySelectorAll(
      ".video-item .comment-btn"
    )
    .forEach(button => {

      button.onclick =
        event => {

          event.stopPropagation();


          if (!requireLogin()) {
            return;
          }


          const item =
            button.closest(
              ".video-item"
            );


          const videoId =
            item?.dataset.videoId;


          if (!videoId) {
            return;
          }


          activeCommentVideoId =
            videoId;


          activeCommentButton =
            button;


          openCommentBox();

        };

    });


  /*
   * Save
   */

  document
    .querySelectorAll(
      ".video-item .save-btn"
    )
    .forEach(button => {

      button.onclick =
        async event => {

          event.stopPropagation();


          if (!requireLogin()) {
            return;
          }


          const item =
            button.closest(
              ".video-item"
            );


          const videoId =
            item?.dataset.videoId;


          if (!videoId) {
            return;
          }


          await toggleSave(
            videoId,
            button
          );

        };

    });


  /*
   * Share
   */

  document
    .querySelectorAll(
      ".video-item .share-btn"
    )
    .forEach(button => {

      button.onclick =
        async event => {

          event.stopPropagation();


          const item =
            button.closest(
              ".video-item"
            );


          const videoId =
            item?.dataset.videoId ||
            "";


          await shareVideo(
            videoId
          );

        };

    });

}


/* =========================================================
   FIND USER
   ========================================================= */

async function findUserByUsername(
  username
) {

  const cleanUsername =
    String(username)
      .replace(/^@/, "")
      .trim()
      .toLowerCase();


  if (!cleanUsername) {
    return null;
  }


  const usersSnapshot =
    await getDocs(
      collection(
        db,
        "users"
      )
    );


  for (
    const userDoc of usersSnapshot.docs
  ) {

    const data =
      userDoc.data();


    const currentUsername =
      String(
        data.username || ""
      )
        .replace(
          /^@/,
          ""
        )
        .toLowerCase();


    if (
      currentUsername ===
      cleanUsername
    ) {

      return {

        uid:
          userDoc.id,

        ...data

      };

    }

  }


  return null;

}


/* =========================================================
   FOLLOW
   ========================================================= */

async function toggleFollowByUsername(
  username,
  button
) {

  if (!currentUser) {
    return;
  }


  button.disabled =
    true;


  try {

    const targetUser =
      await findUserByUsername(
        username
      );


    if (!targetUser) {

      alert(
        "❌ User পাওয়া যায়নি।"
      );

      return;

    }


    if (
      targetUser.uid ===
      currentUser.uid
    ) {

      alert(
        "নিজেকে Follow করা যাবে না।"
      );

      return;

    }


    const myRef =
      doc(
        db,
        "users",
        currentUser.uid
      );


    const targetRef =
      doc(
        db,
        "users",
        targetUser.uid
      );


    const mySnapshot =
      await getDoc(
        myRef
      );


    const targetSnapshot =
      await getDoc(
        targetRef
      );


    if (
      !mySnapshot.exists() ||
      !targetSnapshot.exists()
    ) {

      return;

    }


    const myData =
      mySnapshot.data();


    const followingIds =
      Array.isArray(
        myData.followingIds
      )
        ? myData.followingIds
        : [];


    const alreadyFollowing =
      followingIds.includes(
        targetUser.uid
      );


    if (alreadyFollowing) {

      await updateDoc(
        myRef,
        {

          followingIds:
            arrayRemove(
              targetUser.uid
            ),

          following:
            increment(-1)

        }
      );


      await updateDoc(
        targetRef,
        {

          followerIds:
            arrayRemove(
              currentUser.uid
            ),

          followers:
            increment(-1)

        }
      );


      button.classList.remove(
        "following"
      );


      button.textContent =
        "Follow";

    } else {

      await updateDoc(
        myRef,
        {

          followingIds:
            arrayUnion(
              targetUser.uid
            ),

          following:
            increment(1)

        }
      );


      await updateDoc(
        targetRef,
        {

          followerIds:
            arrayUnion(
              currentUser.uid
            ),

          followers:
            increment(1)

        }
      );


      button.classList.add(
        "following"
      );


      button.textContent =
        "Following";

    }

  } catch (error) {

    console.error(
      "Follow error:",
      error
    );


    alert(
      "❌ Follow পরিবর্তন করা যায়নি।"
    );

  } finally {

    button.disabled =
      false;

  }

}


/* =========================================================
   LIKE
   ========================================================= */

async function toggleLike(
  videoId,
  button
) {

  if (!currentUser) {
    return;
  }


  button.disabled =
    true;


  try {

    const videoRef =
      doc(
        db,
        "videos",
        videoId
      );


    const likeRef =
      doc(
        db,
        "videos",
        videoId,
        "likes",
        currentUser.uid
      );


    const videoSnapshot =
      await getDoc(
        videoRef
      );


    const likeSnapshot =
      await getDoc(
        likeRef
      );


    if (
      !videoSnapshot.exists()
    ) {

      await setDoc(
        videoRef,
        {

          videoId:
            videoId,

          likeCount:
            0,

          saveCount:
            0,

          commentCount:
            0,

          createdAt:
            serverTimestamp()

        }
      );

    }


    if (
      !likeSnapshot.exists()
    ) {

      await setDoc(
        likeRef,
        {

          uid:
            currentUser.uid,

          createdAt:
            serverTimestamp()

        }
      );


      await updateDoc(
        videoRef,
        {

          likeCount:
            increment(1)

        }
      );


      button.classList.add(
        "liked"
      );


      button.setAttribute(
        "aria-pressed",
        "true"
      );

    } else {

      await deleteDoc(
        likeRef
      );


      await updateDoc(
        videoRef,
        {

          likeCount:
            increment(-1)

        }
      );


      button.classList.remove(
        "liked"
      );


      button.setAttribute(
        "aria-pressed",
        "false"
      );

    }


    await refreshVideoCounts(
      videoId,
      button
    );

  } catch (error) {

    console.error(
      "Like error:",
      error
    );


    alert(
      "❌ Like পরিবর্তন করা যায়নি।"
    );

  } finally {

    button.disabled =
      false;

  }

}


/* =========================================================
   SAVE
   ========================================================= */

async function toggleSave(
  videoId,
  button
) {

  if (!currentUser) {
    return;
  }


  button.disabled =
    true;


  try {

    const videoRef =
      doc(
        db,
        "videos",
        videoId
      );


    const saveRef =
      doc(
        db,
        "videos",
        videoId,
        "saves",
        currentUser.uid
      );


    const videoSnapshot =
      await getDoc(
        videoRef
      );


    const saveSnapshot =
      await getDoc(
        saveRef
      );


    if (
      !videoSnapshot.exists()
    ) {

      await setDoc(
        videoRef,
        {

          videoId:
            videoId,

          likeCount:
            0,

          saveCount:
            0,

          commentCount:
            0,

          createdAt:
            serverTimestamp()

        }
      );

    }


    if (
      !saveSnapshot.exists()
    ) {

      await setDoc(
        saveRef,
        {

          uid:
            currentUser.uid,

          createdAt:
            serverTimestamp()

        }
      );


      await updateDoc(
        videoRef,
        {

          saveCount:
            increment(1)

        }
      );


      button.classList.add(
        "saved"
      );


      button.setAttribute(
        "aria-pressed",
        "true"
      );

    } else {

      await deleteDoc(
        saveRef
      );


      await updateDoc(
        videoRef,
        {

          saveCount:
            increment(-1)

        }
      );


      button.classList.remove(
        "saved"
      );


      button.setAttribute(
        "aria-pressed",
        "false"
      );

    }


    await refreshVideoCounts(
      videoId,
      button
    );

  } catch (error) {

    console.error(
      "Save error:",
      error
    );


    alert(
      "❌ Save পরিবর্তন করা যায়নি।"
    );

  } finally {

    button.disabled =
      false;

  }

}


/* =========================================================
   VIDEO COUNTS
   ========================================================= */

async function refreshVideoCounts(
  videoId,
  button
) {

  const videoRef =
    doc(
      db,
      "videos",
      videoId
    );


  const snapshot =
    await getDoc(
      videoRef
    );


  if (!snapshot.exists()) {
    return;
  }


  const data =
    snapshot.data();


  const item =
    button.closest(
      ".video-item"
    );


  if (!item) {
    return;
  }


  const likeCount =
    item.querySelector(
      ".like-count"
    );


  const saveCount =
    item.querySelector(
      ".save-count"
    );


  const commentCount =
    item.querySelector(
      ".comment-count"
    );


  if (likeCount) {

    likeCount.textContent =
      data.likeCount || 0;

  }


  if (saveCount) {

    saveCount.textContent =
      data.saveCount || 0;

  }


  if (commentCount) {

    commentCount.textContent =
      data.commentCount || 0;

  }

}


/* =========================================================
   COMMENT ELEMENTS
   ========================================================= */

const commentBox =
  document.getElementById(
    "commentBox"
  );

const commentInput =
  document.getElementById(
    "commentInput"
  );

const commentCancel =
  document.getElementById(
    "commentCancel"
  );

const commentSend =
  document.getElementById(
    "commentSend"
  );

const commentsList =
  document.getElementById(
    "commentsList"
  );


/* =========================================================
   OPEN COMMENT BOX
   ========================================================= */

function openCommentBox() {

  if (!commentBox) {
    return;
  }


  commentBox.classList.add(
    "show"
  );


  commentBox.setAttribute(
    "aria-hidden",
    "false"
  );


  if (commentInput) {

    commentInput.value =
      "";


    setTimeout(
      () => {

        commentInput.focus();

      },
      100
    );

  }


  loadComments();

}


/* =========================================================
   CLOSE COMMENT BOX
   ========================================================= */

function closeCommentBox() {

  if (!commentBox) {
    return;
  }


  commentBox.classList.remove(
    "show"
  );


  commentBox.setAttribute(
    "aria-hidden",
    "true"
  );


  activeCommentVideoId =
    null;


  activeCommentButton =
    null;

}


if (commentCancel) {

  commentCancel.addEventListener(
    "click",
    closeCommentBox
  );

}


/* =========================================================
   LOAD COMMENTS
   ========================================================= */

async function loadComments() {

  if (
    !commentsList ||
    !activeCommentVideoId
  ) {

    return;

  }


  commentsList.innerHTML =
    "<div>⏳ Comments loading...</div>";


  try {

    const commentsRef =
      collection(
        db,
        "videos",
        activeCommentVideoId,
        "comments"
      );


    const snapshot =
      await getDocs(
        commentsRef
      );


    commentsList.innerHTML =
      "";


    if (snapshot.empty) {

      commentsList.innerHTML =
        "<div>💬 এখনো কোনো Comment নেই।</div>";

      return;

    }


    const comments =
      snapshot.docs.map(
        commentDoc => ({

          id:
            commentDoc.id,

          ...commentDoc.data()

        })
      );


    comments.sort(
      (a, b) => {

        const aTime =
          getTimeValue(
            a.createdAt
          );


        const bTime =
          getTimeValue(
            b.createdAt
          );


        return aTime - bTime;

      }
    );


    comments.forEach(
      comment => {

        const div =
          document.createElement(
            "div"
          );


        div.className =
          "comment-item";


        div.innerHTML = `

          <div
            style="
              display:flex;
              gap:10px;
              align-items:flex-start;
              padding:10px 0;
              border-bottom:1px solid #333;
            "
          >

            <img
              src="${escapeAttribute(
                comment.photoURL ||
                DEFAULT_PHOTO
              )}"
              alt=""
              style="
                width:36px;
                height:36px;
                border-radius:50%;
                object-fit:cover;
              "
            >

            <div>

              <strong>
                @${escapeHTML(
                  comment.username ||
                  "wwc_user"
                )}
              </strong>

              <div>
                ${escapeHTML(
                  comment.text ||
                  ""
                )}
              </div>

            </div>

          </div>

        `;


        commentsList.appendChild(
          div
        );

      }
    );

  } catch (error) {

    console.error(
      "Comments error:",
      error
    );


    commentsList.innerHTML =
      "<div>❌ Comments load করা যায়নি।</div>";

  }

}


/* =========================================================
   SEND COMMENT
   ========================================================= */

if (commentSend) {

  commentSend.addEventListener(
    "click",
    async () => {

      if (!requireLogin()) {
        return;
      }


      if (!activeCommentVideoId) {
        return;
      }


      const text =
        commentInput?.value.trim();


      if (!text) {

        alert(
          "⚠️ Comment লিখুন।"
        );

        return;

      }


      commentSend.disabled =
        true;


      try {

        const commentsRef =
          collection(
            db,
            "videos",
            activeCommentVideoId,
            "comments"
          );


        await addDoc(
          commentsRef,
          {

            uid:
              currentUser.uid,

            name:
              currentProfile?.name ||
              currentUser.displayName ||
              "WWC User",

            username:
              currentProfile?.username ||
              "wwc_user",

            photoURL:
              currentProfile?.photoURL ||
              currentUser.photoURL ||
              DEFAULT_PHOTO,

            text:
              text,

            createdAt:
              serverTimestamp()

          }
        );


        const videoRef =
          doc(
            db,
            "videos",
            activeCommentVideoId
          );


        const videoSnapshot =
          await getDoc(
            videoRef
          );


        if (
          !videoSnapshot.exists()
        ) {

          await setDoc(
            videoRef,
            {

              videoId:
                activeCommentVideoId,

              likeCount:
                0,

              saveCount:
                0,

              commentCount:
                1,

              createdAt:
                serverTimestamp()

            }
          );

        } else {

          await updateDoc(
            videoRef,
            {

              commentCount:
                increment(1)

            }
          );

        }


        if (
          activeCommentButton
        ) {

          await refreshVideoCounts(
            activeCommentVideoId,
            activeCommentButton
          );

        }


        if (commentInput) {

          commentInput.value =
            "";

        }


        await loadComments();

      } catch (error) {

        console.error(
          "Comment error:",
          error
        );


        alert(
          "❌ Comment পাঠানো যায়নি।"
        );

      } finally {

        commentSend.disabled =
          false;

      }

    }
  );

}


/* =========================================================
   ENTER TO SEND COMMENT
   ========================================================= */

if (commentInput) {

  commentInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        commentSend?.click();

      }

    }
  );

}


/* =========================================================
   SHARE
   ========================================================= */

async function shareVideo(
  videoId
) {

  const url =
    window.location.origin +
    window.location.pathname +
    "#video=" +
    encodeURIComponent(
      videoId
    );


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

      return;

    }


    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {

      await navigator.clipboard.writeText(
        url
      );


      alert(
        "✅ Video link কপি হয়েছে।"
      );


      return;

    }


    prompt(
      "Video link:",
      url
    );

  } catch (error) {

    console.log(
      "Share cancelled"
    );

  }

}


/* =========================================================
   VIDEO OBSERVER
   ========================================================= */

function setupVideoObserver() {

  const feed =
    document.getElementById(
      "video-feed"
    );


  const videos =
    document.querySelectorAll(
      "#video-feed .feed-video"
    );


  if (
    !feed ||
    !videos.length
  ) {

    return;

  }


  if (videoObserver) {

    videoObserver.disconnect();

  }


  videoObserver =
    new IntersectionObserver(
      entries => {

        let activeVideo = null;


        entries.forEach(
          entry => {

            const video =
              entry.target;


            if (
              entry.isIntersecting &&
              entry.intersectionRatio >= 0.65
            ) {

              activeVideo =
                video;

            }

          }
        );


        if (activeVideo) {

          videos.forEach(
            video => {

              if (
                video !==
                activeVideo
              ) {

                video.pause();

              }

            }
          );


          activeVideo.play()
            .catch(
              () => {}
            );

        }

      },
      {

        root:
          feed,

        threshold: [
          0.25,
          0.65,
          0.9
        ]

      }
    );


  videos.forEach(
    video => {

      videoObserver.observe(
        video
      );

    }
  );

}


/* =========================================================
   VIDEO END -> NEXT VIDEO
   ========================================================= */

function setupVideoEndEvents() {

  const videos =
    document.querySelectorAll(
      "#video-feed .feed-video"
    );


  videos.forEach(
    video => {

      video.onended = () => {

        goToNextVideo(
          video
        );

      };

    }
  );

}


/* =========================================================
   GO TO NEXT VIDEO
   ========================================================= */

function goToNextVideo(
  video
) {

  const currentItem =
    video.closest(
      ".video-item"
    );


  if (!currentItem) {
    return;
  }


  const nextItem =
    currentItem.nextElementSibling;


  if (
    nextItem &&
    nextItem.classList.contains(
      "video-item"
    )
  ) {

    nextItem.scrollIntoView({

      behavior:
        "smooth",

      block:
        "start"

    });


    return;

  }


  /*
   * শেষ ভিডিও হলে আবার প্রথম ভিডিওতে যাবে।
   */

  const feed =
    document.getElementById(
      "video-feed"
    );


  const firstItem =
    feed?.querySelector(
      ".video-item"
    );


  if (
    firstItem &&
    firstItem !== currentItem
  ) {

    firstItem.scrollIntoView({

      behavior:
        "smooth",

      block:
        "start"

    });

  }

}


/* =========================================================
   VIDEO CLICK PLAY / PAUSE
   ========================================================= */

function setupVideoClickEvents() {

  const videos =
    document.querySelectorAll(
      "#video-feed .feed-video"
    );


  videos.forEach(
    video => {

      video.onclick =
        event => {

          event.stopPropagation();


          if (
            video.paused
          ) {

            video.play()
              .catch(
                () => {}
              );

          } else {

            video.pause();

          }

        };

    }
  );

}


/* =========================================================
   FEED SCROLL
   ========================================================= */

function setupFeedScroll() {

  const feed =
    document.getElementById(
      "video-feed"
    );


  if (!feed) {
    return;
  }


  let scrollTimer =
    null;


  feed.addEventListener(
    "scroll",
    () => {

      clearTimeout(
        scrollTimer
      );


      scrollTimer =
        setTimeout(
          () => {

            playMostVisibleVideo();

          },
          120
        );

    },
    {
      passive: true
    }
  );

}


/* =========================================================
   PLAY MOST VISIBLE VIDEO
   ========================================================= */

function playMostVisibleVideo() {

  const feed =
    document.getElementById(
      "video-feed"
    );


  if (!feed) {
    return;
  }


  const items =
    feed.querySelectorAll(
      ".video-item"
    );


  if (!items.length) {
    return;
  }


  const feedRect =
    feed.getBoundingClientRect();


  let bestItem =
    null;

  let bestVisibility =
    0;


  items.forEach(
    item => {

      const rect =
        item.getBoundingClientRect();


      const visibleTop =
        Math.max(
          rect.top,
          feedRect.top
        );


      const visibleBottom =
        Math.min(
          rect.bottom,
          feedRect.bottom
        );


      const visible =
        Math.max(
          0,
          visibleBottom -
          visibleTop
        );


      const ratio =
        visible /
        Math.max(
          1,
          rect.height
        );


      if (
        ratio >
        bestVisibility
      ) {

        bestVisibility =
          ratio;

        bestItem =
          item;

      }

    }
  );


  if (!bestItem) {
    return;
  }


  const videos =
    feed.querySelectorAll(
      ".feed-video"
    );


  videos.forEach(
    video => {

      if (
        !bestItem.contains(
          video
        )
      ) {

        video.pause();

      }

    }
  );


  const activeVideo =
    bestItem.querySelector(
      ".feed-video"
    );


  if (activeVideo) {

    activeVideo.play()
      .catch(
        () => {}
      );

  }

}


/* =========================================================
   RESTORE SHARED VIDEO
   ========================================================= */

function restoreVideoFromHash() {

  const hash =
    window.location.hash;


  if (
    !hash.startsWith(
      "#video="
    )
  ) {

    playMostVisibleVideo();

    return;

  }


  const videoId =
    decodeURIComponent(
      hash.substring(
        7
      )
    );


  const item =
    document.querySelector(
      `.video-item[data-video-id="${CSS.escape(videoId)}"]`
    );


  if (item) {

    setTimeout(
      () => {

        item.scrollIntoView({

          behavior:
            "smooth",

          block:
            "start"

        });

      },
      300
    );

  } else {

    playMostVisibleVideo();

  }

}


/* =========================================================
   TOP TABS
   ========================================================= */

document
  .querySelectorAll(
    ".wwc-top-tab"
  )
  .forEach(
    tab => {

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


          if (
            tab.id ===
            "followingTab"
          ) {

            alert(
              "👥 Following Feed শীঘ্রই আসছে।"
            );

          }

        }
      );

    }
  );


/* =========================================================
   OUTSIDE CLICK
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
   ESCAPE
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      closeProfileMenu();

      closeCommentBox();

    }

  }
);


/* =========================================================
   TOUCH / SWIPE SUPPORT
   ========================================================= */

let touchStartY = 0;
let touchEndY = 0;


const feed =
  document.getElementById(
    "video-feed"
  );


if (feed) {

  feed.addEventListener(
    "touchstart",
    event => {

      touchStartY =
        event.changedTouches[0].screenY;

    },
    {
      passive: true
    }
  );


  feed.addEventListener(
    "touchend",
    event => {

      touchEndY =
        event.changedTouches[0].screenY;


      const difference =
        touchStartY -
        touchEndY;


      /*
       * নিচ থেকে উপরে swipe
       */

      if (
        difference >
        60
      ) {

        const current =
          getMostVisibleItem();


        if (current) {

          const next =
            current.nextElementSibling;


          if (
            next &&
            next.classList.contains(
              "video-item"
            )
          ) {

            next.scrollIntoView({

              behavior:
                "smooth",

              block:
                "start"

            });

          }

        }

      }


      /*
       * উপর থেকে নিচে swipe
       */

      if (
        difference <
        -60
      ) {

        const current =
          getMostVisibleItem();


        if (current) {

          const previous =
            current.previousElementSibling;


          if (
            previous &&
            previous.classList.contains(
              "video-item"
            )
          ) {

            previous.scrollIntoView({

              behavior:
                "smooth",

              block:
                "start"

            });

          }

        }

      }

    },
    {
      passive: true
    }
  );

}


/* =========================================================
   MOST VISIBLE ITEM
   ========================================================= */

function getMostVisibleItem() {

  const feed =
    document.getElementById(
      "video-feed"
    );


  if (!feed) {
    return null;
  }


  const items =
    feed.querySelectorAll(
      ".video-item"
    );


  let best =
    null;

  let bestRatio =
    0;


  const feedRect =
    feed.getBoundingClientRect();


  items.forEach(
    item => {

      const rect =
        item.getBoundingClientRect();


      const visibleTop =
        Math.max(
          rect.top,
          feedRect.top
        );


      const visibleBottom =
        Math.min(
          rect.bottom,
          feedRect.bottom
        );


      const visible =
        Math.max(
          0,
          visibleBottom -
          visibleTop
        );


      const ratio =
        visible /
        Math.max(
          1,
          rect.height
        );


      if (
        ratio >
        bestRatio
      ) {

        bestRatio =
          ratio;

        best =
          item;

      }

    }
  );


  return best;

}


/* =========================================================
   INITIAL LOG
   ========================================================= */

console.log(
  "🌍 WWC-Core COMPLETE app.js loaded successfully"
);

console.log(
  "🎬 Video feed ready"
);

console.log(
  "❤️ Like / 💬 Comment / 🔖 Save / ↗️ Share ready"
);

console.log(
  "👥 Follow system ready"
);

console.log(
  "📱 Swipe navigation ready"
);
