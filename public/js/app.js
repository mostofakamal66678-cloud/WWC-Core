
document.addEventListener("DOMContentLoaded", () => {
    const video = document.querySelector("video");

    if (video) {
        video.play().catch(() => {});
    }
});
