async function run() {
  try {
    const res = await fetch("https://api.github.com/repos/wukko/cobalt/contents/docs", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const files = await res.json();
    console.log("Docs files:", files.map(f => f.name));
  } catch (err) {
    console.error("Error fetching docs listing:", err);
  }
}
run();
