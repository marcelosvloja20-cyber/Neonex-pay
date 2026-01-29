document.addEventListener("DOMContentLoaded", () => {

  // Endereço do recebedor
  const RECEIVER = "0xd8deaef57da7b8804fecfbfbaeb31ccd335749f5";

  let provider, signer, walletAddress;
  let history = [];

  const connectWalletBtn = document.getElementById('connectWallet');
  const sendPaymentBtn = document.getElementById('sendPayment');
  const tokenSelect = document.getElementById('tokenSelect');
  const amountInput = document.getElementById('amount');
  const progressFill = document.getElementById('progressFill');
  const statusEl = document.getElementById('status');
  const walletAddressEl = document.getElementById('walletAddress');
  const qrcodeContainer = document.getElementById('qrcode');
  const toast = document.getElementById('toast');
  const sidebar = document.getElementById('sidebar');
  const ctx = document.getElementById('paymentChart').getContext('2d');
  let paymentChart;

  // Toggle sidebar
  document.getElementById('toggleSidebar').onclick = () => sidebar.classList.toggle('active');

  // Toast notification
  function showToast(msg){
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(()=>{ toast.classList.remove('show'); },3000);
  }

  // Quick Actions
  window.quickSend = ()=>{ showToast("Enviar ativo selecionado..."); sidebar.classList.add('active'); }
  window.quickReceive = ()=>{ showToast("Receber ativo selecionado..."); sidebar.classList.add('active'); }
  window.quickSwap = ()=>{ showToast("Troca iniciada..."); sidebar.classList.add('active'); }

  // Conectar carteira
  connectWalletBtn.onclick = async () => {
    if(window.ethereum){
      try{
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        walletAddress = await signer.getAddress();
        walletAddressEl.innerText = walletAddress;
        showToast("Carteira conectada!");
      }catch(err){
        console.error(err);
        showToast("Erro ao conectar carteira");
      }
    } else {
      alert("Instale MetaMask ou outra carteira Web3.");
    }
  };

  // Enviar pagamento
  sendPaymentBtn.onclick = async () => {
    const amount = amountInput.value;
    const token = tokenSelect.value;
    if(!walletAddress){ showToast("Conecte sua carteira."); return; }
    if(!amount || isNaN(amount) || amount <= 0){ showToast("Valor inválido."); return; }

    progressFill.style.width = "30%";
    statusEl.innerText = "Preparando pagamento...";

    try{
      const txAmount = ethers.utils.parseUnits(amount.toString(), 18);
      const tx = await signer.sendTransaction({ to: RECEIVER, value: txAmount });

      progressFill.style.width = "70%";
      await tx.wait();
      progressFill.style.width = "100%";

      // QR code simples
      const paymentInfo = `${token}:${RECEIVER}?value=${amount}`;
      qrcodeContainer.innerHTML = "";
      new QRCode(qrcodeContainer, { text: paymentInfo, width:180, height:180 });

      // Histórico
      const txRecord = { token, amount, date: new Date().toLocaleString() };
      history.unshift(txRecord);
      renderHistory();
      renderChart();

      statusEl.innerText = "Pagamento realizado!";
      showToast("Pagamento concluído!");
    }catch(err){
      console.error(err);
      progressFill.style.width = "0%";
      statusEl.innerText = "";
      showToast("Erro na transação.");
    }
  };

  // Renderizar histórico
  function renderHistory(){
    const historyEl = document.getElementById('history');
    historyEl.innerHTML = "";
    history.forEach(tx=>{
      const card = document.createElement('div');
      card.className='history-card';
      card.innerHTML=`<strong

  