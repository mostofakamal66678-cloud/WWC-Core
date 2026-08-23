/* =========================================================
   WWC CORE v2
   TikTok-style Dynamic Video Feed
   Firebase + Like + Double Tap Like + Comment
   Save + Follow + Share + Following Feed
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
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  runTransaction
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

const auth =
  getAuth(app);

const db =
  getFirestore(app);


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;

let currentProfile = null;

let currentFeedMode = "forYou";

let feedVideos = [];

let lastFeedDoc = null;

let isLoadingFeed = false;

let hasMoreFeed = true;

let activeCommentVideoId = null;

let activeCommentButton = null;

let feedObserver = null;

const PAGE_SIZE = 10;

const DEFAULT_PHOTO =
  "./images/profile.png";


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (
  selector,
  root = document
) =>
  root.querySelector(selector);


const $$ = (
  selector,
  root = document
) =>
  [...root.querySelectorAll(selector)];


/* =========================================================
   PAGE HELPER
   ========================================================= */

function openPage(file) {

  window.location.href =
    "./" + file;

}


/* =========================================================
   LOGIN CHECK
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
   HTML SECURITY
   ========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


function escapeAttribute(value) {

  return escapeHTML(value);

}


/* =========================================================
   USERNAME
   ========================================================= */

function cleanUsername(value) {

  return String(
    value || ""
  )
    .replace(
      /^@/,
      ""
    )
    .trim()
    .toLowerCase();

}


/* =========================================================
   VIDEO URL
   ========================================================= */

function videoURLOf(video) {

  return (
    video.videoURL ||
    video.url ||
    video.downloadURL ||
    ""
  );

}


/* =========================================================
   TIMESTAMP
   ========================================================= */

function timestampValue(value) {

  if (!value) {

    return 0;

  }

  if (
    typeof value.toMillis ===
    "function"
  ) {

    return value.toMillis();

  }

  if (
    typeof value.seconds ===
    "number"
  ) {

    return (
      value.seconds *
      1000
    );

  }

  if (
    typeof value ===
    "number"
  ) {

    return value;

  }

  return 0;

}


/* =========================================================
   USER PROFILE
   ========================================================= */

async function createOrLoadUserProfile(
  user
) {

  const userRef =
    doc(
      db,
      "users",
      user.uid
    );


  const snapshot =
    await getDoc(
      userRef
    );


  if (
    !snapshot.exists()
  ) {

    currentProfile = {

      uid:
        user.uid,

      name:
        user.displayName ||
        "WWC User",

      username:
        "wwc_" +
        user.uid.slice(0, 6),

      email:
        user.email ||
        "",

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

    currentProfile = {

      uid:
        user.uid,

      ...snapshot.data()

    };

  }

}


/* =========================================================
   FIND USER BY USERNAME
   ========================================================= */

async function findUserByUsername(
  username
) {

  const clean =
    cleanUsername(
      username
    );


  if (!clean) {

    return null;

  }


  /*
     Fast lookup:
     usernames/{username}
  */

  const indexRef =
    doc(
      db,
      "usernames",
      clean
    );


  const indexSnap =
    await getDoc(
      indexRef
    );


  if (
    indexSnap.exists() &&
    indexSnap.data().uid
  ) {

    const uid =
      indexSnap.data().uid;


    const userSnap =
      await getDoc(
        doc(
          db,
          "users",
          uid
        )
      );


    if (
      userSnap.exists()
    ) {

      return {

        uid:
          uid,

        ...userSnap.data()

      };

    }

  }


  /*
     Backward compatibility
  */

  const usersSnapshot =
    await getDocs(
      collection(
        db,
        "users"
      )
    );


  for (
    const userDoc of
    usersSnapshot.docs
  ) {

    const data =
      userDoc.data();


    if (
      cleanUsername(
        data.username
      ) === clean
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
   FEED LOADING UI
   ========================================================= */

function resetFeedUI() {

  const feed =
    $("#video-feed");


  if (!feed) {

    return;

  }


  feed.innerHTML = `

    <div class="feed-loading">

      <span class="loading-spinner"></span>

      <span>
        Video Feed Loading...
      </span>

    </div>

  `;

}


/* =========================================================
   LOAD VIDEO FEED
   ========================================================= */

async function loadVideoFeed({
  reset = true
} = {}) {

  const feed =
    $("#video-feed");


  if (
    !feed ||
    isLoadingFeed
  ) {

    return;

  }


  if (reset) {

    lastFeedDoc =
      null;

    hasMoreFeed =
      true;

    feedVideos =
      [];

    resetFeedUI();

  }


  if (
    !hasMoreFeed
  ) {

    return;

  }


  isLoadingFeed =
    true;


  try {

    const videosRef =
      collection(
        db,
        "videos"
      );


    let videoQuery =
      query(
        videosRef,
        orderBy(
          "createdAt",
          "desc"
        ),
        limit(
          PAGE_SIZE
        )
      );


    if (
      lastFeedDoc
    ) {

      videoQuery =
        query(
          videosRef,

          orderBy(
            "createdAt",
            "desc"
          ),

          startAfter(
            lastFeedDoc
          ),

          limit(
            PAGE_SIZE
          )
        );

    }


    let snapshot;


    try {

      snapshot =
        await getDocs(
          videoQuery
        );


    } catch (error) {

      console.warn(
        "Ordered feed query failed:",
        error
      );


      snapshot =
        await getDocs(
          query(
            videosRef,
            limit(
              PAGE_SIZE
            )
          )
        );

    }


    if (
      snapshot.empty
    ) {

      hasMoreFeed =
        false;


      if (
        reset &&
        !feedVideos.length
      ) {

        if (
          currentFeedMode ===
          "following"
        ) {

          feed.innerHTML = `

            <div class="feed-empty">

              👥 আপনি এখনো কাউকে Follow করেননি।

              <small>
                For You থেকে Creator Follow করুন।
              </small>

            </div>

          `;

        } else {

          feed.innerHTML = `

            <div class="feed-empty">

              🎬 এখনো কোনো ভিডিও নেই।

              <small>
                প্রথম ভিডিওটি আপনি Upload করুন।
              </small>

            </div>

          `;

        }

      }

      return;

    }


    lastFeedDoc =
      snapshot.docs[
        snapshot.docs.length - 1
      ];


    const batch =
      snapshot.docs
        .map(
          videoDoc => ({

            id:
              videoDoc.id,

            ...videoDoc.data()

          })
        )
        .filter(
          video =>
            videoURLOf(video)
        );


    const followingIds =
      Array.isArray(
        currentProfile?.followingIds
      )
        ? currentProfile.followingIds
        : [];


    const visibleVideos =
      currentFeedMode ===
      "following"

        ? batch.filter(
            video =>
              followingIds.includes(
                video.uid
              )
          )

        : batch;


    feedVideos.push(
      ...visibleVideos
    );


    if (reset) {

      feed.innerHTML =
        "";

    }


    visibleVideos.forEach(
      (
        video,
        index
      ) => {

        createVideoCard(
          feed,
          video,
          index
        );

      }
    );


    if (
      !visibleVideos.length &&
      reset &&
      currentFeedMode ===
      "following"
    ) {

      feed.innerHTML = `

        <div class="feed-empty">

          👥 আপনার Following creators-এর
          কোনো video নেই।

        </div>

      `;

    }


    setupFeedObserver();

    setupVideoEvents();

    setupActionButtons();

    setupProfileButtons();

    await restoreVisibleStates();

    handleSharedVideo();


    hasMoreFeed =
      snapshot.docs.length ===
      PAGE_SIZE;


  } catch (error) {

    console.error(
      "Feed error:",
      error
    );


    if (reset) {

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

    }


  } finally {

    isLoadingFeed =
      false;

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
    video.id;


  const username =
    cleanUsername(
      video.username
    ) ||
    "wwc_user";


  const photo =
    video.photoURL ||
    DEFAULT_PHOTO;


  const videoURL =
    videoURLOf(
      video
    );


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
    video.uid ||
    "";


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
        src="${escapeAttribute(
          videoURL
        )}"
        type="video/mp4"
      >

      Your browser does not support
      video playback.

    </video>


    <div class="video-overlay"></div>


    <div class="video-loading-indicator">

      <span class="loading-spinner"></span>

    </div>


    <div class="pause-indicator">
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

          src="${escapeAttribute(
            photo
          )}"

          alt="Profile"

          loading="lazy"

          onerror="
            this.src='${escapeAttribute(
              DEFAULT_PHOTO
            )}'
          "

        >

      </button>


      <button
        class="username profile-username"
        type="button"
      >

        @${escapeHTML(
          username
        )}

      </button>


      <button
        class="follow-btn"
        type="button"
        data-username="${escapeAttribute(
          username
        )}"
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

        @${escapeHTML(
          username
        )}

      </button>


      <div class="video-caption">

        ${escapeHTML(
          video.caption || ""
        )}

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
   SMOOTH AUTOPLAY OBSERVER
   ========================================================= */

function setupFeedObserver() {

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


  feedObserver?.disconnect();


  feedObserver =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

            const video =
              entry.target;


            const item =
              video.closest(
                ".video-item"
              );


            if (
              entry.isIntersecting &&
              entry.intersectionRatio >=
                0.72
            ) {

              $$(".feed-video")
                .forEach(
                  other => {

                    if (
                      other !==
                      video
                    ) {

                      other.pause();

                    }

                  }
                );


              item?.classList.add(
                "active-video"
              );


              video.play()
                .then(
                  () => {

                    item?.classList.remove(
                      "show-pause"
                    );

                  }
                )
                .catch(
                  () => {}
                );


            } else {

              video.pause();

              item?.classList.remove(
                "active-video"
              );

            }

          }
        );

      },
      {

        root:
          feed,

        threshold:
          [
            0.2,
            0.72,
            0.9
          ]

      }
    );


  videos.forEach(
    video => {

      feedObserver.observe(
        video
      );

    }
  );

}


/* =========================================================
   VIDEO EVENTS
   ========================================================= */

function setupVideoEvents() {

  $$(".video-item")
    .forEach(
      item => {

        const video =
          $(".feed-video", item);


        if (
          !video ||
          video.dataset.eventsReady
        ) {

          return;

        }


        video.dataset.eventsReady =
          "1";


        video.addEventListener(
          "waiting",
          () => {

            item.classList.add(
              "buffering"
            );

          }
        );


        video.addEventListener(
          "playing",
          () => {

            item.classList.remove(
              "buffering"
            );

          }
        );


        video.addEventListener(
          "click",
          () => {

            if (
              video.paused
            ) {

              video.play()
                .catch(
                  () => {}
                );


              item.classList.remove(
                "show-pause"
              );


            } else {

              video.pause();


              item.classList.add(
                "show-pause"
              );

            }

          }
        );


        video.addEventListener(
          "ended",
          () => {

            const next =
              item.nextElementSibling;


            if (
              next?.classList.contains(
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


        let lastTap =
          0;


        video.addEventListener(
          "touchend",
          event => {

            const now =
              Date.now();


            if (
              now - lastTap <
              300
            ) {

              event.preventDefault();


              const likeButton =
                $(".like-btn", item);


              if (
                currentUser &&
                likeButton &&
                !likeButton.classList.contains(
                  "liked"
                )
              ) {

                toggleLike(
                  item.dataset.videoId,
                  likeButton,
                  true
                );

              }

            }


            lastTap =
              now;

          },
          {
            passive:
              false
          }
        );

      }
    );

}


/* =========================================================
   DOUBLE TAP HEART
   ========================================================= */

function showHeartAnimation(
  item
) {

  if (!item) {

    return;

  }


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
        "pop"
      );

    }
  );


  setTimeout(
    () => {

      heart.remove();

    },
    800
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

        if (
          button.dataset.ready
        ) {

          return;

        }


        button.dataset.ready =
          "1";


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


            if (
              username
            ) {

              openPage(
                "profile.html?username=" +
                encodeURIComponent(
                  username
                )
              );

            }

          }
        );

      }
    );


  $$(".follow-btn")
    .forEach(
      button => {

        if (
          button.dataset.ready
        ) {

          return;

        }


        button.dataset.ready =
          "1";


        const targetUid =
          button.dataset.uid;


        if (
          currentProfile?.followingIds
            ?.includes(
              targetUid
            )
        ) {

          button.textContent =
            "Following";


          button.classList.add(
            "following"
          );

        }


        button.addEventListener(
          "click",
          async event => {

            event.stopPropagation();


            if (
              requireLogin()
            ) {

              await toggleFollow(
                button.dataset.username,
                button
              );

            }

          }
        );

      }
    );

}


/* =========================================================
   FOLLOW
   ========================================================= */

async function toggleFollow(
  username,
  button
) {

  if (
    !currentUser ||
    !button ||
    button.disabled
  ) {

    return;

  }


  button.disabled =
    true;


  try {

    const target =
      await findUserByUsername(
        username
      );


    if (!target) {

      throw new Error(
        "User পাওয়া যায়নি।"
      );

    }


    if (
      target.uid ===
      currentUser.uid
    ) {

      throw new Error(
        "নিজের Profile Follow করা যাবে না।"
      );

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


    const result =
      await runTransaction(
        db,
        async transaction => {

          const mySnap =
            await transaction.get(
              myRef
            );


          const targetSnap =
            await transaction.get(
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


          const targetData =
            targetSnap.data();


          const ids =
            Array.isArray(
              myData.followingIds
            )
              ? myData.followingIds
              : [];


          const following =
            ids.includes(
              target.uid
            );


          if (
            following
          ) {

            transaction.update(
              myRef,
              {

                followingIds:
                  arrayRemove(
                    target.uid
                  ),

                following:
                  Math.max(
                    0,
                    Number(
                      myData.following ||
                      0
                    ) - 1
                  )

              }
            );


            transaction.update(
              targetRef,
              {

                followerIds:
                  arrayRemove(
                    currentUser.uid
                  ),

                followers:
                  Math.max(
                    0,
                    Number(
                      targetData.followers ||
                      0
                    ) - 1
                  )

              }
            );


          } else {

            transaction.update(
              myRef,
              {

                followingIds:
                  arrayUnion(
                    target.uid
                  ),

                following:
                  increment(
                    1
                  )

              }
            );


            transaction.update(
              targetRef,
              {

                followerIds:
                  arrayUnion(
                    currentUser.uid
                  ),

                followers:
                  increment(
                    1
                  )

              }
            );

          }


          return !following;

        }
      );


    const ids =
      Array.isArray(
        currentProfile?.followingIds
      )
        ? [
            ...currentProfile.followingIds
          ]
        : [];


    currentProfile.followingIds =
      result

        ? [
            ...new Set(
              [
                ...ids,
                target.uid
              ]
            )
          ]

        : ids.filter(
            id =>
              id !== target.uid
          );


    button.textContent =
      result
        ? "Following"
        : "Follow";


    button.classList.toggle(
      "following",
      result
    );


  } catch (error) {

    console.error(
      "Follow error:",
      error
    );


    alert(
      "❌ " +
      error.message
    );


  } finally {

    button.disabled =
      false;

  }

}


/* =========================================================
   ACTION BUTTONS
   ========================================================= */

function setupActionButtons() {


  /* ---------------- LIKE ---------------- */

  $$(".like-btn")
    .forEach(
      button => {

        if (
          button.dataset.ready
        ) {

          return;

        }


        button.dataset.ready =
          "1";


        button.addEventListener(
          "click",
          event => {

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


            toggleLike(
              item?.dataset.videoId,
              button
            );

          }
        );

      }
    );


  /* ---------------- SAVE ---------------- */

  $$(".save-btn")
    .forEach(
      button => {

        if (
          button.dataset.ready
        ) {

          return;

        }


        button.dataset.ready =
          "1";


        button.addEventListener(
          "click",
          event => {

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


            toggleSave(
              item?.dataset.videoId,
              button
            );

          }
        );

      }
    );


  /* ---------------- COMMENT ---------------- */

  $$(".comment-btn")
    .forEach(
      button => {

        if (
          button.dataset.ready
        ) {

          return;

        }


        button.dataset.ready =
          "1";


        button.addEventListener(
          "click",
          event => {

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


            activeCommentVideoId =
              item?.dataset.videoId ||
              null;


            activeCommentButton =
              button;


            openCommentBox();

          }
        );

      }
    );


  /* ---------------- SHARE ---------------- */

  $$(".share-btn")
    .forEach(
      button => {

        if (
          button.dataset.ready
        ) {

          return;

        }


        button.dataset.ready =
          "1";


        button.addEventListener(
          "click",
          async event => {

            event.stopPropagation();


            const id =
              button
                .closest(
                  ".video-item"
                )
                ?.dataset
                .videoId;


            if (!id) {

              return;

            }


            const url =
              `${location.origin}${location.pathname}?video=${encodeURIComponent(
                id
              )}`;


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

            } catch (_) {}

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
  button,
  doubleTap = false
) {

  if (
    !currentUser ||
    !videoId ||
    !button ||
    button.disabled
  ) {

    return;

  }


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


    const liked =
      likeSnap.exists();


    if (!liked) {

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
            increment(
              1
            )

        }
      );


      button.classList.add(
        "liked"
      );


      button.setAttribute(
        "aria-pressed",
        "true"
      );


      if (
        doubleTap
      ) {

        showHeartAnimation(
          button.closest(
            ".video-item"
          )
        );

      }


    } else if (
      !doubleTap
    ) {

      await deleteDoc(
        likeRef
      );


      await updateDoc(
        videoRef,
        {

          likeCount:
            increment(
              -1
            )

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
    !currentUser ||
    !videoId ||
    !button ||
    button.disabled
  ) {

    return;

  }


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


    const saved =
      saveSnap.exists();


    if (!saved) {

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
            increment(
              1
            )

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
            increment(
              -1
            )

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


  if (
    !snap.exists()
  ) {

    return;

  }


  const item =
    button.closest(
      ".video-item"
    );


  if (!item) {

    return;

  }


  const data =
    snap.data();


  const like =
    $(".like-count", item);


  const save =
    $(".save-count", item);


  const comment =
    $(".comment-count", item);


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

}


/* =========================================================
   RESTORE LIKE / SAVE
   ========================================================= */

async function restoreVisibleStates() {

  if (
    !currentUser
  ) {

    return;

  }


  const items =
    $$(".video-item");


  await Promise.all(

    items.map(
      async item => {

        const id =
          item.dataset.videoId;


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
                  id,
                  "likes",
                  currentUser.uid
                )
              ),

              getDoc(
                doc(
                  db,
                  "videos",
                  id,
                  "saves",
                  currentUser.uid
                )
              )

            ]);


          const likeButton =
            $(".like-btn", item);


          const saveButton =
            $(".save-btn", item);


          if (
            likeButton
          ) {

            likeButton.classList.toggle(
              "liked",
              likeSnap.exists()
            );


            likeButton.setAttribute(
              "aria-pressed",
              String(
                likeSnap.exists()
              )
            );

          }


          if (
            saveButton
          ) {

            saveButton.classList.toggle(
              "saved",
              saveSnap.exists()
            );


            saveButton.setAttribute(
              "aria-pressed",
              String(
                saveSnap.exists()
              )
            );

          }


        } catch (error) {

          console.warn(
            "State restore:",
            error
          );

        }

      }
    )

  );

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
   OPEN COMMENT BOX
   ========================================================= */

async function openCommentBox() {

  if (
    !commentBox ||
    !activeCommentVideoId
  ) {

    return;

  }


  commentBox.classList.add(
    "show"
  );


  commentBox.setAttribute(
    "aria-hidden",
    "false"
  );


  if (
    commentsList
  ) {

    commentsList.innerHTML = `

      <div class="comment-loading">

        <span class="loading-spinner"></span>

        Comments Loading...

      </div>

    `;

  }


  await loadComments();


  commentInput?.focus();

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

      snapshot =
        await getDocs(
          query(
            commentsRef,

            orderBy(
              "createdAt",
              "desc"
            ),

            limit(
              50
            )
          )
        );


    } catch {

      snapshot =
        await getDocs(
          query(
            commentsRef,
            limit(
              50
            )
          )
        );

    }


    const comments =
      snapshot.docs
        .map(
          commentDoc => ({

            id:
              commentDoc.id,

            ...commentDoc.data()

          })
        )
        .sort(
          (a, b) =>
            timestampValue(
              b.createdAt
            ) -
            timestampValue(
              a.createdAt
            )
        );


    if (
      !comments.length
    ) {

      commentsList.innerHTML = `

        <div class="no-comments">

          💬 এখনো কোনো Comment নেই।

        </div>

      `;

      return;

    }


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

            >

          </div>


          <div class="comment-content">

            <strong>

              @${escapeHTML(
                cleanUsername(
                  comment.username
                ) ||
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
   CLOSE COMMENT BOX
   ========================================================= */

function closeCommentBox() {

  commentBox?.classList.remove(
    "show"
  );


  commentBox?.setAttribute(
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
      !requireLogin() ||
      !activeCommentVideoId
    ) {

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


    commentSend.disabled =
      true;


    try {

      const videoId =
        activeCommentVideoId;


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
            text.slice(
              0,
              1000
            ),

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
            increment(
              1
            )

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


      commentInput.value =
        "";


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


/* =========================================================
   COMMENT ENTER
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
   SHARED VIDEO
   ========================================================= */

function getSharedVideoId() {

  const params =
    new URLSearchParams(
      location.search
    );


  return (
    params.get(
      "video"
    ) ||
    location.hash.slice(1) ||
    ""
  );

}


function handleSharedVideo() {

  const id =
    getSharedVideoId();


  if (!id) {

    return;

  }


  const item =
    document.querySelector(
      `[data-video-id="${CSS.escape(
        id
      )}"]`
    );


  if (!item) {

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
        $(".feed-video", item);


      video?.play()
        .catch(
          () => {}
        );

    },
    250
  );

}


/* =========================================================
   NAVIGATION
   ========================================================= */

$("#homeBtn")?.addEventListener(
  "click",
  () => {

    openPage(
      "index.html"
    );

  }
);


$("#friendsBtn")?.addEventListener(
  "click",
  () => {

    openPage(
      "friends.html"
    );

  }
);


$("#uploadBtn")?.addEventListener(
  "click",
  () => {

    if (
      requireLogin()
    ) {

      openPage(
        "upload.html"
      );

    }

  }
);


$("#inboxBtn")?.addEventListener(
  "click",
  () => {

    if (
      requireLogin()
    ) {

      openPage(
        "inbox.html"
      );

    }

  }
);


$("#profileBtn")?.addEventListener(
  "click",
  () => {

    if (
      requireLogin()
    ) {

      openPage(
        "profile.html"
      );

    }

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


    const username =
      cleanUsername(
        value
      );


    if (
      username
    ) {

      openPage(
        `profile.html?username=${encodeURIComponent(
          username
        )}`
      );

    }

  }
);


/* =========================================================
   PROFILE MENU
   ========================================================= */

const profileMenu =
  $("#profileMenu");


function closeProfileMenu() {

  profileMenu?.classList.remove(
    "show"
  );


  profileMenu?.setAttribute(
    "aria-hidden",
    "true"
  );

}


function openProfileMenu() {

  profileMenu?.classList.add(
    "show"
  );


  profileMenu?.setAttribute(
    "aria-hidden",
    "false"
  );

}


$("#profileMenuClose")
  ?.addEventListener(
    "click",
    closeProfileMenu
  );


$("#profileBtnMenu")
  ?.addEventListener(
    "click",
    () => {

      closeProfileMenu();


      if (
        requireLogin()
      ) {

        openPage(
          "profile.html"
        );

      }

    }
  );


$("#loginBtn")
  ?.addEventListener(
    "click",
    () => {

      closeProfileMenu();

      openPage(
        "auth.html"
      );

    }
  );


$("#logoutBtn")
  ?.addEventListener(
    "click",
    async () => {

      try {

        await signOut(
          auth
        );


        openPage(
          "auth.html"
        );


      } catch (error) {

        alert(
          "❌ Logout করা যায়নি।"
        );

      }

    }
  );


$("#menuBtn")
  ?.addEventListener(
    "click",
    openProfileMenu
  );


/* =========================================================
   FOLLOWING TAB
   ========================================================= */

$("#followingTab")
  ?.addEventListener(
    "click",
    async () => {

      currentFeedMode =
        "following";


      $("#followingTab")
        ?.classList.add(
          "active"
        );


      $("#forYouTab")
        ?.classList.remove(
          "active"
        );


      await loadVideoFeed({
        reset:
          true
      });

    }
  );


/* =========================================================
   FOR YOU TAB
   ========================================================= */

$("#forYouTab")
  ?.addEventListener(
    "click",
    async () => {

      currentFeedMode =
        "forYou";


      $("#forYouTab")
        ?.classList.add(
          "active"
        );


      $("#followingTab")
        ?.classList.remove(
          "active"
        );


      await loadVideoFeed({
        reset:
          true
      });

    }
  );


/* =========================================================
   INFINITE FEED
   ========================================================= */

$("#video-feed")
  ?.addEventListener(
    "scroll",
    () => {

      const feed =
        $("#video-feed");


      if (
        !feed ||
        isLoadingFeed ||
        !hasMoreFeed
      ) {

        return;

      }


      if (
        feed.scrollTop +
        feed.clientHeight >=
        feed.scrollHeight -
        feed.clientHeight *
          1.5
      ) {

        loadVideoFeed({
          reset:
            false
        });

      }

    },
    {
      passive:
        true
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
   AUTH STATE
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user;


    currentProfile =
      null;


    if (user) {

      try {

        await createOrLoadUserProfile(
          user
        );


        /*
          Username index
          usernames/{username}
        */

        const username =
          cleanUsername(
            currentProfile?.username
          );


        if (
          username
        ) {

          const indexRef =
            doc(
              db,
              "usernames",
              username
            );


          const indexSnap =
            await getDoc(
              indexRef
            );


          if (
            !indexSnap.exists()
          ) {

            await setDoc(
              indexRef,
              {
                uid:
                  user.uid
              }
            );

          }

        }


      } catch (error) {

        console.error(
          "Profile error:",
          error
        );

      }

    }


    await loadVideoFeed({
      reset:
        true
    });

  }
);


/* =========================================================
   START
   ========================================================= */

console.log(
  "🌍 WWC Core v2 loaded successfully"
);
