// ---------------------------------------------------------------------------
// Arnold's Tweets – app.js
// Displays Arnold Schwarzenegger tweets and reads them aloud.
// Uses ElevenLabs AI voice for realistic deep male voice, with browser
// Web Speech API as a fallback.
// ---------------------------------------------------------------------------

const TWEETS = [
  {
    text: "Rain or shine, the pump is always out there. I rode my bike to Gold's this morning in the rain and had one of the best workouts of the year. Stop waiting for the perfect conditions. They don't exist. Just go.",
    date: "Feb 11, 2026",
  },
  {
    text: "For more than 60 years I've watched fitness change. Fads come and go. The machines change. The supplements change. But the fundamentals never do. Show up. Lift heavy. Eat real food. Sleep. Repeat. There are no shortcuts. Everything is reps, reps, reps.",
    date: "Feb 4, 2026",
  },
  {
    text: "When life feels out of control, fitness is how you fight back. If you're unemployed, you can join the Pump Club and pay whatever you can, even if that's nothing at all. At the Pump Club, we put your progress over our profit. Together, we really can lift up the world.",
    date: "Jan 1, 2026",
  },
  {
    text: "I'm not like those gyms that want to take your money on January 1 and then hope you stop showing up by February. I want you to use my app. Finish the Foundation program and I'll give you 50% of your annual membership back. Bet on yourself. Make 2026 your year.",
    date: "Jan 1, 2026",
  },
  {
    text: "My best advice is to stop using motivation as your only fuel. I know it feels great when you're fired up, but it's a short-term fuel source. The only lasting fuel is routine. You don't need any more shortcuts or distractions. You need discipline. You need to show up every day.",
    date: "Dec 15, 2025",
  },
  {
    text: "When I had my hip replaced, I was back in the gym as soon as the doctor cleared me. That same winter, I was skiing again. The goal isn't to avoid aging, it's to stay in the game.",
    date: "Nov 18, 2025",
  },
  {
    text: "No, Jake. There has been gerrymandering going on for 200 years. There's no such thing as temporary, that's fantasy. Democrats and Republicans have to come together and solve this if they really want to be public servants. If they want to be party servants, it won't happen.",
    date: "Oct 26, 2025",
  },
  {
    text: "The mind always fails first, not the body. The secret is to make your mind work for you, not against you. What we face may look insurmountable. But I learned something from all those years of training and competing. We are always stronger than we know.",
    date: "Sep 5, 2025",
  },
  {
    text: "I'm getting ready for the gerrymandering battle.",
    date: "Aug 15, 2025",
  },
  {
    text: "You're told supplements are the missing piece. As a result, you pour your hopes and hard-earned money into powders and pills, believing it will change everything. And too often, you end up disappointed.",
    date: "Apr 10, 2025",
  },
  {
    text: "Today is Quitter's Day. But not for you. This is the weekend gym attendance drops because motivation falls off. I'm fighting back and not letting you quit. I know the power of training partners. I wouldn't be the Arnold you know without Franco.",
    date: "Jan 10, 2025",
  },
  {
    text: "I don't really do endorsements. I'm not shy about sharing my views, but I hate politics and don't trust most politicians. I will always be an American before I am a Republican. This week, I am voting for Kamala Harris and Tim Walz. Let's turn the page.",
    date: "Oct 30, 2024",
  },
];

// ---------------------------------------------------------------------------
// ElevenLabs config
// ---------------------------------------------------------------------------
// Arnold Schwarzenegger – custom voice clone
const ELEVENLABS_VOICE_ID = "w0ky0iTUHLg2Zu1MPfpZ";
const ELEVENLABS_MODEL = "eleven_multilingual_v2";

function getApiKey() {
  return localStorage.getItem("elevenlabs_api_key") || "";
}

function setApiKey(key) {
  localStorage.setItem("elevenlabs_api_key", key.trim());
}

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------
const tweetsContainer = document.getElementById("tweets-container");
const readAllBtn = document.getElementById("read-all-btn");
const stopBtn = document.getElementById("stop-btn");
const settingsBtn = document.getElementById("settings-btn");
const settingsModal = document.getElementById("settings-modal");
const settingsClose = document.getElementById("settings-close");
const settingsSave = document.getElementById("settings-save");
const apiKeyInput = document.getElementById("api-key-input");
const voiceStatus = document.getElementById("voice-status");
const floatingStopBtn = document.getElementById("floating-stop-btn");

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let isSpeaking = false;
let currentAudio = null;       // for ElevenLabs (Audio element)
let currentUtterance = null;   // for browser fallback
let readAllIndex = -1;

// ---------------------------------------------------------------------------
// Settings modal
// ---------------------------------------------------------------------------
settingsBtn.addEventListener("click", () => {
  apiKeyInput.value = getApiKey();
  settingsModal.classList.add("open");
});

settingsClose.addEventListener("click", () => {
  settingsModal.classList.remove("open");
});

settingsSave.addEventListener("click", () => {
  setApiKey(apiKeyInput.value);
  updateVoiceStatus();
  settingsModal.classList.remove("open");
});

// Close modal on backdrop click
settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove("open");
  }
});

function updateVoiceStatus() {
  if (getApiKey()) {
    voiceStatus.textContent = "ElevenLabs AI Voice";
    voiceStatus.className = "voice-status active";
  } else {
    voiceStatus.textContent = "Browser Voice (set up ElevenLabs for Arnold voice)";
    voiceStatus.className = "voice-status";
  }
}

// ---------------------------------------------------------------------------
// Render tweets
// ---------------------------------------------------------------------------
function renderTweets() {
  tweetsContainer.innerHTML = "";
  TWEETS.forEach((tweet, index) => {
    const card = document.createElement("div");
    card.className = "tweet-card";
    card.dataset.index = index;
    card.innerHTML = `
      <div class="tweet-header">
        <div class="tweet-avatar">AS</div>
        <div class="tweet-author">
          <span class="tweet-name">Arnold Schwarzenegger</span>
          <span class="tweet-handle">@Schwarzenegger</span>
        </div>
      </div>
      <p class="tweet-text">${escapeHtml(tweet.text)}</p>
      <div class="tweet-footer">
        <span class="tweet-date">${tweet.date}</span>
        <button class="tweet-speak-btn" data-index="${index}" title="Read aloud">
          &#128264;
        </button>
      </div>
    `;
    tweetsContainer.appendChild(card);
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// ElevenLabs TTS
// ---------------------------------------------------------------------------
function speakWithElevenLabs(text) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": getApiKey(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text,
            model_id: ELEVENLABS_MODEL,
            voice_settings: {
              stability: 0.15,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        reject(new Error(`ElevenLabs API error: ${response.status} – ${err}`));
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        currentAudio = null;
        resolve();
      };

      audio.onerror = (e) => {
        URL.revokeObjectURL(url);
        currentAudio = null;
        reject(new Error("Audio playback error"));
      };

      audio.play();
    } catch (e) {
      reject(e);
    }
  });
}

// ---------------------------------------------------------------------------
// Browser fallback TTS
// ---------------------------------------------------------------------------
function pickVoice() {
  const voices = speechSynthesis.getVoices();
  const preferred = [
    "Aaron", "Daniel", "Google UK English Male", "Microsoft David",
    "Microsoft Mark", "Alex", "Fred", "Google US English",
    "English (America)", "en-US",
  ];
  for (const name of preferred) {
    const v = voices.find(
      (voice) => voice.name.includes(name) && voice.lang.startsWith("en")
    );
    if (v) return v;
  }
  return voices.find((v) => v.lang.startsWith("en")) || voices[0] || null;
}

function speakWithBrowser(text) {
  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window)) {
      reject(new Error("Speech synthesis not supported"));
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;
    utterance.pitch = 0.35;
    utterance.rate = 0.72;
    utterance.volume = 1;
    const voice = pickVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => { currentUtterance = null; resolve(); };
    utterance.onerror = (e) => {
      currentUtterance = null;
      if (e.error === "interrupted" || e.error === "canceled") resolve();
      else reject(e);
    };
    speechSynthesis.speak(utterance);
  });
}

// ---------------------------------------------------------------------------
// Unified speak function – prefers ElevenLabs, falls back to browser
// ---------------------------------------------------------------------------
async function speakTweet(text) {
  if (getApiKey()) {
    try {
      await speakWithElevenLabs(text);
      return;
    } catch (e) {
      console.warn("ElevenLabs failed, falling back to browser TTS:", e);
      voiceStatus.textContent = "ElevenLabs error – using browser voice. Check API key.";
      voiceStatus.className = "voice-status";
    }
  }
  await speakWithBrowser(text);
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------
function clearSpeakingState() {
  document.querySelectorAll(".tweet-card.speaking").forEach((el) => {
    el.classList.remove("speaking");
  });
  document.querySelectorAll(".tweet-speak-btn.active").forEach((el) => {
    el.classList.remove("active");
  });
}

function setSpeakingState(index) {
  clearSpeakingState();
  const card = tweetsContainer.querySelector(`[data-index="${index}"]`);
  if (card) {
    card.classList.add("speaking");
    card.querySelector(".tweet-speak-btn").classList.add("active");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function setPlaying(playing) {
  isSpeaking = playing;
  readAllBtn.disabled = playing;
  stopBtn.disabled = !playing;
  floatingStopBtn.disabled = !playing;
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------
tweetsContainer.addEventListener("click", async (e) => {
  const btn = e.target.closest(".tweet-speak-btn");
  if (!btn) return;
  const index = Number(btn.dataset.index);

  if (isSpeaking) {
    stopSpeaking();
    return;
  }

  setPlaying(true);
  setSpeakingState(index);
  try {
    await speakTweet(TWEETS[index].text);
  } catch (_) {
    // ignore
  }
  clearSpeakingState();
  setPlaying(false);
  readAllIndex = -1;
});

readAllBtn.addEventListener("click", async () => {
  if (isSpeaking) return;
  setPlaying(true);

  for (let i = 0; i < TWEETS.length; i++) {
    readAllIndex = i;
    if (!isSpeaking) break;
    setSpeakingState(i);
    try {
      await speakTweet(TWEETS[i].text);
    } catch (_) {
      break;
    }
  }

  clearSpeakingState();
  setPlaying(false);
  readAllIndex = -1;
});

stopBtn.addEventListener("click", stopSpeaking);
floatingStopBtn.addEventListener("click", stopSpeaking);

function stopSpeaking() {
  // Stop ElevenLabs audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  // Stop browser TTS
  speechSynthesis.cancel();
  clearSpeakingState();
  setPlaying(false);
  readAllIndex = -1;
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => {};
}

updateVoiceStatus();
renderTweets();
