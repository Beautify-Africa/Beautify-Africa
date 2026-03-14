const res = await fetch('http://localhost:5000/health');
const data = await res.json();
console.log(data);