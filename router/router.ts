
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
                profit:"$profit",owner:"$owner"
            }
        },
        {
            $sort: { profit: -1}
        }
     ] ).toArray()
     let resultTrue: any = {
         seatnumber: 0
     }
     for(let i = 0;i<result.length;i++) {
        let account = result[i]
        if(account.owner == 'seatnumber') {
            resultTrue.seatnumber += account.profit
        }
        resultTrue[account._id] = account.profit
     }
     ctx.response.type = 'json'
     ctx.body = {
         code: 10000,
         result: resultTrue,
         updatetime: new Date()
     }
})