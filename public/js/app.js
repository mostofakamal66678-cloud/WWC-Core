import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   FIREBASE
===================================================== */

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


/* =====================================================
   GLOBAL STATE
===================================================== */

let currentUser = null;
let currentProfile = null;

let allVideos = [];
let currentFeed = "foryou";

let currentVideoId = null;
let currentVideoElement = null;

let toastTimer = null;


/* =====================================================
   ELEMENTS
===================================================== */

const feed =
  document.getElementById("feed");

const loading =
  document.getElementById("loading");


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(
  auth,
  async user => {

    currentUser = user;

    if (user) {

      await loadCurrentProfile();

    } else {

      currentProfile = null;

    }

    await loadVideos();

    loading.classList.add("hide");

  }
);


/* =====================================================
   CURRENT USER PROFILE
===================================================== */

async function loadCurrentProfile(){

  if (!currentUser){
    currentProfile = null;
    return;
  }

  try{

    const ref =
      doc(
        db,
        "users",
        currentUser.uid
      );

    const snap =
      await getDoc(ref);

    if (snap.exists()){

      currentProfile = {
        uid: currentUser.uid,
        ...snap.data()
      };

    }else{

      currentProfile = {
        uid: currentUser.uid,
        followingIds: [],
        followerIds: []
      };

    }

  }catch(error){

    console.error(
      "Profile load error:",
      error
    );

    currentProfile = {
      uid: currentUser.uid,
      followingIds: []
    };

  }

}


/* =====================================================
   LOAD VIDEOS
===================================================== */

async function loadVideos(){

  feed.innerHTML = "";

  try{

    const videosRef =
      collection(
        db,
        "videos"
      );

    let snapshot;

    try{

      const q =
        query(
          videosRef,
          orderBy(
            "createdAt",
            "desc"
          )
        );

      snapshot =
        await getDocs(q);

    }catch(error){

      console.warn(
        "Ordered query failed. Loading normally.",
        error
      );

      snapshot =
        await getDocs(videosRef);

    }


    allVideos = [];

    snapshot.forEach(
      videoDoc => {

        const data =
          videoDoc.data();

        allVideos.push({

          id:
            videoDoc.id,

          ...data

        });

      }
    );


    /*
      যদি createdAt থাকে,
      client-side-এ আবার sort করা হবে।
    */

    allVideos.sort(
      (a,b) => {

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


    renderFeed();

  }catch(error){

    console.error(
      "Video load error:",
      error
    );

    feed.innerHTML = `
      <div class="empty-feed">
        ভিডিও লোড করা যাচ্ছে না।<br><br>
        Firebase connection বা Firestore rules পরীক্ষা করুন।
      </div>
    `;

  }

}


/* =====================================================
   TIME VALUE
===================================================== */

function getTimeValue(timestamp){

  if (!timestamp){
    return 0;
  }

  if (
    typeof timestamp.toMillis ===
    "function"
  ){

    return timestamp.toMillis();

  }

  if (
    timestamp.seconds
  ){

    return timestamp.seconds * 1000;

  }

  if (
    timestamp instanceof Date
  ){

    return timestamp.getTime();

  }

  return 0;

}


/* =====================================================
   RENDER FEED
===================================================== */

function renderFeed(){

  feed.innerHTML = "";

  let videos = [];


  if (
    currentFeed === "foryou"
  ){

    videos =
      [...allVideos];

  }else{

    const followingIds =
      Array.isArray(
        currentProfile?.followingIds
      )
        ? currentProfile.followingIds
        : [];


    videos =
      allVideos.filter(
        video =>
          followingIds.includes(
            video.uid
          )
      );

  }


  if (!videos.length){

    if (
      currentFeed === "following"
    ){

      feed.innerHTML = `
        <div class="empty-feed">
          <div>
            <h3>Following</h3>
            <p>
              আপনি যাদের Follow করেছেন
              তাদের ভিডিও এখানে দেখা যাবে।
            </p>
          </div>
        </div>
      `;

    }else{

      feed.innerHTML = `
        <div class="empty-feed">
          কোনো ভিডিও পাওয়া যায়নি।
        </div>
      `;

    }

    return;

  }


  videos.forEach(
    video => {

      const item =
        createVideoItem(
          video
        );

      feed.appendChild(
        item
      );

    }
  );


  setupVideoObserver();

}


/* =====================================================
   CREATE VIDEO ITEM
===================================================== */

function createVideoItem(video){

  const item =
    document.createElement(
      "section"
    );

  item.className =
    "video-item";

  item.dataset.videoId =
    video.id;


  const videoURL =
    video.videoURL ||
    video.url ||
    video.downloadURL ||
    "";


  const avatar =
    video.creatorPhotoURL ||
    video.photoURL ||
    video.creatorAvatar ||
    video.profileURL ||
    "./images/profile.png";


  const username =
    video.username ||
    video.creatorUsername ||
    video.displayName ||
    video.creatorName ||
    "@wwc_user";


  const caption =
    video.caption ||
    video.description ||
    "";


  const likes =
    Number(
      video.likeCount ||
      video.likesCount ||
      video.likes ||
      0
    );


  const comments =
    Number(
      video.commentCount ||
      video.commentsCount ||
      video.comments ||
      0
    );


  const saves =
    Number(
      video.saveCount ||
      video.savesCount ||
      video.saves ||
      0
    );


  const isFollowing =
    currentProfile?.followingIds?.includes(
      video.uid
    ) || false;


  item.innerHTML = `

    <video
      class="video"
      src="${escapeAttribute(videoURL)}"
      loop
      muted
      playsinline
      preload="metadata"
    ></video>


    <div class="top-bar">

      <div class="tabs">

        <button
          class="tab ${currentFeed === "following" ? "active" : ""}"
          type="button"
          onclick="switchFeed('following')"
        >
          Following
        </button>

        <button
          class="tab ${currentFeed === "foryou" ? "active" : ""}"
          type="button"
          onclick="switchFeed('foryou')"
        >
          For You
        </button>

      </div>


      <button
        class="search-btn"
        type="button"
        onclick="openSearch()"
        aria-label="Search"
      >

        <svg viewBox="0 0 24 24">

          <circle
            cx="11"
            cy="11"
            r="7"
          />

          <path
            d="M16.5 16.5L22 22"
          />

        </svg>

      </button>

    </div>


    <div class="action-bar">


      <div class="action">

        <div class="creator-avatar">

          <img
            src="${escapeAttribute(avatar)}"
            alt="Profile"
          >

          <button
            class="follow-plus ${isFollowing ? "following" : ""}"
            type="button"
            onclick="toggleFollow('${escapeAttribute(video.uid || "")}', this)"
          >
            ${isFollowing ? "✓" : "+"}
          </button>

        </div>

      </div>


      <button
        class="action like-btn"
        type="button"
        data-video-id="${escapeAttribute(video.id)}"
        onclick="toggleLike('${escapeAttribute(video.id)}', this)"
      >

        <span class="action-icon">

          <svg viewBox="0 0 24 24">

            <path
              d="
              M20.8 8.8
              C20.8 5.8 18.7 4 16.2 4
              C14.5 4 13 4.9 12 6.2
              C11 4.9 9.5 4 7.8 4
              C5.3 4 3.2 5.8 3.2 8.8
              C3.2 13.1 7.3 16.2 12 20
              C16.7 16.2 20.8 13.1 20.8 8.8Z
              "
            />

          </svg>

        </span>

        <span class="action-count">
          ${formatNumber(likes)}
        </span>

      </button>


      <button
        class="action"
        type="button"
        onclick="openComments('${escapeAttribute(video.id)}')"
      >

        <span class="action-icon">

          <svg viewBox="0 0 24 24">

            <path
              d="
              M20 11.5
              C20 15.6 16.4 19 12 19
              C10.7 19 9.5 18.7 8.4 18.2
              L4 20
              L5.2 16.1
              C3.9 14.8 3 13.2 3 11.5
              C3 7.4 7 4 12 4
              C17 4 20 7.4 20 11.5Z
              "
            />

          </svg>

        </span>

        <span class="action-count">
          ${formatNumber(comments)}
        </span>

      </button>


      <button
        class="action"
        type="button"
        onclick="toggleBookmark('${escapeAttribute(video.id)}', this)"
      >

        <span class="action-icon">

          <svg viewBox="0 0 24 24">

            <path
              d="
              M6 4
              C6 3.4 6.4 3 7 3
              H17
              C17.6 3 18 3.4 18 4
              V21
              L12 17.2
              L6 21
              Z
              "
            />

          </svg>

        </span>

        <span class="action-count">
          ${formatNumber(saves)}
        </span>

      </button>


      <button
        class="action"
        type="button"
        onclick="shareVideo('${escapeAttribute(video.id)}')"
      >

        <span class="action-icon">

          <svg viewBox="0 0 24 24">

            <path d="M22 2L11 13"/>

            <path
              d="
              M22 2
              L15 22
              L11 13
              L2 9
              Z
              "
            />

          </svg>

        </span>

        <span class="action-count">
          Share
        </span>

      </button>


    </div>


    <div class="video-info">

      <div class="username">
        ${escapeHtml(username)}
      </div>

      <div class="caption">
        ${escapeHtml(caption)}
      </div>

      <div class="sound">
        🎵 Original sound - WWC
      </div>

    </div>


    <div class="pause-indicator">

      <svg viewBox="0 0 24 24">

        <rect
          x="6"
          y="4"
          width="4"
          height="16"
          rx="1"
        />

        <rect
          x="14"
          y="4"
          width="4"
          height="16"
          rx="1"
        />

      </svg>

    </div>

  `;


  setupVideoClick(
    item
  );


  return item;

}


/* =====================================================
   FOLLOWING / FOR YOU
===================================================== */

window.switchFeed =
async function(type){

  if (
    type !== "following" &&
    type !== "foryou"
  ){

    return;

  }


  currentFeed =
    type;


  renderFeed();


  /*
    নতুন feed render হওয়ার পরে
    প্রথম ভিডিও play করার চেষ্টা।
  */

  setTimeout(
    () => {

      const first =
        feed.querySelector(
          ".video-item"
        );

      if (first){

        first.scrollIntoView({
          behavior:"smooth",
          block:"start"
        });

        const video =
          first.querySelector(
            ".video"
          );

        if (video){

          video.play()
            .catch(
              () => {}
            );

        }

      }

    },
    100
  );

};


/* =====================================================
   FOLLOW / UNFOLLOW
===================================================== */

window.toggleFollow =
async function(uid, button){

  if (!currentUser){

    showToast(
      "Follow করতে Login করুন"
    );

    return;

  }


  if (!uid){

    return;

  }


  if (
    uid === currentUser.uid
  ){

    showToast(
      "নিজেকে Follow করা যাবে না"
    );

    return;

  }


  try{

    const userRef =
      doc(
        db,
        "users",
        currentUser.uid
      );


    const creatorRef =
      doc(
        db,
        "users",
        uid
      );


    const mySnap =
      await getDoc(
        userRef
      );


    const creatorSnap =
      await getDoc(
        creatorRef
      );


    const myData =
      mySnap.exists()
        ? mySnap.data()
        : {};


    const creatorData =
      creatorSnap.exists()
        ? creatorSnap.data()
        : {};


    let followingIds =
      Array.isArray(
        myData.followingIds
      )
        ? [...myData.followingIds]
        : [];


    let followerIds =
      Array.isArray(
        creatorData.followerIds
      )
        ? [...creatorData.followerIds]
        : [];


    const alreadyFollowing =
      followingIds.includes(
        uid
      );


    if (alreadyFollowing){

      followingIds =
        followingIds.filter(
          id => id !== uid
        );


      followerIds =
        followerIds.filter(
          id =>
            id !== currentUser.uid
        );


      button.classList.remove(
        "following"
      );

      button.textContent =
        "+";


      showToast(
        "Unfollow করা হয়েছে"
      );

    }else{

      followingIds.push(
        uid
      );


      if (
        !followerIds.includes(
          currentUser.uid
        )
      ){

        followerIds.push(
          currentUser.uid
        );

      }


      button.classList.add(
        "following"
      );

      button.textContent =
        "✓";


      showToast(
        "Following করা হয়েছে"
      );

    }


    await setDoc(
      userRef,
      {
        followingIds
      },
      {
        merge:true
      }
    );


    await setDoc(
      creatorRef,
      {
        followerIds
      },
      {
        merge:true
      }
    );


    currentProfile = {
      ...myData,
      uid:currentUser.uid,
      followingIds
    };


    /*
      Following feed হলে
      Follow/Unfollow করার পরে
      feed refresh হবে।
    */

    if (
      currentFeed === "following"
    ){

      renderFeed();

    }

  }catch(error){

    console.error(
      "Follow error:",
      error
    );

    showToast(
      "Follow করা যায়নি"
    );

  }

};


/* =====================================================
   LIKE
===================================================== */

window.toggleLike =
async function(videoId, button){

  if (!currentUser){

    showToast(
      "Like করতে Login করুন"
    );

    return;

  }


  try{

    const likeRef =
      doc(
        db,
        "videos",
        videoId,
        "likes",
        currentUser.uid
      );


    const snap =
      await getDoc(
        likeRef
      );


    const count =
      button.querySelector(
        ".action-count"
      );


    let number =
      parseFormattedNumber(
        count.textContent
      );


    if (snap.exists()){

      await deleteDoc(
        likeRef
      );


      button.classList.remove(
        "liked"
      );


      number =
        Math.max(
          0,
          number - 1
        );


    }else{

      await setDoc(
        likeRef,
        {
          uid:currentUser.uid,
          createdAt:
            serverTimestamp()
        }
      );


      button.classList.add(
        "liked"
      );


      number++;

    }


    count.textContent =
      formatNumber(number);


    const icon =
      button.querySelector(
        ".action-icon"
      );


    icon.animate(
      [
        {
          transform:"scale(.7)"
        },
        {
          transform:"scale(1.25)"
        },
        {
          transform:"scale(1)"
        }
      ],
      {
        duration:250
      }
    );


  }catch(error){

    console.error(
      "Like error:",
      error
    );

    showToast(
      "Like করা যায়নি"
    );

  }

};


/* =====================================================
   BOOKMARK / SAVE
===================================================== */

window.toggleBookmark =
async function(videoId, button){

  if (!currentUser){

    showToast(
      "Save করতে Login করুন"
    );

    return;

  }


  try{

    const saveRef =
      doc(
        db,
        "videos",
        videoId,
        "saves",
        currentUser.uid
      );


    const snap =
      await getDoc(
        saveRef
      );


    const count =
      button.querySelector(
        ".action-count"
      );


    let number =
      parseFormattedNumber(
        count.textContent
      );


    if (snap.exists()){

      await deleteDoc(
        saveRef
      );


      button.classList.remove(
        "saved"
      );


      number =
        Math.max(
          0,
          number - 1
        );


      showToast(
        "Saved থেকে সরানো হয়েছে"
      );

    }else{

      await setDoc(
        saveRef,
        {
          uid:currentUser.uid,
          createdAt:
            serverTimestamp()
        }
      );


      button.classList.add(
        "saved"
      );


      number++;


      showToast(
        "ভিডিও Saved হয়েছে"
      );

    }


    count.textContent =
      formatNumber(number);


  }catch(error){

    console.error(
      "Save error:",
      error
    );

    showToast(
      "Save করা যায়নি"
    );

  }

};


/* =====================================================
   COMMENTS
===================================================== */

window.openComments =
async function(videoId){

  currentVideoId =
    videoId;


  document
    .getElementById(
      "commentPanel"
    )
    .classList.add(
      "open"
    );


  await loadComments(
    videoId
  );

};


window.closeComments =
function(){

  document
    .getElementById(
      "commentPanel"
    )
    .classList.remove(
      "open"
    );

};


async function loadComments(videoId){

  const list =
    document.getElementById(
      "commentsList"
    );


  list.innerHTML =
    "<div>Comments লোড হচ্ছে...</div>";


  try{

    const ref =
      collection(
        db,
        "videos",
        videoId,
        "comments"
      );


    const snap =
      await getDocs(
        ref
      );


    list.innerHTML = "";


    if (
      snap.empty
    ){

      list.innerHTML =
        "<div>এখনো কোনো Comment নেই।</div>";

      return;

    }


    const comments =
      [];


    snap.forEach(
      commentDoc => {

        comments.push({

          id:
            commentDoc.id,

          ...commentDoc.data()

        });

      }
    );


    comments.sort(
      (a,b) =>
        getTimeValue(
          a.createdAt
        ) -
        getTimeValue(
          b.createdAt
        )
    );


    comments.forEach(
      comment => {

        const div =
          document.createElement(
            "div"
          );


        div.className =
          "comment";


        const name =
          comment.username ||
          comment.displayName ||
          "WWC User";


        const text =
          comment.text ||
          "";


        div.innerHTML = `

          <strong>
            ${escapeHtml(name)}
          </strong>

          ${escapeHtml(text)}

        `;


        list.appendChild(
          div
        );

      }
    );


  }catch(error){

    console.error(
      "Comment load error:",
      error
    );

    list.innerHTML =
      "<div>Comment লোড করা যায়নি।</div>";

  }

}


window.addComment =
async function(){

  const input =
    document.getElementById(
      "commentInput"
    );


  const text =
    input.value.trim();


  if (!text){

    return;

  }


  if (!currentUser){

    showToast(
      "Comment করতে Login করুন"
    );

    return;

  }


  if (!currentVideoId){

    return;

  }


  try{

    await addDoc(
      collection(
        db,
        "videos",
        currentVideoId,
        "comments"
      ),
      {

        uid:
          currentUser.uid,

        username:
          currentUser.displayName ||
          currentUser.email ||
          "WWC User",

        text,

        createdAt:
          serverTimestamp()

      }
    );


    input.value =
      "";


    await loadComments(
      currentVideoId
    );


    showToast(
      "Comment করা হয়েছে"
    );


  }catch(error){

    console.error(
      "Add comment error:",
      error
    );

    showToast(
      "Comment করা যায়নি"
    );

  }

};


/* =====================================================
   SHARE
===================================================== */

window.shareVideo =
async function(videoId){

  const url =
    window.location.origin +
    window.location.pathname +
    "?video=" +
    encodeURIComponent(
      videoId
    );


  const shareData = {

    title:
      "WWC-Core",

    text:
      "এই ভিডিওটি WWC-Core এ দেখুন।",

    url

  };


  try{

    if (
      navigator.share
    ){

      await navigator.share(
        shareData
      );

    }else{

      await navigator.clipboard.writeText(
        url
      );

      showToast(
        "ভিডিওর Link Copy হয়েছে"
      );

    }

  }catch(error){

    console.log(
      "Share cancelled"
    );

  }

};


/* =====================================================
   VIDEO PLAY / PAUSE
===================================================== */

function setupVideoClick(item){

  const video =
    item.querySelector(
      ".video"
    );


  const indicator =
    item.querySelector(
      ".pause-indicator"
    );


  item.addEventListener(
    "click",
    event => {

      if (
        event.target.closest(
          "button"
        )
      ){

        return;

      }


      if (
        video.paused
      ){

        video.play()
          .catch(
            () => {}
          );

        indicator.classList.remove(
          "show"
        );

      }else{

        video.pause();

        indicator.classList.add(
          "show"
        );

      }

    }
  );

}


/* =====================================================
   VIDEO OBSERVER
===================================================== */

let videoObserver = null;


function setupVideoObserver(){

  if (
    videoObserver
  ){

    videoObserver.disconnect();

  }


  videoObserver =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

            const video =
              entry.target.querySelector(
                ".video"
              );


            const indicator =
              entry.target.querySelector(
                ".pause-indicator"
              );


            if (
              entry.isIntersecting
            ){

              currentVideoElement =
                video;

              video.play()
                .catch(
                  () => {}
                );


              indicator.classList.remove(
                "show"
              );

            }else{

              video.pause();

            }

          }
        );

      },
      {
        threshold:.7
      }
    );


  document
    .querySelectorAll(
      ".video-item"
    )
    .forEach(
      item =>
        videoObserver.observe(
          item
        )
    );

}


/* =====================================================
   SEARCH
===================================================== */

window.openSearch =
function(){

  document
    .getElementById(
      "searchPanel"
    )
    .classList.add(
      "open"
    );


  setTimeout(
    () => {

      document
        .getElementById(
          "searchInput"
        )
        .focus();

    },
    100
  );

};


window.closeSearch =
function(){

  document
    .getElementById(
      "searchPanel"
    )
    .classList.remove(
      "open"
    );

};


/* =====================================================
   NAVIGATION
===================================================== */

window.goHome =
function(){

  window.location.href =
    "./index.html";

};


window.goFriends =
function(){

  window.location.href =
    "./friends.html";

};


window.goInbox =
function(){

  window.location.href =
    "./inbox.html";

};


window.goProfile =
function(){

  window.location.href =
    "./profile.html";

};


window.uploadVideo =
function(){

  showToast(
    "Upload page খুলছে..."
  );


  setTimeout(
    () => {

      window.location.href =
        "./upload.html";

    },
    400
  );

};


/* =====================================================
   TOAST
===================================================== */

function showToast(text){

  const toast =
    document.getElementById(
      "toast"
    );


  toast.textContent =
    text;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      1800
    );

}


/* =====================================================
   NUMBER FORMAT
===================================================== */

function formatNumber(number){

  number =
    Number(number) || 0;


  if (
    number >= 1000000
  ){

    return (
      number / 1000000
    ).toFixed(1) + "M";

  }


  if (
    number >= 1000
  ){

    return (
      number / 1000
    ).toFixed(1) + "K";

  }


  return String(
    number
  );

}


function parseFormattedNumber(value){

  if (!value){

    return 0;

  }


  const text =
    String(value)
      .trim()
      .toUpperCase();


  if (
    text.endsWith("M")
  ){

    return (
      parseFloat(text) *
      1000000
    );

  }


  if (
    text.endsWith("K")
  ){

    return (
      parseFloat(text) *
      1000
    );

  }


  return (
    parseInt(text) || 0
  );

}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHtml(value){

  return String(
    value ?? ""
  )
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


function escapeAttribute(value){

  return escapeHtml(
    value
  );

}


/* =====================================================
   ENTER KEY COMMENT
===================================================== */

document
  .getElementById(
    "commentInput"
  )
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ){

        addComment();

      }

    }
  );


/* =====================================================
   DEEP LINK ?video=
===================================================== */

function openDeepLinkedVideo(){

  const params =
    new URLSearchParams(
      window.location.search
    );


  const videoId =
    params.get(
      "video"
    );


  if (!videoId){

    return;

  }


  setTimeout(
    () => {

      const item =
        document.querySelector(
          `[data-video-id="${CSS.escape(videoId)}"]`
        );


      if (item){

        item.scrollIntoView({
          behavior:"smooth",
          block:"start"
        });

      }

    },
    500
  );

}


/* =====================================================
   INITIAL
===================================================== */

setTimeout(
  () => {

    openDeepLinkedVideo();

  },
  1200
);
