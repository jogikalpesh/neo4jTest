#!/usr/bin/env node

var neo4j = require('neo4j-driver')
var chalk = require('chalk')
function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function checkConnLife(NEO4J_URI, NEO4J_USER, NEO4J_PASS, connIdleTime) {
    var idlePass = false
    try {
        with (driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASS), {
            maxConnectionPoolSize: 1,
            logging: {
                level: 'debug',
                logger: (level, message) => {
                    console[level].call(console, `${level.toUpperCase()} ${(new Date()).toISOString()} ${message}`)
                }
            }
         
        })) {
            with (session = driver.session({ database: 'neo4j', defaultAccessMode: neo4j.session.READ })) {
                with (txc = session.beginTransaction()) {
                    txc.run("RETURN 1 AS n")
                    if (connIdleTime > 120) {
                        let sleepMinsLeft = connIdleTime / 60
                        let sleepSecondsLeft = connIdleTime % 60
                        console.log(chalk.yellow(new Date().toISOString() +' Initial connection Successful. Sleeping for ' + sleepMinsLeft + ' minutes ...'))
                        while (sleepMinsLeft > 0) {
                            await sleep(60)
                            sleepMinsLeft -= 1
                            if (sleepMinsLeft > 0)
                                console.log(new Date().toISOString() + 'Still running. Sleeping for ' + sleepMinsLeft + ' more minute(s) ...')
                        }
                        await sleep(sleepSecondsLeft)
                    }
                    else {
                        console.log(chalk.yellow('Initial connection Successful. Sleeping for ' + connIdleTime + ' seconds ...'))
                        await sleep(connIdleTime)
                    }
                    console.log(chalk.yellow(new Date().toISOString() +' Awake now. Checking the connection ...'))
                    txc.run("RETURN 1 AS n")
                    console.log(new Date().toISOString() +" connection is active")
                    idlePass = true
                }
            }
        }
    }
    catch (e) {
        console.log(e)
        console.log(chalk.yellow('Session Expired for connection with idle time of ' + connIdleTime + ' seconds '));
        idlePass = false
    }
    finally {
        //console.log("done")
        //driver.close()
    }
    return idlePass
}

async function main() {

    let workingVal = 0
    let idlesToCheck = [300,600]

    let NEO4J_URI = ''
    let NEO4J_USER = ''
    let NEO4J_PASS = ''

    
    NEO4J_URI = NEO4J_URI.replace("neo4j+s://", '').replace(":7687", '').replace("neo4j+ssc://", '')
    AURA_DBID = NEO4J_URI.split('.')[0]
    NEO4J_URI = 'neo4j://' + NEO4J_URI + ':7687'

    

    //await checkConnLife(NEO4J_URI, NEO4J_USER, NEO4J_PASS, 30)

    for (var index in idlesToCheck) {
        connIdleTime = idlesToCheck[index]
        console.log(chalk.yellow('\x1b[1m','Checking connection lifetime of ' + connIdleTime + ' seconds'))
        connectSuccess = await checkConnLife(NEO4J_URI, NEO4J_USER, NEO4J_PASS, connIdleTime)
        if (connectSuccess) {
            console.log(chalk.yellow('The connection was valid after ' + connIdleTime + ' seconds of idle time...'))
            workingVal = Math.max(workingVal, connIdleTime)
        }
        else {
            console.log(chalk.yellow('The connection FAILED after ' + connIdleTime + ' seconds of idle time...'))
            break
        }
        await sleep(2)
    }
}



main()
