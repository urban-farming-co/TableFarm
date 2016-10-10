FROM node:argon
MAINTAINER Karen McCulloch <k.a.z.mcc95@gmail.com>
EXPOSE 4000   
EXPOSE 5432   
# copy the application folder inside the container
RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app
# install system-wide deps for python
RUN apt-get update 
RUN apt-get -yqq install python python-pip
RUN apt-get -yqq install pkg-config
RUN apt-get -yqq install python-tk python-imaging
RUN apt-get install -y libopenblas-dev liblapack-dev git-core build-essential gfortran libfreetype6-dev libjpeg-dev libhdf5-dev liblzo2-dev libbz2-dev
RUN curl https://bootstrap.pypa.io/get-pip.py | python

RUN apt-get -yqq install python-dev

RUN pip install cython && \
    pip install scipy  && \
    pip install matplotlib && \
    pip install six && \
    pip install numpy && \
    pip install scikit-image  

RUN pip install image \ 
    pillow 
    

# start up the node app.  
RUN npm install
RUN npm test
ENTRYPOINT npm start
