// ---------------------------------------------------------------------------
// Donnie's Tweets – app.js
// Displays Donald Trump tweets & Truth Social posts and reads them aloud.
// Uses ElevenLabs AI voice for realistic voice, with browser
// Web Speech API as a fallback.
// ---------------------------------------------------------------------------

const TWEETS = [
  {
    text: "I, as President of the United States of America, will be, effective immediately, raising the 10% Worldwide Tariff on Countries, many of which have been 'ripping' the U.S. off for decades, without retribution (until I came along!), to the fully allowed, and legally tested, 15% level.",
    date: "Feb 21, 2026",
    platform: "truth",
  },
  {
    text: "TRUTH SOCIAL IS THE BEST! There is nothing even close!!",
    date: "Dec 2, 2025",
    platform: "truth",
  },
  {
    text: "THIS WAS A RIGGED, DISGRACEFUL TRIAL. THE REAL VERDICT IS GOING TO BE NOVEMBER 5TH BY THE PEOPLE. OUR WHOLE COUNTRY IS BEING RIGGED RIGHT NOW.",
    date: "May 30, 2024",
    platform: "truth",
  },
  {
    text: "NEVER SURRENDER!",
    date: "Aug 24, 2023",
    platform: "truth",
  },
  {
    text: "Big protest in D.C. on January 6th. Be there, will be wild!",
    date: "Dec 19, 2020",
    platform: "twitter",
  },
  {
    text: "Why would Kim Jong-un insult me by calling me 'old,' when I would NEVER call him 'short and fat?' Oh well, I try so hard to be his friend - and maybe someday that will happen!",
    date: "Nov 11, 2017",
    platform: "twitter",
  },
  {
    text: "My use of social media is not Presidential - it's MODERN DAY PRESIDENTIAL. Make America Great Again!",
    date: "Jul 1, 2017",
    platform: "twitter",
  },
  {
    text: "Despite the constant negative press covfefe",
    date: "May 31, 2017",
    platform: "twitter",
  },
  {
    text: "I would like to extend my best wishes to all, even the haters and losers, on this special date, September 11th.",
    date: "Sep 11, 2013",
    platform: "twitter",
  },
  {
    text: "Sorry losers and haters, but my I.Q. is one of the highest -and you all know it! Please don't feel so stupid or insecure, it's not your fault",
    date: "May 8, 2013",
    platform: "twitter",
  },
  {
    text: "The electoral college is a disaster for a democracy.",
    date: "Nov 6, 2012",
    platform: "twitter",
  },
];

// ---------------------------------------------------------------------------
// ElevenLabs config
// ---------------------------------------------------------------------------
// Trump voice clone (may require ElevenLabs verification)
const ELEVENLABS_VOICE_ID = "nIBke5XE9E1mr9eWkwkG";
const ELEVENLABS_MODEL = "eleven_multilingual_v2";

function getApiKey() {
  return localStorage.getItem("elevenlabs_api_key_donnie") || "";
}

function setApiKey(key) {
  localStorage.setItem("elevenlabs_api_key_donnie", key.trim());
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
    voiceStatus.textContent = "Browser Voice (set up ElevenLabs for AI voice)";
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
    const platformLabel = tweet.platform === "truth" ? "Truth Social" : "Twitter";
    const platformClass = tweet.platform;
    card.innerHTML = `
      <div class="tweet-header">
        <div class="tweet-avatar">DT</div>
        <div class="tweet-author">
          <span class="tweet-name">Donald J. Trump <span class="tweet-platform ${platformClass}">${platformLabel}</span></span>
          <span class="tweet-handle">@realDonaldTrump</span>
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
              stability: 0.3,
              similarity_boost: 0.75,
              style: 0.4,
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
    utterance.pitch = 0.5;
    utterance.rate = 0.85;
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
