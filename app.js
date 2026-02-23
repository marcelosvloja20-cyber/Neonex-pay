import CHAINS from "./chains.js";

import { ethers }
from "https://cdn.jsdelivr.net/npm/ethers@6.7.0/+esm";

let currentChain = "polygon";

const wallet =
"0xSEU_WALLET_AQUI";

window.switchNetwork =
function(){

currentChain =
document.getElementById("network").value;

loadBalance();

}

async function loadBalance(){

const chain =
CHAINS[currentChain];

const provider =
new ethers.JsonRpcProvider(chain.rpc);

const balance =
await provider.getBalance(wallet);

const formatted =
ethers.formatEther(balance);

document.getElementById("balance")
.innerHTML =

formatted + " " + chain.symbol;

}

loadBalance();
