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

class Store {
  get (key, defaultValue) {
    return window.localStorage.getItem(key) || defaultValue;
  }

  set (key, value) {
    return window.localStorage.setItem(key, value);
  }
}

class Page {
  constructor () {
    this.videosEl = document.querySelector("#videos");
    this.joinEl = document.querySelector("#join");
    this.joinInput = this.joinEl.querySelector("input");
    this.joinButton = this.joinEl.querySelector("button");
  }

  fillInUsername (username) {
    this.joinInput.value = username;
  }

  setRoomId (roomId) {
    this.joinButton.innerHTML = `join #${roomId}`;
  }

  fadeIn () {
    this.joinEl.style.opacity = 1;
  }

  onUserEnter (fn) {
    this.joinEl.addEventListener("submit", e => {
      e.preventDefault();
      fn(e.target[0].value);
    });
  }

  showVideos () {
    this.joinEl.style.display = "none";
  }

  renderStream (stream, username, isUser = false) {
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

    this.videosEl.appendChild(container);

    video.src = window.URL.createObjectURL(stream);
    video.play();
  }
}

class MediaDevices {
  static getUserMediaStream () {
    return new Promise(async (resolve, reject) => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === "videoinput");
      const hasMic = devices.some(device => device.kind === "audioinput");
      const request = { video: hasCamera, audio: hasMic };

      navigator.getUserMedia(request, stream => resolve(stream), err => reject(err));
    });
  }
}

class WebRTCConnection extends Emitter {
  constructor (userStream) {
    super();

    this.peerConnection = new RTCPeerConnection({ iceServers: [] });
    this.peerConnection.onicecandidate = event => {
      if (event.candidate) {
        this.trigger("ice_candidate", event.candidate);
      }
    };

    this.peerConnection.addStream(userStream);
    this.peerConnection.addEventListener("addstream", e => {
      console.log(e);
      this.trigger("add_stream", e.stream);
    }, false);
    this.peerConnection.addEventListener("removestream", e => {
      console.log(e);
    }, false);

    this.peerConnection.createOffer(
      offer => {
        console.log(`local offer made:`);
        console.log(offer);
        this.trigger("create_offer", offer);
      },
      error => {
        console.error(error);
      },
    );
  }
}

const SDP_CONSTRAINTS = {
  optional: [],
  mandatory: {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
  },
};

const id = () => {
  const array = new Uint32Array(1);
  return window.crypto.getRandomValues(array)[0];
}

const store = new Store();
const page = new Page();
const p2p = new P2PConnection();

const roomId = window.location.hash.substr(1) || IdGenerator.generate();
const previousUsername = store.get("username", "");

window.location.hash = roomId;

page.fillInUsername(previousUsername);
page.setRoomId(roomId);
page.fadeIn();

page.onUserEnter(async username => {
  page.showVideos();
  store.set("username", username);

  const userStream = await MediaDevices.getUserMediaStream();

  page.renderStream(userStream, username || "anonymous", true);
  page.renderStream(userStream, username || "anonymous", false);

  const conn = new WebRTCConnection(userStream);

  conn.on("ice_candidate", candidate => p2p.broadcast(`${roomId}:ICE_CANDIDATE`, candidate));
  conn.on("add_stream", stream => renderStream(stream));
  conn.on("create_offer", offer => {
    p2p.on(`receive:${roomId}:OFFER`, ({ message }) => {
      conn.peerConnection.setRemoteDescription(new RTCSessionDescription(message), () => {
        conn.peerConnection.createAnswer(localDescription => {
          conn.peerConnection.setLocalDescription(localDescription);
          p2p.broadcast(`${roomId}:ANSWER`, localDescription);
        });
      });
    });

    p2p.on(`receive:${roomId}:ANSWER`, ({ message }) => {
      conn.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
    });

    p2p.on(`receive:${roomId}:ICE_CANDIDATE`, ({ message }) => {
      conn.peerConnection.addIceCandidate(new RTCIceCandidate(message));
    });

    p2p.broadcast(`${roomId}:OFFER`, offer);
  });
});
