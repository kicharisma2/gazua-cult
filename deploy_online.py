# ========================================================
# 가자교 대성전 온라인 자동 배포 스크립트
# - 목표 도메인: https://gajakyo-online.surge.sh
# - 외부 라이브러리(requests 등) 설치 없이 순수 Python 표준 라이브러리로 배포
# ========================================================

import os
import sys
import json
import base64
import tarfile
import secrets
import urllib.request
import urllib.error

DOMAIN = "gajakyo-online.surge.sh"
TAR_PATH = "gajakyo_deploy.tar.gz"

FILES_TO_DEPLOY = [
    "index.html",
    "style.css",
    "app.js",
    "audio.js",
    "three.min.js",
    "OrbitControls.js"
]

def get_surge_token():
    print("[1/3] Surge 배포 인증 토큰 발급 중...")
    email = f"gajakyo_{secrets.token_hex(4)}@gmail.com"
    password = secrets.token_urlsafe(16)
    auth_str = f"{email}:{password}"
    b64_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")

    req = urllib.request.Request(
        "https://surge.surge.sh/token",
        method="POST",
        headers={
            "Authorization": f"Basic {b64_auth}",
            "Accept": "application/json"
        }
    )

    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        token = data.get("token")
        print(f" -> 토큰 발급 완료: {email} (Token: {token[:8]}...)")
        return token

def create_tarball():
    print("[2/3] 배포 패키지(Tarball) 압축 생성 중...")
    file_count = 0
    total_size = 0

    with tarfile.open(TAR_PATH, "w:gz") as tar:
        for fname in FILES_TO_DEPLOY:
            if not os.path.exists(fname):
                print(f"[!] 경고: 파일이 없습니다: {fname}")
                continue
            arcname = os.path.join("site", fname)
            tar.add(fname, arcname=arcname)
            file_count += 1
            total_size += os.path.getsize(fname)

    print(f" -> 압축 완료 ({file_count}개 파일, {total_size:,} 바이트)")
    return file_count, total_size

def deploy(token, file_count, project_size):
    print(f"[3/3] https://{DOMAIN} 으로 전송 및 배포 중...")
    auth_str = f"token:{token}"
    b64_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")

    with open(TAR_PATH, "rb") as f:
        tar_bytes = f.read()

    req = urllib.request.Request(
        f"https://surge.surge.sh/{DOMAIN}",
        data=tar_bytes,
        method="PUT",
        headers={
            "Authorization": f"Basic {b64_auth}",
            "Content-Type": "application/gzip",
            "Accept": "application/x-ndjson",
            "version": "1.0.0",
            "file-count": str(file_count),
            "project-size": str(project_size)
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            for line in resp:
                text = line.decode("utf-8").strip()
                if text:
                    try:
                        j = json.loads(text)
                        step = j.get("step") or j.get("type") or j.get("status")
                        if step:
                            print(f" -> 진행 상태: {step}")
                    except:
                        pass
        print("\n" + "=" * 60)
        print(f" † 가자교 온라인 대성전 배포 성공! †")
        print(f" 🌐 접속 URL: https://{DOMAIN}")
        print("=" * 60)
    except urllib.error.HTTPError as e:
        print(f"[!] 배포 실패 (HTTP {e.code}): {e.read().decode('utf-8', errors='ignore')}")
    finally:
        if os.path.exists(TAR_PATH):
            os.remove(TAR_PATH)

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    try:
        token = get_surge_token()
        f_count, p_size = create_tarball()
        deploy(token, f_count, p_size)
    except Exception as e:
        print("[!] 오류 발생:", e)

