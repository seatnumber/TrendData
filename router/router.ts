
export const router = require('koa-router')();
router.get('/',async (ctx: any)=>{
    ctx.body="首页";
})

router.get('/account', async (ctx: any)=>{
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
           positionValue:{$first:"$positionValue"},maxProfit:{$first:"$maxProfit"},maxDrawdown:{$first:"$maxDrawdown"},leverage:{$first:"$leverage"},createtime:{$first: "$createtime"}}
        },
        {
            $addFields: {
                drawdown: { $subtract: ["$maxProfit","$profit"]}
            }
        },
        {
            $project: {
                profit:"$profit",drawdown: "$drawdown",bidPercent:"$bidPercent",askPercent:"$askPercent",positionValue:"$positionValue",maxProfit:"$maxProfit",maxDrawdown:"$maxDrawdown",
                leverage:"$leverage",createtime:"$createtime"
            }
        },
        {
            $sort: { profit: -1}
        }
     ] ).toArray()
     ctx.response.type = 'json'
     ctx.body = {
         code: 10000,
         result: result
     }
})