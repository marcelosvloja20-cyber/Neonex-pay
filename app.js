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

let provider;
let signer;
let userAddress = null;

// USDT na Arbitrum
const USDT_ADDRESS = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9";
const USDT_ABI = [
  "function transfer(address to, uint amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

const RECEIVER = "0xd8deaef57da7b8804fecfbfbaeb31ccd335749f5";

function showToast(message) {
  toast.innerText = message;
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
    div.style.marginTop = "10px";
    div.innerHTML = `<strong>${tx.amount} USDT</strong> - ${tx.product}<br>${tx.date}<br><small>${tx.hash}</small><hr>`;
    historyBox.appendChild(div);
  });
}

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask não encontrada");
    return;
  }
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();
  walletBox.innerText = "Endereço: " + userAddress;
  showToast("Carteira conectada ✅");
  generateQR();
}

connectBtn.onclick = connectWallet;

function loadAmountFromURL() {
  const params = new URLSearchParams(window.location.search);
  const value = params.get("amount");
  const product = params.get("product");
  if (value) amountInput.value = value;
  if (product) productNameBox.innerText = product;
}

loadAmountFromURL();

function generateQR() {
  if (!userAddress) return;
  qrBox.innerHTML = "";
  const amount = amountInput.value || 0;
  const qrData = `ethereum:${RECEIVER}@42161/transfer?address=${USDT_ADDRESS}&uint256=${amount}`;
  new QRCode(qrBox, { text: qrData, width: 180, height: 180, colorDark: "#ffd700", colorLight: "#000" });
}

amountInput.addEventListener("input", generateQR);

async function createPaymentLink(amount, product) {
  try {
    const res = await fetch("/api/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, product })
    });
    const data = await res.json();
    if (data.link) {
      showToast("Link de pagamento criado ✅");
      window.history.replaceState({}, "", data.link);
    }
  } catch (err) {
    console.error(err);
    showToast("Erro ao criar link ❌");
  }
}

async function sendUSDT() {
  if (!signer) {
    showToast("Conecte a carteira");
    return;
  }
  const value = amountInput.value;
  const product = productNameBox.innerText;
  if (!value || value <= 0) {
    showToast("Digite um valor válido");
    return;
  }

  try {
    progressFill.style.width = "30%";
    statusText.innerText = "Criando pagamento...";
    await createPaymentLink(value, product);

    progressFill.style.width = "50%";
    statusText.innerText = "Enviando pagamento...";

    const contract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
    const decimals = await contract.decimals();
    const amount = ethers.parseUnits(value, decimals);
    const tx = await contract.transfer(RECEIVER, amount);

    progressFill.style.width = "70%";
    statusText.innerText = "Confirmando...";
    await tx.wait();

    progressFill.style.width = "100%";
    statusText.innerText = "Pagamento confirmado 🎉";
    showToast("Pagamento recebido com sucesso");

    saveTransaction({ amount: value, product: product, date: new Date().toLocaleString(), hash: tx.hash });
    loadHistory();
    generateQR();
  } catch (err) {
    console.error(err);
    showToast("Erro na transação ❌");
    progressFill.style.width = "0%";
  }
}

sendBtn.onclick = sendUSDT;

loadHistory();
generateQR();

  