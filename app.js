let provider = null;
let signer = null;

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
      alert("Instale a MetaMask para continuar");
      return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();

    statusBox.innerText = "Carteira conectada com sucesso ✅";
  } catch (error) {
    console.error(error);
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
      alert("Digite um valor válido");
      return;
    }

    startProgress("Enviando transação...");

    const tx = await signer.sendTransaction({
      to: await signer.getAddress(), // depois você troca pelo endereço de recebimento real
      value: ethers.parseEther(amount)
    });

    startProgress("Confirmando na blockchain...");

    const receipt = await provider.waitForTransaction(tx.hash);

    if (receipt.status === 1) {
      finishProgress("Pagamento confirmado com sucesso 🎉");
    } else {
      finishProgress("Transação falhou ❌");
    }

  } catch (error) {
    console.error(error);
    finishProgress("Erro na transação ❌");
  }
}

function startProgress(text) {
  statusBox.innerText = text;
  progressFill.style.width = "25%";

  setTimeout(() => {
    progressFill.style.width = "65%";
  }, 900);
}

function finishProgress(text) {
  progressFill.style.width = "100%";
  statusBox.innerText = text;

  setTimeout(() => {
    progressFill.style.width = "0%";
  }, 2000);
}

  