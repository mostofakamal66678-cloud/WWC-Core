/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   MAIN APP.JS
   FIREBASE + CLOUDINARY VIDEO FEED
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
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  getDocs,
  query,
  orderBy
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

const DEFAULT_PHOTO = "./images/profile.png";


/* =========================================================
   PAGE HELPER
   ========================================================= */

function openPage(file) {
  window.location.href = "./" + file;
}


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(auth, async (user) => {

  currentUser = user;

  if (user) {

    console.log(
      "🌍 WWC logged in:",
      user.email || user.uid
    );

    await createOrLoadUserProfile(user);

  } else {

    console.log("🌍 WWC guest mode");

  }

  /*
   * Feed login থাকুক বা না থাকুক দেখা যাবে।
   * তাই auth state-এর পর feed load করছি।
   */

  await loadVideoFeed();

});


/* =========================================================
   CREATE / LOAD USER PROFILE
   ========================================================= */

async function createOrLoadUserProfile(user) {

  try {

    const userRef = doc(
      db,
      "users",
      user.uid
    );

    const snapshot = await getDoc(userRef);

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
      "❌ User profile error:",
      error
    );

  }

}


/* =========================================================
   AUTH REQUIRED
   ========================================================= */

function requireLogin() {

  if (currentUser) {
    return true;
  }

  alert(
    "🔐 এই কাজটি করতে আগে Login করুন।"
  );

  openPage("auth.html");

  return false;

}


/* =========================================================
   HOME
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
   FRIENDS
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
   UPLOAD
   ========================================================= */

const uploadBtn =
  document.getElementById("uploadBtn");

if (uploadBtn) {

  uploadBtn.addEventListener(
    "click",
    () => {

      if (!requireLogin()) {
        return;
      }

      openPage("upload.html");

    }
  );

}


/* =========================================================
   INBOX
   ========================================================= */

const inboxBtn =
  document.getElementById("inboxBtn");

if (inboxBtn) {

  inboxBtn.addEventListener(
    "click",
    () => {

      if (!requireLogin()) {
        return;
      }

      openPage("inbox.html");

    }
  );

}


/* =========================================================
   PROFILE
   ========================================================= */

const profileBtn =
  document.getElementById("profileBtn");

if (profileBtn) {

  profileBtn.addEventListener(
    "click",
    () => {

      if (!requireLogin()) {
        return;
      }

      openPage("profile.html");

    }
  );

}


/* =========================================================
   SEARCH
   ========================================================= */

const searchBtn =
  document.getElementById("searchBtn");

if (searchBtn) {

  searchBtn.addEventListener(
    "click",
    () => {

      const search =
        prompt("🔍 Username লিখুন");

      if (!search) {
        return;
      }

      const username =
        search
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
  document.getElementById("profileMenu");

const profileMenuClose =
  document.getElementById("profileMenuClose");

const profileBtnMenu =
  document.getElementById("profileBtnMenu");

const loginBtn =
  document.getElementById("loginBtn");

const logoutBtn =
  document.getElementById("logoutBtn");


function closeProfileMenu() {

  if (!profileMenu) {
    return;
  }

  profileMenu.classList.remove("show");

  profileMenu.setAttribute(
    "aria-hidden",
    "true"
  );

}


function openProfileMenu() {

  if (!profileMenu) {
    return;
  }

  profileMenu.classList.add("show");

  profileMenu.setAttribute(
    "aria-hidden",
    "false"
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

      openPage("profile.html");

    }
  );

}


if (loginBtn) {

  loginBtn.addEventListener(
    "click",
    () => {

      closeProfileMenu();

      openPage("auth.html");

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

        openPage("auth.html");

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
   LOAD VIDEO FEED
   ========================================================= */

async function loadVideoFeed() {

  const feed =
    document.getElementById("video-feed");

  if (!feed) {
    return;
  }

  /*
   * পুরোনো hard-coded video সরানো হচ্ছে।
   */

  feed.innerHTML = "";

  try {

    const usersSnapshot =
      await getDocs(
        collection(db, "users")
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
     * নতুন ভিডিও আগে।
     */

    allVideos.sort(
      (a, b) => {

        const aTime =
          Number(a.createdAt) || 0;

        const bTime =
          Number(b.createdAt) || 0;

        return bTime - aTime;

      }
    );


    if (!allVideos.length) {

      feed.innerHTML = `
        <section class="video-item"
          style="
            display:flex;
            align-items:center;
            justify-content:center;
            text-align:center;
            padding:30px;
          "
        >
          <div>
            <div style="font-size:50px;">
              🎬
            </div>

            <h2>
              এখনো কোনো ভিডিও নেই
            </h2>

            <p>
              প্রথম ভিডিওটি Upload করুন 🌍
            </p>
          </div>
        </section>
      `;

      return;

    }


    /*
     * প্রতিটি ভিডিও তৈরি।
     */

    allVideos.forEach(
      videoData => {

        createVideoElement(
          feed,
          videoData
        );

      }
    );


    /*
     * Event listener attach।
     */

    attachVideoEvents();

    setupVideoObserver();

    setupVideoEndEvents();

    setupVideoClickEvents();

  } catch (error) {

    console.error(
      "❌ Feed loading error:",
      error
    );

    feed.innerHTML = `
      <section class="video-item"
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          text-align:center;
          padding:30px;
        "
      >
        <div>
          <div style="font-size:50px;">
            ⚠️
          </div>

          <h2>
            Video Feed Load হয়নি
          </h2>

          <p>
            ${escapeHTML(error.message)}
          </p>
        </div>
      </section>
    `;

  }

}


/* =========================================================
   CREATE VIDEO ELEMENT
   ========================================================= */

function createVideoElement(
  feed,
  data
) {

  const videoId =
    data.id ||
    data.videoId ||
    (
      "video_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .substring(2, 7)
    );

  const username =
    String(
      data.username ||
      "wwc_user"
    )
      .replace(/^@/, "");

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
      data.likes ||
      data.likeCount ||
      0
    );

  const comments =
    Number(
      data.comments ||
      data.commentCount ||
      0
    );

  const saves =
    Number(
      data.saves ||
      data.saveCount ||
      0
    );


  if (!videoURL) {
    return;
  }


  const section =
    document.createElement("section");

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


  feed.appendChild(section);

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

  return String(value)
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
   ATTACH VIDEO EVENTS
   ========================================================= */

function attachVideoEvents() {

  /*
   * Profile photo
   */

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
            photo.closest(".video-item");

          const username =
            item?.dataset.username;

          if (!username) {
            return;
          }

          openPage(
            "profile.html?username=" +
            encodeURIComponent(username)
          );

        }
      );

    });


  /*
   * Username
   */

  document
    .querySelectorAll(
      ".video-item .profile-username, .video-item .video-info-username"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          const item =
            button.closest(".video-item");

          const username =
            item?.dataset.username;

          if (!username) {
            return;
          }

          openPage(
            "profile.html?username=" +
            encodeURIComponent(username)
          );

        }
      );

    });


  /*
   * Follow
   */

  document
    .querySelectorAll(
      ".video-item .follow-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
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

        }
      );

    });


  /*
   * Like
   */

  document
    .querySelectorAll(
      ".video-item .like-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async event => {

          event.stopPropagation();

          if (!requireLogin()) {
            return;
          }

          const item =
            button.closest(".video-item");

          const videoId =
            item?.dataset.videoId;

          if (!videoId) {
            return;
          }

          await toggleLike(
            videoId,
            button
          );

        }
      );

    });


  /*
   * Save
   */

  document
    .querySelectorAll(
      ".video-item .save-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async event => {

          event.stopPropagation();

          if (!requireLogin()) {
            return;
          }

          const item =
            button.closest(".video-item");

          const videoId =
            item?.dataset.videoId;

          if (!videoId) {
            return;
          }

          await toggleSave(
            videoId,
            button
          );

        }
      );

    });


  /*
   * Comment
   */

  document
    .querySelectorAll(
      ".video-item .comment-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          if (!requireLogin()) {
            return;
          }

          const item =
            button.closest(".video-item");

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

        }
      );

    });


  /*
   * Share
   */

  document
    .querySelectorAll(
      ".video-item .share-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async event => {

          event.stopPropagation();

          const item =
            button.closest(".video-item");

          const videoId =
            item?.dataset.videoId ||
            "";

          await shareVideo(videoId);

        }
      );

    });

}


/* =========================================================
   FIND USER BY USERNAME
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
      collection(db, "users")
    );

  for (
    const userDoc of usersSnapshot.docs
  ) {

    const data =
      userDoc.data();

    const userUsername =
      String(
        data.username || ""
      )
        .replace(/^@/, "")
        .toLowerCase();

    if (
      userUsername ===
      cleanUsername
    ) {

      return {
        uid: userDoc.id,
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

  button.disabled = true;

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
      await getDoc(myRef);

    const targetSnapshot =
      await getDoc(targetRef);


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

    button.disabled = false;

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

  button.disabled = true;

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
      await getDoc(videoRef);

    const likeSnapshot =
      await getDoc(likeRef);


    if (!videoSnapshot.exists()) {

      await setDoc(
        videoRef,
        {
          videoId: videoId,
          likeCount: 0,
          saveCount: 0,
          commentCount: 0,
          createdAt:
            serverTimestamp()
        }
      );

    }


    if (!likeSnapshot.exists()) {

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


      button.classList.add("liked");

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


      button.classList.remove("liked");

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

    button.disabled = false;

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

  button.disabled = true;

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
      await getDoc(videoRef);

    const saveSnapshot =
      await getDoc(saveRef);


    if (!videoSnapshot.exists()) {

      await setDoc(
        videoRef,
        {
          videoId: videoId,
          likeCount: 0,
          saveCount: 0,
          commentCount: 0,
          createdAt:
            serverTimestamp()
        }
      );

    }


    if (!saveSnapshot.exists()) {

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


      button.classList.add("saved");

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


      button.classList.remove("saved");

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

    button.disabled = false;

  }

}


/* =========================================================
   REFRESH COUNTS
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
    await getDoc(videoRef);

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
   COMMENT BOX
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


function openCommentBox() {

  if (!commentBox) {
    return;
  }

  commentBox.classList.add("show");

  commentBox.setAttribute(
    "aria-hidden",
    "false"
  );


  if (commentInput) {

    commentInput.value = "";

    setTimeout(
      () => {
        commentInput.focus();
      },
      100
    );

  }


  loadComments();

}


function closeCommentBox() {

  if (!commentBox) {
    return;
  }

  commentBox.classList.remove("show");

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

  if (!commentsList) {
    return;
  }

  if (!activeCommentVideoId) {
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
      await getDocs(commentsRef);

    commentsList.innerHTML = "";


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
          a.createdAt?.toMillis?.() ||
          0;

        const bTime =
          b.createdAt?.toMillis?.() ||
          0;

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
      "Comments load error:",
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
          await getDoc(videoRef);


        if (!videoSnapshot.exists()) {

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


        if (activeCommentButton) {

          await refreshVideoCounts(
            activeCommentVideoId,
            activeCommentButton
          );

        }


        if (commentInput) {
          commentInput.value = "";
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
   SHARE
   ========================================================= */

async function shareVideo(
  videoId
) {

  const url =
    window.location.origin +
    window.location.pathname +
    "#video=" +
    encodeURIComponent(videoId);


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
      "Share cancelled"
    );

  }

}


/* =========================================================
   VIDEO OBSERVER
   ========================================================= */

function setupVideoObserver() {

  const videoFeed =
    document.getElementById(
      "video-feed"
    );

  const videos =
    document.querySelectorAll(
      ".feed-video"
    );


  if (
    !videoFeed ||
    !videos.length
  ) {
    return;
  }


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

        root:
          videoFeed,

        threshold:
          0.65

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

function setupVideoEndEvents() {

  const videos =
    document.querySelectorAll(
      ".feed-video"
    );


  videos.forEach(
    video => {

      video.addEventListener(
        "ended",
        () => {

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
              behavior: "smooth",
              block: "start"
            });

          }

        }
      );

    }
  );

}


/* =========================================================
   VIDEO CLICK PLAY / PAUSE
   ========================================================= */

function setupVideoClickEvents() {

  const videos =
    document.querySelectorAll(
      ".feed-video"
    );


  videos.forEach(
    video => {

      video.addEventListener(
        "click",
        event => {

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

}


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
      )
    ) {

      closeProfileMenu();

    }

  }
);


/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeProfileMenu();

      closeCommentBox();

    }

  }
);


/* =========================================================
   COMMENT ENTER
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
   INITIAL LOG
   ========================================================= */

console.log(
  "🌍 WWC-Core dynamic Firebase video feed loaded successfully"
);
