/* =========================================
   WORLD WIDE CONNECT
   CLEAN APP.JS
   ========================================= */


/* =========================================
   PAGE READY
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

  console.log("WWC-Core started successfully");


  /* =======================================
     VIDEOS
     ======================================= */

  const videos = document.querySelectorAll(".feed-video");


  /*
     প্রথমে সব ভিডিও pause
  */

  videos.forEach(function (video) {

    video.pause();

    video.muted = true;

  });


  /*
     যেই ভিডিও স্ক্রিনে থাকবে
     সেটি automatically play হবে
  */

  const videoObserver = new IntersectionObserver(
    function (entries) {

      entries.forEach(function (entry) {

        const video = entry.target;


        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {

          videos.forEach(function (otherVideo) {

            if (otherVideo !== video) {
              otherVideo.pause();
            }

          });


          video.muted = true;


          const playPromise = video.play();


          if (playPromise !== undefined) {

            playPromise.catch(function (error) {

              console.log(
                "Autoplay blocked:",
                error
              );

            });

          }

        } else {

          video.pause();

        }

      });

    },
    {
      threshold: [0.6]
    }
  );


  /*
     সব ভিডিও observer-এর মধ্যে
  */

  videos.forEach(function (video) {

    videoObserver.observe(video);


    /*
       ভিডিওতে tap করলে sound on/off
    */

    video.addEventListener("click", function () {

      video.muted = !video.muted;


      if (video.paused) {

        video.play().catch(function () {});

      }

    });


    /*
       ভিডিও error হলে console-এ দেখাবে
    */

    video.addEventListener("error", function () {

      console.error(
        "Video load error:",
        video.currentSrc
      );

    });

  });


  /* =======================================
     LIKE
     ======================================= */

  const likeButtons =
    document.querySelectorAll(".like-btn");


  likeButtons.forEach(function (button) {

    button.addEventListener("click", function (event) {

      event.stopPropagation();


      const countElement =
        button.querySelector(".like-count");


      let count =
        parseInt(countElement.textContent) || 0;


      if (button.classList.contains("liked")) {

        count--;

        button.classList.remove("liked");

      } else {

        count++;

        button.classList.add("liked");

      }


      countElement.textContent = count;

    });

  });


  /* =======================================
     FOLLOW
     ======================================= */

  const followButtons =
    document.querySelectorAll(".follow-btn");


  followButtons.forEach(function (button) {

    button.addEventListener("click", function (event) {

      event.stopPropagation();


      if (button.classList.contains("following")) {

        button.classList.remove("following");

        button.textContent = "Follow";

      } else {

        button.classList.add("following");

        button.textContent = "Following ✓";

      }

    });

  });


  /* =======================================
     SHARE
     ======================================= */

  const shareButtons =
    document.querySelectorAll(".share-btn");


  shareButtons.forEach(function (button) {

    button.addEventListener("click", async function (event) {

      event.stopPropagation();


      const shareData = {

        title: "World Wide Connect",

        text: "Check this video on World Wide Connect",

        url: window.location.href

      };


      try {

        if (
          navigator.share &&
          typeof navigator.share === "function"
        ) {

          await navigator.share(shareData);

        } else {

          await navigator.clipboard.writeText(
            window.location.href
          );

          alert("Video link copied!");

        }

      } catch (error) {

        console.log(
          "Share cancelled or unavailable."
        );

      }

    });

  });


  /* =======================================
     COMMENT
     ======================================= */

  const commentButtons =
    document.querySelectorAll(".comment-btn");


  const commentBox =
    document.getElementById("commentBox");


  const commentInput =
    document.getElementById("commentInput");


  const commentCancel =
    document.getElementById("commentCancel");


  const commentSend =
    document.getElementById("commentSend");


  commentButtons.forEach(function (button) {

    button.addEventListener("click", function (event) {

      event.stopPropagation();

      commentBox.classList.add("show");

      commentInput.focus();

    });

  });


  commentCancel.addEventListener("click", function () {

    commentBox.classList.remove("show");

    commentInput.value = "";

  });


  commentSend.addEventListener("click", function () {

    const text =
      commentInput.value.trim();


    if (text === "") {

      alert("Please write a comment.");

      return;

    }


    alert("Comment added: " + text);


    commentInput.value = "";

    commentBox.classList.remove("show");

  });


  /* =======================================
     LOGIN / REGISTER
     ======================================= */

  const loginBtn =
    document.getElementById("loginBtn");


  loginBtn.addEventListener("click", function () {

    window.location.href = "./login.html";

  });


  /* =======================================
     LOGOUT
     ======================================= */

  const logoutBtn =
    document.getElementById("logoutBtn");


  logoutBtn.addEventListener("click", function () {

    const confirmLogout =
      confirm("Do you want to logout?");


    if (confirmLogout) {

      localStorage.removeItem("wwc_user");

      alert("Logged out.");

    }

  });


  /* =======================================
     UPLOAD
     ======================================= */

  const uploadBtn =
    document.getElementById("uploadBtn");


  uploadBtn.addEventListener("click", function () {

    window.location.href = "./upload.html";

  });


  /* =======================================
     SAVE SIMPLE STATE
     ======================================= */

  console.log(
    "Videos:",
    videos.length
  );

  console.log(
    "Likes:",
    likeButtons.length
  );

  console.log(
    "Follows:",
    followButtons.length
  );

});
