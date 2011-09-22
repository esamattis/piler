#!/bin/bash -e

wget http://ubuntu.ipacct.com/ubuntu//pool/main/libj/libjpeg8/libjpeg8_8b-1_i386.deb
wget http://se.archive.ubuntu.com/ubuntu/pool/main/libj/libjpeg8/libjpeg8-dev_8b-1_i386.deb

sudo apt-get remove -y libjpeg62-dev libjpeg62

sudo dpkg -i libjpeg8_8b-1_i386.deb
sudo dpkg -i libjpeg8-dev_8b-1_i386.deb

sudo apt-get install -y libcairo2 libcairo2-dev libc-dev


npm install --dev

