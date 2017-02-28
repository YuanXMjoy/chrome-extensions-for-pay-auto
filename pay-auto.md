pay-auto
===
###解决问题：
手动发单耗费人力时力，利用chrome 扩展的权限可以向页面中注入脚本，控制对方页面的dom，进行一定的操作.
###实现难点
在popup,background,content script 三者之间的message passing,由于扩展不受跨域限制，可以直接向后台请求订单，但是要注意协议不同造成的mix content
