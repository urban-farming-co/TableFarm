FROM node:4-onbuild
MAINTAINER Karen McCulloch <k.a.z.mcc95@gmail.com>
EXPOSE 8888
RUN apt-get update 
RUN npm install


