# ========================================================
# 가자교 온라인 실시간 글로벌 공인 라이브 터널 러너
# ========================================================

import subprocess
import time
import re
import os

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print("[*] Cloudflare 글로벌 라이브 터널 가동 중...")

    p = subprocess.Popen(
        ['cloudflared.exe', 'tunnel', '--url', 'http://localhost:8080'],
        stderr=subprocess.PIPE,
        stdout=subprocess.PIPE
    )

    url_found = None
    while True:
        line = p.stderr.readline().decode('utf-8', errors='ignore')
        if not line and p.poll() is not None:
            break
        m = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
        if m and not url_found:
            url_found = m.group(0)
            print("=" * 60)
            print(f" † 가자교 온라인 실시간 글로벌 라이브 URL 발급 완료! †")
            print(f" 🌐 접속 URL: {url_found}")
            print("=" * 60)
            with open('ONLINE_URL.txt', 'w', encoding='utf-8') as f:
                f.write(url_found)

    p.wait()

if __name__ == "__main__":
    main()

