// api/transfer.js
import { ethers } from 'ethers';

// Simulação de banco de dados (Substituir por algo real depois)
const USER_REGISTRY = {
    "@suporte": "0xSeuEnderecoDeSuporteAqui",
    "@teste": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Apenas POST permitido' });

    let { to, amount } = req.body;
    const SERVICE_FEE = 0.05; // A taxa que o usuário paga

    // 1. Resolver Nome de Usuário (@)
    if (to.startsWith('@')) {
        const resolved = USER_REGISTRY[to.toLowerCase()];
        if (!resolved) return res.status(400).json({ error: 'Usuário NEONEX não cadastrado.' });
        to = resolved;
    }

    try {
        const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
        
        // Esta é a carteira da NEONEX que assina a transação
        const masterWallet = new ethers.Wallet(process.env.NEONEX_PRIVATE_KEY, provider);

        // Lógica de Negócio:
        // O valor total que sai da "reserva" da NEONEX é o que o usuário pediu.
        // Em um sistema real, você descontaria os 0.05 do saldo interno do usuário.
        
        console.log(`Iniciando transferência P2P: ${amount} POL para ${to}`);

        const tx = await masterWallet.sendTransaction({
            to: to,
            value: ethers.parseEther(amount.toString()),
            // Opcional: Aqui você poderia enviar os 0.05 para uma carteira de lucro separada
        });

        const receipt = await tx.wait();

        return res.status(200).json({ 
            success: true, 
            hash: receipt.hash,
            feeCharged: SERVICE_FEE
        });

    } catch (error) {
        return res.status(500).json({ error: 'Saldo insuficiente na reserva NEONEX ou erro de rede.' });
    }
}

