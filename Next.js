"use client";

import { useState, useEffect } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, IProvider } from '@web3auth/base';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { WalletConnectV2Adapter } from '@web3auth/wallet-connect-v2-adapter';
import Web3 from 'web3';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!;
const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID!;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: '0x89', // Polygon
  rpcTarget: 'https://polygon-rpc.com',
  displayName: 'Polygon Mainnet',
  blockExplorer: 'https://polygonscan.com/',
  ticker: 'POL',
  tickerName: 'POL',
};

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: 'mainnet',
  chainConfig,
});

const openloginAdapter = new OpenloginAdapter({
  adapterSettings: { uxMode: 'popup', whiteLabel: { name: 'Corax' } },
});
web3auth.configureAdapter(openloginAdapter);

const walletConnectV2Adapter = new WalletConnectV2Adapter({
  adapterSettings: { projectId: wcProjectId },
  chainConfig,
});
web3auth.configureAdapter(walletConnectV2Adapter);

export default function Home() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [balance, setBalance] = useState('0.00');
  const [loggedIn, setLoggedIn] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; content: string; }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const supabase = createClientComponentClient({ supabaseUrl, supabaseKey });

  useEffect(() => {
    const init = async () => {
      await web3auth.initModal();
    };
    init();

    // Realtime chat
    supabase.channel('chat').on('broadcast', { event: 'message' }, ({ payload }) => {
      setMessages((prev) => [...prev, payload]);
    }).subscribe();

  }, []);

  const login = async () => {
    const web3authProvider = await web3auth.connect();
    setProvider(web3authProvider);
    setLoggedIn(true);

    const web3 = new Web3(web3authProvider);
    const accounts = await web3.eth.getAccounts();
    const bal = await web3.eth.getBalance(accounts[0]);
    setBalance(web3.utils.fromWei(bal, 'ether'));
  };

  const logout = async () => {
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
  };

  const sendMessage = () => {
    supabase.channel('chat').send({
      type: 'broadcast',
      event: 'message',
      payload: { sender: 'You', content: newMessage },
    });
    setNewMessage('');
  };

  const sendTx = async () => {
    if (!provider) return;
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    const tx = await web3.eth.sendTransaction({
      from: accounts[0],
      to: recipient,
      value: web3.utils.toWei(amount, 'ether'),
    });
    console.log('TX:', tx.transactionHash);
  };

  return (
    <div style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      {!loggedIn ? (
        <button onClick={login}>Login / Conectar Wallet</button>
      ) : (
        <button onClick={logout}>Logout</button>
      )}
      <h1>Corax</h1>
      <p>A nova camada do dinheiro</p>
      <p>Saldo: {balance} POL</p>

      <input type="text" placeholder="Destinatário (0x...)" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
      <input type="number" placeholder="Valor (POL)" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <button onClick={sendTx}>Enviar P2P</button>

      <h2>Chat P2P</h2>
      {messages.map((msg, i) => <p key={i}>{msg.sender}: {msg.content}</p>)}
      <input type="text" placeholder="Mensagem" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
      <button onClick={sendMessage}>Enviar</button>
    </div>
  );
    }
