const blessed = require("blessed");
const contrib = require("blessed-contrib");
const { spawn } = require("child_process");
const fs = require("fs");

//////////////////////////////
// CONFIG
//////////////////////////////

const CONCURRENCY = 4;
const SAFE_LIMIT = 2;

const Forever = true;
const Shuffle = true;

const SearchForPlaylists = 20;

const DOWNLOAD_DIR = "./mp3";

const MAX_ERROR_STREAK = 20;

const ENABLE_TAGS = true;
const ENABLE_SCROLL = true;

const searchPlaylistName = [
"christian hymes worship mix",
"christian church music",
"thanks and praise worship playlist",
"jesus worship playlist"
];

//////////////////////////////
// STATE
//////////////////////////////

let queue = [];
let index = 0;

let active = 0;
let done = 0;
let failed = 0;
let loopCount = 0;

let errorStreak = 0;

let startTime = Date.now();
let systemState = "INIT";

//////////////////////////////
// FS INIT
//////////////////////////////

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR);
}

//////////////////////////////
// UI
//////////////////////////////

const screen = blessed.screen({
  smartCSR: true,
  title: "YT GRID PRO MAX"
});

const grid = new contrib.grid({ rows: 12, cols: 12, screen });

const statsBox = grid.set(0, 0, 5, 6, blessed.box, {
  label: "SYSTEM",
  border: "line",
  tags: ENABLE_TAGS,
  scrollable: ENABLE_SCROLL
});

const downloadBox = grid.set(0, 6, 5, 6, blessed.log, {
  label: "DOWNLOAD",
  border: "line",
  tags: ENABLE_TAGS,
  scrollable: ENABLE_SCROLL
});

const convertBox = grid.set(5, 6, 5, 6, blessed.log, {
  label: "CONVERT",
  border: "line",
  tags: ENABLE_TAGS,
  scrollable: ENABLE_SCROLL
});

const workerTable = grid.set(5, 0, 5, 6, contrib.table, {
  label: "WORKERS",
  columnWidth: [8, 12, 12],
  tags: ENABLE_TAGS
});

const logBox = grid.set(10, 0, 2, 12, blessed.log, {
  label: "LOGS",
  border: "line",
  scrollable: ENABLE_SCROLL,
  tags: ENABLE_TAGS
});

screen.key(['q','C-c'],()=>process.exit(0));

//////////////////////////////
// LOG
//////////////////////////////

function log(type,msg){

  if(type === "ERRO"){
    errorStreak++;
  } else {
    errorStreak = 0;
  }

  if (logBox._lines?.length > 200) logBox.clear();
  logBox.log(`[${type}] ${msg}`);
}

//////////////////////////////
// UTIL
//////////////////////////////

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

function countMP3(){
  try{
    return fs.readdirSync(DOWNLOAD_DIR).filter(f=>f.endsWith(".mp3")).length;
  }catch{
    return 0;
  }
}

function uptime(){
  return Math.floor((Date.now() - startTime)/1000);
}

//////////////////////////////
// SEARCH (FIXED URL)
//////////////////////////////

function search(query){
  return new Promise((resolve)=>{

    log("INFO",`Searching: ${query}`);

    const yt = spawn("yt-dlp",[
      "--flat-playlist","-J",
      `ytsearch${SearchForPlaylists}:${query}`
    ]);

    let out="";

    yt.stdout.on("data",d=>out+=d.toString());

    yt.on("error",err=>{
      log("ERRO",err.message);
      resolve([]);
    });

    yt.on("close",()=>{
      try{
        const json = JSON.parse(out);

        const urls = (json.entries || [])
          .map(e => e.url)
          .filter(u => typeof u === "string" && u.length > 5)
          .map(u => u.startsWith("http")
            ? u
            : `https://www.youtube.com/watch?v=${u}`
          );

        log("INFO",`Found ${urls.length}`);
        resolve(urls);

      }catch{
        log("ERRO","Search parse failed");
        resolve([]);
      }
    });
  });
}

//////////////////////////////
// DOWNLOAD
//////////////////////////////

function download(url,id){

  if(!url || typeof url !== "string") return;

  active++;

  const yt = spawn("yt-dlp",[
    "--cookies", "cookies.txt",
    "-f","bestaudio/best",
    "--extract-audio",
    "--audio-format","mp3",
    "--no-playlist",
    "--newline",
    "--retries","3",
    "--fragment-retries","3",
    "--no-part",
    "--force-overwrites",
    "--paths", DOWNLOAD_DIR,
    url
  ]);

  yt.on("error",err=>{
    active--;
    failed++;
    log("ERRO",err.message);
  });

  yt.stdout.on("data",d=>{
    const s = d.toString();

    if (downloadBox._lines?.length > 200) downloadBox.clear();
    if (convertBox._lines?.length > 200) convertBox.clear();

    if(s.includes("[download]")) downloadBox.log(s.trim());
    if(s.includes("[ExtractAudio]")) convertBox.log(s.trim());
  });

  yt.stderr.on("data",d=>{
    const s = d.toString();
    if(s.toLowerCase().includes("error")){
      log("ERRO",s.trim());
    }
  });

  yt.on("close",(code)=>{
    active--;

    if(code === 0){
      done++;
      log("INFO",`W${id} DONE`);
    } else {
      failed++;
      log("ERRO",`W${id} FAILED (${code})`);
    }
  });
}

//////////////////////////////
// FIXED POOL
//////////////////////////////

async function runPool(){

  systemState = "DOWNLOADING";

  while(true){

    if(index >= queue.length && active === 0){
      return;
    }

    while(active >= SAFE_LIMIT){
      await sleep(200);
    }

    if(index >= queue.length){
      await sleep(300);
      continue;
    }

    const url = queue[index++];

    if(!url) continue;

    download(url,index);

    await sleep(100);
  }
}

//////////////////////////////
// UI LOOP
//////////////////////////////

setInterval(()=>{

  statsBox.setContent(
`State          : ${systemState}

Active Threads : ${active}/${CONCURRENCY}
Queue Remaining: ${queue.length - index}
Completed      : ${done}
Failed         : ${failed}

Error Streak   : ${errorStreak}

Download Files : ${countMP3()}
Loop Iteration : ${loopCount}

Uptime (sec)   : ${uptime()}`
  );

  const rows = [];
  for(let i=0;i<CONCURRENCY;i++){
    rows.push([
      `W${i+1}`,
      i < active ? "ACTIVE" : "IDLE",
      i < active ? "RUNNING" : "-"
    ]);
  }

  workerTable.setData({
    headers:["Worker","State","Status"],
    data:rows
  });

  screen.render();

},300);

//////////////////////////////
// MAIN
//////////////////////////////

async function main(){

  log("INFO","SYSTEM START");

  while(true){

    systemState = "SEARCHING";

    queue = [];

    for(const q of searchPlaylistName){
      const r = await search(q);
      queue.push(...r);
    }

    log("INFO",`Total Tracks: ${queue.length}`);

    index = 0;
    active = 0;
    done = 0;
    failed = 0;

    loopCount++;

    await runPool();

    if(!Forever) break;

    systemState = "IDLE";
    await sleep(3000);
  }
}

main();
