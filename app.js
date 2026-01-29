const connectBtn = document.getElementById("connectWallet");
const sendBtn = document.getElementById("sendPayment");
const statusText = document.getElementById("status");
const amountInput = document.getElementById("amount");
const progressFill = document.getElementById("progressFill");

let provider;
let signer;

// Endereço USDT na Arbitrum One
const USDT_ADDRESS = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9";

// ABI mínima USDT
const USDT_ABI = [
  "function transfer(address to, uint amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

// 👉 COLOQUE SEU ENDEREÇO AQUI (wallet que recebe os pagamentos)
const RECEIVER = "0xd8deaef57da7b8804fecfbfbaeb31ccd335749f5";

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask não encontrada");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();

  statusText.innerText = "Carteira conectada ✅";
}

connectBtn.onclick = connectWallet;

// Ler valor da URL tipo ?amount=50
function loadAmountFromURL() {
  const params = new URLSearchParams(window.location.search);
  const value = params.get("amount");
  if (value) amountInput.value = value;
}

loadAmountFromURL();

async function sendUSDT() {
  if (!signer) {
    alert("Conecte a carteira primeiro");
    return;
  }

  const value = amountInput.value;
  if (!value || value <= 0) {
    alert("Digite um valor válido");
    return;
  }

  try {
    progressFill.style.width = "20%";
    statusText.innerText = "Preparando transação...";

    const contract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
    const decimals = await contract.decimals();

    const amount = ethers.parseUnits(value, decimals);

    progressFill.style.width = "50%";
    statusText.innerText = "Enviando USDT...";

    const tx = await contract.transfer(RECEIVER, amount);

    progressFill.style.width = "75%";
    statusText.innerText = "Confirmando na blockchain...";

    await tx.wait();

    progressFill.style.width = "100%";
    statusText.innerText = "Pagamento confirmado 🎉";

  } catch (err) {
    console.error(err);
    statusText.innerText = "Erro na transação ❌";
    progressFill.style.width = "0%";
  }
}

sendBtn.onclick = sendUSDT;

  