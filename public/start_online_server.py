# ========================================================
# 가즈아교 (GAZUA CULT) 원클릭 글로벌 인터넷 멀티플레이 서버 런처
# 로컬 WebSocket/HTTP 서버(8080) + Cloudflare 공인 인터넷 터널 동시 가동
# ========================================================

import os
import sys
import subprocess
import time
import re
import webbrowser
import threading
import server

import socket

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def get_base_dir():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))

def find_cloudflared():
    base_dir = get_base_dir()
    # 1. 실행파일 디렉토리
    p1 = os.path.join(base_dir, "cloudflared.exe")
    if os.path.exists(p1):
        return p1
    # 2. _MEIPASS 내장 디렉토리
    if getattr(sys, 'frozen', False):
        p2 = os.path.join(getattr(sys, '_MEIPASS', ''), "cloudflared.exe")
        if os.path.exists(p2):
            return p2
    # 3. 현재 작업 경로
    p3 = os.path.join(os.getcwd(), "cloudflared.exe")
    if os.path.exists(p3):
        return p3
    return None

def main():
    base_dir = get_base_dir()
    os.chdir(base_dir)

    print("=" * 68, flush=True)
    print(" † 대한예수교 떡상장로회 [가즈아교 온라인 대성전] 글로벌 서버 가동 †", flush=True)
    print("=" * 68, flush=True)
    print(" [1/3] 로컬 대성전 통합 서버(포트 8080) 시작 중...", flush=True)

    # 1. 로컬 통합 서버(HTTP + WebSocket) 인프로세스 백그라운드 스레드 시작
    server_thread = server.start_server_in_background(8080)
    time.sleep(1.2)

    # 2. Cloudflare 터널 실행
    print(" [2/3] 전 세계 인터넷 실시간 공유를 위한 보안 공인 터널 연결 중...", flush=True)
    cf_path = find_cloudflared()
    if not cf_path:
        print("[!] cloudflared.exe를 찾을 수 없습니다. 로컬 전용(http://localhost:8080/index.html)으로 실행합니다.", flush=True)
        webbrowser.open("http://localhost:8080/index.html")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n서버를 종료합니다.", flush=True)
        return

    tunnel_proc = subprocess.Popen(
        [cf_path, "tunnel", "--url", "http://localhost:8080"],
        stderr=subprocess.PIPE,
        stdout=subprocess.PIPE
    )

    public_url = None
    print(" [*] 공인 접속 주소(Public HTTPS URL) 생성 중입니다. 잠시만 기다려주세요...", flush=True)

    while True:
        line = tunnel_proc.stderr.readline().decode('utf-8', errors='ignore')
        if not line and tunnel_proc.poll() is not None:
            break
        m = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
        if m:
            public_url = m.group(0)
            break

    local_ip = get_local_ip()
    local_url = f"http://{local_ip}:8080/index.html"
    localhost_url = "http://localhost:8080/index.html"

    if public_url:
        full_online_url = f"{public_url}/index.html"
        url_file_path = os.path.join(base_dir, "ONLINE_URL.txt")
        try:
            with open(url_file_path, "w", encoding="utf-8") as f:
                f.write(f"글로벌 인터넷 주소: {full_online_url}\n내부 와이파이 고정 주소: {local_url}\n내 컴퓨터 전용 주소: {localhost_url}\n")
        except Exception:
            pass

        print("\n" + "=" * 68, flush=True)
        print("  🎉 가즈아교 글로벌 인터넷 라이브 성전이 성공적으로 열렸습니다! 🎉", flush=True)
        print("=" * 68, flush=True)
        print(f" 🌐 [외부 인터넷 공유 링크 (전 세계 누구나 접속)]:", flush=True)
        print(f"     👉  {full_online_url}", flush=True)
        print("-" * 68, flush=True)
        print(f" 🏠 [내부 와이파이 고정 링크 (집/사무실 내 스마트폰/태블릿용)]:", flush=True)
        print(f"     👉  {local_url}", flush=True)
        print(f" 💻 [호스트 컴퓨터 전용 고정 링크]:", flush=True)
        print(f"     👉  {localhost_url}", flush=True)
        print("=" * 68, flush=True)
        print(" 📢 [이용 및 주소 안내]", flush=True)
        print(" 1. 외부 친구/지인에게 공유할 때는 '🌐 외부 인터넷 공유 링크'를 보내세요.", flush=True)
        print(" 2. 같은 와이파이의 내 스마트폰/태블릿에서는 '🏠 내부 와이파이 고정 링크'를", flush=True)
        print("    즐겨찾기해두시면 주소 변경 없이 언제든 바로 접속하실 수 있습니다.", flush=True)
        print(" 3. 365일 24시간 단 하나의 영구 고정 주소(무료)가 필요하신 경우", flush=True)
        print("    Render나 Railway 등 클라우드 호스팅을 이용하시면 단일 주소 유지가 가능합니다.", flush=True)
        print(" - 이 창을 켜두시는 동안 전 세계 실시간 서버가 유지됩니다.", flush=True)
        print(" - 종료하시려면 키보드의 Ctrl + C 또는 창을 닫아주세요.", flush=True)
        print("=" * 68 + "\n", flush=True)

        print(" [3/3] 기본 웹 브라우저에서 대성전을 자동으로 실행합니다...", flush=True)
        webbrowser.open(full_online_url)
    else:
        print("[!] 공인 URL 발급에 지연이 발생했습니다. 로컬 주소로 브라우저를 엽니다.", flush=True)
        webbrowser.open(localhost_url)

    try:
        tunnel_proc.wait()
    except KeyboardInterrupt:
        print("\n[*] 가즈아교 글로벌 서버를 안전하게 종료합니다. 아멘!", flush=True)
        tunnel_proc.terminate()
        server.stop_server()

if __name__ == "__main__":
    main()
