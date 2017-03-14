/**
 * Created by yuanxiaomei on 2017/2/19.
 */

(function () {

    //from popup to the background
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message == 'start') {
            sendResponse('已开始');
        } else if (message == 'stop') {
            sendResponse('已结束');
        }else if(message.result=='started'||message.result=='stopped'||message.result=='invalid request'){

        }else if(message.status=='success'||message.status=='successJSON'){

        }else {
            sendResponse('get the json');
            console.log("the json send " + message);
            //调用
            httpRequestPOST(message, "http://ec2-52-91-89-74.compute-1.amazonaws.com:8010/sendcard/paypal_order_notify/", function (res2) {
                console.log(res2);
            });
        }
    });
    //from background to the action
    chrome.runtime.onConnect.addListener(function (port) {
        port.postMessage({greeting: "hello"});
        port.onMessage.addListener(function (msg) {
            if (msg.status == "success") {
                httpRequestGET("http://ec2-52-91-89-74.compute-1.amazonaws.com:8010/sendcard/paypal_send_pull/" + '?' + Math.random(), function (res) {
                    var dataGet = JSON.parse(res);
                    console.log(dataGet);
                    port.postMessage(dataGet);
                });
            } else if (msg.status == "successJSON") {
                port.postMessage({status: "ready to post"});


            }
        });

    });
})();

function httpRequestGET(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            callback(xhr.responseText);
        }
    };
    xhr.send();
}
function httpRequestPOST(body, url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('paypal', 'paypal.com');
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            callback(xhr.responseText);
        }
    };
    xhr.send(body);
}
