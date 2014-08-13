じーっ
====

**じーっ** is a simple file sharing web server. It is written in Node.js and uses MongoDB's GridFS for storing files. This was initially a two-hour project meant to explore the hapi.js framework and documentation.

### Install

じーっ consists of an api server and a web server. The following instructions will install both on a shared machine. However, it is possible to install each server on different matchines.

```
$ git clone https://github.com/oohnoitz/jii.git
$ cd jii
$ npm install
```

### Configure

You will need to copy the example config.json file and modify it with your own settings.

```
$ cp config.js.example config.js
```
Note: You will also need to modify the `node_modules/jii-web/lib/static/assets/js/main.js` file and point it to the api server. This issue will be addressed in the future.

### Running

To start the servers, run the following command:

```
$ node index.js
```
