var Prisma = require("@prisma/client");
const prisma = new Prisma.PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

const knex = require('knex')({
    client: 'mysql2',
    connection: {
        host: '127.0.0.1',
        port: 3307,
        user: 'root',
        password: '123456',
        database: 'prisma_test'
    }
});


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
        await knex.transaction(async trx => {
            const upCount = await trx('seat').where({
                id: availableSeat.id,
                version: availableSeat.version
            }).update({
                claimedBy: tagId,
                version: availableSeat.version + 1
            })
            console.log('upCount=', upCount)
            if (upCount == 0) {
                console.log('Will throw OptimismLockException')
                throw new Error('OptimismLockException')
            }
            // return upCount
        })
    } catch (error) {
        console.info('try catch err=', error)
    }
}