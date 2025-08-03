import crypto from "crypto";

const GenerateRandomId = () => {
  const randomSegment = crypto.randomBytes(4).toString("hex");
  const dateSegment = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${dateSegment}${randomSegment}`;
};
export default GenerateRandomId;

export const generateRandomAlphanumeric = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
};


export const generateUniqueOrderTracker = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // 36 chars
  const randomPart = Array(3)
    .fill(0)
    .map(() => characters[Math.floor(Math.random() * characters.length)])
    .join('');
  const timestamp = Date.now().toString(36).slice(-3);
  return `${randomPart}${timestamp}`; 
};


const uniqueString = generateUniqueOrderTracker();
console.log(uniqueString); // Example output: "aB7df5"
