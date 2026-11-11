# QuantumLab: Computação Binária vs Computação Quântica na Prática

Aplicativo web interativo e educacional para visualizar, testar e comparar lado a lado a **Computação Binária Clássica (CMOS / Bits)** e a **Computação Quântica (Qubits / Álgebra Linear)**.

---

## 🚀 Como Rodar o Aplicativo

Como o projeto é construído em HTML5, CSS3 moderno e JavaScript puro (Vanilla JS), você pode abri-lo de duas formas simples:

### Opção 1: Abrir diretamente no seu Navegador
Basta dar um duplo clique no arquivo [`index.html`](file:///d:/c/vscode/quantum-computing/index.html) ou clicar com o botão direito e escolher *Abrir com Chrome / Edge / Firefox*.

### Opção 2: Via servidor local (Python ou Node)
No terminal, dentro da pasta `d:\c\vscode\quantum-computing`:
```bash
# Com Python 3:
python -m http.server 3000

# Ou com Node.js (se tiver npx serve instalado):
npx serve .
```
E acesse no navegador: `http://localhost:3000`.

---

## 🔬 Laboratórios e Demonstrações Incluídas

### 1. Bit Clássico vs Qubit & Esfera de Bloch 3D Interativa
* **Lado Binário:** Chave física de transistor com níveis de tensão ($0.0\text{V}$ e $5.0\text{V}$) e porta NOT clássica. Medição determinística ($100\%$ de repetibilidade).
* **Lado Quântico:** Qubit em estado contínuo $|\psi\rangle = \alpha|0\rangle + \beta e^{i\phi}|1\rangle$ com renderização 3D da **Esfera de Bloch**.
* **Interações:**
  * Arraste a esfera com o mouse para girar a câmera em 3D.
  * Aplique portas quânticas unitárias: **Hadamard (H)**, **Pauli-X**, **Pauli-Y**, **Pauli-Z**, **Fase (S)** e **Ry**.
  * Ajuste contínuo dos ângulos $\theta$ e $\phi$.
  * **Medição com Colapso Real:** Veja a função de onda colapsar para $0$ ou $1$ de acordo com a regra de Born ($P = |\alpha|^2$).
  * Simulação Monte Carlo com **1.000 shots** comparando a distribuição estatística real com a teórica.

---

### 2. Corrida na Prática: Busca Sequencial vs Algoritmo de Grover
* **Cenário:** Um banco de dados / cofre de $N = 2^n$ endereços ($8$, $16$ ou $32$ endereços) com apenas 1 segredo correto.
* **CPU Clássica ($O(N)$):** Força bruta que testa endereço por endereço sequencialmente até encontrar o alvo ($N$ passos no pior caso, $N/2$ na média).
* **Processador Quântico ($O(\sqrt{N})$):** Algoritmo de Grover real com:
  1. Superposição uniforme inicial ($H^{\otimes n}$).
  2. **Oráculo de Inversão de Fase:** Inverte a fase apenas do estado alvo ($\alpha_\omega \to -\alpha_\omega$).
  3. **Operador de Difusão (Inversão em torno da média):** Interferência construtiva no alvo e destrutiva nos demais estados.
* Permite execução passo a passo ou corrida automática assistida.

---

### 3. Escala Exponencial do Espaço de Estados ($2^N$)
* Slider interativo de $N = 1$ até $N = 8$ bits/qubits.
* Mostra a limitação clássica: $N$ bits guardam **apenas 1 número por vez** (1 estado ativo e $2^N - 1$ inativos).
* Mostra a vantagem quântica: $N$ qubits em superposição processam um vetor contínuo de **$2^N$ amplitudes complexas simultaneamente**.
* Tabela comparativa de memória clássica necessária para simular computadores quânticos de $4$, $10$, $30$, $50$ e $300$ qubits.

---

### 4. Interferência Quântica: Algoritmo de Deutsch-Jozsa
* **Problema da Caixa-Preta:** Determinar se uma função $f(x)$ de 3 bits é **Constante** ou **Balanceada**.
* **Computação Clássica:** Exige no pior caso $2^{n-1} + 1 = 5$ consultas para ter $100\%$ de certeza matemática.
* **Computação Quântica:** Realiza a Transformada de Walsh-Hadamard e **Phase Kickback**, respondendo com $100\%$ de certeza em **1 única consulta ao oráculo**.

---

### 5. Emaranhamento Quântico (Estados de Bell) vs Bits Independentes
* **2 Bits Clássicos:** Portas booleanas (XOR / CNOT clássica) onde os bits são sempre estados produtos bem definidos.
* **2 Qubits Quânticos:**
  * Criação do Estado de Bell $|\Phi^+\rangle = \frac{|00\rangle + |11\rangle}{\sqrt{2}}$ e $|\Psi^+\rangle = \frac{|01\rangle + |10\rangle}{\sqrt{2}}$.
  * Medidor de **Concorrência Quântica** em tempo real.
  * **Medição Parcial do Qubit A:** Observe o Qubit B colapsar instantaneamente para o mesmo valor sem ter sido tocado diretamente!
  * Simulação de $200$ pares para comprovação estatística da correlação instantânea.

---

### 6. Qiskit na Prática: Do Código Python ao Hardware Real (IBM Quantum Runtime)
* **Integração com o seu script Qiskit 1.0+:**
  * Linha do tempo interativa dos 6 passos (`QiskitRuntimeService`, `least_busy`, `QuantumCircuit`, `PassManager ISA`, `SamplerV2` e `counts`).
  * **Circuito Abstrato vs Circuito ISA (Físico):** Mostra como o transpilador decompõe a porta $H$ em rotações de micro-ondas $[R_z, SX, R_z]$ e mapeia o $CX$ para a porta nativa de acoplamento físico **ECR**.
  * **Topologia do Chip IBM (Eagle 127 Qubits):** Visualização interativa da arquitetura em grade *Heavy-Hex* refrigerada a $15\text{ mK}$ (-273°C) e o par de qubits físicos alocados (#14 e #15).
  * **Histograma de Contagens & Ruído Físico:** Dispare 512, 1024 ou 4096 disparos (shots) e compare a diferença entre um **simulador ideal (100% puro)** e uma **QPU física real** (onde o ruído térmico $T_1/T_2$ e readout geram contagens espúrias em `01` e `10`, exatamente como no output real do código).
  * Console interativo com logs simulando a fila da nuvem IBM Quantum em tempo real.

