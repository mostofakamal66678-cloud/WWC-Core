const videos = document.querySelectorAll("video");
let current = 0;

videos[current].play();

document.addEventListener("wheel", (e) => {
    videos[current].pause();

    if (e.deltaY > 0) {
        current = (current + 1) % videos.length;
    } else {
        current = (current - 1 + videos.length) % videos.length;
    }

    videos[current].play();
    videos[current].scrollIntoView({
        behavior: "smooth"
    });
});
