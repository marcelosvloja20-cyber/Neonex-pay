let payments = JSON.parse(
  global.payments || "[]"
); // temporário

export default function handler(req, res) {
  return res.status(200).json(payments);
}