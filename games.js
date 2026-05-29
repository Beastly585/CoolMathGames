// ═══════════════════════════════════════════════════════════════════════════
//  ARCADE ENGINE
// ═══════════════════════════════════════════════════════════════════════════

const canvas      = document.getElementById('canvas');
const ctx         = canvas.getContext('2d');
const scoreEl     = document.getElementById('score-display');
const hiscoreEl   = document.getElementById('hiscore-display');
const diffLabel   = document.getElementById('diff-label');
const marqueeTitle = document.getElementById('marquee-title');
const howToPlay    = document.getElementById('how-to-play');

const overlay        = document.getElementById('overlay');
const overlayTitle   = document.getElementById('overlay-title');
const overlayScore   = document.getElementById('overlay-score');
const overlayMsg     = document.getElementById('overlay-msg');
const overlayRestart = document.getElementById('overlay-restart');

const startOverlay = document.getElementById('start-overlay');
const startTitle   = document.getElementById('start-title');
const startDesc    = document.getElementById('start-desc');
const startBtn     = document.getElementById('start-btn');

// ── View switching ────────────────────────────────────────────────────────
const viewWrap    = document.getElementById('view-wrap');
const viewToggle  = document.getElementById('view-toggle');
const toggleLabel = document.getElementById('toggle-label');
const playBtn     = document.getElementById('play-btn');

let currentView = 'intro'; // 'intro' | 'play'

function showView(view) {
  currentView = view;
  if (view === 'play') {
    viewWrap.classList.add('show-play');
    toggleLabel.textContent = '↑ BACK TO TOP';
    viewToggle.dataset.view = 'intro';
    // Resume loop if game was running
    if (activeGame && !gameRunning && !overlay.classList.contains('hidden') === false
        && startOverlay.classList.contains('hidden')) {
      gameRunning = true;
      startLoop();
    }
  } else {
    viewWrap.classList.remove('show-play');
    toggleLabel.textContent = '↓ PLAY GAMES';
    viewToggle.dataset.view = 'play';
    // Pause loop while on intro (saves battery, stops input confusion)
    stopLoop();
    gameRunning = false;
  }
}

playBtn.addEventListener('click', () => showView('play'));
viewToggle.addEventListener('click', () => {
  showView(viewToggle.dataset.view === 'intro' ? 'intro' : 'play');
});

// ── Difficulty ────────────────────────────────────────────────────────────
const DIFF_SCALE = { easy: 0.65, medium: 1.0, hard: 1.6 };
let difficulty = 'medium';
let DIFF = DIFF_SCALE[difficulty];

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    difficulty = btn.dataset.diff;
    DIFF = DIFF_SCALE[difficulty];
    diffLabel.textContent = difficulty.toUpperCase();
    diffLabel.className = 'diff-badge ' + difficulty;
    if (activeGame && gameRunning) { setScore(0); activeGame.init(); }
  });
});

// ── Score & hi-score ──────────────────────────────────────────────────────
let score    = 0;
let hiScores = {};

function setScore(n) {
  score = n;
  scoreEl.textContent = n;
  scoreEl.classList.remove('flash');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('flash');
  if (currentGameId && n > (hiScores[currentGameId] || 0)) {
    hiScores[currentGameId] = n;
    hiscoreEl.textContent   = n;
  }
}

// ── Palette ───────────────────────────────────────────────────────────────
const C = {
  bg:      '#030308', bg2: '#0a0a18',
  cyan:    '#00f5ff', magenta: '#ff00aa',
  green:   '#39ff14', yellow:  '#ffe600',
  red:     '#ff3131', purple:  '#bf00ff',
  white:   '#ffffff', dim:     'rgba(200,216,232,0.25)',
};
function glow(color, blur = 15) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
function noGlow() { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; }

// ── Canvas internal resolution ────────────────────────────────────────────
const RES = 480;
canvas.width  = RES;
canvas.height = RES;

// ── Game state ────────────────────────────────────────────────────────────
let activeGame    = null;
let currentGameId = null;
let rafId         = null;
let gameRunning   = false;

// ── Game registry ─────────────────────────────────────────────────────────
const GAMES = {
  snake: {
    title: 'SNAKE',
    desc: 'Arrow keys to move.<br>Eat the food. Don\'t bite yourself.',
    how: '<p>Eat the glowing dot to grow.</p><p>Avoid the walls and your own tail.</p><p>Higher difficulty = faster snake.</p>',
    factory: makeSnake,
  },
  flappy: {
    title: 'FLAPPY',
    desc: 'Press <b>SPACE</b> or tap ● to flap.<br>Squeeze through every gap.',
    how: '<p>Flap to stay airborne.</p><p>Fit through the gaps without hitting pipes or walls.</p><p>Higher difficulty = faster pipes, tighter gaps.</p>',
    factory: makeFlappy,
  },
  breakout: {
    title: 'BREAKOUT',
    desc: 'Move the paddle to keep the ball alive.<br>Break all the bricks to win.',
    how: '<p>Arrow keys or mouse to move the paddle.</p><p>Clear every brick — don\'t drop the ball.</p><p>Higher difficulty = faster ball.</p>',
    factory: makeBreakout,
  },
  tetris: {
    title: 'TETRIS',
    desc: '← → to move, ↑ to rotate.<br>↓ soft drop · SPACE hard drop.',
    how: '<p>Fit pieces together and clear full rows.</p><p>Game ends when the stack hits the top.</p><p>Higher difficulty = faster drop speed.</p>',
    factory: makeTetris,
  },
  asteroids: {
    title: 'ASTEROIDS',
    desc: '← → to rotate · ↑ to thrust.<br>SPACE to shoot. Take out every rock.',
    how: '<p>Rotate and thrust your ship around the field.</p><p>Shoot the rocks — big ones split into smaller ones.</p><p>Higher difficulty = faster asteroids.</p>',
    factory: makeAsteroids,
  },
};

// ── Load game ─────────────────────────────────────────────────────────────
function loadGame(gameId) {
  stopLoop();
  if (activeGame?.destroy) activeGame.destroy();
  gameRunning = false;
  overlay.classList.add('hidden');

  currentGameId = gameId;
  const cfg = GAMES[gameId];

  marqueeTitle.textContent = cfg.title;
  startTitle.textContent   = cfg.title;
  startDesc.innerHTML      = cfg.desc;
  howToPlay.innerHTML      = cfg.how;
  hiscoreEl.textContent    = hiScores[gameId] || 0;

  document.querySelectorAll('.game-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.game === gameId);
  });

  setScore(0);
  activeGame = cfg.factory();

  startOverlay.classList.remove('hidden');
  startBtn.onclick = () => {
    startOverlay.classList.add('hidden');
    activeGame.init();
    gameRunning = true;
    startLoop();
  };
}

// ── Game loop ─────────────────────────────────────────────────────────────
let lastTime = 0;
function loop(ts) {
  if (!gameRunning) return;
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  activeGame.update(dt);
  activeGame.render();
  rafId = requestAnimationFrame(loop);
}
function startLoop() {
  stopLoop();
  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);
}
function stopLoop() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

// ── Game-over helper ──────────────────────────────────────────────────────
function triggerGameOver(title = 'GAME OVER', msg = '', finalScore) {
  gameRunning = false;
  stopLoop();
  overlayTitle.textContent = title;
  overlayScore.textContent = finalScore != null ? `SCORE  ${finalScore}` : '';
  overlayMsg.innerHTML     = msg;
  overlay.classList.remove('hidden');
}

overlayRestart.onclick = () => {
  overlay.classList.add('hidden');
  setScore(0);
  activeGame.init();
  gameRunning = true;
  startLoop();
};

// ── Game-pill clicks ──────────────────────────────────────────────────────
document.querySelectorAll('.game-pill').forEach(pill => {
  pill.addEventListener('click', () => loadGame(pill.dataset.game));
});

// ── D-pad / action buttons ────────────────────────────────────────────────
document.querySelectorAll('.dpad-btn, .ab-btn').forEach(btn => {
  const fire = () => { if (activeGame?.mobile) activeGame.mobile(btn.dataset.dir); };
  btn.addEventListener('touchstart', e => { e.preventDefault(); fire(); }, { passive: false });
  btn.addEventListener('mousedown', fire);
});

// ── Boot ─────────────────────────────────────────────────────────────────
// Set correct initial toggle label (we start on intro)
toggleLabel.textContent = '↓ PLAY GAMES';
viewToggle.dataset.view = 'play';
loadGame('snake');


// ═══════════════════════════════════════════════════════════════════════════
//  SNAKE
// ═══════════════════════════════════════════════════════════════════════════
function makeSnake() {
  const BS   = 24;
  const COLS = Math.floor(RES / BS);   // 20
  const ROWS = Math.floor(RES / BS);   // 20
  let snake, dir, nextDir, food, acc, snakeScore;

  function init() {
    snake = [{ x:10,y:10 },{ x:9,y:10 },{ x:8,y:10 }];
    dir = nextDir = { x:1, y:0 };
    acc = snakeScore = 0;
    setScore(0);
    placeFood();
  }

  function placeFood() {
    let p;
    do { p = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) }; }
    while (snake.some(s => s.x===p.x && s.y===p.y));
    food = p;
  }

  function update(dt) {
    // DIFF multiplier: higher = faster step rate
    const STEP = 0.1 / DIFF;
    acc += dt;
    if (acc < STEP) return;
    acc = 0;
    dir = { ...nextDir };
    const head = { x: snake[0].x+dir.x, y: snake[0].y+dir.y };
    if (head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS) { triggerGameOver('GAME OVER','You hit the wall.',snakeScore); return; }
    if (snake.some(s=>s.x===head.x&&s.y===head.y))       { triggerGameOver('GAME OVER','You bit yourself.',snakeScore); return; }
    snake.unshift(head);
    if (head.x===food.x && head.y===food.y) { snakeScore+=10; setScore(snakeScore); placeFood(); }
    else snake.pop();
  }

  function render() {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0,0,RES,RES);
    // grid
    ctx.strokeStyle = 'rgba(0,245,255,0.04)'; ctx.lineWidth = 0.5;
    for (let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*BS,0);ctx.lineTo(x*BS,RES);ctx.stroke();}
    for (let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*BS);ctx.lineTo(RES,y*BS);ctx.stroke();}
    // food
    glow(C.magenta,20); ctx.fillStyle=C.magenta;
    ctx.fillRect(food.x*BS+3,food.y*BS+3,BS-6,BS-6);
    noGlow();
    // snake
    snake.forEach((s,i)=>{
      const t=1-i/snake.length;
      ctx.fillStyle = i===0 ? C.green : `rgba(57,255,20,${0.25+t*0.55})`;
      if(i===0) glow(C.green,16); else noGlow();
      const r=i===0?3:2;
      ctx.beginPath();
      ctx.roundRect(s.x*BS+1,s.y*BS+1,BS-2,BS-2,r);
      ctx.fill();
    });
    noGlow();
  }

  function handleKey(e) {
    const m = { ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0} };
    const nd = m[e.code];
    if (!nd) return;
    if (nd.x!==-dir.x||nd.y!==-dir.y) nextDir=nd;
    e.preventDefault();
  }
  document.addEventListener('keydown', handleKey);
  return {
    init, update, render,
    mobile(d){ const m={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}}; if(m[d]&&(m[d].x!==-dir.x||m[d].y!==-dir.y)) nextDir=m[d]; },
    destroy(){ document.removeEventListener('keydown',handleKey); }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  FLAPPY
// ═══════════════════════════════════════════════════════════════════════════
function makeFlappy() {
  const W=RES, H=RES;
  const BIRD_X=90, BIRD_R=13;
  let birdY, birdVel, pipes, pipeTimer, flappyScore, dead;

  // DIFF scales pipe speed, gap tightness, gravity
  function cfg() {
    return {
      gravity:   1300 * DIFF,
      flapVel:  -440,
      pipeSpd:   165 * DIFF,
      pipeGap:   Math.round(148 - DIFF * 26),   // easy=131 med=122 hard=106
      pipeInt:   1.7 / DIFF,
    };
  }

  function init() {
    birdY=H/2; birdVel=0; pipes=[]; pipeTimer=0; flappyScore=0; dead=false;
    setScore(0);
  }

  function spawnPipe() {
    const {pipeGap} = cfg();
    const gapY = 70 + Math.random()*(H-70-pipeGap-70);
    pipes.push({x:W, gapY, scored:false});
  }

  function flap(){
    if(dead) return;
    birdVel = cfg().flapVel;
  }

  function update(dt) {
    if(dead) return;
    const {gravity,pipeSpd,pipeGap,pipeInt} = cfg();
    birdVel+=gravity*dt; birdY+=birdVel*dt;
    pipeTimer+=dt;
    if(pipeTimer>pipeInt){spawnPipe();pipeTimer=0;}
    for(const p of pipes){
      p.x-=pipeSpd*dt;
      if(!p.scored&&p.x+50<BIRD_X){p.scored=true;flappyScore++;setScore(flappyScore);}
    }
    pipes=pipes.filter(p=>p.x+50>-10);
    if(birdY-BIRD_R<0||birdY+BIRD_R>H){dead=true;triggerGameOver('GAME OVER','You crashed.',flappyScore);return;}
    for(const p of pipes){
      if(BIRD_X+BIRD_R>p.x&&BIRD_X-BIRD_R<p.x+50){
        if(birdY-BIRD_R<p.gapY||birdY+BIRD_R>p.gapY+pipeGap){dead=true;triggerGameOver('GAME OVER','You hit a pipe.',flappyScore);return;}
      }
    }
  }

  function render(){
    const grad=ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'#06061a');grad.addColorStop(1,'#0c0c28');
    ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    // stars
    ctx.fillStyle='rgba(255,255,255,0.35)';
    for(let i=0;i<50;i++){ctx.fillRect((i*137+17)%W,(i*93+7)%H,1,1);}
    // pipes
    const {pipeGap}=cfg();
    for(const p of pipes){
      const PW=50;
      glow(C.green,12);
      ctx.fillStyle='#003a00';
      ctx.fillRect(p.x,0,PW,p.gapY);
      ctx.fillRect(p.x,p.gapY+pipeGap,PW,H-p.gapY-pipeGap);
      ctx.fillStyle=C.green;
      ctx.fillRect(p.x-4,p.gapY-18,PW+8,18);
      ctx.fillRect(p.x-4,p.gapY+pipeGap,PW+8,18);
      noGlow();
    }
    // bird
    glow(C.yellow,20);ctx.fillStyle=C.yellow;
    ctx.beginPath();ctx.arc(BIRD_X,birdY,BIRD_R,0,Math.PI*2);ctx.fill();
    const wa=Math.max(-0.5,Math.min(0.5,birdVel/900));
    ctx.save();ctx.translate(BIRD_X,birdY);ctx.rotate(wa);
    ctx.fillStyle='#ff9900';
    ctx.beginPath();ctx.ellipse(-5,0,9,5,-0.3,0,Math.PI*2);ctx.fill();
    ctx.restore();
    noGlow();
    ctx.fillStyle=C.bg;ctx.beginPath();ctx.arc(BIRD_X+5,birdY-4,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(BIRD_X+6,birdY-5,2,0,Math.PI*2);ctx.fill();
  }

  function handleKey(e){if(e.code==='Space'){e.preventDefault();flap();}}
  function handleClick(){flap();}
  document.addEventListener('keydown',handleKey);
  canvas.addEventListener('click',handleClick);
  return {
    init,update,render,
    mobile(d){if(d==='action'||d==='up')flap();},
    destroy(){document.removeEventListener('keydown',handleKey);canvas.removeEventListener('click',handleClick);}
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  BREAKOUT
// ═══════════════════════════════════════════════════════════════════════════
function makeBreakout(){
  const W=RES,H=RES;
  const PAD_W=80,PAD_H=10,PAD_Y=H-40;
  const BALL_R=7;
  const BC=10,BR=5;
  const ROW_COLORS=[C.magenta,C.red,C.yellow,C.green,C.cyan];

  let padX,ball,bricks,lives,bkScore,keys;

  function makeBricks(){
    const bw=(W-40)/BC, bh=16, list=[];
    for(let r=0;r<BR;r++)
      for(let c=0;c<BC;c++)
        list.push({x:20+c*bw,y:55+r*(bh+5),w:bw-4,h:bh,color:ROW_COLORS[r],alive:true,pts:(BR-r)*10});
    return list;
  }

  function init(){
    padX=W/2-PAD_W/2;
    const spd=260*DIFF;
    ball={x:W/2,y:PAD_Y-BALL_R-2,vx:spd*(Math.random()>0.5?1:-1)*0.8,vy:-spd};
    bricks=makeBricks(); lives=3; bkScore=0; keys={};
    setScore(0);
  }

  function update(dt){
    if(keys['ArrowLeft']||keys['KeyA'])  padX=Math.max(0,padX-420*dt);
    if(keys['ArrowRight']||keys['KeyD']) padX=Math.min(W-PAD_W,padX+420*dt);

    ball.x+=ball.vx*dt; ball.y+=ball.vy*dt;
    if(ball.x-BALL_R<0)   {ball.x=BALL_R;ball.vx*=-1;}
    if(ball.x+BALL_R>W)   {ball.x=W-BALL_R;ball.vx*=-1;}
    if(ball.y-BALL_R<0)   {ball.y=BALL_R;ball.vy*=-1;}

    // paddle
    if(ball.y+BALL_R>=PAD_Y&&ball.y+BALL_R<=PAD_Y+PAD_H+4&&ball.x>=padX-4&&ball.x<=padX+PAD_W+4&&ball.vy>0){
      const rel=(ball.x-(padX+PAD_W/2))/(PAD_W/2);
      ball.vx=rel*300*DIFF; ball.vy=-Math.abs(ball.vy);
    }
    if(ball.y-BALL_R>H){
      lives--;
      if(lives<=0){triggerGameOver('GAME OVER','You dropped the ball.',bkScore);return;}
      ball={x:W/2,y:PAD_Y-BALL_R-2,vx:260*DIFF*(Math.random()>0.5?1:-1)*0.8,vy:-260*DIFF};
    }
    for(const b of bricks){
      if(!b.alive) continue;
      if(ball.x+BALL_R>b.x&&ball.x-BALL_R<b.x+b.w&&ball.y+BALL_R>b.y&&ball.y-BALL_R<b.y+b.h){
        b.alive=false; bkScore+=b.pts; setScore(bkScore);
        const oL=(ball.x+BALL_R)-b.x,oR=(b.x+b.w)-(ball.x-BALL_R);
        const oT=(ball.y+BALL_R)-b.y,oB=(b.y+b.h)-(ball.y-BALL_R);
        if(Math.min(oL,oR)<Math.min(oT,oB)) ball.vx*=-1; else ball.vy*=-1;
      }
    }
    if(bricks.every(b=>!b.alive)) triggerGameOver('YOU WIN!','All bricks cleared!',bkScore);
  }

  function render(){
    ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);
    // lives
    ctx.font='10px Share Tech Mono';ctx.fillStyle=C.dim;ctx.fillText('LIVES',10,18);
    for(let i=0;i<lives;i++){glow(C.cyan,8);ctx.fillStyle=C.cyan;ctx.beginPath();ctx.arc(56+i*18,13,5,0,Math.PI*2);ctx.fill();}
    noGlow();
    // bricks
    bricks.forEach(b=>{
      if(!b.alive)return;
      glow(b.color,8);ctx.fillStyle=b.color;
      ctx.beginPath();ctx.roundRect(b.x,b.y,b.w,b.h,2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(b.x,b.y,b.w,4);
      noGlow();
    });
    // paddle
    glow(C.cyan,14);ctx.fillStyle=C.cyan;
    ctx.beginPath();ctx.roundRect(padX,PAD_Y,PAD_W,PAD_H,4);ctx.fill();
    noGlow();
    // ball
    glow('#fff',18);ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(ball.x,ball.y,BALL_R,0,Math.PI*2);ctx.fill();
    noGlow();
  }

  function handleKey(e){ keys[e.code]=e.type==='keydown'; if(['ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault(); }
  function handleMouse(e){ const r=canvas.getBoundingClientRect(),sc=RES/r.width; padX=Math.max(0,Math.min(W-PAD_W,(e.clientX-r.left)*sc-PAD_W/2)); }
  document.addEventListener('keydown',handleKey);
  document.addEventListener('keyup',handleKey);
  canvas.addEventListener('mousemove',handleMouse);
  return{
    init,update,render,
    mobile(d){ if(d==='left')padX=Math.max(0,padX-22); if(d==='right')padX=Math.min(W-PAD_W,padX+22); },
    destroy(){ document.removeEventListener('keydown',handleKey); document.removeEventListener('keyup',handleKey); canvas.removeEventListener('mousemove',handleMouse); }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  TETRIS
// ═══════════════════════════════════════════════════════════════════════════
function makeTetris(){
  const COLS_T=10, ROWS_T=20;
  const BS=Math.floor(RES/ROWS_T); // 24
  const OX=Math.floor((RES-COLS_T*BS)/2);

  const SHAPES=[
    {cells:[[1,1,1,1]],             color:C.cyan},
    {cells:[[1,1],[1,1]],           color:C.yellow},
    {cells:[[0,1,0],[1,1,1]],       color:C.magenta},
    {cells:[[1,0],[1,0],[1,1]],     color:C.green},
    {cells:[[0,1],[0,1],[1,1]],     color:'#ff8c00'},
    {cells:[[0,1,1],[1,1,0]],       color:C.red},
    {cells:[[1,1,0],[0,1,1]],       color:C.purple},
  ];

  let board,piece,next,dropAcc,lockAcc,tScore,tLines,level,keys,dasT,dasMoved,dasRepAcc;

  const emptyBoard=()=>Array.from({length:ROWS_T},()=>Array(COLS_T).fill(null));
  const randPiece=()=>{
    const s=SHAPES[Math.floor(Math.random()*SHAPES.length)];
    return{cells:s.cells.map(r=>[...r]),color:s.color,x:Math.floor(COLS_T/2)-Math.floor(s.cells[0].length/2),y:0};
  };
  const collides=(p,ox=0,oy=0,cells=p.cells)=>{
    for(let r=0;r<cells.length;r++)
      for(let c=0;c<cells[r].length;c++){
        if(!cells[r][c])continue;
        const nx=p.x+c+ox,ny=p.y+r+oy;
        if(nx<0||nx>=COLS_T||ny>=ROWS_T)return true;
        if(ny>=0&&board[ny][nx])return true;
      }
    return false;
  };
  const rotate=cells=>{
    const rows=cells.length,cols=cells[0].length;
    return Array.from({length:cols},(_,c)=>Array.from({length:rows},(_,r)=>cells[rows-1-r][c]));
  };

  function lock(){
    for(let r=0;r<piece.cells.length;r++)
      for(let c=0;c<piece.cells[r].length;c++){
        if(!piece.cells[r][c])continue;
        if(piece.y+r<0){triggerGameOver('GAME OVER','The stack reached the top.',tScore);return;}
        board[piece.y+r][piece.x+c]=piece.color;
      }
    clearLines();
    piece=next; next=randPiece(); lockAcc=0;
    if(collides(piece))triggerGameOver('GAME OVER','The stack reached the top.',tScore);
  }

  function clearLines(){
    let cleared=0;
    for(let r=ROWS_T-1;r>=0;r--){
      if(board[r].every(c=>c!==null)){board.splice(r,1);board.unshift(Array(COLS_T).fill(null));cleared++;r++;}
    }
    if(cleared){
      const pts=[0,100,300,500,800][cleared]*level;
      tScore+=pts; tLines+=cleared; level=Math.floor(tLines/10)+1; setScore(tScore);
    }
  }

  function init(){
    board=emptyBoard(); piece=randPiece(); next=randPiece();
    dropAcc=lockAcc=tScore=tLines=0; level=1;
    keys={}; dasT=0; dasMoved=false; dasRepAcc=0;
    setScore(0);
  }

  const DAS_DELAY=0.17, DAS_RPT=0.05;

  function update(dt){
    // Drop interval shrinks with level AND difficulty
    const dropInt=Math.max(0.04,(1.0-(level-1)*0.06)/DIFF);
    const spd=keys['ArrowDown']?dropInt*0.1:dropInt;
    dropAcc+=dt;

    // DAS horizontal
    const mH=keys['ArrowLeft']||keys['ArrowRight'];
    if(mH){
      dasT+=dt;
      if(!dasMoved){const d=keys['ArrowRight']?1:-1;if(!collides(piece,d,0)){piece.x+=d;lockAcc=0;}dasMoved=true;dasRepAcc=0;}
      else if(dasT>DAS_DELAY){dasRepAcc+=dt;if(dasRepAcc>DAS_RPT){dasRepAcc=0;const d=keys['ArrowRight']?1:-1;if(!collides(piece,d,0)){piece.x+=d;lockAcc=0;}}}
    }else{dasT=0;dasMoved=false;}

    if(dropAcc>=spd){
      dropAcc=0;
      if(!collides(piece,0,1)){piece.y++;lockAcc=0;}
      else{lockAcc+=spd;if(lockAcc>=0.5)lock();}
    }
  }

  function ghostY(){let g=piece.y;while(!collides(piece,0,g-piece.y+1))g++;return g;}

  function drawBlock(px,py,color){
    glow(color,8);ctx.fillStyle=color;
    ctx.fillRect(px+1,py+1,BS-2,BS-2);
    ctx.fillStyle='rgba(255,255,255,0.14)';ctx.fillRect(px+1,py+1,BS-2,4);
    noGlow();
  }

  function render(){
    ctx.fillStyle=C.bg;ctx.fillRect(0,0,RES,RES);
    for(let r=0;r<ROWS_T;r++)
      for(let c=0;c<COLS_T;c++){
        const color=board[r][c];
        if(color){drawBlock(OX+c*BS,r*BS,color);}
        else{ctx.strokeStyle='rgba(0,245,255,0.04)';ctx.lineWidth=0.5;ctx.strokeRect(OX+c*BS,r*BS,BS,BS);}
      }
    // ghost
    const gy=ghostY();
    ctx.globalAlpha=0.16;
    piece.cells.forEach((row,r)=>row.forEach((v,c)=>{if(v)drawBlock(OX+(piece.x+c)*BS,(gy+r)*BS,piece.color);}));
    ctx.globalAlpha=1;
    // active piece
    piece.cells.forEach((row,r)=>row.forEach((v,c)=>{if(v)drawBlock(OX+(piece.x+c)*BS,(piece.y+r)*BS,piece.color);}));
    // next piece preview (top-right)
    const NPX=OX+COLS_T*BS+8,NPY=10;
    ctx.font='9px Share Tech Mono';ctx.fillStyle='rgba(200,216,232,0.3)';ctx.fillText('NEXT',NPX,NPY+8);
    next.cells.forEach((row,r)=>row.forEach((v,c)=>{if(v){glow(next.color,6);ctx.fillStyle=next.color;ctx.fillRect(NPX+c*12,NPY+16+r*12,10,10);noGlow();}}));
    ctx.font='9px Share Tech Mono';ctx.fillStyle='rgba(200,216,232,0.25)';
    ctx.fillText(`LV ${level}`,NPX,NPY+80);ctx.fillText(`LN ${tLines}`,NPX,NPY+94);
  }

  function handleKey(e){
    keys[e.code]=e.type==='keydown';
    if(e.type!=='keydown')return;
    if(e.code==='ArrowUp'){
      const rot=rotate(piece.cells);
      if(!collides({...piece,cells:rot})){piece.cells=rot;lockAcc=0;}
      else if(!collides({...piece,cells:rot,x:piece.x+1})){piece.cells=rot;piece.x++;lockAcc=0;}
      else if(!collides({...piece,cells:rot,x:piece.x-1})){piece.cells=rot;piece.x--;lockAcc=0;}
    }
    if(e.code==='Space'){while(!collides(piece,0,1))piece.y++;lock();}
    if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space'].includes(e.code))e.preventDefault();
  }
  document.addEventListener('keydown',handleKey);
  document.addEventListener('keyup',handleKey);
  return{
    init,update,render,
    mobile(d){
      if(d==='left'&&!collides(piece,-1,0))piece.x--;
      if(d==='right'&&!collides(piece,1,0))piece.x++;
      if(d==='down'&&!collides(piece,0,1))piece.y++;
      if(d==='up'){const r=rotate(piece.cells);if(!collides({...piece,cells:r}))piece.cells=r;}
      if(d==='action'){while(!collides(piece,0,1))piece.y++;lock();}
    },
    destroy(){document.removeEventListener('keydown',handleKey);document.removeEventListener('keyup',handleKey);}
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  ASTEROIDS
// ═══════════════════════════════════════════════════════════════════════════
function makeAsteroids(){
  const W=RES,H=RES,TAU=Math.PI*2;
  let ship,asteroids,bullets,particles,keys,astScore,lives,invTimer,wave;

  const makeShip=()=>({x:W/2,y:H/2,angle:-Math.PI/2,vx:0,vy:0,r:11,shootCd:0});
  const makeAst=(x,y,r)=>{
    const angle=Math.random()*TAU;
    const spd=(40+Math.random()*60)*DIFF/(r/20);
    const pts=[];
    const n=8+Math.floor(Math.random()*5);
    for(let i=0;i<n;i++){const a=(i/n)*TAU,d=r*(0.7+Math.random()*0.5);pts.push({x:Math.cos(a)*d,y:Math.sin(a)*d});}
    return{x,y,vx:Math.cos(angle)*spd,vy:Math.sin(angle)*spd,r,pts,rot:0,rotSpeed:(Math.random()-0.5)*2};
  };
  function spawnWave(n){
    const list=[];
    for(let i=0;i<n;i++){
      let x,y;
      do{x=Math.random()*W;y=Math.random()*H;}
      while(Math.hypot(x-ship.x,y-ship.y)<120);
      list.push(makeAst(x,y,40));
    }
    return list;
  }
  function spawnParticles(x,y,color,n){
    for(let i=0;i<n;i++){const a=Math.random()*TAU,s=60+Math.random()*120;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0.5+Math.random()*0.4,color});}
  }

  function init(){
    ship=makeShip(); asteroids=spawnWave(4);
    bullets=[]; particles=[]; keys={}; astScore=0; lives=3; invTimer=2; wave=1;
    setScore(0);
  }

  const TURN=3.2,THRUST=270,DRAG=0.98,BSPD=560;

  function update(dt){
    ship.shootCd-=dt; invTimer=Math.max(0,invTimer-dt);
    if(keys['ArrowLeft']) ship.angle-=TURN*dt;
    if(keys['ArrowRight'])ship.angle+=TURN*dt;
    if(keys['ArrowUp']){ship.vx+=Math.cos(ship.angle)*THRUST*dt;ship.vy+=Math.sin(ship.angle)*THRUST*dt;}
    ship.vx*=Math.pow(DRAG,dt*60); ship.vy*=Math.pow(DRAG,dt*60);
    ship.x=(ship.x+ship.vx*dt+W)%W; ship.y=(ship.y+ship.vy*dt+H)%H;
    if(keys['Space']&&ship.shootCd<=0){
      ship.shootCd=0.22/DIFF;
      bullets.push({x:ship.x+Math.cos(ship.angle)*ship.r,y:ship.y+Math.sin(ship.angle)*ship.r,vx:Math.cos(ship.angle)*BSPD,vy:Math.sin(ship.angle)*BSPD,life:1.2});
    }
    bullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;});
    bullets=bullets.filter(b=>b.life>0);
    asteroids.forEach(a=>{a.x=(a.x+a.vx*dt+W)%W;a.y=(a.y+a.vy*dt+H)%H;a.rot+=a.rotSpeed*dt;});
    // bullet-asteroid
    for(let bi=bullets.length-1;bi>=0;bi--){
      for(let ai=asteroids.length-1;ai>=0;ai--){
        const b=bullets[bi],a=asteroids[ai];
        if(Math.hypot(b.x-a.x,b.y-a.y)<a.r){
          spawnParticles(a.x,a.y,C.dim,8); bullets.splice(bi,1);
          if(a.r>18){asteroids.push(makeAst(a.x,a.y,a.r*0.55));asteroids.push(makeAst(a.x,a.y,a.r*0.55));}
          astScore+=a.r>30?20:a.r>18?50:100; setScore(astScore);
          asteroids.splice(ai,1); break;
        }
      }
    }
    // ship collision
    if(invTimer<=0){
      for(const a of asteroids){
        if(Math.hypot(ship.x-a.x,ship.y-a.y)<ship.r+a.r*0.7){
          spawnParticles(ship.x,ship.y,C.cyan,16);
          lives--; invTimer=2.5; ship.x=W/2;ship.y=H/2;ship.vx=ship.vy=0;
          if(lives<=0){triggerGameOver('GAME OVER','Your ship was destroyed.',astScore);return;}
          break;
        }
      }
    }
    if(asteroids.length===0){wave++;asteroids=spawnWave(3+wave);spawnParticles(W/2,H/2,C.yellow,20);}
    particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.vx*=0.97;p.vy*=0.97;});
    particles=particles.filter(p=>p.life>0);
  }

  function render(){
    ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);
    // stars
    ctx.fillStyle='rgba(255,255,255,0.3)';
    for(let i=0;i<70;i++)ctx.fillRect((i*173+31)%W,(i*97+13)%H,1,1);
    // particles
    particles.forEach(p=>{ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.fillRect(p.x-2,p.y-2,4,4);});
    ctx.globalAlpha=1;
    // asteroids
    asteroids.forEach(a=>{
      ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.rot);
      ctx.strokeStyle='rgba(200,216,232,0.55)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(a.pts[0].x,a.pts[0].y);
      a.pts.forEach(p=>ctx.lineTo(p.x,p.y));
      ctx.closePath();ctx.stroke();ctx.restore();
    });
    // bullets
    glow(C.yellow,12);ctx.fillStyle=C.yellow;
    bullets.forEach(b=>{ctx.beginPath();ctx.arc(b.x,b.y,3,0,TAU);ctx.fill();});
    noGlow();
    // ship
    if(invTimer<=0||Math.floor(invTimer*8)%2===0){
      ctx.save();ctx.translate(ship.x,ship.y);ctx.rotate(ship.angle);
      glow(C.cyan,14);ctx.strokeStyle=C.cyan;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(ship.r,0);ctx.lineTo(-ship.r*0.6,ship.r*0.6);
      ctx.lineTo(-ship.r*0.3,0);ctx.lineTo(-ship.r*0.6,-ship.r*0.6);ctx.closePath();ctx.stroke();
      if(keys['ArrowUp']){
        glow(C.magenta,16);ctx.strokeStyle=C.magenta;
        ctx.beginPath();ctx.moveTo(-ship.r*0.3,ship.r*0.25);
        ctx.lineTo(-ship.r*0.9-Math.random()*7,0);ctx.lineTo(-ship.r*0.3,-ship.r*0.25);ctx.stroke();
      }
      noGlow();ctx.restore();
    }
    // lives + wave
    ctx.font='10px Share Tech Mono';ctx.fillStyle='rgba(200,216,232,0.28)';
    ctx.fillText(`WAVE ${wave}`,8,H-8);
    for(let i=0;i<lives;i++){
      glow(C.cyan,5);ctx.strokeStyle=C.cyan;ctx.lineWidth=1.2;
      const lx=W-16-i*22,ly=H-16;
      ctx.save();ctx.translate(lx,ly);ctx.rotate(-Math.PI/2);
      ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-5,5);ctx.lineTo(-3,0);ctx.lineTo(-5,-5);ctx.closePath();ctx.stroke();
      ctx.restore();noGlow();
    }
  }

  function handleKey(e){
    keys[e.code]=e.type==='keydown';
    if(['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code))e.preventDefault();
  }
  document.addEventListener('keydown',handleKey);
  document.addEventListener('keyup',handleKey);
  return{
    init,update,render,
    mobile(d){
      const t=d==='up'?120:80;
      const map={left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',action:'Space'};
      if(map[d]){keys[map[d]]=true;setTimeout(()=>keys[map[d]]=false,t);}
    },
    destroy(){document.removeEventListener('keydown',handleKey);document.removeEventListener('keyup',handleKey);}
  };
}
