# Mycelium.js
> [!WARNING]  
> The Mycelium protocol and Mycelium.js are subject to change at anytime currently.

A javascript libary for the Mycelium protocol used by the Mycelium app.

Mycelium.js runs ontop of Meshcore and gives support for sending and reciving large messages and files

## Mycelium Protocol
### Packet Structure
| Field | Size | Description |
| ----- | ---- | ----------- |
| Magic | 2 (bytes) | Unique identifier for Mycelium. Always [0x4D, 0x50] aka. "MP" short for "Mycelium Packet" |
| Version | 1 (Byte) | The Mycelium Protocol Version. (Currently 0x00) |
| Destination | 1 (Byte) | Prefix of the intended recipient |
| Source | 1 (Byte) | Prefix of the sender |
| Session | 1 (Byte) | Unique per chunked transfer |
| Total Chunks | 1 (Byte) | Total number of chunks in the message |
| Chunk Index | 1 (Byte) | Index of current chunk |
| Payload Type | 1 (byte) | Payload type |
| Payload Length | 1 (byte) | Size of the payload |
| Payload | ... | The payload itself |

*10 byte overhead*

## Examples
### examples/myceliumDemo.js
Allows you to send large messages and files over meshcore and lora

## Todo
- [x] Keep compatibility with non Mycelium clients
- [x] Protocol header
- [ ] Meshcore based routing
- [ ] Encryption
- [x] Chained messages
- [x] Large messages
- [x] Files
- [ ] Voice messages with Codec2
- [ ] Message reply
- [ ] Message emoji reaction
- [ ] Message deletion
- [ ] Message edit
