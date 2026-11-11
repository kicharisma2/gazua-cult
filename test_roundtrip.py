import traceback

def test_roundtrip():
    import struct
    # Server encode
    def encode_ws_frame(data_str):
        payload = data_str.encode('utf-8')
        length = len(payload)
        frame = bytearray([0x81])
        if length <= 125:
            frame.append(length)
        elif length <= 65535:
            frame.append(126)
            frame.extend(struct.pack("!H", length))
        else:
            frame.append(127)
            frame.extend(struct.pack("!Q", length))
        frame.extend(payload)
        return bytes(frame)

    # Client encode (with mask)
    def client_encode(data_str):
        payload = data_str.encode('utf-8')
        length = len(payload)
        frame = bytearray([0x81])
        mask = b'\x11\x22\x33\x44'
        if length <= 125:
            frame.append(0x80 | length)
        elif length <= 65535:
            frame.append(0x80 | 126)
            frame.extend(struct.pack("!H", length))
        else:
            frame.append(0x80 | 127)
            frame.extend(struct.pack("!Q", length))
        frame.extend(mask)
        masked = bytearray(payload)
        for i in range(len(masked)):
            masked[i] ^= mask[i % 4]
        frame.extend(masked)
        return bytes(frame)

    # Server decode
    def server_decode(raw_bytes):
        idx = 0
        def recv(n):
            nonlocal idx
            res = raw_bytes[idx:idx+n]
            idx += len(res)
            return res if len(res) == n else None
        
        hdr = recv(2)
        b1, b2 = hdr[0], hdr[1]
        masked = (b2 & 0x80) != 0
        plen = b2 & 0x7f
        if plen == 126:
            plen = struct.unpack("!H", recv(2))[0]
        elif plen == 127:
            plen = struct.unpack("!Q", recv(8))[0]
        mask = recv(4) if masked else None
        data = recv(plen)
        if masked:
            data = bytearray(data)
            for i in range(len(data)):
                data[i] ^= mask[i % 4]
        return data.decode('utf-8')

    test_str = "안녕하세요 가즈아!"
    enc = client_encode(test_str)
    dec = server_decode(enc)
    print("Decoded:", dec)
    assert dec == test_str

test_roundtrip()
print("Roundtrip OK")

