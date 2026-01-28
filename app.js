// Aviso para celular sem provider
if (!window.ethereum) {
  alert(
    "Para usar a NEONEX-PAY no celular:\n\n" +
    "1️⃣ Abra o app MetaMask\n" +
    "2️⃣ Vá em Browser 🌐\n" +
    "3️⃣ Cole o link do site\n\n" +
    "No computador, use Chrome + MetaMask."
  );
}

const connectBtn = document.getElementById("connectBtn");
const walletInfo = document.getElementById("walletInfo");

const addressSpan = document.getElementById("address");
const balanceSpan = document.getElementById("balance");
const networkSpan = document.getElementById("network");

connectBtn.onclick = async () =>document.getElementById("sendBox").classList.remove("hidden");
 {
  if (!window.ethereum) {
    return;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    const network = await provider.getNetwork();

    addressSpan.innerText = address;
    balanceSpan.innerText = ethers.formatEther(balance) + " ETH";
    networkSpan.innerText = network.name;

    walletInfo.classList.remove("hidden");
    connectBtn.innerText = "Carteira Conectada ✅";

  } catch (err) {
    console.error(err);
    alert("Erro ao conectar carteira");
  }
};
