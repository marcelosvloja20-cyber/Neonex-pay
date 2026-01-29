const toggleBtn = document.getElementById("toggleSidebar");
const sidebar = document.getElementById("sidebar");
toggleBtn.onclick = () => sidebar.classList.toggle("active");

const connectBtn = document.getElementById("connectWallet");
const sendBtn = document.getElementById("sendPayment");
const statusText = document.getElementById("status");
const amountInput = document.getElementById("amount");
const progressFill = document.getElementById("progressFill");
const toast = document.getElementById("toast");
const qrBox = document.getElementById("qrcode");
const walletBox = document.getElementById("walletAddress");
const historyBox = document.getElementById("history");
const productNameBox = document.getElementById("productName");
const tokenSelect = document.getElementById("tokenSelect");
const chartCanvas = document.getElementById("paymentChart");

let provider, signer, userAddress = null;

const TOKENS = {
  USDT_ARB: { address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", network: 42161 },
  USDT_POLY: { address: "0x3813e82e6f7098b9583FC0F33a962D02018B6803", network: 137 },
  USDC_BASE: { address: "0x0c12b7D63d2f87662e5E2E93E502eF32fC073c47", network: 8453 }
};

const RECEIVER = "SEU_ENDERECO_PUBLICO_AQUI";

function showToast(msg) {
  toast.innerText = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function saveTransaction(data) {
  const history = JSON.parse(localStorage.getItem("neonex_history")) || [];
  history.unshift(data);
  localStorage.setItem("neonex_history", JSON.stringify(history));
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem("neonex_history")) || [];
  historyBox.innerHTML = "";
  history.forEach(tx => {
    const div = document.createElement("div");
    div.className = "history-card";
    div.innerHTML = `<strong>${tx.amount}</strong> - ${tx.product}<br>${tx.date}<br><small>${tx.hash || ''}</small>`;
    historyBox.appendChild(div);
  });
  updateChart(history);
}

async function connectWallet() {
  if (!window.ethereum) { alert("MetaMask não encontrada"); return; }
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();
  walletBox.innerText = "Endereço: " + userAddress;
  showToast("Carteira conectada ✅");
  generateQR();
}

connectBtn.onclick = connectWallet;

function generateQR() {
  if (!userAddress) return;
  qrBox.innerHTML = "";
  const tokenKey = tokenSelect.value;
  const token = TOKENS[tokenKey];
  const amount = amountInput.value || 0;
  const qrData = `ethereum:${RECEIVER}@${token.network}/transfer?address=${token.address}&uint256=${amount}`;
  new QRCode(qrBox, { text: qrData, width: 160, height: 160, colorDark: "#ffd700", colorLight: "#000" });
}

amountInput.addEventListener("input", generateQR);
tokenSelect.addEventListener("change", generateQR);

async function sendPayment() {
  if (!signer) { showToast("Conecte a carteira"); return; }
  const value = amountInput.value;
  const product = productNameBox.innerText;
  if (!value || value <= 0) { showToast("Valor inválido"); return; }

  try {
    const tokenKey = tokenSelect.value;
    const token = TOKENS[tokenKey];

    progressFill.style.width = "30%";
    statusText.innerText = "Iniciando pagamento...";
    showToast("Iniciando pagamento...");

    progressFill.style.width = "50%";
    statusText.innerText = "Enviando pagamento...";

    const contract = new ethers.Contract(token.address, [
      "function transfer(address to, uint amount) returns (bool)",
      "function decimals() view returns (uint8)"
    ], signer);

    const decimals = await contract.decimals();
    const amountParsed = ethers.parseUnits(value, decimals);
    const tx = await contract.transfer(RECEIVER, amountParsed);

    progressFill.style.width = "70%";
    statusText.innerText = "Confirmando...";
    await tx.wait();

    progressFill.style.width = "100%";
    statusText.innerText = "Pagamento confirmado 🎉";
    showToast("Pagamento recebido ✅");

    saveTransaction({ amount: value, product, date: new Date().toLocaleString(), hash: tx.hash });
    loadHistory();
    generateQR();
  } catch (err) {
    console.error(err);
    showToast("Erro na transação ❌");
    progressFill.style.width="0%";
  }
}

sendBtn.onclick = sendPayment;

// Gráfico Chart.js
let paymentChart;
function updateChart(history) {
  const labels = history.slice(0,10).map(tx => tx.date).reverse();
  const data = history.slice(0,10).map(tx => parseFloat(tx.amount)).reverse();

  if (!paymentChart) {
    paymentChart = new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Pagamentos Recentes',
          data,
          backgroundColor: '#ffd700'
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#fff' }, grid: { color: '#222' } },
          y: { ticks: { color: '#fff' }, grid: { color: '#222' } }
        }
      }
    });
  } else {
    paymentChart.data.labels = labels;
    paymentChart.data.datasets[0].data = data;
    paymentChart.update();
  }
}

// Inicializar
loadHistory();
generateQR();


  