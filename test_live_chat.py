import socket
import base64
import json
import struct
import time

def ws_connect(port=8080):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect(('127.0.0.1', port))
    key = base64.b64encode(b"test1234567890ab").decode()
    req = (
        f"GET /ws HTTP/1.1\r\n"
        f"Host: 127.0.0.1:{port}\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n\r\n"
    )
    s.sendall(req.encode())
    resp = s.recv(4096)
    if b"101 Switching Protocols" not in resp:
        raise Exception("WS handshake failed")
    s.settimeout(3.0)
    return s

def ws_send(s, text):
    payload = text.encode('utf-8')
    frame = bytearray([0x81])
    mask = b'\x12\x34\x56\x78'
    length = len(payload)
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
    s.sendall(bytes(frame))

def ws_recv_one(s, timeout=3.0):
    s.settimeout(timeout)
    try:
        hdr = s.recv(2)
        if not hdr: return None
        plen = hdr[1] & 0x7f
        if plen == 126:
            plen = struct.unpack("!H", s.recv(2))[0]
        elif plen == 127:
            plen = struct.unpack("!Q", s.recv(8))[0]
        data = bytearray()
        while len(data) < plen:
            chunk = s.recv(plen - len(data))
            if not chunk: break
            data.extend(chunk)
        return json.loads(data.decode('utf-8', errors='ignore'))
    except Exception as e:
        return None

def run_test():
    print("--- 1. Client A Connect & Join ---")
    cA = ws_connect()
    ws_send(cA, json.dumps({
        'type': 'join',
        'room': 'KRW-BTC',
        'name': '신도A',
        'level': 1,
        'title': '초신자',
        'robe': 'white',
        'hat': 'halo',
        'wings': 'angel',
        'belt': 'long',
        'x': 0, 'y': 0, 'z': 2
    }))
    wA = ws_recv_one(cA)
    print("cA welcome id:", wA.get('id'), "peers:", len(wA.get('peers', [])))

    print("--- 2. Client B Connect & Join ---")
    cB = ws_connect()
    ws_send(cB, json.dumps({
        'type': 'join',
        'room': 'KRW-BTC',
        'name': '신도B',
        'level': 2,
        'title': '기도자',
        'robe': 'gold',
        'hat': 'horns',
        'wings': 'devil',
        'belt': 'short',
        'x': 1, 'y': 0, 'z': 2
    }))
    wB = ws_recv_one(cB)
    print("cB welcome id:", wB.get('id'), "peers:", len(wB.get('peers', [])))

    # cA should receive peer_join for B
    join_b = ws_recv_one(cA)
    print("cA got peer_join:", join_b.get('type'), join_b.get('peer', {}).get('name'))

    print("\n--- 3. Client A sends TESTIMONY (대화 전송 테스트) ---")
    ws_send(cA, json.dumps({
        'type': 'testimony',
        'room': 'KRW-BTC',
        'name': '신도A',
        'belt': 'long',
        'text': '안녕하세요 가즈아 아멘!'
    }))

    # Client B should receive peer_testimony!
    msg_b = ws_recv_one(cB)
    print("Client B received testimony:", msg_b)
    assert msg_b is not None, "Client B received nothing!"
    assert msg_b.get('type') == 'peer_testimony', f"Expected peer_testimony, got {msg_b}"
    assert msg_b.get('text') == '안녕하세요 가즈아 아멘!', f"Text mismatch: {msg_b}"
    print(">>> SUCCESS: Client B received Client A's testimony! <<<")

    print("\n--- 4. Client B replies TESTIMONY (상호 대화 테스트) ---")
    ws_send(cB, json.dumps({
        'type': 'testimony',
        'room': 'KRW-BTC',
        'name': '신도B',
        'belt': 'short',
        'text': '반갑습니다! 떡상 가즈아!'
    }))

    msg_a = ws_recv_one(cA)
    print("Client A received testimony from B:", msg_a)
    assert msg_a is not None, "Client A received nothing!"
    assert msg_a.get('type') == 'peer_testimony', f"Expected peer_testimony, got {msg_a}"
    assert msg_a.get('text') == '반갑습니다! 떡상 가즈아!', f"Text mismatch: {msg_a}"
    print(">>> SUCCESS: Client A received Client B's reply! <<<")

    print("\n--- 5. Client A sends UPDATE_LOOK (복장 변경 테스트) ---")
    ws_send(cA, json.dumps({
        'type': 'update_look',
        'room': 'KRW-BTC',
        'name': '[Lv.5 떡상자] 신도A',
        'robe': 'crimson',
        'hat': 'crown',
        'wings': 'mecha',
        'belt': 'short'
    }))

    look_b = ws_recv_one(cB)
    print("Client B received update_look:", look_b)
    assert look_b is not None, "Client B received nothing for look update!"
    assert look_b.get('type') == 'peer_update_look', f"Expected peer_update_look, got {look_b}"
    assert look_b.get('robe') == 'crimson', f"Robe mismatch: {look_b}"
    assert look_b.get('hat') == 'crown', f"Hat mismatch: {look_b}"
    print(">>> SUCCESS: Client B received Client A's look update! <<<")

    cA.close()
    cB.close()
    print("\n🎉 ALL MULTIPLAYER CHAT & LOOK TESTS PASSED 100%! 🎉")

if __name__ == '__main__':
    run_test()
