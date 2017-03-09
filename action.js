/**
 * Created by yuanxiaomei on 2017/2/19.
 * this is the content_script
 */
var payEndStatus;
var requestCode;
var saveCode;

$(document).ready(function () {
    saveCode = 1;
    console.log("in");
    //初始化
    payEndStatus = "";
    requestCode = 1;
    var initCodeGet;
    var emailAccount;
    var amountPay;
    var currency;
    //是否在第一个页面检查
    //监听popup message
    chrome.extension.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.message == "startBtn") {
                chrome.storage.local.clear();
                sendResponse({result: "started"});
                //flag判断用户是否点击了start或者stop
                //initCode是否请求了的标识符，initCode=0是可以看开始请求
                chrome.storage.local.set({flag: 0, initCode: 0}, function () {
                    console.log("开始，准备数据初始化");
                    saveCode = 1;
                });


            } else if (request.message == "stopBtn") {
                sendResponse({result: "stopped"});
                chrome.storage.local.set({flag: 1}, function () {
                    console.log("停止")
                });
                return;
            } else {
                sendResponse({result: "invalid request"});
            }
        });
    //检查付款一页面
    var firPageFea = $(".optional").html();
    if (firPageFea != undefined) {
        chrome.storage.local.get("initCode", function (value) {
            if (value.initCode != undefined) {
                initCodeGet = value.initCode;
                //检查是否是初始化状态
                if (initCodeGet == 0) {
                    console.log("向服务器请求数据");
                    //requestCode是向服务器的标识符，0代表可以请求
                    requestCode = 0;
                    chrome.storage.local.set({initCode: 1}, function () {
                        console.log("初始化已完成");
                    });
                }
            }
        });
    }
    //监听background
    var port = chrome.runtime.connect({name: "mycontentscript"});
    port.onMessage.addListener(function (message, sender) {
        if (message.greeting === "hello") {
            if (requestCode == 0) {
                //success信息让background向服务器请求
                port.postMessage({status: "success"});
            }

        } else if (message.code == 200) {
            //告诉BACKGROUN我已经成功请求到了数据
            port.postMessage({status: "successJSON"});
            var dataObj = message;
            if (message.data.length == 0) {
                alert("数据已经发完,请你关掉插件，停止开发者模式，否则会有危险！！！");
                return;
            }
            console.log(message);
            //这里的写法再确定一下
            chrome.storage.local.set({dataGet: JSON.stringify(dataObj)}, function () {
                console.log("请求数据收到");
            });

            currency = dataObj.data[0].currency;
            emailAccount = dataObj.data[0].mail;
            amountPay = Number(dataObj.data[0].amount);
            chrome.storage.local.set({billState: "lock"}, function () {
                console.log("状态lock");
            });
            setTimeout(firClick(currency, emailAccount, amountPay), 3000);
            console.log("start");
        }

    });

    //开始结束按钮动作标记检查

    chrome.storage.local.get("flag", function (res2) {
        var actStatus = res2.flag;
        if (actStatus == 0) {
            console.log("run");
            setInterval(firTurnCheck(), 3000);
            setInterval(secTurnCheck(), 3000);
        } else if (actStatus == 1) {
            console.log("stop");
            return;
        }

    });

    //订单结束标记检查
    var tradeId = $("#mer-txn-id").html();
    console.log(tradeId);
    var timer = setInterval(function () {
        if (tradeId != undefined) {
            clearInterval(timer);
            payEndInfoGet();
            chrome.storage.local.set({initCode: 0}, function () {
                console.log("初始化");
            });
        }
    }, 2000);

    var homeFlag = $("#js_engagementActionTrigger").html();
    if (homeFlag != undefined) {
        turnToPayPage();
    }

});

//第一个页面的模拟点击
function firClick(currency, emailAccount, amountReceiver) {
    $("#amount_ccode").val(currency);
    $("#email").focus();
    $("#email").val(emailAccount);
    $("#amount").focus();
    $("#amount").val(amountReceiver);
    $("#submit").click();
}
function getFocus() {
    $("#email").blur();
    $("#email").focus();
}

function firTurnCheck() {
    var msgBox = $("#messageBox div:first p").html();
    if (msgBox == "This recipient is currently unable to receive money.") {
        saveCode = 1;
        returnDataGenerate("lock", "This recipient is currently unable to receive money.", "null");
        var timer = setInterval(function () {
            if (saveCode == 0) {
                clearInterval(timer);
                rejectError();
            }
        }, 1000);
    } else {
        var checkStatus = $("#box h3").html();
        //特征点匹配
        if (checkStatus == "Review your payment and send") {
            var intervalID = setInterval(firTurnCheck, 3000);
            clearInterval(intervalID);
            chrome.storage.local.get("dataGet", function (res) {
                var dataObj = JSON.parse(res.dataGet);
                var msgSub = dataObj.data[0].title;
                var msg = dataObj.data[0].message;
                setTimeout(secClick(msgSub, msg), 1000);
            });
        }

    }

}
function rejectError() {
    chrome.storage.local.get("dataRE", function (res4) {
        var obj4 = res4.dataRE;
        console.log(obj4);
        chrome.runtime.sendMessage(obj4, function (response) {
            console.log(response);
        });
    });

}
function secClick(msgSubject, msg) {
    var registerSta = registerCheck();
    if (registerSta == "register_done") {
        $("#change-shipping-address").click();
        $("#adr-none").attr("checked", "checked");
        $("#subject").val(msgSubject);
        $("#note").val(msg);
        $("#submit-button-01").click();
    } else if (registerSta == "register_never") {
        var regStatus = $(".reputation").html();
        saveCode = 1;
        returnDataGenerate("lock", regStatus, "null");
        var timerRig = setInterval(function () {
            if (saveCode == 0) {
                clearInterval(timerRig);
                chrome.storage.local.get("dataRE", function (res6) {
                    var obj6 = res6.dataRE;
                    chrome.runtime.sendMessage(obj6, function (response) {
                        console.log(response);
                    });
                });
            }

        }, 1000);

        console.log(registerSta);
        chrome.storage.local.set({initCode: 0}, function () {
            console.log("初始化");
            turnToHome();
        });
    }
}
//注册检查
function registerCheck() {
    var regStatus = $(".reputation").html();
    if (regStatus == "This recipient is not yet registered. PayPal will send an email to the recipient explaining how to complete your transaction.") {
        registerStatus = "register_never";
        return registerStatus;
    } else {
        var registerStatus = "register_done";
        return registerStatus;
    }

}
function secTurnCheck() {
    var payStatus = $("#headline h2").html();
    if (payStatus == "The money has been sent!") {
        var intervalID = setInterval(secTurnCheck, 3000);
        clearInterval(intervalID);
        payEndCheck();
        chrome.storage.local.set({billState: "finish"}, function () {
            console.log("当前状态finish");
        });
    }
}
function payEndCheck() {
    var checkLink = $(".layout1 p a").attr("href");
    window.location.href = checkLink;
}
function payEndInfoGet() {
    var tradeNumber = $("#mer-txn-id").html();
    var payEndStatus = $(".mer-status-class").html();
    chrome.storage.local.get("billState", function (res3) {
        var billStatus = res3.billState;
        console.log(tradeNumber, payEndStatus, billStatus);
        saveCode = 1;
        returnDataGenerate(billStatus, payEndStatus, tradeNumber);
        var timerend = setInterval(function () {
            if (saveCode == 0) {
                clearInterval(timerend);
                chrome.storage.local.get("dataRE", function (res5) {
                    var obj5 = res5.dataRE;
                    chrome.runtime.sendMessage(obj5, function (response) {
                        console.log(response);
                        turnToHome();
                    });
                });
            }

        }, 1000);

    });


}
function turnToHome() {
    var link = $("#navMenu ul:first li:first a").attr('href');
    window.location.href = link;
}

function turnToPayPage() {
    var payLink = $("#js_engagementActions li:first a").attr("href");
    window.location.href = payLink;
}
function returnDataGenerate(billStatus, reMsg, reBillCode) {
    chrome.storage.local.get("dataGet", function (result) {
        console.log("最终订单已经拿到");
        var billInfo = JSON.parse(result.dataGet);
        var returnObj = {"data": []};
        var record = {
            "billCode": billInfo.data[0].billCode,
            "mail": billInfo.data[0].mail,
            "currency": billInfo.data[0].currency,
            "amount": Number(billInfo.data[0].amount),
            "state": billStatus,
            "return_message": reMsg,
            "return_billCode": reBillCode
        };
        returnObj.data.push(record);
        chrome.storage.local.set({dataRE: JSON.stringify(returnObj)}, function () {
            console.log("返回订单已经存入");
            saveCode = 0;
        });
    });
}