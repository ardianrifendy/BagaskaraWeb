const apiKey = "ba606a2ec893dd33519dc979fb0295b625660ae6f77512ef4dabdd6ac96f0b20";

async function test(awb) {
  const url = `http://api.binderbyte.com/v1/track?api_key=${apiKey}&courier=jnt&awb=${awb}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test("JY1045073047");
