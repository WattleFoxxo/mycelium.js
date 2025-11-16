
export class Message {
    constructor(
        destination,
        payloadType,
        payloadLength,
        payload
    ) {
        this.destination = destination;
        this.payloadType = payloadType;
        this.payloadLength = payloadLength;
        this.payload = payload;
    }
}
