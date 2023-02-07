
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
           positionValue:{$first:"$positionValue"},maxProfit:{$first:"$maxProfit"},maxDrawdown:{$first:"$maxDrawdown"},leverage:{$first:"$leverage"},owner:{$first:"$owner"}}
        },
        {
            $addFields: {
                drawdown: { $subtract: ["$maxProfit","$profit"]}
            }
        },
        {
            $project: {
                profit:"$profit",owner:"$owner",bidPercent:"$bidPercent",askPercent:"$askPercent"
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
     let seatnumberCount = 0
     for(let i = 0;i<result.length;i++) {
        let account = result[i]
        if(account.owner == 'seatnumber') {
            profit.seatnumber += account.profit
            bidPercent.seatnumber += account.bidPercent
            askPercent.seatnumber += account.askPercent
            seatnumberCount ++
        }
        profit[account._id] = account.profit
        bidPercent[account._id] = account.bidPercent
        askPercent[account._id] = account.askPercent
     }

     bidPercent.seatnumber /= seatnumberCount
     askPercent.seatnumber /= seatnumberCount

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
            positionValue:{$first:"$positionValue"},maxProfit:{$first:"$maxProfit"},maxDrawdown:{$first:"$maxDrawdown"},leverage:{$first:"$leverage"},createtime:{$first: "$createtime"},position: {$first: "$position"},
            sumObject:{$first:"$sumObject"}, account: {$first: "$account"},owner:{$first:"$owner"}}
         },
         {
             $addFields: {
                 drawdown: { $subtract: ["$maxProfit","$profit"]}
             }
         },
         {
             $project: {
                 profit:"$profit",drawdown: "$drawdown",bidPercent:"$bidPercent",askPercent:"$askPercent",positionValue:"$positionValue",maxProfit:"$maxProfit",maxDrawdown:"$maxDrawdown",
                 leverage:"$leverage",createtime:"$createtime",position:"$position",sumObject:"$sumObject",account:"$account",owner:"$owner"
             }
         },
         {
             $sort: { profit: -1}
         }
     ] ).toArray()
     let accountList = []
     let seatnumberAccount = {
        servicename: 'seatnumber',
        bidPercent: 0,
        askPercent: 0,
        profit: 0,
        balance: 0
     }
     
     let seatnumberCount = 0
     accountList.push(seatnumberAccount)
     for(let i = 0; i < result.length; i++) {
         let resultItem = result[i]
         let account = {
             servicename: resultItem._id,
             bidPercent: resultItem.bidPercent,
             askPercent: resultItem.askPercent,
             profit: resultItem.profit,
             balance: 0
         }
         for(let key in resultItem.account) {
             if(key != 'BNB') {
                 account['balance'] += resultItem.account[key].marginBalance
             }
         }
         if(resultItem.owner == 'seatnumber') {
             seatnumberAccount.profit += account.profit
             seatnumberAccount.bidPercent += account.bidPercent
             seatnumberAccount.askPercent += account.askPercent
             seatnumberAccount.balance += account.balance
             seatnumberCount ++
         }
         accountList.push(account)
     }
     seatnumberAccount.bidPercent /= seatnumberCount
     seatnumberAccount.askPercent /= seatnumberCount

     ctx.response.type = 'json'
     ctx.body = {
         code: 10000,
         result: accountList,
         updatetime: new Date()
     }
})