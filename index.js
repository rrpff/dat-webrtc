const WORDS = ["grate", "label", "load", "tooth", "cold", "beneficial", "plausible", "boy", "steam", "lackadaisical", "decorous", "coach", "battle", "awake", "uppity", "thundering", "supreme", "back", "hop", "cellar", "suspend", "jittery", "scrape", "bloody", "design", "plug", "dynamic", "easy", "noise", "unfasten", "spare", "immense", "undesirable", "jumpy", "onerous", "birth", "pack", "heat", "blood", "flashy", "lace", "habitual", "uttermost", "pies", "challenge", "park", "swanky", "office", "x-ray", "table", "rotten", "walk", "historical", "juicy", "burly", "precious", "internal", "friends", "building", "bake", "turn", "yell", "carry", "wise", "rely", "aback", "nut", "helpless", "shiny", "country", "field", "extra-small", "difficult", "sail", "snatch", "deep", "air", "mean", "bouncy", "defective", "five", "neat", "son", "foolish", "hook", "childlike", "educate", "oven", "obsequious", "best", "sweltering", "responsible", "digestion", "limping", "deeply", "sordid", "riddle", "borrow", "alike", "clap", "cable", "entertaining", "position", "insurance", "husky", "existence", "left", "boat", "art", "lewd", "vigorous", "thank", "sore", "ripe", "paddle", "chop", "nasty", "invention", "scatter", "contain", "kettle", "basket", "soda", "near", "hose", "tiger", "miniature", "save", "relax", "adhesive", "same", "laugh", "minute", "twist", "hate", "acceptable", "unique", "rustic", "craven", "decorate", "pets", "handsome", "science", "worm", "capable", "strong", "amazing", "van", "imminent", "versed", "careful", "clever", "decide", "frightening", "jagged", "arm", "collar", "tired", "scissors", "front", "airplane", "cry", "trace", "fail", "healthy", "willing", "scent", "beautiful", "bewildered", "brawny", "reproduce", "jog", "overjoyed", "team", "necessary", "aggressive", "spoon", "sedate", "approve", "simple", "ghost", "real", "shock", "talk", "interrupt", "comfortable", "cheer", "cute", "rabbits", "slippery", "prose", "arrive", "crazy", "trousers", "inform", "free", "noisy", "flame", "frighten", "pushy", "earn", "self", "rush", "snobbish", "trap", "oval", "circle", "macabre", "watery", "quack", "military", "general", "typical", "vanish", "purring", "shape", "statuesque", "trite", "tramp", "hurried", "wholesale", "grouchy", "scrub", "bashful", "terrible", "communicate", "mailbox", "jump", "nostalgic", "hilarious", "switch", "truculent", "pocket", "pet", "rabid", "amuck", "divide", "songs", "note", "fool", "steadfast", "colossal", "irritate", "dime", "good", "little", "violent", "deer", "zoom", "slow", "tested", "enthusiastic", "hallowed", "rough", "guide", "chunky"];

class IdGenerator {
  static generate () {
    const random = () => WORDS[Math.floor(Math.random() * WORDS.length)];
    return [random(), random(), random()].join("-");
  }
}

class Emitter {
  constructor () {
    this.listeners = {};
  }

  trigger (event, ...data) {
    const listeners = this.listeners[event] || [];
    listeners.forEach(listener => listener(...data));
  }

  on (event, listener) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(listener);
  }
}

class P2PConnection extends Emitter {
  listen () {
    experimental.datPeers.addEventListener("message", ({ peer, message }) => {
      console.info(`received "${message.type}" event from ${peer}: ${JSON.stringify(message)}`);
      this.trigger(`receive:${message.type}`, { peer, message: message.message });
    });
  }

  broadcast (type, message) {
    console.info(`broadcasting "${type}" event: ${JSON.stringify(message)}`);
    experimental.datPeers.broadcast({ type, message });
  }
}

const SDP_CONSTRAINTS = {
  optional: [],
  mandatory: {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
  },
};

const renderStream = (stream, username, isUser = false) => {
  const container = document.createElement("div");
  container.className = isUser
    ? "videos__video videos__video--mirrored"
    : "videos__video";

  const video = document.createElement("video");
  container.appendChild(video);

  const overlay = document.createElement("div");
  overlay.className = "videos__overlay";
  container.appendChild(overlay);

  const name = document.createElement("span");
  name.className = "videos__overlay__username";
  name.innerHTML = username;
  overlay.appendChild(name);

  if (!isUser) {
    const mute = document.createElement("a");
    mute.className = "videos__overlay__option";
    mute.innerHTML = "mute me";
    mute.href = "#!";
    mute.onclick = e => {
      e.preventDefault();
      video.muted = !video.muted;
      mute.innerHTML = video.muted ? "unmute me" : "mute me";
    };
    overlay.appendChild(mute);

    const hide = document.createElement("a");
    hide.className = "videos__overlay__option";
    hide.innerHTML = "hide me";
    hide.href = "#!";
    hide.onclick = e => {
      e.preventDefault();
      video.style.opacity = hide.innerHTML === "hide me" ? 0 : 1;
      hide.innerHTML = hide.innerHTML === "hide me" ? "unhide me" : "hide me";
    };
    overlay.appendChild(hide);
  }

  videosEl.appendChild(container);

  video.src = window.URL.createObjectURL(stream);
  video.play();
}

const id = () => {
  const array = new Uint32Array(1);
  return window.crypto.getRandomValues(array)[0];
}

const videosEl = document.querySelector("#videos");
const joinEl = document.querySelector("#join");
const joinInput = joinEl.querySelector("input");
const joinButton = joinEl.querySelector("button");
const roomId = window.location.hash.substr(1) || IdGenerator.generate();
const username = window.localStorage.getItem("username") || "";
const p2p = new P2PConnection();

window.location.hash = roomId;

joinInput.value = username;
joinButton.innerHTML = `join #${roomId}`;

joinEl.style.opacity = 1;

joinEl.onsubmit = async (e) => {
  e.preventDefault();
  joinEl.style.display = "none";
  window.localStorage.setItem("username", e.target[0].value);

  const devices = await navigator.mediaDevices.enumerateDevices();
  const hasCamera = devices.some(device => device.kind === "videoinput");
  const hasMic = devices.some(device => device.kind === "audioinput");

  navigator.getUserMedia(
    { video: hasCamera, audio: hasMic },
    async userStream => {
      renderStream(userStream, e.target[0].value || "anonymous", true);
      renderStream(userStream, e.target[0].value || "anonymous", false);

      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.onicecandidate = event => {
        if (event.candidate) {
          p2p.broadcast(`${roomId}:ICE_CANDIDATE`, event.candidate);
        }
      };

      pc.addStream(userStream);
      pc.addEventListener("addstream", e => { console.log(e); renderStream(e.stream); }, false);

      pc.createOffer(
        offer => {
          console.log(`local offer made:`);
          console.log(offer);

          p2p.on(`receive:${roomId}:OFFER`, ({ message }) => {
            pc.setRemoteDescription(new RTCSessionDescription(message), () => {
              pc.createAnswer(localDescription => {
                pc.setLocalDescription(localDescription);
                p2p.broadcast(`${roomId}:ANSWER`, localDescription);
              });
            });
          });

          p2p.on(`receive:${roomId}:ANSWER`, ({ message }) => {
            pc.setRemoteDescription(new RTCSessionDescription(message));
          });

          p2p.on(`receive:${roomId}:ICE_CANDIDATE`, ({ message }) => {
            pc.addIceCandidate(new RTCIceCandidate(message));
          });

          p2p.broadcast(`${roomId}:OFFER`, offer);
        },
        error => {
          console.error(error);
        },
      );
    },
    err => console.error(err)
  );
};
