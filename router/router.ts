
export const router = require('koa-router')();
router.get('/',async (ctx: any)=>{
    ctx.body="首页";
})

router.get('/profit', async (ctx: any)=>{
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

router.get('/accountList', async (ctx: any)=>{
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
                 balance: 0
             }
             for(let key in resultItem.account) {
                 if(key != 'BNB') {
                     account['balance'] += resultItem.account[key].marginBalance
                 }
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

router.get('/accountDetail', async (ctx: any)=>{
    let { servicename } = ctx.query
    let matchContent: any
    if(servicename != 'seatnumber') {
        matchContent = {createtime:{$gte:new Date(Date.now() - 3600000)},servicename: servicename}
    } else {
        matchContent = {createtime:{$gte:new Date(Date.now() - 3600000)}}
    }
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
     if(servicename != 'seatnumber') {
        ctx.body = {
            code: 10000,
            result: result,
            updatetime: new Date()
        }
     } else {
         let seatnumberAccount = getSeatnumberAccount(result)
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
        balance: 0,
        position: []
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
            balance: 0
        }
        if (resultItem.owner == 'seatnumber' && resultItem.account.USDT) {
            seatnumberAccount.profit += account.profit
            seatnumberAccount.bidPercent += account.bidPercent
            seatnumberAccount.askPercent += account.askPercent
            seatnumberAccount.bidValue += account.bidValue
            seatnumberAccount.askValue += account.askValue
            for (let key in resultItem.account) {
                if (key != 'BNB') {
                    seatnumberAccount['balance'] += resultItem.account[key].marginBalance
                }
            }
            for (let item of resultItem.position) {
                if (position[item.symbol] == undefined) {
                    position[item.symbol] = { symbol: item.symbol, profit: item.profit, baseSize: item.baseSize, midRate: item.midRate, size: item.size }
                } else {
                    position[item.symbol].profit += item.profit
                    position[item.symbol].baseSize += item.baseSize
                    position[item.symbol].size += item.size
                }
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
    seatnumberAccount.position = positions
    return seatnumberAccount
}