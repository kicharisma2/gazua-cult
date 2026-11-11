# ==========================================
# 가자교 대성전 원클릭 로컬 웹 서버 실행기
# 브라우저 보안 제약(CORS) 없이 100% 완벽 구동
# ==========================================

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080

class MyHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 캐시 방지 및 UTF-8 헤더 추가
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # 포트 충돌 방지: 8080이 사용 중이면 다음 포트 탐색
    port = PORT
    for p in range(8080, 8095):
        try:
            httpd = socketserver.TCPServer(("", p), MyHTTPHandler)
            port = p
            break
        except OSError:
            continue
    else:
        print("[!] 포트를 열 수 없습니다.")
        sys.exit(1)

    url = f"http://localhost:{port}/index.html"
    print("=" * 60)
    print(" † 대한예수교 떡상장로회 가자교 온라인 대성전 가동 중 †")
    print(f" 접속 주소: {url}")
    print("=" * 60)
    print("브라우저를 자동으로 엽니다... (종료하려면 창을 닫거나 Ctrl+C)")

    # 기본 브라우저 자동 오픈
    webbrowser.open(url)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n서버를 종료합니다. 떡상아멘!")
        httpd.server_close()

if __name__ == "__main__":
    main()

