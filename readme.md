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

 1. see help for options `runtime -h`
 2. navigate to your app directory, you wan't to publish. `cd <path to your app>`
 3. follow the following steps
 4. to start things manually run `start <appName>`
 5. to stop  things manually run `stop  <appName>` or do `forever list` and then `forever stop <nr>`

### init (generates configuration files)

with init you can generate the configuration files for `nginx` and `upstart`.

the configuration folder `.runtime` is being created with the needed files.

the configuration itself is stored in the `.runtime/configuration.json` file.

if needed, you can modify the files manually, before running `runtime add`.


```bash
# simple node example
runtime init -n mynodeapp -d "mynodeapp.com www.mynodeapp.com" -p 3007 -x app.js

# another node example
runtime init -c node -n myapp -d "myapp.com www.myapp.com" -o "[ --myappPort 8080 --myappHost localhost ]" -p 8080  -e DEBUG=* -e NODE_ENV=production -x app.js

# http-server example
runtime init -n mycms -d "mycms.com www.mycms.com" -p 3008 -c http-server -o "[-i -p 3008]"

```

### add

adds and activates the previously stored configuration files for `nginx` and `upstart`.

```bash
runtime add
```

### remove

if you wan't to remove your app, you can do it of course with this command.

```bash
runtime remove
# or with specific appName
runtime remove -n myapp
```

### list

prints out all the active configurations (added with runtime).

```bash
runtime list
```


## license
MIT

