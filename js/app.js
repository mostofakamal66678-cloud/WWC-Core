const videos = document.querySelectorAll("video");
let current = 0;

// =====================
// 🎥 ভিডিও চালু
// =====================
if (videos.length > 0) {
  videos[current].play().catch(() => {});
}

// ভিডিও পরিবর্তন
document.addEventListener("wheel", (e) => {
  if (videos.length === 0) return;

  videos[current].pause();

  if (e.deltaY > 0) {
    current = (current + 1) % videos.length;
  } else {
    current = (current - 1 + videos.length) % videos.length;
  }

  videos[current].play().catch(() => {});

  videos[current].scrollIntoView({
    behavior: "smooth"
  });
});

// =====================
// ❤️ LIKE + সংখ্যা
// =====================
const buttons = document.querySelectorAll(
  "button, [role='button'], a"
);

buttons.forEach((button) => {
  const text = button.textContent.trim();

  if (text.includes("❤️") || text.toLowerCase().includes("like")) {

    let liked = localStorage.getItem("wwc-liked") === "true";
    let likeCount = parseInt(
      localStorage.getItem("wwc-like-count") || "0"
    );

    function updateLike() {
      if (liked) {
        button.textContent = "❤️ Liked " + likeCount;
      } else {
        button.textContent = "❤️ Like " + likeCount;
      }
    }

    updateLike();

    button.addEventListener("click", (e) => {
      e.preventDefault();

      if (!liked) {
        liked = true;
        likeCount++;
      } else {
        liked = false;
        if (likeCount > 0) likeCount--;
      }

      localStorage.setItem("wwc-liked", liked);
      localStorage.setItem("wwc-like-count", likeCount);

      updateLike();
    });
  }

  // =====================
  // 💬 COMMENT
  // =====================
  if (
    text.includes("💬") ||
    text.toLowerCase().includes("comment")
  ) {

    button.addEventListener("click", (e) => {
      e.preventDefault();

      const comment = prompt("💬 আপনার মন্তব্য লিখুন:");

      if (comment && comment.trim() !== "") {

        let comments = JSON.parse(
          localStorage.getItem("wwc-comments") || "[]"
        );

        comments.push({
          text: comment.trim(),
          time: new Date().toLocaleString()
        });

        localStorage.setItem(
          "wwc-comments",
          JSON.stringify(comments)
        );

        alert("💬 আপনার মন্তব্য সংরক্ষণ হয়েছে!");
      }
    });
  }

  // =====================
  // ↗️ SHARE
  // =====================
  if (
    text.includes("↗️") ||
    text.toLowerCase().includes("share")
  ) {

    button.addEventListener("click", async (e) => {
      e.preventDefault();

      const shareData = {
        title: "WWC-Core",
        text: "এই ভিডিওটি দেখুন ❤️",
        url: window.location.href
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(
            window.location.href
          );

          alert("↗️ লিংক কপি হয়েছে!");
        }
      } catch (error) {
        console.log("Share cancelled");
      }
    });
  }
});
