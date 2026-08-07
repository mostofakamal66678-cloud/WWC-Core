const videos = document.querySelectorAll("video");
let current = 0;

// প্রথম ভিডিও চালু
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

// -------------------------
// ❤️ LIKE
// -------------------------
const buttons = document.querySelectorAll(
  "button, [role='button'], a"
);

buttons.forEach((button) => {
  const text = button.textContent.trim();

  // ❤️ Like
  if (text.includes("❤️") || text.toLowerCase().includes("like")) {
    button.addEventListener("click", (e) => {
      e.preventDefault();

      button.classList.toggle("liked");

      if (button.classList.contains("liked")) {
        button.textContent = "❤️ Liked";
      } else {
        button.textContent = "❤️ Like";
      }
    });
  }

  // 💬 Comment
  if (text.includes("💬") || text.toLowerCase().includes("comment")) {
    button.addEventListener("click", (e) => {
      e.preventDefault();

      const comment = prompt("আপনার মন্তব্য লিখুন:");

      if (comment && comment.trim() !== "") {
        alert("💬 আপনার মন্তব্য যোগ হয়েছে:\n\n" + comment);
      }
    });
  }

  // ↗️ Share
  if (
    text.includes("↗️") ||
    text.toLowerCase().includes("share")
  ) {
    button.addEventListener("click", async (e) => {
      e.preventDefault();

      const shareData = {
        title: "WWC-Core",
        text: "এই ভিডিওটি দেখুন",
        url: window.location.href
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(window.location.href);
          alert("↗️ লিংক কপি হয়েছে।");
        }
      } catch (error) {
        console.log("Share cancelled");
      }
    });
  }
});
