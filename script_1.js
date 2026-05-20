
(function(){
  const ids = {
    intro: "introAudio",
    ambient: "ambientAudio",
    countdown: "countdownAudio",
    correct: "correctAudio",
    wrong: "wrongAudio"
  };
  const musicNames = new Set(["intro", "ambient"]);
  const sfxNames = new Set(["countdown", "correct", "wrong"]);
  const volumes = { intro: 0.55, ambient: 0.22, countdown: 0.65, correct: 0.75, wrong: 0.75 };

  function pref(name, fallbackKey){
    const value = localStorage.getItem(name);
    if(value === null && fallbackKey) return localStorage.getItem(fallbackKey) !== "off";
    return value !== "off";
  }

  const manager = {
    unlocked: false,
    get(name){ return document.getElementById(ids[name]); },
    musicOn(){ return pref("millionaire_music", "millionaire_sound"); },
    sfxOn(){ return pref("millionaire_sfx", "millionaire_sound"); },
    isAllowed(name){
      if(musicNames.has(name)) return manager.musicOn();
      if(sfxNames.has(name)) return manager.sfxOn();
      return manager.musicOn() || manager.sfxOn();
    },
    applySoundState(){
      Object.keys(ids).forEach(name => {
        const audio = manager.get(name);
        if(!audio) return;
        audio.volume = volumes[name] ?? 0.55;
        audio.muted = !manager.isAllowed(name);
        if(!manager.isAllowed(name)) {
          try { audio.pause(); if(name !== "ambient") audio.currentTime = 0; } catch(e){}
        }
      });
      if(manager.musicOn() && manager.unlocked) manager.startBackground();
    },
    async unlock(){
      if(manager.unlocked) return;
      manager.unlocked = true;
      manager.applySoundState();
      const list = Object.keys(ids).map(name => manager.get(name)).filter(Boolean);
      for(const audio of list){
        try {
          const oldMuted = audio.muted;
          audio.muted = true;
          await audio.play();
          audio.pause();
          audio.currentTime = 0;
          audio.muted = oldMuted;
        } catch(e){}
      }
      if(manager.musicOn()) {
        manager.play("intro");
        setTimeout(() => manager.startBackground(), 900);
      }
      document.removeEventListener("pointerdown", manager.unlock, true);
      document.removeEventListener("keydown", manager.unlock, true);
    },
    play(name){
      if(name === "next" || name === "select") return;
      if(!manager.isAllowed(name)) return;
      const audio = manager.get(name);
      if(!audio) return;
      try {
        audio.muted = false;
        audio.volume = volumes[name] ?? 0.55;
        audio.pause();
        audio.currentTime = 0;
        audio.play().catch(()=>{});
      } catch(e){}
    },
    stop(name){
      const audio = manager.get(name);
      if(!audio) return;
      try { audio.pause(); audio.currentTime = 0; } catch(e){}
    },
    startBackground(){
      if(!manager.musicOn()) return;
      const audio = manager.get("ambient");
      if(!audio) return;
      try {
        audio.muted = false;
        audio.volume = volumes.ambient;
        audio.loop = true;
        audio.play().catch(()=>{});
      } catch(e){}
    }
  };
  window.MillionaireAudio = manager;
  document.addEventListener("pointerdown", manager.unlock, true);
  document.addEventListener("keydown", manager.unlock, true);
  window.addEventListener("DOMContentLoaded", () => manager.applySoundState());
})();
