// ========================================================
// 가즈아교 (GAZUA CULT) 온라인 대성전 - CORE MULTIPLAYER CLIENT
// Three.js 3D 성전, 캐릭터 커스터마이징, 실시간 멀티플레이 동기화,
// 정직한 실시간 접속자 수 카운트, 롱숏 대결 & 떡상 룰렛
// ========================================================

const STATE = {
  currentRoom: 'KRW-BTC',
  roomData: {
    'KRW-BTC': { name: '비트코인(BTC) 본당', symbol: 'BTC', price: 98500000, changeRate: 0.0345, isCrypto: true },
    'KRW-ETH': { name: '이더리움(ETH) 은혜관', symbol: 'ETH', price: 4250000, changeRate: 0.0182, isCrypto: true },
    'KRW-DOGE': { name: '도지코인(DOGE) 방언관', symbol: 'DOGE', price: 215, changeRate: -0.0125, isCrypto: true },
    'SEC-005930': { name: '삼성전자(005930) 구원실', symbol: '삼성전자', price: 199100, changeRate: 0.001, isCrypto: false },
    'SEC-000660': { name: 'SK하이닉스(000660) 성령관', symbol: 'SK하이닉스', price: 1215000, changeRate: 0.0025, isCrypto: false },
    'US-TSLA': { name: '테슬라(TSLA) 승천실', symbol: 'TSLA', price: 379.78, changeRate: 0.0045, isCrypto: false },
    'US-NVDA': { name: '엔비디아(NVDA) 영생실', symbol: 'NVDA', price: 135.2, changeRate: 0.041, isCrypto: false }
  },
  // 유저 프로필 & 커스터마이징 & 20단계 계급 시스템
  playerName: '존버신도_' + Math.floor(Math.random() * 899 + 100),
  playerLevel: 1,
  playerExp: 0,
  playerRankTitle: '방황하는 개미',
  playerTitle: '[영끌집사]',
  playerRobe: 'white',   // white, black, crimson, gold, pink, sky
  playerHat: 'halo',     // halo, horns, candle, catears, none
  playerWings: 'angel',  // angel, mecha, devil, none
  playerBelt: 'long',    // long(red), short(blue), gold(gold)
  onlineCount: 1,
  upbitWs: null,
  multiWs: null,
  isOnlineMultiplayer: false,
  priceHistory: [97000000, 97500000, 98000000, 98200000, 98500000],
  keys: { w: false, a: false, s: false, d: false, space: false },
  joystickDir: { x: 0, y: 0 }, // 360도 모바일 가상 조이스틱 방향 벡터 (-1 ~ +1)
  clickTargetPos: null,
  lastMoveSendTime: 0,
  longVotes: 120,
  shortVotes: 35,
  // ChatGPT 대양봉교 핵심 시스템 상태
  ritualGauge: 35,       // 양봉 강림 합심 게이지 (0 ~ 100)
  ritualActive: false,   // 양봉 불기둥 승천 연출 중 여부
  bossHp: 100,           // 서관 공매도 악귀 마왕 체력 (0 ~ 100)
  bossMaxHp: 100,
  hasBullBuff: false,    // 황소 성물 축복 버프
  myClientId: null,      // 내 클라이언트 웹소켓 ID
  chatLog: [],           // 성전 전체 대화 및 지난 간증 기록
  hasFoundGoldAnt: false,// 숨겨진 황금 개미 보물 획득 여부
  hasVotedProphecy: false// 오늘의 종가 예언 투표 여부
};

// ==========================================
// 20단계 대양봉교 신도 계급 체계 (Rank System)
// ==========================================
const CULT_RANKS = [
  { level: 1, title: '방황하는 개미', expReq: 80, desc: '대양봉교 성전에 첫 발을 들인 가련한 개미' },
  { level: 2, title: '신규 신도', expReq: 180, desc: '양봉의 구원을 믿기 시작한 새신도' },
  { level: 3, title: '차트 관찰자', expReq: 300, desc: '붉은 양봉 캔들의 신비를 엿본 자' },
  { level: 4, title: '기도 수습생', expReq: 440, desc: '새벽마다 통성기도를 올리는 수습생' },
  { level: 5, title: '떡상 전도사', expReq: 600, desc: '주변 이웃에게 가즈아 복음을 전하는 전도사' },
  { level: 6, title: '양봉 신봉자', expReq: 780, desc: '붉은 성의를 입고 결사 롱을 외치는 자' },
  { level: 7, title: '촛불 사제', expReq: 1000, desc: '제단에 성스러운 평단가 촛불을 봉헌하는 사제' },
  { level: 8, title: '차트 해석관', expReq: 1250, desc: '이동평균선의 성령 흐름을 짚어내는 관료' },
  { level: 9, title: '상승 예언자', expReq: 1550, desc: '내일의 상한가를 계시받는 성스러운 예언자' },
  { level: 10, title: '대양봉 사제', expReq: 1900, desc: '찬란한 황금빛 오라를 두른 고위 사제' },
  { level: 11, title: '황금 개미', expReq: 2300, desc: '폭락장을 견디고 황금빛 날개를 펼친 성도' },
  { level: 12, title: '양봉 수호자', expReq: 2750, desc: '파란 음봉 악귀를 단두대로 베는 수호기사' },
  { level: 13, title: '불장의 화신', expReq: 3250, desc: '몸 전체에서 승천의 불꽃 오라를 뿜는 화신' },
  { level: 14, title: '상한가 전도대장', expReq: 3800, desc: '전 신도를 이끌고 불장으로 진격하는 지휘관' },
  { level: 15, title: '붉은 차트 군주', expReq: 4400, desc: '차트를 붉은 바다로 물들이는 영적 군주' },
  { level: 16, title: '대폭등 예언자', expReq: 5100, desc: '천둥과 번개로 폭등을 선포하는 대예언자' },
  { level: 17, title: '천상계 고래', expReq: 5900, desc: '호가창을 집어삼키는 거대한 천상계 고래' },
  { level: 18, title: '양봉 대주교', expReq: 6800, desc: '성전의 모든 의식과 집회를 총괄하는 대주교' },
  { level: 19, title: '영원한 상승자', expReq: 7800, desc: '중력을 거스르고 차트의 정점에 선 초월자' },
  { level: 20, title: '대양봉교 교주', expReq: 999999, desc: '천상의 황금 왕좌에 군림하는 지존의 교주' }
];

// ==========================================
// 실시간 은혜 일일 미션 목록 (Daily Missions)
// ==========================================
let DAILY_MISSIONS = [
  { id: 'jump', title: '기쁨의 상승 점프 뛰기', desc: '스페이스바로 5회 점프', target: 5, current: 0, rewardExp: 40, icon: '🦘', done: false },
  { id: 'holywater', title: '성수 세례 받기', desc: '성수대 또는 분수대에서 성수 마시기', target: 1, current: 0, rewardExp: 50, icon: '💧', done: false },
  { id: 'roulette', title: '성령의 룰렛 돌리기', desc: '은혜 룰렛 1회 회전', target: 1, current: 0, rewardExp: 50, icon: '🎡', done: false },
  { id: 'bull', title: '황금 황소 성물 터치', desc: '분수 정원의 황소상 축복받기', target: 1, current: 0, rewardExp: 60, icon: '🐂', done: false },
  { id: 'ritual', title: '양봉 강림 부흥회 동참', desc: '합심 기도로 게이지 채우기', target: 2, current: 0, rewardExp: 80, icon: '🔥', done: false },
  { id: 'boss', title: '공매도 마왕 퇴마 공격', desc: '서관의 마왕에게 성수/기도 타격', target: 3, current: 0, rewardExp: 70, icon: '⚡', done: false },
  { id: 'testimony', title: '은혜의 간증 올리기', desc: '신도 집회에 간증 1회 작성', target: 1, current: 0, rewardExp: 40, icon: '📜', done: false },
  { id: 'offering', title: '영끌 황금 헌금 바치기', desc: '제단에 헌금 투척', target: 1, current: 0, rewardExp: 40, icon: '💰', done: false },
  { id: 'pilgrimage', title: '성전 기물 뛰어넘기', desc: '장의자나 제단 3회 뛰어넘기', target: 3, current: 0, rewardExp: 50, icon: '🏛️', done: false }
];

// ==========================================
// 성전 기물 장애물 정의 (Obstacle Collision & Jump Over)
// ==========================================
const TEMPLE_OBSTACLES = [
  // 1. 본당 제단 강대상
  { type: 'box', x: 0, z: -11.5, w: 8.5, d: 3.0, h: 2.0, name: '황금 강대상' },
  // 2. 본당 장의자 10개 (높이 1.2m -> 점프로 뛰어넘기 가능)
  { type: 'box', x: -6.8, z: 1.0, w: 6.8, d: 1.3, h: 1.2, name: '장의자 L1' },
  { type: 'box', x: 6.8, z: 1.0, w: 6.8, d: 1.3, h: 1.2, name: '장의자 R1' },
  { type: 'box', x: -6.8, z: 4.8, w: 6.8, d: 1.3, h: 1.2, name: '장의자 L2' },
  { type: 'box', x: 6.8, z: 4.8, w: 6.8, d: 1.3, h: 1.2, name: '장의자 R2' },
  { type: 'box', x: -6.8, z: 8.6, w: 6.8, d: 1.3, h: 1.2, name: '장의자 L3' },
  { type: 'box', x: 6.8, z: 8.6, w: 6.8, d: 1.3, h: 1.2, name: '장의자 R3' },
  { type: 'box', x: -6.8, z: 12.4, w: 6.8, d: 1.3, h: 1.2, name: '장의자 L4' },
  { type: 'box', x: 6.8, z: 12.4, w: 6.8, d: 1.3, h: 1.2, name: '장의자 R4' },
  { type: 'box', x: -6.8, z: 16.2, w: 6.8, d: 1.3, h: 1.2, name: '장의자 L5' },
  { type: 'box', x: 6.8, z: 16.2, w: 6.8, d: 1.3, h: 1.2, name: '장의자 R5' },
  // 3. 본당 웅장한 대리석 기둥 8개 (높이 16m -> 높은 벽)
  { type: 'cyl', x: -13, z: -9, r: 1.1, h: 16 },
  { type: 'cyl', x: 13, z: -9, r: 1.1, h: 16 },
  { type: 'cyl', x: -13, z: -3, r: 1.1, h: 16 },
  { type: 'cyl', x: 13, z: -3, r: 1.1, h: 16 },
  { type: 'cyl', x: -13, z: 3, r: 1.1, h: 16 },
  { type: 'cyl', x: 13, z: 3, r: 1.1, h: 16 },
  { type: 'cyl', x: -13, z: 9, r: 1.1, h: 16 },
  { type: 'cyl', x: 13, z: 9, r: 1.1, h: 16 },
  // 4. 동관 카페 바 카운터 (높이 1.3m)
  { type: 'box', x: 38, z: 6, w: 10.4, d: 2.8, h: 1.3, name: '카페 카운터' },
  // 5. 동관 카페 원형 테이블 4개 (높이 0.95m)
  { type: 'cyl', x: 26, z: 0, r: 1.3, h: 0.95 },
  { type: 'cyl', x: 26, z: 12, r: 1.3, h: 0.95 },
  { type: 'cyl', x: 33, z: -3, r: 1.3, h: 0.95 },
  { type: 'cyl', x: 33, z: 15, r: 1.3, h: 0.95 },
  // 6. 서관 통곡실 묘비석 4개 (높이 1.2m)
  { type: 'box', x: -25, z: 0, w: 1.8, d: 1.3, h: 1.2 },
  { type: 'box', x: -25, z: 12, w: 1.8, d: 1.3, h: 1.2 },
  { type: 'box', x: -33, z: -3, w: 1.8, d: 1.3, h: 1.2 },
  { type: 'box', x: -33, z: 15, w: 1.8, d: 1.3, h: 1.2 },
  // 7. 남관 야외광장 분수대 (외벽 림 턱 높이 0.85m -> 점프로 뛰어넘기)
  { type: 'ring', x: 0, z: 48, rMin: 5.6, rMax: 6.6, h: 0.85, name: '분수대 테두리' },
  { type: 'cyl', x: 0, z: 48, r: 1.2, h: 5.6, name: '분수대 중앙기둥' },
  // 8. 제단 교주의 황금 왕좌 (높이 2.4m)
  { type: 'box', x: 0, z: -13.8, w: 2.6, d: 2.0, h: 2.4, name: '교주의 황금 왕좌' },
  // 9. 남관 황금 황소 성물 동상 (높이 2.5m)
  { type: 'box', x: 0, z: 36, w: 3.2, d: 4.2, h: 2.5, name: '황금 황소 성물' },
  // 10. 서관 공매도 악귀 마왕 (높이 3.6m)
  { type: 'cyl', x: -26, z: 6, r: 1.8, h: 3.6, name: '공매도 악귀 마왕' }
];

// 룰렛 보상 목록
const ROULETTE_REWARDS = [
  "★ [원금 2배 회복]의 기적! ★",
  "† [50배 롱 승천] 구원의 은혜! †",
  "★ [세력 매집 추종]의 축복! ★",
  "† [청산 방지 결계] 수호권! †",
  "★ [평단가 탈출] 무사귀환의 계시! ★",
  "† [비트코인 1억5천] 성령 감응! †"
];

// 계시록(운세) 카드 목록
const REVELATIONS = [
  { verse: "가즈아 복음 7장 7절:\n“구하라, 그리하면 상한가를 주실 것이요! 두드리라, 열릴 것이니라!”", luck: "오늘의 은혜 종목: 삼성전자 (+8.2% 예언)" },
  { verse: "존버서 3장 1절:\n“물림에는 때가 있고, 탈출에도 때가 있나니 인내하는 자는 100배의 결실을 맺으리라.”", luck: "오늘의 은혜 종목: 비트코인 (신고가 돌파의 계시)" },
  { verse: "가즈아 서신 1장 4절:\n“파란 음봉 악귀를 두려워 말라. 물타기를 행하는 자에게 평단가 구원이 임하리라.”", luck: "오늘의 은혜 종목: 엔비디아 (외인 폭풍 매수)" },
  { verse: "레버리지 묵시록 12장:\n“교만하여 50배 롱을 치지 말지어다. 5배 저배율 존버가 영생의 길이니라.”", luck: "오늘의 은혜 종목: 테슬라 (우주선 발사 축복)" },
  { verse: "도지복음 9장:\n“시련 뒤에 화성이 있나니, 도지코인 1달러를 믿는 자는 구원을 얻으리라!”", luck: "오늘의 은혜 종목: 도지코인 (밈의 기적)" }
];

const EVENT_LIST = [
  { id: 1, title: "밤 11시 나스닥 개장 기념 특별 철야 통성기도회", time: "오늘 23:00", count: 84 },
  { id: 2, title: "비트코인 1억 안착 축하 감사 찬양 성회", time: "매일 09:00", count: 129 },
  { id: 3, title: "삼성전자 10만전자 기원 금식 구마의식", time: "내일 14:00", count: 57 }
];

const TONGUE_SHOUTS = [
  "할렐루야 떡상아멘!!",
  "주여 평단가에 오게 하소서!!",
  "샤바샤바 10만전자 승천!!",
  "가즈아아아아아아!!",
  "파란 음봉 악귀야 물러가라!!",
  "믿는 자에게 익절이 있나니!",
  "존버는 승리한다 아멘!",
  "주여 풀매수를 용서하소서!!",
  "천국 가면 원금 복구됩니까!",
  "오병이어의 기적으로 시드 100배!!"
];

// 색상 프리셋
const COLOR_PALETTE = {
  white: 0xfffcf5,
  black: 0x1f191d,
  crimson: 0x9e1322,
  gold: 0xf5c542,
  pink: 0xff8fa3,
  sky: 0x60a5fa,
  long: 0xff3352,
  short: 0x2563eb
};

// --- Three.js 글로벌 참조 ---
let scene, camera, renderer, controls;
let altarScreenCanvas, altarScreenCtx, altarScreenTexture;
let neonCrossMesh, crossLight;
let megaCandleMesh = null, megaCandleLight = null;
let throneMesh = null;
let bullStatueGroup = null;
let whaleStatueGroup = null;
let candleAltarGroup = null;
let coinPondGroup = null;
let revivalCircleGroup = null;
let bossGroup = null, bossHpBarMesh = null, bossHpFillMesh = null;
let goldAntMesh = null;
let playerCharacter;
let floorMesh;
let floorMeshes = []; // 본당, 카페, 통곡실, 야외광장 바닥 콜라이더
let fountainParticles = [];
let raycaster, mousePointer;
let clickMarkerMesh;
const remotePeers = {}; // { clientId: peerObj }
const particles = [];
const speechBubbles = [];
const nameTags = [];

let SHARED_GEO = null;

function initSharedGeometries() {
  SHARED_GEO = {
    head: new THREE.SphereGeometry(0.46, 24, 24),
    eye: new THREE.SphereGeometry(0.095, 14, 14),
    eyeHighlightL: new THREE.SphereGeometry(0.038, 10, 10),
    eyeHighlightS: new THREE.SphereGeometry(0.020, 8, 8),
    blush: new THREE.SphereGeometry(0.09, 14, 14),
    mouth: new THREE.TorusGeometry(0.045, 0.016, 8, 14, Math.PI),
    body: new THREE.CylinderGeometry(0.35, 0.62, 1.35, 18),
    sash: new THREE.CylinderGeometry(0.39, 0.64, 0.35, 18),
    ear: new THREE.SphereGeometry(0.12, 12, 12),
    wingAngel: new THREE.BoxGeometry(0.12, 0.52, 0.40),
    wingDevil: new THREE.ConeGeometry(0.2, 0.55, 4),
    halo: new THREE.TorusGeometry(0.34, 0.048, 10, 24),
    horns: new THREE.ConeGeometry(0.1, 0.28, 8),
    candleHat: new THREE.CylinderGeometry(0.08, 0.08, 0.35, 8),
    catEar: new THREE.ConeGeometry(0.13, 0.24, 4),
    crown: new THREE.CylinderGeometry(0.18, 0.14, 0.16, 6),
    witchHat: new THREE.ConeGeometry(0.24, 0.45, 12),
    witchBrim: new THREE.CylinderGeometry(0.42, 0.42, 0.04, 16),
    arm: new THREE.CylinderGeometry(0.11, 0.16, 0.65, 12),
    hand: new THREE.SphereGeometry(0.09, 10, 10),
    foot: new THREE.SphereGeometry(0.14, 12, 12),
    coin: new THREE.CylinderGeometry(0.12, 0.12, 0.03, 8),
    drop: new THREE.SphereGeometry(0.06, 6, 6),
    spark: new THREE.SphereGeometry(0.1, 5, 5),
    candle: new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8)
  };
}

// ==========================================
// 1. 대성전 3D 환경 구축
// ==========================================
function initWorld() {
  if (typeof THREE === 'undefined') return;

  initSharedGeometries();
  raycaster = new THREE.Raycaster();
  mousePointer = new THREE.Vector2();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12080e);
  scene.fog = new THREE.FogExp2(0x150910, 0.012);

  camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 4.8, 11);

  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('gl-canvas'),
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.minDistance = 3;
  controls.maxDistance = 45;
  controls.target.set(0, 1.6, 2);

  setupLighting();
  buildMegachurch();
  setupClickMarker();

  loadUserProgress();

  // 내 캐릭터 생성 (등급 호칭 반영)
  const initialRank = getRankByLevel(STATE.playerLevel);
  const fullName = `[Lv.${STATE.playerLevel} ${initialRank.title}] ${STATE.playerName}`;

  playerCharacter = createCuteCultist({
    isPlayer: true,
    name: fullName,
    level: STATE.playerLevel,
    title: initialRank.title,
    robeColor: STATE.playerRobe,
    hatType: STATE.playerHat,
    wingsType: STATE.playerWings,
    beltType: STATE.playerBelt,
    pos: { x: 0, y: 0, z: 2 }
  });

  // 내 명찰 등록
  addNameTag(playerCharacter, true);

  window.addEventListener('resize', onWindowResize);
  setupMovementControls();

  setupRealtimeFeed();

  // 통합 WebSocket 멀티플레이 서버 연결
  connectIntegratedMultiplayer();

  animate();
}

function setupLighting() {
  const ambient = new THREE.AmbientLight(0xffecd0, 0.45);
  scene.add(ambient);

  const altarSpot = new THREE.SpotLight(0xfff3d6, 1.8, 45, Math.PI / 4, 0.4, 1);
  altarSpot.position.set(0, 18, 10);
  altarSpot.target.position.set(0, 4, -12);
  altarSpot.castShadow = true;
  scene.add(altarSpot);
  scene.add(altarSpot.target);

  crossLight = new THREE.PointLight(0xff2244, 2.5, 30);
  crossLight.position.set(0, 9.5, -12.5);
  scene.add(crossLight);

  const leftCandle = new THREE.PointLight(0xf5c542, 0.9, 20);
  leftCandle.position.set(-8, 3, 0);
  scene.add(leftCandle);

  const rightCandle = new THREE.PointLight(0xf5c542, 0.9, 20);
  rightCandle.position.set(8, 3, 0);
  scene.add(rightCandle);
}

function buildMegachurch() {
  const churchGroup = new THREE.Group();
  scene.add(churchGroup);

  floorMeshes = [];

  const marbleMat = new THREE.MeshStandardMaterial({ color: 0x2b1c20, roughness: 0.35, metalness: 0.1 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf5c542, metalness: 0.85, roughness: 0.25 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2019, roughness: 0.7 });
  const redCarpetMat = new THREE.MeshStandardMaterial({ color: 0x8a101d, roughness: 0.85 });
  const cafeWoodMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.6 });
  const obsidianMat = new THREE.MeshStandardMaterial({ color: 0x14161f, roughness: 0.4, metalness: 0.2 });
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x1e3820, roughness: 0.9 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x3a3535, roughness: 0.7 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x27592b, roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3b2416, roughness: 0.9 });
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.85 });

  // ----------------------------------------------------
  // 1. [중앙 대성전 본당] (Main Sanctuary)
  // ----------------------------------------------------
  floorMesh = new THREE.Mesh(new THREE.BoxGeometry(34, 0.6, 42), marbleMat);
  floorMesh.position.set(0, -0.3, 5);
  floorMesh.receiveShadow = true;
  churchGroup.add(floorMesh);
  floorMeshes.push(floorMesh);

  const carpet = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.08, 36), redCarpetMat);
  carpet.position.set(0, 0.05, 5);
  carpet.receiveShadow = true;
  churchGroup.add(carpet);

  // 제단 계단 & 황금 강대상
  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(22 - i * 2, 0.45, 10 - i * 1.5), marbleMat);
    step.position.set(0, i * 0.45 + 0.22, -9.5 - i * 0.8);
    step.receiveShadow = true;
    churchGroup.add(step);
    floorMeshes.push(step);
  }

  const altarTable = new THREE.Mesh(new THREE.BoxGeometry(8, 1.4, 2.5), goldMat);
  altarTable.position.set(0, 2.0, -11.5);
  churchGroup.add(altarTable);

  // [대양봉교 교주의 황금 왕좌] (Patriarch's Golden Throne)
  const throneGroup = new THREE.Group();
  throneGroup.position.set(0, 1.35, -13.8); // 3단 단상 위 강대상 바로 뒤

  const throneSeat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 1.4), goldMat);
  throneSeat.position.y = 0.5;
  throneGroup.add(throneSeat);

  const throneCushion = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 1.2), redCarpetMat);
  throneCushion.position.set(0, 0.72, 0);
  throneGroup.add(throneCushion);

  const throneBack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.4, 0.35), goldMat);
  throneBack.position.set(0, 1.8, -0.6);
  throneGroup.add(throneBack);

  const throneBackCushion = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.2), redCarpetMat);
  throneBackCushion.position.set(0, 1.7, -0.48);
  throneGroup.add(throneBackCushion);

  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 1.3), goldMat);
  armL.position.set(-0.85, 0.9, 0);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 1.3), goldMat);
  armR.position.set(0.85, 0.9, 0);
  throneGroup.add(armL, armR);

  const throneCrown = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 5), goldMat);
  throneCrown.position.set(0, 3.2, -0.6);
  throneGroup.add(throneCrown);

  throneMesh = throneGroup;
  churchGroup.add(throneGroup);
  createSpaceSign(0, 4.8, -13.8, "👑 대양봉교 교주의 황금 왕좌", 0xf5c542, churchGroup);

  // [대양봉 강림 초대형 3D 불기둥 캔들] (Ascending Mega Bullish Candle)
  const megaCandleGroup = new THREE.Group();
  megaCandleGroup.position.set(0, 0, -12.5);
  megaCandleGroup.visible = false;

  const candleBodyMat = new THREE.MeshStandardMaterial({
    color: 0xff1133,
    emissive: 0xff2244,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.4
  });
  const megaCandleCyl = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 26, 24), candleBodyMat);
  megaCandleCyl.position.y = 13;
  megaCandleGroup.add(megaCandleCyl);

  const wickMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 8), new THREE.MeshBasicMaterial({ color: 0x111111 }));
  wickMesh.position.y = 27.2;
  megaCandleGroup.add(wickMesh);

  const flameMesh = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4.5, 16), new THREE.MeshBasicMaterial({ color: 0xfff044 }));
  flameMesh.position.y = 29.8;
  megaCandleGroup.add(flameMesh);

  megaCandleLight = new THREE.PointLight(0xff334b, 0, 50);
  megaCandleLight.position.set(0, 16, 0);
  megaCandleGroup.add(megaCandleLight);

  megaCandleMesh = megaCandleGroup;
  churchGroup.add(megaCandleGroup);

  // 붉은 네온 십자가
  const crossGroup = new THREE.Group();
  crossGroup.position.set(0, 9.5, -13.5);
  const neonMat = new THREE.MeshStandardMaterial({
    color: 0xff1133,
    emissive: 0xff2244,
    emissiveIntensity: 1.2,
    roughness: 0.2
  });
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(1.0, 7.5, 0.6), neonMat);
  crossGroup.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.0, 0.6), neonMat);
  crossH.position.y = 1.2;
  crossGroup.add(crossH);
  neonCrossMesh = crossGroup;
  churchGroup.add(crossGroup);

  // 제단 LED 대형 시세판
  altarScreenCanvas = document.createElement('canvas');
  altarScreenCanvas.width = 1024;
  altarScreenCanvas.height = 512;
  altarScreenCtx = altarScreenCanvas.getContext('2d');
  updateAltarScreenCanvas();
  altarScreenTexture = new THREE.CanvasTexture(altarScreenCanvas);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 6.5),
    new THREE.MeshBasicMaterial({ map: altarScreenTexture })
  );
  screen.position.set(0, 5.0, -13.0);
  churchGroup.add(screen);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(13.6, 7.1, 0.3), goldMat);
  frame.position.set(0, 5.0, -13.2);
  churchGroup.add(frame);

  // 파이프오르간
  const organGroup = new THREE.Group();
  organGroup.position.set(0, 7, -14.2);
  const pipeHeights = [4, 5.5, 7, 8.5, 10, 11, 9.5, 8, 6.5, 5];
  for (let side = -1; side <= 1; side += 2) {
    pipeHeights.forEach((h, idx) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, h, 14), goldMat);
      p.position.set(side * (8.5 + idx * 0.55), h / 2 - 2, 0);
      organGroup.add(p);
    });
  }
  churchGroup.add(organGroup);

  // 본당 웅장한 대리석 기둥
  for (let z = -9; z <= 18; z += 6) {
    for (let x of [-13, 13]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 16, 16), marbleMat);
      col.position.set(x, 8, z);
      churchGroup.add(col);
      const capB = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 2.0), goldMat);
      capB.position.set(x, 0.3, z);
      churchGroup.add(capB);
      const capT = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 2.0), goldMat);
      capT.position.set(x, 15.7, z);
      churchGroup.add(capT);
    }
  }

  // 본당 장의자 배치
  for (let z = 1; z <= 17; z += 3.8) {
    for (let x of [-6.8, 6.8]) {
      const pew = new THREE.Group();
      pew.position.set(x, 0, z);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.15, 1.1), woodMat);
      seat.position.set(0, 0.75, 0);
      pew.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.1, 0.15), woodMat);
      back.position.set(0, 1.25, 0.5);
      pew.add(back);
      for (let s of [-3.15, 3.15]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.4, 1.3), woodMat);
        leg.position.set(s, 0.7, 0.1);
        pew.add(leg);
      }
      churchGroup.add(pew);
    }
  }

  // ----------------------------------------------------
  // 2. [동쪽: 성도의 교제 & 영끌 은혜 카페테리아] (Holy Amen Cafe)
  // ----------------------------------------------------
  const cafeFloor = new THREE.Mesh(new THREE.BoxGeometry(28, 0.6, 30), cafeWoodMat);
  cafeFloor.position.set(31, -0.3, 6);
  cafeFloor.receiveShadow = true;
  churchGroup.add(cafeFloor);
  floorMeshes.push(cafeFloor);

  // 동쪽 연결 통로 복도
  const hallwayE = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 8), marbleMat);
  hallwayE.position.set(16.5, -0.3, 6);
  churchGroup.add(hallwayE);
  floorMeshes.push(hallwayE);

  // 카페 아치 간판
  createSpaceSign(16.5, 4.2, 6, "☕ 성도 교제 은혜 카페 (동관) ➔", 0xf5c542, churchGroup);

  // 카페 조명
  const cafeLight = new THREE.PointLight(0xffb066, 1.4, 25);
  cafeLight.position.set(31, 6, 6);
  churchGroup.add(cafeLight);

  // 카페 바 카운터
  const barCounter = new THREE.Mesh(new THREE.BoxGeometry(10, 1.3, 2.4), marbleMat);
  barCounter.position.set(38, 0.65, 6);
  churchGroup.add(barCounter);
  const coffeeMachine = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.4), goldMat);
  coffeeMachine.position.set(38, 1.9, 6);
  churchGroup.add(coffeeMachine);

  // 카페 테이블 & 의자 세트 (4세트)
  const tablePos = [
    { x: 26, z: 0 }, { x: 26, z: 12 },
    { x: 33, z: -3 }, { x: 33, z: 15 }
  ];
  tablePos.forEach(p => {
    // 둥근 원형 테이블
    const tbl = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16), woodMat);
    tbl.position.set(p.x, 0.9, p.z);
    churchGroup.add(tbl);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8), goldMat);
    leg.position.set(p.x, 0.45, p.z);
    churchGroup.add(leg);

    // 둘러싼 의자 3개씩
    for (let a = 0; a < 3; a++) {
      const ang = (a / 3) * Math.PI * 2;
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.55, 12), redCarpetMat);
      stool.position.set(p.x + Math.cos(ang) * 1.8, 0.28, p.z + Math.sin(ang) * 1.8);
      churchGroup.add(stool);
    }
  });

  // ----------------------------------------------------
  // 3. [서쪽: 하락장 통곡의 참회 기도실] (Crypt of Weeping)
  // ----------------------------------------------------
  const cryptFloor = new THREE.Mesh(new THREE.BoxGeometry(28, 0.6, 30), obsidianMat);
  cryptFloor.position.set(-31, -0.3, 6);
  cryptFloor.receiveShadow = true;
  churchGroup.add(cryptFloor);
  floorMeshes.push(cryptFloor);

  // 서쪽 연결 통로 복도
  const hallwayW = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 8), marbleMat);
  hallwayW.position.set(-16.5, -0.3, 6);
  churchGroup.add(hallwayW);
  floorMeshes.push(hallwayW);

  // 통곡실 아치 간판
  createSpaceSign(-16.5, 4.2, 6, "⬅ ⚡ 통곡의 참회 기도실 (서관)", 0x38bdf8, churchGroup);

  // 서늘한 푸른 조명
  const cryptLight = new THREE.PointLight(0x2563eb, 2.2, 28);
  cryptLight.position.set(-31, 6, 6);
  churchGroup.add(cryptLight);

  // 푸른 네온 십자가
  const blueCross = new THREE.Group();
  blueCross.position.set(-42, 6.5, 6);
  const blueNeonMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    emissive: 0x3b82f6,
    emissiveIntensity: 1.5,
    roughness: 0.2
  });
  const bcV = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.0, 0.4), blueNeonMat);
  blueCross.add(bcV);
  const bcH = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.6, 0.4), blueNeonMat);
  bcH.position.y = 0.8;
  blueCross.add(bcH);
  churchGroup.add(blueCross);

  // 순교자들의 묘비석 & 참회 제단 (Tombstones of Margin Call)
  const graveTexts = [
    { x: -25, z: 0, text: "9만전자 층 순교자의 묘" },
    { x: -25, z: 12, text: "도지 800원 존버의 비" },
    { x: -33, z: -3, text: "테슬라 400불 영생 대기소" },
    { x: -33, z: 15, text: "잡코인 상폐 영혼 안식처" }
  ];
  graveTexts.forEach(g => {
    const tomb = new THREE.Group();
    tomb.position.set(g.x, 0, g.z);

    const stone = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 0.5), stoneMat);
    stone.position.y = 1.0;
    tomb.add(stone);

    const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 1.2), stoneMat);
    base.position.y = 0.15;
    tomb.add(base);

    // 비석 앞 푸른 촛불
    const candleM = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0x93c5fd }));
    candleM.position.set(0, 0.6, 0.55);
    tomb.add(candleM);
    const blueFlame = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 5), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
    blueFlame.position.set(0, 0.95, 0.55);
    tomb.add(blueFlame);

    churchGroup.add(tomb);
  });

  // ----------------------------------------------------
  // [공매도 악귀 마왕 3D 레이드 보스] (Short-seller Fiend Boss)
  // ----------------------------------------------------
  const bGroup = new THREE.Group();
  bGroup.position.set(-31, 0, 6);

  const fiendSkinMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.2
  });
  const devilHornMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.2 });

  // 거대한 마왕 몸체
  const fiendBody = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 2.6, 12), fiendSkinMat);
  fiendBody.position.y = 1.6;
  bGroup.add(fiendBody);

  // 마왕 머리
  const fiendHead = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 14), fiendSkinMat);
  fiendHead.position.y = 3.3;
  bGroup.add(fiendHead);

  // 파란 뿔 L, R
  const fHornL = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.0, 8), devilHornMat);
  fHornL.position.set(-0.48, 4.0, 0);
  fHornL.rotation.z = -0.4;
  const fHornR = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.0, 8), devilHornMat);
  fHornR.position.set(0.48, 4.0, 0);
  fHornR.rotation.z = 0.4;
  bGroup.add(fHornL, fHornR);

  // 붉은 악귀 눈빛 L, R
  const fEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff1133 }));
  fEyeL.position.set(-0.25, 3.4, 0.6);
  const fEyeR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff1133 }));
  fEyeR.position.set(0.25, 3.4, 0.6);
  bGroup.add(fEyeL, fEyeR);

  // 파란 음봉 삼지창
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.2, 8), devilHornMat);
  staff.position.set(1.4, 2.2, 0.4);
  bGroup.add(staff);

  const candleBlade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), new THREE.MeshStandardMaterial({ color: 0x2563eb, emissive: 0x1d4ed8, emissiveIntensity: 0.6 }));
  candleBlade.position.set(1.4, 3.8, 0.4);
  bGroup.add(candleBlade);

  // 마왕 발밑 파란 음봉 오라 링
  const floorAura = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.8, 24), new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide }));
  floorAura.rotation.x = -Math.PI / 2;
  floorAura.position.y = 0.06;
  bGroup.add(floorAura);

  // 3D 보스 체력바 & 네임태그
  const hpBarGroup = new THREE.Group();
  hpBarGroup.position.set(0, 4.6, 0);

  const hpBarBg = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.35, 0.1), new THREE.MeshBasicMaterial({ color: 0x111111 }));
  hpBarGroup.add(hpBarBg);

  const hpBarFill = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.25, 0.12), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  hpBarGroup.add(hpBarFill);

  bossHpFillMesh = hpBarFill;
  bossHpBarMesh = hpBarGroup;
  bGroup.add(hpBarGroup);

  bossGroup = bGroup;
  churchGroup.add(bGroup);

  createSpaceSign(-31, 5.4, 6, "👹 [레이드 보스] 공매도 악귀 마왕 (성수/기도로 퇴마!)", 0x38bdf8, churchGroup);

  // ----------------------------------------------------
  // 4. [남쪽 야외: 성령의 떡상 천국 광장 & 3단 황금 분수 정원]
  // ----------------------------------------------------
  const gardenFloor = new THREE.Mesh(new THREE.BoxGeometry(90, 0.6, 44), grassMat);
  gardenFloor.position.set(0, -0.3, 47);
  gardenFloor.receiveShadow = true;
  churchGroup.add(gardenFloor);
  floorMeshes.push(gardenFloor);

  // 본당 정문 앞 광장 연결 보도블록
  const walkway = new THREE.Mesh(new THREE.BoxGeometry(10, 0.08, 42), stoneMat);
  walkway.position.set(0, 0.05, 47);
  churchGroup.add(walkway);

  // 성전 정문 대형 아치 표지판
  createSpaceSign(0, 5.0, 25.5, "🕊️ 성령의 떡상 천국 광장 & 은혜 분수 정원 🕊️", 0xf5c542, churchGroup);

  // ----------------------------------------------------
  // [성스러운 황금 떡상 황소 동상] (Sacred Golden Bull Statue)
  // ----------------------------------------------------
  const bullGroup = new THREE.Group();
  bullGroup.position.set(0, 0, 35.5);

  const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 4.8), marbleMat);
  basePlinth.position.y = 0.3;
  basePlinth.receiveShadow = true;
  bullGroup.add(basePlinth);

  const goldPedestal = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.4, 4.2), goldMat);
  goldPedestal.position.y = 0.7;
  bullGroup.add(goldPedestal);

  const bullBody = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.1, 2.8, 16), goldMat);
  bullBody.rotation.x = Math.PI / 2;
  bullBody.position.set(0, 1.8, 0);
  bullGroup.add(bullBody);

  const bullHump = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 12), goldMat);
  bullHump.position.set(0, 2.2, -0.6);
  bullGroup.add(bullHump);

  const bullHead = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.4, 12), goldMat);
  bullHead.rotation.x = Math.PI * 0.65;
  bullHead.position.set(0, 1.9, -1.8);
  bullGroup.add(bullHead);

  const hornMat = new THREE.MeshStandardMaterial({ color: 0xffe066, metalness: 0.95, roughness: 0.15 });
  const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.1, 8), hornMat);
  hornL.position.set(-0.7, 2.5, -1.6);
  hornL.rotation.set(-0.4, 0, -0.7);
  const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.1, 8), hornMat);
  hornR.position.set(0.7, 2.5, -1.6);
  hornR.rotation.set(-0.4, 0, 0.7);
  bullGroup.add(hornL, hornR);

  const bullEyeMat = new THREE.MeshBasicMaterial({ color: 0xff1133 });
  const bEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), bullEyeMat);
  bEyeL.position.set(-0.42, 2.05, -2.15);
  const bEyeR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), bullEyeMat);
  bEyeR.position.set(0.42, 2.05, -2.15);
  bullGroup.add(bEyeL, bEyeR);

  const legGeo = new THREE.CylinderGeometry(0.24, 0.28, 1.1, 10);
  const legFL = new THREE.Mesh(legGeo, goldMat);
  legFL.position.set(-0.75, 1.15, -0.9);
  const legFR = new THREE.Mesh(legGeo, goldMat);
  legFR.position.set(0.75, 1.15, -0.9);
  const legBL = new THREE.Mesh(legGeo, goldMat);
  legBL.position.set(-0.75, 1.15, 0.9);
  const legBR = new THREE.Mesh(legGeo, goldMat);
  legBR.position.set(0.75, 1.15, 0.9);
  bullGroup.add(legFL, legFR, legBL, legBR);

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 1.0, 6), goldMat);
  tail.position.set(0, 1.6, 1.5);
  tail.rotation.x = -0.5;
  bullGroup.add(tail);

  bullStatueGroup = bullGroup;
  churchGroup.add(bullGroup);

  createSpaceSign(0, 4.4, 35.5, "🐂 성스러운 떡상 황소 성물상 (클릭하여 상한가 축복!)", 0xf59e0b, churchGroup);

  // [숨겨진 성스러운 황금 개미 성물] (ChatGPT 기획안 9-③)
  const antGroup = new THREE.Group();
  antGroup.position.set(32, 0.65, 16);

  const antGoldMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.95,
    roughness: 0.15,
    emissive: 0x996600,
    emissiveIntensity: 0.35
  });

  const antAbdomen = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 14), antGoldMat);
  antAbdomen.position.z = -0.30;
  antGroup.add(antAbdomen);

  const antThorax = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), antGoldMat);
  antGroup.add(antThorax);

  const antHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), antGoldMat);
  antHead.position.set(0, 0.08, 0.26);
  antGroup.add(antHead);

  const eyeMiniMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMiniMat);
  eyeL.position.set(-0.08, 0.14, 0.38);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMiniMat);
  eyeR.position.set(0.08, 0.14, 0.38);
  antGroup.add(eyeL, eyeR);

  // 더듬이 2개
  const ant1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 6), antGoldMat);
  ant1.position.set(-0.06, 0.24, 0.32);
  ant1.rotation.z = -0.35;
  const ant2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 6), antGoldMat);
  ant2.position.set(0.06, 0.24, 0.32);
  ant2.rotation.z = 0.35;
  antGroup.add(ant1, ant2);

  goldAntMesh = antGroup;
  churchGroup.add(antGroup);
  createSpaceSign(32, 1.8, 16, "🐜 [숨겨진 성물] 황금 개미 (터치하여 보물 은혜 받기!)", 0xf5c542, churchGroup);

  // 중앙 3단 황금 분수대 (Holy Fountain of Ascension)
  const fountainGroup = new THREE.Group();
  fountainGroup.position.set(0, 0, 48);

  const basinBottom = new THREE.Mesh(new THREE.CylinderGeometry(6.0, 6.4, 0.8, 32), marbleMat);
  basinBottom.position.y = 0.4;
  fountainGroup.add(basinBottom);

  const basinRim = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.35, 12, 32), goldMat);
  basinRim.rotation.x = Math.PI / 2;
  basinRim.position.y = 0.8;
  fountainGroup.add(basinRim);

  const waterSurface = new THREE.Mesh(new THREE.CircleGeometry(5.8, 32), waterMat);
  waterSurface.rotation.x = -Math.PI / 2;
  waterSurface.position.y = 0.75;
  fountainGroup.add(waterSurface);

  // 분수대 중앙 3단 기둥 & 접시
  const fCol1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 2.5, 16), goldMat);
  fCol1.position.y = 1.6;
  fountainGroup.add(fCol1);

  const fTier2 = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.4, 24), marbleMat);
  fTier2.position.y = 2.8;
  fountainGroup.add(fTier2);

  const fCol2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 2.0, 16), goldMat);
  fCol2.position.y = 3.8;
  fountainGroup.add(fCol2);

  const fTier3 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.3, 20), goldMat);
  fTier3.position.y = 4.8;
  fountainGroup.add(fTier3);

  // 최상단 황금 십자가 노즐
  const topCross = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.15), goldMat);
  topCross.position.y = 5.6;
  fountainGroup.add(topCross);

  churchGroup.add(fountainGroup);

  // 분수대 푸른 성수 조명
  const fountainLight = new THREE.PointLight(0x38bdf8, 2.5, 20);
  fountainLight.position.set(0, 4.0, 48);
  churchGroup.add(fountainLight);

  // 분수 물줄기 파티클들 초기화
  initFountainParticles(0, 5.6, 48);

  // 정원 가로등 (6개) & 벤치 (4개)
  const lampPositions = [
    { x: -7, z: 34 }, { x: 7, z: 34 },
    { x: -14, z: 48 }, { x: 14, z: 48 },
    { x: -7, z: 62 }, { x: 7, z: 62 }
  ];
  lampPositions.forEach(p => {
    // 가로등 기둥
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 4.5, 8), goldMat);
    pole.position.set(p.x, 2.25, p.z);
    churchGroup.add(pole);

    const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfff3d6 }));
    lampBulb.position.set(p.x, 4.5, p.z);
    churchGroup.add(lampBulb);

    const pLight = new THREE.PointLight(0xf5c542, 1.2, 14);
    pLight.position.set(p.x, 4.3, p.z);
    churchGroup.add(pLight);
  });

  // 정원수 나무들 (8그루)
  const treePositions = [
    { x: -24, z: 36 }, { x: -34, z: 44 }, { x: -26, z: 56 }, { x: -36, z: 62 },
    { x: 24, z: 36 }, { x: 34, z: 44 }, { x: 26, z: 56 }, { x: 36, z: 62 }
  ];
  treePositions.forEach(tp => {
    const tree = new THREE.Group();
    tree.position.set(tp.x, 0, tp.z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 3.2, 8), trunkMat);
    trunk.position.y = 1.6;
    tree.add(trunk);
    const crown1 = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.2, 8), leafMat);
    crown1.position.y = 4.2;
    tree.add(crown1);
    const crown2 = new THREE.Mesh(new THREE.ConeGeometry(2.0, 3.5, 8), leafMat);
    crown2.position.y = 6.0;
    tree.add(crown2);
    churchGroup.add(tree);
  });

  // ----------------------------------------------------
  // 5. [2층: 세력 영생 VIP 성가대 테라스 발코니] (Choir Balcony)
  // ----------------------------------------------------
  const balconyFloor = new THREE.Mesh(new THREE.BoxGeometry(24, 0.5, 6), marbleMat);
  balconyFloor.position.set(0, 3.2, 22.5);
  churchGroup.add(balconyFloor);
  floorMeshes.push(balconyFloor);

  // 황금 난간
  const railing = new THREE.Mesh(new THREE.BoxGeometry(24, 0.9, 0.2), goldMat);
  railing.position.set(0, 3.85, 19.5);
  churchGroup.add(railing);

  createSpaceSign(0, 5.2, 22.5, "👑 2층 세력 영생 VIP 성가대석", 0xf5c542, churchGroup);

  // ----------------------------------------------------
  // 6. [북관: 100억 슈퍼고래 영생 참배원] (Whale Sanctuary)
  // ----------------------------------------------------
  const whaleSanctuaryFloor = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 14), obsidianMat);
  whaleSanctuaryFloor.position.set(0, 0.2, -26);
  churchGroup.add(whaleSanctuaryFloor);
  floorMeshes.push(whaleSanctuaryFloor);

  // 황금 고래 3D 조각상
  const whaleGroup = new THREE.Group();
  whaleGroup.position.set(0, 2.8, -26);

  // 고래 몸체
  const whaleBody = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.3, 5.8, 16), goldMat);
  whaleBody.rotation.x = Math.PI / 2;
  whaleGroup.add(whaleBody);

  // 고래 머리 (둥근 반구)
  const whaleHead = new THREE.Mesh(new THREE.SphereGeometry(1.45, 16, 16), goldMat);
  whaleHead.position.set(0, 0, 2.9);
  whaleGroup.add(whaleHead);

  // 고래 꼬리 지느러미
  const whaleTail = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 1.2), goldMat);
  whaleTail.position.set(0, 0.4, -3.2);
  whaleTail.rotation.x = 0.3;
  whaleGroup.add(whaleTail);

  // 등 지느러미
  const dorsalFin = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 4), goldMat);
  dorsalFin.position.set(0, 1.8, 0.2);
  dorsalFin.rotation.x = -0.4;
  whaleGroup.add(dorsalFin);

  // 고래 숨구멍 황금 분수 파티클 조명
  const whaleLight = new THREE.PointLight(0xf5c542, 2.8, 22);
  whaleLight.position.set(0, 3.5, 1.2);
  whaleGroup.add(whaleLight);

  whaleStatueGroup = whaleGroup;
  churchGroup.add(whaleGroup);
  createSpaceSign(0, 5.8, -26, "🐋 [북관] 100억 슈퍼고래 영생 참배원 (터치하여 고래 오라 받기!)", 0xf5c542, churchGroup);

  // ----------------------------------------------------
  // 7. [서관: 성스러운 촛불 봉헌 제단] (Candle Altar)
  // ----------------------------------------------------
  const candleAltarGroupLocal = new THREE.Group();
  candleAltarGroupLocal.position.set(-28, 0, -8);

  const candleAltarTable = new THREE.Mesh(new THREE.BoxGeometry(7, 1.2, 3), woodMat);
  candleAltarTable.position.y = 0.6;
  candleAltarGroupLocal.add(candleAltarTable);

  const candleFlameMat = new THREE.MeshBasicMaterial({ color: 0xff4422 });
  const candleWaxMat = new THREE.MeshStandardMaterial({ color: 0xfff0c0, roughness: 0.3 });

  // 12개의 반짝이는 성스러운 촛대
  for (let ci = -5; ci <= 5; ci += 2) {
    for (let cj = -1; cj <= 1; cj += 2) {
      const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), candleWaxMat);
      wax.position.set(ci * 0.55, 1.5, cj * 0.6);
      candleAltarGroupLocal.add(wax);

      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), candleFlameMat);
      flame.position.set(ci * 0.55, 1.88, cj * 0.6);
      candleAltarGroupLocal.add(flame);
    }
  }

  const candleLight = new THREE.PointLight(0xff5522, 2.2, 16);
  candleLight.position.set(0, 2.5, 0);
  candleAltarGroupLocal.add(candleLight);

  candleAltarGroup = candleAltarGroupLocal;
  churchGroup.add(candleAltarGroupLocal);
  createSpaceSign(-28, 3.6, -8, "🕯️ [서관] 떡상 촛불 봉헌 제단 (터치하여 소망과 평단가 봉헌!)", 0xf59e0b, churchGroup);

  // ----------------------------------------------------
  // 8. [남관: 영끌 행운의 코인 연못] (Lucky Coin Pond)
  // ----------------------------------------------------
  const coinPondGroupLocal = new THREE.Group();
  coinPondGroupLocal.position.set(0, 0, 64);

  // 연못 외곽 림
  const pondRim = new THREE.Mesh(new THREE.TorusGeometry(6.5, 0.4, 16, 32), goldMat);
  pondRim.rotation.x = Math.PI / 2;
  pondRim.position.y = 0.25;
  coinPondGroupLocal.add(pondRim);

  // 푸른 청록색 성스러운 수면
  const pondWaterMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.75
  });
  const pondWater = new THREE.Mesh(new THREE.CylinderGeometry(6.3, 6.3, 0.15, 32), pondWaterMat);
  pondWater.position.y = 0.15;
  coinPondGroupLocal.add(pondWater);

  // 연못 바닥의 반짝이는 황금 동전들
  const pondCoinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.2 });
  for (let cidx = 0; cidx < 24; cidx++) {
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 12), pondCoinMat);
    const r = Math.random() * 4.5;
    const theta = Math.random() * Math.PI * 2;
    coin.position.set(Math.cos(theta) * r, 0.16, Math.sin(theta) * r);
    coin.rotation.x = Math.random() * 0.4;
    coin.rotation.z = Math.random() * 0.4;
    coinPondGroupLocal.add(coin);
  }

  const pondLight = new THREE.PointLight(0x06b6d4, 2.0, 16);
  pondLight.position.set(0, 2.0, 0);
  coinPondGroupLocal.add(pondLight);

  coinPondGroup = coinPondGroupLocal;
  churchGroup.add(coinPondGroupLocal);
  createSpaceSign(0, 3.8, 64, "🪙 [남관] 영끌 행운의 코인 연못 (터치하여 동전 던지고 계시 받기!)", 0x38bdf8, churchGroup);

  // ----------------------------------------------------
  // 9. [동관: 부흥회 단체 통성기도 성령존] (Revival Holy Zone)
  // ----------------------------------------------------
  const revivalCircleGroupLocal = new THREE.Group();
  revivalCircleGroupLocal.position.set(30, 0, -6);

  const revivalFloorMat = new THREE.MeshStandardMaterial({
    color: 0x4a0e17,
    emissive: 0x880011,
    emissiveIntensity: 0.6,
    roughness: 0.4
  });
  const revivalFloor = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.2, 0.2, 32), revivalFloorMat);
  revivalFloor.position.y = 0.1;
  revivalCircleGroupLocal.add(revivalFloor);
  floorMeshes.push(revivalFloor);

  // 4방위 성령 횃불 기둥
  const torchMat = new THREE.MeshStandardMaterial({ color: 0x1f1a1d, roughness: 0.5 });
  const torchFlameMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
  const torchCoords = [{ x: -4.5, z: 0 }, { x: 4.5, z: 0 }, { x: 0, z: -4.5 }, { x: 0, z: 4.5 }];
  torchCoords.forEach(tc => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.5, 12), torchMat);
    pillar.position.set(tc.x, 1.25, tc.z);
    revivalCircleGroupLocal.add(pillar);

    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), torchFlameMat);
    flame.position.set(tc.x, 2.7, tc.z);
    revivalCircleGroupLocal.add(flame);
  });

  const revivalLight = new THREE.PointLight(0xff334b, 3.0, 20);
  revivalLight.position.set(0, 3.0, 0);
  revivalCircleGroupLocal.add(revivalLight);

  revivalCircleGroup = revivalCircleGroupLocal;
  churchGroup.add(revivalCircleGroupLocal);
  createSpaceSign(30, 4.2, -6, "🔥 [동관] 전 신도 합심 통성기도 성령존 (진입 시 양봉 게이지 2배 가속!)", 0xff334b, churchGroup);
}

// 3D 공간 표지판 - 어디서 보든 정면을 향하는 고화질 네온 빌보드 홀로그램
const signSpriteList = [];

function createSpaceSign(x, y, z, textStr, colorHex, parent) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d');

  // 1. 반투명 다크 크림슨/옵시디언 배경
  const bgGrad = ctx.createLinearGradient(0, 0, 1024, 256);
  bgGrad.addColorStop(0, 'rgba(12, 6, 16, 0.92)');
  bgGrad.addColorStop(0.5, 'rgba(28, 12, 24, 0.88)');
  bgGrad.addColorStop(1, 'rgba(12, 6, 16, 0.92)');

  // 둥근 사각형 배경 그리기
  const rx = 16, ry = 16, rw = 1024 - 32, rh = 256 - 32, radius = 32;
  ctx.beginPath();
  ctx.moveTo(rx + radius, ry);
  ctx.lineTo(rx + rw - radius, ry);
  ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
  ctx.lineTo(rx + rw, ry + rh - radius);
  ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
  ctx.lineTo(rx + radius, ry + rh);
  ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
  ctx.lineTo(rx, ry + radius);
  ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
  ctx.closePath();
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // 2. 화려한 네온 발광 테두리 (2중 스트로크)
  const hexStr = '#' + new THREE.Color(colorHex).getHexString();
  ctx.save();
  ctx.strokeStyle = hexStr;
  ctx.lineWidth = 8;
  ctx.shadowColor = hexStr;
  ctx.shadowBlur = 24;
  ctx.stroke();
  ctx.restore();

  // 골드 내부 얇은 테두리
  ctx.strokeStyle = '#f5c542';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 3. 상단 미니 서브 헤더 (성전 구역 인증)
  ctx.font = 'bold 24px "Noto Sans KR", sans-serif';
  ctx.fillStyle = '#f5c542';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('† GAZUA SACRED SHRINE †', 512, 58);

  // 4. 메인 텍스트 (굵고 선명한 외곽선 + 밝은 네온 컬러)
  ctx.font = 'bold 44px "Noto Sans KR", sans-serif';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.strokeText(textStr, 512, 142);

  ctx.fillStyle = hexStr;
  ctx.shadowColor = hexStr;
  ctx.shadowBlur = 12;
  ctx.fillText(textStr, 512, 142);

  // 5. 하단 얇은 황금 장식선
  ctx.strokeStyle = 'rgba(245, 197, 66, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(256, 210);
  ctx.lineTo(768, 210);
  ctx.stroke();

  // Three.js 카메라 빌보드 Sprite 생성 (언제나 카메라 정면을 바라봄!)
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: true,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(mat);
  // 비율: 1024:256 = 4:1 -> 크기 7.2 x 1.8
  sprite.scale.set(7.2, 1.8, 1.0);
  sprite.position.set(x, y, z);
  parent.add(sprite);

  // 부유 애니메이션용 기준 Y좌표 기록
  sprite.userData = { baseY: y, phase: Math.random() * Math.PI * 2 };
  signSpriteList.push(sprite);

  return sprite;
}

// 분수 파티클
function initFountainParticles(fx, fy, fz) {
  fountainParticles = [];
  const geo = new THREE.SphereGeometry(0.08, 6, 6);
  const mat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });

  for (let i = 0; i < 40; i++) {
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    fountainParticles.push({
      mesh,
      origin: new THREE.Vector3(fx, fy, fz),
      pos: new THREE.Vector3(fx, fy, fz),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 1.8,
        2.5 + Math.random() * 2.5,
        (Math.random() - 0.5) * 1.8
      ),
      life: Math.random() * 1.5
    });
  }
}

function updateFountainParticles(dt) {
  fountainParticles.forEach(p => {
    p.life += dt;
    if (p.life > 1.4) {
      p.life = 0;
      p.pos.copy(p.origin);
      p.vel.set(
        (Math.random() - 0.5) * 2.2,
        3.0 + Math.random() * 2.5,
        (Math.random() - 0.5) * 2.2
      );
    }
    p.vel.y -= 7.0 * dt; // 중력
    p.pos.addScaledVector(p.vel, dt);
    p.mesh.position.copy(p.pos);
  });
}

function setupClickMarker() {
  const markerGroup = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xf5c542 });

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.45, 16), mat);
  ring.rotation.x = -Math.PI / 2;
  markerGroup.add(ring);

  const crossV = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.6), mat);
  crossV.rotation.x = -Math.PI / 2;
  markerGroup.add(crossV);

  const crossH = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.1), mat);
  crossH.rotation.x = -Math.PI / 2;
  markerGroup.add(crossH);

  markerGroup.position.set(0, 0.08, 0);
  markerGroup.visible = false;
  scene.add(markerGroup);
  clickMarkerMesh = markerGroup;
}

function updateAltarScreenCanvas() {
  if (!altarScreenCtx) return;
  const ctx = altarScreenCtx;
  const w = altarScreenCanvas.width;
  const h = altarScreenCanvas.height;
  const data = STATE.roomData[STATE.currentRoom];

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1c0a10');
  grad.addColorStop(1, '#0d0407');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const isUp = data.changeRate >= 0;
  ctx.strokeStyle = isUp ? '#ff334b' : '#3282f6';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  ctx.fillStyle = '#f5c542';
  ctx.font = 'bold 36px "Noto Serif KR", serif';
  ctx.textAlign = 'center';
  ctx.fillText(`† 대한예수교 가즈아장로회 ${data.name} †`, w / 2, 60);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '20px "Noto Sans KR", sans-serif';
  ctx.fillText('“구하라, 그리하면 떡상을 주실 것이요! 가즈아아아멘!”', w / 2, 95);

  const sign = isUp ? '▲' : '▼';
  const color = isUp ? '#ff334b' : '#3282f6';

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px "Noto Sans KR", sans-serif';
  const priceFormatted = data.isCrypto
    ? `${data.price.toLocaleString('ko-KR')} KRW`
    : (data.symbol === 'TSLA' || data.symbol === 'NVDA')
      ? `$${data.price.toFixed(2)}`
      : `${data.price.toLocaleString('ko-KR')} 원`;
  ctx.fillText(priceFormatted, w / 2, 175);

  ctx.fillStyle = color;
  ctx.font = 'bold 34px "Noto Sans KR", sans-serif';
  ctx.fillText(`${sign} ${(Math.abs(data.changeRate) * 100).toFixed(2)}%`, w / 2, 225);

  // 미니 차트
  const chartX = 120, chartY = 270, chartW = w - 240, chartH = 170;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(chartX, chartY, chartW, chartH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(chartX, chartY, chartW, chartH);

  const hist = STATE.priceHistory;
  const minP = Math.min(...hist) * 0.998;
  const maxP = Math.max(...hist) * 1.002;
  const stepX = chartW / (hist.length + 1);

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  hist.forEach((p, idx) => {
    const px = chartX + stepX * (idx + 1);
    const py = chartY + chartH - ((p - minP) / (maxP - minP)) * (chartH - 30) - 15;
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);

    ctx.fillStyle = '#f5c542';
    ctx.fillRect(px - 3, py - 3, 6, 6);
  });
  ctx.stroke();

  const totalVotes = STATE.longVotes + STATE.shortVotes;
  const longPercent = Math.round((STATE.longVotes / totalVotes) * 100);
  ctx.fillStyle = '#f5c542';
  ctx.font = 'bold 22px "Noto Sans KR", sans-serif';
  ctx.fillText(`실시간 롱숏 성전: [결사 롱 ${longPercent}%] VS [회개 숏 ${100 - longPercent}%]`, w / 2, 480);

  if (altarScreenTexture) altarScreenTexture.needsUpdate = true;
}

// ==========================================
// 2. 캐릭터 생성 & 외형 커스터마이징 시스템
// ==========================================
function createCuteCultist({
  isPlayer = false,
  id = null,
  name = "신도",
  level = 1,
  title = "초신자",
  robeColor = "white",
  hatType = "halo",
  wingsType = "angel",
  beltType = "long",
  pos = { x: 0, y: 0, z: 0 }
} = {}) {
  const root = new THREE.Group();
  root.position.set(pos.x, pos.y, pos.z);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfd3, roughness: 0.45 });
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xff6b8b });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x150b10 });
  const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0xc44569 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf5c542, metalness: 0.85, roughness: 0.25 });
  const footMat = new THREE.MeshStandardMaterial({ color: 0xffc4b8, roughness: 0.5 });

  // 로브 & 띠 머티리얼 (동적 변경 지원)
  const robeColorHex = COLOR_PALETTE[robeColor] || 0xfffcf5;
  const robeMat = new THREE.MeshStandardMaterial({ color: robeColorHex, roughness: 0.75 });

  const beltColorHex = COLOR_PALETTE[beltType] || 0xff3352;
  const beltMat = new THREE.MeshStandardMaterial({ color: beltColorHex, roughness: 0.4 });

  // 오라 슬롯 (레벨 10+ 황금빛/불꽃 오라)
  const auraSlot = new THREE.Group();
  root.add(auraSlot);

  // 1. 몸통 (아기자기한 꼬마 로브 바디)
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const body = new THREE.Mesh(SHARED_GEO.body, robeMat);
  body.position.y = 0.68;
  if (isPlayer) body.castShadow = true;
  bodyGroup.add(body);

  // 허리 띠 (Sash)
  const sash = new THREE.Mesh(SHARED_GEO.sash, beltMat);
  sash.position.y = 0.82;
  bodyGroup.add(sash);

  // 귀여운 앙증맞은 양발
  const footL = new THREE.Mesh(SHARED_GEO.foot, footMat);
  footL.position.set(-0.2, 0.08, 0.05);
  root.add(footL);

  const footR = new THREE.Mesh(SHARED_GEO.foot, footMat);
  footR.position.set(0.2, 0.08, 0.05);
  root.add(footR);

  // 2. 얼굴 (초롱초롱 모찌 치비 베이비 페이스)
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.50; // 몸통에 자연스럽고 귀엽게 안착
  root.add(headGroup);

  const head = new THREE.Mesh(SHARED_GEO.head, skinMat);
  head.scale.set(1.14, 1.04, 1.10); // 포동포동 아기자기한 모찌 볼살
  if (isPlayer) head.castShadow = true;
  headGroup.add(head);

  // 귀여운 둥글둥글 꼬마 귀 (Cute Chibi Ears)
  const earL = new THREE.Mesh(SHARED_GEO.ear, skinMat);
  earL.position.set(-0.52, 0.02, 0);
  earL.scale.set(0.75, 0.75, 0.55);
  headGroup.add(earL);

  const earR = new THREE.Mesh(SHARED_GEO.ear, skinMat);
  earR.position.set(0.52, 0.02, 0);
  earR.scale.set(0.75, 0.75, 0.55);
  headGroup.add(earR);

  // 왼쪽 눈 + 반짝이 하이라이트 2개
  const eyeL = new THREE.Mesh(SHARED_GEO.eye, eyeMat);
  eyeL.position.set(-0.16, 0.05, 0.44);
  eyeL.scale.set(1.0, 1.20, 0.9);
  headGroup.add(eyeL);

  const shineL1 = new THREE.Mesh(SHARED_GEO.eyeHighlightL, shineMat);
  shineL1.position.set(-0.02, 0.035, 0.075);
  eyeL.add(shineL1);
  const shineL2 = new THREE.Mesh(SHARED_GEO.eyeHighlightS, shineMat);
  shineL2.position.set(0.028, -0.028, 0.075);
  eyeL.add(shineL2);

  // 오른쪽 눈 + 반짝이 하이라이트 2개
  const eyeR = new THREE.Mesh(SHARED_GEO.eye, eyeMat);
  eyeR.position.set(0.16, 0.05, 0.44);
  eyeR.scale.set(1.0, 1.20, 0.9);
  headGroup.add(eyeR);

  const shineR1 = new THREE.Mesh(SHARED_GEO.eyeHighlightL, shineMat);
  shineR1.position.set(-0.02, 0.035, 0.075);
  eyeR.add(shineR1);
  const shineR2 = new THREE.Mesh(SHARED_GEO.eyeHighlightS, shineMat);
  shineR2.position.set(0.028, -0.028, 0.075);
  eyeR.add(shineR2);

  // 도톰하고 사랑스러운 핑크 볼터치 (Cute Rosy Cheeks)
  const blushL = new THREE.Mesh(SHARED_GEO.blush, blushMat);
  blushL.position.set(-0.31, -0.07, 0.40);
  blushL.scale.set(1.2, 0.75, 0.75);
  headGroup.add(blushL);

  const blushR = new THREE.Mesh(SHARED_GEO.blush, blushMat);
  blushR.position.set(0.31, -0.07, 0.40);
  blushR.scale.set(1.2, 0.75, 0.75);
  headGroup.add(blushR);

  // 앙증맞은 쁘띠 미소 입 (ω)
  const mouth = new THREE.Mesh(SHARED_GEO.mouth, mouthMat);
  mouth.rotation.x = Math.PI / 2;
  mouth.position.set(0, -0.10, 0.46);
  headGroup.add(mouth);

  // 머리 장식 슬롯
  const hatSlot = new THREE.Group();
  headGroup.add(hatSlot);

  // 날개 슬롯
  const wingsSlot = new THREE.Group();
  root.add(wingsSlot);

  // 3. 양팔 & 앙증맞은 작은 손
  const armL = new THREE.Group();
  armL.position.set(-0.45, 1.15, 0);
  const sleeveL = new THREE.Mesh(SHARED_GEO.arm, robeMat);
  sleeveL.position.y = -0.28;
  armL.add(sleeveL);
  const handL = new THREE.Mesh(SHARED_GEO.hand, skinMat);
  handL.position.set(0, -0.62, 0);
  armL.add(handL);
  root.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.45, 1.15, 0);
  const sleeveR = new THREE.Mesh(SHARED_GEO.arm, robeMat);
  sleeveR.position.y = -0.28;
  armR.add(sleeveR);
  const handR = new THREE.Mesh(SHARED_GEO.hand, skinMat);
  handR.position.set(0, -0.62, 0);
  armR.add(handR);

  const staff = new THREE.Group();
  staff.position.set(0, -0.45, 0.15);
  const staffPole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 8), goldMat);
  staff.add(staffPole);
  const staffCross = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.04), goldMat);
  staffCross.position.y = 0.25;
  staff.add(staffCross);
  armR.add(staff);

  root.add(armR);

  if (!isPlayer) {
    root.traverse(o => { o.castShadow = false; });
  }

  scene.add(root);

  const cultistObj = {
    group: root,
    bodyGroup,
    headGroup,
    body,
    sash,
    hatSlot,
    wingsSlot,
    auraSlot,
    auraMeshes: [],
    armL,
    armR,
    footL,
    footR,
    eyeL,
    eyeR,
    mouth,
    robeMat,
    beltMat,
    isPlayer,
    id,
    name,
    level,
    title,
    robeColor,
    hatType,
    wingsType,
    beltType,
    state: 'idle',
    stateTimer: 0,
    baseY: pos.y,
    // 점프 & 물리 상태
    isJumping: false,
    jumpVelocity: 0,
    jumpY: 0,
    standingPlatformY: 0,
    squashTimer: 0,
    // 깜빡임 타이머
    blinkTimer: 2.0 + Math.random() * 2.5,
    blinkDuration: 0,
    isWalking: false,
    walkSpeed: 4.8,
    targetPos: new THREE.Vector3(pos.x, pos.y, pos.z)
  };

  // 모자 & 날개 파츠 & 계급 오라 장착
  applyHatParts(cultistObj, hatType);
  applyWingsParts(cultistObj, wingsType);
  updatePlayerAura(cultistObj, level);

  return cultistObj;
}

function updatePlayerAura(c, level) {
  if (!c || !c.auraSlot) return;
  while (c.auraSlot.children.length > 0) {
    c.auraSlot.remove(c.auraSlot.children[0]);
  }
  c.auraMeshes = [];

  if (level < 10) return; // 레벨 10 이상부터 찬란한 오라 발현!

  // 1. 레벨 10~12: 황금빛 회전 오라 링
  const goldRingMat = new THREE.MeshBasicMaterial({ color: 0xf5c542, side: THREE.DoubleSide });
  const ring1 = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.82, 32), goldRingMat);
  ring1.rotation.x = -Math.PI / 2;
  ring1.position.y = 0.08;
  c.auraSlot.add(ring1);
  c.auraMeshes.push({ mesh: ring1, rotSpeed: 1.6, pulse: 1.0 });

  // 2. 레벨 13~16: 붉은 불꽃 양봉 오라 링 추가
  if (level >= 13) {
    const redRingMat = new THREE.MeshBasicMaterial({ color: 0xff3352, side: THREE.DoubleSide });
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(0.88, 0.96, 32), redRingMat);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = 0.14;
    c.auraSlot.add(ring2);
    c.auraMeshes.push({ mesh: ring2, rotSpeed: -2.2, pulse: 1.2 });

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const spark = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), new THREE.MeshBasicMaterial({ color: 0xff334b }));
      spark.position.set(Math.cos(angle) * 0.75, 0.4, Math.sin(angle) * 0.75);
      c.auraSlot.add(spark);
      c.auraMeshes.push({ mesh: spark, rotSpeed: 1.2, floatOffset: i });
    }
  }

  // 3. 레벨 17~19: 천상계 거대 황금 후광
  if (level >= 17) {
    const giantHalo = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.06, 12, 32), goldRingMat);
    giantHalo.rotation.x = Math.PI / 2;
    giantHalo.position.set(0, 0.95, 0);
    c.auraSlot.add(giantHalo);
    c.auraMeshes.push({ mesh: giantHalo, rotSpeed: 0.8, pulse: 0.8 });
  }

  // 4. 레벨 20: [대양봉교 교주] 영구 황금 빛기둥
  if (level >= 20) {
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 12, 16, 1, true), beamMat);
    beam.position.y = 6.0;
    c.auraSlot.add(beam);
    c.auraMeshes.push({ mesh: beam, rotSpeed: 0.6 });
  }
}

function applyHatParts(c, hatType) {
  // 기존 모자 제거
  while (c.hatSlot.children.length > 0) {
    c.hatSlot.remove(c.hatSlot.children[0]);
  }
  c.hatType = hatType;
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf5c542, metalness: 0.85, roughness: 0.25 });

  if (hatType === 'halo') {
    const halo = new THREE.Mesh(SHARED_GEO.halo, goldMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, 0.58, 0);
    c.hatSlot.add(halo);
    c.haloMesh = halo;
  } else if (hatType === 'horns') {
    const redMat = new THREE.MeshStandardMaterial({ color: 0xff2244 });
    const hornL = new THREE.Mesh(SHARED_GEO.horns, redMat);
    hornL.position.set(-0.24, 0.42, 0.08);
    hornL.rotation.z = -0.3;
    const hornR = new THREE.Mesh(SHARED_GEO.horns, redMat);
    hornR.position.set(0.24, 0.42, 0.08);
    hornR.rotation.z = 0.3;
    c.hatSlot.add(hornL, hornR);
  } else if (hatType === 'candle') {
    const candleMesh = new THREE.Mesh(SHARED_GEO.candleHat, new THREE.MeshStandardMaterial({ color: 0xfffcf5 }));
    candleMesh.position.set(0, 0.55, 0);
    const flame = new THREE.Mesh(SHARED_GEO.spark, new THREE.MeshBasicMaterial({ color: 0xff3352 }));
    flame.position.y = 0.22;
    candleMesh.add(flame);
    c.hatSlot.add(candleMesh);
  } else if (hatType === 'catears') {
    const earMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xff7799 });
    const earL = new THREE.Mesh(SHARED_GEO.catEar, earMat);
    earL.position.set(-0.25, 0.42, 0);
    const innerL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 4), innerMat);
    innerL.position.set(0, 0, 0.04);
    earL.add(innerL);

    const earR = new THREE.Mesh(SHARED_GEO.catEar, earMat);
    earR.position.set(0.25, 0.42, 0);
    const innerR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 4), innerMat);
    innerR.position.set(0, 0, 0.04);
    earR.add(innerR);
    c.hatSlot.add(earL, earR);
  } else if (hatType === 'crown') {
    const crownMesh = new THREE.Mesh(SHARED_GEO.crown, goldMat);
    crownMesh.position.set(0, 0.48, 0);
    for (let i = 0; i < 4; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.10, 4), goldMat);
      const a = (i / 4) * Math.PI * 2;
      spike.position.set(Math.cos(a) * 0.14, 0.11, Math.sin(a) * 0.14);
      crownMesh.add(spike);
    }
    c.hatSlot.add(crownMesh);
  } else if (hatType === 'witch') {
    const purpleMat = new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.5 });
    const brim = new THREE.Mesh(SHARED_GEO.witchBrim, purpleMat);
    brim.position.set(0, 0.40, 0);
    const cone = new THREE.Mesh(SHARED_GEO.witchHat, purpleMat);
    cone.position.set(0, 0.22, -0.05);
    cone.rotation.x = -0.15;
    brim.add(cone);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), goldMat);
    star.position.set(0, 0.46, -0.08);
    brim.add(star);
    c.hatSlot.add(brim);
  }
}

function applyWingsParts(c, wingsType) {
  while (c.wingsSlot.children.length > 0) {
    c.wingsSlot.remove(c.wingsSlot.children[0]);
  }
  c.wingsType = wingsType;

  if (wingsType === 'none') {
    c.wingL = null;
    c.wingR = null;
    return;
  }

  const wingMat = wingsType === 'mecha'
    ? new THREE.MeshStandardMaterial({ color: 0xf5c542, metalness: 0.9, roughness: 0.2 })
    : wingsType === 'devil'
      ? new THREE.MeshStandardMaterial({ color: 0x9e1322, roughness: 0.4 })
      : new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

  const geo = wingsType === 'devil' ? SHARED_GEO.wingDevil : SHARED_GEO.wingAngel;

  const wL = new THREE.Group();
  wL.position.set(-0.22, 0.9, -0.32);
  const meshL = new THREE.Mesh(geo, wingMat);
  meshL.position.set(-0.15, 0.1, 0);
  meshL.rotation.y = Math.PI / 6;
  wL.add(meshL);

  const wR = new THREE.Group();
  wR.position.set(0.22, 0.9, -0.32);
  const meshR = new THREE.Mesh(geo, wingMat);
  meshR.position.set(0.15, 0.1, 0);
  meshR.rotation.y = -Math.PI / 6;
  wR.add(meshR);

  c.wingsSlot.add(wL, wR);
  c.wingL = wL;
  c.wingR = wR;
}

// ------------------------------------------
// 3D 네임태그 명찰 시스템
// ------------------------------------------
function addNameTag(cultist, isMe = false) {
  const tag = document.createElement('div');
  tag.className = `name-tag ${isMe ? 'me' : ''}`;
  tag.textContent = cultist.name;
  document.body.appendChild(tag);

  cultist.nameTagEl = tag;
  nameTags.push({ cultist, element: tag });
}

function updateNameTags() {
  const tempV = new THREE.Vector3();
  for (let i = nameTags.length - 1; i >= 0; i--) {
    const item = nameTags[i];
    if (!item.cultist || !item.cultist.group.parent) {
      item.element.remove();
      nameTags.splice(i, 1);
      continue;
    }

    item.cultist.group.getWorldPosition(tempV);
    tempV.y += 2.3;
    tempV.project(camera);

    if (tempV.z > 1) {
      item.element.style.display = 'none';
      continue;
    }

    item.element.style.display = 'block';
    const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;
    item.element.style.left = `${x}px`;
    item.element.style.top = `${y}px`;
  }
}

// ==========================================
// 2.5 은혜 미션, 레벨/등급 시스템 및 기물 충돌 물리
// ==========================================
function loadUserProgress() {
  try {
    const raw = localStorage.getItem('GAZUA_USER_PROGRESS');
    if (raw) {
      const data = JSON.parse(raw);
      STATE.playerLevel = data.level || 1;
      STATE.playerExp = data.exp || 0;
      STATE.playerRankTitle = getRankByLevel(STATE.playerLevel).title;
      if (Array.isArray(data.missions)) {
        DAILY_MISSIONS.forEach(m => {
          const saved = data.missions.find(s => s.id === m.id);
          if (saved) {
            m.current = saved.current || 0;
            m.done = saved.done || false;
          }
        });
      }
    }
  } catch (e) {
    console.warn('Progress load error:', e);
  }
  renderMissionsUI();
}

function saveUserProgress() {
  try {
    const data = {
      level: STATE.playerLevel,
      exp: STATE.playerExp,
      missions: DAILY_MISSIONS.map(m => ({ id: m.id, current: m.current, done: m.done }))
    };
    localStorage.setItem('GAZUA_USER_PROGRESS', JSON.stringify(data));
  } catch (e) {}
}

function getRankByLevel(lvl) {
  return CULT_RANKS.find(r => r.level === lvl) || CULT_RANKS[0];
}

function addExp(amount) {
  STATE.playerExp += amount;
  let curRank = getRankByLevel(STATE.playerLevel);

  // 레벨업 체크 (최대 20레벨 대양봉교 교주까지 지원)
  while (STATE.playerLevel < 20 && STATE.playerExp >= curRank.expReq) {
    STATE.playerLevel += 1;
    curRank = getRankByLevel(STATE.playerLevel);
    STATE.playerRankTitle = curRank.title;
    showLevelUpCelebration(STATE.playerLevel, curRank.title);
    if (playerCharacter) {
      updatePlayerAura(playerCharacter, STATE.playerLevel);
    }
  }

  saveUserProgress();
  renderMissionsUI();
  updatePlayerNameTag();
}

function addMissionProgress(missionId, amount = 1) {
  const m = DAILY_MISSIONS.find(item => item.id === missionId);
  if (!m || m.done) return;

  m.current = Math.min(m.target, m.current + amount);
  if (m.current >= m.target && !m.done) {
    m.done = true;
    addExp(m.rewardExp);
    if (playerCharacter) {
      showSpeechBubble(playerCharacter, `[${m.title}] 완료! +${m.rewardExp} EXP!`);
    }
  }
  saveUserProgress();
  renderMissionsUI();
}

function showLevelUpCelebration(lvl, title) {
  if (window.gajaAudio) {
    window.gajaAudio.playLevelUpSfx();
  }

  const banner = document.getElementById('levelUpBanner');
  const desc = document.getElementById('levelupDesc');
  if (banner && desc) {
    desc.textContent = `축하합니다! [Lv.${lvl} ${title}]으로 은혜 승급하셨습니다!`;
    banner.classList.add('active');
    setTimeout(() => { banner.classList.remove('active'); }, 4200);
  }

  if (playerCharacter) {
    spawnOfferingCoins(playerCharacter.group.position);
    showSpeechBubble(playerCharacter, `† [Lv.${lvl} ${title}] 승급! 할렐루야! †`);
  }

  if (STATE.multiWs && STATE.multiWs.readyState === WebSocket.OPEN) {
    STATE.multiWs.send(JSON.stringify({
      type: 'level_up',
      level: lvl,
      title: title,
      name: STATE.playerName
    }));
  }
}

function renderMissionsUI() {
  const rank = getRankByLevel(STATE.playerLevel);
  const badgeEl = document.getElementById('headerRankBadge');
  if (badgeEl) badgeEl.textContent = `Lv.${STATE.playerLevel} ${rank.title}`;

  const modalBadge = document.getElementById('modalRankBadge');
  if (modalBadge) modalBadge.textContent = `Lv.${STATE.playerLevel}`;

  const modalTitle = document.getElementById('modalRankTitle');
  if (modalTitle) modalTitle.textContent = `[${rank.title}]`;

  const modalName = document.getElementById('modalPlayerName');
  if (modalName) modalName.textContent = STATE.playerName;

  const expFill = document.getElementById('modalExpFill');
  const expText = document.getElementById('modalExpText');
  if (expFill && expText) {
    if (STATE.playerLevel >= 20) {
      expFill.style.width = '100%';
      expText.textContent = `${STATE.playerExp} EXP (대양봉교 교주 최고 등급 달성)`;
    } else {
      const prevReq = STATE.playerLevel === 1 ? 0 : getRankByLevel(STATE.playerLevel - 1).expReq;
      const curReq = rank.expReq;
      const progress = Math.min(1, Math.max(0, (STATE.playerExp - prevReq) / (curReq - prevReq)));
      const pct = Math.round(progress * 100);
      expFill.style.width = `${pct}%`;
      expText.textContent = `${STATE.playerExp} / ${curReq} EXP (${pct}%)`;
    }
  }

  const listEl = document.getElementById('missionListContainer');
  if (listEl) {
    listEl.innerHTML = DAILY_MISSIONS.map(m => `
      <div class="mission-item ${m.done ? 'completed' : ''}">
        <div class="mission-left">
          <span class="mission-icon">${m.icon}</span>
          <div>
            <div class="mission-title">${m.title}</div>
            <div style="font-size:10.5px; color:rgba(255,255,255,0.6);">${m.desc} (${m.current}/${m.target})</div>
          </div>
        </div>
        <div class="mission-right">
          <span class="mission-reward">+${m.rewardExp} EXP</span>
          <span class="mission-status">${m.done ? '✓ 완료' : '진행중'}</span>
        </div>
      </div>
    `).join('');
  }

  // 20단계 신도 계급 로드맵 동적 렌더링
  const roadmapEl = document.getElementById('rankRoadmapContainer');
  if (roadmapEl) {
    roadmapEl.innerHTML = CULT_RANKS.map(r => `
      <div class="rank-step ${r.level === STATE.playerLevel ? 'highlight' : ''}">
        <span class="r-lvl">Lv.${r.level}</span> ${r.title}
        <div class="r-desc">${r.desc || ''} (필요: ${r.expReq === 999999 ? '최고존엄' : `${r.expReq} EXP`})</div>
      </div>
    `).join('');
  }
}

function updatePlayerNameTag() {
  if (playerCharacter && playerCharacter.nameTagEl) {
    const rank = getRankByLevel(STATE.playerLevel);
    playerCharacter.name = `[Lv.${STATE.playerLevel} ${rank.title}] ${STATE.playerName}`;
    playerCharacter.nameTagEl.innerHTML = `<span>${playerCharacter.name}</span>`;
  }
}

// ----------------------------------------------------
// 성전 바닥 및 제단 단상/계단 높이 계산 (Stairs & Dais Height)
// ----------------------------------------------------
function getTempleFloorY(x, z) {
  // 1. 2층 세력 영생 VIP 성가대 테라스 발코니
  if (z >= 19.5 && z <= 24.5 && Math.abs(x) <= 12) {
    return 3.2;
  }

  // 2. 본당 제단 단상 3단 (최상단 제단 단상: Z <= -7.6 && Z >= -14.6, |X| <= 9)
  if (z <= -7.6 && z >= -14.6 && Math.abs(x) <= 9.0) {
    return 1.35;
  }
  // 제단 계단 2단 (Z <= -6.05 && Z >= -14.55, |X| <= 10)
  if (z <= -6.05 && z >= -14.55 && Math.abs(x) <= 10.0) {
    return 0.90;
  }
  // 제단 계단 1단 (Z <= -4.5 && Z >= -14.5, |X| <= 11)
  if (z <= -4.5 && z >= -14.5 && Math.abs(x) <= 11.0) {
    return 0.45;
  }

  return 0;
}

// ----------------------------------------------------
// 성전 기물 충돌 판정 및 점프 뛰어넘기 (Obstacle Jumping)
// ----------------------------------------------------
function resolveObstacleCollision(currX, currZ, nextX, nextZ, playerFootY) {
  let resolvedX = nextX;
  let resolvedZ = nextZ;
  let standingPlatformY = 0;
  const playerRadius = 0.42;

  for (const obs of TEMPLE_OBSTACLES) {
    if (obs.type === 'box') {
      const halfW = obs.w / 2;
      const halfD = obs.d / 2;
      const minX = obs.x - halfW - playerRadius;
      const maxX = obs.x + halfW + playerRadius;
      const minZ = obs.z - halfD - playerRadius;
      const maxZ = obs.z + halfD + playerRadius;

      // 박스 범위 내에 진입 검사
      if (resolvedX >= minX && resolvedX <= maxX && resolvedZ >= minZ && resolvedZ <= maxZ) {
        // 내 발 높이가 기물 높이(obs.h)보다 높으면 기물 위 통과 & 윗면 착지 허용!
        if (playerFootY >= obs.h - 0.22) {
          standingPlatformY = Math.max(standingPlatformY, obs.h);
          if (playerCharacter && playerCharacter.isJumping) {
            addMissionProgress('pilgrimage', 1);
          }
        } else {
          // 기물보다 낮으므로 충돌! 기물 경계 밖으로 슬라이딩
          const overlapL = resolvedX - minX;
          const overlapR = maxX - resolvedX;
          const overlapB = resolvedZ - minZ;
          const overlapF = maxZ - resolvedZ;
          const minO = Math.min(overlapL, overlapR, overlapB, overlapF);

          if (minO === overlapL) resolvedX = minX;
          else if (minO === overlapR) resolvedX = maxX;
          else if (minO === overlapB) resolvedZ = minZ;
          else resolvedZ = maxZ;
        }
      }
    } else if (obs.type === 'cyl') {
      const dx = resolvedX - obs.x;
      const dz = resolvedZ - obs.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const minDist = obs.r + playerRadius;

      if (dist < minDist) {
        if (playerFootY >= obs.h - 0.22) {
          standingPlatformY = Math.max(standingPlatformY, obs.h);
          if (playerCharacter && playerCharacter.isJumping) {
            addMissionProgress('pilgrimage', 1);
          }
        } else {
          if (dist > 0.001) {
            resolvedX = obs.x + (dx / dist) * minDist;
            resolvedZ = obs.z + (dz / dist) * minDist;
          } else {
            resolvedX = obs.x + minDist;
          }
        }
      }
    } else if (obs.type === 'ring') {
      const dx = resolvedX - obs.x;
      const dz = resolvedZ - obs.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist >= obs.rMin - playerRadius && dist <= obs.rMax + playerRadius) {
        if (playerFootY >= obs.h - 0.22) {
          standingPlatformY = Math.max(standingPlatformY, obs.h);
          if (playerCharacter && playerCharacter.isJumping) {
            addMissionProgress('pilgrimage', 1);
          }
        } else {
          if (dist < (obs.rMin + obs.rMax) / 2) {
            resolvedX = obs.x + (dx / dist) * (obs.rMin - playerRadius);
            resolvedZ = obs.z + (dz / dist) * (obs.rMin - playerRadius);
          } else {
            resolvedX = obs.x + (dx / dist) * (obs.rMax + playerRadius);
            resolvedZ = obs.z + (dz / dist) * (obs.rMax + playerRadius);
          }
        }
      }
    }
  }

  return { x: resolvedX, z: resolvedZ, platformY: standingPlatformY };
}

// ----------------------------------------------------
// 스페이스바 점프 실행 함수
// ----------------------------------------------------
function triggerPlayerJump() {
  if (!playerCharacter) return;
  if (playerCharacter.isJumping) return;

  playerCharacter.isJumping = true;
  playerCharacter.jumpVelocity = 9.2; // 통통 튀는 경쾌한 점프
  playerCharacter.squashTimer = 0.18;

  if (window.gajaAudio) {
    window.gajaAudio.playJumpSfx();
  }

  addMissionProgress('jump', 1);
  triggerRitualAction(1, '상승 점프');

  if (STATE.multiWs && STATE.multiWs.readyState === WebSocket.OPEN) {
    STATE.multiWs.send(JSON.stringify({
      type: 'move',
      x: Math.round(playerCharacter.group.position.x * 100) / 100,
      y: Math.round((playerCharacter.group.position.y + 0.6) * 100) / 100,
      z: Math.round(playerCharacter.group.position.z * 100) / 100,
      ry: Math.round(playerCharacter.group.rotation.y * 100) / 100,
      jump: true
    }));
  }
}

// ==========================================
// 3. 캐릭터 이동 컨트롤러 (카메라 기준 WASD + 스페이스바 점프 + 마우스 클릭)
// ==========================================
function setupMovementControls() {
  window.addEventListener('keydown', (e) => {
    // 텍스트 인풋 포커스 시에만 이동 차단 (SELECT나 일반 버튼은 이동 허용)
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

    const key = e.key.toLowerCase();
    let handled = false;

    if (['w', 'arrowup'].includes(key)) { STATE.keys.w = true; handled = true; }
    if (['s', 'arrowdown'].includes(key)) { STATE.keys.s = true; handled = true; }
    if (['a', 'arrowleft'].includes(key)) { STATE.keys.a = true; handled = true; }
    if (['d', 'arrowright'].includes(key)) { STATE.keys.d = true; handled = true; }

    // 상호작용 (E 또는 F)
    if (['e', 'f'].includes(key)) {
      triggerProximityAction();
      handled = true;
    }

    // 스페이스바로 기쁨의 점프!
    if (e.code === 'Space' || key === ' ') {
      handled = true;
      triggerPlayerJump();
    }

    // 숫자키 1~0 신앙 액션 단축키
    if (key === '1') { triggerTonguePrayer(); handled = true; }
    else if (key === '2') { triggerSlainInSpirit(); handled = true; }
    else if (key === '3') { triggerOffering(); handled = true; }
    else if (key === '4') { triggerClap(); handled = true; }
    else if (key === '5') { triggerKneel(); handled = true; }
    else if (key === '6') { triggerDance(); handled = true; }
    else if (key === '7') { triggerMegaBull(); handled = true; }
    else if (key === '8') { triggerMoneyBless(); handled = true; }
    else if (key === '9') { triggerShout(); handled = true; }
    else if (key === '0') { triggerLevitate(); handled = true; }

    if (handled) {
      e.preventDefault();
      STATE.clickTargetPos = null;
      if (clickMarkerMesh) clickMarkerMesh.visible = false;
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (['w', 'arrowup'].includes(key)) STATE.keys.w = false;
    if (['s', 'arrowdown'].includes(key)) STATE.keys.s = false;
    if (['a', 'arrowleft'].includes(key)) STATE.keys.a = false;
    if (['d', 'arrowright'].includes(key)) STATE.keys.d = false;
  });

  // 점프 버튼 이벤트 바인딩 (PC 툴바 & 모바일 전용 우측 플로팅 점프 버튼)
  const jumpBtn = document.getElementById('btnJumpAction');
  if (jumpBtn) {
    jumpBtn.addEventListener('click', () => {
      triggerPlayerJump();
    });
  }

  const mJumpBtn = document.getElementById('mobileJumpFloatingBtn');
  if (mJumpBtn) {
    mJumpBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      triggerPlayerJump();
    });
  }

  // 모바일/태블릿 360도 가상 터치 조이스틱 (원형 물방울 썸스틱) 설정
  setupVirtualJoystick();

  // 미션 모달 열기 버튼 이벤트 바인딩
  const missionBtnTop = document.getElementById('btnOpenMissions');
  if (missionBtnTop) {
    missionBtnTop.addEventListener('click', () => {
      renderMissionsUI();
      document.getElementById('modalMissions').classList.add('active');
    });
  }
  const missionBtnSide = document.getElementById('btnOpenMissionsSide');
  if (missionBtnSide) {
    missionBtnSide.addEventListener('click', () => {
      renderMissionsUI();
      document.getElementById('modalMissions').classList.add('active');
    });
  }

  const canvasEl = document.getElementById('gl-canvas');
  canvasEl.addEventListener('pointerdown', (e) => {
    if (e.target !== canvasEl) return;

    window.focus();
    if (document.activeElement) document.activeElement.blur();

    mousePointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    mousePointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mousePointer, camera);

    // 1. 성전 특수 랜드마크 클릭 상호작용 (황소 성물상, 마왕 보스, 교주 왕좌, 숨겨진 황금 개미)
    const interactTargets = [];
    if (bullStatueGroup) interactTargets.push(bullStatueGroup);
    if (whaleStatueGroup) interactTargets.push(whaleStatueGroup);
    if (candleAltarGroup) interactTargets.push(candleAltarGroup);
    if (coinPondGroup) interactTargets.push(coinPondGroup);
    if (revivalCircleGroup) interactTargets.push(revivalCircleGroup);
    if (bossGroup && bossGroup.visible) interactTargets.push(bossGroup);
    if (throneMesh) interactTargets.push(throneMesh);
    if (goldAntMesh) interactTargets.push(goldAntMesh);

    const hitInteract = raycaster.intersectObjects(interactTargets, true);
    if (hitInteract.length > 0) {
      let root = hitInteract[0].object;
      while (root.parent && root.parent !== churchGroup && root.parent !== scene) {
        root = root.parent;
      }
      if (root === bullStatueGroup) {
        interactWithBullStatue();
        return;
      } else if (root === whaleStatueGroup) {
        interactWithWhaleStatue();
        return;
      } else if (root === candleAltarGroup) {
        interactWithCandleAltar();
        return;
      } else if (root === coinPondGroup) {
        interactWithCoinPond();
        return;
      } else if (root === revivalCircleGroup) {
        interactWithRevivalCircle();
        return;
      } else if (root === bossGroup) {
        sendBossHit(12);
        return;
      } else if (root === throneMesh) {
        interactWithThrone();
        return;
      } else if (root === goldAntMesh) {
        interactWithGoldAnt();
        return;
      }
    }

    // 2. 바닥 클릭 이동
    const intersects = raycaster.intersectObjects(floorMeshes);

    if (intersects.length > 0) {
      const hit = intersects[0].point;
      const targetX = Math.max(-46, Math.min(46, hit.x));
      const targetZ = Math.max(-15.5, Math.min(67, hit.z));
      const floorY = getTempleFloorY(targetX, targetZ);

      STATE.clickTargetPos = new THREE.Vector3(targetX, floorY, targetZ);

      if (clickMarkerMesh) {
        clickMarkerMesh.position.set(targetX, floorY + 0.08, targetZ);
        clickMarkerMesh.visible = true;
        clickMarkerMesh.scale.set(1, 1, 1);
      }
    }
  });
}

// ====================================================
// 모바일 / 태블릿 360도 가상 터치 조이스틱 (원형 물방울 썸스틱)
// ====================================================
function setupVirtualJoystick() {
  const container = document.getElementById('virtualJoystick');
  const base = document.getElementById('joystickBase');
  const knob = document.getElementById('joystickKnob');
  if (!container || !base || !knob) return;

  STATE.joystickDir = { x: 0, y: 0 };
  let activeTouchId = null;
  let baseRect = null;
  const maxRadius = 36; // 썸스틱 최대 반경 (픽셀)

  function updateKnobPosition(clientX, clientY) {
    if (!baseRect) baseRect = base.getBoundingClientRect();
    const centerX = baseRect.left + baseRect.width / 2;
    const centerY = baseRect.top + baseRect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    knob.style.transform = `translate(${dx}px, ${dy}px)`;

    // 정규화 벡터 (-1 ~ +1). 화면 위쪽이 음수이므로 캐릭터 전진(+Y)을 위해 -dy 적용
    STATE.joystickDir.x = dx / maxRadius;
    STATE.joystickDir.y = -dy / maxRadius;
  }

  function resetKnob() {
    activeTouchId = null;
    STATE.joystickDir = { x: 0, y: 0 };
    knob.classList.add('returning');
    knob.style.transform = 'translate(0px, 0px)';
  }

  // 터치 이벤트 리스너 (모바일/태블릿)
  container.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (activeTouchId !== null) return;
    const touch = e.changedTouches[0];
    activeTouchId = touch.identifier;
    baseRect = base.getBoundingClientRect();
    knob.classList.remove('returning');
    updateKnobPosition(touch.clientX, touch.clientY);
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (activeTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        e.preventDefault();
        updateKnobPosition(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  }, { passive: false });

  window.addEventListener('touchend', (e) => {
    if (activeTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        resetKnob();
        break;
      }
    }
  });

  window.addEventListener('touchcancel', (e) => {
    if (activeTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        resetKnob();
        break;
      }
    }
  });

  // PC 마우스 테스트 지원
  container.addEventListener('mousedown', (e) => {
    e.preventDefault();
    activeTouchId = 'mouse';
    baseRect = base.getBoundingClientRect();
    knob.classList.remove('returning');
    updateKnobPosition(e.clientX, e.clientY);

    const onMouseMove = (ev) => {
      if (activeTouchId === 'mouse') {
        updateKnobPosition(ev.clientX, ev.clientY);
      }
    };
    const onMouseUp = () => {
      resetKnob();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });
}

function updatePlayerMovement(dt) {
  if (!playerCharacter) return;

  const moveDir = new THREE.Vector3();
  let isMoving = false;

  // -------------------------------------------------------------------------
  // 화면 기준(Camera-relative) 3D 키보드 & 360도 가상 조이스틱 이동:
  // -------------------------------------------------------------------------
  if (camera) {
    const camForward = new THREE.Vector3();
    camera.getWorldDirection(camForward);
    camForward.y = 0;
    camForward.normalize();

    const camRight = new THREE.Vector3();
    camRight.crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

    // 1) 키보드 WASD
    if (STATE.keys.w) moveDir.add(camForward);
    if (STATE.keys.s) moveDir.sub(camForward);
    if (STATE.keys.a) moveDir.sub(camRight);
    if (STATE.keys.d) moveDir.add(camRight);

    // 2) 모바일 가상 조이스틱 (원형 물방울 썸스틱)
    if (STATE.joystickDir && (Math.abs(STATE.joystickDir.x) > 0.05 || Math.abs(STATE.joystickDir.y) > 0.05)) {
      moveDir.addScaledVector(camForward, STATE.joystickDir.y);
      moveDir.addScaledVector(camRight, STATE.joystickDir.x);
    }
  }

  const curPos = playerCharacter.group.position;
  let nextX = curPos.x;
  let nextZ = curPos.z;
  const speedMultiplier = STATE.hasBullBuff ? 1.35 : 1.0;

  if (moveDir.lengthSq() > 0) {
    moveDir.normalize();
    isMoving = true;
    STATE.clickTargetPos = null;
    if (clickMarkerMesh) clickMarkerMesh.visible = false;

    const targetAngle = Math.atan2(moveDir.x, moveDir.z);
    let diff = targetAngle - playerCharacter.group.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    playerCharacter.group.rotation.y += diff * Math.min(1, dt * 14);

    const step = playerCharacter.walkSpeed * speedMultiplier * dt;
    nextX += moveDir.x * step;
    nextZ += moveDir.z * step;
  } else if (STATE.clickTargetPos) {
    const diff = new THREE.Vector3().subVectors(STATE.clickTargetPos, curPos);
    diff.y = 0;
    const dist = diff.length();

    if (dist > 0.25) {
      diff.normalize();
      isMoving = true;

      const targetAngle = Math.atan2(diff.x, diff.z);
      let aDiff = targetAngle - playerCharacter.group.rotation.y;
      while (aDiff < -Math.PI) aDiff += Math.PI * 2;
      while (aDiff > Math.PI) aDiff -= Math.PI * 2;
      playerCharacter.group.rotation.y += aDiff * Math.min(1, dt * 14);

      const step = playerCharacter.walkSpeed * speedMultiplier * dt;
      nextX += diff.x * step;
      nextZ += diff.z * step;

      if (clickMarkerMesh && clickMarkerMesh.visible) {
        const s = 1.0 + Math.sin(clock.getElapsedTime() * 8) * 0.18;
        clickMarkerMesh.scale.set(s, s, s);
      }
    } else {
      STATE.clickTargetPos = null;
      if (clickMarkerMesh) clickMarkerMesh.visible = false;
    }
  }

  // ----------------------------------------------------
  // 성전 기물 충돌 판정 및 점프 뛰어넘기 처리
  // ----------------------------------------------------
  const currentFootY = curPos.y;
  const collision = resolveObstacleCollision(curPos.x, curPos.z, nextX, nextZ, currentFootY);

  curPos.x = collision.x;
  curPos.z = collision.z;
  playerCharacter.standingPlatformY = collision.platformY;

  // 맵 전체 외곽 경계 (성전 본당 단상 끝 -15.5m까지 개방)
  curPos.x = Math.max(-46, Math.min(46, curPos.x));
  curPos.z = Math.max(-15.5, Math.min(67, curPos.z));

  // 현재 위치에 따른 성전 바닥 / 계단 단상 / 2층 테라스 지면 높이 갱신
  playerCharacter.baseY = getTempleFloorY(curPos.x, curPos.z);

  // ----------------------------------------------------
  // 점프 수직 물리 & 계단 단상 오르기 (Gravity & Stair Climbing)
  // ----------------------------------------------------
  const targetGroundY = playerCharacter.baseY + playerCharacter.standingPlatformY;

  if (playerCharacter.isJumping) {
    playerCharacter.jumpVelocity -= 22 * dt; // 중력 적용
    playerCharacter.jumpY += playerCharacter.jumpVelocity * dt;

    if (playerCharacter.jumpY <= 0) {
      // 착지 완료!
      playerCharacter.jumpY = 0;
      playerCharacter.jumpVelocity = 0;
      playerCharacter.isJumping = false;
      playerCharacter.squashTimer = 0.22; // 착지 시 젤리 찌그러짐
    }
    curPos.y = targetGroundY + playerCharacter.jumpY;
  } else {
    // 걷거나 서 있을 때: 계단 단상을 걸어서 오르내리기 (스무스 스텝 승강)
    if (curPos.y < targetGroundY) {
      curPos.y = THREE.MathUtils.lerp(curPos.y, targetGroundY, Math.min(1, dt * 24));
      if (Math.abs(curPos.y - targetGroundY) < 0.02) curPos.y = targetGroundY;
    } else if (curPos.y > targetGroundY) {
      curPos.y = Math.max(targetGroundY, curPos.y - 14 * dt);
    } else {
      curPos.y = targetGroundY;
    }
  }

  playerCharacter.isWalking = isMoving;

  // 3인칭 스마트 카메라 추적
  if (controls && isMoving) {
    const curTarget = controls.target.clone();
    const newTarget = new THREE.Vector3(
      curPos.x,
      curPos.y + 1.6,
      curPos.z
    );
    const targetDelta = new THREE.Vector3().subVectors(newTarget, curTarget);

    controls.target.addScaledVector(targetDelta, Math.min(1, dt * 6));
    camera.position.addScaledVector(targetDelta, Math.min(1, dt * 6));
  }

  // 멀티플레이어 동기화 패킷 전송 (점프 상태 및 Y 좌표 포함)
  if ((isMoving || playerCharacter.isJumping) && STATE.multiWs && STATE.multiWs.readyState === WebSocket.OPEN) {
    const now = performance.now();
    if (now - STATE.lastMoveSendTime > 65) {
      STATE.lastMoveSendTime = now;
      STATE.multiWs.send(JSON.stringify({
        type: 'move',
        x: Math.round(curPos.x * 100) / 100,
        y: Math.round(curPos.y * 100) / 100,
        z: Math.round(curPos.z * 100) / 100,
        ry: Math.round(playerCharacter.group.rotation.y * 100) / 100,
        jump: playerCharacter.isJumping
      }));
    }
  }
}

// ==========================================
// 4. 애니메이션 틱 루프
// ==========================================
let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(0.1, clock.getDelta());
  const elapsed = clock.getElapsedTime();

  updatePlayerMovement(dt);

  if (neonCrossMesh) {
    const pulse = 1.0 + Math.sin(elapsed * 3.5) * 0.15;
    neonCrossMesh.scale.set(pulse, pulse, pulse);
    if (crossLight) {
      crossLight.intensity = 2.0 + Math.sin(elapsed * 3.5) * 0.8;
    }
  }

  // 3D 네온 홀로그램 표지판 은은한 부유 애니메이션
  if (signSpriteList && signSpriteList.length > 0) {
    for (let i = 0; i < signSpriteList.length; i++) {
      const s = signSpriteList[i];
      if (s && s.userData) {
        s.position.y = s.userData.baseY + Math.sin(elapsed * 2.0 + s.userData.phase) * 0.14;
      }
    }
  }

  // 1. 공매도 악귀 마왕 부유 및 체력바 카메라 주시
  if (bossGroup && bossGroup.visible) {
    bossGroup.position.y = 1.8 + Math.sin(elapsed * 2.2) * 0.25;
    if (bossHpBarMesh) {
      bossHpBarMesh.quaternion.copy(camera.quaternion);
    }
  }

  // 2. 대양봉 강림 초대형 캔들 불기둥 연출
  if (megaCandleMesh && STATE.ritualActive) {
    megaCandleMesh.position.y = Math.sin(elapsed * 4.0) * 0.6;
    if (megaCandleLight) {
      megaCandleLight.intensity = 2.5 + Math.sin(elapsed * 8.0) * 1.5;
    }
  }

  // 3. 황금 황소 성물상 은은한 호흡
  if (bullStatueGroup) {
    bullStatueGroup.position.y = Math.sin(elapsed * 1.5) * 0.08;
  }

  if (playerCharacter) {
    updateCultistAnimation(playerCharacter, dt, elapsed);
  }

  // 실제 온라인 유저들 애니메이션 & 보간 이동
  for (const cid in remotePeers) {
    const peer = remotePeers[cid];
    peer.group.position.lerp(peer.targetPos, dt * 10);
    updateCultistAnimation(peer, dt, elapsed);
  }

  updateFountainParticles(dt);
  updateParticles(dt);
  updateSpeechBubbles();
  updateNameTags();
  checkProximityInteractions();

  if (controls) controls.update();
  renderer.render(scene, camera);
}

// ==========================================
// 3.8 랜드마크 근접 실시간 감지 & 원클릭 상호작용 시스템
// ==========================================
let currentInteractTarget = null;
let lastInteractTime = 0;

function checkProximityInteractions() {
  if (!playerCharacter) return;

  const px = playerCharacter.group.position.x;
  const pz = playerCharacter.group.position.z;

  const container = document.getElementById('proximityActionContainer');
  const btn = document.getElementById('proximityActionBtn');
  const iconEl = document.getElementById('proximityActionIcon');
  const textEl = document.getElementById('proximityActionText');
  if (!container || !btn || !iconEl || !textEl) return;

  let target = null;
  let icon = '⚔️';
  let text = '상호작용';
  let isGold = false;

  // 1. 공매도 악귀 마왕 (서관: x < -16 && |z - 6| < 12)
  if (bossGroup && bossGroup.visible) {
    const distBoss = Math.hypot(px - (-31), pz - 6);
    if (distBoss < 14.0 || (px < -16 && Math.abs(pz - 6) < 12)) {
      target = 'boss';
      icon = '⚔️';
      text = `공매도 마왕 성수 퇴마! (HP: ${STATE.bossHp}/100)`;
      isGold = false;
    }
  }

  // 2. 성스러운 황금 황소 성물상 (남관: x ≈ 0, z ≈ 35.5)
  if (!target && bullStatueGroup) {
    const distBull = Math.hypot(px - 0, pz - 35.5);
    if (distBull < 8.0) {
      target = 'bull';
      icon = '🐂';
      text = STATE.hasBullBuff ? '황소 상한가 축복 가동 중! (이속 +35%)' : '황금 황소 성물 터치! (상한가 축복)';
      isGold = true;
    }
  }

  // 3. 숨겨진 황금 개미 성물 (동관 정원: x ≈ 32, z ≈ 16)
  if (!target && goldAntMesh) {
    const distAnt = Math.hypot(px - 32, pz - 16);
    if (distAnt < 7.0) {
      target = 'ant';
      icon = '🐜';
      text = STATE.hasFoundGoldAnt ? '황금 개미 은혜 획득 완료 (내일 리셋)' : '숨겨진 황금 개미 보물 줍기! (+80 EXP)';
      isGold = true;
    }
  }

  // 4. 교주의 황금 왕좌 (제단 위: x ≈ 0, z ≈ -13.8)
  if (!target && throneMesh) {
    const distThrone = Math.hypot(px - 0, pz - (-13.8));
    if (distThrone < 5.0) {
      target = 'throne';
      icon = '👑';
      text = STATE.playerLevel >= 20 ? '대양봉교 교주 황금 왕좌 착석!' : `교주의 황금 왕좌 (Lv.20 필요)`;
      isGold = true;
    }
  }

  // 5. 북관 100억 슈퍼고래 영생 참배원 (x ≈ 0, z ≈ -26)
  if (!target && whaleStatueGroup) {
    const distWhale = Math.hypot(px - 0, pz - (-26));
    if (distWhale < 8.0) {
      target = 'whale';
      icon = '🐋';
      text = '100억 슈퍼고래 영생 참배! (+150 EXP)';
      isGold = true;
    }
  }

  // 6. 서관 성스러운 촛불 봉헌 제단 (x ≈ -28, z ≈ -8)
  if (!target && candleAltarGroup) {
    const distCandle = Math.hypot(px - (-28), pz - (-8));
    if (distCandle < 7.0) {
      target = 'candle';
      icon = '🕯️';
      text = '떡상 촛불 봉헌 제단 (소망/평단가 봉헌)';
      isGold = true;
    }
  }

  // 7. 남관 영끌 행운의 코인 연못 (x ≈ 0, z ≈ 64)
  if (!target && coinPondGroup) {
    const distPond = Math.hypot(px - 0, pz - 64);
    if (distPond < 8.5) {
      target = 'coin_pond';
      icon = '🪙';
      text = '영끌 행운의 코인 연못 (동전 던져 소망 빌기)';
      isGold = true;
    }
  }

  // 8. 동관 부흥회 통성기도 성령존 (x ≈ 30, z ≈ -6)
  if (!target && revivalCircleGroup) {
    const distRevival = Math.hypot(px - 30, pz - (-6));
    if (distRevival < 7.5) {
      target = 'revival_zone';
      icon = '🔥';
      text = '부흥회 통성기도 성령존 (양봉 게이지 폭발!)';
      isGold = true;
    }
  }

  currentInteractTarget = target;

  if (target) {
    container.style.display = 'flex';
    iconEl.textContent = icon;
    textEl.textContent = text;
    if (isGold) {
      btn.classList.add('gold-mode');
    } else {
      btn.classList.remove('gold-mode');
    }
  } else {
    container.style.display = 'none';
  }
}

function triggerProximityAction() {
  const now = Date.now();
  if (now - lastInteractTime < 280) return; // 연타 스팸 방지
  lastInteractTime = now;

  if (!currentInteractTarget || !playerCharacter) return;

  if (currentInteractTarget === 'boss') {
    sendBossHit(15);
    showSpeechBubble(playerCharacter, '물러가라 공매도 악귀 마왕아!! (성수 강타 -15)');
  } else if (currentInteractTarget === 'bull') {
    interactWithBullStatue();
  } else if (currentInteractTarget === 'ant') {
    interactWithGoldAnt();
  } else if (currentInteractTarget === 'throne') {
    interactWithThrone();
  } else if (currentInteractTarget === 'whale') {
    interactWithWhaleStatue();
  } else if (currentInteractTarget === 'candle') {
    interactWithCandleAltar();
  } else if (currentInteractTarget === 'coin_pond') {
    interactWithCoinPond();
  } else if (currentInteractTarget === 'revival_zone') {
    interactWithRevivalCircle();
  }
}

function updateCultistAnimation(c, dt, t) {
  if (c.stateTimer > 0) {
    c.stateTimer -= dt;
    if (c.stateTimer <= 0) {
      c.state = 'idle';
    }
  }

  // 1. 귀여운 눈 깜빡임 (Blinking System)
  if (c.eyeL && c.eyeR) {
    c.blinkTimer -= dt;
    if (c.blinkTimer <= 0) {
      c.blinkDuration = 0.14;
      c.blinkTimer = 2.4 + Math.random() * 3.2;
    }
    if (c.blinkDuration > 0) {
      c.blinkDuration -= dt;
      c.eyeL.scale.y = 0.12;
      c.eyeR.scale.y = 0.12;
    } else {
      c.eyeL.scale.y = 1.0;
      c.eyeR.scale.y = 1.0;
    }
  }

  // 2. 헤일로 성물 회전 & 둥실둥실 부유
  if (c.haloMesh) {
    if (c.state === 'slain') {
      c.haloMesh.rotation.z += dt * 15;
      c.haloMesh.position.y = 0.58 + Math.sin(t * 12) * 0.08;
    } else {
      c.haloMesh.rotation.z = t * 2.2;
      c.haloMesh.position.y = 0.58 + Math.sin(t * 3.5) * 0.04;
    }
  }

  // 3. 날개 펄럭임 (점프 시에는 힘차게 파닥파닥!)
  if (c.wingL && c.wingR) {
    const flapSpeed = c.isJumping ? 26 : c.isWalking ? 16 : 6;
    const flapAmp = c.isJumping ? 0.65 : c.isWalking ? 0.42 : 0.18;
    const flapAngle = Math.sin(t * flapSpeed) * flapAmp;
    c.wingL.rotation.y = Math.PI / 6 + flapAngle;
    c.wingR.rotation.y = -Math.PI / 6 - flapAngle;
  }

  // 3-1. 신도 계급 오라 회전 및 파티클 펄스 (Aura Visual Animation)
  if (c.auraMeshes && c.auraMeshes.length > 0) {
    c.auraMeshes.forEach(item => {
      if (item.rotSpeed) {
        item.mesh.rotation.z += dt * item.rotSpeed;
      }
      if (item.pulse) {
        const s = 1.0 + Math.sin(t * 3.5 * item.pulse) * 0.08;
        item.mesh.scale.set(s, s, s);
      }
      if (item.floatOffset !== undefined) {
        item.mesh.position.y = 0.4 + Math.sin(t * 3.5 + item.floatOffset) * 0.12;
      }
    });
  }

  // 4. 점프 모션 & 젤리 바운스 (Squash & Stretch)
  if (c.isJumping) {
    // 점프 중: 두 팔을 번쩍 들고 공중 비행 & 몸체 길쭉
    c.armL.rotation.x = THREE.MathUtils.lerp(c.armL.rotation.x, -1.3, dt * 15);
    c.armR.rotation.x = THREE.MathUtils.lerp(c.armR.rotation.x, -1.3, dt * 15);
    c.armL.rotation.z = -0.3;
    c.armR.rotation.z = 0.3;
    if (c.body) c.body.scale.set(0.92, 1.14, 0.92);
    if (c.footL && c.footR) {
      c.footL.position.y = 0.15;
      c.footR.position.y = 0.15;
    }
    return;
  }

  // 착지 순간 쫀득한 젤리 스쿼시 효과
  if (c.squashTimer > 0) {
    c.squashTimer -= dt;
    if (c.body) c.body.scale.set(1.12, 0.88, 1.12);
  } else if (c.body) {
    // 대기 중 몽글몽글 숨쉬는 호흡
    const breath = Math.sin(t * 3.0) * 0.025;
    c.body.scale.set(1.0 - breath * 0.5, 1.0 + breath, 1.0 - breath * 0.5);
    if (c.headGroup) c.headGroup.position.y = 1.62 + breath * 0.5;
  }

  // 5. 걷기: 앙증맞은 뒤뚱뒤뚱(Waddle) 꼬마 천사 달리기
  if (c.isWalking) {
    c.group.rotation.x = THREE.MathUtils.lerp(c.group.rotation.x, 0.12, dt * 10);
    c.group.rotation.z = Math.sin(t * 11) * 0.12;
    if (c.headGroup) c.headGroup.rotation.z = -Math.sin(t * 11) * 0.08;
    c.armL.rotation.x = Math.sin(t * 11) * 0.55;
    c.armR.rotation.x = -Math.sin(t * 11) * 0.55;

    // 아장아장 발자국 모션
    if (c.footL && c.footR) {
      c.footL.position.y = 0.08 + Math.max(0, Math.sin(t * 11)) * 0.14;
      c.footR.position.y = 0.08 + Math.max(0, -Math.sin(t * 11)) * 0.14;
    }
    return;
  }

  // 발 위치 원복
  if (c.footL && c.footR) {
    c.footL.position.y = THREE.MathUtils.lerp(c.footL.position.y, 0.08, dt * 8);
    c.footR.position.y = THREE.MathUtils.lerp(c.footR.position.y, 0.08, dt * 8);
  }

  c.group.rotation.z = THREE.MathUtils.lerp(c.group.rotation.z, 0, dt * 8);

  // 현재 신도가 딛고 서 있는 실제 지면 높이 (단상 계단, 2층 테라스, 기물 위 모두 포함)
  const currentBaseFloor = getTempleFloorY(c.group.position.x, c.group.position.z) + (c.standingPlatformY || 0);
  c.baseY = currentBaseFloor;

  switch (c.state) {
    case 'idle':
      c.group.rotation.x = THREE.MathUtils.lerp(c.group.rotation.x, 0, dt * 8);
      c.group.position.y = THREE.MathUtils.lerp(c.group.position.y, currentBaseFloor + Math.sin(t * 2.5) * 0.04, dt * 8);
      c.headGroup.rotation.x = THREE.MathUtils.lerp(c.headGroup.rotation.x, 0, dt * 8);
      c.armL.rotation.x = THREE.MathUtils.lerp(c.armL.rotation.x, Math.PI / 4 + Math.sin(t * 2) * 0.06, dt * 8);
      c.armR.rotation.x = THREE.MathUtils.lerp(c.armR.rotation.x, Math.PI / 4 - Math.sin(t * 2) * 0.06, dt * 8);
      c.armL.rotation.z = THREE.MathUtils.lerp(c.armL.rotation.z, 0, dt * 8);
      c.armR.rotation.z = THREE.MathUtils.lerp(c.armR.rotation.z, 0, dt * 8);
      break;

    case 'slain':
      // [은혜 쓰러짐]: 바닥에 파묻히지 않고 지면 위에 발라당 누워있는 코믹 기절 연출
      c.group.position.y = THREE.MathUtils.lerp(c.group.position.y, currentBaseFloor + 0.36, dt * 8);
      c.group.rotation.x = THREE.MathUtils.lerp(c.group.rotation.x, -Math.PI * 0.48, dt * 8);
      c.headGroup.rotation.x = THREE.MathUtils.lerp(c.headGroup.rotation.x, -0.2, dt * 8);
      // 양팔을 허공으로 뻗으며 맥없이 흔들거림
      c.armL.rotation.x = -Math.PI * 0.6 + Math.sin(t * 6) * 0.15;
      c.armR.rotation.x = -Math.PI * 0.6 - Math.sin(t * 6) * 0.15;
      c.armL.rotation.z = 0.4;
      c.armR.rotation.z = -0.4;
      break;

    case 'tongue':
      // [통성기도]: 양팔을 번쩍 들고 온몸을 파르르 떨며 방언 기도
      c.group.rotation.x = THREE.MathUtils.lerp(c.group.rotation.x, -0.15, dt * 10);
      c.group.position.y = currentBaseFloor + Math.abs(Math.sin(t * 16)) * 0.18;
      c.headGroup.rotation.x = -0.4 + Math.sin(t * 16) * 0.2;
      c.armL.rotation.x = -Math.PI * 0.85 + Math.sin(t * 18) * 0.25;
      c.armR.rotation.x = -Math.PI * 0.85 - Math.sin(t * 18) * 0.25;
      c.group.rotation.z = (Math.random() - 0.5) * 0.08; // 부르르 떠는 지터
      break;

    case 'clap':
      // [찬양 박수]: 두 손을 앞으로 모아 가슴 앞에서 빠르게 짝! 짝! 짝! (정면 박수)
      c.group.rotation.x = THREE.MathUtils.lerp(c.group.rotation.x, 0.05, dt * 8);
      c.group.position.y = currentBaseFloor + Math.abs(Math.sin(t * 12)) * 0.07;
      c.headGroup.rotation.x = Math.sin(t * 12) * 0.1;
      c.armL.rotation.x = -Math.PI * 0.42; // 앞으로 나란히 뻗음
      c.armR.rotation.x = -Math.PI * 0.42;
      c.armL.rotation.y = 0.55;
      c.armR.rotation.y = -0.55;
      c.armL.rotation.z = Math.sin(t * 22) * 0.4 - 0.2;
      c.armR.rotation.z = -Math.sin(t * 22) * 0.4 + 0.2;
      break;

    case 'kneel':
      // [간절 기도 (석고대죄)]: 무릎 꿇고 엎드려 제발 본전만 찾게 해달라고 애원
      c.group.position.y = THREE.MathUtils.lerp(c.group.position.y, currentBaseFloor - 0.18, dt * 8);
      c.group.rotation.x = THREE.MathUtils.lerp(c.group.rotation.x, 0.45, dt * 8);
      c.headGroup.rotation.x = THREE.MathUtils.lerp(c.headGroup.rotation.x, 0.5, dt * 8);
      c.armL.rotation.x = -0.65 + Math.sin(t * 8) * 0.08;
      c.armR.rotation.x = -0.65 + Math.sin(t * 8) * 0.08;
      c.armL.rotation.y = 0.4;
      c.armR.rotation.y = -0.4;
      c.armL.rotation.z = -0.25;
      c.armR.rotation.z = 0.25;
      break;

    case 'dance':
      // [성령 댄스 / 떡상 댄스]: 엉덩이를 씰룩이며 덩실덩실 신나는 떡상 댄스
      c.group.position.y = currentBaseFloor + Math.abs(Math.sin(t * 12)) * 0.14;
      c.group.rotation.z = Math.sin(t * 12) * 0.22;
      c.group.rotation.y += dt * 1.5;
      c.headGroup.rotation.z = -Math.sin(t * 12) * 0.15;
      c.armL.rotation.x = Math.sin(t * 12) * 1.1 - 0.5;
      c.armR.rotation.x = -Math.sin(t * 12) * 1.1 - 0.5;
      c.armL.rotation.z = -0.4;
      c.armR.rotation.z = 0.4;
      break;

    case 'megabull':
      // [양봉 승천]: 발밑에서 불기둥이 솟구치며 하늘 높이 펄쩍 솟아오름
      c.group.position.y = currentBaseFloor + Math.abs(Math.sin(t * 7)) * 0.85;
      c.headGroup.rotation.x = -0.5;
      c.armL.rotation.x = -Math.PI * 0.95;
      c.armR.rotation.x = -Math.PI * 0.95;
      c.armL.rotation.z = -0.25;
      c.armR.rotation.z = 0.25;
      c.group.rotation.y += dt * 3.5;
      break;

    case 'moneybless':
      // [돈복사 축도]: 두 손을 넓게 펼쳐 황금 코인비를 뿌리는 축도
      c.group.position.y = currentBaseFloor + Math.sin(t * 3) * 0.05;
      c.headGroup.rotation.x = Math.sin(t * 3) * 0.1;
      c.armL.rotation.x = -Math.PI * 0.45;
      c.armR.rotation.x = -Math.PI * 0.45;
      c.armL.rotation.y = 0.7;
      c.armR.rotation.y = -0.7;
      c.armL.rotation.z = -0.55 + Math.sin(t * 10) * 0.1;
      c.armR.rotation.z = 0.55 - Math.sin(t * 10) * 0.1;
      break;

    case 'shout':
      // [떡상 포효 (사자후)]: 가슴을 치며 하늘을 향해 가즈아아아 샤우팅
      c.group.position.y = currentBaseFloor + (Math.random() - 0.5) * 0.05;
      c.headGroup.rotation.x = -0.55;
      c.armL.rotation.x = -0.85 + Math.sin(t * 18) * 0.35;
      c.armR.rotation.x = -0.85 - Math.sin(t * 18) * 0.35;
      c.armL.rotation.y = 0.4;
      c.armR.rotation.y = -0.4;
      c.group.rotation.z = (Math.random() - 0.5) * 0.1;
      break;

    case 'levitate':
      // [공중부양 승천]: 날개를 파닥이며 바닥에서 둥실 떠올라 신비롭게 회전
      c.group.position.y = currentBaseFloor + 1.5 + Math.sin(t * 3) * 0.25;
      c.headGroup.rotation.x = -0.2;
      c.armL.rotation.x = -0.4;
      c.armR.rotation.x = -0.4;
      c.armL.rotation.z = -0.8;
      c.armR.rotation.z = 0.8;
      c.group.rotation.y += dt * 2.0;
      break;

    case 'offering':
      // [영끌 헌금]: 바닥 아래로 파묻히지 않고 지면 위에서 정중하게 90도 절
      c.group.rotation.x = THREE.MathUtils.lerp(c.group.rotation.x, Math.PI * 0.22, dt * 6);
      c.group.position.y = THREE.MathUtils.lerp(c.group.position.y, currentBaseFloor, dt * 6);
      c.headGroup.rotation.x = THREE.MathUtils.lerp(c.headGroup.rotation.x, 0.35, dt * 6);
      c.armL.rotation.x = -Math.PI / 4;
      c.armR.rotation.x = -Math.PI / 4;
      break;
  }
}

// ------------------------------------------
// 3D -> 2D 말풍선
// ------------------------------------------
function showSpeechBubble(cultist, text) {
  const bubble = document.createElement('div');
  bubble.className = 'speech-bubble';
  bubble.textContent = text;
  document.body.appendChild(bubble);

  speechBubbles.push({
    element: bubble,
    cultist,
    life: 3.0
  });
}

function updateSpeechBubbles() {
  const tempV = new THREE.Vector3();
  for (let i = speechBubbles.length - 1; i >= 0; i--) {
    const b = speechBubbles[i];
    b.life -= 0.016;

    if (b.life <= 0) {
      b.element.remove();
      speechBubbles.splice(i, 1);
      continue;
    }

    b.cultist.group.getWorldPosition(tempV);
    tempV.y += 2.6;
    tempV.project(camera);

    if (tempV.z > 1) {
      b.element.style.display = 'none';
      continue;
    }

    b.element.style.display = 'block';
    const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;
    b.element.style.left = `${x}px`;
    b.element.style.top = `${y}px`;
  }
}

// ==========================================
// 5. 파티클 이펙트
// ==========================================
function spawnOfferingCoins(originPos) {
  for (let i = 0; i < 35; i++) {
    const coin = new THREE.Mesh(
      SHARED_GEO.coin,
      new THREE.MeshStandardMaterial({ color: 0xf5c542, metalness: 0.9, roughness: 0.2 })
    );
    coin.position.set(
      originPos.x + (Math.random() - 0.5) * 0.8,
      originPos.y + 1.0 + Math.random() * 0.4,
      originPos.z + (Math.random() - 0.5) * 0.8
    );

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 3,
      3.5 + Math.random() * 3.5,
      -6 - Math.random() * 5
    );

    scene.add(coin);
    particles.push({
      mesh: coin,
      velocity: vel,
      gravity: -9.8,
      life: 2.2,
      rotateSpeed: { x: Math.random() * 10, y: Math.random() * 10 }
    });
  }
}

function spawnHolyWater(originPos) {
  for (let i = 0; i < 30; i++) {
    const drop = new THREE.Mesh(
      SHARED_GEO.drop,
      new THREE.MeshBasicMaterial({ color: 0x88ccff })
    );
    drop.position.set(originPos.x, originPos.y + 1.2, originPos.z);

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 4,
      2 + Math.random() * 2,
      -5 - Math.random() * 4
    );

    scene.add(drop);
    particles.push({
      mesh: drop,
      velocity: vel,
      gravity: -4.5,
      life: 1.5,
      rotateSpeed: { x: 0, y: 0 }
    });
  }
}

function spawnBlessingFire() {
  for (let i = 0; i < 50; i++) {
    const spark = new THREE.Mesh(
      SHARED_GEO.spark,
      new THREE.MeshBasicMaterial({ color: 0xff334b })
    );
    const side = Math.random() > 0.5 ? 1 : -1;
    spark.position.set(
      side * (8 + Math.random() * 4),
      12 + Math.random() * 2,
      -14
    );

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 3,
      4 + Math.random() * 5,
      (Math.random() - 0.5) * 3
    );

    scene.add(spark);
    particles.push({
      mesh: spark,
      velocity: vel,
      gravity: -3,
      life: 2.5,
      rotateSpeed: { x: 0, y: 0 }
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      particles.splice(i, 1);
      continue;
    }

    p.velocity.y += p.gravity * dt;
    p.mesh.position.addScaledVector(p.velocity, dt);

    if (p.mesh.position.y < 0.1) {
      p.mesh.position.y = 0.1;
      p.velocity.y = -p.velocity.y * 0.4;
      p.velocity.x *= 0.8;
      p.velocity.z *= 0.8;
    }

    p.mesh.rotation.x += p.rotateSpeed.x * dt;
    p.mesh.rotation.y += p.rotateSpeed.y * dt;
  }
}

// ==========================================
// 6. 실시간 시세 및 100% 전자동 호스트 클라우드 레지스트리 연동
// ==========================================
const CLOUD_REGISTRY_GIST_ID = '8bd7ddc5c6df9538c8092e1f01c9b2fa';
STATE.cloudHost = null;

async function autoDiscoverHostServer() {
  // 1. 로컬 패스트트랙: HTTP 환경(로컬 브라우저)에서 0.2초 만에 로컬 8080 직통 연결!
  if (window.location.protocol === 'http:') {
    try {
      const localCtrl = new AbortController();
      const localTid = setTimeout(() => localCtrl.abort(), 250);
      const localRes = await fetch('http://127.0.0.1:8080/api/stock-prices', { signal: localCtrl.signal });
      clearTimeout(localTid);
      if (localRes.ok) {
        console.log('[가즈아교] 로컬 PC 대성전 호스트(8080) 즉각 감지 성공!');
        STATE.cloudHost = '127.0.0.1:8080';
        return '127.0.0.1:8080';
      }
    } catch (eLocal) {}
  }

  const cacheBuster = Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  // 2. Gist Raw URL (Rate Limit 제약 없음, 최신 호스트 감지)
  try {
    const rawRes = await fetch(`https://gist.githubusercontent.com/kicharisma2/${CLOUD_REGISTRY_GIST_ID}/raw/host.json?_nocache=${cacheBuster}`, {
      cache: 'no-store'
    });
    if (rawRes.ok) {
      const parsed = await rawRes.json();
      if (parsed && parsed.status === 'online' && parsed.host) {
        const cleanHost = parsed.host.trim().replace(/^https?:\/\//i, '').replace(/^wss?:\/\//i, '').replace(/\/+index\.html$/i, '').replace(/\/+$/, '');
        STATE.cloudHost = cleanHost;
        console.log('[가즈아교] Gist Raw 호스트 자동 발견 성공:', cleanHost);
        return cleanHost;
      } else if (parsed && parsed.status === 'offline') {
        STATE.cloudHost = null;
        return null;
      }
    }
  } catch (e1) {
    console.warn('[가즈아교] Gist Raw 조회 알림:', e1);
  }

  // 3. GitHub Gist REST API (폴백)
  try {
    const res = await fetch(`https://api.github.com/gists/${CLOUD_REGISTRY_GIST_ID}?_nocache=${cacheBuster}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.files && data.files['host.json']) {
        const parsed = JSON.parse(data.files['host.json'].content);
        if (parsed && parsed.status === 'online' && parsed.host) {
          const cleanHost = parsed.host.trim().replace(/^https?:\/\//i, '').replace(/^wss?:\/\//i, '').replace(/\/+index\.html$/i, '').replace(/\/+$/, '');
          STATE.cloudHost = cleanHost;
          console.log('[가즈아교] Gist API 호스트 자동 발견 성공:', cleanHost);
          return cleanHost;
        } else if (parsed && parsed.status === 'offline') {
          STATE.cloudHost = null;
          return null;
        }
      }
    }
  } catch (err) {
    console.warn('[가즈아교] Gist API 조회 알림:', err);
  }

  STATE.cloudHost = null;
  return null;
}

function getServerHost() {
  // 1. URL 파라미터 (?server=...) 명시적 지정 시 최우선 직결
  const urlParams = new URLSearchParams(window.location.search);
  const qServer = urlParams.get('server');
  if (qServer && !qServer.includes('github.io')) {
    return qServer.trim().replace(/^https?:\/\//i, '').replace(/^wss?:\/\//i, '').replace(/\/+index\.html$/i, '').replace(/\/+$/, '');
  }

  // 2. GitHub Pages가 아닌 로컬호스트나 직접 터널에서 실행된 경우
  if (!window.location.host.includes('github.io')) {
    return window.location.host;
  }

  // 3. GitHub Pages 환경에서는 죽은 옛날 캐시를 방지하기 위해 실시간 자동 감지 결과(STATE.cloudHost)만 사용
  return STATE.cloudHost || null;
}

function updateServerConnectionStatusBadge(connected, host, stateDetail = '') {
  const iconEl = document.getElementById('serverStatusIcon');
  const textEl = document.getElementById('serverStatusText');
  const btnEl = document.getElementById('btnServerConfig');
  const modalBadge = document.getElementById('serverModalStatusBadge');
  const modalHostText = document.getElementById('serverModalCurrentHostText');

  if (connected) {
    if (iconEl) iconEl.textContent = '🟢';
    if (textEl) textEl.textContent = stateDetail ? `실시간 (${stateDetail})` : '실시간 연결';
    if (btnEl) {
      btnEl.style.borderColor = '#38ef7d';
      btnEl.style.color = '#38ef7d';
    }
    if (modalBadge) {
      modalBadge.textContent = '🟢 실시간 호스트 서버 자동 연결됨';
      modalBadge.style.color = '#38ef7d';
    }
    if (modalHostText) {
      modalHostText.textContent = `연결 호스트: ${host || '로컬 호스트'} (자동 감지 완료)`;
    }
  } else {
    if (iconEl) iconEl.textContent = '🟡';
    if (textEl) textEl.textContent = stateDetail ? `단독 (${stateDetail})` : '단독 모드';
    if (btnEl) {
      btnEl.style.borderColor = '#f5c542';
      btnEl.style.color = '#f5c542';
    }
    if (modalBadge) {
      modalBadge.textContent = '🟡 단독 성전 모드 (호스트 대기 중)';
      modalBadge.style.color = '#f5c542';
    }
    if (modalHostText) {
      modalHostText.textContent = 'PC에서 가즈아교_글로벌서버.exe를 실행하시면 1초 만에 자동으로 실시간 연결됩니다.';
    }
  }
}

function simulateStaticStockFluctuations() {
  ['SEC-005930', 'SEC-000660', 'US-TSLA', 'US-NVDA'].forEach(key => {
    if (STATE.roomData[key]) {
      const d = STATE.roomData[key];
      const deltaRatio = (Math.random() - 0.48) * 0.003;
      const oldPrice = d.price;
      d.price = Math.round(d.price * (1 + deltaRatio));
      d.changeRate = (d.changeRate || 0.005) + deltaRatio;
      if (STATE.currentRoom === key) {
        STATE.priceHistory.push(d.price);
        if (STATE.priceHistory.length > 20) STATE.priceHistory.shift();
        if (d.price > oldPrice) spawnBlessingFire();
        updateAltarScreenCanvas();
        updateHudUI();
      }
    }
  });
}

async function fetchRealStockPrices() {
  try {
    let sHost = getServerHost() || STATE.cloudHost;
    if (!sHost && !window.location.host.includes('github.io')) {
      sHost = window.location.host;
    }

    if (!sHost) {
      simulateStaticStockFluctuations();
      return;
    }

    const apiUrl = `https://${sHost}/api/stock-prices`;
    const res = await fetch(apiUrl);
    if (!res.ok) {
      simulateStaticStockFluctuations();
      return;
    }
    const stocks = await res.json();
    for (const key in stocks) {
      if (STATE.roomData[key]) {
        const item = stocks[key];
        const oldP = STATE.roomData[key].price;
        STATE.roomData[key].price = item.price;
        STATE.roomData[key].changeRate = item.changeRate;

        if (STATE.currentRoom === key) {
          STATE.priceHistory.push(item.price);
          if (STATE.priceHistory.length > 20) STATE.priceHistory.shift();
          if (item.price > oldP) spawnBlessingFire();
          updateAltarScreenCanvas();
          updateHudUI();
        }
      }
    }
  } catch (e) {
    simulateStaticStockFluctuations();
  }
}

function setupRealtimeFeed() {
  connectUpbit();
  fetchRealStockPrices();
  setInterval(fetchRealStockPrices, 3000);
}

function connectUpbit() {
  try {
    if (STATE.upbitWs) STATE.upbitWs.close();

    STATE.upbitWs = new WebSocket('wss://api.upbit.com/websocket/v1');
    STATE.upbitWs.binaryType = 'blob';

    STATE.upbitWs.onopen = () => {
      const code = STATE.currentRoom.startsWith('KRW-') ? STATE.currentRoom : 'KRW-BTC';
      STATE.upbitWs.send(JSON.stringify([
        { ticket: 'GAZUA_CULT_TICKER' },
        { type: 'ticker', codes: [code] }
      ]));
    };

    STATE.upbitWs.onmessage = async (e) => {
      const text = await e.data.text();
      const ticker = JSON.parse(text);

      if (ticker && ticker.code === STATE.currentRoom) {
        const data = STATE.roomData[STATE.currentRoom];
        const oldPrice = data.price;
        data.price = ticker.trade_price;
        data.changeRate = ticker.signed_change_rate;

        STATE.priceHistory.push(data.price);
        if (STATE.priceHistory.length > 20) STATE.priceHistory.shift();

        if (data.price > oldPrice) spawnBlessingFire();

        updateAltarScreenCanvas();
        updateHudUI();
      }
    };
  } catch (err) {
    console.warn('Upbit ws error:', err);
  }
}

function updateHudUI() {
  const data = STATE.roomData[STATE.currentRoom];
  const priceEl = document.getElementById('hudPrice');
  const rateEl = document.getElementById('hudRate');
  if (!priceEl || !rateEl) return;

  const isUp = data.changeRate >= 0;
  priceEl.className = `price-indicator ${isUp ? 'up' : 'down'}`;
  priceEl.textContent = data.isCrypto
    ? `${data.price.toLocaleString('ko-KR')} KRW`
    : (data.symbol === 'TSLA' || data.symbol === 'NVDA')
      ? `$${data.price.toFixed(2)}`
      : `${data.price.toLocaleString('ko-KR')} 원`;

  rateEl.className = `rate-indicator ${isUp ? 'up' : 'down'}`;
  rateEl.textContent = `${isUp ? '▲' : '▼'} ${(Math.abs(data.changeRate) * 100).toFixed(2)}%`;
}

// ==========================================
// 7. 진짜 실시간 단일 포트 WebSocket 멀티플레이어 & 실제 접속자 동기화
// ==========================================
function startOfflineCultistBots() {
  // 사용자의 요청에 따라 가짜 봇 3명을 완전히 제거하고, 실제 사람만 100% 정직하게 표시합니다.
  ['bot_grace', 'bot_pastor', 'bot_ant'].forEach(id => {
    if (remotePeers[id]) {
      scene.remove(remotePeers[id]);
      delete remotePeers[id];
    }
  });
  // 혼자 접속해 있을 때는 정직하게 1명으로 표시
  setActualOnlineCount(1);
}

let isConnectingIntegrated = false;
async function connectIntegratedMultiplayer(overrideHost) {
  if (isConnectingIntegrated) return;
  isConnectingIntegrated = true;

  try {
    let host = overrideHost || getServerHost();

    // 호스트 미지정 시 클라우드 레지스트리 자동 감지
    if (!host) {
      updateServerConnectionStatusBadge(false, null, '감지 중...');
      host = await autoDiscoverHostServer();
    }

    if (!host) {
      // 호스트 서버가 아직 안 켜진 상태 (단독 오프라인 성전 모드)
      startOfflineCultistBots();
      updateServerConnectionStatusBadge(false, null, '대기 중');
      // 8초마다 호스트 자동 감지 재시도 (PC에서 켜지면 실시간 자동 연결!)
      clearTimeout(window._autoDiscoverTimer);
      window._autoDiscoverTimer = setTimeout(() => {
        isConnectingIntegrated = false;
        connectIntegratedMultiplayer();
      }, 8000);
      return;
    }

    const isHttps = window.location.protocol === 'https:' || host.includes('trycloudflare.com');
    const proto = isHttps ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${host}/ws`;

    if (STATE.multiWs) {
      try { STATE.multiWs.close(); } catch {}
    }

    STATE.multiWs = new WebSocket(wsUrl);

    STATE.multiWs.onopen = () => {
      console.log('[가즈아교] 실시간 멀티플레이어 서버 자동 접속 성공:', wsUrl);
      STATE.isOnlineMultiplayer = true;
      updateServerConnectionStatusBadge(true, host, '동기화 중...');

      // 1. 입장 패킷 즉각 전송 (최우선 실행 & 100% 안전한 fallback 보장)
      try {
        const myName = (playerCharacter && playerCharacter.name) ? playerCharacter.name : (STATE.playerName || '가즈아신도');
        const posX = (playerCharacter && playerCharacter.group) ? playerCharacter.group.position.x : 0;
        const posY = (playerCharacter && playerCharacter.group) ? playerCharacter.group.position.y : 0;
        const posZ = (playerCharacter && playerCharacter.group) ? playerCharacter.group.position.z : 2;
        const rotY = (playerCharacter && playerCharacter.group) ? playerCharacter.group.rotation.y : 0;

        STATE.multiWs.send(JSON.stringify({
          type: 'join',
          room: STATE.currentRoom,
          name: myName,
          level: STATE.playerLevel || 1,
          title: STATE.playerRankTitle || '초신자',
          robe: STATE.playerRobe || 'white',
          hat: STATE.playerHat || 'halo',
          wings: STATE.playerWings || 'angel',
          belt: STATE.playerBelt || 'long',
          x: posX,
          y: posY,
          z: posZ,
          ry: rotY
        }));
        console.log('[가즈아교] 대성전 입장(join) 패킷 서버 전송 완료:', myName);
      } catch (errJoin) {
        console.error('[가즈아교] join 패킷 전송 오류:', errJoin);
      }

      // 2. 주기적 하트비트 Ping (모바일 브라우저 절전 차단 & Cloudflare 타임아웃 방지)
      clearInterval(window._wsPingTimer);
      window._wsPingTimer = setInterval(() => {
        if (STATE.multiWs && STATE.multiWs.readyState === WebSocket.OPEN) {
          STATE.multiWs.send(JSON.stringify({ type: 'ping' }));
        }
      }, 12000);

      // 3. 오프라인 가짜 봇 청소 (에러 없이 안전하게 처리)
      try {
        ['bot_grace', 'bot_pastor', 'bot_ant'].forEach(bid => removeRemotePeer(bid));
      } catch (eBots) {}

      // 4. 호스트 연결 완료 말풍선
      try {
        if (playerCharacter) {
          showSpeechBubble(playerCharacter, '† 실시간 대성전 호스트 서버와 자동 연결되었습니다! †');
        }
      } catch (eBubble) {}
    };

    STATE.multiWs.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      handleMultiplayerMessage(msg);
    };

    STATE.multiWs.onerror = (err) => {
      console.warn('[가즈아교] 멀티플레이어 연결 오류 - 최신 호스트 재탐색 준비');
      clearInterval(window._wsPingTimer);
      STATE.isOnlineMultiplayer = false;
      STATE.cloudHost = null; // 죽은 호스트 캐시 리셋
      updateServerConnectionStatusBadge(false, host, '오류');
      startOfflineCultistBots();
    };

    STATE.multiWs.onclose = () => {
      console.warn('[가즈아교] 멀티플레이어 소켓 닫힘 - 재연결 시도');
      clearInterval(window._wsPingTimer);
      STATE.isOnlineMultiplayer = false;
      STATE.cloudHost = null; // 죽은 호스트 캐시 리셋
      updateServerConnectionStatusBadge(false, host, '재탐색 중');
      startOfflineCultistBots();
      clearTimeout(window._autoDiscoverTimer);
      window._autoDiscoverTimer = setTimeout(() => {
        isConnectingIntegrated = false;
        connectIntegratedMultiplayer();
      }, 3500);
    };

  } catch (err) {
    console.warn('Integrated WS Init Failed:', err);
    updateServerConnectionStatusBadge(false, null, '실패');
    startOfflineCultistBots();
  } finally {
    isConnectingIntegrated = false;
  }
}

function handleMultiplayerMessage(msg) {
  switch (msg.type) {
    case 'welcome':
      console.log('[가즈아교] 서버 환영 패킷(welcome) 수신 완료! 피어 수:', (msg.peers || []).length, '현재 성전 인원:', msg.count);
      // 실제 서버 접속자 수 및 내 클라이언트 ID 동기화
      if (typeof msg.count === 'number') {
        setActualOnlineCount(msg.count);
        updateServerConnectionStatusBadge(true, getServerHost() || STATE.cloudHost, `${msg.count}명 접속`);
      }
      if (msg.id) {
        STATE.myClientId = msg.id;
      }

      // 양봉 강림 게이지 및 보스 체력 동기화
      if (typeof msg.ritual_gauge === 'number') {
        STATE.ritualGauge = msg.ritual_gauge;
        updateRitualHud(msg.ritual_gauge);
      }
      if (typeof msg.boss_hp === 'number') {
        STATE.bossHp = msg.boss_hp;
        if (bossHpFillMesh) {
          const ratio = Math.max(0, msg.boss_hp / 100);
          bossHpFillMesh.scale.x = ratio;
          bossHpFillMesh.position.x = -(1.0 - ratio) * 1.5;
        }
      }

      // 이전 대화 기록 동기화 (방별 최근 대화 불러오기)
      if (Array.isArray(msg.chat_history)) {
        msg.chat_history.forEach(item => {
          if (item && item.text) {
            addTestimonyToFeed(item.name || '신도', item.text, item.belt || 'long', item.time);
          }
        });
      }

      // 기존 피어들 생성
      if (Array.isArray(msg.peers)) {
        msg.peers.forEach(peerInfo => {
          if (peerInfo) {
            try {
              addRemotePeer(peerInfo);
              addTestimonyToFeed('† 성전 안내 †', `[${peerInfo.name}] 신도님이 함께 기도 중입니다.`, 'long');
            } catch (ePeer) {
              console.warn('[가즈아교] 기존 피어 생성 알림:', ePeer);
            }
          }
        });
      }
      break;

    case 'peer_join':
      console.log('[가즈아교] 새 신도 입장 패킷(peer_join) 수신:', msg.peer ? msg.peer.name : '신도', '현재 성전 인원:', msg.count);
      if (typeof msg.count === 'number') {
        setActualOnlineCount(msg.count);
        updateServerConnectionStatusBadge(true, getServerHost() || STATE.cloudHost, `${msg.count}명 접속`);
      }
      if (msg.peer) {
        try {
          addRemotePeer(msg.peer);
          addTestimonyToFeed('† 성전 안내 †', `🎉 [${msg.peer.name}] 신도님이 대성전에 입장하셨습니다!`, 'long');
          if (window.gajaAudio && window.gajaAudio.playAmenBellSfx) {
            window.gajaAudio.playAmenBellSfx();
          }
        } catch (eJoin) {
          console.warn('[가즈아교] 새 피어 입장 알림:', eJoin);
        }
      }
      break;

    case 'peer_move':
      if (remotePeers[msg.id]) {
        const peer = remotePeers[msg.id];
        peer.targetPos.set(msg.x, msg.y || 0, msg.z);
        if (msg.ry !== undefined) peer.group.rotation.y = msg.ry;
        if (msg.jump) {
          peer.isJumping = true;
          setTimeout(() => { if (peer) peer.isJumping = false; }, 420);
        }
      }
      break;

    case 'peer_level_up':
      addTestimonyToFeed('† 등급 승급 축복 †', `[${msg.name}] 신도님이 [Lv.${msg.level} ${msg.title}]으로 승급하셨습니다! 할렐루야!`, 'long');
      if (remotePeers[msg.id]) {
        const peer = remotePeers[msg.id];
        peer.level = msg.level;
        peer.title = msg.title;
        peer.name = `[Lv.${msg.level} ${msg.title}] ${msg.name}`;
        if (peer.nameTagEl) peer.nameTagEl.innerHTML = `<span>${peer.name}</span>`;
        updatePlayerAura(peer, msg.level);
        showSpeechBubble(peer, `† [Lv.${msg.level} ${msg.title}] 승급! †`);
      }
      spawnBlessingFire();
      window.gajaAudio.playAmenBellSfx();
      break;

    case 'ritual_update':
      if (typeof msg.gauge === 'number') {
        STATE.ritualGauge = msg.gauge;
        updateRitualHud(msg.gauge);
      }
      break;

    case 'ritual_ascension':
      startRitualAscension(msg.bonusExp || 200);
      break;

    case 'boss_update':
      if (typeof msg.hp === 'number') {
        STATE.bossHp = msg.hp;
        if (bossHpFillMesh) {
          const ratio = Math.max(0, msg.hp / 100);
          bossHpFillMesh.scale.x = ratio;
          bossHpFillMesh.position.x = -(1.0 - ratio) * 1.5;
        }
      }
      spawnBlessingFire();
      break;

    case 'boss_defeated':
      onBossDefeated(msg.bonusExp || 150);
      break;

    case 'boss_respawn':
      onBossRespawn(msg.hp || 100);
      break;

    case 'peer_bull_buff':
      addTestimonyToFeed('† 황금 황소 성물 †', `[${msg.name}] 신도님이 황금 황소의 상한가 축복을 받으셨습니다!`, 'long');
      if (remotePeers[msg.id]) {
        showSpeechBubble(remotePeers[msg.id], '🐂 황소 축복 질주!');
      }
      break;

    case 'peer_action':
      if (remotePeers[msg.id]) {
        const peer = remotePeers[msg.id];
        peer.state = msg.act;
        peer.stateTimer = 3.5;
        if (msg.text) showSpeechBubble(peer, msg.text);
        if (msg.act === 'offering') spawnOfferingCoins(peer.group.position);
        if (msg.act === 'holywater') spawnHolyWater(peer.group.position);
      }
      break;

    case 'peer_update_look':
      // 다른 유저가 닉네임이나 옷을 바꿨을 때 실시간 반영!
      console.log('[MULTI] peer_update_look received:', msg);
      if (remotePeers[msg.id]) {
        const peer = remotePeers[msg.id];
        peer.name = msg.name || peer.name;
        if (peer.nameTagEl) {
          peer.nameTagEl.innerHTML = `<span>${peer.name}</span>`;
        }

        // 로브 색상
        if (msg.robe && COLOR_PALETTE[msg.robe]) {
          peer.robeColor = msg.robe;
          const rColor = COLOR_PALETTE[msg.robe];
          peer.robeMat.color.setHex(rColor);
          peer.robeMat.needsUpdate = true;
        }

        // 띠 색상
        if (msg.belt && COLOR_PALETTE[msg.belt]) {
          peer.beltType = msg.belt;
          const bColor = COLOR_PALETTE[msg.belt];
          peer.beltMat.color.setHex(bColor);
          peer.beltMat.needsUpdate = true;
        }

        // 모자 & 날개 파츠
        if (msg.hat) applyHatParts(peer, msg.hat);
        if (msg.wings) applyWingsParts(peer, msg.wings);

        showSpeechBubble(peer, `새로운 은혜의 옷으로 갈아입었습니다!`);
      }
      break;

    case 'peer_testimony':
      console.log('[MULTI] peer_testimony received:', msg);
      if (msg.id && msg.id === STATE.myClientId) {
        return; // 내가 보낸 간증은 로컬에 이미 등록되었으므로 중복 추가 차단!
      }
      addTestimonyToFeed(msg.name, msg.text, msg.belt, msg.time);
      if (remotePeers[msg.id]) {
        showSpeechBubble(remotePeers[msg.id], msg.text);
      }
      if (window.gajaAudio) {
        window.gajaAudio.playHolyWaterSfx();
      }
      break;

    case 'peer_roulette':
      addTestimonyToFeed('† 성령의 은혜 룰렛 †', `[${msg.name}] 신도님이 [${msg.reward}]을 획득하셨습니다! 할렐루야!`, 'long');
      spawnBlessingFire();
      window.gajaAudio.playAmenBellSfx();
      break;

    case 'peer_leave':
      setActualOnlineCount(msg.count);
      removeRemotePeer(msg.id);
      break;
  }
}

function addRemotePeer(info) {
  if (remotePeers[info.id]) return;
  const rankTitle = info.title || '초신자';
  const rankLvl = info.level || 1;
  const displayName = info.name.startsWith('[Lv.') ? info.name : `[Lv.${rankLvl} ${rankTitle}] ${info.name}`;

  // 내 캐릭터와 완전히 겹치지 않도록 초기 오프셋 보정
  let spawnX = typeof info.x === 'number' ? info.x : 0;
  let spawnY = typeof info.y === 'number' ? info.y : 0;
  let spawnZ = typeof info.z === 'number' ? info.z : 2;

  if (playerCharacter && Math.abs(spawnX - playerCharacter.group.position.x) < 0.3 && Math.abs(spawnZ - playerCharacter.group.position.z) < 0.3) {
    spawnX += (Math.random() > 0.5 ? 1.8 : -1.8);
    spawnZ += (Math.random() - 0.5) * 1.5;
  }

  const peer = createCuteCultist({
    isPlayer: false,
    id: info.id,
    name: displayName,
    level: rankLvl,
    title: rankTitle,
    robeColor: info.robe || 'white',
    hatType: info.hat || 'halo',
    wingsType: info.wings || 'angel',
    beltType: info.belt || 'long',
    pos: { x: spawnX, y: spawnY, z: spawnZ }
  });
  remotePeers[info.id] = peer;
  addNameTag(peer, false);

  // 성전에 입장한 형제 신도를 환영하는 은혜 효과
  spawnBlessingFire();
  setTimeout(() => {
    if (peer && remotePeers[info.id]) {
      showSpeechBubble(peer, '† 가즈아 대성전에 당도했습니다! †');
    }
  }, 400);
}

function removeRemotePeer(id) {
  if (remotePeers[id]) {
    scene.remove(remotePeers[id].group);
    if (remotePeers[id].nameTagEl) remotePeers[id].nameTagEl.remove();
    delete remotePeers[id];
  }
}

// 100% 정직한 실제 접속자 수 표시
function setActualOnlineCount(count) {
  STATE.onlineCount = count;
  const countEl = document.getElementById('cultistCount');
  if (countEl) countEl.textContent = count.toLocaleString('ko-KR');
}

function sendMultiplayerAction(actionType, text = '') {
  if (STATE.multiWs && STATE.multiWs.readyState === WebSocket.OPEN) {
    STATE.multiWs.send(JSON.stringify({
      type: 'action',
      act: actionType,
      text: text
    }));
  }
}

function sendMultiplayerTestimony(text) {
  if (STATE.multiWs && STATE.multiWs.readyState === WebSocket.OPEN) {
    STATE.multiWs.send(JSON.stringify({
      type: 'testimony',
      room: STATE.currentRoom,
      name: playerCharacter.name,
      belt: STATE.playerBelt,
      text: text
    }));
  }
}

function addTestimonyToFeed(author, text, type = 'long', timestamp = null) {
  const safeAuthor = String(author || '신도');
  const safeText = String(text || '');
  const timeStr = timestamp || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const isSys = safeAuthor.includes('†') || safeAuthor.includes('안내') || safeAuthor.includes('축복') || safeAuthor.includes('총회');

  const entry = {
    time: timeStr,
    author: safeAuthor,
    text: safeText,
    type: type,
    isSystem: isSys
  };

  if (!STATE.chatLog) STATE.chatLog = [];
  STATE.chatLog.push(entry);
  if (STATE.chatLog.length > 250) STATE.chatLog.shift();

  // 1. 하단 작은 피드 추가
  const feed = document.getElementById('testimonyList');
  if (feed) {
    const item = document.createElement('div');
    item.className = 'testimony-item';
    item.innerHTML = `<span class="testimony-author ${type}">${author}:</span><span>${text}</span>`;
    feed.appendChild(item);
    feed.scrollTop = feed.scrollHeight;
  }

  // 2. 전체 대화 총람 모달 실시간 추가
  appendFullChatItem(entry);
}

function appendFullChatItem(entry) {
  const fullList = document.getElementById('fullChatHistoryList');
  if (!fullList) return;

  const item = document.createElement('div');
  const typeClass = entry.isSystem ? 'system' : (entry.type === 'short' ? 'short' : 'long');
  item.className = `full-chat-item ${typeClass}`;
  item.dataset.category = entry.isSystem ? 'system' : 'chat';

  item.innerHTML = `
    <span class="full-chat-time">${entry.time}</span>
    <span class="full-chat-author ${typeClass}">${entry.author}:</span>
    <span class="full-chat-text">${entry.text}</span>
  `;
  fullList.appendChild(item);
  fullList.scrollTop = fullList.scrollHeight;
}

function renderFullChatHistory(filter = 'all') {
  const fullList = document.getElementById('fullChatHistoryList');
  if (!fullList) return;

  fullList.innerHTML = '';
  const list = STATE.chatLog || [];
  list.forEach(entry => {
    if (filter === 'chat' && entry.isSystem) return;
    if (filter === 'system' && !entry.isSystem) return;
    appendFullChatItem(entry);
  });
}

window.filterChatHistory = function(filter) {
  document.querySelectorAll('.chat-filter-btn').forEach(btn => btn.classList.remove('active'));
  if (filter === 'all') document.getElementById('chatFilterAll')?.classList.add('active');
  else if (filter === 'chat') document.getElementById('chatFilterChat')?.classList.add('active');
  else if (filter === 'system') document.getElementById('chatFilterSystem')?.classList.add('active');

  renderFullChatHistory(filter);
};

function openChatHistoryModal() {
  renderFullChatHistory('all');
  document.getElementById('modalChatHistory').classList.add('active');
  const input = document.getElementById('modalChatInput');
  if (input) setTimeout(() => input.focus(), 150);
}

function openWorldMapModal() {
  document.getElementById('modalWorldMap').classList.add('active');
}

window.teleportToZone = function(zoneKey) {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  if (!playerCharacter) return;

  let tx = 0, ty = 0, tz = 0, ry = 0, msg = '';
  if (zoneKey === 'main') {
    tx = 0; ty = 0; tz = 5; ry = 0;
    msg = '🏛️ 황금 대성전 중앙 본당에 도착했습니다!';
  } else if (zoneKey === 'forest') {
    tx = 28; ty = 0; tz = 8; ry = -Math.PI / 2;
    msg = '🌲 양봉의 숲 성물 정원에 도착했습니다! 숨겨진 황금 개미를 찾아보세요!';
  } else if (zoneKey === 'observatory') {
    tx = 0; ty = 7.5; tz = 22; ry = 0;
    msg = '🌌 천상의 2층 전망대에 올랐습니다! 온 성전이 한눈에 내려다보입니다!';
  } else if (zoneKey === 'boss') {
    tx = -24; ty = 0; tz = 6; ry = -Math.PI / 2;
    msg = '👹 서관 공매도 심연 마왕 레이드에 참전했습니다! 성수를 준비하세요!';
  } else if (zoneKey === 'cafe') {
    tx = 32; ty = 0; tz = 6; ry = Math.PI / 2;
    msg = '☕ 동관 거래소 거리 성도 카페에 도착했습니다! 은혜로운 친교를 나누세요!';
  } else if (zoneKey === 'bull') {
    tx = 0; ty = 0; tz = 31; ry = 0;
    msg = '🐂 남관 달나라 성지 황금 황소 성물상 앞에 도착했습니다! 상한가 축복을 받으세요!';
  }

  playerCharacter.group.position.set(tx, ty, tz);
  playerCharacter.group.rotation.y = ry;
  camera.position.set(tx, ty + 10, tz + 16);
  if (controls) controls.target.set(tx, ty + 1.2, tz);

  showSpeechBubble(playerCharacter, msg);
  spawnBlessingFire();
  if (window.gajaAudio) window.gajaAudio.playAmenBellSfx();
  checkProximityInteractions();
};

function interactWithGoldAnt() {
  if (!playerCharacter) return;
  if (STATE.hasFoundGoldAnt) {
    showSpeechBubble(playerCharacter, '🐜 이미 오늘 숨겨진 황금 개미의 은혜를 받았습니다! 내일 다시 찾으세요!');
    return;
  }

  STATE.hasFoundGoldAnt = true;
  addExp(80);
  showSpeechBubble(playerCharacter, '🐜 † 성스러운 숨겨진 황금 개미를 발견했습니다! (+80 EXP) 할렐루야! †');
  spawnBlessingFire();
  if (window.gajaAudio) window.gajaAudio.playLevelUpSfx();

  const logText = `동관 정원에서 [숨겨진 황금 개미] 성물을 발견하여 대축복(+80 EXP)을 받았습니다!`;
  addTestimonyToFeed(STATE.playerName, logText, 'long');
  sendMultiplayerTestimony(logText);
}

window.castProphecyVote = function(choice) {
  if (STATE.hasVotedProphecy) {
    showSpeechBubble(playerCharacter, '오늘의 종가 예언을 이미 담대히 선포하셨습니다!');
    return;
  }

  STATE.hasVotedProphecy = true;
  addExp(50);
  document.querySelectorAll('.prophecy-card').forEach(c => c.classList.remove('voted'));

  const cardMap = { '상한가': 'prophecyCard1', '양봉': 'prophecyCard2', '보합': 'prophecyCard3', '음봉': 'prophecyCard4' };
  if (cardMap[choice]) document.getElementById(cardMap[choice])?.classList.add('voted');

  showSpeechBubble(playerCharacter, `🔮 오늘 종가를 [${choice}]으로 예언 선포하셨습니다! (+50 EXP)`);
  spawnBlessingFire();
  if (window.gajaAudio) window.gajaAudio.playAmenBellSfx();

  const logMsg = `오늘의 마감 캔들을 [${choice}]으로 담대히 예언 선포하였습니다! (+50 EXP)`;
  addTestimonyToFeed(STATE.playerName, logMsg, 'long');
  sendMultiplayerTestimony(logMsg);
};

// ==========================================
// 8. 캐릭터 꾸미기 (Customization) 적용 로직
// ==========================================
function updateAvatarPreview() {
  const nick = document.getElementById('inputNick')?.value.trim() || STATE.playerName || '신도';
  const title = document.getElementById('selectTitle')?.value || STATE.playerRankTitle;
  const robe = document.getElementById('selectRobe')?.value || 'white';
  const hat = document.getElementById('selectHat')?.value || 'halo';
  const wings = document.getElementById('selectWings')?.value || 'angel';
  const belt = document.getElementById('selectBelt')?.value || 'long';

  const robeHexMap = {
    white: '#fffcf5',
    crimson: '#9e1322',
    gold: '#f5c542',
    black: '#1f191d',
    pink: '#ff8fa3',
    sky: '#60a5fa'
  };

  const hatIconMap = {
    halo: '✨',
    crown: '👑',
    catears: '🐱',
    witch: '🧙',
    candle: '🕯️',
    horns: '🐂',
    none: ''
  };

  const wingsIconMap = {
    angel: '🪽',
    mecha: '⚡',
    devil: '🦇',
    none: ''
  };

  const nameEl = document.getElementById('previewNameTitle');
  if (nameEl) nameEl.textContent = `${title} ${nick}`;

  const haloEl = document.getElementById('previewHalo');
  if (haloEl) haloEl.style.display = hat === 'halo' ? 'block' : 'none';

  const hatEl = document.getElementById('previewHatIcon');
  if (hatEl) hatEl.textContent = hat === 'halo' ? '' : (hatIconMap[hat] || '');

  const wingsEl = document.getElementById('previewWingsIcon');
  if (wingsEl) wingsEl.textContent = wingsIconMap[wings] || '';

  const bodyEl = document.getElementById('previewBody');
  if (bodyEl) bodyEl.style.background = robeHexMap[robe] || '#fffcf5';

  const sashEl = document.getElementById('previewSash');
  if (sashEl) sashEl.style.background = belt === 'long' ? '#ff3352' : '#2563eb';

  const sumEl = document.getElementById('previewSummary');
  if (sumEl) {
    const robeOpt = document.getElementById('selectRobe');
    const hatOpt = document.getElementById('selectHat');
    const rName = robeOpt ? robeOpt.options[robeOpt.selectedIndex]?.text : '';
    const hName = hatOpt ? hatOpt.options[hatOpt.selectedIndex]?.text : '';
    sumEl.textContent = `${rName} · ${hName}`;
  }
}

function openCustomizationModal() {
  document.getElementById('inputNick').value = STATE.playerName;
  document.getElementById('selectTitle').value = STATE.playerTitle;
  document.getElementById('selectRobe').value = STATE.playerRobe;
  document.getElementById('selectHat').value = STATE.playerHat;
  document.getElementById('selectWings').value = STATE.playerWings;
  document.getElementById('selectBelt').value = STATE.playerBelt;

  updateAvatarPreview();
  document.getElementById('modalCustomization').classList.add('active');
}

function applyCustomization() {
  const newNick = document.getElementById('inputNick').value.trim() || STATE.playerName || '신도';
  const newTitle = document.getElementById('selectTitle').value || STATE.playerRankTitle;
  const newRobe = document.getElementById('selectRobe').value;
  const newHat = document.getElementById('selectHat').value;
  const newWings = document.getElementById('selectWings').value;
  const newBelt = document.getElementById('selectBelt').value;

  STATE.playerName = newNick;
  STATE.playerTitle = newTitle;
  STATE.playerRobe = newRobe;
  STATE.playerHat = newHat;
  STATE.playerWings = newWings;
  STATE.playerBelt = newBelt;

  const rank = getRankByLevel(STATE.playerLevel);
  const fullName = `[Lv.${STATE.playerLevel} ${rank.title}] ${newNick}`;
  playerCharacter.name = fullName;
  if (playerCharacter.nameTagEl) {
    playerCharacter.nameTagEl.innerHTML = `<span>${fullName}</span>`;
  }

  // 3D 모델 색상 및 파츠 변경
  const rColor = COLOR_PALETTE[newRobe] || 0xfffcf5;
  playerCharacter.robeMat.color.setHex(rColor);
  playerCharacter.robeMat.needsUpdate = true;

  const bColor = COLOR_PALETTE[newBelt] || 0xff3352;
  playerCharacter.beltMat.color.setHex(bColor);
  playerCharacter.beltMat.needsUpdate = true;

  applyHatParts(playerCharacter, newHat);
  applyWingsParts(playerCharacter, newWings);

  document.getElementById('modalCustomization').classList.remove('active');

  showSpeechBubble(playerCharacter, "새로운 성의를 입고 거듭났나이다!");
  window.gajaAudio.playAmenBellSfx();

  // 서버로 내 변경된 외형 브로드캐스트
  if (STATE.multiWs && STATE.multiWs.readyState === WebSocket.OPEN) {
    STATE.multiWs.send(JSON.stringify({
      type: 'update_look',
      room: STATE.currentRoom,
      name: fullName,
      robe: newRobe,
      hat: newHat,
      wings: newWings,
      belt: newBelt
    }));
  }
}

// ==========================================
// 9. 성령의 떡상 룰렛 (Sacred Gaja Wheel)
// ==========================================
let isSpinning = false;

function openRouletteModal() {
  document.getElementById('modalRoulette').classList.add('active');
  document.getElementById('rouletteResult').textContent = "룰렛을 돌려 오늘 하루의 은혜를 받으세요!";
}

function spinRoulette() {
  if (isSpinning) return;
  isSpinning = true;

  const wheel = document.getElementById('rouletteWheel');
  const resultEl = document.getElementById('rouletteResult');
  resultEl.textContent = "성령의 기운이 룰렛을 회전시키고 있습니다...";

  const randomDeg = 1440 + Math.floor(Math.random() * 360);
  wheel.style.transform = `rotate(${randomDeg}deg)`;

  window.gajaAudio.playTonguePrayerSfx();

  setTimeout(() => {
    isSpinning = false;
    const reward = ROULETTE_REWARDS[Math.floor(Math.random() * ROULETTE_REWARDS.length)];
    resultEl.textContent = `축복 당첨: ${reward}`;

    spawnBlessingFire();
    window.gajaAudio.playOfferingSfx();

    showSpeechBubble(playerCharacter, `[${reward}] 은혜 획득!`);
    addTestimonyToFeed(playerCharacter.name, `성령 룰렛에서 [${reward}]을 획득하였습니다! 아멘!`, 'long');
    addMissionProgress('roulette', 1);

    if (STATE.multiWs && STATE.multiWs.readyState === WebSocket.OPEN) {
      STATE.multiWs.send(JSON.stringify({
        type: 'roulette',
        name: playerCharacter.name,
        reward: reward
      }));
    }
  }, 3600);
}

// ==========================================
// 10. 미니게임 & 부흥회 이벤트 핸들러
// ==========================================
function openRevelationModal() {
  const modal = document.getElementById('modalRevelation');
  const verseEl = document.getElementById('revVerse');
  const luckEl = document.getElementById('revLuck');

  const randomRev = REVELATIONS[Math.floor(Math.random() * REVELATIONS.length)];
  verseEl.textContent = randomRev.verse;
  luckEl.textContent = `★ ${randomRev.luck}`;

  modal.classList.add('active');
  window.gajaAudio.playAmenBellSfx();
  showSpeechBubble(playerCharacter, "성스러운 떡상 계시를 받았나이다!");
}

function openGuillotineModal() {
  document.getElementById('modalGuillotine').classList.add('active');
}

function executeGuillotine() {
  const stockName = document.getElementById('guillotineStock').value.trim() || '물린 잡코인';
  const lossRate = document.getElementById('guillotineLoss').value.trim() || '-45';

  document.getElementById('modalGuillotine').classList.remove('active');

  window.gajaAudio.playSlainSfx();
  spawnHolyWater(playerCharacter.group.position);
  spawnBlessingFire();

  const msg = `[악귀 퇴마] [${stockName}] (${lossRate}%) 하락 악귀를 단두대로 베었나이다! 원금 구원 아멘!`;
  showSpeechBubble(playerCharacter, msg);
  addTestimonyToFeed('† 단두대 구마제단 †', msg, 'long');
  sendMultiplayerTestimony(msg);
}

function openCandleModal() {
  document.getElementById('modalCandle').classList.add('active');
}

function executeCandleOffering() {
  const wishText = document.getElementById('candleWish').value.trim() || '평단가 탈출 기원';
  const targetPrice = document.getElementById('candlePrice').value.trim() || '상한가';

  document.getElementById('modalCandle').classList.remove('active');

  const candleGroup = new THREE.Group();
  const cX = (Math.random() - 0.5) * 6;
  const cZ = -10.5 + (Math.random() - 0.5) * 1.5;
  candleGroup.position.set(cX, 2.7, cZ);

  const candleMesh = new THREE.Mesh(SHARED_GEO.candle, new THREE.MeshStandardMaterial({ color: 0xfff3d6 }));
  candleGroup.add(candleMesh);

  const flameMesh = new THREE.Mesh(SHARED_GEO.spark, new THREE.MeshBasicMaterial({ color: 0xff3352 }));
  flameMesh.position.y = 0.38;
  candleGroup.add(flameMesh);

  const candleLight = new THREE.PointLight(0xffaa44, 0.8, 4);
  candleLight.position.y = 0.45;
  candleGroup.add(candleLight);

  scene.add(candleGroup);

  window.gajaAudio.playAmenBellSfx();
  const logMsg = `촛불 봉헌: "${wishText}" (목표가: ${targetPrice}) 성화 점화 완료!`;
  showSpeechBubble(playerCharacter, logMsg);
  addTestimonyToFeed(playerCharacter.name, logMsg, 'long');
  sendMultiplayerTestimony(logMsg);
}

function openEventModal() {
  renderEventList();
  document.getElementById('modalEvent').classList.add('active');
}

function renderEventList() {
  const container = document.getElementById('eventItemList');
  container.innerHTML = '';
  EVENT_LIST.forEach(ev => {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
      <div>
        <div class="event-title">† ${ev.title}</div>
        <div class="event-time">일시: ${ev.time}</div>
      </div>
      <button class="event-amen-btn" onclick="voteEventAmen(${ev.id})">아멘 (${ev.count})</button>
    `;
    container.appendChild(card);
  });
}

window.voteEventAmen = function(id) {
  const ev = EVENT_LIST.find(e => e.id === id);
  if (ev) {
    ev.count += 1;
    renderEventList();
    window.gajaAudio.playClapSfx();
    showSpeechBubble(playerCharacter, `[${ev.title}] 집회에 아멘으로 화답했습니다!`);
  }
};

function registerNewEvent() {
  const title = document.getElementById('newEventTitle').value.trim();
  const time = document.getElementById('newEventTime').value.trim() || '오늘 밤';

  if (!title) return;

  const newEv = {
    id: Date.now(),
    title: title,
    time: time,
    count: 1
  };
  EVENT_LIST.unshift(newEv);
  renderEventList();

  document.getElementById('newEventTitle').value = '';
  document.getElementById('newEventTime').value = '';

  window.gajaAudio.playAmenBellSfx();
  const broadcastMsg = `새 부흥회 등록: [${title}] (${time}) 많은 동참 바랍니다!`;
  addTestimonyToFeed('† 가즈아교 총회 †', broadcastMsg, 'long');
  sendMultiplayerTestimony(broadcastMsg);
}

// ==========================================
// 11. 하단 기도 툴바 액션 및 성전 시스템 (Actions & Temple Mechanics)
// ==========================================
function updateRitualHud(gauge) {
  const fill = document.getElementById('ritualBarFill');
  const txt = document.getElementById('ritualGaugeText');
  const safeGauge = Math.max(0, Math.min(100, Math.round(gauge)));
  if (fill) fill.style.width = `${safeGauge}%`;
  if (txt) txt.textContent = `${safeGauge}%`;
}

function triggerRitualAction(amount = 3, actionName = '기도') {
  STATE.ritualGauge = Math.min(100, STATE.ritualGauge + amount);
  updateRitualHud(STATE.ritualGauge);
  addMissionProgress('ritual', 1);

  if (STATE.multiWs && STATE.multiWs.readyState === WebSocket.OPEN) {
    STATE.multiWs.send(JSON.stringify({
      type: 'ritual_add',
      amount: amount,
      name: STATE.playerName,
      act: actionName
    }));
  }

  if (STATE.ritualGauge >= 100 && !STATE.ritualActive) {
    startRitualAscension(200);
  }
}

function startRitualAscension(bonusExp = 200) {
  if (STATE.ritualActive) return;
  STATE.ritualActive = true;

  const banner = document.getElementById('ritualAscensionBanner');
  if (banner) banner.classList.add('active');

  if (window.gajaAudio) {
    window.gajaAudio.playAmenBellSfx();
  }

  if (megaCandleMesh) {
    megaCandleMesh.visible = true;
  }

  spawnBlessingFire();
  spawnOfferingCoins({ x: 0, y: 1.5, z: -12.5 });
  addExp(bonusExp);

  addTestimonyToFeed('† 대양봉 강림 성령 집회 †', '전 신도 합심 기도로 제단에 초대형 황금 양봉이 승천했습니다! (+200 EXP)', 'long');

  setTimeout(() => {
    if (banner) banner.classList.remove('active');
    if (megaCandleMesh) megaCandleMesh.visible = false;
    STATE.ritualActive = false;
  }, 12000);
}

function interactWithBullStatue() {
  STATE.hasBullBuff = true;
  addMissionProgress('bull', 1);

  if (playerCharacter) {
    showSpeechBubble(playerCharacter, '🐂 † 성스러운 황금 황소의 상한가 축복을 받았습니다! 가즈아! †');
  }

  spawnBlessingFire();
  if (window.gajaAudio) window.gajaAudio.playAmenBellSfx();

  addTestimonyToFeed(STATE.playerName, '남관 황금 황소 성물에서 상한가 축복(이동속도 +35%)을 영접했습니다!', 'long');

  if (STATE.multiWs && STATE.multiWs.readyState === WebSocket.OPEN) {
    STATE.multiWs.send(JSON.stringify({
      type: 'bull_buff',
      name: STATE.playerName
    }));
  }

  clearTimeout(window._bullBuffTimer);
  window._bullBuffTimer = setTimeout(() => {
    STATE.hasBullBuff = false;
  }, 60000);
}

// ------------------------------------------
// 4대 신규 성지 상호작용
// ------------------------------------------
function interactWithWhaleStatue() {
  addExp(150);
  addMissionProgress('bull', 1);
  if (playerCharacter) {
    showSpeechBubble(playerCharacter, '🐋 † 100억 슈퍼고래의 성령 기운을 영접했습니다! (+150 EXP) †');
  }
  spawnBlessingFire();
  spawnOfferingCoins(playerCharacter ? playerCharacter.group.position : { x: 0, y: 1, z: -26 });
  if (window.gajaAudio) window.gajaAudio.playLevelUpSfx();
  addTestimonyToFeed(STATE.playerName, '북관 100억 슈퍼고래 영생 참배원에서 고래 기운을 전수받았습니다!', 'long');

  if (STATE.multiWs && STATE.multiWs.readyState === WebSocket.OPEN) {
    STATE.multiWs.send(JSON.stringify({
      type: 'chat_action',
      name: STATE.playerName,
      action: 'whale_bless',
      text: '북관 100억 슈퍼고래의 성령 축복을 받았습니다!'
    }));
  }
}

function interactWithCandleAltar() {
  if (playerCharacter) {
    showSpeechBubble(playerCharacter, '🕯️ † 성스러운 떡상 촛불 봉헌대에 도착했습니다! †');
  }
  if (window.gajaAudio) window.gajaAudio.playAmenBellSfx();
  openCandleModal();
}

function interactWithCoinPond() {
  addExp(100);
  triggerRitualAction(6, '연못 코인 봉헌');
  spawnOfferingCoins(playerCharacter ? playerCharacter.group.position : { x: 0, y: 1, z: 64 });
  if (window.gajaAudio) window.gajaAudio.playOfferingSfx();
  if (playerCharacter) {
    showSpeechBubble(playerCharacter, '🪙 † 영끌 행운의 연못에 코인을 던졌습니다! 떡상 계시 축복 임재! †');
  }
  addTestimonyToFeed(STATE.playerName, '남관 영끌 코인 연못에 동전을 던져 떡상 계시 행운을 기원했습니다!', 'long');

  if (STATE.multiWs && STATE.multiWs.readyState === WebSocket.OPEN) {
    STATE.multiWs.send(JSON.stringify({
      type: 'chat_action',
      name: STATE.playerName,
      action: 'coin_pond',
      text: '남관 행운의 연못에 동전을 던져 소망을 빌었습니다!'
    }));
  }
}

function interactWithRevivalCircle() {
  triggerRitualAction(12, '성령존 통성기도');
  if (playerCharacter) {
    playerCharacter.state = 'tongue';
    playerCharacter.stateTimer = 5.0;
    showSpeechBubble(playerCharacter, '🔥 † 부흥회 성령 강림존! 전 신도 양봉 게이지가 대폭발합니다! †');
  }
  spawnBlessingFire();
  if (window.gajaAudio) window.gajaAudio.playAmenBellSfx();
  addTestimonyToFeed(STATE.playerName, '동관 통성기도 성령존에 진입하여 온몸으로 방언 기도를 올립니다!', 'long');

  sendMultiplayerAction('tongue', '동관 성령존에서 강력한 통성기도를 올립니다!');
}

// ------------------------------------------
// 신규 액션 트리거 핸들러
// ------------------------------------------
function triggerKneel() {
  if (!playerCharacter) return;
  playerCharacter.state = 'kneel';
  playerCharacter.stateTimer = 4.0;
  if (window.gajaAudio) window.gajaAudio.playAmenBellSfx();
  triggerRitualAction(4, '간절 석고대죄');
  const msg = "주여.. 제발 원금만 찾게 하소서! 아멘! 🙏";
  showSpeechBubble(playerCharacter, msg);
  addTestimonyToFeed(playerCharacter.name, "무릎 꿇고 엎드려 간절하게 본전 구원을 빌었습니다.", "long");
  sendMultiplayerAction('kneel', msg);
}

function triggerDance() {
  if (!playerCharacter) return;
  playerCharacter.state = 'dance';
  playerCharacter.stateTimer = 4.5;
  if (window.gajaAudio) window.gajaAudio.playClapSfx();
  triggerRitualAction(5, '성령 떡상 댄스');
  const msg = "떡상 부흥회 댄스 가즈아아아! 💃🕺";
  showSpeechBubble(playerCharacter, msg);
  addTestimonyToFeed(playerCharacter.name, "흥겨운 떡상 부흥회 성령 댄스를 춥니다!", "long");
  sendMultiplayerAction('dance', msg);
}

function triggerMegaBull() {
  if (!playerCharacter) return;
  playerCharacter.state = 'megabull';
  playerCharacter.stateTimer = 3.5;
  spawnOfferingCoins(playerCharacter.group.position);
  if (window.gajaAudio) window.gajaAudio.playAmenBellSfx();
  triggerRitualAction(10, '양봉 승천');
  const msg = "솟구쳐라 황금 양봉 불기둥이여! 🚀🔥";
  showSpeechBubble(playerCharacter, msg);
  addTestimonyToFeed(playerCharacter.name, "황금 양봉 불기둥을 소환하여 승천을 선포했습니다!", "long");
  sendMultiplayerAction('megabull', msg);
}

function triggerMoneyBless() {
  if (!playerCharacter) return;
  playerCharacter.state = 'moneybless';
  playerCharacter.stateTimer = 4.0;
  spawnOfferingCoins(playerCharacter.group.position);
  if (window.gajaAudio) window.gajaAudio.playOfferingSfx();
  triggerRitualAction(7, '돈복사 대축도');
  const msg = "온 성전에 돈복사의 은혜가 넘쳐날지어다! 💸✨";
  showSpeechBubble(playerCharacter, msg);
  addTestimonyToFeed(playerCharacter.name, "모든 신도에게 100배 돈복사 축복을 내렸습니다!", "long");
  sendMultiplayerAction('moneybless', msg);
}

function triggerShout() {
  if (!playerCharacter) return;
  playerCharacter.state = 'shout';
  playerCharacter.stateTimer = 3.0;
  if (window.gajaAudio) window.gajaAudio.playAmenBellSfx();
  triggerRitualAction(6, '떡상 사자후');
  const msg = "가즈아아아아아아아아아아아아!! 🦁🔥";
  showSpeechBubble(playerCharacter, msg);
  addTestimonyToFeed(playerCharacter.name, "하늘이 떠나가도록 떡상 사자후를 외쳤습니다!", "long");
  sendMultiplayerAction('shout', msg);
}

function triggerLevitate() {
  if (!playerCharacter) return;
  playerCharacter.state = 'levitate';
  playerCharacter.stateTimer = 5.0;
  if (window.gajaAudio) window.gajaAudio.playAmenBellSfx();
  triggerRitualAction(8, '공중부양 승천');
  const msg = "내가 하늘로 승천하노라! 🪽☁️";
  showSpeechBubble(playerCharacter, msg);
  addTestimonyToFeed(playerCharacter.name, "공중부양으로 허공을 날아오르며 승천했습니다!", "long");
  sendMultiplayerAction('levitate', msg);
}

function sendBossHit(dmg = 8) {
  if (!bossGroup || !bossGroup.visible) return;

  STATE.bossHp = Math.max(0, STATE.bossHp - dmg);
  if (bossHpFillMesh) {
    const ratio = Math.max(0, STATE.bossHp / 100);
    bossHpFillMesh.scale.x = ratio;
    bossHpFillMesh.position.x = -(1.0 - ratio) * 1.5;
  }

  spawnBlessingFire();
  if (window.gajaAudio) window.gajaAudio.playOfferingSfx();

  addMissionProgress('boss', 1);

  if (STATE.multiWs && STATE.multiWs.readyState === WebSocket.OPEN) {
    STATE.multiWs.send(JSON.stringify({
      type: 'boss_hit',
      dmg: dmg,
      name: STATE.playerName
    }));
  }

  if (STATE.bossHp <= 0) {
    onBossDefeated(150);
  }
}

function onBossDefeated(bonusExp = 150) {
  const banner = document.getElementById('bossDefeatedBanner');
  if (banner) banner.classList.add('active');

  if (window.gajaAudio) window.gajaAudio.playLevelUpSfx();
  spawnBlessingFire();
  if (bossGroup) bossGroup.visible = false;

  addExp(bonusExp);
  addTestimonyToFeed('† 퇴마 완료 †', '서관 통곡실의 공매도 악귀 마왕이 신도들의 성수에 궤멸되었습니다! (+150 EXP)', 'long');

  setTimeout(() => {
    if (banner) banner.classList.remove('active');
  }, 7000);
}

function onBossRespawn(hp = 100) {
  STATE.bossHp = hp;
  if (bossGroup) bossGroup.visible = true;
  if (bossHpFillMesh) {
    bossHpFillMesh.scale.x = 1.0;
    bossHpFillMesh.position.x = 0;
  }
  addTestimonyToFeed('† 성전 긴급 속보 †', '공매도 악귀 마왕이 서관에서 다시 부활 준동합니다! 신도들이여 성수를 들어라!', 'long');
}

function interactWithThrone() {
  if (!playerCharacter) return;
  if (STATE.playerLevel >= 20) {
    playerCharacter.group.position.set(0, 2.1, -13.8);
    playerCharacter.group.rotation.y = 0;
    showSpeechBubble(playerCharacter, '👑 [대양봉교 교주] 천상의 황금 왕좌에 착석하여 전 신도들에게 은혜를 하사합니다!');
    spawnBlessingFire();
    if (window.gajaAudio) window.gajaAudio.playAmenBellSfx();
    addTestimonyToFeed(STATE.playerName, '대양봉교 교주가 제단 황금 왕좌에 즉위하셨습니다! 경배하라!', 'long');
  } else {
    showSpeechBubble(playerCharacter, `👑 [교주의 황금 왕좌] Lv.20 [대양봉교 교주]만이 착석할 수 있는 지존의 자리입니다! (현재: Lv.${STATE.playerLevel} ${STATE.playerRankTitle})`);
  }
}

function triggerTonguePrayer() {
  if (!playerCharacter) return;
  playerCharacter.state = 'tongue';
  playerCharacter.stateTimer = 4.0;

  // 롱숏 대결 투표 반영
  if (STATE.playerBelt === 'long') STATE.longVotes += 5;
  else STATE.shortVotes += 5;
  updateWarBar();

  // 만약 서관 마왕 보스 근처(x < -16)라면 마왕에게 방언 퇴마 타격!
  if (playerCharacter.group.position.x < -16 && bossGroup && bossGroup.visible) {
    sendBossHit(18);
  } else {
    triggerRitualAction(5, '통성 방언기도');
  }

  const shout = TONGUE_SHOUTS[Math.floor(Math.random() * TONGUE_SHOUTS.length)];
  showSpeechBubble(playerCharacter, shout);
  addTestimonyToFeed(playerCharacter.name, shout, STATE.playerBelt);

  window.gajaAudio.playTonguePrayerSfx();
  sendMultiplayerAction('tongue', shout);
}

function triggerSlainInSpirit() {
  if (!playerCharacter) return;
  playerCharacter.state = 'slain';
  playerCharacter.stateTimer = 3.5;

  const shout = "은혜가 너무 넘쳐 쓰러집니다아악!!";
  showSpeechBubble(playerCharacter, shout);
  window.gajaAudio.playSlainSfx();
  sendMultiplayerAction('slain', shout);
}

function triggerOffering() {
  if (!playerCharacter) return;
  playerCharacter.state = 'offering';
  playerCharacter.stateTimer = 2.0;

  spawnOfferingCoins(playerCharacter.group.position);
  window.gajaAudio.playOfferingSfx();
  addMissionProgress('offering', 1);
  triggerRitualAction(8, '영끌 헌금');

  const msg = "마통 뚫어 십일조 봉헌합니다!! 떡상 주옵소서!";
  showSpeechBubble(playerCharacter, msg);
  addTestimonyToFeed(playerCharacter.name, "영끌 십일조를 봉헌하였습니다. (양봉 게이지 +8%)", "long");
  sendMultiplayerAction('offering', msg);
}

function triggerClap() {
  if (!playerCharacter) return;
  playerCharacter.state = 'clap';
  playerCharacter.stateTimer = 3.0;

  window.gajaAudio.playClapSfx();
  triggerRitualAction(3, '열렬 찬양');
  sendMultiplayerAction('clap');
}

function triggerHolyWater() {
  if (!playerCharacter) return;
  spawnHolyWater(playerCharacter.group.position);
  window.gajaAudio.playHolyWaterSfx();
  addMissionProgress('holywater', 1);

  let msg = "물러가라 파란 음봉 악귀야!!";
  if (playerCharacter.group.position.x < -16 && bossGroup && bossGroup.visible) {
    sendBossHit(15);
    msg = "물러가라 공매도 악귀 마왕아!! (성수 강타 -15)";
    showSpeechBubble(playerCharacter, msg);
    addTestimonyToFeed(playerCharacter.name, "공매도 마왕에게 성수를 뿌려 큰 타격을 입혔습니다!", "long");
  } else {
    triggerRitualAction(4, '성수 축복');
    showSpeechBubble(playerCharacter, msg);
    addTestimonyToFeed(playerCharacter.name, "성수를 뿌려 하락 악귀를 퇴마했습니다!", "long");
  }

  sendMultiplayerAction('holywater', msg);
}

function toggleBelt() {
  STATE.playerBelt = STATE.playerBelt === 'long' ? 'short' : 'long';
  playerCharacter.beltType = STATE.playerBelt;

  const color = COLOR_PALETTE[STATE.playerBelt];
  playerCharacter.beltMat.color.setHex(color);

  const beltName = STATE.playerBelt === 'long' ? '[결사 롱] 붉은 띠' : '[회개 숏] 푸른 띠';
  showSpeechBubble(playerCharacter, `${beltName}로 환복 완료!`);

  sendMultiplayerAction('belt', STATE.playerBelt);
}

function updateWarBar() {
  const total = STATE.longVotes + STATE.shortVotes;
  const longP = Math.round((STATE.longVotes / total) * 100);
  const fillEl = document.getElementById('warBarFill');
  const textEl = document.getElementById('warText');
  if (fillEl) fillEl.style.width = `${longP}%`;
  if (textEl) textEl.textContent = `롱 ${longP}% : 숏 ${100 - longP}%`;
}

function changeRoom(newRoomKey) {
  if (!STATE.roomData[newRoomKey]) return;
  STATE.currentRoom = newRoomKey;

  const data = STATE.roomData[newRoomKey];
  STATE.priceHistory = [data.price * 0.99, data.price * 0.995, data.price];

  updateAltarScreenCanvas();
  updateHudUI();

  if (data.isCrypto) connectUpbit();

  for (const cid in remotePeers) {
    scene.remove(remotePeers[cid].group);
    if (remotePeers[cid].nameTagEl) remotePeers[cid].nameTagEl.remove();
    delete remotePeers[cid];
  }

  if (STATE.multiWs && STATE.multiWs.readyState === WebSocket.OPEN) {
    STATE.multiWs.send(JSON.stringify({
      type: 'join',
      room: STATE.currentRoom,
      name: playerCharacter.name,
      level: STATE.playerLevel,
      title: STATE.playerRankTitle,
      robe: STATE.playerRobe,
      hat: STATE.playerHat,
      wings: STATE.playerWings,
      belt: STATE.playerBelt,
      x: 0, y: 0, z: 2
    }));
  }

  showSpeechBubble(playerCharacter, `† ${data.name}으로 이동하였습니다 †`);
  window.gajaAudio.playAmenBellSfx();
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupServerConfigModal() {
  const btn = document.getElementById('btnServerConfig');
  const modal = document.getElementById('modalServerConfig');
  const closeBtn = modal?.querySelector('.modal-close-btn');

  if (btn && modal) {
    btn.addEventListener('click', () => {
      modal.classList.add('active');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }
}

// ==========================================
// 12. 모바일 브라우저 화면 왜곡/확대/축소 원천 방지 & DOM 초기화
// ==========================================
function setupMobileViewportProtection() {
  // 1. iOS Safari 멀티터치 제스처 (핀치 줌인/줌아웃) 원천 차단
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(eventName => {
    document.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });
  });

  // 2. 더블 탭 확대/축소(double-tap to zoom) 원천 차단
  let lastTouchEndTime = 0;
  document.addEventListener('touchend', (e) => {
    const now = performance.now();
    if (now - lastTouchEndTime <= 320) {
      const tag = e.target ? e.target.tagName : '';
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
      }
    }
    lastTouchEndTime = now;
  }, { passive: false });

  // 3. UI 레이어 및 비 캔버스 영역에서의 두 손가락 핀치 브라우저 확대/축소 차단
  document.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length > 1) {
      if (e.target && e.target.id !== 'gl-canvas') {
        e.preventDefault();
      }
    }
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 1) {
      if (e.target && e.target.id !== 'gl-canvas') {
        e.preventDefault();
      }
    }
  }, { passive: false });

  // 4. iOS 사파리 뷰포트 왜곡/축소 복구 리스너
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      window.scrollTo(0, 0);
      if (typeof onWindowResize === 'function') {
        onWindowResize();
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setupMobileViewportProtection();
  initWorld();
  setupServerConfigModal();

  // 대성전 초대 링크 원클릭 복사
  const shareBtn = document.getElementById('btnShareLink');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      let shareUrl = 'https://kicharisma2.github.io/gazua-cult/';
      if (STATE.cloudHost && !STATE.cloudHost.includes('127.0.0.1') && !STATE.cloudHost.includes('localhost')) {
        shareUrl = `https://kicharisma2.github.io/gazua-cult/?server=${STATE.cloudHost}`;
      }
      navigator.clipboard.writeText(shareUrl).then(() => {
        if (playerCharacter) {
          showSpeechBubble(playerCharacter, '† 초대 링크가 복사되었습니다! 카톡이나 폰에 공유하세요 †');
        }
        addTestimonyToFeed('† 초대 링크 복사 †', `[${shareUrl}] 주소가 복사되었습니다. 다른 기기나 친구에게 보내주세요!`, 'long');
        if (window.gajaAudio) window.gajaAudio.playAmenBellSfx();
      }).catch(() => {
        prompt('아래 대성전 초대 주소를 복사하세요:', shareUrl);
      });
    });
  }

  document.getElementById('btnTongue').addEventListener('click', triggerTonguePrayer);
  document.getElementById('btnSlain').addEventListener('click', triggerSlainInSpirit);
  document.getElementById('btnOffering').addEventListener('click', triggerOffering);
  document.getElementById('btnClap').addEventListener('click', triggerClap);
  document.getElementById('btnHolyWater').addEventListener('click', triggerHolyWater);
  document.getElementById('btnToggleBelt').addEventListener('click', toggleBelt);

  // 신규 액션 버튼 6개 바인딩
  document.getElementById('btnKneel')?.addEventListener('click', triggerKneel);
  document.getElementById('btnDance')?.addEventListener('click', triggerDance);
  document.getElementById('btnMegaBull')?.addEventListener('click', triggerMegaBull);
  document.getElementById('btnMoneyBless')?.addEventListener('click', triggerMoneyBless);
  document.getElementById('btnShout')?.addEventListener('click', triggerShout);
  document.getElementById('btnLevitate')?.addEventListener('click', triggerLevitate);

  // 사이드바 & 상단 버튼
  document.getElementById('btnOpenCustom').addEventListener('click', openCustomizationModal);
  document.getElementById('btnApplyCustom').addEventListener('click', applyCustomization);

  // 커스터마이징 실시간 프리뷰 반응 리스너
  ['inputNick', 'selectTitle', 'selectRobe', 'selectHat', 'selectWings', 'selectBelt'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateAvatarPreview);
      el.addEventListener('change', updateAvatarPreview);
    }
  });

  document.getElementById('btnOpenRoulette').addEventListener('click', openRouletteModal);
  document.getElementById('btnSpinRoulette').addEventListener('click', spinRoulette);

  // 대양봉교 랜드마크 숏컷 버튼
  const btnGoBull = document.getElementById('btnGoBull');
  if (btnGoBull) {
    btnGoBull.addEventListener('click', () => {
      if (playerCharacter) {
        playerCharacter.group.position.set(0, 0, 31);
        playerCharacter.group.rotation.y = 0;
        camera.position.set(0, 8, 45);
        if (controls) controls.target.set(0, 1.5, 35.5);
        showSpeechBubble(playerCharacter, '🐂 남관 성스러운 황금 황소 성물 앞에 도착했습니다! 상한가 축복을 받으세요!');
        if (window.gajaAudio) window.gajaAudio.playAmenBellSfx();
        checkProximityInteractions();
        setTimeout(interactWithBullStatue, 500);
      }
    });
  }

  const btnGoBoss = document.getElementById('btnGoBoss');
  if (btnGoBoss) {
    btnGoBoss.addEventListener('click', () => {
      if (playerCharacter) {
        playerCharacter.group.position.set(-25, 0, 6);
        playerCharacter.group.rotation.y = -Math.PI / 2;
        camera.position.set(-18, 7, 16);
        if (controls) controls.target.set(-31, 2.0, 6);
        showSpeechBubble(playerCharacter, '👹 서관 통곡실 공매도 악귀 마왕 레이드에 참전했습니다! 성수로 퇴마하라!');
        if (window.gajaAudio) window.gajaAudio.playAmenBellSfx();
        checkProximityInteractions();
      }
    });
  }

  // 랜드마크 상호작용 액션 버튼 클릭
  const proxBtn = document.getElementById('proximityActionBtn');
  if (proxBtn) {
    proxBtn.addEventListener('click', triggerProximityAction);
  }

  // 실시간 돌발 성령 부흥 이벤트 시스템 시작
  initHolyRandomEvents();

  // 상단 양봉 강림 게이지 클릭 시 안내 및 기여
  const ritualHudEl = document.getElementById('ritualHud');
  if (ritualHudEl) {
    ritualHudEl.addEventListener('click', () => {
      if (playerCharacter) {
        showSpeechBubble(playerCharacter, `🕯️ [양봉 강림 게이지: ${STATE.ritualGauge}%] 기도와 헌금으로 100%를 채우면 제단에서 황금 양봉이 승천합니다!`);
      }
      triggerRitualAction(2, '합심 관심');
    });
  }

  updateRitualHud(STATE.ritualGauge);

  document.getElementById('btnOpenRevelation').addEventListener('click', openRevelationModal);
  document.getElementById('btnOpenGuillotine').addEventListener('click', openGuillotineModal);
  document.getElementById('btnOpenCandle').addEventListener('click', openCandleModal);
  document.getElementById('btnOpenEvents').addEventListener('click', openEventModal);

  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      window.focus();
    });
  });

  document.getElementById('btnExecGuillotine').addEventListener('click', executeGuillotine);
  document.getElementById('btnExecCandle').addEventListener('click', executeCandleOffering);
  document.getElementById('btnCreateEvent').addEventListener('click', registerNewEvent);

  const roomSelect = document.getElementById('roomSelect');
  roomSelect.addEventListener('change', (e) => {
    changeRoom(e.target.value);
    roomSelect.blur();
    window.focus();
  });

  const bgmBtn = document.getElementById('bgmBtn');
  bgmBtn.addEventListener('click', () => {
    const isPlaying = window.gajaAudio.toggleBgm();
    bgmBtn.classList.toggle('active', isPlaying);
  });

  // 전체 대화 기록 및 월드맵 버튼 바인딩
  const btnOpenChatHistory = document.getElementById('btnOpenChatHistory');
  if (btnOpenChatHistory) btnOpenChatHistory.addEventListener('click', openChatHistoryModal);

  const btnOpenChatSide = document.getElementById('btnOpenChatSide');
  if (btnOpenChatSide) btnOpenChatSide.addEventListener('click', openChatHistoryModal);

  const btnOpenWorldMap = document.getElementById('btnOpenWorldMap');
  if (btnOpenWorldMap) btnOpenWorldMap.addEventListener('click', openWorldMapModal);

  const testimonyInput = document.getElementById('testimonyInput');
  const testimonySubmit = document.getElementById('testimonySubmit');

  const sendUserTestimony = (customInput = null) => {
    const inputEl = customInput || testimonyInput;
    if (!inputEl) return;
    const val = inputEl.value.trim();
    if (!val) return;
    inputEl.value = '';

    const nowTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    addTestimonyToFeed(playerCharacter.name, val, STATE.playerBelt, nowTime);
    showSpeechBubble(playerCharacter, val);
    sendMultiplayerTestimony(val);
    addMissionProgress('testimony', 1);
  };

  testimonySubmit.addEventListener('click', () => sendUserTestimony());
  testimonyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.isComposing) return; // 한글 IME 조합 중 엔터 중복 발송 차단
      sendUserTestimony();
    }
  });

  const modalChatInput = document.getElementById('modalChatInput');
  const modalChatSubmit = document.getElementById('modalChatSubmit');
  if (modalChatSubmit && modalChatInput) {
    modalChatSubmit.addEventListener('click', () => sendUserTestimony(modalChatInput));
    modalChatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (e.isComposing) return;
        sendUserTestimony(modalChatInput);
      }
    });
  }
});

// ==========================================
// 13. 실시간 돌발 성령 부흥 이벤트 시스템
// ==========================================
const HOLY_EVENTS = [
  {
    id: 'candle_night',
    title: '🕯️ [돌발] 떡상 촛불 봉헌의 밤 (은혜 2배)',
    desc: '지금 제단에 촛불을 봉헌하면 평단가 탈출 축복이 임합니다!',
    targetPos: { x: -28, y: 0, z: -5 },
    camPos: { x: -28, y: 6, z: 5 },
    action: () => openCandleModal()
  },
  {
    id: 'bull_surge',
    title: '🐂 [돌발] 황소 성물 상한가 대부흥',
    desc: '남관 황금 황소 성물에서 붉은 상한가 오라가 뿜어져 나옵니다!',
    targetPos: { x: 0, y: 0, z: 31 },
    camPos: { x: 0, y: 7, z: 42 },
    action: () => interactWithBullStatue()
  },
  {
    id: 'boss_invasion',
    title: '👹 [돌발] 공매도 악귀 마왕 기습 출몰',
    desc: '서관 통곡실에 하락 악귀가 준동합니다! 전 신도 성수 총력 퇴마!',
    targetPos: { x: -25, y: 0, z: 6 },
    camPos: { x: -18, y: 7, z: 16 },
    action: () => triggerHolyWater()
  },
  {
    id: 'revival_surge',
    title: '🔥 [돌발] 성령존 전 신도 단체 통성기도회',
    desc: '동관 성령존에서 강력한 불기둥이 폭발합니다! 전원 기도 합심!',
    targetPos: { x: 30, y: 0, z: -3 },
    camPos: { x: 30, y: 6, z: 6 },
    action: () => interactWithRevivalCircle()
  },
  {
    id: 'whale_blessing',
    title: '🐋 [돌발] 100억 슈퍼고래 영생 강림',
    desc: '북관 고래 참배원에 거대한 황금 코인비가 쏟아집니다!',
    targetPos: { x: 0, y: 0, z: -22 },
    camPos: { x: 0, y: 7, z: -14 },
    action: () => interactWithWhaleStatue()
  }
];

let currentHolyEvent = null;
let holyEventTimeLeft = 0;
let holyEventIntervalTimer = null;

function initHolyRandomEvents() {
  const banner = document.getElementById('holyEventBanner');
  const titleEl = document.getElementById('holyEventTitle');
  const timerEl = document.getElementById('holyEventTimer');
  const joinBtn = document.getElementById('btnJoinHolyEvent');

  if (!banner || !titleEl || !timerEl || !joinBtn) return;

  function triggerNextRandomEvent() {
    const ev = HOLY_EVENTS[Math.floor(Math.random() * HOLY_EVENTS.length)];
    currentHolyEvent = ev;
    holyEventTimeLeft = 75; // 75초간 지속

    titleEl.textContent = ev.title;
    banner.style.display = 'flex';
    if (window.gajaAudio) window.gajaAudio.playAmenBellSfx();
    addTestimonyToFeed('🚨 [돌발 부흥 집회 선포]', `${ev.title} - ${ev.desc}`, 'long');

    clearInterval(holyEventIntervalTimer);
    holyEventIntervalTimer = setInterval(() => {
      holyEventTimeLeft--;
      const min = Math.floor(holyEventTimeLeft / 60);
      const sec = holyEventTimeLeft % 60;
      timerEl.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

      if (holyEventTimeLeft <= 0) {
        clearInterval(holyEventIntervalTimer);
        banner.style.display = 'none';
        currentHolyEvent = null;
        // 다음 돌발 이벤트는 90~150초 후 발동
        setTimeout(triggerNextRandomEvent, (90 + Math.random() * 60) * 1000);
      }
    }, 1000);
  }

  joinBtn.addEventListener('click', () => {
    if (!currentHolyEvent || !playerCharacter) return;
    playerCharacter.group.position.set(currentHolyEvent.targetPos.x, currentHolyEvent.targetPos.y, currentHolyEvent.targetPos.z);
    camera.position.set(currentHolyEvent.camPos.x, currentHolyEvent.camPos.y, currentHolyEvent.camPos.z);
    if (controls) controls.target.set(currentHolyEvent.targetPos.x, 1.5, currentHolyEvent.targetPos.z);

    showSpeechBubble(playerCharacter, `† ${currentHolyEvent.title} 집회에 참전했습니다! †`);
    currentHolyEvent.action();
    addExp(80);
  });

  // 게임 시작 30초 후 첫 돌발 이벤트 발동
  setTimeout(triggerNextRandomEvent, 30000);
}
