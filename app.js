let provider, signer;

async function connectWallet(){
  if(!window.ethereum){
    alert("Instale uma wallet Web3");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();

  const address = await signer.getAddress();

  document.getElementById("connect").innerText =
    address.slice(0,6)+"..."+address.slice(-4);
}

document.getElementById("connect").onclick = connectWallet;

  