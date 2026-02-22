import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const SERVICE_FEE = 0.05; // Taxa Fixa Imutável no Servidor

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Apenas POST' });

    let { to, amount, action, username, wallet } = req.body;

    // --- CAMADA 1: SEGURANÇA DE REGISTRO ---
    if (action === 'register') {
        if (!username.startsWith('@') || username.length < 3) {
            return res.status(400).json({ error: 'Nome de usuário inválido.' });
        }
        const { error } = await supabase.from('registros').insert([{ 
            username: username.toLowerCase(), 
            wallet_address: wallet 
        }]);
        if (error) return res.status(400).json({ error: 'Este nome já está em uso.' });
        return res.status(200).json({ success: true });
    }

    // --- CAMADA 2: VALIDAÇÃO DE PAGAMENTO ---
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ error: 'Valor de envio inválido.' });
    }

    // Resolve o @nome no Supabase
    if (to.startsWith('@')) {
        const { data } = await supabase.from('registros')
            .select('wallet_address')
            .eq('username', to.toLowerCase())
            .single();
        if (!data) return res.status(404).json({ error: 'Destinatário @neonex não encontrado.' });
        to = data.wallet_address;
    }

    // --- CAMADA 3: EXECUÇÃO BLINDADA NA BLOCKCHAIN ---
    try {
        const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
        const masterWallet = new ethers.Wallet(process.env.NEONEX_PRIVATE_KEY, provider);

        // Verifica se a carteira mestre da NEONEX tem saldo para pagar o gás + envio
        const masterBalance = await provider.getBalance(masterWallet.address);
        const totalNeeded = ethers.parseEther((numericAmount).toString());

        if (masterBalance < totalNeeded) {
            return res.status(500).json({ error: 'Sistema em manutenção (Reserva Baixa).' });
        }

        // Executa o envio. A taxa de 0.05 é o lucro que permanece na carteira mestre
        // quando o usuário deposita fundos nela.
        const tx = await masterWallet.sendTransaction({
            to: to,
            value: totalNeeded
        });

        await tx.wait(); // Espera confirmação da rede

        return res.status(200).json({ 
            success: true, 
            hash: tx.hash,
            fee_collected: SERVICE_FEE 
        });

    } catch (err) {
        console.error("Erro Crítico NEONEX:", err);
        return res.status(500).json({ error: 'Falha na rede Polygon. Tente novamente.' });
    }
}
