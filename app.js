let provider = null;
let signer = null;

// USDT na Polygon
const USDT_ADDRESS = "0x3813e82e6f7098b9583FC0F33a962D02018B6803";

const USDT_ABI = [
  "function transfer(address to, uint256 value) returns (bool)",
  "function decimals() view returns (uint8)"
];

const POLYGON_PARAMS = {
  chainId: "0x89",
  chainName: "Polygon Mainnet",
  rpcUrls: ["https://polygon-rpc.com"],
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18
  },
  blockExplorerUrls: ["https://polygonscan.com"]
};

const connectBtn = document.getElementById("connectWallet");
const sendBtn = document.getElementById("sendPayment");
const amountInput = document.getElementById("amount");
const statusBox = document.getElementById("status");
const progressFill = document.getElementById("progressFill");

connectBtn.onclick = connectWallet;
sendBtn.onclick = sendPayment;

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("Instale a MetaMask");
      return;
    }

    await switchToPolygon();

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();

    statusBox.innerText = "Carteira conectada na Polygon ✅";
  } catch (e) {
    console.error(e);
    statusBox.innerText = "Erro ao conectar ❌";
  }
}

async function switchToPolygon() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: POLYGON_PARAMS.chainId }]
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [POLYGON_PARAMS]
      });
    }
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

    startProgress("Enviando USDT na Polygon...");

    const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
    const decimals = await usdt.decimals();
    const value = ethers.parseUnits(amount, decimals);

    const tx = await usdt.transfer(
      await signer.getAddress(), // depois troque pelo endereço real de recebimento
      value
    );

    startProgress("Confirmando pagamento...");

    const receipt = await provider.waitForTransaction(tx.hash);

    if (receipt.status === 1) {
      finishProgress("USDT confirmado com sucesso 🎉");
    } else {
      finishProgress("Falha no pagamento ❌");
    }

  } catch (e) {
    console.error(e);
    finishProgress("Erro na transação ❌");
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

  