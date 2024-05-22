function sleep(ms){
    return new Promise((resolve)=>setTimeout(resolve,ms))
}



async function log_nums(){
    for(var i=0;i<1000;i++){

        await sleep(i);

        console.log(`i is ${i}`)
    }
}

log_nums()


