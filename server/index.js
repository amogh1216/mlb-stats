const express = require("express");
const cors = require('cors');

const PORT = process.env.PORT || 1001;

const app = express();
app.use(express.json());
app.use(cors());

let p1cachedData = null;
let p2cachedData = null;
let cachedData = null;
let lastFetched = null;

let gameInfoCached = null;

const fetchScores = async() => {
  
  var date, next_date;
  var refDate = new Date(); // time in UTC

  
  if (refDate.getUTCHours() > 10) {
    date = refDate.toISOString().split('T')[0];
    refDate.setDate(refDate.getDate()+1);
    next_date = refDate.toISOString().split('T')[0];
  }
  // night time (next day in utc)
  else {
    refDate.setDate(refDate.getDate()-1);
    date = refDate.toISOString().split('T')[0];
    refDate.setDate(refDate.getDate()+1);
    next_date = refDate.toISOString().split('T')[0];
  }

  var myHeaders = new Headers();
  myHeaders.append("x-rapidapi-key", "656887a85400e11cc4be2c09dc3fd65f");
  myHeaders.append("x-rapidapi-host", "v1.baseball.api-sports.io");

  var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

  try {
    const response1 = await fetch("https://v1.baseball.api-sports.io/games?league=1&season=2024&date=" + date, 
      requestOptions);
    const data1 = await response1.json();
    p1cachedData = data1;

    const response2 = await fetch("https://v1.baseball.api-sports.io/games?league=1&season=2024&date=" + next_date, 
      requestOptions);
    const data2 = await response2.json();
    p2cachedData = data2;

    lastFetched = new Date();
    console.log("Game data fetched and cached");
  } catch(error) {
    console.error('Error fetching scores:', error);
  }
}

const fetchGameInfo = async() => {

  try {
    const response = await fetch("http://127.0.0.1:5000/api/game_info");
    const data = await response.json();

    gameInfoCached = data;

    lastFetched = new Date();
    console.log("Info fetched and cached");
  } catch(error) {
    console.error('Error fetching info:', error);
  }
}

// Fetch data every 600 minutes
setInterval(fetchScores, 60000);

// Fetch data every minute
setInterval(fetchGameInfo, 60000)

fetchScores();
fetchGameInfo();

app.get("/api/mlb/scores", async (req, res) => {
  if ((!p1cachedData || !p2cachedData) && !gameInfoCached) {
    return res.status(503).json({ error: 'Data not available yet' });
  }

  const combined = [p1cachedData, p2cachedData];
  const full = [combined, gameInfoCached];
  res.json(full);
});
  
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});