// WWC Core JavaScript
document.addEventListener("DOMContentLoaded", function () {
    console.log("WWC Video Feed Loaded");

    const feed = document.getElementById("video-feed");

    if (feed) {
        feed.innerHTML = "<h2>WWC Video Feed Ready</h2><p>Next Step: Load Videos</p>";
    }
});
