#run-time

### what it does
the intent of this module is to automate, or speed up the deployment of your website or web application.

 - it creates configuration files for `nginx` and `upstart`, using `forever`, to make sure your app get's started when your server starts, and keeps running even after a crash of your app'.

### what it does NOT
it does not help you with placing the files on your host. this is up to you. use `sftp` `shipit`, `git` or what ever suits you best.

## install
```bash
# install globally
npm install run-time -g
```

## help
```bash
runtime -h
```

## usage

 1.  see help for options `runtime -h`
 2. navigate to your app directory, you wan't to publish. `cd <path to your app>`


### init (generates configuration files)

with init you can generate the configuration files for `nginx` and `upstart`.

the configuration folder `.runtime` is being created with the needed files.

if needed, you can modify the files manually, before running `runtime add`.


```bash
# node example
runtime init -c node -x app.js -o "[ --myappPort 8080 --myappHost localhost ]" -p 8080 -n myapp -d "myapp.com www.myapp.com" -e DEBUG=* -e NODE_ENV=production

# http-server example
runtime init -c http-server -o "[ -h robot ]" -p 80 -i 8080 -n myapp -d "myapp.com www.myapp.com"

```

### add

adds and activates the stored configuration files for `nginx` and `upstart`.

```bash
runtime add
```

### remove

if you wan't to remove your app, you can do it of course.


```bash
runtime remove -n myapp
```

## license
MIT

