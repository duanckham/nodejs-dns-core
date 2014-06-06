#!/bin/sh
var=1
while [ $var -le 10000 ]
do
echo "www.baidu.com A" >> test.list
var=$(($var + 1 ))
done
exit 0