# yt_stabiity_01
81 downloads 3 failures - large 1.8 GB downloads confirmed, stable for a week, ever since adding cookies -do modify because of random errors, its good.

## Android
download kiwi browser and install cookies.txt extention (easy),just search for cookies.txt, 
next using the kiwi browser goto youtube.com and sign in,immediaately after click the cookies.txt extention
in top right corner ...download the generated cookie for youtube and place the downloded cookies.txt
in same location as appj_stability.js


    const yt = spawn("yt-dlp",[
      "--cookies", "cookies.txt",  // HERE IT IS IN CODE
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

then.

        npm i 
        npm i express
        pkg install nodejs
        pkg install yt-dlp python ffmpeg

then modify what playlists you waant to find and download

        const searchPlaylistName = [
        "christian hymes worship mix",
        "christian church music",
        "thanks and praise worship playlist",
        "jesus worship playlist"
        ];

save the file and run it with:

        node appj_stabiity.js


obviousy make sure to you put what playlist you want to download in the code here:

        //////////////////////////////
        // CONFIG
        //////////////////////////////
        
        const CONCURRENCY = 4;  // 2-4 forlow spec machines 10-20+ macbook
        const SAFE_LIMIT = 2; 1-5 for low spec 15+ for high end, play with these values deepnds on CPU / ram etc
        
        const Forever = true;  // continuously download the same tracks and playlists (used for testing stability)
        const Shuffle = true;
        
        const SearchForPlaylists = 20; // NUMBER OF PLAYLIST TO DOWNLOAD (no limit)
        
        const DOWNLOAD_DIR = "./mp3";  // LOCATION AND NAME OF DOWNLOAD FOLDER
        
        const MAX_ERROR_STREAK = 20;
        
        const ENABLE_TAGS = true;
        const ENABLE_SCROLL = true;
        
        const searchPlaylistName = [
        "christian hymes worship mix",
        "christian church music",
        "thanks and praise worship playlist",
        "jesus worship playlist"
        ];


in same location as appj_stability.js tou should see an automaticallygnerated folder called downloads,
there is your files!

:-)
        
