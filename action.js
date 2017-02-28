/**
 * Created by yuanxiaomei on 2017/2/19.
 * this is the content_script
 */
var payEndStatus;
var requestCode;
var postCode;

$(document).ready(function () {
    //初始化
    payEndStatus = "";
    requestCode = 1;
    var initCode;
    var emailAccount;
    var amountPay;
    var currency;
    //是否在第一个页面检查

    //监听popup message
    chrome.extension.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.message == "startBtn") {
                sendResponse({result: "started"});
                localStorage.flag = 0;
                localStorage.paidAccounts = 0;
                localStorage.initCode = 0;
            } else if (request.message == "stopBtn") {
                sendResponse({result: "stopped"});
                localStorage.flag = 1;
                console.log("stop");
                return;
            } else {
                sendResponse({result: "invalid request"});
            }
        });
    //检查付款一页面
    var firPageFea = $(".optional").html();
    if (firPageFea != undefined) {
        initCode = Number(localStorage.initCode);
        if (initCode == 0) {
            console.log("请求");
            requestCode = 0;
            localStorage.initCode = 1;
        }
    }
    //监听background
    var port = chrome.runtime.connect({name: "mycontentscript"});
    port.onMessage.addListener(function (message, sender) {
        if (message.greeting === "hello") {
            if (requestCode == 0) {
                port.postMessage({status: "success"});
            }

        } else if (message.code == 200) {
            port.postMessage({getJSONStatus:"success"});
            var dataObj=message;
            console.log(message);
            localStorage.dataObj=JSON.stringify(dataObj);
            currency=dataObj.data[0].currency;
            emailAccount=dataObj.data[0].mail;
            amountPay=Number(dataObj.data[0].amount);
            localStorage.billState="lock";
            setTimeout(firClick(currency, emailAccount, amountPay), 3000);
            console.log("start");
        }

    });

    //开始结束按钮动作标记检查
    var flag = localStorage.flag;
    if (flag == "0") {
        console.log("run");
        setInterval(firTurnCheck(), 3000);
        setInterval(secTurnCheck(),3000);
    } else if (flag == "1") {
        console.log("stop");
        return;
    }
    //订单结束标记检查
    var tradeId = $("#mer-txn-id").html();
    if (tradeId != undefined) {
        payEndInfoGet();
        localStorage.initCode = 0;
        var paidNumbers = Number(localStorage.paidAccounts) + 1;
        localStorage.paidAccounts = paidNumbers;
        console.log( tradeId, paidNumbers);
    }
});

function firClick(currency, emailAccount, amountReceiver) {
    $("#amount_ccode").val(currency);
    $("#email").focus();
    $("#email").val(emailAccount);
    $("#amount").focus();
    $("#amount").val(amountReceiver);
   /* $("#submit").click();*/
}
function getFocus() {
    $("#email").blur();
    $("#email").focus();
}
function firTurnCheck() {
    var checkStatus = $("#box h3").html();
    //特征点匹配
    if (checkStatus == "Review your payment and send") {
        var intervalID = setInterval(firTurnCheck, 3000);
        clearInterval(intervalID);
        var dataObj=JSON.parse(localStorage.dataObj);
        var msgSub=dataObj.data[0].title;
        var msg=dataObj.data[0].message;
        setTimeout(secClick(msgSub,msg), 1000);
    }
}
function secClick(msgSubject,msg) {
    var registerSta = registerCheck();
    if (registerSta == "register_done") {
        $("#change-shipping-address").click();
        $("#adr-none").attr("checked", "checked");
        $("#subject").val(msgSubject);
        $("#note").val(msg);
        $("#submit-button-01").click();
    } else if (registerSta == "register_never") {
        var regStatus=$(".reputation").html();
        var reJson=returnDataGenerate("lock",regStatus,"null");
        localStorage.reJSON=JSON.stringify(reJson);
        console.log(registerSta);
        turnToPayPage();
        localStorage.initCode = 0;
    }
}
//注册检查
function registerCheck() {
    var regStatus = $(".reputation").html();
    if (regStatus == "") {
        var registerStatus = "register_done";
        return registerStatus;
    } else {
        registerStatus = "register_never";
        return registerStatus ;
    }

}
function secTurnCheck() {
    var payStatus = $("#headline h2").html();
    if (payStatus == "The money has been sent!") {
        var intervalID = setInterval(secTurnCheck, 3000);
        clearInterval(intervalID);
        payEndCheck();
        localStorage.billState="finish"
    }
}
function payEndCheck() {
    var checkLink = $(".layout1 p a").attr("href");
    window.location.href = checkLink;
}
function payEndInfoGet() {
    var tradeNumber = $("#mer-txn-id").html();
    var payEndStatus = $(".mer-status-class").html();
    var billState=localStorage.billState;
    localStorage.reJSON=JSON.stringify(returnDataGenerate(billState,payEndStatus,tradeNumber));
    chrome.runtime.sendMessage(localStorage.reJSON, function(response) {
        console.log(response);
    });
    turnToPayPage();
}
function turnToPayPage() {
    var payBtn = document.getElementsByClassName("scTrack:SRD:Nav:3F");
    var payLink = $(payBtn).attr("href");
    window.location.href = payLink;
}
function returnDataGenerate(billStatus,reMsg,reBillCode) {
    var billInfo=JSON.parse(localStorage.dataObj);
    var returnObj = {"data": []};
    var record = {
        "billCode":billInfo.data[0].billCode,
        "mail":billInfo.data[0].mail ,
        "currency": billInfo.data[0].currency,
        "amount":Number(billInfo.data[0].amount) ,
        "state": billStatus,
        "return_message": reMsg,
        "return_billCode": reBillCode
    };
    returnObj.data.push(record);
    return returnObj;
}