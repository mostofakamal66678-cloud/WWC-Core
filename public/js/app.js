/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   MAIN APP.JS
   VERSION 2
   ========================================================= */

import {
  auth,
  db
} from "./core/firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;

let currentUserProfile = null;

let currentCommentVideoId = null;


/* =========================================================
   DEFAULT PHOTO
   ========================================================= */

const DEFAULT_PHOTO =
  "./images/profile.png";


/* =========================================================
   PAGE HELPER
   ========================================================= */

function openPage(file) {

  window.location.href =
    "./" + file;

}


/* =========================================================
   SAFE HTML
   ========================================================= */

function escapeHtml(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   GET CURRENT USER PROFILE
   ========================================================= */

async function loadCurrentUserProfile(user) {

  if (!user) {
    return null;
  }

  try {

    const userRef =
      doc(
        db,
        "users",
        user.uid
      );

    const snapshot =
      await getDoc(userRef);


    if (snapshot.exists()) {

      return {
        uid: user.uid,
        ...snapshot.data()
      };

    }


    /* -----------------------------------------
       PROFILE DOES NOT EXIST
       ----------------------------------------- */

    const profile = {

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

      gender: "",

      country: "",

      dob: "",

      followersCount: 0,

      followingCount: 0,

      likesCount: 0,

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()

    };


    await setDoc(
      userRef,
      profile
    );


    return {
      uid: user.uid,
      ...profile
    };


  } catch (error) {

    console.error(
      "Profile loading error:",
      error
    );

    return null;

  }

}


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(
  auth,
  async (user) => {

    currentUser = user;

    if (user) {

      console.log(
        "🌍 WWC Login:",
        user.email || user.uid
      );


      currentUserProfile =
        await loadCurrentUserProfile(
          user
        );


      updateLoginUI();

    } else {

      console.log(
        "WWC Guest Mode"
      );

      currentUserProfile =
        null;

      updateLoginUI();

    }

  }
);


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

  if (!loginBtn || !logoutBtn) {
    return;
  }


  if (currentUser) {

    loginBtn.style.display =
      "none";

    logoutBtn.style.display =
      "flex";

  } else {

    loginBtn.style.display =
      "flex";

    logoutBtn.style.display =
      "none";

  }

}


/* =========================================================
   HOME BUTTON
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
   FRIENDS BUTTON
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
   UPLOAD BUTTON
   ========================================================= */

const uploadBtn =
  document.getElementById(
    "uploadBtn"
  );

if (uploadBtn) {

  uploadBtn.addEventListener(
    "click",
    () => {

      if (!currentUser) {

        alert(
          "🔐 Video Upload করতে আগে Login করুন।"
        );

        openPage(
          "auth.html"
        );

        return;

      }


      openPage(
        "upload.html"
      );

    }
  );

}


/* =========================================================
   INBOX BUTTON
   ========================================================= */

const inboxBtn =
  document.getElementById(
    "inboxBtn"
  );

if (inboxBtn) {

  inboxBtn.addEventListener(
    "click",
    () => {

      if (!currentUser) {

        openPage(
          "auth.html"
        );

        return;

      }


      openPage(
        "inbox.html"
      );

    }
  );

}


/* =========================================================
   PROFILE BUTTON
   ========================================================= */

const profileBtn =
  document.getElementById(
    "profileBtn"
  );

if (profileBtn) {

  profileBtn.addEventListener(
    "click",
    () => {

      if (!currentUser) {

        openPage(
          "auth.html"
        );

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
    async () => {

      const text =
        prompt(
          "🔍 Username লিখুন"
        );


      if (!text) {
        return;
      }


      const username =
        text
          .trim()
          .replace(/^@/, "");


      if (!username) {
        return;
      }


      try {

        const usersQuery =
          query(
            collection(
              db,
              "users"
            ),
            where(
              "username",
              "==",
              username
            ),
            limit(1)
          );


        const result =
          await getDocs(
            usersQuery
          );


        if (
          result.empty
        ) {

          alert(
            "❌ এই username-এর কোনো User পাওয়া যায়নি।"
          );

          return;

        }


        const userDoc =
          result.docs[0];


        openPage(
          "user-profile.html?uid=" +
          encodeURIComponent(
            userDoc.id
          )
        );


      } catch (error) {

        console.error(
          "Search error:",
          error
        );

        alert(
          "❌ Search করা যায়নি।"
        );

      }

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


/* =========================================================
   PROFILE MENU PROFILE
   ========================================================= */

if (profileBtnMenu) {

  profileBtnMenu.addEventListener(
    "click",
    () => {

      closeProfileMenu();


      if (!currentUser) {

        openPage(
          "auth.html"
        );

        return;

      }


      openPage(
        "profile.html"
      );

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

      openPage(
        "auth.html"
      );

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

        await signOut(
          auth
        );


        closeProfileMenu();


        alert(
          "✅ Logout সফল হয়েছে।"
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
   VIDEO ELEMENTS
   ========================================================= */

const videoFeed =
  document.getElementById(
    "video-feed"
  );

const videos =
  document.querySelectorAll(
    ".feed-video"
  );


/* =========================================================
   REGISTER VIDEO
   ========================================================= */

async function registerVideo(
  videoItem
) {

  if (!videoItem) {
    return;
  }


  const videoId =
    videoItem.dataset.videoId;


  if (!videoId) {
    return;
  }


  const video =
    videoItem.querySelector(
      ".feed-video"
    );


  if (!video) {
    return;
  }


  const source =
    video.querySelector(
      "source"
    );


  const videoURL =
    source?.src ||
    video.currentSrc ||
    "";


  try {

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

      await setDoc(
        videoRef,
        {

          videoId,

          uid:
            "unknown",

          videoURL,

          caption:
            videoItem
              .querySelector(
                ".video-caption"
              )
              ?.textContent
              ?.trim()
              || "",

          likeCount: 0,

          commentCount: 0,

          shareCount: 0,

          saveCount: 0,

          viewCount: 0,

          status:
            "published",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );

    }


  } catch (error) {

    /*
      Guest user বা Firestore Rules-এর
      কারণে register fail হতে পারে।
      Feed তবুও চলবে।
    */

    console.warn(
      "Video registration:",
      error
    );

  }

}


/* =========================================================
   INITIAL VIDEO REGISTER
   ========================================================= */

videos.forEach(
  (video) => {

    const item =
      video.closest(
        ".video-item"
      );

    if (item) {

      registerVideo(
        item
      );

    }

  }
);


/* =========================================================
   LOAD VIDEO COUNTS
   ========================================================= */

async function loadVideoData(
  videoItem
) {

  if (!videoItem) {
    return;
  }


  const videoId =
    videoItem.dataset.videoId;


  if (!videoId) {
    return;
  }


  try {

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


    const likeCount =
      videoItem.querySelector(
        ".like-count"
      );


    const saveCount =
      videoItem.querySelector(
        ".save-count"
      );


    if (likeCount) {

      likeCount.textContent =
        data.likeCount || 0;

    }


    if (saveCount) {

      saveCount.textContent =
        data.saveCount || 0;

    }


  } catch (error) {

    console.warn(
      "Video data error:",
      error
    );

  }

}


document
  .querySelectorAll(
    ".video-item"
  )
  .forEach(
    loadVideoData
  );


/* =========================================================
   CHECK LIKE
   ========================================================= */

async function checkLikeState(
  videoItem
) {

  if (
    !currentUser ||
    !videoItem
  ) {
    return;

  }


  const videoId =
    videoItem.dataset.videoId;


  if (!videoId) {
    return;
  }


  const likeId =
    currentUser.uid +
    "_" +
    videoId;


  try {

    const likeRef =
      doc(
        db,
        "likes",
        likeId
      );


    const snapshot =
      await getDoc(
        likeRef
      );


    const button =
      videoItem.querySelector(
        ".like-btn"
      );


    if (!button) {
      return;
    }


    if (snapshot.exists()) {

      button.classList.add(
        "liked"
      );

      button.setAttribute(
        "aria-pressed",
        "true"
      );

    } else {

      button.classList.remove(
        "liked"
      );

      button.setAttribute(
        "aria-pressed",
        "false"
      );

    }


  } catch (error) {

    console.warn(
      "Like state:",
      error
    );

  }

}


/* =========================================================
   LIKE
   ========================================================= */

async function toggleLike(
  button
) {

  if (!currentUser) {

    alert(
      "🔐 Like করতে আগে Login করুন।"
    );

    openPage(
      "auth.html"
    );

    return;

  }


  const videoItem =
    button.closest(
      ".video-item"
    );


  if (!videoItem) {
    return;
  }


  const videoId =
    videoItem.dataset.videoId;


  if (!videoId) {
    return;
  }


  const likeId =
    currentUser.uid +
    "_" +
    videoId;


  const likeRef =
    doc(
      db,
      "likes",
      likeId
    );


  const videoRef =
    doc(
      db,
      "videos",
      videoId
    );


  try {

    button.disabled =
      true;


    const snapshot =
      await getDoc(
        likeRef
      );


    if (snapshot.exists()) {

      await updateDoc(
        videoRef,
        {
          likeCount:
            increment(-1),

          updatedAt:
            serverTimestamp()
        }
      );


      /*
        Delete না করে state document
        update করা যায়।
      */

      await setDoc(
        likeRef,
        {
          removed: true,

          uid:
            currentUser.uid,

          videoId,

          updatedAt:
            serverTimestamp()
        }
      );


      button.classList.remove(
        "liked"
      );

      button.setAttribute(
        "aria-pressed",
        "false"
      );


    } else {

      await setDoc(
        likeRef,
        {

          uid:
            currentUser.uid,

          videoId,

          createdAt:
            serverTimestamp(),

          removed: false

        }
      );


      await updateDoc(
        videoRef,
        {
          likeCount:
            increment(1),

          updatedAt:
            serverTimestamp()
        }
      );


      button.classList.add(
        "liked"
      );

      button.setAttribute(
        "aria-pressed",
        "true"
      );

    }


    await loadVideoData(
      videoItem
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
   LIKE BUTTON EVENTS
   ========================================================= */

document
  .querySelectorAll(
    ".like-btn"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        (event) => {

          event.stopPropagation();

          toggleLike(
            button
          );

        }
      );

    }
  );


/* =========================================================
   SAVE STATE
   ========================================================= */

async function checkSaveState(
  videoItem
) {

  if (
    !currentUser ||
    !videoItem
  ) {
    return;
  }


  const videoId =
    videoItem.dataset.videoId;


  if (!videoId) {
    return;
  }


  const saveId =
    currentUser.uid +
    "_" +
    videoId;


  try {

    const saveRef =
      doc(
        db,
        "saves",
        saveId
      );


    const snapshot =
      await getDoc(
        saveRef
      );


    const button =
      videoItem.querySelector(
        ".save-btn"
      );


    if (!button) {
      return;
    }


    if (
      snapshot.exists() &&
      snapshot.data().active !== false
    ) {

      button.classList.add(
        "saved"
      );

      button.setAttribute(
        "aria-pressed",
        "true"
      );

    }

  } catch (error) {

    console.warn(
      "Save state:",
      error
    );

  }

}


/* =========================================================
   SAVE VIDEO
   ========================================================= */

async function toggleSave(
  button
) {

  if (!currentUser) {

    alert(
      "🔐 Video Save করতে আগে Login করুন।"
    );

    openPage(
      "auth.html"
    );

    return;

  }


  const videoItem =
    button.closest(
      ".video-item"
    );


  if (!videoItem) {
    return;
  }


  const videoId =
    videoItem.dataset.videoId;


  if (!videoId) {
    return;
  }


  const saveId =
    currentUser.uid +
    "_" +
    videoId;


  const saveRef =
    doc(
      db,
      "saves",
      saveId
    );


  const videoRef =
    doc(
      db,
      "videos",
      videoId
    );


  try {

    button.disabled =
      true;


    const snapshot =
      await getDoc(
        saveRef
      );


    const active =
      snapshot.exists()
        ? snapshot.data().active !== false
        : false;


    if (active) {

      await setDoc(
        saveRef,
        {

          uid:
            currentUser.uid,

          videoId,

          active: false,

          updatedAt:
            serverTimestamp()

        }
      );


      await updateDoc(
        videoRef,
        {

          saveCount:
            increment(-1),

          updatedAt:
            serverTimestamp()

        }
      );


      button.classList.remove(
        "saved"
      );

      button.setAttribute(
        "aria-pressed",
        "false"
      );


    } else {

      await setDoc(
        saveRef,
        {

          uid:
            currentUser.uid,

          videoId,

          active: true,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );


      await updateDoc(
        videoRef,
        {

          saveCount:
            increment(1),

          updatedAt:
            serverTimestamp()

        }
      );


      button.classList.add(
        "saved"
      );

      button.setAttribute(
        "aria-pressed",
        "true"
      );

    }


    await loadVideoData(
      videoItem
    );


  } catch (error) {

    console.error(
      "Save error:",
      error
    );

    alert(
      "❌ Video Save পরিবর্তন করা যায়নি।"
    );

  } finally {

    button.disabled =
      false;

  }

}


/* =========================================================
   SAVE BUTTON EVENTS
   ========================================================= */

document
  .querySelectorAll(
    ".save-btn"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        (event) => {

          event.stopPropagation();

          toggleSave(
            button
          );

        }
      );

    }
  );


/* =========================================================
   FOLLOW / UNFOLLOW
   ========================================================= */

async function findUserByUsername(
  username
) {

  const cleanUsername =
    String(username || "")
      .trim()
      .replace(/^@/, "");


  if (!cleanUsername) {
    return null;
  }


  const usersQuery =
    query(
      collection(
        db,
        "users"
      ),
      where(
        "username",
        "==",
        cleanUsername
      ),
      limit(1)
    );


  const snapshot =
    await getDocs(
      usersQuery
    );


  if (
    snapshot.empty
  ) {

    return null;

  }


  const userDoc =
    snapshot.docs[0];


  return {

    uid:
      userDoc.id,

    ...userDoc.data()

  };

}


async function toggleFollow(
  button
) {

  if (!currentUser) {

    alert(
      "🔐 Follow করতে আগে Login করুন।"
    );

    openPage(
      "auth.html"
    );

    return;

  }


  const videoItem =
    button.closest(
      ".video-item"
    );


  if (!videoItem) {
    return;
  }


  const usernameElement =
    videoItem.querySelector(
      ".profile-area .username"
    );


  if (!usernameElement) {
    return;
  }


  const username =
    usernameElement.textContent
      .trim()
      .replace(/^@/, "");


  if (!username) {
    return;
  }


  try {

    button.disabled =
      true;


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

      return;

    }


    const followId =
      currentUser.uid +
      "_" +
      targetUser.uid;


    const followRef =
      doc(
        db,
        "follows",
        followId
      );


    const snapshot =
      await getDoc(
        followRef
      );


    if (snapshot.exists()) {

      await setDoc(
        followRef,
        {

          followerUid:
            currentUser.uid,

          followingUid:
            targetUser.uid,

          active: false,

          updatedAt:
            serverTimestamp()

        }
      );


      await updateDoc(
        doc(
          db,
          "users",
          currentUser.uid
        ),
        {

          followingCount:
            increment(-1),

          updatedAt:
            serverTimestamp()

        }
      );


      await updateDoc(
        doc(
          db,
          "users",
          targetUser.uid
        ),
        {

          followersCount:
            increment(-1),

          updatedAt:
            serverTimestamp()

        }
      );


      button.classList.remove(
        "following"
      );

      button.textContent =
        "Follow";


    } else {

      await setDoc(
        followRef,
        {

          followerUid:
            currentUser.uid,

          followingUid:
            targetUser.uid,

          active: true,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );


      await updateDoc(
        doc(
          db,
          "users",
          currentUser.uid
        ),
        {

          followingCount:
            increment(1),

          updatedAt:
            serverTimestamp()

        }
      );


      await updateDoc(
        doc(
          db,
          "users",
          targetUser.uid
        ),
        {

          followersCount:
            increment(1),

          updatedAt:
            serverTimestamp()

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
   FOLLOW BUTTON EVENTS
   ========================================================= */

document
  .querySelectorAll(
    ".video-item .follow-btn"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        (event) => {

          event.stopPropagation();

          toggleFollow(
            button
          );

        }
      );

    }
  );


/* =========================================================
   VIDEO PROFILE PHOTO
   ========================================================= */

document
  .querySelectorAll(
    ".video-item .profile-photo"
  )
  .forEach(
    (photo) => {

      photo.addEventListener(
        "click",
        (event) => {

          event.stopPropagation();


          const item =
            photo.closest(
              ".video-item"
            );


          const usernameElement =
            item?.querySelector(
              ".profile-area .username"
            );


          if (!usernameElement) {
            return;
          }


          const username =
            usernameElement.textContent
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
  );


/* =========================================================
   VIDEO USERNAME
   ========================================================= */

document
  .querySelectorAll(
    ".video-item .profile-area .username"
  )
  .forEach(
    (usernameElement) => {

      usernameElement.addEventListener(
        "click",
        (event) => {

          event.stopPropagation();


          const username =
            usernameElement.textContent
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
  );


/* =========================================================
   SHARE
   ========================================================= */

document
  .querySelectorAll(
    ".share-btn"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        async (event) => {

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

                url

              });


            } else if (
              navigator.clipboard
            ) {

              await navigator.clipboard
                .writeText(
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


            /* --------------------------------
               SHARE COUNT
               -------------------------------- */

            if (videoId) {

              try {

                await updateDoc(
                  doc(
                    db,
                    "videos",
                    videoId
                  ),
                  {

                    shareCount:
                      increment(1),

                    updatedAt:
                      serverTimestamp()

                  }
                );

              } catch (error) {

                console.warn(
                  "Share count error:",
                  error
                );

              }

            }


          } catch (error) {

            console.log(
              "Share cancelled"
            );

          }

        }
      );

    }
  );


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


/* =========================================================
   OPEN COMMENT
   ========================================================= */

document
  .querySelectorAll(
    ".comment-btn"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        (event) => {

          event.stopPropagation();


          if (!currentUser) {

            alert(
              "🔐 Comment করতে আগে Login করুন।"
            );

            openPage(
              "auth.html"
            );

            return;

          }


          const item =
            button.closest(
              ".video-item"
            );


          currentCommentVideoId =
            item?.dataset.videoId ||
            null;


          if (!commentBox) {
            return;
          }


          commentBox.classList.add(
            "show"
          );


          if (commentInput) {

            commentInput.value =
              "";

            setTimeout(
              () => {
                commentInput.focus();
              },
              50
            );

          }

        }
      );

    }
  );


/* =========================================================
   CANCEL COMMENT
   ========================================================= */

if (commentCancel) {

  commentCancel.addEventListener(
    "click",
    () => {

      if (commentBox) {

        commentBox.classList.remove(
          "show"
        );

      }


      currentCommentVideoId =
        null;

    }
  );

}


/* =========================================================
   SEND COMMENT
   ========================================================= */

if (commentSend) {

  commentSend.addEventListener(
    "click",
    async () => {

      if (!currentUser) {

        openPage(
          "auth.html"
        );

        return;

      }


      const text =
        commentInput?.value
          ?.trim();


      if (!text) {

        alert(
          "⚠️ Comment লিখুন।"
        );

        return;

      }


      if (!currentCommentVideoId) {

        alert(
          "❌ Video পাওয়া যায়নি।"
        );

        return;

      }


      try {

        commentSend.disabled =
          true;


        const commentId =
          currentUser.uid +
          "_" +
          Date.now();


        const commentRef =
          doc(
            db,
            "comments",
            commentId
          );


        await setDoc(
          commentRef,
          {

            videoId:
              currentCommentVideoId,

            uid:
              currentUser.uid,

            username:
              currentUserProfile
                ?.username ||
              "wwc_user",

            name:
              currentUserProfile
                ?.name ||
              currentUser.displayName ||
              "WWC User",

            photoURL:
              currentUserProfile
                ?.photoURL ||
              currentUser.photoURL ||
              DEFAULT_PHOTO,

            text,

            createdAt:
              serverTimestamp()

          }
        );


        await updateDoc(
          doc(
            db,
            "videos",
            currentCommentVideoId
          ),
          {

            commentCount:
              increment(1),

            updatedAt:
              serverTimestamp()

          }
        );


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
          "✅ Comment সফলভাবে পাঠানো হয়েছে।"
        );


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

        currentCommentVideoId =
          null;

      }

    }
  );

}


/* =========================================================
   VIDEO AUTOPLAY
   ========================================================= */

if (
  videoFeed &&
  videos.length
) {

  const observer =
    new IntersectionObserver(
      (entries) => {

        entries.forEach(
          (entry) => {

            const video =
              entry.target;


            if (
              entry.isIntersecting &&
              entry.intersectionRatio >= 0.65
            ) {

              videos.forEach(
                (otherVideo) => {

                  if (
                    otherVideo !==
                    video
                  ) {

                    otherVideo.pause();

                  }

                }
              );


              video
                .play()
                .catch(
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
    (video) => {

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
  (video) => {

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


/* =========================================================
   VIDEO PLAY / PAUSE
   ========================================================= */

videos.forEach(
  (video) => {

    video.addEventListener(
      "click",
      (event) => {

        if (
          event.target.closest(
            "button"
          )
        ) {

          return;

        }


        if (
          video.paused
        ) {

          video
            .play()
            .catch(
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
   TOP TABS
   ========================================================= */

document
  .querySelectorAll(
    ".wwc-top-tab"
  )
  .forEach(
    (tab) => {

      tab.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".wwc-top-tab"
            )
            .forEach(
              (item) => {

                item.classList.remove(
                  "active"
                );

              }
            );


          tab.classList.add(
            "active"
          );


          /*
            For You / Following-এর
            সম্পূর্ণ Firebase feed পরে
            একই architecture-এ যুক্ত হবে।
          */

        }
      );

    }
  );


/* =========================================================
   CLOSE PROFILE MENU
   ========================================================= */

document.addEventListener(
  "click",
  (event) => {

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
  (event) => {

    if (
      event.key ===
      "Escape"
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
   LOAD USER STATES AFTER LOGIN
   ========================================================= */

async function refreshUserStates() {

  if (!currentUser) {
    return;
  }


  const items =
    document.querySelectorAll(
      ".video-item"
    );


  for (
    const item of items
  ) {

    await checkLikeState(
      item
    );

    await checkSaveState(
      item
    );

  }

}


onAuthStateChanged(
  auth,
  async (user) => {

    if (user) {

      await refreshUserStates();

    }

  }
);


/* =========================================================
   GLOBAL WWC READY
   ========================================================= */

console.log(
  "🌍 WWC-Core app.js loaded successfully"
);
