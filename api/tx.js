let txs = [];

export default function handler(req, res){

if(req.method === "POST"){

txs.push(req.body);

res.status(200).json(txs);

}

if(req.method === "GET"){

res.status(200).json(txs);

}

}
