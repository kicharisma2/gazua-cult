# ========================================================
# 가즈아교 (GAZUA CULT) 원클릭 글로벌 인터넷 멀티플레이 서버 런처
# 로컬 WebSocket/HTTP 서버(8080) + Cloudflare 공인 인터넷 터널
# + 독립 GUI 데스크톱 전용 창(Edge Chromium WebView2) 원클릭 구동
# ========================================================

import os
import sys
import subprocess
import time
import re
import socket
import atexit
import threading
import json
import urllib.request

import server

GIST_ID = "8bd7ddc5c6df9538c8092e1f01c9b2fa"
GITHUB_SITE_URL = "https://kicharisma2.github.io/gazua-cult/"

def get_github_token():
    tok = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if tok:
        return tok.strip()
    try:
        p = subprocess.Popen(["gh", "auth", "token"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, shell=True)
        out, _ = p.communicate(timeout=3)
        if p.returncode == 0 and out.strip():
            return out.strip()
    except Exception:
        pass
    return None

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
    """GitHub Gist 레지스트리에 현재 호스트 주소를 실시간 자동 등록 (API 직접 호출 + gh CLI 이중 백업)"""
    payload = json.dumps({
        "status": status,
        "host": host,
        "updated": int(time.time())
    })

    # 1. 로컬 host.json 파일 보관
    try:
        base_dir = get_base_dir()
        with open(os.path.join(base_dir, "host.json"), "w", encoding="utf-8") as f:
            f.write(payload)
    except Exception:
        pass

    # 2. GitHub REST API 직접 호출
    token = get_github_token()
    if token:
        try:
            url = f"https://api.github.com/gists/{GIST_ID}"
            req_data = json.dumps({"files": {"host.json": {"content": payload}}}).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "Gazua-Cult"
                },
                method="PATCH"
            )
            with urllib.request.urlopen(req, timeout=5) as res:
                if res.status in (200, 201):
                    return True
        except Exception:
            pass

    # 3. 폴백: gh CLI 호출
    try:
        p = subprocess.Popen(
            ["gh", "gist", "edit", GIST_ID, "-f", "host.json", "-"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=True
        )
        out, err = p.communicate(payload, timeout=5)
        if p.returncode == 0:
            return True
    except Exception:
        pass

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
    """모든 잠재적 위치에서 cloudflared.exe를 절대 실패 없이 탐색"""
    candidates = []

    # 1. PyInstaller _MEIPASS 임시 폴더
    if getattr(sys, 'frozen', False):
        p_mei = os.path.join(getattr(sys, '_MEIPASS', ''), "cloudflared.exe")
        candidates.append(p_mei)

    # 2. 실행파일 디렉토리
    base_dir = get_base_dir()
    candidates.append(os.path.join(base_dir, "cloudflared.exe"))

    # 3. 부모 디렉토리 (dist/ 내부 실행 시 프로젝트 루트)
    candidates.append(os.path.join(os.path.dirname(base_dir), "cloudflared.exe"))

    # 4. dist 디렉토리
    candidates.append(os.path.join(base_dir, "dist", "cloudflared.exe"))

    # 5. 현재 작업 디렉토리
    candidates.append(os.path.join(os.getcwd(), "cloudflared.exe"))

    # 6. 고정 프로젝트 절대 경로
    candidates.append(r"C:\Users\Mini PC\Desktop\프로그램\가자교\cloudflared.exe")
    candidates.append(r"C:\Users\Mini PC\Desktop\프로그램\가자교\dist\cloudflared.exe")

    # 7. 시스템 PATH
    import shutil
    p_which = shutil.which("cloudflared")
    if p_which:
        candidates.append(p_which)

    for p in candidates:
        if p and os.path.exists(p):
            return os.path.abspath(p)

    # 8. 인터넷에서 자동 다운로드 (절대 실패 방지)
    try:
        print("[!] 로컬에 cloudflared.exe가 없어 초고속 자동 다운로드를 진행합니다...", flush=True)
        download_target = os.path.join(base_dir, "cloudflared.exe")
        cf_url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
        urllib.request.urlretrieve(cf_url, download_target)
        if os.path.exists(download_target):
            print("[+] cloudflared.exe 자동 다운로드 완료!", flush=True)
            return download_target
    except Exception as eDl:
        print(f"[!] cloudflared 자동 다운로드 실패: {eDl}", flush=True)

    return None

def launch_host_desktop_window(target_url):
    """웹 브라우저 탭 대신 독립 GUI 게임 전용 윈도우 창으로 구동"""
    try:
        import webview
        print(" [4/4] 전용 데스크톱 GUI 게임 창을 실행합니다...", flush=True)
        window = webview.create_window(
            title="† 대한예수교 떡상장로회 [가즈아교 3D 온라인 대성전] (호스트 본당) †",
            url=target_url,
            width=1280,
            height=820,
            min_size=(960, 600),
            resizable=True,
            text_select=False,
            zoomable=True
        )
        webview.start(gui='edgechromium', debug=False)
        return True
    except Exception as e:
        print(f"[!] 독립 창 GUI 실행 실패 (기본 브라우저로 폴백): {e}", flush=True)
        import webbrowser
        webbrowser.open(target_url)
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass
        return False

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
        print(f"     대성전 전용 창 또는 웹사이트로 접속하세요: {GITHUB_SITE_URL}", flush=True)
        print("=" * 70, flush=True)
        launch_host_desktop_window("http://localhost:8080/index.html")
        return

    print(" [1/4] 로컬 대성전 통합 서버(포트 8080) 시작 중...", flush=True)
    server_thread = server.start_server_in_background(8080)
    time.sleep(1.0)

    # Cloudflare 터널 실행
    print(" [2/4] 전 세계 실시간 멀티플레이를 위한 보안 공인 터널 연결 중...", flush=True)
    cf_path = find_cloudflared()
    if not cf_path:
        print("[!] cloudflared.exe를 찾을 수 없습니다. 로컬 전용으로 실행합니다.", flush=True)
        launch_host_desktop_window("http://localhost:8080/index.html")
        server.stop_server()
        return

    print(f" [*] 터널 엔진 확인됨: {cf_path}", flush=True)
    tunnel_proc = subprocess.Popen(
        [cf_path, "tunnel", "--url", "http://localhost:8080"],
        stderr=subprocess.PIPE,
        stdout=subprocess.PIPE
    )

    public_url = None
    print(" [*] 공인 접속 주소 생성 중입니다. 잠시만 기다려주세요...", flush=True)

    # 비동기로 터널 출력 감지
    start_wait = time.time()
    while time.time() - start_wait < 15:
        line = tunnel_proc.stderr.readline().decode('utf-8', errors='ignore')
        if not line and tunnel_proc.poll() is not None:
            break
        m = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
        if m:
            public_url = m.group(0)
            break

    stop_heartbeat = threading.Event()
    if public_url:
        print(" [3/4] 깃허브 웹사이트에 현재 호스트 주소를 자동 등록 중...", flush=True)
        update_cloud_registry("online", public_url)

        # 실시간 하트비트 스레드 (15초마다 생존 갱신)
        def heartbeat_worker():
            while not stop_heartbeat.wait(15):
                try:
                    update_cloud_registry("online", public_url)
                except Exception:
                    pass
        threading.Thread(target=heartbeat_worker, daemon=True).start()

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
        print(f" 🚀 [실시간 터널 주소]: {public_url}", flush=True)
        print("=" * 70, flush=True)
        print(" 📢 [이용 안내 - 100% 완전 자동 연동!]", flush=True)
        print(" 1. 스마트폰이나 친구들은 위의 '고정 웹사이트 링크'로 접속하면", flush=True)
        print("    현재 켜진 이 호스트를 자동으로 감지하여 1초 만에 같은 방으로 직결됩니다!", flush=True)
        print(" 2. 호스트 PC는 웹 브라우저가 아닌 별도의 독립 데스크톱 창으로 실행됩니다.", flush=True)
        print(" 3. 게임 창을 닫으시면 서버와 터널이 자동으로 안전 종료됩니다.", flush=True)
        print("=" * 70 + "\n", flush=True)
    else:
        print("[!] 공인 터널 생성에 실패했습니다. 로컬 단독으로 실행합니다.", flush=True)

    # 4. 웹 브라우저 대신 독립 데스크톱 GUI 전용 창 실행!
    local_play_url = "http://localhost:8080/index.html"
    try:
        launch_host_desktop_window(local_play_url)
    finally:
        stop_heartbeat.set()
        print("\n[*] 가즈아교 글로벌 서버를 안전하게 종료합니다. 아멘!", flush=True)
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
