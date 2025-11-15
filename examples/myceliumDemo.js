/*
    Mycelium Demo

    Usage:
        Send Message:
            node myceliumDemo.js [Serial Port] message [Message]
            eg. node myceliumDemo.js /dev/ttyACM0 message "Hello world!"
        
        Send File:
            node myceliumDemo.js [Serial Port] file [File Path]
            eg. node myceliumDemo.js /dev/ttyACM0 file ./examplesImages/damn2kb.avif

        Recive:
            node myceliumDemo.js [Serial Port]
            eg. node myceliumDemo.js /dev/ttyACM0
*/

import fs from "fs";
import path from "path";

import { NodeJSSerialConnection } from "@liamcottle/meshcore.js";
import { Mycelium, Constants as MyceliumConstants } from "../src/index.js";

const [, , serialPort, mode ] = process.argv;

const connection = new NodeJSSerialConnection(serialPort);
const mycelium = new Mycelium(connection); 


mycelium.on(MyceliumConstants.MessageEvent.Message, (data) => {
    // console.log(data);

    console.log(data.message);
});

mycelium.on(MyceliumConstants.MessageEvent.File, (data) => {
    // console.log(data);

    console.log(`Recived file, saving as "${data.fileName}"!`);
    fs.writeFileSync(data.fileName, data.file);
});

mycelium.on(MyceliumConstants.MessageEvent.MessageProgress, (data) => {
    // console.log(data);

    console.log(`Reciving large message, progress: ${Math.floor(((data.chunkIndex + 1) / data.totalChunks) * 100)}%`);
});

await connection.connect();

switch (mode) {
    case "message":
        const [, , , , message ] = process.argv;

        mycelium.sendMessage(message);
        break;

    case "file":
        const [, , , , filePath ] = process.argv;

        const fileName = path.basename(filePath);
        const file = fs.readFileSync(filePath);
        
        mycelium.sendFile(fileName, file);
        break;
    
    default:
        console.log("listerning mode...");
        break;
}
