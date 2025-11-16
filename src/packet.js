import { Constants } from "./constants.js";

export class Packet {
    constructor(
        destination,
        source,
        session,
        totalChunks,
        chunkIndex,
        payloadType,
        payloadLength,
        payload
    ) {
        this.destination = destination;
        this.source = source;
        this.session = session;
        this.totalChunks = totalChunks;
        this.chunkIndex = chunkIndex;
        this.payloadType = payloadType;
        this.payloadLength = payloadLength;
        this.payload = payload;
    }
    
    toUint8Array() {
        return new Uint8Array([
            ...Constants.Magic,
            Constants.Version,
            this.destination,
            this.source,
            this.session,
            this.totalChunks,
            this.chunkIndex,
            this.payloadType,
            this.payloadLength,
            ...this.payload
        ]);
    }

    static fromUint8Array(raw) {
        // Skip Magic (2 bytes) and Version (1 byte)

        return new Packet(
            raw[3], // Destination
            raw[4], // Source
            raw[5], // Session
            raw[6], // totalChunks
            raw[7], // chunkIndex
            raw[8], // payloadType
            raw[9], // payloadLength
            raw.slice(10) // payload
        )
    }
}
