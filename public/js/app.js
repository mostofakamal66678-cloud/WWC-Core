/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE — REFACTORED APP.JS
   TikTok Style Video Feed
   Firebase Auth + Firestore
   Like + Double Tap Like + Comment + Save + Follow + Share
   Following Feed + Deep Link + Performance Improvements
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
  limit,
  where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {
  apiKey:
    "AIzaSyCgio17aPEfR7d6juqIhn3yi6Mf65W_tO4",

  authDomain:
    "world-wide-connect-62c87.firebaseapp.com",

  projectId:
    "world-wide-connect-62c87",

  storageBucket:
    "world-wide-connect-62c87.firebasestorage.app",

  messagingSenderId:
    "93178453668",

  appId:
    "1:93178453668:web:2184630caa8e61f7445031",

  measurementId:
    "G-PKFJ5NEMGQ"
};


/* =========================================================
   FIREBASE START
   ========================================================= */

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

let feedObserver = null;

let lastDoubleTapTime = 0;
let lastDoubleTapVideoId = null;

const DEFAULT_PHOTO =
  "./images/profile.png";


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = selector =>
  document.querySelector(selector);

const $$ = selector =>
  document.querySelectorAll(selector);


function openPage(file) {
  window.location.href = "./" + file;
}


/* =========================================================
   SECURITY / HTML
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
   LOGIN
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
   TIMESTAMP
   ========================================================= */

function getTimestampValue(timestamp) {

  if (!timestamp) {
    return 0;
  }

  if (
    typeof timestamp.toMillis ===
    "function"
  ) {
    return timestamp.toMillis();
  }

  if (
    typeof timestamp.seconds ===
    "number"
  ) {
    return timestamp.seconds * 1000;
  }

  if (
    typeof timestamp ===
    "number"
  ) {
    return timestamp;
  }

  return 0;
}


/* =========================================================
   USER PROFILE
   ========================================================= */

async function createOrLoadUserProfile(user) {

  try {

    const userRef =
      doc(
        db,
        "users",
        user.uid
      );

    const snapshot =
      await getDoc(userRef);


    if (!snapshot.exists()) {

      currentProfile = {

        uid:
          user.uid,

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

        followers:
          0,

        following:
          0,

        likes:
          0,

        followingIds:
          [],

        followerIds:
          [],

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


      /*
       * Missing fields repair
       */

      const updates = {};

      if (
        !currentProfile.username
      ) {
        updates.username =
          "wwc_" +
          user.uid.substring(0, 6);
      }

      if (
        !Array.isArray(
          currentProfile.followingIds
        )
      ) {
        updates.followingIds = [];
      }

      if (
        !Array.isArray(
          currentProfile.followerIds
        )
      ) {
        updates.followerIds = [];
      }

      if (
        Object.keys(updates).length
      ) {

        await updateDoc(
          userRef,
          updates
        );

        currentProfile = {
          ...currentProfile,
          ...updates
        };

      }

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
   AUTH STATE
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    currentUser = user;


    if (user) {

      console.log(
        "🌍 WWC Login:",
        user.email ||
        user.uid
      );

      await createOrLoadUserProfile(
        user
      );

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
    $("#video-feed");


  if (!feed) {
    return;
  }


  if (isLoadingFeed) {
    return;
  }


  isLoadingFeed = true;


  /*
   * Disconnect previous observer
   */

  if (feedObserver) {

    feedObserver.disconnect();

    feedObserver = null;

  }


  feed.innerHTML = `
    <div class="feed-loading">
      <div>⏳</div>
      <div>Video Feed Loading...</div>
    </div>
  `;


  try {

    const videosRef =
      collection(
        db,
        "videos"
      );


    let snapshot;


    /*
     * First try indexed query.
     */

    try {

      const videoQuery =
        query(
          videosRef,
          orderBy(
            "createdAt",
            "desc"
          ),
          limit(100)
        );

      snapshot =
        await getDocs(
          videoQuery
        );

    } catch (error) {

      console.warn(
        "Ordered video query failed:",
        error
      );

      /*
       * Fallback query
       */

      snapshot =
        await getDocs(
          query(
            videosRef,
            limit(100)
          )
        );

    }


    let videos = [];


    snapshot.forEach(
      videoDoc => {

        const data =
          videoDoc.data();


        if (
          data.videoURL ||
          data.url ||
          data.downloadURL
        ) {

          videos.push({

            id:
              videoDoc.id,

            ...data

          });

        }

      }
    );


    /*
     * Client-side sorting fallback
     */

    videos.sort(
      (a, b) =>
        getTimestampValue(
          b.createdAt
        ) -
        getTimestampValue(
          a.createdAt
        )
    );


    feedVideos =
      videos;


    /*
     * Following filter
     */

    if (
      currentFeedMode ===
      "following"
    ) {

      const followingIds =
        Array.isArray(
          currentProfile?.followingIds
        )
          ? currentProfile.followingIds
          : [];


      videos =
        videos.filter(
          video =>
            video.uid &&
            followingIds.includes(
              video.uid
            )
        );

    }


    /*
     * Empty state
     */

    if (!videos.length) {

      feed.innerHTML =
        currentFeedMode ===
        "following"

          ? `
            <div class="feed-empty">
              👥 আপনি এখনো কাউকে Follow করেননি।
              <small>
                For You থেকে Creator Follow করুন।
              </small>
            </div>
          `

          : `
            <div class="feed-empty">
              🎬 এখনো কোনো ভিডিও নেই।
              <small>
                প্রথম ভিডিওটি আপনি Upload করুন।
              </small>
            </div>
          `;

      return;

    }


    /*
     * Render
     */

    feed.innerHTML = "";


    videos.forEach(
      (video, index) => {

        createVideoCard(
          feed,
          video,
          index
        );

      }
    );


    /*
     * Events
     */

    setupVideoObserver();

    setupVideoEvents();

    setupActionButtons();

    setupProfileButtons();

    setupDoubleTapLike();

    await restoreUserStates();

    handleSharedVideo();


    console.log(
      "✅ WWC Videos:",
      videos.length
    );


  } catch (error) {

    console.error(
      "Feed loading error:",
      error
    );


    feed.innerHTML = `
      <div class="feed-error">
        ❌ Video Feed load করা যায়নি।
        <small>
          ${escapeHTML(
            error.message
          )}
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
    String(
      video.username ||
      "wwc_user"
    )
      .replace(/^@/, "")
      .trim();


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
    document.createElement(
      "section"
    );


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

      Your browser does not support video playback.

    </video>


    <div class="video-overlay"></div>


    <div class="video-play-indicator">
      ▶
    </div>


    <div class="profile-area">

      <button
        class="profile-photo-btn"
        type="button"
        aria-label="Open profile"
      >

        <img
          class="profile-photo"
          src="${escapeAttribute(photo)}"
          alt="${escapeAttribute(name)}"
          loading="lazy"
          onerror="this.src='${escapeAttribute(
            DEFAULT_PHOTO
          )}'"
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
        data-uid="${escapeAttribute(
          video.uid || ""
        )}"
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
   VIDEO OBSERVER
   ========================================================= */

function setupVideoObserver() {

  const feed =
    $("#video-feed");


  const videos =
    $$(".feed-video");


  if (
    !feed ||
    !videos.length
  ) {

    return;

  }


  feedObserver =
    new IntersectionObserver(
      entries => {

        let bestVideo = null;
        let bestRatio = 0;


        entries.forEach(
          entry => {

            if (
              entry.isIntersecting &&
              entry.intersectionRatio >
                bestRatio
            ) {

              bestRatio =
                entry.intersectionRatio;

              bestVideo =
                entry.target;

            }

          }
        );


        /*
         * Pause videos that are not visible.
         */

        videos.forEach(
          video => {

            if (
              video !== bestVideo
            ) {

              video.pause();

            }

          }
        );


        if (
          bestVideo &&
          bestRatio >= 0.65
        ) {

          playVideoSmoothly(
            bestVideo
          );

        }

      },
      {
        root: feed,

        threshold: [
          0.25,
          0.5,
          0.65,
          0.8,
          1
        ]
      }
    );


  videos.forEach(
    video =>
      feedObserver.observe(
        video
      )
  );


  /*
   * Initial video
   */

  requestAnimationFrame(
    () => {

      const first =
        videos[0];

      if (first) {
        playVideoSmoothly(
          first
        );
      }

    }
  );

}


/* =========================================================
   SMOOTH VIDEO PLAY
   ========================================================= */

async function playVideoSmoothly(
  video
) {

  if (!video) {
    return;
  }


  try {

    video.muted = true;

    video.playsInline = true;

    await video.play();


    const item =
      video.closest(
        ".video-item"
      );


    item?.classList.add(
      "is-playing"
    );


  } catch (error) {

    /*
     * Browser autoplay policy
     * can reject play().
     */

    console.debug(
      "Autoplay blocked:",
      error
    );

  }

}


/* =========================================================
   VIDEO EVENTS
   ========================================================= */

function setupVideoEvents() {

  $$(".feed-video")
    .forEach(
      video => {

        video.addEventListener(
          "click",
          event => {

            event.stopPropagation();


            if (
              video.paused
            ) {

              playVideoSmoothly(
                video
              );

            } else {

              video.pause();


              video
                .closest(
                  ".video-item"
                )
                ?.classList.remove(
                  "is-playing"
                );

            }

          }
        );


        video.addEventListener(
          "play",
          () => {

            video
              .closest(
                ".video-item"
              )
              ?.classList.add(
                "is-playing"
              );

          }
        );


        video.addEventListener(
          "pause",
          () => {

            video
              .closest(
                ".video-item"
              )
              ?.classList.remove(
                "is-playing"
              );

          }
        );


        video.addEventListener(
          "ended",
          () => {

            const current =
              video.closest(
                ".video-item"
              );


            const next =
              current
                ?.nextElementSibling;


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
        );

      }
    );

}


/* =========================================================
   DOUBLE TAP LIKE
   ========================================================= */

function setupDoubleTapLike() {

  $$(".video-item")
    .forEach(
      item => {

        item.addEventListener(
          "dblclick",
          async event => {

            /*
             * Ignore buttons.
             */

            if (
              event.target.closest(
                "button"
              )
            ) {

              return;

            }


            if (
              !requireLogin()
            ) {

              return;

            }


            const videoId =
              item.dataset.videoId;


            const button =
              item.querySelector(
                ".like-btn"
              );


            if (
              !videoId ||
              !button
            ) {

              return;

            }


            showHeartAnimation(
              item
            );


            const isLiked =
              button.getAttribute(
                "aria-pressed"
              ) === "true";


            /*
             * Double tap only adds Like.
             */

            if (!isLiked) {

              await toggleLike(
                videoId,
                button
              );

            }

          }
        );


        /*
         * Mobile touch double tap.
         */

        item.addEventListener(
          "touchend",
          async event => {

            if (
              event.target.closest(
                "button"
              )
            ) {

              return;

            }


            const now =
              Date.now();


            const videoId =
              item.dataset.videoId;


            if (
              now -
                lastDoubleTapTime <
              320 &&
              lastDoubleTapVideoId ===
                videoId
            ) {

              event.preventDefault();


              if (
                !requireLogin()
              ) {

                return;

              }


              const button =
                item.querySelector(
                  ".like-btn"
                );


              if (!button) {
                return;
              }


              showHeartAnimation(
                item
              );


              const isLiked =
                button.getAttribute(
                  "aria-pressed"
                ) === "true";


              if (!isLiked) {

                await toggleLike(
                  videoId,
                  button
                );

              }


              lastDoubleTapTime = 0;

              lastDoubleTapVideoId =
                null;

            } else {

              lastDoubleTapTime =
                now;

              lastDoubleTapVideoId =
                videoId;

            }

          },
          {
            passive: false
          }
        );

      }
    );

}


/* =========================================================
   HEART ANIMATION
   ========================================================= */

function showHeartAnimation(
  item
) {

  const heart =
    document.createElement(
      "div"
    );


  heart.className =
    "double-tap-heart";


  heart.textContent =
    "❤️";


  item.appendChild(
    heart
  );


  requestAnimationFrame(
    () => {

      heart.classList.add(
        "show"
      );

    }
  );


  setTimeout(
    () => {

      heart.remove();

    },
    850
  );

}


/* =========================================================
   PROFILE BUTTONS
   ========================================================= */

function setupProfileButtons() {

  $$
    (
      ".profile-photo-btn, " +
      ".profile-username, " +
      ".video-info-username"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          event => {

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

          }
        );

      }
    );


  $$(".follow-btn")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async event => {

            event.stopPropagation();


            if (
              !requireLogin()
            ) {

              return;

            }


            await toggleFollow(
              button.dataset.username,
              button
            );

          }
        );

      }
    );

}


/* =========================================================
   FIND USER BY USERNAME
   ========================================================= */

async function findUserByUsername(
  username
) {

  const clean =
    String(username || "")
      .replace(/^@/, "")
      .trim()
      .toLowerCase();


  if (!clean) {
    return null;
  }


  /*
   * Preferred indexed query.
   */

  try {

    const usersRef =
      collection(
        db,
        "users"
      );


    const usernameQuery =
      query(
        usersRef,
        where(
          "usernameLower",
          "==",
          clean
        ),
        limit(1)
      );


    const snapshot =
      await getDocs(
        usernameQuery
      );


    if (
      !snapshot.empty
    ) {

      const userDoc =
        snapshot.docs[0];


      return {
        uid:
          userDoc.id,

        ...userDoc.data()
      };

    }

  } catch (error) {

    console.warn(
      "usernameLower query failed:",
      error
    );

  }


  /*
   * Compatibility fallback.
   */

  const snapshot =
    await getDocs(
      query(
        collection(
          db,
          "users"
        ),
        limit(200)
      )
    );


  for (
    const userDoc of snapshot.docs
  ) {

    const data =
      userDoc.data();


    const dbUsername =
      String(
        data.username || ""
      )
        .replace(/^@/, "")
        .trim()
        .toLowerCase();


    if (
      dbUsername === clean
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

async function toggleFollow(
  username,
  button
) {

  if (!currentUser) {
    return;
  }


  if (
    button.dataset.busy ===
    "true"
  ) {

    return;

  }


  button.dataset.busy =
    "true";


  button.disabled =
    true;


  try {

    const target =
      await findUserByUsername(
        username
      );


    if (!target) {

      alert(
        "❌ User পাওয়া যায়নি।"
      );

      return;

    }


    if (
      target.uid ===
      currentUser.uid
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
      await getDoc(
        myRef
      );


    const targetSnap =
      await getDoc(
        targetRef
      );


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

      await Promise.all([

        updateDoc(
          myRef,
          {

            followingIds:
              arrayRemove(
                target.uid
              ),

            following:
              increment(-1)

          }
        ),

        updateDoc(
          targetRef,
          {

            followerIds:
              arrayRemove(
                currentUser.uid
              ),

            followers:
              increment(-1)

          }
        )

      ]);


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

        currentProfile.following =
          Math.max(
            0,
            Number(
              currentProfile.following ||
              0
            ) - 1
          );

      }


    } else {

      await Promise.all([

        updateDoc(
          myRef,
          {

            followingIds:
              arrayUnion(
                target.uid
              ),

            following:
              increment(1)

          }
        ),

        updateDoc(
          targetRef,
          {

            followerIds:
              arrayUnion(
                currentUser.uid
              ),

            followers:
              increment(1)

          }
        )

      ]);


      button.textContent =
        "Following";


      button.classList.add(
        "following"
      );


      if (currentProfile) {

        currentProfile.followingIds =
          [
            ...followingIds,
            target.uid
          ];

        currentProfile.following =
          Number(
            currentProfile.following ||
            0
          ) + 1;

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

    button.disabled =
      false;

    button.dataset.busy =
      "false";

  }

}


/* =========================================================
   ACTION BUTTONS
   ========================================================= */

function setupActionButtons() {


  /*
   * LIKE
   */

  $$(".like-btn")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async event => {

            event.stopPropagation();


            if (
              !requireLogin()
            ) {
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

          }
        );

      }
    );


  /*
   * SAVE
   */

  $$(".save-btn")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async event => {

            event.stopPropagation();


            if (
              !requireLogin()
            ) {
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

          }
        );

      }
    );


  /*
   * COMMENT
   */

  $$(".comment-btn")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async event => {

            event.stopPropagation();


            if (
              !requireLogin()
            ) {
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


            await openCommentBox();

          }
        );

      }
    );


  /*
   * SHARE
   */

  $$(".share-btn")
    .forEach(
      button => {

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


            if (!videoId) {
              return;
            }


            await shareVideo(
              videoId
            );

          }
        );

      }
    );

}


/* =========================================================
   LIKE
   ========================================================= */

async function toggleLike(
  videoId,
  button
) {

  if (
    button.dataset.busy ===
    "true"
  ) {

    return;

  }


  button.dataset.busy =
    "true";


  button.disabled =
    true;


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
      await getDoc(
        likeRef
      );


    const videoSnap =
      await getDoc(
        videoRef
      );


    if (!videoSnap.exists()) {

      throw new Error(
        "Video পাওয়া যায়নি।"
      );

    }


    if (
      !likeSnap.exists()
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

    button.disabled =
      false;

    button.dataset.busy =
      "false";

  }

}


/* =========================================================
   SAVE
   ========================================================= */

async function toggleSave(
  videoId,
  button
) {

  if (
    button.dataset.busy ===
    "true"
  ) {

    return;

  }


  button.dataset.busy =
    "true";


  button.disabled =
    true;


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
      await getDoc(
        saveRef
      );


    const videoSnap =
      await getDoc(
        videoRef
      );


    if (!videoSnap.exists()) {

      throw new Error(
        "Video পাওয়া যায়নি।"
      );

    }


    if (
      !saveSnap.exists()
    ) {

      await setDoc(
        saveRef,
        {

          uid:
            currentUser.uid,

          videoId:
            videoId,

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

    button.disabled =
      false;

    button.dataset.busy =
      "false";

  }

}


/* =========================================================
   ACTION ANIMATION
   ========================================================= */

function animateAction(
  button
) {

  button.classList.remove(
    "action-pop"
  );


  void button.offsetWidth;


  button.classList.add(
    "action-pop"
  );


  setTimeout(
    () => {

      button.classList.remove(
        "action-pop"
      );

    },
    350
  );

}


/* =========================================================
   RESTORE USER STATES
   ========================================================= */

async function restoreUserStates() {

  if (!currentUser) {
    return;
  }


  const items =
    [...$$(".video-item")];


  /*
   * Limit concurrent reads.
   * This is still much lighter than reading
   * entire likes/saves collections.
   */

  const chunks = [];


  for (
    let i = 0;
    i < items.length;
    i += 10
  ) {

    chunks.push(
      items.slice(
        i,
        i + 10
      )
    );

  }


  for (
    const chunk of chunks
  ) {

    await Promise.all(
      chunk.map(
        async item => {

          const videoId =
            item.dataset.videoId;


          if (!videoId) {
            return;
          }


          try {

            const likeRef =
              doc(
                db,
                "videos",
                videoId,
                "likes",
                currentUser.uid
              );


            const saveRef =
              doc(
                db,
                "videos",
                videoId,
                "saves",
                currentUser.uid
              );


            const [
              likeSnap,
              saveSnap
            ] =
              await Promise.all([
                getDoc(likeRef),
                getDoc(saveRef)
              ]);


            const likeButton =
              item.querySelector(
                ".like-btn"
              );


            const saveButton =
              item.querySelector(
                ".save-btn"
              );


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


            /*
             * Follow state
             */

            const followButton =
              item.querySelector(
                ".follow-btn"
              );


            const targetUid =
              item.dataset.uid;


            if (
              followButton &&
              targetUid &&
              currentProfile?.followingIds
                ?.includes(targetUid)
            ) {

              followButton.textContent =
                "Following";

              followButton.classList.add(
                "following"
              );

            }

          } catch (error) {

            console.warn(
              "State restore failed:",
              error
            );

          }

        }
      )
    );

  }

}


/* =========================================================
   COUNTS
   ========================================================= */

async function refreshCounts(
  videoId,
  button
) {

  try {

    const videoRef =
      doc(
        db,
        "videos",
        videoId
      );


    const snap =
      await getDoc(
        videoRef
      );


    if (!snap.exists()) {
      return;
    }


    const data =
      snap.data();


    const item =
      button.closest(
        ".video-item"
      );


    if (!item) {
      return;
    }


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
            data.likeCount ||
            0
          )
        );

    }


    if (save) {

      save.textContent =
        Math.max(
          0,
          Number(
            data.saveCount ||
            0
          )
        );

    }


    if (comment) {

      comment.textContent =
        Math.max(
          0,
          Number(
            data.commentCount ||
            0
          )
        );

    }

  } catch (error) {

    console.warn(
      "Count refresh failed:",
      error
    );

  }

}


/* =========================================================
   SHARE
   ========================================================= */

async function shareVideo(
  videoId
) {

  /*
   * Use a dedicated query parameter.
   * This works better than relying only on hash.
   */

  const url =
    new URL(
      window.location.href
    );


  url.searchParams.set(
    "video",
    videoId
  );


  url.hash = "";


  const shareURL =
    url.toString();


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
          shareURL

      });


    } else if (
      navigator.clipboard
    ) {

      await navigator.clipboard.writeText(
        shareURL
      );


      alert(
        "✅ Video link কপি হয়েছে।"
      );


    } else {

      prompt(
        "Video link:",
        shareURL
      );

    }

  } catch (error) {

    /*
     * User cancelling share is normal.
     */

    console.debug(
      "Share cancelled:",
      error
    );

  }

}


/* =========================================================
   COMMENT ELEMENTS
   ========================================================= */

const commentBox =
  $("#commentBox");

const commentsList =
  $("#commentsList");

const commentInput =
  $("#commentInput");

const commentCancel =
  $("#commentCancel");

const commentSend =
  $("#commentSend");


/* =========================================================
   OPEN COMMENT
   ========================================================= */

async function openCommentBox() {

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


  if (commentsList) {

    commentsList.innerHTML = `
      <div class="comment-loading">
        ⏳ Comments Loading...
      </div>
    `;

  }


  await loadComments();


  if (commentInput) {

    commentInput.value = "";


    setTimeout(
      () =>
        commentInput.focus(),
      200
    );

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

      console.warn(
        "Comment order query failed:",
        error
      );


      snapshot =
        await getDocs(
          query(
            commentsRef,
            limit(100)
          )
        );

    }


    if (
      snapshot.empty
    ) {

      commentsList.innerHTML = `
        <div class="no-comments">
          💬 এখনো কোনো Comment নেই।
        </div>
      `;

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
      (a, b) =>
        getTimestampValue(
          b.createdAt
        ) -
        getTimestampValue(
          a.createdAt
        )
    );


    commentsList.innerHTML =
      "";


    comments.forEach(
      comment => {

        const div =
          document.createElement(
            "div"
          );


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
              loading="lazy"
              onerror="this.src='${escapeAttribute(
                DEFAULT_PHOTO
              )}'"
            >

          </div>


          <div class="comment-content">

            <strong>
              @${escapeHTML(
                String(
                  comment.username ||
                  "wwc_user"
                ).replace(
                  /^@/,
                  ""
                )
              )}
            </strong>


            <div>
              ${escapeHTML(
                comment.text ||
                ""
              )}
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


    commentsList.innerHTML = `
      <div class="comment-error">
        ❌ Comments load করা যায়নি।
      </div>
    `;

  }

}


/* =========================================================
   CLOSE COMMENT
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


commentCancel?.addEventListener(
  "click",
  closeCommentBox
);


/* =========================================================
   SEND COMMENT
   ========================================================= */

commentSend?.addEventListener(
  "click",
  async () => {

    if (
      !requireLogin()
    ) {

      return;

    }


    if (
      !activeCommentVideoId
    ) {

      return;

    }


    const text =
      commentInput?.value
        ?.trim();


    if (!text) {

      alert(
        "⚠️ Comment লিখুন।"
      );

      commentInput?.focus();

      return;

    }


    if (
      text.length > 1000
    ) {

      alert(
        "⚠️ Comment সর্বোচ্চ 1000 character হতে পারে।"
      );

      return;

    }


    if (
      commentSend.dataset.busy ===
      "true"
    ) {

      return;

    }


    commentSend.dataset.busy =
      "true";


    commentSend.disabled =
      true;


    const videoId =
      activeCommentVideoId;


    try {

      const commentsRef =
        collection(
          db,
          "videos",
          videoId,
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


      await updateDoc(
        doc(
          db,
          "videos",
          videoId
        ),
        {

          commentCount:
            increment(1)

        }
      );


      if (
        activeCommentButton
      ) {

        await refreshCounts(
          videoId,
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

      commentSend.dataset.busy =
        "false";

    }

  }
);


/* =========================================================
   ENTER TO SEND COMMENT
   ========================================================= */

commentInput?.addEventListener(
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


/* =========================================================
   HOME
   ========================================================= */

$("#homeBtn")?.addEventListener(
  "click",
  () =>
    openPage(
      "index.html"
    )
);


/* =========================================================
   FRIENDS
   ========================================================= */

$("#friendsBtn")?.addEventListener(
  "click",
  () =>
    openPage(
      "friends.html"
    )
);


/* =========================================================
   UPLOAD
   ========================================================= */

$("#uploadBtn")?.addEventListener(
  "click",
  () => {

    if (
      !requireLogin()
    ) {
      return;
    }

    openPage(
      "upload.html"
    );

  }
);


/* =========================================================
   INBOX
   ========================================================= */

$("#inboxBtn")?.addEventListener(
  "click",
  () => {

    if (
      !requireLogin()
    ) {
      return;
    }

    openPage(
      "inbox.html"
    );

  }
);


/* =========================================================
   PROFILE
   ========================================================= */

$("#profileBtn")?.addEventListener(
  "click",
  () => {

    if (
      !requireLogin()
    ) {
      return;
    }

    openPage(
      "profile.html"
    );

  }
);


/* =========================================================
   SEARCH
   ========================================================= */

$("#searchBtn")?.addEventListener(
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
      encodeURIComponent(
        username
      )
    );

  }
);


/* =========================================================
   PROFILE MENU
   ========================================================= */

const profileMenu =
  $("#profileMenu");

const profileMenuClose =
  $("#profileMenuClose");

const profileBtnMenu =
  $("#profileBtnMenu");

const loginBtn =
  $("#loginBtn");

const logoutBtn =
  $("#logoutBtn");


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


profileMenuClose?.addEventListener(
  "click",
  closeProfileMenu
);


profileBtnMenu?.addEventListener(
  "click",
  () => {

    closeProfileMenu();


    if (
      !requireLogin()
    ) {
      return;
    }


    openPage(
      "profile.html"
    );

  }
);


loginBtn?.addEventListener(
  "click",
  () => {

    closeProfileMenu();

    openPage(
      "auth.html"
    );

  }
);


logoutBtn?.addEventListener(
  "click",
  async () => {

    try {

      await signOut(
        auth
      );


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


/* =========================================================
   TOP TABS
   ========================================================= */

const followingTab =
  $("#followingTab");

const forYouTab =
  $("#forYouTab");


followingTab?.addEventListener(
  "click",
  async () => {

    if (
      currentFeedMode ===
      "following"
    ) {
      return;
    }


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


forYouTab?.addEventListener(
  "click",
  async () => {

    if (
      currentFeedMode ===
      "forYou"
    ) {
      return;
    }


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


/* =========================================================
   HASH / SHARED VIDEO
   ========================================================= */

function handleSharedVideo() {

  const url =
    new URL(
      window.location.href
    );


  /*
   * New:
   * ?video=VIDEO_ID
   */

  let videoId =
    url.searchParams.get(
      "video"
    );


  /*
   * Old:
   * #VIDEO_ID
   */

  if (!videoId) {

    const hash =
      window.location.hash;


    if (hash) {

      videoId =
        hash.substring(1);

    }

  }


  if (!videoId) {
    return;
  }


  const selector =
    `[data-video-id="${CSS.escape(
      videoId
    )}"]`;


  const item =
    document.querySelector(
      selector
    );


  if (!item) {

    console.warn(
      "Shared video not found:",
      videoId
    );

    return;

  }


  setTimeout(
    () => {

      item.scrollIntoView({
        behavior:
          "smooth",

        block:
          "start"
      });


      const video =
        item.querySelector(
          ".feed-video"
        );


      if (video) {

        setTimeout(
          () =>
            playVideoSmoothly(
              video
            ),
          400
        );

      }

    },
    300
  );

}


/* =========================================================
   ESCAPE KEY
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
   PAGE VISIBILITY
   ========================================================= */

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.hidden
    ) {

      $$(".feed-video")
        .forEach(
          video =>
            video.pause()
        );

    }

  }
);


/* =========================================================
   INITIAL UI
   ========================================================= */

function initializeUI() {

  if (forYouTab) {

    forYouTab.classList.add(
      "active"
    );

  }

}


initializeUI();


/* =========================================================
   START
   ========================================================= */

console.log(
  "🌍 WWC-Core Refactored TikTok Feed loaded successfully"
);
