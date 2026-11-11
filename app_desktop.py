# ========================================================
# 가즈아교 (GAZUA CULT) 3D 온라인 대성전 독립 데스크톱 클라이언트
# 로컬 통합 서버(8080) 자동 내장 + 네이티브 독립 게임 창(WebView2) 구동
# ========================================================

import os
import sys
import time
import threading
import server

def get_base_dir():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))

def check_or_start_server():
    base_dir = get_base_dir()
    os.chdir(base_dir)
    # 백그라운드로 8080 서버 구동
    server.start_server_in_background(8080)
    time.sleep(0.8)

def get_online_url():
    base_dir = get_base_dir()
    url_file = os.path.join(base_dir, "ONLINE_URL.txt")
    if os.path.exists(url_file):
        try:
            with open(url_file, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content.startswith("http"):
                    return content
        except Exception:
            pass
    return None

class CultistApi:
    def __init__(self):
        pass

    def get_server_info(self):
        return {
            "local_url": "http://localhost:8080/index.html",
            "online_url": get_online_url()
        }

def main():
    base_dir = get_base_dir()
    os.chdir(base_dir)

    # 1. 서버 인프로세스 실행
    check_or_start_server()

    target_url = "http://localhost:8080/index.html"

    # 2. 독립 윈도우 UI (pywebview)
    try:
        import webview
        api = CultistApi()
        window = webview.create_window(
            title="† 대한예수교 떡상장로회 [가즈아교 3D 온라인 대성전] †",
            url=target_url,
            width=1280,
            height=820,
            min_size=(960, 600),
            resizable=True,
            text_select=False,
            zoomable=True,
            js_api=api
        )
        webview.start(gui='edgechromium', debug=False)
    except Exception as e:
        # 만약 pywebview GUI 환경에 예외가 발생할 경우 기본 브라우저로 폴백
        import webbrowser
        print(f"[!] 웹뷰 창 초기화 중 폴백: {e}")
        webbrowser.open(target_url)
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass
    finally:
        server.stop_server()

if __name__ == "__main__":
    main()

