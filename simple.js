var Prisma = require("@prisma/client");
const prisma = new Prisma.PrismaClient({ log: ['query', 'info', 'warn', 'error'] });



async function testBuy(userName) {
    const movieName = 'fly'

    // Find the first available seat
    // availableSeat.version might be 0
    const availableSeat = await prisma.seat.findFirst({
        where: {
            movie: movieName,
            claimedBy: null,
        },
    })
    console.log('seat =', availableSeat)

    if (!availableSeat) {
        console.log('seat is zero')
        return
    }

    // test1
    // my:In case of concurrency, the optimistic lock is invalid and the data will be overwritten
    // document:Only mark the seat as claimed if the availableSeat.version
    // matches the version we're updating. Additionally, increment the
    // version when we perform this update so all other clients trying
    // to book this same seat will have an outdated version.
    const seats = await prisma.seat.updateMany({
        data: {
            claimedBy: userName,
            version: {
                increment: 1,
            },
        },
        where: {
            id: availableSeat.id,
            version: availableSeat.version, // document:This version field is the key; only claim seat if in-memory version matches database version, indicating that the field has not been updated
        },
    })

    if (seats.count === 0) {
        console.log('xxxxx count = 0')
    }

    // test2
    // my:Optimistic locks are valid when concurrent
    // const seats = await prisma.$executeRaw`update seat set claimedBy = ${userName},version =version+1 where id = ${availableSeat.id} and version = ${availableSeat.version};`
    // console.log('seats=',seats)
    // if (!seats) {
    //   console.log('xxxxx count = 0')
    // }
}

async function teatBuyMore() {
    const movieName = 'fly'
    await prisma.seat.create({
        data: {
            movieId: 1,
            version: 1,
            movie: movieName,
            claimedBy: null,
        },
    })
    testBuy('userA')
    testBuy('userB')
    //wait for done
    await wait(5);
}
async function wait(second = 5) {
    // console.log(`wait ${second} second`);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // console.log(`${second} timeout`);
            resolve("");
        }, second * 1000);
    });
}
try {
    teatBuyMore().finally(async () => {
        await prisma.$disconnect();
    });
} catch (error) {
    console.log("error=", error);
}