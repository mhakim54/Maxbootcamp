// ---------------------------------------------------------------------------
// Arnold's Tweets – app.js
// Displays Arnold Schwarzenegger tweets and reads them aloud.
// Uses ElevenLabs AI voice for realistic deep male voice, with browser
// Web Speech API as a fallback.
// ---------------------------------------------------------------------------

const TWEETS = [
  {
    text: "Strength does not come from winning. Your struggles develop your strengths. When you go through hardships and decide not to surrender, that is strength.",
    date: "Mar 14, 2020",
  },
  {
    text: "I just used my tank to crush things for charity. Nothing gets the blood pumping like flattening a taxi cab to raise money for after-school programs.",
    date: "Jun 2, 2019",
  },
  {
    text: "The mind is the limit. As long as the mind can envision the fact that you can do something, you can do it, as long as you really believe 100 percent.",
    date: "Jan 8, 2021",
  },
  {
    text: "Don't be afraid to fail. Anything I've ever attempted, I was always willing to fail. You can't always win, but don't be afraid of making decisions.",
    date: "Sep 22, 2020",
  },
  {
    text: "I'm back from the gym. 45 minutes of cycling, 45 minutes of lifting. No excuses. If I can do it at my age, you can do it at yours. Let's go.",
    date: "Nov 3, 2022",
  },
  {
    text: "I told my staff I will not be having a cheat meal this week. They laughed. I laughed. The donuts laughed. I ate the donuts.",
    date: "Apr 17, 2021",
  },
  {
    text: "To all the students starting school today: work hard, stay curious, and remember — no one ever got strong by taking the easy way. Pump it up!",
    date: "Aug 28, 2023",
  },
  {
    text: "I walked into a restaurant in Austria and the waiter said 'I'll be right back.' I said 'No. That's my line.'",
    date: "Jul 11, 2022",
  },
  {
    text: "People always ask me what the best exercise is. The best exercise is the one you actually do. Stop overthinking, start moving.",
    date: "Feb 5, 2023",
  },
  {
    text: "I came to America with nothing but a gym bag and a dream. This country gave me everything. Never take your opportunities for granted.",
    date: "Jul 4, 2021",
  },
  {
    text: "My mini donkey Lulu just interrupted my Zoom meeting. She does not care about your quarterly projections. I respect that.",
    date: "May 20, 2021",
  },
  {
    text: "Environmental protection isn't a partisan issue. It's a people issue. Clean air and clean water shouldn't be controversial. Let's terminate pollution.",
    date: "Apr 22, 2022",
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
