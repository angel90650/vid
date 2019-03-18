const videoTag = document.querySelector('video');
const chunksizeDial = $("#chunksize");
const delayDial = $('#networkdelay');
const playButton = $("#playbutton");
const list = $("#list");
var listCount = 0;
const videourl = 'http://localhost:5000/video'
const manifesturl = 'http://localhost:5000/manifest'
var mimeCodec = 'video/webm; codecs="vorbis,vp8"';
if(MediaSource.isTypeSupported(mimeCodec)) {
  var mediaSource = new MediaSource();
} else {
  console.error("unsupported media format");
}



mediaSource.addEventListener('sourceopen', start.bind(mediaSource));
playButton.click(() => {
  console.log("clicked");
  list.empty();
  videoTag.src = URL.createObjectURL(mediaSource);
});
async function start() {
  var startTime =  new Date();
  var delay = delayDial.val();
  var chunksize = chunksizeDial.val() * 1000 || 10000;
  console.log(chunksize);
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
  while (end <= fileSize && start < fileSize){
    console.log(`start${start}, end${end}`);
    console.log(`fetch: ${count}`)
    count +=1
    await new Promise(r => setTimeout(r, delay));
    var data = await fetchSegment(start, end);
    console.log(`data: ${data}`);
    await sourceBuffer.appendBuffer(data);
    var current = new Date();
    var elapsed = current - startTime;
    updateList(`Streamed segment (startByte - endByte): ${start} - ${end} : time elapsed ${elapsed} ms`);
    start = end + 1;
    end = (chunksize < fileSize - end) ? (start + chunksize) : fileSize;
    if (end/parseFloat(fileSize) > 0.10) {
      await videoTag.play();
      }
    }
}

function repeat(sourceBuffer, start, end, fileSize, chunksize, buf){
  console.log(`repeat:start:${start}, ${end}`);
  sourceBuffer.appendBuffer(buf);
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

function updateList(data) {

  console.log(data);
  $("#list").prepend(`<li class="list-group-item">${data}</li>`);
  listCount += 1;
}
