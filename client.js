const videoTag = document.querySelector('video');
const videourl = 'http://localhost:5000/video'
const manifesturl = 'http://localhost:5000/manifest'
var mimeCodec = 'video/mp4; codecs="avc1.4D401F';
if(MediaSource.isTypeSupported(mimeCodec)) {
  var mediaSource = new MediaSource();
} else {
  console.error("unsupported media format");
}

videoTag.src = URL.createObjectURL(mediaSource);

mediaSource.addEventListener('sourceopen', handleSourceOpen.bind(mediaSource));
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
function repeat(sourceBuffer, start, end, fileSize, chunksize, buf){
  console.log(`repeat:start:${start}, ${end}`);
  sourceBuffer.appendBuffer(buf);
  sourceBuffer.addEventListener('updateend', () => {
  });
}
function fetchManifest(loadManifest){
    var xhr = new XMLHttpRequest();
    xhr.open('get', manifesturl);
    xhr.responseType = 'json';
    xhr.onload = () => {
      loadManifest(xhr.response);
    };
    xhr.send();
}

function fetchSegment(sourceBuffer, start, end,fileSize, chunksize, callback){
  var xhr = new XMLHttpRequest();
  xhr.open('get', videourl);
  xhr.responseType = 'arraybuffer';
  xhr.onload = () => {
    callback(sourceBuffer, start, end, fileSize, chunksize, xhr.response);
  };
  xhr.setRequestHeader('range', `bytes=${start}-${end}`);
  xhr.send();
}
