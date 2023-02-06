/**
 * Created by Administrator on 2016/9/21.
 */
const MongoClient = require('mongodb').MongoClient;

export function connect(url: string,database: string) {
    return new Promise(function (resolve, reject) {
        MongoClient.connect(url,function (err: any,db: any) {
            if (err) {
                console.error("connect to mongo error,"+err.message);
                reject(err)
            } else {
                console.log("connect to mongo success,");
                let mongodb = db.db(database);
                resolve(mongodb)
            }
        })
    })
}