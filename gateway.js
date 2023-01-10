import WebSocket from 'ws';
import fetch_async from 'node-fetch';

// all of this is literally just to make the bot appear online :(

const gatewayUrl = (await (await fetch_async("https://discord.com/api/v10/gateway")).json())["url"]
var ws;
let gatewayIsActive = false;
let recievedACK = true;
var heartbeatInterval;
let lastSequenceNumber = null;
var session_id;
var resume_gateway_url;

export async function StartGateway() {
    if (ws === undefined) { ws = new WebSocket(gatewayUrl); }
    ws.on("close", (code) => {
        if (code === 1000 || code === 4200) { return; }
        console.log(`Gateway connection closed (code ${code}). Attempting reconnect.`);
        ResumeGatewayConnection();
    });
    ws.on("message", (data) => {
        let jsonData = JSON.parse(data);
        //console.log(jsonData);
        console.log(`Recieved data from Gateway, opcode: ${jsonData["op"]}`)
        if (jsonData["op"] === 11) {
            recievedACK = true;
        }
        else if (jsonData["op"] === 0) {
            lastSequenceNumber = jsonData["s"];
            //ready event
            if (jsonData["t"] === "READY") {
                ({ session_id, resume_gateway_url } = jsonData["d"]);
                console.log(`Gateway is ready. Session ID: ${session_id}, Resume URL: ${resume_gateway_url}`);
            }
            if (jsonData["t"] === "RESUMED") {
                console.log("Gateway connection successfully resumed.");
                recievedACK = true;
            }
        }
        else if (jsonData["op"] === 1) {
            SendHeartbeat();
        }
        else if (jsonData["op"] === 10) {
            heartbeatInterval = jsonData["d"]["heartbeat_interval"];
            console.log(`Gateway connection established. Heartbeat interval = ${heartbeatInterval}ms`);
            // send identify payload if gateway is activated for the first time
            if (!gatewayIsActive) {
                ws.send(JSON.stringify({
                    op: 2,
                    d: {
                        token: process.env.DISCORD_TOKEN,
                        intents: 0,
                        properties: {
                            os: "windows",
                            browser: "sd_bot",
                            device: "sd_bot"
                        }
                    }
                }));
            }
            gatewayIsActive = true;
            GatewayLoop();
        }
        else if (jsonData["op"] === 7) {
            ResumeGatewayConnection();
        }
        else if (jsonData["op"] === 9) {
            ws.close(1000);
            ws = undefined;
            StartGateway();
        }
    });
}

export async function StopGateway() {
    ws.close(1000);
    ws = undefined;
    gatewayIsActive = false;
}

async function GatewayLoop() {
    while (gatewayIsActive) {
        await new Promise(resolve => setTimeout(resolve, heartbeatInterval * Math.random()));
        SendHeartbeat();
        recievedACK = false;
    }
}

function SendHeartbeat() {
    if (!recievedACK) {
        console.log("Gateway ACK not recieved in time. Attempting to resume connection.");
        ResumeGatewayConnection();
        return;
    }
    ws.send(JSON.stringify({
        op: 1,
        d: lastSequenceNumber
    }));
}

function ResumeGatewayConnection() {
	ws.close(4200);
    ws = new WebSocket(resume_gateway_url);
    // send resume payload
    ws.on("open", () =>
        ws.send(JSON.stringify({
            op: 6,
            d: {
                token: process.env.DISCORD_TOKEN,
                session_id: session_id,
                seq: lastSequenceNumber.toString()
            }}))
    );
    StartGateway();
}
