/**
 * QuantumLab — Simulador Prático: Computação Binária vs Computação Quântica
 * Implementação matemática real de vetores de estado, Esfera de Bloch 3D,
 * Algoritmo de Grover, Escala 2^N, Deutsch-Jozsa e Emaranhamento de Bell.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initTab1BitVsQubit();
  initTab2Grover();
  initTab3Scaling();
  initTab4DeutschJozsa();
  initTab5Entanglement();
});

/* =========================================================================
   NAVEGAÇÃO ENTRE ABAS
   ========================================================================= */
function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;
      buttons.forEach((b) => b.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add('active');

      // Redesenha canvases quando a aba fica visível
      if (targetId === 'tab-grover' && window.renderGroverCanvas) {
        window.renderGroverCanvas();
      }
      if (targetId === 'tab-bit-qubit' && window.renderBlochSphere) {
        window.renderBlochSphere();
      }
    });
  });
}

/* =========================================================================
   MÓDULO 1: BIT CLÁSSICO VS QUBIT + ESFERA DE BLOCH 3D
   ========================================================================= */
function initTab1BitVsQubit() {
  // --- Lado Binário Clássico ---
  let classicalBit = 0;
  const visualBox = document.getElementById('classical-bit-visual');
  const voltageTag = document.getElementById('classical-voltage');
  const bitValEl = document.getElementById('classical-bit-value');
  const switchBtn = document.getElementById('classical-switch-btn');
  const cProb0 = document.getElementById('c-prob-0');
  const cProb1 = document.getElementById('c-prob-1');
  const cProb0Txt = document.getElementById('c-prob-0-txt');
  const cProb1Txt = document.getElementById('c-prob-1-txt');

  function updateClassicalUI() {
    bitValEl.textContent = String(classicalBit);
    if (classicalBit === 1) {
      visualBox.classList.add('state-on');
      voltageTag.textContent = '5.0V (Nível Lógico Alto - VDD)';
      cProb0.style.width = '0%';
      cProb1.style.width = '100%';
      cProb0Txt.textContent = '0%';
      cProb1Txt.textContent = '100%';
    } else {
      visualBox.classList.remove('state-on');
      voltageTag.textContent = '0.0V (Nível Lógico Baixo - GND)';
      cProb0.style.width = '100%';
      cProb1.style.width = '0%';
      cProb0Txt.textContent = '100%';
      cProb1Txt.textContent = '0%';
    }
  }

  switchBtn.addEventListener('click', () => {
    classicalBit = classicalBit === 0 ? 1 : 0;
    updateClassicalUI();
  });
  document.getElementById('btn-classical-not').addEventListener('click', () => {
    classicalBit = classicalBit === 0 ? 1 : 0;
    updateClassicalUI();
  });
  document.getElementById('btn-classical-set0').addEventListener('click', () => {
    classicalBit = 0;
    updateClassicalUI();
  });
  document.getElementById('btn-classical-set1').addEventListener('click', () => {
    classicalBit = 1;
    updateClassicalUI();
  });

  // --- Lado Quântico: Vetor de Estado Complexo [alpha, beta] ---
  // alpha = ar + i*ai, beta = br + i*bi
  let qState = {
    ar: 1, ai: 0,
    br: 0, bi: 0
  };

  // Rotação da câmera da Esfera de Bloch 3D
  let camYaw = -0.55;
  let camPitch = 0.32;
  let isDragging = false;
  let lastMouse = { x: 0, y: 0 };

  const canvas = document.getElementById('bloch-canvas');
  const ctx = canvas.getContext('2d');
  const sliderTheta = document.getElementById('slider-theta');
  const sliderPhi = document.getElementById('slider-phi');
  const thetaValEl = document.getElementById('theta-val');
  const phiValEl = document.getElementById('phi-val');
  const ketDisplay = document.getElementById('qubit-ket-display');
  const qProb0 = document.getElementById('q-prob-0');
  const qProb1 = document.getElementById('q-prob-1');
  const qProb0Txt = document.getElementById('q-prob-0-txt');
  const qProb1Txt = document.getElementById('q-prob-1-txt');
  const measureLog = document.getElementById('qubit-measure-log');

  function setFromAngles(thetaDeg, phiDeg) {
    const theta = (thetaDeg * Math.PI) / 180;
    const phi = (phiDeg * Math.PI) / 180;
    qState.ar = Math.cos(theta / 2);
    qState.ai = 0;
    qState.br = Math.sin(theta / 2) * Math.cos(phi);
    qState.bi = Math.sin(theta / 2) * Math.sin(phi);
    syncQubitUI(false);
  }

  // Extrai coordenadas da Esfera de Bloch (x, y, z) a partir de (alpha, beta)
  function getBlochCoords() {
    // alpha* conj(beta) = (ar - i ai)(br + i bi) = (ar*br + ai*bi) + i(ar*bi - ai*br)
    const re = qState.ar * qState.br + qState.ai * qState.bi;
    const im = qState.ar * qState.bi - qState.ai * qState.br;
    const p0 = qState.ar * qState.ar + qState.ai * qState.ai;
    const p1 = qState.br * qState.br + qState.bi * qState.bi;

    const x = 2 * re;
    const y = 2 * im;
    const z = p0 - p1;
    return { x, y, z, p0, p1 };
  }

  function applySingleQubitGate(gate) {
    const { ar, ai, br, bi } = qState;
    const invSqrt2 = 1 / Math.SQRT2;

    if (gate === 'H') {
      qState.ar = (ar + br) * invSqrt2;
      qState.ai = (ai + bi) * invSqrt2;
      qState.br = (ar - br) * invSqrt2;
      qState.bi = (ai - bi) * invSqrt2;
    } else if (gate === 'X') {
      qState.ar = br;
      qState.ai = bi;
      qState.br = ar;
      qState.bi = ai;
    } else if (gate === 'Y') {
      // Y = [[0, -i], [i, 0]]
      // new_a = -i * b = bi - i*br
      // new_b = i * a = -ai + i*ar
      qState.ar = bi;
      qState.ai = -br;
      qState.br = -ai;
      qState.bi = ar;
    } else if (gate === 'Z') {
      qState.br = -br;
      qState.bi = -bi;
    } else if (gate === 'S') {
      // S multiplies |1> by i: (br + i*bi)*i = -bi + i*br
      qState.br = -bi;
      qState.bi = br;
    } else if (gate === 'RY') {
      // Ry(pi/4): cos(pi/8), sin(pi/8)
      const c = Math.cos(Math.PI / 8);
      const s = Math.sin(Math.PI / 8);
      qState.ar = c * ar - s * br;
      qState.ai = c * ai - s * bi;
      qState.br = s * ar + c * br;
      qState.bi = s * ai + c * bi;
    }
    syncQubitUI(true);
  }

  function syncQubitUI(updateSliders = true) {
    const { x, y, z, p0, p1 } = getBlochCoords();
    const clampedZ = Math.max(-1, Math.min(1, z));
    const thetaRad = Math.acos(clampedZ);
    let phiRad = Math.atan2(y, x);
    if (phiRad < 0) phiRad += 2 * Math.PI;

    const thetaDeg = Math.round((thetaRad * 180) / Math.PI);
    const phiDeg = Math.round((phiRad * 180) / Math.PI) % 360;

    if (updateSliders) {
      sliderTheta.value = String(thetaDeg);
      sliderPhi.value = String(phiDeg);
    }
    thetaValEl.textContent = `${thetaDeg}°`;
    phiValEl.textContent = `${phiDeg}°`;

    const alphaMag = Math.sqrt(p0).toFixed(2);
    const betaMag = Math.sqrt(p1).toFixed(2);
    const phaseStr = phiDeg === 0 || p1 < 0.001 ? '' : `·e^(i·${phiDeg}°)`;
    ketDisplay.textContent = `|ψ⟩ = ${alphaMag}|0⟩ + ${betaMag}${phaseStr}|1⟩`;

    const pct0 = (p0 * 100).toFixed(1);
    const pct1 = (p1 * 100).toFixed(1);
    qProb0.style.width = `${pct0}%`;
    qProb1.style.width = `${pct1}%`;
    qProb0Txt.textContent = `${pct0}%`;
    qProb1Txt.textContent = `${pct1}%`;

    renderBlochSphere();
  }

  // Projeção 3D -> 2D para a Esfera de Bloch
  function project3D(x, y, z, cx, cy, radius) {
    // Eixos físicos: Z aponta para cima (|0> no topo, |1> embaixo)
    // X para frente/esquerda, Y para direita
    const cosY = Math.cos(camYaw);
    const sinY = Math.sin(camYaw);
    const cosP = Math.cos(camPitch);
    const sinP = Math.sin(camPitch);

    // Rotaciona no plano horizontal (X, Y)
    const rx = x * cosY - y * sinY;
    const ry = x * sinY + y * cosY;
    const rz = z;

    // Inclinação (Pitch)
    const screenX = cy + ry * radius;
    const screenY = cy - (rz * cosP - rx * sinP) * radius;
    const depth = rx * cosP + rz * sinP;
    return { sx: screenX, sy: screenY, depth };
  }

  function renderBlochSphere() {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = 108;

    ctx.clearRect(0, 0, w, h);

    // Brilho de fundo da esfera
    const grad = ctx.createRadialGradient(cx - 25, cy - 25, 10, cx, cy, r);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.14)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.45)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Desenha Equador (plano XY) e Meridianos em 3D
    drawCircle3D(ctx, cx, cy, r, (t) => [Math.cos(t), Math.sin(t), 0], 'rgba(6, 182, 212, 0.28)');
    drawCircle3D(ctx, cx, cy, r, (t) => [Math.cos(t), 0, Math.sin(t)], 'rgba(148, 163, 184, 0.16)');
    drawCircle3D(ctx, cx, cy, r, (t) => [0, Math.cos(t), Math.sin(t)], 'rgba(148, 163, 184, 0.16)');

    // Eixos X, Y, Z
    drawAxis(ctx, cx, cy, r, [0, 0, 1], [0, 0, -1], '|0⟩', '|1⟩', '#94a3b8');
    drawAxis(ctx, cx, cy, r, [1, 0, 0], [-1, 0, 0], '|+⟩', '|-⟩', '#64748b');
    drawAxis(ctx, cx, cy, r, [0, 1, 0], [0, -1, 0], '|+i⟩', '|-i⟩', '#64748b');

    // Vetor de estado atual |ψ⟩
    const { x, y, z } = getBlochCoords();
    const origin = project3D(0, 0, 0, cx, cy, r);
    const tip = project3D(x, y, z, cx, cy, r);
    const eqProj = project3D(x, y, 0, cx, cy, r);

    // Linha tracejada da projeção no equador (mostra a fase!)
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.55)';
    ctx.beginPath();
    ctx.moveTo(origin.sx, origin.sy);
    ctx.lineTo(eqProj.sx, eqProj.sy);
    ctx.lineTo(tip.sx, tip.sy);
    ctx.stroke();
    ctx.restore();

    // Vetor principal |ψ⟩
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(origin.sx, origin.sy);
    ctx.lineTo(tip.sx, tip.sy);
    ctx.stroke();

    // Ponta brilhante do vetor
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(tip.sx, tip.sy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawCircle3D(context, cx, cy, r, paramFn, color) {
    context.strokeStyle = color;
    context.lineWidth = 1.1;
    context.beginPath();
    const steps = 64;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const [x, y, z] = paramFn(t);
      const { sx, sy } = project3D(x, y, z, cx, cy, r);
      if (i === 0) context.moveTo(sx, sy);
      else context.lineTo(sx, sy);
    }
    context.stroke();
  }

  function drawAxis(context, cx, cy, r, pos, neg, labelPos, labelNeg, color) {
    const p1 = project3D(pos[0], pos[1], pos[2], cx, cy, r);
    const p2 = project3D(neg[0], neg[1], neg[2], cx, cy, r);
    context.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(p1.sx, p1.sy);
    context.lineTo(p2.sx, p2.sy);
    context.stroke();

    context.fillStyle = color;
    context.font = 'bold 11px JetBrains Mono, monospace';
    context.textAlign = 'center';
    const l1 = project3D(pos[0] * 1.18, pos[1] * 1.18, pos[2] * 1.18, cx, cy, r);
    const l2 = project3D(neg[0] * 1.18, neg[1] * 1.18, neg[2] * 1.18, cx, cy, r);
    context.fillText(labelPos, l1.sx, l1.sy + 4);
    context.fillText(labelNeg, l2.sx, l2.sy + 4);
  }

  window.renderBlochSphere = renderBlochSphere;

  // Rotação da Esfera com Mouse
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouse = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    lastMouse = { x: e.clientX, y: e.clientY };
    camYaw += dx * 0.012;
    camPitch = Math.max(-1.2, Math.min(1.2, camPitch + dy * 0.012));
    renderBlochSphere();
  });
  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Eventos das Portas Quânticas e Sliders
  document.querySelectorAll('[data-qgate]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const gate = btn.dataset.qgate;
      applySingleQubitGate(gate);
      measureLog.innerHTML = `Porta <strong>${gate}</strong> aplicada! O vetor girou na Esfera de Bloch sem colapsar.`;
    });
  });

  sliderTheta.addEventListener('input', () => {
    setFromAngles(Number(sliderTheta.value), Number(sliderPhi.value));
  });
  sliderPhi.addEventListener('input', () => {
    setFromAngles(Number(sliderTheta.value), Number(sliderPhi.value));
  });

  // Medição Única (Colapso Real da Função de Onda!)
  document.getElementById('btn-measure-once').addEventListener('click', () => {
    const { p0 } = getBlochCoords();
    const rand = Math.random();
    const outcome = rand < p0 ? 0 : 1;

    if (outcome === 0) {
      qState = { ar: 1, ai: 0, br: 0, bi: 0 };
    } else {
      qState = { ar: 0, ai: 0, br: 1, bi: 0 };
    }
    syncQubitUI(true);
    measureLog.innerHTML = `💥 <strong>COLAPSO DA FUNÇÃO DE ONDA!</strong> Antes da medição, P(|0⟩)=${(p0 * 100).toFixed(1)}%. O qubit foi medido e colapsou irreversivelmente para o bit clássico <strong>|${outcome}⟩</strong>!`;
  });

  // Simulação de 1.000 Medições (Monte Carlo)
  document.getElementById('btn-measure-1000').addEventListener('click', () => {
    const { p0, p1 } = getBlochCoords();
    let count0 = 0;
    let count1 = 0;
    const shots = 1000;
    for (let i = 0; i < shots; i++) {
      if (Math.random() < p0) count0++;
      else count1++;
    }
    measureLog.innerHTML = `📊 <strong>Experimento com 1.000 Qubits Idênticos (Shots):</strong><br/>` +
      `• Resultado <code>|0⟩</code>: <strong>${count0} vezes</strong> (${(count0 / 10).toFixed(1)}% vs teórico ${(p0 * 100).toFixed(1)}%)<br/>` +
      `• Resultado <code>|1⟩</code>: <strong>${count1} vezes</strong> (${(count1 / 10).toFixed(1)}% vs teórico ${(p1 * 100).toFixed(1)}%)`;
  });

  document.getElementById('btn-reset-qubit').addEventListener('click', () => {
    qState = { ar: 1, ai: 0, br: 0, bi: 0 };
    syncQubitUI(true);
    measureLog.innerHTML = `Qubit reiniciado no estado fundamental <strong>|0⟩</strong>.`;
  });

  updateClassicalUI();
  syncQubitUI(true);
}

/* =========================================================================
   MÓDULO 2: CORRIDA NA PRÁTICA — BUSCA LINEAR O(N) VS GROVER O(√N)
   ========================================================================= */
function initTab2Grover() {
  const selectQubits = document.getElementById('grover-qubits');
  const selectTarget = document.getElementById('grover-target');
  const classicalGrid = document.getElementById('classical-search-grid');
  const groverCanvas = document.getElementById('grover-canvas');
  const gCtx = groverCanvas.getContext('2d');

  const cStepsEl = document.getElementById('classical-steps-count');
  const cCurrentEl = document.getElementById('classical-current-check');
  const cStatusEl = document.getElementById('classical-search-status');
  const cExplainEl = document.getElementById('classical-grover-explain');

  const qStepsEl = document.getElementById('quantum-steps-count');
  const qProbEl = document.getElementById('quantum-target-prob');
  const qStageEl = document.getElementById('quantum-stage-label');
  const qExplainEl = document.getElementById('quantum-grover-explain');

  let nBits = 4;
  let N = 16;
  let targetIndex = 11; // |1011⟩ por padrão
  let optimalGroverIterations = 3;

  // Estado da busca clássica
  let classicalPointer = 0;
  let classicalFound = false;

  // Estado do Algoritmo de Grover
  // Sub-estágios para mostrar didaticamente: 'init' -> 'oracle' -> 'diffusion'
  let amplitudes = [];
  let groverIterationsDone = 0;
  let groverSubStage = 'init'; // 'init', 'oracle', 'diffusion'
  let autoTimer = null;

  function formatBin(val, bits) {
    return val.toString(2).padStart(bits, '0');
  }

  function populateTargetDropdown() {
    nBits = Number(selectQubits.value);
    N = 1 << nBits;
    if (targetIndex >= N) targetIndex = N - 3;
    optimalGroverIterations = Math.max(1, Math.round((Math.PI / 4) * Math.sqrt(N)));

    selectTarget.innerHTML = '';
    for (let i = 0; i < N; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `Endereço #${i} (|${formatBin(i, nBits)}⟩)`;
      if (i === targetIndex) opt.selected = true;
      selectTarget.appendChild(opt);
    }
  }

  function resetRace() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
      document.getElementById('btn-grover-auto').textContent = '▶️ Rodar Corrida Automática';
    }

    classicalPointer = 0;
    classicalFound = false;

    const initAmp = 1 / Math.sqrt(N);
    amplitudes = new Array(N).fill(initAmp);
    groverIterationsDone = 0;
    groverSubStage = 'init';

    renderClassicalGrid();
    updateGroverMetrics();
    renderGroverCanvas();
  }

  function renderClassicalGrid() {
    classicalGrid.innerHTML = '';
    for (let i = 0; i < N; i++) {
      const cell = document.createElement('div');
      cell.className = 'search-cell';
      if (i === targetIndex) cell.classList.add('is-target');

      if (i < classicalPointer) {
        if (i === targetIndex) cell.classList.add('checked-hit');
        else cell.classList.add('checked-miss');
      } else if (i === classicalPointer && classicalPointer > 0 && !classicalFound) {
        cell.classList.add('checking-now');
      }

      const binStr = formatBin(i, nBits);
      cell.innerHTML = `
        <strong>|${binStr}⟩</strong>
        <small>${i === targetIndex ? '🎯 ALVO' : `#${i}`}</small>
      `;

      cell.addEventListener('click', () => {
        targetIndex = i;
        selectTarget.value = String(i);
        resetRace();
      });

      classicalGrid.appendChild(cell);
    }

    cStepsEl.textContent = `${classicalPointer} / ${N}`;
    if (classicalPointer === 0) {
      cCurrentEl.textContent = '—';
      cStatusEl.textContent = 'Pronto';
      cStatusEl.style.color = '#f1f5f9';
    }
  }

  function stepRace() {
    // 1. Passo na CPU Clássica (1 consulta ao oráculo por ciclo)
    if (!classicalFound && classicalPointer < N) {
      const tested = classicalPointer;
      cCurrentEl.textContent = `|${formatBin(tested, nBits)}⟩ (#${tested})`;
      classicalPointer++;
      if (tested === targetIndex) {
        classicalFound = true;
        cStatusEl.textContent = `✅ Achou em ${classicalPointer} consultas!`;
        cStatusEl.style.color = '#10b981';
        cExplainEl.innerHTML = `A CPU Binária precisou testar <strong>${classicalPointer} endereços um por um</strong> até encontrar <code>|${formatBin(targetIndex, nBits)}⟩</code>.`;
      } else {
        cStatusEl.textContent = '❌ Não é o alvo...';
        cStatusEl.style.color = '#f59e0b';
      }
      renderClassicalGrid();
    }

    // 2. Passo no Processador Quântico (Oráculo -> Difusão)
    if (groverIterationsDone < optimalGroverIterations) {
      if (groverSubStage === 'init' || groverSubStage === 'diffusion') {
        // Aplica o Oráculo Quântico U_w: inverte a fase do alvo!
        amplitudes[targetIndex] = -amplitudes[targetIndex];
        groverSubStage = 'oracle';
        qStageEl.textContent = '1. Oráculo (Fase Invertida)';
        qExplainEl.innerHTML = `🔍 <strong>Oráculo Quântico U<sub>ω</sub>:</strong> Consultou todos os ${N} estados em superposição e <strong>inverteu o sinal da fase</strong> apenas do alvo <code>|${formatBin(targetIndex, nBits)}⟩</code> (barra vermelha negativa)!`;
      } else if (groverSubStage === 'oracle') {
        // Aplica o Operador de Difusão de Grover: 2*mean - amp[i]
        const mean = amplitudes.reduce((acc, v) => acc + v, 0) / N;
        for (let i = 0; i < N; i++) {
          amplitudes[i] = 2 * mean - amplitudes[i];
        }
        groverIterationsDone++;
        groverSubStage = 'diffusion';
        const targetProb = (amplitudes[targetIndex] ** 2 * 100).toFixed(1);
        qStageEl.textContent = `2. Difusão (Iteração ${groverIterationsDone})`;
        qExplainEl.innerHTML = `🌊 <strong>Interferência Construtiva (Difusão):</strong> Refletimos todas as amplitudes em torno da média (linha tracejada amarela). O alvo saltou para <strong>${targetProb}% de probabilidade</strong> com apenas <strong>${groverIterationsDone} consulta(s)</strong>!`;
      }
      updateGroverMetrics();
      renderGroverCanvas();
    }
  }

  function updateGroverMetrics() {
    qStepsEl.textContent = `${groverIterationsDone} / ${optimalGroverIterations}`;
    const prob = (amplitudes[targetIndex] ** 2 * 100).toFixed(1);
    qProbEl.textContent = `${prob}%`;
    if (groverIterationsDone === 0 && groverSubStage === 'init') {
      qStageEl.textContent = 'Superposição Uniforme';
    }
  }

  function renderGroverCanvas() {
    const w = groverCanvas.width;
    const h = groverCanvas.height;
    gCtx.clearRect(0, 0, w, h);

    const zeroY = Math.round(h * 0.68);
    const scaleY = h * 0.56;
    const padX = 28;
    const usableW = w - padX * 2;
    const barSlot = usableW / N;
    const barW = Math.max(4, barSlot * 0.72);

    // Linha de base (Amplitude = 0)
    gCtx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    gCtx.lineWidth = 1.2;
    gCtx.beginPath();
    gCtx.moveTo(padX, zeroY);
    gCtx.lineTo(w - padX, zeroY);
    gCtx.stroke();

    // Média das amplitudes (linha tracejada amarela)
    const mean = amplitudes.reduce((a, b) => a + b, 0) / N;
    const meanY = zeroY - mean * scaleY;
    gCtx.save();
    gCtx.setLineDash([5, 4]);
    gCtx.strokeStyle = '#fbbf24';
    gCtx.lineWidth = 1.6;
    gCtx.beginPath();
    gCtx.moveTo(padX, meanY);
    gCtx.lineTo(w - padX, meanY);
    gCtx.stroke();
    gCtx.restore();

    // Desenha barras de amplitude para cada estado |x⟩
    for (let i = 0; i < N; i++) {
      const amp = amplitudes[i];
      const x = padX + i * barSlot + (barSlot - barW) / 2;
      const barH = Math.abs(amp) * scaleY;
      const y = amp >= 0 ? zeroY - barH : zeroY;

      if (amp < 0) {
        gCtx.fillStyle = '#f43f5e'; // Fase invertida pelo Oráculo
      } else if (i === targetIndex) {
        gCtx.fillStyle = '#10b981'; // Estado Alvo
      } else {
        gCtx.fillStyle = '#06b6d4'; // Demais estados em superposição
      }

      gCtx.beginPath();
      gCtx.roundRect(x, y, barW, Math.max(2, barH), 3);
      gCtx.fill();

      // Rótulo nos estados (ou no alvo se N=32)
      if (N <= 16 || i === targetIndex) {
        gCtx.fillStyle = i === targetIndex ? '#6ee7b7' : '#94a3b8';
        gCtx.font = '10px JetBrains Mono, monospace';
        gCtx.textAlign = 'center';
        gCtx.fillText(formatBin(i, nBits), x + barW / 2, h - 8);
      }

      // Mostra porcentagem de probabilidade acima do alvo
      if (i === targetIndex) {
        const probPct = (amp * amp * 100).toFixed(0) + '%';
        gCtx.fillStyle = '#ffffff';
        gCtx.font = 'bold 11px JetBrains Mono, monospace';
        gCtx.textAlign = 'center';
        const labelY = amp >= 0 ? Math.max(14, y - 6) : y + barH + 14;
        gCtx.fillText(`🎯 ${probPct}`, x + barW / 2, labelY);
      }
    }
  }

  window.renderGroverCanvas = renderGroverCanvas;

  selectQubits.addEventListener('change', () => {
    populateTargetDropdown();
    resetRace();
  });

  selectTarget.addEventListener('change', () => {
    targetIndex = Number(selectTarget.value);
    resetRace();
  });

  document.getElementById('btn-grover-step').addEventListener('click', stepRace);

  document.getElementById('btn-grover-auto').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
      btn.textContent = '▶️ Rodar Corrida Automática';
      return;
    }
    btn.textContent = '⏸️ Pausar Corrida';
    autoTimer = setInterval(() => {
      const doneClassical = classicalFound || classicalPointer >= N;
      const doneQuantum = groverIterationsDone >= optimalGroverIterations;
      if (doneClassical && doneQuantum) {
        clearInterval(autoTimer);
        autoTimer = null;
        btn.textContent = '▶️ Rodar Corrida Automática';
        return;
      }
      stepRace();
    }, 600);
  });

  document.getElementById('btn-grover-reset').addEventListener('click', resetRace);

  populateTargetDropdown();
  resetRace();
}

/* =========================================================================
   MÓDULO 3: ESCALA EXPONENCIAL (N BITS VS N QUBITS)
   ========================================================================= */
function initTab3Scaling() {
  const slider = document.getElementById('scale-n-slider');
  const nLabel = document.getElementById('scale-n-label');
  const statesBadge = document.getElementById('scale-states-badge');
  const cWires = document.getElementById('classical-register-wires');
  const qWires = document.getElementById('quantum-register-wires');
  const cGrid = document.getElementById('classical-cells-grid');
  const qGrid = document.getElementById('quantum-cells-grid');
  const qActiveCount = document.getElementById('quantum-active-states-count');
  const qRamNeeded = document.getElementById('quantum-ram-needed');

  let N = 4;
  let activeBinaryValue = 5; // Ex: 0101
  let quantumMode = 'hadamard'; // 'hadamard' ou 'qft'

  function updateScalingView() {
    N = Number(slider.value);
    const totalStates = 1 << N;
    activeBinaryValue = activeBinaryValue % totalStates;

    nLabel.textContent = String(N);
    statesBadge.textContent = `${totalStates} estados simultâneos`;

    document.querySelectorAll('.n-count').forEach((el) => {
      el.textContent = String(N);
    });
    document.querySelectorAll('.two-pow-n').forEach((el) => {
      el.textContent = String(totalStates);
    });

    qActiveCount.textContent = `${totalStates} de ${totalStates}`;
    const bytes = totalStates * 16; // 16 bytes por Complex128
    qRamNeeded.textContent = bytes >= 1024
      ? `${(bytes / 1024).toFixed(1)} KB (${totalStates} × Complex128)`
      : `${bytes} Bytes (${totalStates} × Complex128)`;

    // Fios do registrador
    const binBits = activeBinaryValue.toString(2).padStart(N, '0');
    cWires.innerHTML = '';
    qWires.innerHTML = '';
    for (let b = 0; b < N; b++) {
      const cw = document.createElement('div');
      cw.className = 'wire-pill binary-wire';
      cw.textContent = `Bit[${b}] = ${binBits[b]}`;
      cWires.appendChild(cw);

      const qw = document.createElement('div');
      qw.className = 'wire-pill quantum-wire';
      qw.textContent = `Qubit[${b}] = (|0⟩ + e^(iφ)|1⟩)/√2`;
      qWires.appendChild(qw);
    }

    // Células de Estado
    cGrid.innerHTML = '';
    qGrid.innerHTML = '';

    for (let i = 0; i < totalStates; i++) {
      const label = i.toString(2).padStart(N, '0');

      // Célula Binária (Apenas 1 ativa!)
      const cCell = document.createElement('div');
      cCell.className = 'matrix-cell' + (i === activeBinaryValue ? ' active-binary' : '');
      cCell.textContent = label;
      cCell.title = `Clique para definir o registrador binário como ${label}`;
      cCell.addEventListener('click', () => {
        activeBinaryValue = i;
        updateScalingView();
      });
      cGrid.appendChild(cCell);

      // Célula Quântica (Todas as 2^N ativas simultaneamente com amplitude e fase!)
      const qCell = document.createElement('div');
      qCell.className = 'matrix-cell';
      const hue = quantumMode === 'qft'
        ? Math.round(((i * activeBinaryValue) % totalStates) * (360 / totalStates))
        : 190;
      qCell.style.background = `hsla(${hue}, 85%, 45%, 0.28)`;
      qCell.style.borderColor = `hsla(${hue}, 90%, 60%, 0.65)`;
      qCell.style.color = '#f8fafc';
      qCell.textContent = `|${label}⟩`;
      qCell.title = `Estado |${label}⟩: Probabilidade = ${(100 / totalStates).toFixed(2)}%, Fase = ${hue}°`;
      qGrid.appendChild(qCell);
    }
  }

  slider.addEventListener('input', updateScalingView);

  document.getElementById('btn-scale-hadamard').addEventListener('click', () => {
    quantumMode = 'hadamard';
    updateScalingView();
  });

  document.getElementById('btn-scale-phase-wave').addEventListener('click', () => {
    quantumMode = 'qft';
    if (activeBinaryValue === 0) activeBinaryValue = 3;
    updateScalingView();
  });

  document.getElementById('btn-scale-clock').addEventListener('click', () => {
    activeBinaryValue = (activeBinaryValue + 1) % (1 << N);
    updateScalingView();
  });

  updateScalingView();
}

/* =========================================================================
   MÓDULO 4: INTERFERÊNCIA QUÂNTICA — ALGORITMO DE DEUTSCH-JOZSA
   ========================================================================= */
function initTab4DeutschJozsa() {
  const oracleSelect = document.getElementById('dj-oracle-select');
  const truthTableEl = document.getElementById('dj-truth-table');
  const classicalVerdict = document.getElementById('dj-classical-verdict');
  const quantumBarsEl = document.getElementById('dj-quantum-bars');
  const quantumVerdict = document.getElementById('dj-quantum-verdict');

  let revealedInputs = new Set();
  let quantumExecuted = false;

  function evalOracle(x, type) {
    const b0 = (x >> 2) & 1;
    const b1 = (x >> 1) & 1;
    const b2 = x & 1;
    switch (type) {
      case 'const0': return 0;
      case 'const1': return 1;
      case 'bal_msb': return b0;
      case 'bal_parity': return b0 ^ b1 ^ b2;
      case 'bal_alt': return b2;
      default: return 0;
    }
  }

  function renderDJ() {
    const type = oracleSelect.value;
    truthTableEl.innerHTML = '';

    for (let x = 0; x < 8; x++) {
      const bin = x.toString(2).padStart(3, '0');
      const isRev = revealedInputs.has(x);
      const fx = evalOracle(x, type);

      const row = document.createElement('div');
      row.className = 'truth-row' + (isRev ? ' revealed' : '');
      row.innerHTML = `
        <span>f(${bin})</span>
        <strong>${isRev ? fx : '? (Consultar)'}</strong>
      `;
      row.addEventListener('click', () => {
        revealedInputs.add(x);
        renderDJ();
      });
      truthTableEl.appendChild(row);
    }

    // Avalia se o computador clássico já pode ter certeza
    const outputs = Array.from(revealedInputs).map((x) => evalOracle(x, type));
    const hasZero = outputs.includes(0);
    const hasOne = outputs.includes(1);

    if (hasZero && hasOne) {
      classicalVerdict.innerHTML = `Consultas clássicas: <strong>${revealedInputs.size}</strong>. Encontrou saídas <code>0</code> e <code>1</code> → Certeza de que é <strong>BALANCEADA</strong>!`;
    } else if (revealedInputs.size >= 5) {
      classicalVerdict.innerHTML = `Consultas clássicas: <strong>${revealedInputs.size} (Pior caso = 5)</strong>. Como mais da metade deu o mesmo valor, certeza de que é <strong>CONSTANTE</strong>!`;
    } else {
      classicalVerdict.innerHTML = `Consultas clássicas: <strong>${revealedInputs.size} / 5</strong>. Ainda <strong>não há 100% de certeza matemática</strong> (no pior caso são necessárias 5 consultas).`;
    }

    // Lado Quântico: Transformada de Walsh-Hadamard Real sobre (-1)^f(x)
    quantumBarsEl.innerHTML = '';
    const finalProbs = new Array(8).fill(0);

    if (quantumExecuted) {
      for (let z = 0; z < 8; z++) {
        let sum = 0;
        for (let x = 0; x < 8; x++) {
          const fx = evalOracle(x, type);
          const phaseOracle = fx === 1 ? -1 : 1;
          // Produto escalar bit a bit (x · z) mod 2
          const dot = ((x & z).toString(2).split('1').length - 1) % 2;
          const hadamardSign = dot === 1 ? -1 : 1;
          sum += phaseOracle * hadamardSign;
        }
        const amp = sum / 8;
        finalProbs[z] = amp * amp;
      }
    }

    for (let z = 0; z < 8; z++) {
      const bin = z.toString(2).padStart(3, '0');
      const prob = quantumExecuted ? (finalProbs[z] * 100).toFixed(0) : '—';
      const card = document.createElement('div');
      card.className = 'dj-bar-card';

      if (quantumExecuted && finalProbs[z] > 0.01) {
        card.classList.add(z === 0 ? 'zero-state-winner' : 'nonzero-winner');
      }

      card.innerHTML = `
        <div>|${bin}⟩</div>
        <strong>${quantumExecuted ? prob + '%' : '?'}</strong>
      `;
      quantumBarsEl.appendChild(card);
    }

    if (quantumExecuted) {
      const p000 = finalProbs[0];
      if (p000 > 0.99) {
        quantumVerdict.innerHTML = `✅ <strong>1 ÚNICA CONSULTA QUÂNTICA:</strong> Todas as fases interferiram construtivamente em <code>|000⟩</code> (P = 100%). A função é garantidamente <strong>CONSTANTE</strong>!`;
      } else {
        quantumVerdict.innerHTML = `✅ <strong>1 ÚNICA CONSULTA QUÂNTICA:</strong> Metade das fases era +1 e metade -1, gerando <strong>interferência destrutiva total em <code>|000⟩</code> (P = 0%)</strong>! A função é garantidamente <strong>BALANCEADA</strong>!`;
      }
    } else {
      quantumVerdict.innerHTML = `Clique em <strong>Executar Circuito Quântico</strong> para descobrir se a função é Constante ou Balanceada com apenas <strong>1 chamada ao Oráculo</strong>!`;
    }
  }

  oracleSelect.addEventListener('change', () => {
    revealedInputs.clear();
    quantumExecuted = false;
    renderDJ();
  });

  document.getElementById('btn-dj-classical-test').addEventListener('click', () => {
    for (let x = 0; x < 8; x++) {
      if (!revealedInputs.has(x)) {
        revealedInputs.add(x);
        break;
      }
    }
    renderDJ();
  });

  document.getElementById('btn-dj-quantum-run').addEventListener('click', () => {
    quantumExecuted = true;
    renderDJ();
  });

  document.getElementById('btn-dj-reset').addEventListener('click', () => {
    revealedInputs.clear();
    quantumExecuted = false;
    renderDJ();
  });

  renderDJ();
}

/* =========================================================================
   MÓDULO 5: EMARANHAMENTO QUÂNTICO (BELL STATE) VS 2 BITS CLÁSSICOS
   ========================================================================= */
function initTab5Entanglement() {
  // --- 2 Bits Clássicos ---
  let bitA = 0;
  let bitB = 0;
  const btnToggleA = document.getElementById('btn-c2-toggle-a');
  const btnToggleB = document.getElementById('btn-c2-toggle-b');
  const cPairContainer = document.getElementById('classical-pair-probs');

  function renderClassicalPair() {
    btnToggleA.textContent = `Alternar Bit A (Atual: ${bitA})`;
    btnToggleB.textContent = `Alternar Bit B (Atual: ${bitB})`;

    const currentStr = `${bitA}${bitB}`;
    const states = ['00', '01', '10', '11'];
    cPairContainer.innerHTML = '';

    states.forEach((st) => {
      const isAct = st === currentStr;
      const card = document.createElement('div');
      card.className = 'pair-card' + (isAct ? ' active-binary-pair' : '');
      card.innerHTML = `
        <div class="pair-state">${st}</div>
        <div class="pair-prob">${isAct ? '100%' : '0%'}</div>
      `;
      cPairContainer.appendChild(card);
    });
  }

  btnToggleA.addEventListener('click', () => {
    bitA = bitA ^ 1;
    renderClassicalPair();
  });
  btnToggleB.addEventListener('click', () => {
    bitB = bitB ^ 1;
    renderClassicalPair();
  });
  document.getElementById('btn-c2-xor').addEventListener('click', () => {
    bitB = bitA ^ bitB;
    renderClassicalPair();
  });

  // --- 2 Qubits: Vetor de Estado Real [c00, c01, c10, c11] ---
  let q2 = [1, 0, 0, 0];
  const bellFormulaEl = document.getElementById('bell-ket-formula');
  const entStatusEl = document.getElementById('entanglement-status');
  const qPairContainer = document.getElementById('quantum-pair-probs');
  const bellLogEl = document.getElementById('bell-measure-log');

  function apply2QubitGate(gate) {
    const [c00, c01, c10, c11] = q2;
    const s = 1 / Math.SQRT2;
    if (gate === 'HA') {
      q2 = [
        (c00 + c10) * s,
        (c01 + c11) * s,
        (c00 - c10) * s,
        (c01 - c11) * s
      ];
    } else if (gate === 'XA') {
      q2 = [c10, c11, c00, c01];
    } else if (gate === 'XB') {
      q2 = [c01, c00, c11, c10];
    } else if (gate === 'ZA') {
      q2 = [c00, c01, -c10, -c11];
    } else if (gate === 'CNOT') {
      // Controle = A, Alvo = B -> troca |10⟩ com |11⟩
      q2 = [c00, c01, c11, c10];
    }
    renderQuantumPair();
  }

  function renderQuantumPair() {
    const labels = ['00', '01', '10', '11'];
    qPairContainer.innerHTML = '';

    const terms = [];
    labels.forEach((st, idx) => {
      const amp = q2[idx];
      const prob = amp * amp;
      if (Math.abs(amp) > 0.01) {
        const sign = amp < 0 ? '-' : (terms.length > 0 ? '+' : '');
        terms.push(`${sign} ${Math.abs(amp).toFixed(2)}|${st}⟩`);
      }

      const card = document.createElement('div');
      card.className = 'pair-card' + (prob > 0.01 ? ' active-pair' : '');
      card.innerHTML = `
        <div class="pair-state">|${st}⟩</div>
        <div class="pair-prob">${(prob * 100).toFixed(1)}%</div>
      `;
      qPairContainer.appendChild(card);
    });

    bellFormulaEl.textContent = `|ψ⟩ = ${terms.join(' ') || '0'}`;

    // Cálculo real da Concorrência Quântica: C = 2 * |c00*c11 - c01*c10|
    const concurrence = Math.min(1, 2 * Math.abs(q2[0] * q2[3] - q2[1] * q2[2]));
    const concPct = Math.round(concurrence * 100);
    if (concPct > 5) {
      entStatusEl.textContent = `${concPct}% (EMARANHADO — Inseparável!)`;
      entStatusEl.className = 'status-entangled';
    } else {
      entStatusEl.textContent = `0% (Estado Produto Separável)`;
      entStatusEl.className = 'status-sep';
    }
  }

  document.getElementById('btn-bell-phi-plus').addEventListener('click', () => {
    const s = 1 / Math.SQRT2;
    q2 = [s, 0, 0, s];
    renderQuantumPair();
    bellLogEl.innerHTML = `✨ <strong>Estado de Bell |Φ⁺⟩ = (|00⟩ + |11⟩)/√2 criado!</strong><br/>Repare: antes da medição, o Qubit A tem 50% de chance de ser 0 ou 1, mas no instante em que você medir o Qubit A, o Qubit B assumirá <strong>exatamente o mesmo valor</strong>!`;
  });

  document.getElementById('btn-bell-psi-plus').addEventListener('click', () => {
    const s = 1 / Math.SQRT2;
    q2 = [0, s, s, 0];
    renderQuantumPair();
    bellLogEl.innerHTML = `🔗 <strong>Estado de Bell |Ψ⁺⟩ = (|01⟩ + |10⟩)/√2 criado!</strong><br/>Aqui os qubits estão emaranhados de forma anti-correlacionada: se A colapsar para 0, B colapsa instantaneamente para 1 (e vice-versa)!`;
  });

  document.getElementById('btn-bell-reset').addEventListener('click', () => {
    q2 = [1, 0, 0, 0];
    renderQuantumPair();
    bellLogEl.innerHTML = `Registrador de 2 qubits reiniciado em <code>|00⟩</code>.`;
  });

  document.querySelectorAll('[data-q2gate]').forEach((btn) => {
    btn.addEventListener('click', () => {
      apply2QubitGate(btn.dataset.q2gate);
    });
  });

  // Medição parcial APENAS do Qubit A!
  document.getElementById('btn-measure-qubit-a').addEventListener('click', () => {
    const probA0 = q2[0] * q2[0] + q2[1] * q2[1];
    const probA1 = q2[2] * q2[2] + q2[3] * q2[3];

    const measuredA = Math.random() < probA0 ? 0 : 1;
    if (measuredA === 0) {
      const norm = Math.sqrt(probA0) || 1;
      q2 = [q2[0] / norm, q2[1] / norm, 0, 0];
    } else {
      const norm = Math.sqrt(probA1) || 1;
      q2 = [0, 0, q2[2] / norm, q2[3] / norm];
    }

    // Verifica qual estado restou para o Qubit B
    const probB0 = q2[0] * q2[0] + q2[2] * q2[2];
    const bStateStr = probB0 > 0.99 ? '0' : (probB0 < 0.01 ? '1' : 'Superposição');

    renderQuantumPair();
    bellLogEl.innerHTML = `👁️ <strong>Medição Parcial Realizada no Qubit A:</strong><br/>` +
      `• O Qubit A sorteou e colapsou para <strong>|${measuredA}⟩</strong>.<br/>` +
      `• Sem tocar no Qubit B, o estado de B colapsou instantaneamente para <strong>|${bStateStr}⟩</strong>!`;
  });

  document.getElementById('btn-bell-100-shots').addEventListener('click', () => {
    const counts = { '00': 0, '01': 0, '10': 0, '11': 0 };
    const labels = ['00', '01', '10', '11'];
    const probs = q2.map((a) => a * a);

    for (let s = 0; s < 200; s++) {
      const r = Math.random();
      let acc = 0;
      for (let i = 0; i < 4; i++) {
        acc += probs[i];
        if (r <= acc) {
          counts[labels[i]]++;
          break;
        }
      }
    }

    bellLogEl.innerHTML = `🎲 <strong>200 Medições de Pares Quânticos:</strong><br/>` +
      `<code>|00⟩</code>: ${counts['00']}x &nbsp;|&nbsp; ` +
      `<code>|01⟩</code>: ${counts['01']}x &nbsp;|&nbsp; ` +
      `<code>|10⟩</code>: ${counts['10']}x &nbsp;|&nbsp; ` +
      `<code>|11⟩</code>: ${counts['11']}x`;
  });

  renderClassicalPair();
  renderQuantumPair();
}
