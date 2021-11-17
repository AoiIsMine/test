# step
1. run `npm install`
2. change schema.prisma db.url to your real db config
3. run `npm run db:gen`
4. run `npm run db:migrate`
5. run `node simple.js`

## test1 and test2
1. Annotation test1, del annotation test2
2. run `node simple.js`

## result 
demo is little change by Official document  
[Official documents](https://www.prisma.io/docs/guides/performance-and-optimization/prisma-client-transactions-guide#optimistic-concurrency-control)  
`Official document:It is now impossible for two people to book the same seat`  
but test1 will write twice  
because `updateMany` is do select sql and update sql  
So when concurrent, using updateMany to implement optimistic locks in transactions will be invalid
i don't know how to resolve this problem, write sql raw on my project?

**Thank u for your answer**