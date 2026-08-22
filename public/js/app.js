/* =========================================================
   WORLD WIDE CONNECT
   WWC-CORE
   MAIN APP.JS
   FIREBASE SOCIAL VIDEO SYSTEM
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
  query,
  orderBy,
  getDocs
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


/* =========================================================
   DEFAULT PHOTO
   ========================================================= */

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

    console.log("WWC guest mode");

  }

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
        prompt(
          "🔍 Username লিখুন"
        );

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
   VIDEO PROFILE CLICK
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

        if (!item) {
          return;
        }

        const usernameElement =
          item.querySelector(
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
          encodeURIComponent(username)
        );

      }
    );

  });


/* =========================================================
   VIDEO USERNAME CLICK
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


/* =========================================================
   FOLLOW / UNFOLLOW
   ========================================================= */

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

        await toggleFollowByUsername(
          username,
          button
        );

      }
    );

  });


/* =========================================================
   FIND USER BY USERNAME
   ========================================================= */

async function findUserByUsername(
  username
) {

  const cleanUsername =
    username
      .replace(/^@/, "")
      .trim()
      .toLowerCase();

  if (!cleanUsername) {
    return null;
  }

  /*
   * Current system uses user UID as document ID.
   * Therefore we first load users and compare username.
   *
   * Later we can optimize this with a username index.
   */

  const usersRef =
    collection(
      db,
      "users"
    );

  const snapshot =
    await getDocs(usersRef);

  for (
    const userDoc of snapshot.docs
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

        uid:
          userDoc.id,

        ...data

      };

    }

  }

  return null;

}


/* =========================================================
   FOLLOW FUNCTION
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

    const targetData =
      targetSnapshot.data();


    const followingIds =
      Array.isArray(
        myData.followingIds
      )
        ? myData.followingIds
        : [];


    const followerIds =
      Array.isArray(
        targetData.followerIds
      )
        ? targetData.followerIds
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

document
  .querySelectorAll(
    ".like-btn"
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
          button.closest(
            ".video-item"
          );

        if (!item) {
          return;
        }

        const videoId =
          item.dataset.videoId;

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


async function toggleLike(
  videoId,
  button
) {

  if (!currentUser) {
    return;
  }

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

    const likeSnapshot =
      await getDoc(likeRef);

    const videoSnapshot =
      await getDoc(videoRef);


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


      if (videoSnapshot.exists()) {

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
        videoSnapshot.exists()
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

document
  .querySelectorAll(
    ".save-btn"
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
          button.closest(
            ".video-item"
          );

        if (!item) {
          return;
        }

        const videoId =
          item.dataset.videoId;

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


async function toggleSave(
  videoId,
  button
) {

  if (!currentUser) {
    return;
  }

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

    const saveSnapshot =
      await getDoc(saveRef);

    const videoSnapshot =
      await getDoc(videoRef);


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


      if (
        videoSnapshot.exists()
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
        videoSnapshot.exists()
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
   REFRESH VIDEO COUNTS
   ========================================================= */

async function refreshVideoCounts(
  videoId,
  itemButton
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


  const videoItem =
    itemButton.closest(
      ".video-item"
    );

  if (!videoItem) {
    return;
  }


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

}


/* =========================================================
   COMMENT BUTTON
   ========================================================= */

document
  .querySelectorAll(
    ".comment-btn"
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
          button.closest(
            ".video-item"
          );

        if (!item) {
          return;
        }

        activeCommentVideoId =
          item.dataset.videoId;

        openCommentBox();

      }
    );

  });


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


function openCommentBox() {

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
      100
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

  activeCommentVideoId =
    null;

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

      if (!requireLogin()) {
        return;
      }

      if (!activeCommentVideoId) {
        return;
      }

      const text =
        commentInput
          ?.value
          .trim();

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


        if (
          videoSnapshot.exists()
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


        if (commentInput) {

          commentInput.value =
            "";

        }

        closeCommentBox();


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

document
  .querySelectorAll(
    ".share-btn"
  )
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
    );

  });


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
  videos.length
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


/* =========================================================
   VIDEO CLICK PLAY / PAUSE
   ========================================================= */

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
   CLOSE MENU WHEN CLICK OUTSIDE
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
   COMMENT ENTER KEY
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

        if (commentSend) {

          commentSend.click();

        }

      }

    }
  );

}


/* =========================================================
   INITIAL LOG
   ========================================================= */

console.log(
  "🌍 WWC-Core Firebase app.js loaded successfully"
);
