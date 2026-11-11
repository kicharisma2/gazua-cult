// ==========================================
// 가자교 (GAJA CULT) 웹 오디오 신디사이저 엔진
// 외부 사운드 파일 없이 순수 Web Audio API로
// 장엄한 파이프오르간 찬송가 및 사이비 SFX 합성
// ==========================================

class GajaAudioEngine {
  constructor() {
    this.ctx = null;
    this.isBgmPlaying = false;
    this.bgmTimer = null;
    this.volume = 0.4;
    this.masterGain = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- 파이프오르간 단일 파이프(음색) 생성 ---
  playOrganNote(freq, time, duration = 1.2, noteGain = 0.25) {
    if (!this.ctx) return;
    const now = time || this.ctx.currentTime;
    
    // 파이프오르간의 풍성한 배음을 위해 여러 오실레이터 합성 (기음, 옥타브, 3배음)
    const harmonics = [
      { type: 'sine', ratio: 1.0, gain: 0.5 },
      { type: 'triangle', ratio: 2.0, gain: 0.3 },
      { type: 'sine', ratio: 3.0, gain: 0.15 },
      { type: 'sawtooth', ratio: 0.5, gain: 0.15 } // 묵직한 베이스 페달
    ];

    const noteMaster = this.ctx.createGain();
    noteMaster.gain.setValueAtTime(0, now);
    noteMaster.gain.linearRampToValueAtTime(noteGain, now + 0.1); // 오르간 건반 누르는 어택
    noteMaster.gain.setValueAtTime(noteGain * 0.9, now + duration - 0.15);
    noteMaster.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.3); // 릴리즈
    noteMaster.connect(this.masterGain);

    harmonics.forEach(h => {
      const osc = this.ctx.createOscillator();
      const hGain = this.ctx.createGain();
      osc.type = h.type;
      osc.frequency.setValueAtTime(freq * h.ratio, now);
      hGain.gain.setValueAtTime(h.gain, now);

      osc.connect(hGain);
      hGain.connect(noteMaster);

      osc.start(now);
      osc.stop(now + duration + 0.35);
    });
  }

  // --- 오르간 코드(화음) 연주 ---
  playOrganChord(frequencies, time, duration = 1.5) {
    frequencies.forEach(f => {
      this.playOrganNote(f, time, duration, 0.2 / frequencies.length);
    });
  }

  // --- 장엄한 파이프오르간 BGM 루프 (가자교 찬송가: "만복의 근원 떡상주") ---
  startBgm() {
    this.ensureContext();
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;

    // C - G - Am - F (캐논 스타일의 거룩하고 중독적인 코드 진행)
    const chords = [
      [130.81, 261.63, 329.63, 392.00], // C major (C3, C4, E4, G4)
      [98.00, 196.00, 246.94, 293.66],  // G major (G2, G3, B3, D4)
      [110.00, 220.00, 261.63, 329.63], // A minor (A2, A3, C4, E4)
      [87.31, 174.61, 220.00, 261.63],  // F major (F2, F3, A3, C4)
      [130.81, 261.63, 329.63, 523.25], // C/E
      [87.31, 220.00, 261.63, 349.23],  // F
      [98.00, 196.00, 293.66, 392.00],  // G
      [130.81, 261.63, 392.00, 523.25]  // C 아멘 마무리
    ];

    let chordIdx = 0;
    const playNextChord = () => {
      if (!this.isBgmPlaying) return;
      const now = this.ctx.currentTime;
      const currentChord = chords[chordIdx];
      this.playOrganChord(currentChord, now, 2.2);

      // 아르페지오 장식음
      const highNote = currentChord[currentChord.length - 1] * 1.5;
      this.playOrganNote(highNote, now + 0.8, 0.8, 0.08);
      this.playOrganNote(highNote * 1.25, now + 1.4, 0.8, 0.06);

      chordIdx = (chordIdx + 1) % chords.length;
      this.bgmTimer = setTimeout(playNextChord, 2200);
    };

    playNextChord();
  }

  stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  toggleBgm() {
    if (this.isBgmPlaying) {
      this.stopBgm();
      return false;
    } else {
      this.startBgm();
      return true;
    }
  }

  // --- SFX 1: 영끌 헌금 투척 (황금 코인 와르르 쏟아지는 소리) ---
  playOfferingSfx() {
    this.ensureContext();
    const now = this.ctx.currentTime;
    // 맑고 경쾌한 금속성 동전 소리 연속 발생
    for (let i = 0; i < 8; i++) {
      const delay = i * 0.06 + Math.random() * 0.03;
      const freq = 2000 + Math.random() * 2500;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + delay + 0.12);

      gain.gain.setValueAtTime(0.18, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + delay);
      osc.stop(now + delay + 0.2);
    }
  }

  // --- SFX 2: 통성기도 / 방언 폭발 (성스러운 천상 하프 & 샤우팅 신스) ---
  playTonguePrayerSfx() {
    this.ensureContext();
    const now = this.ctx.currentTime;

    // 천상의 아르페지오 글리산도
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      const delay = idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.15, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + delay);
      osc.stop(now + delay + 0.85);
    });

    // 웅장한 에너지 울림
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(130.81, now);
    subOsc.frequency.exponentialRampToValueAtTime(261.63, now + 0.4);

    subGain.gain.setValueAtTime(0.3, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(now);
    subOsc.stop(now + 1.05);
  }

  // --- SFX 3: 은혜로 쓰러짐 (천둥 베이스 드롭 + 영적인 여운) ---
  playSlainSfx() {
    this.ensureContext();
    const now = this.ctx.currentTime;

    // 묵직한 서브 베이스 하강 (쓰러질 때 쿵!)
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(150, now);
    bassOsc.frequency.exponentialRampToValueAtTime(35, now + 0.5);

    bassGain.gain.setValueAtTime(0.4, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    bassOsc.connect(bassGain);
    bassGain.connect(this.masterGain);

    bassOsc.start(now);
    bassOsc.stop(now + 0.85);

    // 공중에 울리는 영적 벨
    const bellOsc = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(880, now + 0.1);

    bellGain.gain.setValueAtTime(0.2, now + 0.1);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    bellOsc.connect(bellGain);
    bellGain.connect(this.masterGain);

    bellOsc.start(now + 0.1);
    bellOsc.stop(now + 1.9);
  }

  // --- SFX 4: 부흥회 박수 소리 (스냅/클랩 노이즈 버스트) ---
  playClapSfx() {
    this.ensureContext();
    const now = this.ctx.currentTime;

    // 화이트 노이즈 버퍼를 이용한 박수 소리
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(1.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  // --- SFX 5: 성수/퇴마 분무 소리 (푸슈슉 물안개 + 청명한 방울) ---
  playHolyWaterSfx() {
    this.ensureContext();
    const now = this.ctx.currentTime;

    // 고주파 쉭~ 소리
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4000, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);

    // 맑은 물방울 팅~ 소리
    const dropOsc = this.ctx.createOscillator();
    const dropGain = this.ctx.createGain();
    dropOsc.type = 'sine';
    dropOsc.frequency.setValueAtTime(1800, now + 0.04);
    dropOsc.frequency.exponentialRampToValueAtTime(2600, now + 0.12);

    dropGain.gain.setValueAtTime(0.15, now + 0.04);
    dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    dropOsc.connect(dropGain);
    dropGain.connect(this.masterGain);

    dropOsc.start(now + 0.04);
    dropOsc.stop(now + 0.25);
  }

  // --- SFX 6: 대성전 장엄한 "아멘!" 종소리 (거룩한 성당 종) ---
  playAmenBellSfx() {
    this.ensureContext();
    const now = this.ctx.currentTime;
    const bellFreqs = [440, 880, 1320, 1760]; // 배음 구성
    bellFreqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      const initGain = 0.25 / (i + 1);
      gain.gain.setValueAtTime(initGain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 3.1);
    });
  }

  // --- SFX 7: 귀여운 통통 점프 사운드 (스프링 뿅!) ---
  playJumpSfx() {
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // 240Hz에서 580Hz로 튕겨 오르는 귀여운 만화풍 사운드
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  // --- SFX 8: 레벨업 & 등급 승급 은혜 팡파레 ---
  playLevelUpSfx() {
    this.ensureContext();
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.75);
    });
    // 배경 종소리 울림
    setTimeout(() => { this.playAmenBellSfx(); }, 350);
  }
}

window.gajaAudio = new GajaAudioEngine();

