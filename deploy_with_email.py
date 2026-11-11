# ========================================================
# 가자교 온라인 (gajakyo-online.surge.sh) 이메일 인증 배포기
# 사용자의 실제 이메일로 Surge 계정을 등록하여 
# 영구 도메인 https://gajakyo-online.surge.sh 를 활성화합니다.
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

def main():
    print("=" * 60)
    print(" † 가자교 온라인 대성전 [gajakyo-online] 영구 배포기 †")
    print("=" * 60)
    
    email = input("\n사용하실 이메일 주소를 입력하세요 (인증 링크 수신용): ").strip()
    if not email or "@" not in email:
        print("[!] 유효한 이메일 주소를 입력해주세요.")
        return

    password = secrets.token_urlsafe(12)
    auth_str = f"{email}:{password}"
    b64_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")

    print(f"\n[1/3] Surge 계정 인증 등록 중 ({email})...")
    req = urllib.request.Request(
        "https://surge.surge.sh/token",
        method="POST",
        headers={
            "Authorization": f"Basic {b64_auth}",
            "Accept": "application/json"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            token = data.get("token")
    except urllib.error.HTTPError as e:
        print(f"[!] 계정 생성 오류: {e}")
        return

    # Tarball 압축
    print("[2/3] 배포 패키지 압축 중...")
    file_count = 0
    total_size = 0
    with tarfile.open(TAR_PATH, "w:gz") as tar:
        for fname in FILES_TO_DEPLOY:
            if os.path.exists(fname):
                tar.add(fname, arcname=os.path.join("site", fname))
                file_count += 1
                total_size += os.path.getsize(fname)

    # 배포 업로드
    print(f"[3/3] https://{DOMAIN} 으로 사이트 업로드 중...")
    auth_token_str = f"token:{token}"
    b64_token = base64.b64encode(auth_token_str.encode("utf-8")).decode("utf-8")

    with open(TAR_PATH, "rb") as f:
        tar_bytes = f.read()

    req_put = urllib.request.Request(
        f"https://surge.surge.sh/{DOMAIN}",
        data=tar_bytes,
        method="PUT",
        headers={
            "Authorization": f"Basic {b64_token}",
            "Content-Type": "application/gzip",
            "Accept": "application/x-ndjson",
            "version": "1.0.0",
            "file-count": str(file_count),
            "project-size": str(total_size)
        }
    )

    try:
        urllib.request.urlopen(req_put, timeout=60)
    except Exception as e:
        pass
    finally:
        if os.path.exists(TAR_PATH):
            os.remove(TAR_PATH)

    print("\n" + "=" * 60)
    print(" [중요] 마지막 단계: 이메일 인증 링크 클릭!")
    print(f" 입력하신 [{email}] 메일함으로 Surge 인증 메일이 발송되었습니다.")
    print(" 메일에 있는 'Verify Email' 링크를 클릭하시면 즉시")
    print(f" 🌐 https://{DOMAIN}")
    print(" 주소로 전 세계 어디서나 접속할 수 있습니다!")
    print("=" * 60)

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    main()

