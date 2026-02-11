// ---------------------------------------------------------------------------
// Arnold's Tweets – app.js
// Displays Arnold Schwarzenegger tweets and reads them aloud using the
// Web Speech API with settings tuned to approximate his deep voice.
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
// DOM references
// ---------------------------------------------------------------------------
const tweetsContainer = document.getElementById("tweets-container");
const readAllBtn = document.getElementById("read-all-btn");
const stopBtn = document.getElementById("stop-btn");

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let isSpeaking = false;
let currentUtterance = null;
let readAllIndex = -1; // -1 means not in "read all" mode

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
// Speech synthesis helpers
// ---------------------------------------------------------------------------

/**
 * Pick the best available voice.  Prefer a deep-sounding English male voice.
 * This list is ordered by preference — the first match wins.
 */
function pickVoice() {
  const voices = speechSynthesis.getVoices();
  // Preferred voice names (varies by OS/browser)
  const preferred = [
    "Google UK English Male",
    "Microsoft David",
    "Daniel",
    "Alex",
    "Google US English",
    "English (America)",
    "en-US",
  ];

  for (const name of preferred) {
    const v = voices.find(
      (voice) =>
        voice.name.includes(name) && voice.lang.startsWith("en")
    );
    if (v) return v;
  }

  // Fallback: any English voice
  return voices.find((v) => v.lang.startsWith("en")) || voices[0] || null;
}

/**
 * Speak a single tweet's text with Arnold-tuned parameters.
 * Returns a Promise that resolves when the utterance finishes.
 */
function speakTweet(text) {
  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window)) {
      reject(new Error("Speech synthesis not supported"));
      return;
    }

    // Cancel anything currently playing
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    // Arnold-ish tuning: deep pitch, deliberate pace
    utterance.pitch = 0.55;  // low pitch
    utterance.rate = 0.82;   // slightly slow, deliberate
    utterance.volume = 1;

    const voice = pickVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      currentUtterance = null;
      resolve();
    };

    utterance.onerror = (e) => {
      currentUtterance = null;
      // "interrupted" is expected when user clicks Stop
      if (e.error === "interrupted" || e.error === "canceled") {
        resolve();
      } else {
        reject(e);
      }
    };

    speechSynthesis.speak(utterance);
  });
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
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

// Individual tweet read-aloud buttons
tweetsContainer.addEventListener("click", async (e) => {
  const btn = e.target.closest(".tweet-speak-btn");
  if (!btn) return;

  const index = Number(btn.dataset.index);

  // If already speaking this tweet, stop
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

// "Read All" button
readAllBtn.addEventListener("click", async () => {
  if (isSpeaking) return;
  setPlaying(true);

  for (let i = 0; i < TWEETS.length; i++) {
    readAllIndex = i;
    if (!isSpeaking) break; // user clicked stop
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

// Stop button
stopBtn.addEventListener("click", stopSpeaking);

function stopSpeaking() {
  speechSynthesis.cancel();
  clearSpeakingState();
  setPlaying(false);
  readAllIndex = -1;
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

// Voices may load async — re-pick when ready
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => {}; // just trigger load
}

renderTweets();
