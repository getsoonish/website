// Plays each clip only while it's on screen (Nov 14, 2026), so the page loads quickly and nothing
// moves off screen. With Reduce Motion on, clips stay on their still frame with play controls.
(function () {
  var clips = document.querySelectorAll("video[data-clip]");
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function rateOf(video) { return parseFloat(video.getAttribute("data-rate")) || 0.6; }
  function play(video) {
    video.playbackRate = rateOf(video);
    var playing = video.play();
    if (playing && playing.catch) { playing.catch(function () {}); }
  }
  clips.forEach(function (video) {
    video.muted = true;
    // Slower than life (owner, Nov 14, 2026: people need to see the impact, not speed through it), except
    // clips recorded at a person's own pace (typing), which carry data-rate="0.85".
    var rate = rateOf(video);
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

  // A clip that follows another (Nov 15, 2026, owner: side by side, the two clips never show the
  // same thing). data-follow names the leader's id and data-at the second in the leader's clip when
  // it starts: it holds its first frame while the leader plays, plays once at that moment, and holds
  // its last frame until the leader comes round again. When the leader isn't playing (scrolled away,
  // or swiped past on a phone), it simply loops on its own.
  var followers = [];
  clips.forEach(function (video) {
    var lead = document.getElementById(video.getAttribute("data-follow") || "");
    if (lead) {
      followers.push({ video: video, lead: lead, at: parseFloat(video.getAttribute("data-at")) || 0,
                       visible: false, synced: false, armed: true, last: 0 });
    }
  });
  function followerOf(video) {
    for (var i = 0; i < followers.length; i++) { if (followers[i].video === video) { return followers[i]; } }
    return null;
  }
  var ticking = false;
  function tick() {
    var any = false;
    followers.forEach(function (f) {
      if (!f.visible) { return; }
      any = true;
      var lead = f.lead, video = f.video, t = lead.currentTime;
      var leading = !lead.paused && !lead.ended && lead.readyState >= 2;
      if (leading) {
        if (!f.synced) {
          f.synced = true;
          video.loop = false;
          video.pause();
          video.currentTime = 0;
          f.armed = t < f.at;
        } else if (t < f.last - 0.5) {
          // The leader came round again: back to the first frame, ready for the next moment.
          video.pause();
          video.currentTime = 0;
          f.armed = true;
        }
        if (f.armed && t >= f.at) {
          f.armed = false;
          video.currentTime = 0;
          play(video);
        }
        f.last = t;
      } else {
        if (f.synced) { f.synced = false; video.loop = true; }
        if (video.paused) { play(video); }
      }
    });
    if (any) { requestAnimationFrame(tick); } else { ticking = false; }
  }
  function startTicking() {
    if (!ticking) { ticking = true; requestAnimationFrame(tick); }
  }

  var watcher = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var video = entry.target;
      var follower = followerOf(video);
      if (entry.isIntersecting) {
        if (video.preload === "none") { video.preload = "auto"; }
        if (follower) {
          follower.visible = true;
          follower.synced = false;
          startTicking();
        } else {
          play(video);
        }
      } else {
        if (follower) { follower.visible = false; }
        video.pause();
      }
    });
  }, { threshold: 0.45 });
  clips.forEach(function (video) { watcher.observe(video); });
})();
