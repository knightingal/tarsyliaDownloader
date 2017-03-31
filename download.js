var http = require("http");
var fs = require("fs");
var url = require('url');
var path = require('path');
var EventEmitter = require('events');
function DEventEmitter() {
    EventEmitter.call(this);
}

require('util').inherits(DEventEmitter, EventEmitter)



const ImgArrayManager = function(imgs) {
    this.imgArray = imgs;
    this.total = imgs.length;
    this.dEmitter = new DEventEmitter();
    this.getCurrentImg = () => {
        return this.imgArray[this.currentIndex++];
    };
    this.dEmitter.on("next", (dirName) => {
        var currentImg = this.getCurrentImg();
        if (currentImg != undefined) {
            startDownload(currentImg.src, dirName).then(this.getHttpReqCallback(currentImg.src, dirName));
        } 
    });
    this.dEmitter.on("over", () => {
        this.resolve();
    });
    this.completedCount = 0;
    this.currentIndex = 0;
    this.get20Img = () => {
        this.currentIndex = 10;
        return this.imgArray.slice(0, 10);
    };
    this.resolve = null;
    this.getHttpReqCallback = (imgSrc, dirName) => {
        var fileName = path.basename(imgSrc);
        return (res) => {
        // console.log('STATUS: ' + res.statusCode);
        // console.log('HEADERS: ' + JSON.stringify(res.headers));
            var contentLength = parseInt(res.headers['content-length']);
            var fileBuff = [];
            res.on('data', (function(fileName) {
                return function (chunk) {
                    var buffer = new Buffer(chunk);
                    fileBuff.push(buffer);
                };
            })(fileName));
            res.on('end', ((fileName, contentLength) => {
                return () => {
                    var totalBuff = Buffer.concat(fileBuff);
                    console.log("bufferLenght = " + totalBuff.length + ", this contentLength = " + contentLength);
                    if (totalBuff.length < contentLength) {
                        console.log(imgSrc + " download error, try again");
                        startDownload(imgSrc, dirName).then(getHttpReqCallback(imgSrc, dirName));
                        return;
                    }
                    fs.appendFile(dirName + "/" + fileName, totalBuff, function(err){});
                    this.completedCount += 1;
                    console.log("(" + this.completedCount + "/" + this.total + ")" + fileName + " download succ!");

                    if (this.completedCount == this.total) {
                        console.log("all task succ!");
                        this.dEmitter.emit("over", dirName);
                        //router.initCb();
                    }
                    this.dEmitter.emit("next", dirName);
                };
            })(fileName, contentLength));
        };
    };
    this.downloadFor20 = (imgSrcArray, dirName) => {
        for (var i = 0; i < imgSrcArray.length; i++) {
            //   var imgSrc = imgSrcArray[i].imrSrc;
            var imgSrc = imgSrcArray[i].src;
            startDownload(imgSrc, dirName).then(this.getHttpReqCallback(imgSrc, dirName));
        }
    }
    this.batchDownload = () => {
        return new Promise((res, rej) =>{
            this.resolve = res;
            this.downloadFor20(this.get20Img(), "./");
        });
    }
};





function ReqHeadersTemp() {
    // this["Referer"] = pageHref;
    this["User-Agent"]= "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.63 Safari/537.31";
    this["Connection"]= "keep-alive";
    this["Accept"]= "*/*";
    this["Accept-Encoding"]= "gzip,deflate,sdch";
    this["Accept-Language"]= "zh-CN,zh;q=0.8";
    this["Accept-Charset"]= "GBK,utf-8;q=0.7,*;q=0.3";
}







function startDownload(imgSrc, dirName) {
    var urlObj = url.parse(imgSrc);
    // var fileName = path.basename(imgSrc);
    var options = {
        host: urlObj.host,
        path: urlObj.path,
        headers: new ReqHeadersTemp()
    };

    // var req = http.request(options, getHttpReqCallback(imgSrc, dirName));
    var req = new Promise((resolve, reject) => {
        var req = http.request(options, resolve);
        req.setTimeout(60 * 1000, function() {
            console.log(imgSrc + 'timeout');
            req.abort();
        });
        req.on('error', function(e) {
            startDownload(imgSrc, dirName).then(getHttpReqCallback(imgSrc, dirName));
        });

        req.end();
    });//.then(getHttpReqCallback(imgSrc, dirName));
    return req;
}






exports.ImgArrayManager = ImgArrayManager;