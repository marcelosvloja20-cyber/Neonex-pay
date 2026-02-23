let users = {};

export default function handler(req, res){

if(req.method === "POST"){

const { username, wallet }
= req.body;

users[username] = {

username,

wallet

};

res.status(200).json(users[username]);

}

}
