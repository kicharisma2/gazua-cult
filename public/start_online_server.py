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
import atexit

GIST_ID = "8bd7ddc5c6df9538c8092e1f01c9b2fa"
GITHUB_SITE_URL = "https://kicharisma2.github.io/gazua-cult/"

def check_single_instance(port=8080):
    """이미 8080 포트를 점유 중인 서버가 있는지 확인 (중복 호스트 방지)"""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind(('127.0.0.1', port))
        s.close()
        return True
    except OSError:
        return False

def update_cloud_registry(status, host=""):
    """GitHub Gist 레지스트리에 현재 살아있는 호스트 주소를 1초 만에 자동 등록"""
    try:
        import json
        payload = json.dumps({
            "status": status,
            "host": host,
            "updated": int(time.time())
        })
        # 1. 로컬 host.json 파일에도 보관
        base_dir = get_base_dir()
        try:
            with open(os.path.join(base_dir, "host.json"), "w", encoding="utf-8") as f:
                f.write(payload)
        except Exception:
            pass

        # 2. GitHub Gist에 실시간 클라우드 등록 (shell=True 필수)
        p = subprocess.Popen(
            ["gh", "gist", "edit", GIST_ID, "-f", "host.json", "-"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=True
        )
        out, err = p.communicate(payload)
        if p.returncode == 0:
            return True
        else:
            print(f"[!] Gist 등록 경고: {err.strip()}", flush=True)
            return False
    except Exception as e:
        print(f"[!] 클라우드 자동 등록 알림: {e}", flush=True)
        return False

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

    print("=" * 70, flush=True)
    print(" † 대한예수교 떡상장로회 [가즈아교 온라인 대성전] 글로벌 호스트 가동 †", flush=True)
    print("=" * 70, flush=True)

    # 0. 중복 실행 방지 체크 (포트 8080 점유 검사)
    if not check_single_instance(8080):
        print(" [!] 가즈아교 글로벌 호스트 서버가 이미 실행 중입니다!", flush=True)
        print("     (중복 실행 방지: 한 대의 PC에서는 1개의 호스트만 가동됩니다.)", flush=True)
        print(f"     대성전 깃허브 웹사이트를 브라우저로 엽니다: {GITHUB_SITE_URL}", flush=True)
        print("=" * 70, flush=True)
        webbrowser.open(GITHUB_SITE_URL)
        time.sleep(2)
        return

    print(" [1/3] 로컬 대성전 통합 서버(포트 8080) 시작 중...", flush=True)

    # 1. 로컬 통합 서버(HTTP + WebSocket) 인프로세스 백그라운드 스레드 시작
    server_thread = server.start_server_in_background(8080)
    time.sleep(1.2)

    # 2. Cloudflare 터널 실행
    print(" [2/3] 전 세계 실시간 멀티플레이를 위한 보안 공인 터널 연결 중...", flush=True)
    cf_path = find_cloudflared()
    if not cf_path:
        print("[!] cloudflared.exe를 찾을 수 없습니다. 로컬 전용으로 실행합니다.", flush=True)
        webbrowser.open(GITHUB_SITE_URL)
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
    print(" [*] 공인 접속 주소 생성 중입니다. 잠시만 기다려주세요...", flush=True)

    while True:
        line = tunnel_proc.stderr.readline().decode('utf-8', errors='ignore')
        if not line and tunnel_proc.poll() is not None:
            break
        m = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
        if m:
            public_url = m.group(0)
            break

    if public_url:
        print(" [*] 깃허브 웹사이트에 현재 호스트 주소를 자동 등록 중...", flush=True)
        update_cloud_registry("online", public_url)

        local_ip = get_local_ip()
        local_url = f"http://{local_ip}:8080/index.html"

        url_file_path = os.path.join(base_dir, "ONLINE_URL.txt")
        try:
            with open(url_file_path, "w", encoding="utf-8") as f:
                f.write(f"🌟 대양봉교 영구 고정 웹사이트 주소:\n{GITHUB_SITE_URL}\n\n"
                        f"🌐 실시간 터널 호스트 주소(자동 연동됨):\n{public_url}\n\n"
                        f"🏠 같은 와이파이 내부 주소:\n{local_url}\n")
        except Exception:
            pass

        print("\n" + "=" * 70, flush=True)
        print("  🎉 가즈아교 글로벌 인터넷 라이브 성전이 완벽하게 가동되었습니다! 🎉", flush=True)
        print("=" * 70, flush=True)
        print(f" 🌐 [대양봉교 공식 웹사이트 링크 (영구 고정)]:", flush=True)
        print(f"     👉  {GITHUB_SITE_URL}", flush=True)
        print("=" * 70, flush=True)
        print(" 📢 [이용 안내 - 100% 완전 자동 연동!]", flush=True)
        print(" - 이제 어떤 주소도 복사하거나 입력하실 필요가 없습니다!", flush=True)
        print(f" - 본인도, 스마트폰에서도, 친구들에게도 위의 '고정 웹사이트 링크'만 주시면", flush=True)
        print("   웹페이지가 자동으로 지금 켜진 이 서버를 감지하여 1초 만에 연결됩니다!", flush=True)
        print(" - 이 검은 창을 켜두시는 동안 전 세계 실시간 멀티플레이가 유지됩니다.", flush=True)
        print(" - 종료하시려면 키보드의 Ctrl + C 또는 이 창을 닫아주세요.", flush=True)
        print("=" * 70 + "\n", flush=True)

        print(" [3/3] 브라우저에서 대성전 웹사이트를 자동으로 실행합니다...", flush=True)
        webbrowser.open(GITHUB_SITE_URL)
    else:
        print("[!] 공인 URL 발급에 지연이 발생했습니다. 깃허브 웹사이트를 엽니다.", flush=True)
        webbrowser.open(GITHUB_SITE_URL)

    try:
        tunnel_proc.wait()
    except KeyboardInterrupt:
        print("\n[*] 가즈아교 글로벌 서버를 안전하게 종료합니다. 아멘!", flush=True)
    finally:
        print(" [*] 클라우드 레지스트리를 오프라인 상태로 전환합니다...", flush=True)
        update_cloud_registry("offline", "")
        try:
            if tunnel_proc:
                tunnel_proc.terminate()
        except Exception:
            pass
        server.stop_server()

if __name__ == "__main__":
    main()
