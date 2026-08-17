document.addEventListener("DOMContentLoaded", () => {

  console.log("WWC-Core started");

  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];

  const videos = () => $$(".feed-video");
  const items = () => $$(".video-item");

  let currentVideo = null;
  let activeCommentVideo = null;


  /* VIDEO PLAY */

  function pauseAll(except = null) {
    videos().forEach(v => {
      if (v !== except) v.pause();
    });
  }

  function playVideo(video, sound = false) {
    if (!video) return;

    pauseAll(video);

    currentVideo = video;
    video.muted = !sound;
    video.playsInline = true;

    const p = video.play();

    if (p) {
      p.catch(err => {
        console.log("Video play blocked", err);
      });
    }
  }


  /* AUTO PLAY */

  if ("IntersectionObserver" in window) {

    const observer = new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          const video = entry.target;

          if (
            entry.isIntersecting &&
            entry.intersectionRatio >= 0.6
          ) {
            playVideo(video, false);
          } else {
            video.pause();
          }

        });

      },
      { threshold: [0.6] }
    );

    videos().forEach(video => observer.observe(video));
  }


  /* VIDEO CLICK */

  document.addEventListener("click", e => {

    const video = e.target.closest(".feed-video");

    if (!video) return;

    if (video.paused) {
      playVideo(video, true);
    } else {
      video.pause();
    }

  });


  /* VIDEO END */

  document.addEventListener("ended", e => {

    if (!e.target.classList.contains("feed-video")) {
      return;
    }

    const list = items();
    const current = e.target.closest(".video-item");
    const index = list.indexOf(current);

    const next =
      index >= 0 && index < list.length - 1
        ? index + 1
        : 0;

    scrollToVideo(next);

  }, true);


  function scrollToVideo(index) {

    const list = items();

    if (!list.length) return;

    index = Math.max(
      0,
      Math.min(index, list.length - 1)
    );

    list[index].scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    const video = $(".feed-video", list[index]);

    if (video) {
      setTimeout(() => {
        playVideo(video, false);
      }, 500);
    }

  }


  function currentIndex() {

    if (!currentVideo) return 0;

    const current =
      currentVideo.closest(".video-item");

    const index = items().indexOf(current);

    return index >= 0 ? index : 0;
  }


  function nextVideo() {
    scrollToVideo(currentIndex() + 1);
  }


  function previousVideo() {
    const index = currentIndex();

    if (index > 0) {
      scrollToVideo(index - 1);
    }
  }
      /* SWIPE */

  let startY = 0;

  document.addEventListener("touchstart", e => {

    if (!e.touches.length) return;

    startY = e.touches[0].clientY;

  }, { passive: true });


  document.addEventListener("touchend", e => {

    if (!e.changedTouches.length) return;

    const endY = e.changedTouches[0].clientY;

    const distance = startY - endY;

    if (Math.abs(distance) < 70) return;

    if (distance > 0) {
      nextVideo();
    } else {
      previousVideo();
    }

  }, { passive: true });


  /* KEYBOARD */

  document.addEventListener("keydown", e => {

    if (e.key === "ArrowDown") {
      e.preventDefault();
      nextVideo();
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      previousVideo();
    }

  });


  /* LIKE */

  document.addEventListener("click", e => {

    const button = e.target.closest(".like-btn");

    if (!button) return;

    e.preventDefault();
    e.stopPropagation();

    const item = button.closest(".video-item");

    if (!item) return;

    const count = $(".like-count", item);

    let number = count
      ? parseInt(count.textContent, 10) || 0
      : 0;

    const liked =
      button.classList.contains("liked");

    if (liked) {

      number = Math.max(0, number - 1);

      button.classList.remove("liked");

      button.setAttribute(
        "aria-pressed",
        "false"
      );

    } else {

      number++;

      button.classList.add("liked");

      button.setAttribute(
        "aria-pressed",
        "true"
      );

    }

    if (count) {
      count.textContent = number;
    }

  });


  /* FOLLOW */

  document.addEventListener("click", e => {

    const button = e.target.closest(".follow-btn");

    if (!button) return;

    e.preventDefault();
    e.stopPropagation();

    const following =
      button.classList.toggle("following");

    button.textContent =
      following ? "Following" : "Follow";

    button.setAttribute(
      "aria-pressed",
      following ? "true" : "false"
    );

  });
    /* ========================================
   SAVE BUTTON
   ======================================== */

document.addEventListener("click", e => {

    const button = e.target.closest(".save-btn");

    if (!button) return;

    e.preventDefault();
    e.stopPropagation();

    button.classList.toggle("saved");

    button.textContent =
        button.classList.contains("saved")
            ? "🔖✓"
            : "🔖";
});


/* ========================================
   SHARE BUTTON
   ======================================== */

document.addEventListener("click", async e => {

    const button = e.target.closest(".share-btn");

    if (!button) return;

    e.preventDefault();
    e.stopPropagation();

    const videoItem =
        button.closest(".video-item");

    let shareText =
        "Check out this video on World Wide Connect 🌎";

    if (navigator.share) {

        try {

            await navigator.share({
                title: "World Wide Connect",
                text: shareText,
                url: window.location.href
            });

        } catch (error) {

            console.log("Share cancelled");

        }

    } else {

        try {

            await navigator.clipboard.writeText(
                window.location.href
            );

            alert("Link copied successfully!");

        } catch (error) {

            alert("Share link: " + window.location.href);

        }

    }

});


/* ========================================
   COMMENT BUTTON
   ======================================== */

let activeCommentBox = null;

document.addEventListener("click", e => {

    const button =
        e.target.closest(".comment-btn");

    if (!button) return;

    e.preventDefault();
    e.stopPropagation();

    const box =
        $("#commentBox");

    if (!box) return;

    activeCommentBox = button.closest(".video-item");

    box.classList.add("show");

    const input =
        $("#commentInput");

    if (input) {

        input.value = "";

        setTimeout(() => {
            input.focus();
        }, 100);

    }

});


/* ========================================
   COMMENT CANCEL
   ======================================== */

const commentCancel =
    $("#commentCancel");

if (commentCancel) {

    commentCancel.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            const box =
                $("#commentBox");

            if (box) {
                box.classList.remove("show");
            }

            activeCommentBox = null;

        }
    );

}


/* ========================================
   COMMENT SEND
   ======================================== */

const commentSend =
    $("#commentSend");

if (commentSend) {

    commentSend.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            const input =
                $("#commentInput");

            if (!input) return;

            const text =
                input.value.trim();

            if (!text) {

                alert("Please write a comment.");

                return;
            }

            console.log(
                "Comment:",
                text
            );

            alert("Comment added!");

            input.value = "";

            const box =
                $("#commentBox");

            if (box) {
                box.classList.remove("show");
            }

            activeCommentBox = null;

        }
    );

}


/* ========================================
   UPLOAD VIDEO BUTTON
   ======================================== */

const uploadBtn =
    $("#uploadBtn");

const videoUpload =
    $("#videoUpload");

if (uploadBtn && videoUpload) {

    uploadBtn.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            videoUpload.click();

        }
    );

}


/* ========================================
   VIDEO UPLOAD PREVIEW
   ======================================== */

if (videoUpload) {

    videoUpload.addEventListener(
        "change",
        e => {

            const file =
                e.target.files[0];

            if (!file) return;

            if (!file.type.startsWith("video/")) {

                alert("Please select a video file.");

                videoUpload.value = "";

                return;
            }

            console.log(
                "Selected video:",
                file.name
            );

            alert(
                "Video selected: " +
                file.name
            );

        }
    );

}


/* ========================================
   INBOX BUTTON
   ======================================== */

const inboxBtn =
    $("#inboxBtn");

if (inboxBtn) {

    inboxBtn.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            window.location.href =
                "./inbox.html";

        }
    );

}


/* ========================================
   PROFILE BUTTON
   ======================================== */

const profileBtn =
    $("#profileBtn");

if (profileBtn) {

    profileBtn.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            const menu =
                $("#profileMenu");

            if (menu) {

                menu.classList.toggle("show");

            } else {

                window.location.href =
                    "./profile.html";

            }

        }
    );

}


/* ========================================
   PROFILE MENU
   ======================================== */

const profileBtnMenu =
    $("#profileBtnMenu");

if (profileBtnMenu) {

    profileBtnMenu.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            window.location.href =
                "./profile.html";

        }
    );

}


/* ========================================
   LOGIN BUTTON
   ======================================== */

const loginBtn =
    $("#loginBtn");

if (loginBtn) {

    loginBtn.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            window.location.href =
                "./auth.html";

        }
    );

}


/* ========================================
   LOGOUT BUTTON
   ======================================== */

const logoutBtn =
    $("#logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            console.log(
                "Logout button clicked"
            );

            window.location.href =
                "./auth.html";

        }
    );

}


/* ========================================
   CLOSE PROFILE MENU
   ======================================== */

const profileMenuClose =
    $("#profileMenuClose");

if (profileMenuClose) {

    profileMenuClose.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            const menu =
                $("#profileMenu");

            if (menu) {
                menu.classList.remove("show");
            }

        }
    );

}


/* ========================================
   CLOSE MENU WHEN CLICKING OUTSIDE
   ======================================== */

document.addEventListener("click", e => {

    const menu =
        $("#profileMenu");

    const button =
        $("#profileBtn");

    if (!menu || !button) return;

    if (
        menu.classList.contains("show") &&
        !menu.contains(e.target) &&
        !button.contains(e.target)
    ) {

        menu.classList.remove("show");

    }

});


/* ========================================
   STARTUP
   ======================================== */

console.log(
    "WWC-Core: App initialized successfully."
);
