$(document).ready(function () {
    //from popup to the background
    $("#startBtn").click(function () {
        chrome.runtime.sendMessage('start', function (response) {
            $("#btnStatus").html(response);
            console.log(response);
        });
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {message: "startBtn"}, function (response) {
                console.log(response.result);
            });
        });
    });
    $("#stopBtn").click(function () {
        chrome.runtime.sendMessage('stop', function (response) {
            $("#btnStatus").html(response);
        });
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {message: "stopBtn"}, function (response) {
                console.log(response.result);
            });
        });


    });
});


