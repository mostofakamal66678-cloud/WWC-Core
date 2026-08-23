/* =========================================================
   WWC-CORE
   MAIN APP.JS
   Dynamic Firebase Video Feed + Mobile Support
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
  getDocs
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

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   GLOBAL
   ========================================================= */

let currentUser = null;
let currentProfile = null;
let activeCommentVideoId = null;

const DEFAULT_PHOTO = "./images/profile.png";


/* =========================================================
   PAGE HELPER
   ========================================================= */

function openPage(file) {
  window.location.href = "./" + file;
}


/* =========================================================
   LOGIN
   ========================================================= */

function requireLogin() {

  if (currentUser) {
    return true;
  }

  alert("🔐 এই কাজটি করতে আগে Login করুন।");

  openPage("auth.html");

  return false;
}


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
      "Profile error:",
      error
    );

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
        user.email || user.uid
      );

      await createOrLoadUserProfile(user);

    }

    /*
     * Login থাকুক বা না থাকুক,
     * Feed load হবে
     */

    await loadVideoFeed();

  }
);


/* =========================================================
   VIDEO FEED
   ========================================================= */

async function loadVideoFeed() {

  const feed =
    document.getElementById("video-feed");

  if (!feed) {
    return;
  }

  /*
   * Loading
   */

  feed.innerHTML = `
    <div class="feed-loading">
      ⏳ Video Feed Loading...
    </div>
  `;


  try {

    const usersSnapshot =
      await getDocs(
        collection(
          db,
          "users"
        )
      );


    const allVideos = [];


    /*
     * প্রত্যেক user-এর videos array
     */

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

            if (
              video &&
              (
                video.url ||
                video.videoURL ||
                video.downloadURL
              )
            ) {

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

          }
        );

      }
    );


    /*
     * নতুন ভিডিও আগে
     */

    allVideos.sort(
      (a, b) => {

        const aTime =
          Number(a.createdAt || 0);

        const bTime =
          Number(b.createdAt || 0);

        return bTime - aTime;

      }
    );


    /*
     * Feed empty
     */

    if (!allVideos.length) {

      feed.innerHTML = `
        <div class="feed-empty">
          🎬 এখনো কোনো ভিডিও নেই।<br>
          <small>প্রথম ভিডিওটি আপনি Upload করুন।</small>
        </div>
      `;

      return;
    }


    /*
     * Feed তৈরি
     */

    feed.innerHTML = "";

    allVideos.forEach(
      (video, index) => {

        createVideoCard(
          feed,
          video,
          index
        );

      }
    );


    /*
     * ভিডিও events
     */

    setupVideoObserver();

    setupVideoEvents();

    setupActionButtons();

    setupProfileButtons();

    console.log(
      "✅ Videos loaded:",
      allVideos.length
    );


  } catch (error) {

    console.error(
      "Feed loading error:",
      error
    );


    feed.innerHTML = `
      <div class="feed-error">
        ❌ Video Feed load করা যায়নি।<br>
        <small>${escapeHTML(error.message)}</small>
      </div>
    `;

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
    "video_" +
    index +
    "_" +
    Date.now();


  const username =
    String(
      video.username ||
      "wwc_user"
    )
      .replace(/^@/, "");


  const name =
    video.name ||
    "WWC User";


  const photo =
    video.photoURL ||
    DEFAULT_PHOTO;


  const videoURL =
    video.videoURL ||
    video.url ||
    video.downloadURL;


  const caption =
    video.caption ||
    "";


  const likes =
    video.likes ||
    video.likeCount ||
    0;


  const comments =
    video.comments ||
    video.commentCount ||
    0;


  const saves =
    video.saves ||
    video.saveCount ||
    0;


  const section =
    document.createElement(
      "section"
    );


  section.className =
    "video-item";


  section.dataset.videoId =
    videoId;


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
      Your browser does not support video.
    </video>


    <div class="video-overlay"></div>


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
        aria-pressed="false"
      >
        <span class="action-icon">❤️</span>
        <span class="like-count">${likes}</span>
      </button>


      <button
        class="action-btn comment-btn"
        type="button"
      >
        <span class="action-icon">💬</span>
        <span class="comment-count">${comments}</span>
      </button>


      <button
        class="action-btn save-btn"
        type="button"
        aria-pressed="false"
      >
        <span class="action-icon">🔖</span>
        <span class="save-count">${saves}</span>
      </button>


      <button
        class="action-btn share-btn"
        type="button"
      >
        <span class="action-icon">↗️</span>
        <span class="share-label">Share</span>
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
   HTML SAFE
   ========================================================= */

function escapeHTML(value) {

  return String(value || "")
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
   VIDEO OBSERVER
   ========================================================= */

function setupVideoObserver() {

  const feed =
    document.getElementById(
      "video-feed"
    );

  const videos =
    document.querySelectorAll(
      ".feed-video"
    );


  if (!feed || !videos.length) {
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
                other => {

                  if (
                    other !== video
                  ) {

                    other.pause();

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
        root: feed,
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
   VIDEO EVENTS
   ========================================================= */

function setupVideoEvents() {

  const videos =
    document.querySelectorAll(
      ".feed-video"
    );


  videos.forEach(
    video => {

      video.addEventListener(
        "click",
        () => {

          if (
            video.paused
          ) {

            video.play().catch(
              () => {}
            );

          } else {

            video.pause();

          }

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
            current?.nextElementSibling;


          if (
            next &&
            next.classList.contains(
              "video-item"
            )
          ) {

            next.scrollIntoView({
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
   PROFILE BUTTONS
   ========================================================= */

function setupProfileButtons() {

  document
    .querySelectorAll(
      ".profile-photo-btn, .profile-username, .video-info-username"
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


  document
    .querySelectorAll(
      ".follow-btn"
    )
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
   FIND USER
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


  const snapshot =
    await getDocs(
      collection(
        db,
        "users"
      )
    );


  for (
    const userDoc of snapshot.docs
  ) {

    const data =
      userDoc.data();


    const userName =
      String(
        data.username || ""
      )
        .replace(/^@/, "")
        .toLowerCase();


    if (
      userName === clean
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

  if (!currentUser) {
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
      await getDoc(myRef);


    const targetSnap =
      await getDoc(targetRef);


    if (
      !mySnap.exists() ||
      !targetSnap.exists()
    ) {

      return;

    }


    const myData =
      mySnap.data();


    const followingIds =
      Array.isArray(
        myData.followingIds
      )
        ? myData.followingIds
        : [];


    const following =
      followingIds.includes(
        target.uid
      );


    if (following) {

      await updateDoc(
        myRef,
        {
          followingIds:
            arrayRemove(
              target.uid
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


      button.textContent =
        "Follow";


      button.classList.remove(
        "following"
      );


    } else {

      await updateDoc(
        myRef,
        {
          followingIds:
            arrayUnion(
              target.uid
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


      button.textContent =
        "Following";


      button.classList.add(
        "following"
      );

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
   ACTION BUTTONS
   ========================================================= */

function setupActionButtons() {

  document
    .querySelectorAll(
      ".like-btn"
    )
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


  document
    .querySelectorAll(
      ".save-btn"
    )
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


  document
    .querySelectorAll(
      ".comment-btn"
    )
    .forEach(
      button => {

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


            openCommentBox();

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".share-btn"
    )
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


            const url =
              window.location.origin +
              window.location.pathname +
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
                  "✅ Video link কপি হয়েছে।"
                );

              } else {

                prompt(
                  "Video link:",
                  url
                );

              }

            } catch {

              console.log(
                "Share cancelled"
              );

            }

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
      await getDoc(likeRef);


    const videoSnap =
      await getDoc(videoRef);


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


      if (
        videoSnap.exists()
      ) {

        await updateDoc(
          videoRef,
          {
            likeCount:
              increment(1)
          }
        );

      } else {

        await setDoc(
          videoRef,
          {
            videoId:
              videoId,

            likeCount:
              1,

            saveCount:
              0,

            commentCount:
              0,

            createdAt:
              serverTimestamp()
          }
        );

      }


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


      if (
        videoSnap.exists()
      ) {

        await updateDoc(
          videoRef,
          {
            likeCount:
              increment(-1)
          }
        );

      }


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
      await getDoc(saveRef);


    const videoSnap =
      await getDoc(videoRef);


    if (
      !saveSnap.exists()
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


      if (
        videoSnap.exists()
      ) {

        await updateDoc(
          videoRef,
          {
            saveCount:
              increment(1)
          }
        );

      } else {

        await setDoc(
          videoRef,
          {
            videoId:
              videoId,

            likeCount:
              0,

            saveCount:
              1,

            commentCount:
              0,

            createdAt:
              serverTimestamp()
          }
        );

      }


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


      if (
        videoSnap.exists()
      ) {

        await updateDoc(
          videoRef,
          {
            saveCount:
              increment(-1)
          }
        );

      }


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
   COUNTS
   ========================================================= */

async function refreshCounts(
  videoId,
  button
) {

  const videoRef =
    doc(
      db,
      "videos",
      videoId
    );


  const snap =
    await getDoc(videoRef);


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
      data.likeCount || 0;

  }


  if (save) {

    save.textContent =
      data.saveCount || 0;

  }


  if (comment) {

    comment.textContent =
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
      150
    );

  }

}


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

}


if (commentCancel) {

  commentCancel.addEventListener(
    "click",
    closeCommentBox
  );

}


if (commentSend) {

  commentSend.addEventListener(
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
              "WWC User",

            username:
              currentProfile?.username ||
              "wwc_user",

            photoURL:
              currentProfile?.photoURL ||
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


        const videoSnap =
          await getDoc(videoRef);


        if (
          videoSnap.exists()
        ) {

          await updateDoc(
            videoRef,
            {
              commentCount:
                increment(1)
            }
          );

        } else {

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

        }


        alert(
          "✅ Comment পাঠানো হয়েছে।"
        );


        closeCommentBox();


        await loadVideoFeed();


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
        encodeURIComponent(
          username
        )
      );

    }
  );

}


/* =========================================================
   LOGIN MENU
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

  if (!profileMenu) {
    return;
  }


  profileMenu.classList.remove(
    "show"
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

        }
      );

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
   START
   ========================================================= */

console.log(
  "🌍 WWC-Core Dynamic Feed loaded"
);
