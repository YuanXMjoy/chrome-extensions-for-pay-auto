/**
 * Created by yuanxiaomei on 2017/2/19.
 */

(function () {
    var body = {
        "data": [
            {
                "billCode": "DollarGeneral_PFBt82XDUT1487724836",
                "mail": "adrianaborges123@hotmail.com",
                "currency": "USD",
                "amount": 1,
                "state": "finish",
                "return_message": "completed",
                "return_billCode": "123123"
            }
        ]
    };
    httpRequestPOST(body, "http://ec2-54-235-237-146.compute-1.amazonaws.com:8010/sendcard/paypal_order_notify/", function (res2) {
        console.log(res2);
    });

    //from popup to the background
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message == 'start') {
            sendResponse('已开始');
        } else if (message == 'stop') {
            sendResponse('已结束');
        } else {
            sendResponse('get the json');
            console.log("the json" + message);
            //调用post
        }
    });
    //from background to the action
    chrome.runtime.onConnect.addListener(function (port) {
        port.postMessage({greeting: "hello"});
        port.onMessage.addListener(function (msg) {
            if (msg.status == "success") {
                httpRequestGET("http://ec2-54-235-237-146.compute-1.amazonaws.com:8010/sendcard/paypal_send_pull/" + '?' + Math.random(), function (res) {
                    var dataGet = JSON.parse(res);
                    console.log(dataGet);
                    port.postMessage(dataGet);
                });
            } else if (msg.getJSONStatus == "success") {
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
    xhr.send(JSON.stringify(body));
}
