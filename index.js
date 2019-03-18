const express = require('express');
const app = express();
const path = require('path');
const logger = require('./middleware/logger');
const fs = require('fs');
const videoName = 'output.webm';
//const readStream = fs.createReadStream('/video/video.mp4');
//init middleware
app.use(logger);
const members = {name: 'hello'};
app.get('/api/members', (req, res) => res.json(members));

//get Single members
app.get('/api/members/:id', (req, res) => {
  res.send(req.params.id);
});
app.get('/client.js', (req, res) => {
  res.sendFile(path.join(__dirname,'client.js'));
});

app.get('/ui.js', (req, res) => {
  res.sendFile(path.join(__dirname,'ui.js'));
});
app.get('/manifest', (req, res) => {
  const vidpath = path.join(__dirname, 'public', videoName);
  const stat = fs.statSync(vidpath);
  const fileSize = stat.size;
  const data = {size: fileSize, filename: 'pixar'}
  res.send(JSON.stringify(data));
});

app.get('/video', (req, res) => {
  const vidpath = path.join(__dirname, 'public', videoName);
  const stat = fs.statSync(vidpath);
  const fileSize = stat.size;
  const range = req.headers.range;
  if (range){
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1
    console.log('start:'+ start + 'end:' + end);
    const file = fs.createReadStream(vidpath, {start, end});
    if (end == fileSize){
      console.log("here")
      const head = {
        'Content-Length': end - start,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
    }else {
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges':'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
    }

    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(vidpath).pipe(res);
  }
});
//set static folder
app.use(express.static(path.join(__dirname, 'public')));
const PORT = process.env.PORT || 5000
app.listen(PORT, console.log(`Server started ${PORT}`));
