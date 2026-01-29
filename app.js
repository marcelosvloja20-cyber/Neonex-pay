const NEX_TOKEN_ADDRESS = "COLOQUE_AQUI_ENDERECO_DO_TOKEN";
const NEX_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)"
];

let provider, signer, walletAddress;

const sidebar = document.getElementById("sidebar");
document.getElementById("toggleSidebar").onclick = () => sidebar.classList.toggle("active");

async function connectWallet() {
    if (!window.ethereum) return alert("Instale a MetaMask");
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    walletAddress = await signer.getAddress();
    document.getElementById("walletAddress").innerText = walletAddress;
    showToast("Carteira conectada!");
}

async function sendNEX(to, amount) {
    const token = new ethers.Contract(NEX_TOKEN_ADDRESS, NEX_ABI, signer);
    const tx = await token.transfer(to, ethers.parseUnits(amount.toString(), 18));
    await tx.wait();
    showToast(`Enviado ${amount} NEX para ${to}`);
    updateHistory(`Enviado ${amount} NEX para ${to}`);
}

function quickSend() {
    const to = prompt("Endereço do destinatário:");
    const amount = prompt("Quantos NEX enviar?");
    sendNEX(to, amount);
}
function quickReceive() { showToast("Mostre seu QR para receber NEX"); }
function quickSwap() { showToast("Swap interno $NEX / USDT em breve"); }

function showToast(msg) {
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"), 3500);
}

function updateHistory(msg) {
    const h = document.getElementById("history");
    const div = document.createElement("div");
    div.classList.add("history-card");
    div.innerText = msg;
    h.prepend(div);
}

// Botões MetaMask
document.getElementById("connectWallet").onclick = connectWallet;
document.getElementById("sendPayment").onclick = () => {
    const to = prompt("Endereço do destinatário:");
    const amount = document.getElementById("amount").value;
    sendNEX(to, amount);
};

  