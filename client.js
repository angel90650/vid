const videoTag = document.querySelector('video');
const videourl = 'http://localhost:5000/video'
const manifesturl = 'http://localhost:5000/manifest'
var mimeCodec = 'video/webm; codecs="vorbis,vp8"';
if(MediaSource.isTypeSupported(mimeCodec)) {
  var mediaSource = new MediaSource();
} else {
  console.error("unsupported media format");
}

videoTag.src = URL.createObjectURL(mediaSource);

mediaSource.addEventListener('sourceopen', start.bind(mediaSource));

async function start() {
  var chunksize = 10028;
  try{
    var manifest = await fetchManifest();
    var fileSize = manifest.size;
    console.log(manifest.size);
  } catch(err){
    console.log(err);
  }
  var count = 0;
  var start = 0;
  var end = chunksize;
  var sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
  //sourceBuffer.addEventListener('updateend', onUpdateEnd);
  while (end < fileSize){
    console.log(`start${start}, end${end}`);
    console.log(`fetch: ${count}`)
    count +=1
    var data = await fetchSegment(start, end);
    console.log(`data: ${data}`);
    await sourceBuffer.appendBuffer(data);
    start = end + 1;
    end = (chunksize < fileSize - end) ? (start + chunksize) : fileSize;
    }
}

function repeat(sourceBuffer, start, end, fileSize, chunksize, buf){
  console.log(`repeat:start:${start}, ${end}`);
  sourceBuffer.appendBuffer(buf);
}

function handleSourceOpen() {

  fetchManifest((res) => {
    var chunksize = 10028
    var start = 0;
    var fileSize;
    var end = chunksize;
    console.log(res);
    fileSize = res.size;
    console.log(res.size);
    end = (chunksize < fileSize - end) ? (start + chunksize) : (fileSize - end);

    var sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
    sourceBuffer.addEventListener('updateend', () => {
      const videoTag = document.querySelector('video');
      console.log("here");
      var myBufferedRange = sourceBuffer.buffered;
      console.log(myBufferedRange);
      console.log(`end: ${end}, fileSize:${fileSize}`);
      if (end < fileSize) {
        start = end + 1
        end = (chunksize < fileSize - end) ? (start + chunksize) : fileSize
        fetchSegment(sourceBuffer, start, end ,fileSize, chunksize, repeat.bind(sourceBuffer));
      }

    });
    console.log(`start${start}, end${end}`);
    console.log('source opened');
    fetchSegment(sourceBuffer,  start, end, fileSize, chunksize, repeat.bind(sourceBuffer));
    videoTag.play();
  });
}

function fetchManifest(){
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.onload = () => {
      resolve(xhr.response);
    }
    xhr.ontimeout = function () {
     reject('timeout')
   }
    xhr.open('get', manifesturl);
    xhr.responseType = 'json';
    xhr.send();
  });
}

async function fetchSegment(start, end){
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open('get', videourl);
    xhr.responseType = 'arraybuffer';
    xhr.setRequestHeader('range', `bytes=${start}-${end}`);
    xhr.onload = () => {
      resolve(xhr.response);
    }
    xhr.ontimeout = function () {
     reject('timeout')
   }
    xhr.send();
  });
}
