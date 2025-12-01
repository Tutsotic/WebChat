const signaling = new WebSocket("ws://localhost:8080");
let peer;
let channel;

document.getElementById("joinBtn").onclick = async () => {
    const room = document.getElementById("room").value;
    const username = document.getElementById("username").value || "Guest";

    peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    peer.ondatachannel = e => {
        channel = e.channel;
        setupChannel(channel, username);
    };

    signaling.onmessage = async msg => {
        let data = JSON.parse(msg.data);
        if (data.offer) {
            await peer.setRemoteDescription(data.offer);
            await peer.setLocalDescription(await peer.createAnswer());

            signaling.send(JSON.stringify({
                type: "signal",
                room,
                answer: peer.localDescription
            }));

            document.querySelector(".inputBox").style.display = "flex";
        }
    };

    signaling.send(JSON.stringify({ type: "signal", room }));
};

function setupChannel(channel, username) {
    channel.onmessage = e => addMessage(e.data);

    document.getElementById("send").onclick = () => {
        const msgBox = document.getElementById("msg");
        const payload = JSON.stringify({
            user: username,
            text: msgBox.value,
            time: Date.now()
        });
        msgBox.value = "";

        channel.send(payload);
        addMessage(payload);
    };
}

function addMessage(raw) {
    const data = JSON.parse(raw);

    const d = document.createElement("div");
    d.className = "bubble";
    d.innerText = `${data.user}: ${data.text}`;
    document.getElementById("chat").appendChild(d);
    d.scrollIntoView();
}
