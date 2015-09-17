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

the subcommands contain help too. here you have got the complete help:

```bash
runtime help

  Usage: runtime [options] [command]


  Commands:

    init        initialize configuration files for this web application
    add         add the new configuration to the host
    remove      remove the configuration from the host
    list        list the active configurations
    help [cmd]  display help for [cmd]

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

```bash
runtime help init

  Usage: runtime-init [options]

  Options:

    -h, --help                           output usage information
    -c, --command [value]                command
    -x, --exec [value]                   file to execute
    -o, --command-options [value]        command options
    -e, --environment-variables [value]  set environment variable
    -l, --host-name [value]              host (webserver) name
    -h, --host-port <n>                  host (webserver) port
    -p, --app-port <n>                   internal web application port
    -n, --app-name [value]               web application name
    -d, --domain-name [value]            domain name
    -s, --ssl [value]                    Enable https
```

```bash
runtime help add

  Usage: runtime-add [options]

  Options:

    -h, --help  output usage information

```

```bash
runtime help remove

  Usage: runtime-remove [options]

  Options:

    -h, --help              output usage information
    -n, --app-name [value]  web application name
```



## usage

 1. see help for options `runtime -h`
 2. navigate to your app directory, you wan't to publish. `cd <path to your app>`
 3. follow the following steps
    - run `runtime init <with parameters>` to generate the configuration files
    - run `runtime add` to add the newly created configuration and start the application
    - check the runtime configurations with `runtime list`
    - check the running apps with `forever list`
    - if something goes wront check the logfile listed with `forever list`
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

