var Prisma = require("@prisma/client");
const prisma = new Prisma.PrismaClient({ log: ['query', 'info', 'warn', 'error'] });


async function wait(second = 5) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve("");
        }, second * 1000);
    });
}

async function test() {
    const seat = await prisma.seat.create({
        data: {
            movieId: 1,
            version: 1,
            movie: 'fly',
            claimedBy: null,
        },
    })

    // Concurrent 25 times
    const times = 25
    for (let i = 0; i < times; i++) {
        testConcurrent(seat.id)
    }

    await wait(120)
}
test()

async function testConcurrent(id) {
    const list = await prisma.seat.findMany({
        where: { id },
    })
    const availableSeat = list[0]

    if (!availableSeat) {
        console.log('seat is zero')
        return
    }

    const tagId = Math.floor(Math.random() * 100000)
    try {
        await prisma.$transaction(async (prismaT) => {
            const sql = `update seat set claimedBy="${tagId}",version=version+1 where id=${availableSeat.id} and version = ${availableSeat.version};`
            console.log('tagId=', tagId, '  sql=', sql)
            const upCount = await prismaT.$executeRawUnsafe(sql)
            console.log('tagId=', tagId, ' upCount==', upCount)
            if (upCount == 0) {
                console.log('Will throw OptimismLockException')
                throw new Error('OptimismLockException')
            }
        }, { timeout: 20 * 1000 })
    } catch (error) {
        console.info('try catch err=', error)
    }
}