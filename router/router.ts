
export const router = require('koa-router')();

// 密码验证中间件
const passwordAuthMiddleware = async (ctx: any, next: any) => {
    const password = ctx.headers['x-password'];
    const correctPassword = '150690'; // 将 "your_password" 替换为实际的密码
  
    if (password === correctPassword) {
      await next(); // 密码验证通过，继续执行下一个中间件或路由处理程序
    } else {
      ctx.status = 401; // 密码验证失败，返回 401 Unauthorized 状态码
      ctx.body = '密码错误';
    }
  };


router.get('/profit',passwordAuthMiddleware, async (ctx: any)=>{
    let result = await global.mongodb.collection('account').aggregate( [
        // Stage 1: Filter pizza order documents by pizza size
        {
            $match: {createtime:{$gte:new Date(Date.now() - 3600000)}}
         },
         {
             $sort: { createtime: -1 }
         },
         // Stage 2: Group remaining documents by pizza name and calculate total quantity
         {
            $group: { _id: "$servicename", profit:{$first: "$profit"}, bidPercent: {$first:"$bidPercent"}, askPercent: {$first:"$askPercent"},
            bidValue:{$first:"$bidValue"},askValue:{$first:"$askValue"},maxProfit:{$first:"$maxProfit"},maxDrawdown:{$first:"$maxDrawdown"},leverage:{$first:"$leverage"},createtime:{$first: "$createtime"},position: {$first: "$position"},
            sumObject:{$first:"$sumObject"}, account: {$first: "$account"}, owner: {$first: "$owner"}}
         },
         {
             $addFields: {
                 drawdown: { $subtract: ["$maxProfit","$profit"]}
             }
         },
         {
             $project: {
                 profit:"$profit",drawdown: "$drawdown",bidPercent:"$bidPercent",askPercent:"$askPercent",bidValue:"$bidValue",askValue:"$askValue",maxProfit:"$maxProfit",maxDrawdown:"$maxDrawdown",
                 leverage:"$leverage",createtime:"$createtime",position:"$position",sumObject:"$sumObject",account:"$account", owner: "$owner"
             }
         },
         {
             $sort: { profit: -1}
         }
     ] ).toArray()
     let profit: any = {
         seatnumber: 0
     }
     let bidPercent: any = {
         seatnumber: 0
     }
     let askPercent: any = {
         seatnumber: 0
     }

     let seatnumberAccount = getSeatnumberAccount(result)
     for(let i = 0;i<result.length;i++) {
        let account = result[i]
        profit[account._id] = account.profit
        bidPercent[account._id] = account.bidPercent
        askPercent[account._id] = account.askPercent
     }
     profit.seatnumber = seatnumberAccount.profit
     bidPercent.seatnumber = seatnumberAccount.bidPercent
     askPercent.seatnumber = seatnumberAccount.askPercent

     ctx.response.type = 'json'
     ctx.body = {
         code: 10000,
         profit: profit,
         bidPercent: bidPercent,
         askPercent: askPercent,
         updatetime: new Date()
     }
})

router.get('/accountList',passwordAuthMiddleware, async (ctx: any)=>{
    try {
        let result = await global.mongodb.collection('account').aggregate( [
            {
                $match: {createtime:{$gte:new Date(Date.now() - 3600000)}}
             },
             {
                 $sort: { createtime: -1 }
             },
             // Stage 2: Group remaining documents by pizza name and calculate total quantity
             {
                $group: { _id: "$servicename", profit:{$first: "$profit"}, bidPercent: {$first:"$bidPercent"}, askPercent: {$first:"$askPercent"},
                bidValue:{$first:"$bidValue"},askValue:{$first:"$askValue"},maxProfit:{$first:"$maxProfit"},maxDrawdown:{$first:"$maxDrawdown"},leverage:{$first:"$leverage"},createtime:{$first: "$createtime"},position: {$first: "$position"},
                sumObject:{$first:"$sumObject"}, account: {$first: "$account"}, owner: {$first: "$owner"}}
             },
             {
                 $addFields: {
                     drawdown: { $subtract: ["$maxProfit","$profit"]}
                 }
             },
             {
                 $project: {
                     profit:"$profit",drawdown: "$drawdown",bidPercent:"$bidPercent",askPercent:"$askPercent",bidValue:"$bidValue",askValue:"$askValue",maxProfit:"$maxProfit",maxDrawdown:"$maxDrawdown",
                     leverage:"$leverage",createtime:"$createtime",position:"$position",sumObject:"$sumObject",account:"$account", owner: "$owner"
                 }
             },
             {
                 $sort: { profit: -1}
             }
         ] ).toArray()
         let accountList = []
         
         for(let i = 0; i < result.length; i++) {
             let resultItem = result[i]
             let account = {
                 servicename: resultItem._id,
                 profit: resultItem.profit,
                 bidPercent: resultItem.bidPercent,
                 askPercent: resultItem.askPercent,
                 bidValue: resultItem.bidValue,
                 askValue: resultItem.askValue,
                 leverage: resultItem.leverage,
                 holdPnl: 0,
                 balance: 0,
                 drawdown: resultItem.drawdown
             }
             for(let key in resultItem.account) {
                 if(key != 'BNB') {
                     account['balance'] += resultItem.account[key].marginBalance
                 }
             }
             for(let item of resultItem.position) {
                account.holdPnl += item.profit
             }
             accountList.push(account)
         }
    
         let seatnumberAccount = getSeatnumberAccount(result)
         delete seatnumberAccount.position
         accountList.splice(0, 0, seatnumberAccount)
    
         ctx.response.type = 'json'
         ctx.body = {
             code: 10000,
             result: accountList,
             updatetime: new Date()
         }
    } catch(err: any) {
        console.log('err: ',err)
    }
    
})

router.get('/accountDetail',passwordAuthMiddleware,  async (ctx: any)=>{
    let { servicename } = ctx.query
    let matchContent: any
    if(servicename != 'seatnumber') {
        matchContent = {createtime:{$gte:new Date(Date.now() - 3600000)},servicename: servicename}
    } else {
        matchContent = {createtime:{$gte:new Date(Date.now() - 3600000)}}
    }
    let result = await global.mongodb.collection('account').aggregate( [
        {
            $match: matchContent
         },
         {
             $sort: { createtime: -1 }
         },
         // Stage 2: Group remaining documents by pizza name and calculate total quantity
         {
            $group: { _id: "$servicename", profit:{$first: "$profit"}, bidPercent: {$first:"$bidPercent"}, askPercent: {$first:"$askPercent"},
            bidValue:{$first:"$bidValue"},askValue:{$first:"$askValue"},maxProfit:{$first:"$maxProfit"},maxDrawdown:{$first:"$maxDrawdown"},leverage:{$first:"$leverage"},createtime:{$first: "$createtime"},position: {$first: "$position"},
            sumObject:{$first:"$sumObject"}, account: {$first: "$account"}, owner: {$first: "$owner"}}
         },
         {
             $addFields: {
                 drawdown: { $subtract: ["$maxProfit","$profit"]}
             }
         },
         {
             $project: {
                 servicename:"$_id",profit:"$profit",drawdown: "$drawdown",bidPercent:"$bidPercent",askPercent:"$askPercent",bidValue:"$bidValue",askValue:"$askValue",maxProfit:"$maxProfit",maxDrawdown:"$maxDrawdown",
                 leverage:"$leverage",createtime:"$createtime",position:"$position",sumObject:"$sumObject",account:"$account", owner: "$owner"
             }
         },
         {
             $sort: { profit: -1}
         }
     ] ).toArray()
     if(servicename != 'seatnumber') {
        result[0].position.sort(function(a: any,b: any) {
            if(a.maxBaseSize) {
                return Math.abs(a.maxBaseSize) > Math.abs(b.maxBaseSize)? -1 : 1
            } else {
                return Math.abs(a.baseSize) > Math.abs(b.baseSize)? -1 : 1
            }
        })
        for(let i = 0; i < result.length; i++) {
            let resultItem = result[i]
            resultItem.balance = 0
            for(let key in resultItem.account) {
                if(key != 'BNB') {
                    resultItem['balance'] += resultItem.account[key].marginBalance
                }
            }
        }
        ctx.body = {
            code: 10000,
            result: result,
            updatetime: new Date()
        }
     } else {
         let seatnumberAccount = getSeatnumberAccount(result)
         seatnumberAccount.position.sort(function(a: any,b: any) {
            if(a.maxBaseSize) {
                return Math.abs(a.maxBaseSize) > Math.abs(b.maxBaseSize)? -1 : 1
            } else {
                return Math.abs(a.baseSize) > Math.abs(b.baseSize)? -1 : 1
            }
        })
         ctx.body = {
            code: 10000,
            result: [seatnumberAccount],
            updatetime: new Date()
        }
     }
})

function getSeatnumberAccount(accountList: any[]) {
    let seatnumberAccount: any = {
        servicename: 'seatnumber',
        profit: 0,
        bidPercent: 0,
        askPercent: 0,
        bidValue: 0,
        askValue: 0,
        leverage: 0,
        position: [],
        holdPnl: 0,
        balance: 0,
        drawdown: 0
    }

    let position: any = {}

    let seatnumberCount = 0
    for (let i = 0; i < accountList.length; i++) {
        let resultItem = accountList[i]
        let account = {
            servicename: resultItem._id,
            profit: resultItem.profit,
            bidPercent: resultItem.bidPercent,
            askPercent: resultItem.askPercent,
            bidValue: resultItem.bidValue,
            askValue: resultItem.askValue,
            leverage: resultItem.leverage,
            balance: 0
        }
        if (resultItem.owner == 'seatnumber' && resultItem.account.USDT) {
            seatnumberAccount.profit += account.profit
            seatnumberAccount.bidPercent += account.bidPercent
            seatnumberAccount.askPercent += account.askPercent
            seatnumberAccount.bidValue += account.bidValue
            seatnumberAccount.askValue += account.askValue
            seatnumberAccount.leverage += account.leverage
            for (let key in resultItem.account) {
                if (key != 'BNB') {
                    seatnumberAccount['balance'] += resultItem.account[key].marginBalance
                }
            }
            for (let item of resultItem.position) {
                if (position[item.symbol] == undefined) {
                    position[item.symbol] = { symbol: item.symbol, profit: item.profit, baseSize: item.baseSize, 
                        midRate: item.midRate, size: item.size, maxBaseSize: item.maxBaseSize }
                } else {
                    position[item.symbol].profit += item.profit
                    position[item.symbol].baseSize += item.baseSize
                    position[item.symbol].size += item.size
                    position[item.symbol].maxBaseSize += item.maxBaseSize
                }
                seatnumberAccount.holdPnl += item.profit
            }
            seatnumberCount++
        }
    }
    let positions = []
    for (let item in position) {
        positions.push(position[item])
    }
    positions.sort(function (a, b) {
        return Math.abs(a.baseSize) > Math.abs(b.baseSize) ? -1 : 1
    })
    seatnumberAccount.bidPercent /= seatnumberCount
    seatnumberAccount.askPercent /= seatnumberCount
    seatnumberAccount.leverage /= seatnumberCount
    seatnumberAccount.position = positions
    return seatnumberAccount
}

router.get('/transactionList',passwordAuthMiddleware, async (ctx: any) => {
    let { servicename } = ctx.query
    let query: any = {servicename: servicename,
        createtime: {$gt: new Date(Date.now() - 172800000)}}
    if(servicename == 'seatnumber') {
        let serviceList = await global.mongodb.collection('serviceconfig').find({owner: 'seatnumber', status:'enable'}).toArray()
        let servicenameList = []
        for(let service of serviceList) {
            servicenameList.push(service.servicename)
        }
        query = { servicename: {$in: servicenameList}, createtime: {$gt: new Date(Date.now() - 172800000)}}
    }
    let transactionList = await global.mongodb.collection('transaction').find( query,
        {id:1, batchId:1, symbol: 1, status:1, direction: 1, baseSize: 1,
            maxBaseSize: 1, openrate: 1, midrate: 1,opportunity:1,slide2:1,maxLost:1,
         pnl: 1, createtime: 1, endtime: 1 })
        .limit(200).sort({createtime:-1}).toArray()
    
    let result = []
    for(let transaction of transactionList) {
        result.push({
            id: transaction.id,
            batchId: transaction.batchId,
            symbol: transaction.symbol,
            status: transaction.status,
            direction: transaction.direction,
            baseSize: transaction.baseSize,
            maxBaseSize: transaction.maxBaseSize,
            openRate: transaction.openrate,
            midRate: transaction.midrate,
            opportunity: transaction.opportunity,
            pnl: transaction.pnl,
            slideP: transaction.slide2 / transaction.maxLost,
            createtime: transaction.createtime,
            endtime: transaction.endtime
        })
    }
    ctx.body = {
        code: 10000,
        result: result,
        updatetime: new Date()
    }
})

router.get('/profitList', passwordAuthMiddleware, async (ctx: any) => {
    let { servicename } = ctx.query
    if (servicename != 'seatnumber') {
        let query: any = {
            dayLog: true,
            servicename: servicename
        }
        let serviceconfig = await global.mongodb.collection('serviceconfig').findOne({
            servicename: servicename
        })
        let profitList = await global.mongodb.collection('account').find(query,
            { servicename: 1, profit: 1, createtime: 1, owner: 1 })
            .sort({ createtime: 1 }).limit(1095).toArray()

        let profitObject = await global.mongodb.collection('account').find({servicename: servicename}
            ,{ servicename: 1, profit: 1, createtime: 1, owner: 1 })
            .sort({ createtime: -1 }).limit(1).toArray()
        profitObject = profitObject[0]
        profitList.push(profitObject)
        ctx.body = {
            code: 10000,
            result: {
                serviceconfig: {
                    initBaseSize: serviceconfig.initBaseSize
                },
                profitList: profitList
            },
            updatetime: new Date()
        }
    } else {
        let query: any = {
            dayLog: true
        }
        let serviceconfigs = await global.mongodb.collection('serviceconfig').find({
            owner: 'seatnumber'
        }).toArray()
        let initBaseSize = 0
        for(let serviceconfig of serviceconfigs) {
            if(serviceconfig.status == 'enable') {
                initBaseSize += serviceconfig.initBaseSize
            }
        }
        let profitList = await global.mongodb.collection('account').find(query,
            { servicename: 1, profit: 1, createtime: 1, owner: 1 })
            .sort({ createtime: 1 }).limit(1095).toArray()
        
        let resultList = []
        let date = undefined
        let profit = 0
        let item: any = {}
        for(let i = 0;i< profitList.length;i++) {
            let profitItem = profitList[i]
            if(profitItem.owner == 'seatnumber') {
                let createtime = profitItem.createtime
                let thisDate = createtime.getDate()
                if(date != thisDate) {
                    item.profit = profit
                    profit = 0
                    item = {
                        servicename: 'seatnumber',
                        profit: 0,
                        createtime: createtime,
                        owner: 'seatnumber'
                    }
                    date = thisDate
                    resultList.push(item)
                }
                profit += profitItem.profit
            }
        }
        resultList[resultList.length - 1].profit = profit

        let profitObjects = await global.mongodb.collection('account').find({ }
            , { servicename: 1, profit: 1, createtime: 1, owner: 1 })
            .sort({ createtime: -1 }).limit(serviceconfigs.length * 2).toArray()
        
        let serviceSet = new Set()
        for(let serviceconfig of serviceconfigs) {
            if(serviceconfig.status == 'enable') {
                serviceSet.add(serviceconfig.servicename)
            }
        }
        let lastItem: any = {
            servicename: 'seatnumber',
            profit: 0,
            createtime: undefined,
            owner: 'seatnumber'
        }
        for(let profitObject of profitObjects) {
            if(serviceSet.has(profitObject.servicename)) {
                lastItem.profit += profitObject.profit
                lastItem.createtime = profitObject.createtime
                serviceSet.delete(profitObject.servicename)
            }
            if(serviceSet.size == 0) {
                break
            }
        }
        resultList.push(lastItem)
        
        ctx.body = {
            code: 10000,
            result: {
                serviceconfig: {
                    initBaseSize: initBaseSize
                },
                profitList: resultList
            },
            updatetime: new Date()
        }
    }
})