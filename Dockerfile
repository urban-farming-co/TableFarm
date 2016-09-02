FROM node:4-onbuild
MAINTAINER Karen McCulloch <k.a.z.mcc95@gmail.com>
EXPOSE 4000   
RUN apt-get update 
RUN npm install
CMD npm start

