#/bin/bash

passwd=`cat config.txt`

for((i=1;i<100000000;i++))
do
curl -H "Content-type:application/json" \
      https://gsoc.lolimay.cn/api/login \
      -d '{ token": "gsoc2019" }'
    sleep 1
    echo -e "\033[33m${i}\n\033[0m"
done