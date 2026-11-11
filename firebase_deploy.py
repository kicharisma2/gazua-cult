# ========================================================
# 가자교 온라인 대성전 Firebase 자동 배포 도우미
# ========================================================

import os
import subprocess
import sys
import webbrowser

def run_cmd(cmd_list):
    return subprocess.run(cmd_list, shell=True)

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print("=" * 65)
    print(" † 대한예수교 떡상장로회 [가자교 온라인] Firebase 배포 도우미 †")
    print("=" * 65)
    print("\n[안내] Firebase 배포를 위해 Google 계정 인증이 필요합니다.")
    print(" 1. 브라우저가 열리면 평소 쓰시는 Google 계정으로 로그인해주세요.")
    print(" 2. 로그인이 완료되면 자동으로 Firebase 호스팅 배포가 진행됩니다.\n")
    
    input("▶ 계속하려면 [Enter] 키를 누르세요...")

    # 1. 로그인
    print("\n[1단계] Google 계정 로그인 진행 중...")
    run_cmd([".\\firebase.exe", "login"])

    # 2. 배포
    print("\n[2단계] 가자교 대성전을 Firebase Hosting으로 배포합니다...")
    res = run_cmd([".\\firebase.exe", "deploy", "--only", "hosting"])

    if res.returncode == 0:
        print("\n" + "=" * 65)
        print(" † 가자교 온라인 대성전 배포가 성공적으로 완료되었습니다! †")
        print(" 🌐 접속 URL: https://gajakyo-online.web.app")
        print("=" * 65)
    else:
        print("\n[참고] Firebase 프로젝트가 아직 없다면:")
        print(" https://console.firebase.google.com 에 접속하여")
        print(" 'gajakyo-online' 프로젝트를 [프로젝트 만들기] 버튼으로 1초 만에 생성 후")
        print(" 다시 이 스크립트를 실행하시면 즉시 배포 완료됩니다!")

if __name__ == "__main__":
    main()

