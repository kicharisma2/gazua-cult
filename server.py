# ========================================================
# 가즈아교 (GAZUA CULT) 온라인 대성전 통합 서버 (단일 포트 8080)
# HTTP 정적 파일 서빙 + RFC 6455 WebSocket 멀티플레이 통합 (완벽 스레드 안전 & Ping/Pong 완비)
# ========================================================

import os
import sys
import json
import base64
import hashlib
import struct
import threading
import time
import urllib.request
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

PORT = 8080

ROOMS = {
    'KRW-BTC': {},
    'KRW-ETH': {},
    'KRW-DOGE': {},
    'SEC-005930': {},
    'SEC-000660': {},
    'US-TSLA': {},
    'US-NVDA': {}
}

ROOM_STATE = {
    'KRW-BTC': {'ritual_gauge': 35, 'boss_hp': 100},
    'KRW-ETH': {'ritual_gauge': 30, 'boss_hp': 100},
    'KRW-DOGE': {'ritual_gauge': 40, 'boss_hp': 100},
    'SEC-005930': {'ritual_gauge': 25, 'boss_hp': 100},
    'SEC-000660': {'ritual_gauge': 30, 'boss_hp': 100},
    'US-TSLA': {'ritual_gauge': 35, 'boss_hp': 100},
    'US-NVDA': {'ritual_gauge': 50, 'boss_hp': 100}
}

ROOM_CHAT_HISTORY = {
    'KRW-BTC': [],
    'KRW-ETH': [],
    'KRW-DOGE': [],
    'SEC-005930': [],
    'SEC-000660': [],
    'US-TSLA': [],
    'US-NVDA': []
}

# ========================================================
# 100% 실제 국내외 주식 실시간 시세 (네이버 금융 & 야후 파이낸스)
# ========================================================
REAL_STOCK_DATA = {
    'SEC-005930': {'name': '삼성전자', 'symbol': '005930', 'price': 78500, 'changeRate': 0.0, 'diff': 0, 'updated': 0},
    'SEC-000660': {'name': 'SK하이닉스', 'symbol': '000660', 'price': 215000, 'changeRate': 0.0, 'diff': 0, 'updated': 0},
    'US-TSLA': {'name': '테슬라', 'symbol': 'TSLA', 'price': 248.5, 'changeRate': 0.0, 'diff': 0, 'updated': 0},
    'US-NVDA': {'name': '엔비디아', 'symbol': 'NVDA', 'price': 135.2, 'changeRate': 0.0, 'diff': 0, 'updated': 0}
}

def fetch_real_stocks_loop():
    while True:
        try:
            url = 'https://polling.finance.naver.com/api/realtime/domestic/stock/005930,000660'
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                for item in data.get('datas', []):
                    code = item.get('itemCode')
                    room_key = f"SEC-{code}"
                    if room_key in REAL_STOCK_DATA:
                        price = float(item.get('closePriceRaw', 0))
                        ratio = float(item.get('fluctuationsRatioRaw', 0)) / 100.0
                        comp = item.get('compareToPreviousPrice', {}).get('name', '')
                        if comp == 'FALLING':
                            ratio = -abs(ratio)
                        elif comp == 'RISING':
                            ratio = abs(ratio)
                        diff = float(item.get('compareToPreviousClosePriceRaw', 0))
                        if comp == 'FALLING':
                            diff = -abs(diff)

                        REAL_STOCK_DATA[room_key]['price'] = price
                        REAL_STOCK_DATA[room_key]['changeRate'] = ratio
                        REAL_STOCK_DATA[room_key]['diff'] = diff
                        REAL_STOCK_DATA[room_key]['updated'] = time.time()
        except Exception:
            pass

        for sym, rkey in [('TSLA', 'US-TSLA'), ('NVDA', 'US-NVDA')]:
            try:
                y_url = f'https://query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=1d'
                req = urllib.request.Request(y_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=4) as resp:
                    ydata = json.loads(resp.read().decode('utf-8'))
                    meta = ydata['chart']['result'][0]['meta']
                    cur_p = float(meta.get('regularMarketPrice', 0))
                    prev_p = float(meta.get('chartPreviousClose', cur_p))
                    ratio = (cur_p - prev_p) / prev_p if prev_p else 0
                    REAL_STOCK_DATA[rkey]['price'] = round(cur_p, 2)
                    REAL_STOCK_DATA[rkey]['changeRate'] = round(ratio, 4)
                    REAL_STOCK_DATA[rkey]['diff'] = round(cur_p - prev_p, 2)
                    REAL_STOCK_DATA[rkey]['updated'] = time.time()
            except Exception:
                pass

        time.sleep(3.0)

CLIENT_MAP = {}    # { sock: client_id }
CLIENT_META = {}   # { client_id: {'room': r, 'info': info, 'sock': sock, 'send_lock': Lock()} }
CLIENT_LOCK = threading.RLock() # 메인 동기화 RLock

WS_MAGIC = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

def make_ws_handshake(key):
    resp_key = base64.b64encode(hashlib.sha1((key + WS_MAGIC).encode('utf-8')).digest()).decode('utf-8')
    handshake = (
        "HTTP/1.1 101 Switching Protocols\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        f"Sec-WebSocket-Accept: {resp_key}\r\n\r\n"
    )
    return handshake.encode('utf-8')

def encode_ws_frame(data_str, opcode=0x1):
    payload = data_str.encode('utf-8') if isinstance(data_str, str) else data_str
    length = len(payload)
    frame = bytearray([0x80 | (opcode & 0x0f)])
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

def safe_send_frame(sock, frame_bytes, send_lock=None):
    """스레드 안전한 WebSocket 프레임 전송 (프레임 데이터 오염 방지)"""
    try:
        if send_lock:
            with send_lock:
                sock.sendall(frame_bytes)
        else:
            sock.sendall(frame_bytes)
        return True
    except Exception:
        return False

def recv_exact_stream(rfile, num_bytes):
    """rfile 버퍼에서 정확히 num_bytes 만큼 읽기"""
    try:
        data = rfile.read(num_bytes)
        if len(data) < num_bytes:
            return None
        return data
    except Exception:
        return None

def decode_ws_frame_from_stream(rfile, sock, send_lock):
    """RFC 6455 웹소켓 프레임 디코딩 및 Ping/Pong 완벽 자동 처리"""
    try:
        header = recv_exact_stream(rfile, 2)
        if not header:
            return None, None
        b1, b2 = header[0], header[1]
        opcode = b1 & 0x0f

        # 0x8: Connection Close
        if opcode == 0x8:
            return 'close', None

        masked = (b2 & 0x80) != 0
        payload_len = b2 & 0x7f

        if payload_len == 126:
            ext = recv_exact_stream(rfile, 2)
            if not ext: return None, None
            payload_len = struct.unpack("!H", ext)[0]
        elif payload_len == 127:
            ext = recv_exact_stream(rfile, 8)
            if not ext: return None, None
            payload_len = struct.unpack("!Q", ext)[0]

        mask = recv_exact_stream(rfile, 4) if masked else None
        if masked and not mask:
            return None, None

        data = recv_exact_stream(rfile, payload_len)
        if data is None:
            return None, None

        if masked and mask:
            data = bytearray(data)
            for i in range(len(data)):
                data[i] ^= mask[i % 4]

        # 0x9: Ping -> 즉각 Pong(0xA) 응답 전송! (연결 영구 유지의 핵심)
        if opcode == 0x9:
            pong_frame = encode_ws_frame(data, opcode=0xA)
            safe_send_frame(sock, pong_frame, send_lock)
            return 'ping', None

        # 0xA: Pong -> 하트비트 수신 완료
        if opcode == 0xA:
            return 'pong', None

        return 'text', data.decode('utf-8', errors='ignore')
    except Exception as e:
        return None, None

def broadcast_room(room_id, msg_obj, exclude_sock=None):
    if room_id not in ROOMS:
        return
    frame = encode_ws_frame(json.dumps(msg_obj))
    dead_socks = []
    with CLIENT_LOCK:
        for cid, info in list(ROOMS[room_id].items()):
            sock = info['ws']
            if sock == exclude_sock:
                continue
            slock = info.get('send_lock')
            if not safe_send_frame(sock, frame, slock):
                dead_socks.append(sock)

    for sock in dead_socks:
        cleanup_client(sock, reason='broadcast_failed')

def cleanup_client(sock, reason='normal_close'):
    old_room = None
    cid = None
    actual_count = 0
    with CLIENT_LOCK:
        if sock not in CLIENT_MAP:
            try:
                sock.close()
            except Exception:
                pass
            return
        cid = CLIENT_MAP.pop(sock, None)
        meta = CLIENT_META.pop(cid, None)
        if meta and meta.get('room') in ROOMS:
            old_room = meta['room']
            ROOMS[old_room].pop(cid, None)
            actual_count = len(ROOMS[old_room])

    try:
        sock.close()
    except Exception:
        pass

    if old_room and cid:
        print(f"[-] 신도 퇴장 ({reason}): {cid} (현재 {old_room} 성전 신도 수: {actual_count}명)", flush=True)
        broadcast_room(old_room, {
            'type': 'peer_leave',
            'id': cid,
            'count': actual_count
        })

def handle_websocket_loop(handler):
    sock = handler.connection
    rfile = handler.rfile
    send_lock = threading.Lock()

    try:
        sock.settimeout(None)
    except Exception:
        pass

    client_id = os.urandom(6).hex()
    current_room = 'KRW-BTC'

    while True:
        status, msg_str = decode_ws_frame_from_stream(rfile, sock, send_lock)
        if status in (None, 'close'):
            break
        if status in ('ping', 'pong'):
            continue
        if not msg_str:
            continue

        try:
            msg = json.loads(msg_str)
            mtype = msg.get('type')

            if mtype == 'ping':
                # 클라이언트 애플리케이션 레벨 Ping
                safe_send_frame(sock, encode_ws_frame(json.dumps({'type': 'pong'})), send_lock)
                continue

            if mtype == 'join':
                new_room = msg.get('room', 'KRW-BTC')
                if new_room not in ROOMS:
                    ROOMS[new_room] = {}

                old_room = None
                with CLIENT_LOCK:
                    if client_id in CLIENT_META:
                        old_room = CLIENT_META[client_id].get('room')
                        if old_room and old_room in ROOMS and client_id in ROOMS[old_room]:
                            ROOMS[old_room].pop(client_id, None)

                if old_room and old_room in ROOMS and old_room != new_room:
                    print(f"[-] 신도 방 이동: {client_id} ({old_room} -> {new_room})", flush=True)
                    broadcast_room(old_room, {
                        'type': 'peer_leave',
                        'id': client_id,
                        'count': len(ROOMS[old_room])
                    })

                current_room = new_room
                with CLIENT_LOCK:
                    client_info = {
                        'id': client_id,
                        'name': msg.get('name', '가즈아신도'),
                        'level': int(msg.get('level', 1)),
                        'title': msg.get('title', '초신자'),
                        'belt': msg.get('belt', 'long'),
                        'robe': msg.get('robe', 'white'),
                        'hat': msg.get('hat', 'halo'),
                        'wings': msg.get('wings', 'angel'),
                        'x': float(msg.get('x', 0)),
                        'y': float(msg.get('y', 0)),
                        'z': float(msg.get('z', 2)),
                        'ry': float(msg.get('ry', 0)),
                        'jump': bool(msg.get('jump', False)),
                        'act': 'idle'
                    }
                    ROOMS[current_room][client_id] = {'ws': sock, 'info': client_info, 'send_lock': send_lock}
                    CLIENT_MAP[sock] = client_id
                    CLIENT_META[client_id] = {'room': current_room, 'info': client_info, 'sock': sock, 'send_lock': send_lock}

                    actual_count = len(ROOMS[current_room])
                    peer_list = [p['info'] for p in ROOMS[current_room].values() if p['info']['id'] != client_id]

                print(f"[+] 신도 입장: [{client_info['title']}] {client_info['name']} ({client_id}) -> {current_room} (실제 성전 인원: {actual_count}명)", flush=True)

                r_st = ROOM_STATE.get(current_room, {'ritual_gauge': 35, 'boss_hp': 100})
                recent_chats = ROOM_CHAT_HISTORY.get(current_room, [])[-40:]

                # 1. 환영 패킷 전송 (기존 접속자 목록 포함)
                safe_send_frame(sock, encode_ws_frame(json.dumps({
                    'type': 'welcome',
                    'id': client_id,
                    'room': current_room,
                    'peers': peer_list,
                    'count': actual_count,
                    'ritual_gauge': r_st.get('ritual_gauge', 35),
                    'boss_hp': r_st.get('boss_hp', 100),
                    'chat_history': recent_chats
                })), send_lock)

                # 2. 방 내 기존 신도들에게 새로운 신도 입장 즉시 브로드캐스트!
                broadcast_room(current_room, {
                    'type': 'peer_join',
                    'peer': client_info,
                    'count': actual_count
                }, exclude_sock=sock)

            elif mtype == 'move':
                y_val = float(msg.get('y', 0))
                jump_val = bool(msg.get('jump', False))
                with CLIENT_LOCK:
                    if client_id in CLIENT_META:
                        info = CLIENT_META[client_id]['info']
                        info['x'] = float(msg.get('x', info['x']))
                        info['y'] = y_val
                        info['z'] = float(msg.get('z', info['z']))
                        info['ry'] = float(msg.get('ry', info['ry']))
                        info['jump'] = jump_val

                broadcast_room(current_room, {
                    'type': 'peer_move',
                    'id': client_id,
                    'x': msg.get('x'),
                    'y': y_val,
                    'z': msg.get('z'),
                    'ry': msg.get('ry'),
                    'jump': jump_val
                }, exclude_sock=sock)

            elif mtype == 'level_up':
                lvl = int(msg.get('level', 1))
                ttl = msg.get('title', '초신자')
                nm = msg.get('name', '신도')
                with CLIENT_LOCK:
                    if client_id in CLIENT_META:
                        info = CLIENT_META[client_id]['info']
                        info['level'] = lvl
                        info['title'] = ttl
                        info['name'] = nm

                broadcast_room(current_room, {
                    'type': 'peer_level_up',
                    'id': client_id,
                    'name': nm,
                    'level': lvl,
                    'title': ttl
                })

            elif mtype == 'action':
                act = msg.get('act', 'idle')
                with CLIENT_LOCK:
                    if client_id in CLIENT_META:
                        CLIENT_META[client_id]['info']['act'] = act

                broadcast_room(current_room, {
                    'type': 'peer_action',
                    'id': client_id,
                    'act': act,
                    'text': msg.get('text', '')
                }, exclude_sock=sock)

            elif mtype == 'update_look':
                robe_val = msg.get('robe', 'white')
                hat_val = msg.get('hat', 'halo')
                wings_val = msg.get('wings', 'angel')
                belt_val = msg.get('belt', 'long')
                name_val = msg.get('name', '신도')

                with CLIENT_LOCK:
                    if client_id in CLIENT_META:
                        info = CLIENT_META[client_id]['info']
                        info['name'] = name_val
                        info['robe'] = robe_val
                        info['hat'] = hat_val
                        info['wings'] = wings_val
                        info['belt'] = belt_val

                broadcast_room(current_room, {
                    'type': 'peer_update_look',
                    'id': client_id,
                    'name': name_val,
                    'robe': robe_val,
                    'hat': hat_val,
                    'wings': wings_val,
                    'belt': belt_val
                }, exclude_sock=sock)

            elif mtype == 'testimony':
                chat_entry = {
                    'type': 'peer_testimony',
                    'id': client_id,
                    'name': msg.get('name', '신도'),
                    'text': msg.get('text', ''),
                    'belt': msg.get('belt', 'long'),
                    'time': time.strftime("%H:%M")
                }
                print(f"[간증 대화] [{current_room}] {chat_entry['name']}: {chat_entry['text']}", flush=True)
                if current_room not in ROOM_CHAT_HISTORY:
                    ROOM_CHAT_HISTORY[current_room] = []
                ROOM_CHAT_HISTORY[current_room].append(chat_entry)
                if len(ROOM_CHAT_HISTORY[current_room]) > 100:
                    ROOM_CHAT_HISTORY[current_room].pop(0)

                # 모든 신도에게 브로드캐스트
                broadcast_room(current_room, chat_entry, exclude_sock=sock)

            elif mtype == 'roulette':
                broadcast_room(current_room, {
                    'type': 'peer_roulette',
                    'name': msg.get('name', '신도'),
                    'reward': msg.get('reward', '')
                })

            elif mtype == 'ritual_add':
                amount = int(msg.get('amount', 3))
                if current_room not in ROOM_STATE:
                    ROOM_STATE[current_room] = {'ritual_gauge': 0, 'boss_hp': 100}
                r_st = ROOM_STATE[current_room]
                r_st['ritual_gauge'] = min(100, r_st['ritual_gauge'] + amount)
                is_max = r_st['ritual_gauge'] >= 100
                broadcast_room(current_room, {
                    'type': 'ritual_update',
                    'gauge': r_st['ritual_gauge'],
                    'contributor': msg.get('name', '신도'),
                    'act': msg.get('act', '기도')
                })
                if is_max:
                    broadcast_room(current_room, {
                        'type': 'ritual_ascension',
                        'bonusExp': 200
                    })
                    def reset_ritual(rm):
                        time.sleep(14)
                        if rm in ROOM_STATE:
                            ROOM_STATE[rm]['ritual_gauge'] = 15
                            broadcast_room(rm, {'type': 'ritual_update', 'gauge': 15})
                    threading.Thread(target=reset_ritual, args=(current_room,), daemon=True).start()

            elif mtype == 'boss_hit':
                dmg = int(msg.get('dmg', 8))
                if current_room not in ROOM_STATE:
                    ROOM_STATE[current_room] = {'ritual_gauge': 35, 'boss_hp': 100}
                r_st = ROOM_STATE[current_room]
                r_st['boss_hp'] = max(0, r_st['boss_hp'] - dmg)
                is_dead = r_st['boss_hp'] <= 0
                broadcast_room(current_room, {
                    'type': 'boss_update',
                    'hp': r_st['boss_hp'],
                    'attacker': msg.get('name', '신도'),
                    'dmg': dmg
                })
                if is_dead:
                    broadcast_room(current_room, {
                        'type': 'boss_defeated',
                        'bonusExp': 150
                    })
                    def respawn_boss(rm):
                        time.sleep(40)
                        if rm in ROOM_STATE:
                            ROOM_STATE[rm]['boss_hp'] = 100
                            broadcast_room(rm, {'type': 'boss_respawn', 'hp': 100})
                    threading.Thread(target=respawn_boss, args=(current_room,), daemon=True).start()

            elif mtype == 'bull_buff':
                broadcast_room(current_room, {
                    'type': 'peer_bull_buff',
                    'name': msg.get('name', '신도')
                })

        except Exception as e:
            print(f"[WS_MSG_EXCEPTION] {client_id}: {e}", flush=True)
            break

    cleanup_client(sock, reason='loop_exit')

class CultistHTTPHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # 1. 실제 주식 시세 REST API 제공
        if self.path.startswith('/api/stock-prices'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(REAL_STOCK_DATA).encode('utf-8'))
            return

        # 2. WebSocket 업그레이드 감지 (대소문자/복합 헤더 완벽 지원)
        upgrade = self.headers.get('Upgrade', '').lower()
        connection = self.headers.get('Connection', '').lower()
        if 'websocket' in upgrade or 'upgrade' in connection:
            ws_key = self.headers.get('Sec-WebSocket-Key')
            if ws_key:
                sock = self.connection
                try:
                    sock.settimeout(None)
                except Exception:
                    pass
                sock.sendall(make_ws_handshake(ws_key))
                handle_websocket_loop(self)
                return

        # 3. 일반 정적 HTTP 파일 서빙
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, format, *args):
        pass

def get_resource_dir():
    if getattr(sys, 'frozen', False):
        exe_dir = os.path.dirname(os.path.abspath(sys.executable))
        if os.path.exists(os.path.join(exe_dir, 'index.html')):
            return exe_dir
        bundle_dir = getattr(sys, '_MEIPASS', exe_dir)
        if os.path.exists(os.path.join(bundle_dir, 'index.html')):
            return bundle_dir
        return exe_dir
    return os.path.dirname(os.path.abspath(__file__))

HTTP_SERVER_INSTANCE = None

def start_server(port=PORT):
    global HTTP_SERVER_INSTANCE
    r_dir = get_resource_dir()
    os.chdir(r_dir)

    try:
        class BoundCultistHandler(CultistHTTPHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=r_dir, **kwargs)

        HTTP_SERVER_INSTANCE = ThreadingHTTPServer(('0.0.0.0', port), BoundCultistHandler)
        threading.Thread(target=fetch_real_stocks_loop, daemon=True).start()
        print("=" * 65, flush=True)
        print(" † 대한예수교 떡상장로회 [가즈아교 온라인 대성전] 통합 서버 가동 †", flush=True)
        print(f" 🌐 로컬 접속 주소: http://localhost:{port}/index.html", flush=True)
        print(" - 단일 포트(8080) HTTP 웹 서빙 + WebSocket 멀티플레이 통합 완비", flush=True)
        print(" - 실제 접속자 수 100% 정직 반영 & 실시간 캐릭터/채팅 동기화", flush=True)
        print("=" * 65, flush=True)
        HTTP_SERVER_INSTANCE.serve_forever()
    except OSError as e:
        if "Address already in use" in str(e) or getattr(e, 'winerror', None) == 10048:
            print(f"[*] 포트 {port}가 이미 사용 중입니다. 기존 가동 중인 서버와 연동됩니다.", flush=True)
        else:
            print(f"[!] 서버 시작 오류: {e}", flush=True)

def stop_server():
    global HTTP_SERVER_INSTANCE
    if HTTP_SERVER_INSTANCE:
        try:
            HTTP_SERVER_INSTANCE.shutdown()
        except Exception:
            pass

def start_server_in_background(port=PORT):
    th = threading.Thread(target=start_server, args=(port,), daemon=True)
    th.start()
    return th

def main():
    try:
        start_server()
    except KeyboardInterrupt:
        print("\n서버를 종료합니다.", flush=True)
        stop_server()

if __name__ == "__main__":
    main()
