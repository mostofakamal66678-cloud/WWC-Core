/* =========================================================
   WORLD WIDE CONNECT
   APP.JS — TIKTOK STYLE VIDEO FEED
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
  arrayRemove,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* =========================================================
   FIREBASE
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


const app =
  getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;
let currentProfile = null;

let currentFeedMode = "forYou";

let feedVideos = [];

let isLoadingFeed = false;

let activeCommentVideoId = null;
let activeCommentButton = null;

const DEFAULT_PHOTO = "./images/profile.png";


/* =========================================================
   HELPERS
   ========================================================= */

function openPage(file) {
  window.location.href = "./" + file;
}


function requireLogin() {

  if (currentUser) {
    return true;
  }

  alert("🔐 এই কাজটি করতে আগে Login করুন।");
  openPage("auth.html");

  return false;
}


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


function getTimestampValue(timestamp) {

  if (!timestamp) return 0;

  if (typeof timestamp.toMillis === "function") {
    return timestamp.toMillis();
  }

  if (typeof timestamp.seconds === "number") {
    return timestamp.seconds * 1000;
  }

  if (typeof timestamp === "number") {
    return timestamp;
  }

  return 0;
}


function cleanUsername(username) {

  return String(username || "")
    .replace(/^@/, "")
    .trim()
    .toLowerCase();
}


/* =========================================================
   USER PROFILE
   ========================================================= */

async function createOrLoadUserProfile(user) {

  try {

    const userRef =
      doc(db, "users", user.uid);

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

    currentProfile = null;
  }
}


/* =========================================================
   AUTH
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    currentUser = user;

    if (user) {

      await createOrLoadUserProfile(user);

    } else {

      currentProfile = null;

    }

    await loadVideoFeed();

  }
);


/* =========================================================
   LOAD VIDEO FEED
   ========================================================= */

async function loadVideoFeed() {

  const feed =
    document.getElementById("video-feed");

  if (!feed) return;

  if (isLoadingFeed) return;

  isLoadingFeed = true;


  feed.innerHTML = `
    <div class="feed-loading">
      <div>🎬</div>
      <div>Video Feed Loading...</div>
    </div>
  `;


  try {

    const videosRef =
      collection(db, "videos");

    let snapshot;


    try {

      const videoQuery =
        query(
          videosRef,
          orderBy("createdAt", "desc"),
          limit(100)
        );

      snapshot =
        await getDocs(videoQuery);

    } catch (error) {

      console.warn(
        "Ordered query failed:",
        error
      );

      snapshot =
        await getDocs(videosRef);

    }


    const videos = [];


    snapshot.forEach(videoDoc => {

      const data =
        videoDoc.data();

      if (
        data.videoURL ||
        data.url ||
        data.downloadURL
      ) {

        videos.push({
          id: videoDoc.id,
          ...data
        });

      }

    });


    videos.sort(
      (a, b) =>
        getTimestampValue(b.createdAt) -
        getTimestampValue(a.createdAt)
    );


    feedVideos = videos;


    /* =====================================================
       FOLLOWING FILTER
       ===================================================== */

    let visibleVideos = videos;


    if (
      currentFeedMode === "following"
    ) {

      const followingIds =
        Array.isArray(
          currentProfile?.followingIds
        )
          ? currentProfile.followingIds
          : [];


      visibleVideos =
        videos.filter(video =>
          followingIds.includes(
            video.uid
          )
        );

    }


    /* =====================================================
       EMPTY
       ===================================================== */

    if (!visibleVideos.length) {

      feed.innerHTML = `
        <div class="feed-empty">

          ${
            currentFeedMode === "following"
              ? `
                <div style="font-size:40px">👥</div>
                <div>আপনি এখনো কাউকে Follow করেননি।</div>
                <small>
                  For You থেকে Creator Follow করুন।
                </small>
              `
              : `
                <div style="font-size:40px">🎬</div>
                <div>এখনো কোনো ভিডিও নেই।</div>
                <small>
                  প্রথম ভিডিওটি আপনি Upload করুন।
                </small>
              `
          }

        </div>
      `;

      return;
    }


    feed.innerHTML = "";


    visibleVideos.forEach(
      (video, index) => {

        createVideoCard(
          feed,
          video,
          index
        );

      }
    );


    setupVideoObserver();
    setupVideoEvents();
    setupActionButtons();
    setupProfileButtons();

    await restoreUserStates();

    handleSharedVideo();


  } catch (error) {

    console.error(
      "Feed error:",
      error
    );


    feed.innerHTML = `
      <div class="feed-error">
        ❌ Video Feed load করা যায়নি।
        <small>
          ${escapeHTML(error.message)}
        </small>
      </div>
    `;

  } finally {

    isLoadingFeed = false;

  }
}


/* =========================================================
   CREATE VIDEO CARD
   ========================================================= */

function createVideoCard(
  feed,
  video,
  index
) {

  const videoId =
    video.id ||
    "video_" + index;


  const username =
    cleanUsername(
      video.username ||
      "wwc_user"
    );


  const name =
    video.name ||
    "WWC User";


  const photo =
    video.photoURL ||
    DEFAULT_PHOTO;


  const videoURL =
    video.videoURL ||
    video.url ||
    video.downloadURL ||
    "";


  const caption =
    video.caption ||
    "";


  const likes =
    Number(
      video.likeCount ??
      video.likes ??
      0
    );


  const comments =
    Number(
      video.commentCount ??
      video.comments ??
      0
    );


  const saves =
    Number(
      video.saveCount ??
      video.saves ??
      0
    );


  const section =
    document.createElement("section");


  section.className =
    "video-item";


  section.dataset.videoId =
    videoId;


  section.dataset.uid =
    video.uid || "";


  section.dataset.username =
    username;


  section.innerHTML = `

    <video
      class="feed-video"
      muted
      playsinline
      preload="metadata"
      loop
    >

      <source
        src="${escapeAttribute(videoURL)}"
        type="video/mp4"
      >

    </video>


    <div class="video-overlay"></div>


    <!-- PROFILE -->

    <div class="profile-area">

      <button
        class="profile-photo-btn"
        type="button"
      >

        <img
          class="profile-photo"
          src="${escapeAttribute(photo)}"
          alt="Profile"
          loading="lazy"
          onerror="this.src='${escapeAttribute(DEFAULT_PHOTO)}'"
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
        data-uid="${escapeAttribute(video.uid || "")}"
      >
        Follow
      </button>

    </div>


    <!-- TIKTOK STYLE ACTIONS -->

    <div class="actions">

      <button
        class="action-btn like-btn"
        type="button"
        aria-label="Like"
        aria-pressed="false"
      >

        <span class="action-icon like-icon">
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

        <span class="action-icon save-icon">
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
          ↗
        </span>

        <span class="share-label">
          Share
        </span>

      </button>

    </div>


    <!-- DOUBLE TAP HEART -->

    <div class="double-tap-heart">
      ❤️
    </div>


    <!-- VIDEO INFO -->

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
   VIDEO OBSERVER
   ========================================================= */

let videoObserver = null;


function setupVideoObserver() {

  const feed =
    document.getElementById("video-feed");


  const videos =
    document.querySelectorAll(".feed-video");


  if (!feed || !videos.length) {
    return;
  }


  if (videoObserver) {

    videoObserver.disconnect();

  }


  videoObserver =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          const video =
            entry.target;


          if (
            entry.isIntersecting &&
            entry.intersectionRatio >= 0.70
          ) {

            videos.forEach(other => {

              if (other !== video) {

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
        root: feed,
        threshold: [0.5, 0.7, 0.9]
      }
    );


  videos.forEach(video =>
    videoObserver.observe(video)
  );


  /* Try first visible video */

  setTimeout(() => {

    const first =
      [...videos].find(video => {

        const rect =
          video.getBoundingClientRect();

        return (
          rect.top >= 0 &&
          rect.top < window.innerHeight * 0.8
        );

      });


    if (first) {

      first.play().catch(() => {});

    }

  }, 150);

}


/* =========================================================
   VIDEO EVENTS
   ========================================================= */

function setupVideoEvents() {

  document
    .querySelectorAll(".feed-video")
    .forEach(video => {

      let lastTap = 0;


      video.addEventListener(
        "click",
        () => {

          const now =
            Date.now();


          const difference =
            now - lastTap;


          if (
            difference > 0 &&
            difference < 300
          ) {

            handleDoubleTapLike(video);

          } else {

            if (video.paused) {

              video.play().catch(() => {});

            } else {

              video.pause();

            }

          }


          lastTap = now;

        }
      );


      video.addEventListener(
        "ended",
        () => {

          const current =
            video.closest(".video-item");


          const next =
            current?.nextElementSibling;


          if (
            next &&
            next.classList.contains("video-item")
          ) {

            next.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

          }

        }
      );

    });

}


/* =========================================================
   DOUBLE TAP LIKE
   ========================================================= */

async function handleDoubleTapLike(video) {

  const item =
    video.closest(".video-item");


  if (!item) return;


  const button =
    item.querySelector(".like-btn");


  if (!button) return;


  showHeartAnimation(item);


  if (!currentUser) {

    requireLogin();
    return;

  }


  const alreadyLiked =
    button.classList.contains("liked");


  if (!alreadyLiked) {

    const videoId =
      item.dataset.videoId;


    await toggleLike(
      videoId,
      button
    );

  }

}


/* =========================================================
   HEART ANIMATION
   ========================================================= */

function showHeartAnimation(item) {

  const heart =
    item.querySelector(".double-tap-heart");


  if (!heart) return;


  heart.classList.remove("heart-pop");


  void heart.offsetWidth;


  heart.classList.add("heart-pop");


  setTimeout(() => {

    heart.classList.remove("heart-pop");

  }, 700);

}


/* =========================================================
   PROFILE BUTTONS
   ========================================================= */

function setupProfileButtons() {

  document
    .querySelectorAll(
      ".profile-photo-btn, .profile-username, .video-info-username"
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


          if (!username) return;


          openPage(
            "profile.html?username=" +
            encodeURIComponent(username)
          );

        }
      );

    });


  document
    .querySelectorAll(".follow-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        async event => {

          event.stopPropagation();


          if (!requireLogin()) {
            return;
          }


          await toggleFollow(
            button.dataset.username,
            button
          );

        }
      );

    });

}


/* =========================================================
   FIND USER
   ========================================================= */

async function findUserByUsername(username) {

  const clean =
    cleanUsername(username);


  if (!clean) {
    return null;
  }


  /*
   * Current database structure doesn't show
   * username as document ID, so we search users.
   */

  const snapshot =
    await getDocs(
      collection(db, "users")
    );


  for (const userDoc of snapshot.docs) {

    const data =
      userDoc.data();


    const dbUsername =
      cleanUsername(
        data.username
      );


    if (
      dbUsername === clean
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

async function toggleFollow(
  username,
  button
) {

  if (!currentUser) return;


  button.disabled = true;


  try {

    const target =
      await findUserByUsername(username);


    if (!target) {

      alert("❌ User পাওয়া যায়নি।");
      return;

    }


    if (
      target.uid === currentUser.uid
    ) {

      alert(
        "⚠️ নিজের Profile Follow করা যাবে না।"
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
        target.uid
      );


    const mySnap =
      await getDoc(myRef);


    const targetSnap =
      await getDoc(targetRef);


    if (
      !mySnap.exists() ||
      !targetSnap.exists()
    ) {

      throw new Error(
        "User profile পাওয়া যায়নি।"
      );

    }


    const myData =
      mySnap.data();


    const followingIds =
      Array.isArray(
        myData.followingIds
      )
        ? myData.followingIds
        : [];


    const isFollowing =
      followingIds.includes(
        target.uid
      );


    if (isFollowing) {

      await updateDoc(
        myRef,
        {
          followingIds:
            arrayRemove(target.uid),

          following:
            increment(-1)
        }
      );


      await updateDoc(
        targetRef,
        {
          followerIds:
            arrayRemove(currentUser.uid),

          followers:
            increment(-1)
        }
      );


      button.textContent =
        "Follow";


      button.classList.remove(
        "following"
      );


      if (currentProfile) {

        currentProfile.followingIds =
          followingIds.filter(
            id =>
              id !== target.uid
          );

      }


    } else {

      await updateDoc(
        myRef,
        {
          followingIds:
            arrayUnion(target.uid),

          following:
            increment(1)
        }
      );


      await updateDoc(
        targetRef,
        {
          followerIds:
            arrayUnion(currentUser.uid),

          followers:
            increment(1)
        }
      );


      button.textContent =
        "Following";


      button.classList.add(
        "following"
      );


      if (currentProfile) {

        currentProfile.followingIds = [
          ...followingIds,
          target.uid
        ];

      }

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
   ACTION BUTTONS
   ========================================================= */

function setupActionButtons() {

  /* =======================================================
     LIKE
     ======================================================= */

  document
    .querySelectorAll(".like-btn")
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


          if (!videoId) return;


          await toggleLike(
            videoId,
            button
          );

        }
      );

    });


  /* =======================================================
     SAVE
     ======================================================= */

  document
    .querySelectorAll(".save-btn")
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


          if (!videoId) return;


          await toggleSave(
            videoId,
            button
          );

        }
      );

    });


  /* =======================================================
     COMMENT
     ======================================================= */

  document
    .querySelectorAll(".comment-btn")
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


          if (!videoId) return;


          activeCommentVideoId =
            videoId;


          activeCommentButton =
            button;


          await openCommentBox();

        }
      );

    });


  /* =======================================================
     SHARE
     ======================================================= */

  document
    .querySelectorAll(".share-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        async event => {

          event.stopPropagation();


          const item =
            button.closest(".video-item");


          const videoId =
            item?.dataset.videoId;


          if (!videoId) return;


          await shareVideo(
            videoId
          );

        }
      );

    });

}


/* =========================================================
   LIKE
   ========================================================= */

async function toggleLike(
  videoId,
  button
) {

  if (!currentUser) return;


  button.disabled = true;


  try {

    const likeRef =
      doc(
        db,
        "videos",
        videoId,
        "likes",
        currentUser.uid
      );


    const videoRef =
      doc(
        db,
        "videos",
        videoId
      );


    const likeSnap =
      await getDoc(likeRef);


    const videoSnap =
      await getDoc(videoRef);


    if (!videoSnap.exists()) {

      throw new Error(
        "Video পাওয়া যায়নি।"
      );

    }


    if (!likeSnap.exists()) {

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


      animateAction(
        button
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


    await refreshCounts(
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

  if (!currentUser) return;


  button.disabled = true;


  try {

    const saveRef =
      doc(
        db,
        "videos",
        videoId,
        "saves",
        currentUser.uid
      );


    const videoRef =
      doc(
        db,
        "videos",
        videoId
      );


    const saveSnap =
      await getDoc(saveRef);


    const videoSnap =
      await getDoc(videoRef);


    if (!videoSnap.exists()) {

      throw new Error(
        "Video পাওয়া যায়নি।"
      );

    }


    if (!saveSnap.exists()) {

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


      animateAction(
        button
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


    await refreshCounts(
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
   ACTION ANIMATION
   ========================================================= */

function animateAction(button) {

  button.classList.remove(
    "action-pop"
  );


  void button.offsetWidth;


  button.classList.add(
    "action-pop"
  );


  setTimeout(() => {

    button.classList.remove(
      "action-pop"
    );

  }, 350);

}


/* =========================================================
   RESTORE LIKE / SAVE / FOLLOW
   ========================================================= */

async function restoreUserStates() {

  if (!currentUser) return;


  const items =
    document.querySelectorAll(
      ".video-item"
    );


  const followingIds =
    Array.isArray(
      currentProfile?.followingIds
    )
      ? currentProfile.followingIds
      : [];


  for (const item of items) {

    const videoId =
      item.dataset.videoId;


    if (!videoId) continue;


    const likeButton =
      item.querySelector(
        ".like-btn"
      );


    const saveButton =
      item.querySelector(
        ".save-btn"
      );


    const followButton =
      item.querySelector(
        ".follow-btn"
      );


    try {

      const [
        likeSnap,
        saveSnap
      ] =
        await Promise.all([

          getDoc(
            doc(
              db,
              "videos",
              videoId,
              "likes",
              currentUser.uid
            )
          ),

          getDoc(
            doc(
              db,
              "videos",
              videoId,
              "saves",
              currentUser.uid
            )
          )

        ]);


      if (
        likeButton &&
        likeSnap.exists()
      ) {

        likeButton.classList.add(
          "liked"
        );

        likeButton.setAttribute(
          "aria-pressed",
          "true"
        );

      }


      if (
        saveButton &&
        saveSnap.exists()
      ) {

        saveButton.classList.add(
          "saved"
        );

        saveButton.setAttribute(
          "aria-pressed",
          "true"
        );

      }


      if (
        followButton
      ) {

        const targetUid =
          followButton.dataset.uid;


        if (
          targetUid &&
          followingIds.includes(
            targetUid
          )
        ) {

          followButton.textContent =
            "Following";

          followButton.classList.add(
            "following"
          );

        }

      }

    } catch (error) {

      console.warn(
        "State restore failed:",
        error
      );

    }

  }

}


/* =========================================================
   REFRESH COUNTS
   ========================================================= */

async function refreshCounts(
  videoId,
  button
) {

  const snap =
    await getDoc(
      doc(
        db,
        "videos",
        videoId
      )
    );


  if (!snap.exists()) return;


  const data =
    snap.data();


  const item =
    button.closest(
      ".video-item"
    );


  if (!item) return;


  const like =
    item.querySelector(
      ".like-count"
    );


  const save =
    item.querySelector(
      ".save-count"
    );


  const comment =
    item.querySelector(
      ".comment-count"
    );


  if (like) {

    like.textContent =
      Math.max(
        0,
        Number(
          data.likeCount || 0
        )
      );

  }


  if (save) {

    save.textContent =
      Math.max(
        0,
        Number(
          data.saveCount || 0
        )
      );

  }


  if (comment) {

    comment.textContent =
      Math.max(
        0,
        Number(
          data.commentCount || 0
        )
      );

  }

}


/* =========================================================
   SHARE
   ========================================================= */

async function shareVideo(videoId) {

  const url =
    window.location.origin +
    window.location.pathname +
    "?video=" +
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
      "Share cancelled:",
      error
    );

  }

}


/* =========================================================
   COMMENT ELEMENTS
   ========================================================= */

const commentBox =
  document.getElementById(
    "commentBox"
  );


const commentsList =
  document.getElementById(
    "commentsList"
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


/* =========================================================
   OPEN COMMENTS
   ========================================================= */

async function openCommentBox() {

  if (!commentBox) return;


  commentBox.classList.add(
    "show"
  );


  commentBox.setAttribute(
    "aria-hidden",
    "false"
  );


  if (commentsList) {

    commentsList.innerHTML =
      `
        <div class="comment-loading">
          ⏳ Comments Loading...
        </div>
      `;

  }


  await loadComments();


  if (commentInput) {

    commentInput.value = "";


    setTimeout(() => {

      commentInput.focus();

    }, 200);

  }

}


/* =========================================================
   LOAD COMMENTS
   ========================================================= */

async function loadComments() {

  if (
    !activeCommentVideoId ||
    !commentsList
  ) {

    return;

  }


  try {

    const commentsRef =
      collection(
        db,
        "videos",
        activeCommentVideoId,
        "comments"
      );


    let snapshot;


    try {

      const commentsQuery =
        query(
          commentsRef,
          orderBy(
            "createdAt",
            "desc"
          ),
          limit(100)
        );


      snapshot =
        await getDocs(
          commentsQuery
        );


    } catch (error) {

      snapshot =
        await getDocs(
          commentsRef
        );

    }


    if (snapshot.empty) {

      commentsList.innerHTML =
        `
          <div class="no-comments">
            💬 এখনো কোনো Comment নেই।
          </div>
        `;

      return;

    }


    const comments = [];


    snapshot.forEach(commentDoc => {

      comments.push({
        id: commentDoc.id,
        ...commentDoc.data()
      });

    });


    comments.sort(
      (a, b) =>
        getTimestampValue(b.createdAt) -
        getTimestampValue(a.createdAt)
    );


    commentsList.innerHTML = "";


    comments.forEach(comment => {

      const div =
        document.createElement("div");


      div.className =
        "comment-item";


      div.innerHTML = `

        <div class="comment-avatar">

          <img
            src="${escapeAttribute(
              comment.photoURL ||
              DEFAULT_PHOTO
            )}"
            alt="Profile"
            onerror="this.src='${escapeAttribute(DEFAULT_PHOTO)}'"
          >

        </div>


        <div class="comment-content">

          <strong>
            @${escapeHTML(
              cleanUsername(
                comment.username ||
                "wwc_user"
              )
            )}
          </strong>

          <div>
            ${escapeHTML(
              comment.text || ""
            )}
          </div>

        </div>

      `;


      commentsList.appendChild(div);

    });


  } catch (error) {

    console.error(
      "Comments error:",
      error
    );


    commentsList.innerHTML =
      `
        <div class="comment-error">
          ❌ Comments load করা যায়নি।
        </div>
      `;

  }

}


/* =========================================================
   CLOSE COMMENTS
   ========================================================= */

function closeCommentBox() {

  if (!commentBox) return;


  commentBox.classList.remove(
    "show"
  );


  commentBox.setAttribute(
    "aria-hidden",
    "true"
  );


  activeCommentVideoId = null;
  activeCommentButton = null;

}


if (commentCancel) {

  commentCancel.addEventListener(
    "click",
    closeCommentBox
  );

}


/* =========================================================
   SEND COMMENT
   ========================================================= */

if (commentSend) {

  commentSend.addEventListener(
    "click",
    async () => {

      if (!requireLogin()) return;


      if (!activeCommentVideoId) {
        return;
      }


      const text =
        commentInput?.value.trim();


      if (!text) {

        alert(
          "⚠️ Comment লিখুন।"
        );

        commentInput?.focus();

        return;

      }


      if (text.length > 500) {

        alert(
          "⚠️ Comment সর্বোচ্চ 500 অক্ষরের হতে পারে।"
        );

        return;

      }


      commentSend.disabled = true;


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


        await updateDoc(
          videoRef,
          {
            commentCount:
              increment(1)
          }
        );


        if (activeCommentButton) {

          await refreshCounts(
            activeCommentVideoId,
            activeCommentButton
          );

        }


        commentInput.value = "";


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

        commentSend.disabled = false;

      }

    }
  );

}


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
   NAVIGATION
   ========================================================= */

const homeBtn =
  document.getElementById("homeBtn");

if (homeBtn) {

  homeBtn.addEventListener(
    "click",
    () => openPage("index.html")
  );

}


const friendsBtn =
  document.getElementById("friendsBtn");

if (friendsBtn) {

  friendsBtn.addEventListener(
    "click",
    () => openPage("friends.html")
  );

}


const uploadBtn =
  document.getElementById("uploadBtn");

if (uploadBtn) {

  uploadBtn.addEventListener(
    "click",
    () => {

      if (!requireLogin()) return;

      openPage("upload.html");

    }
  );

}


const inboxBtn =
  document.getElementById("inboxBtn");

if (inboxBtn) {

  inboxBtn.addEventListener(
    "click",
    () => {

      if (!requireLogin()) return;

      openPage("inbox.html");

    }
  );

}


const profileBtn =
  document.getElementById("profileBtn");

if (profileBtn) {

  profileBtn.addEventListener(
    "click",
    () => {

      if (!requireLogin()) return;

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

      const value =
        prompt("🔍 Username লিখুন");


      if (!value) return;


      const username =
        cleanUsername(value);


      if (!username) return;


      openPage(
        "profile.html?username=" +
        encodeURIComponent(username)
      );

    }
  );

}


/* =========================================================
   TOP TABS
   ========================================================= */

const followingTab =
  document.getElementById(
    "followingTab"
  );


const forYouTab =
  document.getElementById(
    "forYouTab"
  );


if (followingTab) {

  followingTab.addEventListener(
    "click",
    async () => {

      if (
        currentFeedMode ===
        "following"
      ) return;


      currentFeedMode =
        "following";


      followingTab.classList.add(
        "active"
      );


      forYouTab?.classList.remove(
        "active"
      );


      await loadVideoFeed();

    }
  );

}


if (forYouTab) {

  forYouTab.addEventListener(
    "click",
    async () => {

      if (
        currentFeedMode ===
        "forYou"
      ) return;


      currentFeedMode =
        "forYou";


      forYouTab.classList.add(
        "active"
      );


      followingTab?.classList.remove(
        "active"
      );


      await loadVideoFeed();

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


      if (!requireLogin()) return;


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
   ESCAPE
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
   SHARED VIDEO
   ========================================================= */

function handleSharedVideo() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const videoId =
    params.get("video");


  const hash =
    window.location.hash
      ? window.location.hash.substring(1)
      : "";


  const targetId =
    videoId || hash;


  if (!targetId) return;


  setTimeout(() => {

    const item =
      document.querySelector(
        `[data-video-id="${CSS.escape(targetId)}"]`
      );


    if (!item) return;


    item.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });


    const video =
      item.querySelector(
        ".feed-video"
      );


    if (video) {

      setTimeout(() => {

        video.play().catch(() => {});

      }, 500);

    }

  }, 500);

}


/* =========================================================
   SAVE PAGE SUPPORT
   ========================================================= */

window.openSavedVideos = function () {

  if (!requireLogin()) {
    return;
  }

  openPage("saved.html");

};


/* =========================================================
   PUBLIC DEBUG HELPER
   ========================================================= */

window.WWC = {

  reloadFeed:
    loadVideoFeed,

  getCurrentUser:
    () => currentUser,

  getCurrentProfile:
    () => currentProfile,

  getFeedVideos:
    () => feedVideos

};


/* =========================================================
   START
   ========================================================= */

console.log(
  "🌍 WWC TikTok Style Feed loaded successfully"
);
