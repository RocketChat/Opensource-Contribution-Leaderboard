#/bin/bash

for((i=1;i<100000000;i++))
do
    curl https://gsoc.lolimay.cn/
    curl https://gsoc.lolimay.cn/api/log
    curl https://gsoc.lolimay.cn/api/config
    curl https://gsoc.lolimay.cn/api/data
    curl https://gsoc.lolimay.cn/vendor.8026c864f07341ef3d54.js
    curl https://gsoc.lolimay.cn/vendor.8026c864f07341ef3d54.js
    curl https://gsoc.lolimay.cn/admin/
    sleep 0.1
    echo -e "\033[33m${i}\n\033[0m"
done