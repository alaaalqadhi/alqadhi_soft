async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/health');
    const data = await res.json();
    console.log("Health check:", data);
    
    const res2 = await fetch('http://localhost:3000/api/plates');
    const data2 = await res2.json();
    console.log("Plates count:", data2.length);
  } catch (err) {
    console.error("Test failed:", err);
  }
}
test();
