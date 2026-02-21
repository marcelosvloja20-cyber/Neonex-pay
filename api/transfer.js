import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let { to, amount, action, username, wallet } = req.body;

    // LÓGICA DE REGISTRO
    if (action === 'register') {
        const { error } = await supabase.from('registros').insert([{ username: username.toLowerCase(), wallet_address: wallet }]);
        if (error) return res.status(400).json({ error: 'Nome já existe.' });
        return res.status(200).json({ success: true });
    }

    // LÓGICA DE BUSCA @NOME
    if (to.startsWith('@')) {
        const { data } = await supabase.from('registros').select('wallet_address').eq('username', to.toLowerCase()).single();
        if (!data) return res.status(404).json({ error: 'Usuário não encontrado.' });
        to = data.wallet_address;
    }

    // LÓGICA DE ENVIO (TAXA ZERO PARA O DESTINATÁRIO)
    try {
        const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
        const masterWallet = new ethers.Wallet(process.env.NEONEX_PRIVATE_KEY, provider);

        const tx = await masterWallet.sendTransaction({
            to: to,
            value: ethers.parseEther(amount.toString())
        });
        await tx.wait();
        return res.status(200).json({ success: true, hash: tx.hash });
    } catch (err) {
        return res.status(500).json({ error: 'Erro na transação. Verifique o saldo da reserva.' });
    }
}
