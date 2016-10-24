FROM node:argon
MAINTAINER Karen McCulloch <k.a.z.mcc95@gmail.com>
EXPOSE 4000   
EXPOSE 5432   
# copy the application folder inside the container
RUN mkdir -p /usr/src/app
COPY . /usr/src/app

RUN apt-get update  && apt-get install -yqq \
    wget \
    build-essential \ 
    cmake \ 
    git \
    unzip \ 
    pkg-config 
# RUN apt-get install -yqq --fix-missing  libvtk6-dev 

RUN apt-get install -yqq libgtk2.0-dev
RUN apt-get install -yqq   zlib1g-dev 
RUN apt-get install -yqq python-dev
RUN apt-get install -yqq   python-opencv  
RUN apt-get install -yqq   libopencv-dev  
RUN apt-get install -yqq   libav-tools  
RUN apt-get install -yqq   libjpeg-dev
RUN apt-get install -yqq   libpng-dev  
RUN apt-get install -yqq   libtiff-dev  
RUN apt-get install -yqq   libjasper-dev  
RUN apt-get install -yqq   libgtk2.0-dev  
RUN apt-get install -yqq   python-numpy  
RUN apt-get install -yqq   python-pycurl  
RUN apt-get install -yqq   libatlas-base-dev 
RUN apt-get install -yqq   gfortran
RUN apt-get install -yqq   webp  
RUN apt-get install -yqq   python-opencv 
RUN apt-get install -yqq   qt5-default
# Install open CV2
RUN mkdir -p /opencv && \
cd /opencv  && \ 
wget https://github.com/Itseez/opencv/archive/2.4.13.zip && \
unzip 2.4.13.zip && \
rm 2.4.13.zip && \
mv opencv-2.4.13 OpenCV && \
cd OpenCV && \
mkdir build && \ 
cd build && \
cmake \
-DWITH_QT=ON \ 
-DWITH_OPENGL=ON \ 
-DFORCE_VTK=ON \
-DWITH_TBB=ON \
-DWITH_GDAL=ON \
-DWITH_XINE=ON \
-DBUILD_EXAMPLES=ON .. && \
make -j4 && \
make install && \ 
ldconfig
# Set the work directory
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
