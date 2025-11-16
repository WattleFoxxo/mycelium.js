/*
    Mycelium Demo

    Usage:
        Send Message:
            node myceliumDemo.js [Serial Port] message [Public Key] [Message]
            eg. node myceliumDemo.js /dev/ttyACM0 message d6 "Hello world!"
        
        Send File:
            node myceliumDemo.js [Serial Port] file [Public Key] [File Path]
            eg. node myceliumDemo.js /dev/ttyACM0 file d6 ./examplesImages/damn2kb.avif

        Receive:
            node myceliumDemo.js [Serial Port]
            eg. node myceliumDemo.js /dev/ttyACM0
*/

import fs from "fs";
import path from "path";

import { NodeJSSerialConnection, Constants as MeshcoreConstants } from "@liamcottle/meshcore.js";
import { Mycelium, Constants as MyceliumConstants } from "../src/index.js";

const [, , serialPort, mode, destination ] = process.argv;

const connection = new NodeJSSerialConnection(serialPort);
const mycelium = new Mycelium(connection); 

mycelium.on(MyceliumConstants.Events.Message, (data) => {
    console.log(data.message);
});

mycelium.on(MyceliumConstants.Events.File, (data) => {
    console.log(`Recived file, saving as "${data.fileName}"!`);
    fs.writeFileSync(data.fileName, data.file);
});

mycelium.on(MyceliumConstants.Events.MessageProgress, (data) => {
    console.log(`Reciving large message, progress: ${Math.floor(((data.chunkIndex + 1) / data.totalChunks) * 100)}%`);
});

mycelium.on(MyceliumConstants.Events.Connected, async () => {

    if (!mode) {
        // in the browser use `new Uint8Array(mycelium.selfInfo.publicKey).toHex()`
        const publicKey = Buffer.from(mycelium.selfInfo.publicKey).toString("hex");

        console.log(`listerning mode. my public key: ${publicKey}`);
        return;
    }

    // in the browser use `new Uint8Array(mycelium.selfInfo.publicKey).fromHex()`
    const contact = await mycelium.device.findContactByPublicKeyPrefix(Buffer.from(destination, "hex"));

    switch (mode) {
        case "message":
            const [, , , , , message ] = process.argv;

            mycelium.sendMessage(contact.publicKey, message);
            break;

        case "file":
            const [, , , , , filePath ] = process.argv;

            const fileName = path.basename(filePath);
            const file = fs.readFileSync(filePath);
            
            mycelium.sendFile(MyceliumConstants.Path.ZeroHop, fileName, file);
            break;
        
        default:
            break;
    }
});

await mycelium.device.connect();
