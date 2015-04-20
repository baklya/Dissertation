#!/bin/bash

#g++ -fpermissive -o oreader Otf2Importer.cpp -lotf2 -lrt -lm

#g++ boost.cpp -pthread -lmongoclient -lboost_thread -lboost_system -lboost_filesystem -lboost_regex -o tutorial






g++ -fpermissive `/opt/otf2/bin/otf2-config --cppflags` -c Otf2Importer.cpp -o Otf2Importer.o
g++ Otf2Importer.o `/opt/otf2/bin/otf2-config --ldflags` `/opt/otf2/bin/otf2-config --libs` -pthread -lmongoclient -lboost_thread -lboost_system -lboost_filesystem -lboost_regex -o Otf2Importer
rm Otf2Importer.o


g++ -g -fpermissive `/opt/otf2/bin/otf2-config --cppflags` -c Otf2Importer.cpp -o Otf2Importer-debug.o
g++ Otf2Importer-debug.o `/opt/otf2/bin/otf2-config --ldflags` `/opt/otf2/bin/otf2-config --libs` -pthread -lmongoclient -lboost_thread -lboost_system -lboost_filesystem -lboost_regex -o Otf2Importer-debug
rm Otf2Importer-debug.o

