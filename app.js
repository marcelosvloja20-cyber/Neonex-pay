let provider = null;
let signer = null;

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const USDT_ABI = [
  "function transfer(address to, uint256 value) returns (bool)",
  "function decimals() view returns (uint8)"
];

const connectBtn = document.getElementById("connectWallet");
const sendBtn = document.getElementById("sendPayment");
const amountInput = document.getElementById("amount");
const statusBox = document.getElementById("status");
const progressFill = document.getElementById("progressFill");

connectBtn.addEventListener("click", connectWallet);
sendBtn.addEventListener("click", sendPayment);

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("Instale a MetaMask");
      return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();

    statusBox.innerText = "Carteira conectada com sucesso ✅";
  } catch (e) {
    console.error(e);
    statusBox.innerText = "Erro ao conectar carteira ❌";
  }
}

async function sendPayment() {
  try {
    if (!signer) {
      alert("Conecte a carteira primeiro");
      return;
    }

    const amount = amountInput.value.trim();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("Digite valor válido");
      return;
    }

    startProgress("Enviando USDT...");

    const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
    const decimals = await usdt.decimals();

    const value = ethers.parseUnits(amount, decimals);

    const tx = await usdt.transfer(
      await signer.getAddress(), // depois troca pelo endereço de recebimento real
      value
    );

    startProgress("Confirmando na blockchain...");

    const receipt = await provider.waitForTransaction(tx.hash);

    if (receipt.status === 1) {
      finishProgress("Pagamento USDT confirmado 🎉");
    } else {
      finishProgress("Falha na transação ❌");
    }

  } catch (e) {
    console.error(e);
    finishProgress("Erro no pagamento ❌");
  }
}

function startProgress(text) {
  statusBox.innerText = text;
  progressFill.style.width = "30%";

  setTimeout(() => {
    progressFill.style.width = "70%";
  }, 900);
}

function finishProgress(text) {
  progressFill.style.width = "100%";
  statusBox.innerText = text;

  setTimeout(() => {
    progressFill.style.width = "0%";
  }, 1800);
}

  