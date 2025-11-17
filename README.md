# Mycelium.js
> [!WARNING]  
> The Mycelium protocol and Mycelium.js can change at anytime.

A javascript libary for the Mycelium protocol used by the Mycelium app.

Mycelium.js runs ontop of Meshcore and gives support for sending and reciving large messages and files

## Mycelium Protocol
## Packet Header

| Field        | Size      | Description                                                                               |
| ------------ | --------- | ----------------------------------------------------------------------------------------- |
| Magic        | 2 (bytes) | Unique identifier for Mycelium. Always [0x4D, 0x50] aka. "MP" short for "Mycelium Packet" |
| Version      | 1 (Byte)  | The Mycelium Protocol Version. (Currently 0x00)                                           |
| Destination | 1 (Byte) | Prefix of the intended recipient |
| Source | 1 (Byte) | Prefix of the sender |
| Session      | 1 (Byte)  | Unique per chunk transfer                                                                 |
| Total Chunks | 1 (Byte)  | Total number of chunks in the message                                                     |
| Chunk Index  | 1 (Byte)  | Index of current chunk                                                                    |
| Payload Type | 1 (byte)  | Payload type                                                                              |
| Reserved     | 1 (byte)  | Reserved                                                                                  |
| Payload      | ...       | The payload                                                                               |

*10 bytes of overhead*


## Packet Payloads

### Signalling (0x00)
Used to request the next packet from a chunked transfer

| Feild | Side     | Description    |
| ----- | -------- | -------------- |
| Chunk | 1 (byte) | The next chunk |



### Message (0x01)
Unlike Meshcore txt messages Mycelium messages are unlimited in size.
Used in a Mycelium protocol only context.

| Feild   | Side | Description |
| ------- | ---- | ----------- |
| Message | ...  | The message |



### File (0x02)
File messages

| Feild           | Side     | Description                         |
| --------------- | -------- | ----------------------------------- |
| Filename Length | 1 (byte) | Length of the filename              |
| Filename        | ...      | The filename, limited to 255 bytes. |
| File Data       | ...      | The file itself                     |



### Voice (0x03)
Voice messages

| Feild      | Side     | Description    |
| ---------- | -------- | -------------- |
| Mode       | 1 (byte) | The codec mode |
| Voice Data | ...      | The Voice Data |

#### Codec Modes

| Enum | Name           |
| ---- | -------------- |
| 0x00 | Codec2 450 PWB |
| 0x01 | Codec2 450     |
| 0x02 | Codec2 700C    |
| 0x03 | Codec2 1200    |
| 0x04 | Codec2 1300    |
| 0x05 | Codec2 1400    |
| 0x06 | Codec2 1600    |
| 0x07 | Codec2 2400    |
| 0x08 | Codec2 3200    |



### Message Action (0x04)

| Feild             | Size      | Description                       |
| ----------------- | --------- | --------------------------------- |
| Sender            | 1 (byte)  | Public key prefix of the sender   |
| Message Hash      | 2 (bytes) | Hash of the sender's message      |
| Message Timestamp | 8 (bytes) | Timestamp of the sender's message |
| Action            | 1 (byte)  | Action being preformed            |
| Action Payload    | ...       | The action's payload              |

#### Reply (0x00)
Links a message to another as a reply

| Feild           | Size      | Description            |
| --------------- | --------- | ---------------------- |
| Reply Hash      | 2 (bytes) | Hash of the reply      |
| Reply Timestamp | 8 (bytes) | Timestamp of the reply |

#### Reaction (0x01)
React to a message with an emoji

| Feild | Size | Description        |
| ----- | ---- | ------------------ |
| Emoji | ...  | The Reaction emoji |

#### Edit (0x02)
Edit the content of your message

| Feild | Size | Description  |
| ----- | ---- | ------------ |
| Edit  | ...  | The new edit |

#### Delete (0x03)
Edit the content of your message

| Feild | Size | Description |
| ----- | ---- | ----------- |
| n/a   | n/a  | n/a         |

#### Read (0x04)
Read receipt

| Feild | Size | Description |
| ----- | ---- | ----------- |
| n/a   | n/a  | n/a         |



## Examples
### examples/myceliumDemo.js
Allows you to send large messages and files over meshcore and lora

## Todo
- [x] Maintain compatibility with non Mycelium clients
- [x] Protocol header
- [x] Message addressing
- [ ] Encryption
- [x] Chained messages
- [x] Large messages
- [x] Files
- [ ] Voice messages
- [ ] Message reply
- [ ] Message reaction
- [ ] Message deletion
- [ ] Message edit
- [ ] Message read receipt
- [ ] User info (Profile picture, Status, About Me)
