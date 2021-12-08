var Prisma = require("@prisma/client");
const prisma = new Prisma.PrismaClient({ log: ['query', 'info', 'warn', 'error'] });



// async function testBuy(userName) {
//     const movieName = 'fly'

//     // Find the first available seat
//     // availableSeat.version might be 0
//     const availableSeat = await prisma.seat.findFirst({
//         where: {
//             movie: movieName,
//             claimedBy: null,
//         },
//     })
//     console.log('seat =', availableSeat)

//     if (!availableSeat) {
//         console.log('seat is zero')
//         return
//     }

//     // test1
//     // my:In case of concurrency, the optimistic lock is invalid and the data will be overwritten
//     // document:Only mark the seat as claimed if the availableSeat.version
//     // matches the version we're updating. Additionally, increment the
//     // version when we perform this update so all other clients trying
//     // to book this same seat will have an outdated version.
//     const seats = await prisma.seat.updateMany({
//         data: {
//             claimedBy: userName,
//             version: {
//                 increment: 1,
//             },
//         },
//         where: {
//             id: availableSeat.id,
//             version: availableSeat.version, // document:This version field is the key; only claim seat if in-memory version matches database version, indicating that the field has not been updated
//         },
//     })

//     if (seats.count === 0) {
//         console.log('xxxxx count = 0')
//     }

//     // test2
//     // my:Optimistic locks are valid when concurrent
//     // const seats = await prisma.$executeRaw`update seat set claimedBy = ${userName},version =version+1 where id = ${availableSeat.id} and version = ${availableSeat.version};`
//     // console.log('seats=',seats)
//     // if (!seats) {
//     //   console.log('xxxxx count = 0')
//     // }
// }

// async function teatBuyMore() {
//     const movieName = 'fly'
//     await prisma.seat.create({
//         data: {
//             movieId: 1,
//             version: 1,
//             movie: movieName,
//             claimedBy: null,
//         },
//     })
//     testBuy('userA')
//     testBuy('userB')
//     //wait for done
//     await wait(5);
// }

// try {
//     teatBuyMore().finally(async () => {
//         await prisma.$disconnect();
//     });
// } catch (error) {
//     console.log("error=", error);
// }

async function wait(second = 5) {
    // console.log(`wait ${second} second`);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // console.log(`${second} timeout`);
            resolve("");
        }, second * 1000);
    });
}

async function test() {
    const movieName = 'fly'
    const seat = await prisma.seat.create({
        data: {
            movieId: 1,
            version: 1,
            movie: movieName,
            claimedBy: null,
        },
    })

    const times = 25
    // const times = 5
    for (let i = 0; i < times; i++) {
        // myTransaction(3,teatConcurrence,seat.id)
        teatConcurrence(seat.id)
    }

    await wait(120)
}
test()

async function teatConcurrence(id) {
    const list = await prisma.seat.findMany({
        where: { id },
    })
    const availableSeat = list[0]
    // console.log('seat =', availableSeat)

    if (!availableSeat) {
        console.log('seat is zero')
        return
    }

    const tagId = Math.floor(Math.random() * 100000)
    // try {

    //     //没设置timeout好像30s还没有running,是1min running
    //     await prisma.$transaction(async (prismaT) => {
    //         // await prismaT.seat.create({
    //         //     data: {
    //         //         movieId: 1,
    //         //         version: 1,
    //         //         movie: '内层加的',
    //         //         claimedBy: null,
    //         //     },
    //         // })

    //         const sql = `update seat set claimedBy="${tagId}",version=version+1 where id=${availableSeat.id} and version = ${availableSeat.version};`
    //         console.log('tagId=', tagId, '  sql=', sql)
    //         const upCount = await prismaT.$executeRawUnsafe(sql)
    //         console.log('tagId=', tagId, 'wallet更新数量==', upCount)
    //         if (upCount == 0) {
    //             console.log('要抛出乐观锁冲突异常了11111')
    //             throw new Error('OptimismLockException')
    //         }
    //     })
    // } catch (error) {
    //     console.log('tagId=', tagId, '这是内层代码的error  22222 = ', error)

    //     const uniqueError = 'Unique constraint failed on the constraint: `PRIMARY`'
    //     const index = error.message.indexOf(uniqueError)
    //     //如果是重复下单,返回成功即可
    //     if (index >= 0) {
    //         console.log('终止由于 primary')
    //     } else {
    //         //其他错误往上抛出
    //         console.log('tagId=', tagId, ' 往外抛 err 33333 = ',error)
    //         throw error
    //     }
    // }



    //没设置timeout好像30s还没有running,是1min running
    try{
        await prisma.$transaction(async (prismaT) => {
            // await prismaT.seat.create({
            //     data: {
            //         movieId: 1,
            //         version: 1,
            //         movie: '内层加的',
            //         claimedBy: null,
            //     },
            // })
    
            const sql = `update seat set claimedBy="${tagId}",version=version+1 where id=${availableSeat.id} and version = ${availableSeat.version};`
            console.log('tagId=', tagId, '  sql=', sql)
            const upCount = await prismaT.$executeRawUnsafe(sql)
            console.log('tagId=', tagId, 'wallet更新数量==', upCount)
            if (upCount == 0) {
                console.log('要抛出乐观锁冲突异常了11111')
                // prismaT.Error('OptimismLockException')
                throw new Error('OptimismLockException')
            }
        }, { timeout: 15*1000 })
    }catch(error){
        console.info('try catch err=',error)
    }




}

/**
 * 事务封装(catch error,重试机制)
 * @param fn
 * @param retryTimes 请求|非必须执行的定时任务设置3-5次|必须执行的定时任务(分账)设置6-10次
 */
async function myTransaction(
    retryTimes,
    fn,
    ...param
) {
    try {
        const res = await fn(...param)
        return res
    } catch (error) {
        //{"code":"P2028","clientVersion":"3.3.0","meta":{"error":"Transaction already closed: Transaction is no longer valid. Last state: 'Expired'."}}
        // console.log('transaction 捕获到错误, msg:', error.message, '  code:', error.code)
        if (error.message == 'OptimismLockException' || error.code == 'P2028') {
            console.log('transaction 捕获到乐观锁冲突错误,准备重试, msg:', error.message, '  code:', error.code)
            return await retryTransaction(retryTimes, fn, ...param)
        }
        //其他错误往上抛出
        console.log('transaction 捕获到错误,非乐观锁冲突!!!  other error=', error)
    }
}

async function retryTransaction(
    retryTimes,
    fn,
    ...param
) {
    for (let i = 0; i < retryTimes; i++) {
        console.log(`retryTransaction 第${i}次`)
        await wait() //默认300ms重试
        try {
            const retryRes = await fn(...param)
            return retryRes
        } catch (error) {
            if (error.message == 'OptimismLockException' || error.code == 'P2028') {
                console.log(`重试 第${i}次 捕获到乐观锁冲突错误,继续重试, msg: ${error.message},   code: ${error.code}`)
                //超过重试次数
                if (i == retryTimes - 1) {
                    console.log('重试超出次数终止!!!')
                }
            } else {
                console.log(`重试 第${i}次 非乐观锁冲突终止!!!`)
            }
        }
    }
}
