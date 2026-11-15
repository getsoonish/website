// Plays each clip only while it's on screen (Nov 14, 2026), so the page loads quickly and nothing
// moves off screen. With Reduce Motion on, clips stay on their still frame with play controls.
(function () {
  var clips = document.querySelectorAll("video[data-clip]");
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  clips.forEach(function (video) {
    video.muted = true;
    // Slower than life (owner, Nov 14, 2026: people need to see the impact, not speed through it), except
    // clips recorded at a person's own pace (typing), which carry data-rate="0.85".
    var rate = parseFloat(video.getAttribute("data-rate")) || 0.6;
    video.defaultPlaybackRate = rate;
    video.playbackRate = rate;
    video.setAttribute("playsinline", "");
    if (still) { video.setAttribute("controls", ""); }
  });
  if (still) { return; }
  if (!("IntersectionObserver" in window)) {
    clips.forEach(function (video) { video.setAttribute("autoplay", ""); video.load(); });
    return;
  }
  var watcher = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var video = entry.target;
      if (entry.isIntersecting) {
        if (video.preload === "none") { video.preload = "auto"; }
        video.playbackRate = parseFloat(video.getAttribute("data-rate")) || 0.6;
        var playing = video.play();
        if (playing && playing.catch) { playing.catch(function () {}); }
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.45 });
  clips.forEach(function (video) { watcher.observe(video); });
})();
