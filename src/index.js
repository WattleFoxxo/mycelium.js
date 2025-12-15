import { Constants } from "./constants.js";
import { Packet } from "./packet.js";
import { Message } from "./message.js";
import { Session } from "./session.js";
import { EventEmitter } from "./events.js";

class Mycelium extends EventEmitter {
    constructor(device) {
        super();

        this.device = device;
        this.sessions = new Map();

        this.device.on(Constants.MeshcorePushCodes.LogRxData, (data) => this._onRawCustom(data));
        this.device.on(Constants.Events.Connected, () => this._onConnected());
        this.device.on(Constants.Events.Disconnected, () => this._onDisconnected());
    }

    async sendMessage(destination, message) {
        const payload = new Uint8Array(new TextEncoder("utf-8").encode(message));

        this._sendMyceliumMessage(new Message(
            destination,
            Constants.PayloadType.Message,
            payload.length,
            payload
        ));
    }

    async sendFile(destination, fileName, file) {
        const name = new TextEncoder("utf-8").encode(fileName);

        const payload = new Uint8Array([
            name.length,
            ...name,
            ...file
        ]);

        this._sendMyceliumMessage(new Message(
            destination,
            Constants.PayloadType.File,
            payload.length,
            payload
        ));
    }

    async _onConnected() {
        this.selfInfo = await this.device.getSelfInfo();

        this.emit(Constants.Events.Connected);
    }

    async _onDisconnected() {
        this.emit(Constants.Events.Disconnected);
    }

    async _resolvePath(publicKey) {
        if (publicKey == Constants.Path.ZeroHop) return [];

        const contact = await this.device.findContactByPublicKeyPrefix(publicKey);

        if (contact.outPathLen == -1) return [];

        return contact.outPath;
    }

    _onMyceliumMessage(message) {
        switch (message.payloadType) {
            case Constants.PayloadType.Message:
                const text = new TextDecoder("utf-8").decode(message.payload);

                this.emit(Constants.Events.Message, {
                    message: text
                });
                break;
            
            case Constants.PayloadType.File:
                const fileNameLength = message.payload[0];
                const fileName = new TextDecoder("utf-8").decode(
                    message.payload.slice(1, fileNameLength + 1)
                );
                const file = message.payload.slice(fileNameLength + 1);

                this.emit(Constants.Events.File, {
                    fileName: fileName,
                    file: file
                });
                break;
        }
    }

    async _sendMyceliumMessage(message) {
        const totalChunks = Math.ceil(message.payloadLength / Constants.ChunkSize);

        let session = new Session(
            Math.floor(Math.random() * 255) + 1, // Random session id for now
            totalChunks,
            message.payloadType
        );

        session.setPayload(message.payload);
        this.sessions.set(session.id, session);

        let chunk = session.getNextChunk();

        let packet = new Packet(
            message.destination[0],
            this.selfInfo.publicKey[0],
            session.id,
            session.totalChunks,
            session.currentChunk,
            session.payloadType,
            chunk.length,
            chunk
        );

        const path = await this._resolvePath(message.destination);
        this.device.sendCommandSendRawData(path, packet.toUint8Array());
    }

    async _onRawCustom(data) {
        // Filter out non RawCustom packets
        
        if (data.raw[0] != 0x3e) return;

        const pathLength = data.raw[1];
        const rawPacket = data.raw.slice(2 + pathLength);
        
        // Filter out non Mcelium packets
        if (!rawPacket.slice(0, 2).every(
            (v, i) => v === Constants.Magic[i])
        ) return;
        
        // Filter incompatible Mcelium packets
        if (rawPacket[2] != Constants.Version) return;

        const packet = Packet.fromUint8Array(rawPacket);
        
        // Filter Mcelium packets that are not for us
        if (packet.destination != this.selfInfo.publicKey[0] && packet.destination != Constants.Path.ZeroHop[0]) return;
        
        // Catch single packet messages
        if (packet.totalChunks == 1) {
            if (packet.payloadType == Constants.PayloadType.Signalling) {
                this._sendChunkPacket(packet);
                return;
            }

            let message = new Message(
                this.selfInfo,
                packet.payloadType,
                packet.payload.length,
                packet.payload
            );

            this._onMyceliumMessage(message);
            return;
        }

        this._handleChunkedPacket(packet);
    }

    async _sendChunkPacket(packet) {
        const chunkIndex = packet.payload[0];
        const session = this.sessions.get(packet.session);
        const chunk = session.chunks.get(chunkIndex);

        session.currentChunk = chunkIndex;

        const responsePacket = new Packet(
            packet.source,
            this.selfInfo.publicKey[0],
            session.id,
            session.totalChunks,
            session.currentChunk,
            session.payloadType,
            chunk.length,
            chunk
        );

        const path = await this._resolvePath(new Uint8Array([packet.source]));
        this.device.sendCommandSendRawData(path, responsePacket.toUint8Array());
    }

    async _sendSignallingPacket(packet) {
        let responsePacket = new Packet(
            packet.source,
            this.selfInfo.publicKey[0],
            packet.session,
            1, // Total chunks
            0, // Chunk index
            Constants.PayloadType.Signalling,
            0x00, // Reserved/unused
            new Uint8Array([
                packet.chunkIndex + 1 // Get the next chunk
            ])
        );

        const path = await this._resolvePath(new Uint8Array([packet.source]));
        this.device.sendCommandSendRawData(path, responsePacket.toUint8Array());
    }

    async _handleChunkedPacket(packet) {
        let session;

        // Check if fist packet
        if (packet.chunkIndex == 0) {
            session = new Session(
                packet.session,
                packet.totalChunks,
                packet.payloadType
            );

            session.chunks.set(packet.chunkIndex, packet.payload);
            this.sessions.set(packet.session, session);
        } else {
            session = this.sessions.get(packet.session);

            session.currentChunk = packet.chunkIndex;
            session.chunks.set(packet.chunkIndex, packet.payload);
        }

        this.emit(Constants.Events.MessageProgress, {
            session: session,
            totalChunks: packet.totalChunks,
            chunkIndex: packet.chunkIndex
        });

        session.retryTimer.stopRetryTimer();

        // Check if last packet
        if (packet.chunkIndex + 1 >= packet.totalChunks) {
            session.retryTimer.stopRetryTimer();

            let payload = session.getPayload();

            let message = new Message(
                this.selfInfo,
                packet.payloadType,
                payload.length,
                payload
            );

            this._onMyceliumMessage(message);

            return;
        }

        session.retryTimer.startRetryTimer(() => this._sendSignallingPacket(packet), () => {
            this.sessions.delete(packet.session);

            this.emit(Constants.Events.MessageTimeout, packet.session);
        });

        this._sendSignallingPacket(packet)
    }
}

export {
    Mycelium,
    Constants,
    Packet,
    Message,
    Session,
    EventEmitter
}
