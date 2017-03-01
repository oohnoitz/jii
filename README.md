じーっ
====

**じーっ** is a file hosting server written in Node.js.

### Install

```
$ git clone https://github.com/oohnoitz/jii.git
$ cd jii
$ npm install
```

### Configure

You will need to copy one of the example config.json files and modify it with your own settings.

**GridFS (with MongoDB)**

```
$ cp config.js.example.gridfs config.js
```

**DiskFS (with Postgres and File System)**

```
$ cp config.js.example.diskfs config.js
```

### Running

To start the servers, run the following command:

```
$ npm run build
$ npm start
```
