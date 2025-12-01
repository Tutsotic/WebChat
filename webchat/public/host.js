const signaling = new WebSocket("ws://localhost:8080");
let peer;
let channel;
let messages = [];

document.getElementById("startBtn").onclick = async () => {
    const username = document.getElementById("username").value || "Host";
    const anon = document.getElementById("anon").checked;
    const room = Math.random().toString(36).slice(2, 8).toUpperCase();

    document.getElementById("roomCode").innerText = room;

    signaling.send(JSON.stringify({ type: "create", room }));

    peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    channel = peer.createDataChannel("chat");
    setupChannel(channel, username, anon);

    peer.onicecandidate = e => {
        if (e.candidate) return;
        signaling.send(JSON.stringify({
            type: "signal",
            room,
            offer: peer.localDescription
        }));
    };

    signaling.onmessage = async msg => {
        let data = JSON.parse(msg.data);
        if (data.answer) {
            await peer.setRemoteDescription(data.answer);
        }
    };

    await peer.setLocalDescription(await peer.createOffer());

    document.getElementById("roomInfo").style.display = "block";

    setInterval(deleteOldMessages, 20000);
};

function setupChannel(channel, username, anon) {
    channel.onmessage = ev => addMessage(ev.data);

    document.getElementById("send").onclick = () => {
        sendMessage(username, anon);
    };
}

function sendMessage(username, anon) {
    const msgBox = document.getElementById("msg");
    const msg = msgBox.value;
    msgBox.value = "";

    const payload = JSON.stringify({
        user: anon ? "Anonymous" : username,
        text: msg,
        time: Date.now()
    });

    channel.send(payload);
    addMessage(payload);
}

function addMessage(raw) {
    const data = JSON.parse(raw);
    messages.push(data);

    const d = document.createElement("div");
    d.className = "bubble";
    d.innerText = `${data.user}: ${data.text}`;
    document.getElementById("chat").appendChild(d);
    d.scrollIntoView();
}

function deleteOldMessages() {
    const cutoff = Date.now() - 3600000;
    messages = messages.filter(m => m.time > cutoff);
}
