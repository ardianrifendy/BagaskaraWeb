async function run() {
  try {
    const res = await fetch("https://instances.cobalt.best/api/v1/instances");
    if (!res.ok) {
      console.log(`Failed to fetch instances list: ${res.status}`);
      return;
    }
    const list = await res.json();
    console.log(`Found ${list.length} instances.`);

    // Sort or filter by those supporting youtube and being online
    const activeInstances = list.filter(ins => ins.status === "up" || ins.alive);
    console.log(`Active instances: ${activeInstances.length}`);
    for (const ins of activeInstances.slice(0, 15)) {
      console.log(`- Name: ${ins.name || ins.url}, URL: ${ins.url}, API: ${ins.api || ins.url}`);
    }
  } catch (err) {
    console.error("Error fetching instances:", err);
  }
}
run();
