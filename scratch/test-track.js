const courier = "jnt";
const awb = "JY1044535617";
const apiKey = "ba606a2ec893dd33519dc979fb0295b625660ae6f77512ef4dabdd6ac96f0b20";
const url = `http://api.binderbyte.com/v1/track?api_key=${apiKey}&courier=${courier}&awb=${awb}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error(err);
  });
