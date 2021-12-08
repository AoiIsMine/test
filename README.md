# When multiple interactive transactions are executed concurrently, throw error ,no triggering transaction rollback
I try to execute multiple interactive transactions concurrently and find that when the number of connections is high, throwing an error will not trigger transaction rollback
When the number of connections is small, although there will be errors, it can still be rolled back
(on another computer,  connections 5 (CPU is 2) ,can be rolled back without an error.)  

I'm not sure what caused it or whether it can be reproduced on other computers
## env
mysql 8.0(repeatable read)   
prisma 3.6.0  
nodejs v14
cpu 4

## step
1. run `npm install`
2. change schema.prisma db.url to your real db config
3. run `npm run db:gen`
4. run `npm run db:migrate`
5. run `node simple2.js`

## step2
1. change schema.prisma `connection_limit`(big or small)
2.  run `npm run db:gen`
3.  run `node simple2.js`

## result
1. test 1
on my computer,4cpu,so default connection limit is 9.  
i try little concurrent update(3times),it will ok  
try 25 times, one transaction not rollback forever running(query is empty)  
(`it will execute throw error,but no triggered rollback`)  
(mysql:`select * from information_schema.INNODB_TRX;`)   
8 transaction state is lock await, until mysql lock default timeout(50 second),8 transaction state will change to running  
9 transaction never stop  
and nodejs process eat very height cpu(95%,my cpu is 100%)  

2. test 2
i change `connection limit = 5`  
finally, it can be rolled back
```js
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async teatConcurrence (D:\job\test\ohter\gitTest\simple.js:166:9) {
  code: 'StringExpected'
}
```
and  until mysql lock default timeout(50 second)  
will console.log  
```js
prisma:query update seat set claimedBy="84557",version=version+1 where id=207 and version = 1;
try catch err= Error: OptimismLockException
    at D:\job\test\ohter\gitTest\simple.js:183:23
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async teatConcurrence (D:\job\test\ohter\gitTest\simple.js:166:9)
prisma:query update seat set claimedBy="11616",version=version+1 where id=207 and version = 1;
try catch err= PrismaClientKnownRequestError:
Invalid `prisma.executeRaw()` invocation:


  Raw query failed. Code: `1205`. Message: `Lock wait timeout exceeded; try restarting transaction`
    at Object.request (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39045:15)
    at async D:\job\test\ohter\gitTest\simple.js:178:29
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async teatConcurrence (D:\job\test\ohter\gitTest\simple.js:166:9) {
  code: 'P2010',
  clientVersion: '3.6.0',
  meta: {
    code: '1205',
    message: 'Lock wait timeout exceeded; try restarting transaction'
  }
}
```

3. on test 1
  
Cause other transactions lock wait


***
# my test 
## test 1(connection limit 9)
### mysql 
`select * from information_schema.INNODB_TRX;`
```js
57458	LOCK WAIT	2021-12-08 20:08:27	2525037779616:606:4:4:2525001725720	2021-12-08 20:08:27	2	206	update seat set claimedBy="30214",version=version+1 where id=2 and version = 2	starting index read	1	1	2	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	1
57457	LOCK WAIT	2021-12-08 20:08:27	2525037782112:606:4:4:2525138262200	2021-12-08 20:08:27	2	215	update seat set claimedBy="53188",version=version+1 where id=2 and version = 2	starting index read	1	1	2	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	1
57455	LOCK WAIT	2021-12-08 20:08:27	2525037776288:606:4:4:2525001697608	2021-12-08 20:08:27	2	204	update seat set claimedBy="46582",version=version+1 where id=2 and version = 2	starting index read	1	1	2	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	1
57454	LOCK WAIT	2021-12-08 20:08:27	2525037775456:606:4:4:2525001692632	2021-12-08 20:08:27	2	202	update seat set claimedBy="71724",version=version+1 where id=2 and version = 2	starting index read	1	1	2	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	1
57453	LOCK WAIT	2021-12-08 20:08:27	2525037780448:606:4:4:2525001730696	2021-12-08 20:08:27	2	212	update seat set claimedBy="11308",version=version+1 where id=2 and version = 2	starting index read	1	1	2	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	1
57452	LOCK WAIT	2021-12-08 20:08:27	2525037777120:606:4:4:2525001702584	2021-12-08 20:08:27	2	208	update seat set claimedBy="52583",version=version+1 where id=2 and version = 1	starting index read	1	1	2	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	1
57451	LOCK WAIT	2021-12-08 20:08:27	2525037774624:606:4:4:2525001687656	2021-12-08 20:08:27	2	201	update seat set claimedBy="83601",version=version+1 where id=2 and version = 1	starting index read	1	1	2	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	1
57450	LOCK WAIT	2021-12-08 20:08:27	2525037777952:606:4:4:2525001707560	2021-12-08 20:08:27	2	210	update seat set claimedBy="61972",version=version+1 where id=2 and version = 2	starting index read	1	1	2	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	1
57449	RUNNING	2021-12-08 20:08:27			2	217			0	1	2	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	

//until 50s(mysql default lock wait second)
57458	RUNNING	2021-12-08 20:08:27			1	206			0	1	1	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	
57457	RUNNING	2021-12-08 20:08:27			1	215			0	1	1	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	
57455	RUNNING	2021-12-08 20:08:27			1	204			0	1	1	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	
57454	RUNNING	2021-12-08 20:08:27			1	202			0	1	1	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	
57453	RUNNING	2021-12-08 20:08:27			1	212			0	1	1	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	
57452	RUNNING	2021-12-08 20:08:27			1	208			0	1	1	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	
57451	RUNNING	2021-12-08 20:08:27			1	201			0	1	1	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	
57450	RUNNING	2021-12-08 20:08:27			1	210			0	1	1	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	
57449	RUNNING	2021-12-08 20:08:27			2	217			0	1	2	1136	1	0	0	REPEATABLE READ	1	1		0	0	0	0	
```

### nodejs
```js
$ node simple2.js
prisma:info Starting a mysql pool with 9 connections.
prisma:query BEGIN
prisma:query INSERT INTO `prisma_test`.`seat` (`claimedBy`,`movieId`,`movie`,`version`) VALUES (?,?,?,?)
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ? LIMIT ? OFFSET ?
prisma:query COMMIT
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query BEGIN
tagId= 48213   sql= update seat set claimedBy="48213",version=version+1 where id=2 and version = 1;
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
tagId= 48213  upCount== 1
tagId= 85815   sql= update seat set claimedBy="85815",version=version+1 where id=2 and version = 1;
tagId= 19796   sql= update seat set claimedBy="19796",version=version+1 where id=2 and version = 1;
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
tagId= 85815  upCount== 0
Will throw OptimismLockException
tagId= 16778   sql= update seat set claimedBy="16778",version=version+1 where id=2 and version = 1;
prisma:query update seat set claimedBy="48213",version=version+1 where id=2 and version = 1;
tagId= 19796  upCount== 0
Will throw OptimismLockException
try catch err= Error: OptimismLockException
    at prisma.$transaction.timeout (D:\job\test\ohter\gitTest\simple2.js:53:23)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9)
tagId= 74308   sql= update seat set claimedBy="74308",version=version+1 where id=2 and version = 1;
tagId= 85080   sql= update seat set claimedBy="85080",version=version+1 where id=2 and version = 1;
tagId= 28292   sql= update seat set claimedBy="28292",version=version+1 where id=2 and version = 1;
tagId= 16778  upCount== 0
Will throw OptimismLockException
try catch err= Error: OptimismLockException
    at prisma.$transaction.timeout (D:\job\test\ohter\gitTest\simple2.js:53:23)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9)
tagId= 99345   sql= update seat set claimedBy="99345",version=version+1 where id=2 and version = 2;
tagId= 74308  upCount== 0
Will throw OptimismLockException
try catch err= Error: OptimismLockException
    at prisma.$transaction.timeout (D:\job\test\ohter\gitTest\simple2.js:53:23)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9)
tagId= 46783   sql= update seat set claimedBy="46783",version=version+1 where id=2 and version = 2;
tagId= 6372   sql= update seat set claimedBy="6372",version=version+1 where id=2 and version = 2;
tagId= 61972   sql= update seat set claimedBy="61972",version=version+1 where id=2 and version = 2;
tagId= 83601   sql= update seat set claimedBy="83601",version=version+1 where id=2 and version = 1;
tagId= 52583   sql= update seat set claimedBy="52583",version=version+1 where id=2 and version = 1;
prisma:query BEGIN
tagId= 11308   sql= update seat set claimedBy="11308",version=version+1 where id=2 and version = 2;
tagId= 85080  upCount== 0
Will throw OptimismLockException
try catch err= Error: OptimismLockException
    at prisma.$transaction.timeout (D:\job\test\ohter\gitTest\simple2.js:53:23)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9)
prisma:query BEGIN
tagId= 71724   sql= update seat set claimedBy="71724",version=version+1 where id=2 and version = 2;
tagId= 28292  upCount== 0
Will throw OptimismLockException
try catch err= Error: OptimismLockException
    at prisma.$transaction.timeout (D:\job\test\ohter\gitTest\simple2.js:53:23)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9)
try catch err= Error: OptimismLockException
    at prisma.$transaction.timeout (D:\job\test\ohter\gitTest\simple2.js:53:23)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9)
tagId= 99345  upCount== 1
tagId= 46582   sql= update seat set claimedBy="46582",version=version+1 where id=2 and version = 2;
prisma:query BEGIN
prisma:query update seat set claimedBy="85815",version=version+1 where id=2 and version = 1;
prisma:query COMMIT
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query ROLLBACK
prisma:query update seat set claimedBy="19796",version=version+1 where id=2 and version = 1;
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
tagId= 46783  upCount== 0
Will throw OptimismLockException
tagId= 53188   sql= update seat set claimedBy="53188",version=version+1 where id=2 and version = 2;
tagId= 30214   sql= update seat set claimedBy="30214",version=version+1 where id=2 and version = 2;
tagId= 6372  upCount== 0
Will throw OptimismLockException
try catch err= Error: OptimismLockException
    at prisma.$transaction.timeout (D:\job\test\ohter\gitTest\simple2.js:53:23)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9)
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query ROLLBACK
prisma:query update seat set claimedBy="16778",version=version+1 where id=2 and version = 1;
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query BEGIN
prisma:query BEGIN
prisma:query BEGIN
prisma:query BEGIN
prisma:query BEGIN
prisma:query BEGIN
prisma:query BEGIN
prisma:query BEGIN
prisma:query ROLLBACK
prisma:query update seat set claimedBy="74308",version=version+1 where id=2 and version = 1;
prisma:query BEGIN
prisma:query ROLLBACK
prisma:query update seat set claimedBy="85080",version=version+1 where id=2 and version = 1;
prisma:query BEGIN
prisma:query ROLLBACK
prisma:query update seat set claimedBy="28292",version=version+1 where id=2 and version = 1;
prisma:query BEGIN
prisma:query ROLLBACK
prisma:query BEGIN
prisma:query update seat set claimedBy="99345",version=version+1 where id=2 and version = 2;
prisma:query COMMIT
prisma:query update seat set claimedBy="46783",version=version+1 where id=2 and version = 2;
prisma:query BEGIN
prisma:query ROLLBACK
prisma:query update seat set claimedBy="6372",version=version+1 where id=2 and version = 2;
prisma:query BEGIN
tagId= 73629   sql= update seat set claimedBy="73629",version=version+1 where id=2 and version = 2;
tagId= 50918   sql= update seat set claimedBy="50918",version=version+1 where id=2 and version = 2;
tagId= 493   sql= update seat set claimedBy="493",version=version+1 where id=2 and version = 2;
tagId= 56190   sql= update seat set claimedBy="56190",version=version+1 where id=2 and version = 2;
tagId= 93221   sql= update seat set claimedBy="93221",version=version+1 where id=2 and version = 2;
tagId= 47535   sql= update seat set claimedBy="47535",version=version+1 where id=2 and version = 2;
tagId= 86728   sql= update seat set claimedBy="86728",version=version+1 where id=2 and version = 2;
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}

```


## test 2 (5 connection limit)
### mysql  
```js
57470	LOCK WAIT	2021-12-08 20:12:56	2525037774624:606:4:5:2525001687656	2021-12-08 20:12:56	2	219	update seat set claimedBy="23312",version=version+1 where id=3 and version = 1
57469	LOCK WAIT	2021-12-08 20:12:56	2525037776288:606:4:5:2525001697608	2021-12-08 20:12:56	2	223	update seat set claimedBy="2978",version=version+1 where id=3 and version = 1
57468	LOCK WAIT	2021-12-08 20:12:56	2525037777120:606:4:5:2525001702584	2021-12-08 20:12:56	2	224	update seat set claimedBy="44178",version=version+1 where id=3 and version = 1
57467	LOCK WAIT	2021-12-08 20:12:56	2525037775456:606:4:5:2525001692632	2021-12-08 20:12:56	2	220	update seat set claimedBy="66392",version=version+1 where id=3 and version = 1
57466	RUNNING	2021-12-08 20:12:56			2	227	

//until 50s(mysql default lock wait second) null
```

### nodejs
```js
$ node simple2.js
prisma:info Starting a mysql pool with 5 connections.
prisma:query BEGIN
prisma:query INSERT INTO `prisma_test`.`seat` (`claimedBy`,`movieId`,`movie`,`version`) VALUES (?,?,?,?)
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ? LIMIT ? OFFSET ?
prisma:query COMMIT
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query BEGIN
tagId= 96165   sql= update seat set claimedBy="96165",version=version+1 where id=3 and version = 1;
tagId= 23363   sql= update seat set claimedBy="23363",version=version+1 where id=3 and version = 1;
tagId= 26422   sql= update seat set claimedBy="26422",version=version+1 where id=3 and version = 1;
tagId= 93696   sql= update seat set claimedBy="93696",version=version+1 where id=3 and version = 1;
tagId= 20320   sql= update seat set claimedBy="20320",version=version+1 where id=3 and version = 1;
tagId= 96165  upCount== 1
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
tagId= 23363  upCount== 0
Will throw OptimismLockException
tagId= 67737   sql= update seat set claimedBy="67737",version=version+1 where id=3 and version = 1;
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
tagId= 2978   sql= update seat set claimedBy="2978",version=version+1 where id=3 and version = 1;
tagId= 26422  upCount== 0
Will throw OptimismLockException
try catch err= Error: OptimismLockException
    at prisma.$transaction.timeout (D:\job\test\ohter\gitTest\simple2.js:53:23)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9)
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
tagId= 66392   sql= update seat set claimedBy="66392",version=version+1 where id=3 and version = 1;
tagId= 93696  upCount== 0
Will throw OptimismLockException
try catch err= Error: OptimismLockException
    at prisma.$transaction.timeout (D:\job\test\ohter\gitTest\simple2.js:53:23)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9)
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
tagId= 44178   sql= update seat set claimedBy="44178",version=version+1 where id=3 and version = 1;
tagId= 20320  upCount== 0
Will throw OptimismLockException
try catch err= Error: OptimismLockException
    at prisma.$transaction.timeout (D:\job\test\ohter\gitTest\simple2.js:53:23)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9)
tagId= 67737  upCount== 0
Will throw OptimismLockException
try catch err= Error: OptimismLockException
    at prisma.$transaction.timeout (D:\job\test\ohter\gitTest\simple2.js:53:23)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9)
tagId= 23312   sql= update seat set claimedBy="23312",version=version+1 where id=3 and version = 1;
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query BEGIN
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query SELECT `prisma_test`.`seat`.`id`, `prisma_test`.`seat`.`claimedBy`, `prisma_test`.`seat`.`movieId`, `prisma_test`.`seat`.`movie`, `prisma_test`.`seat`.`version` FROM `prisma_test`.`seat` WHERE `prisma_test`.`seat`.`id` = ?
prisma:query BEGIN
prisma:query BEGIN
prisma:query BEGIN
prisma:query update seat set claimedBy="96165",version=version+1 where id=3 and version = 1;
prisma:query COMMIT
prisma:query update seat set claimedBy="23363",version=version+1 where id=3 and version = 1;
prisma:query BEGIN
prisma:query ROLLBACK
prisma:query update seat set claimedBy="26422",version=version+1 where id=3 and version = 1;
prisma:query BEGIN
prisma:query ROLLBACK
prisma:query update seat set claimedBy="93696",version=version+1 where id=3 and version = 1;
prisma:query BEGIN
prisma:query ROLLBACK
prisma:query update seat set claimedBy="20320",version=version+1 where id=3 and version = 1;
prisma:query BEGIN
prisma:query ROLLBACK
prisma:query update seat set claimedBy="67737",version=version+1 where id=3 and version = 1;
prisma:query BEGIN
tagId= 66583   sql= update seat set claimedBy="66583",version=version+1 where id=3 and version = 1;
tagId= 78767   sql= update seat set claimedBy="78767",version=version+1 where id=3 and version = 1;
tagId= 35750   sql= update seat set claimedBy="35750",version=version+1 where id=3 and version = 1;
tagId= 56471   sql= update seat set claimedBy="56471",version=version+1 where id=3 and version = 1;
tagId= 64722   sql= update seat set claimedBy="64722",version=version+1 where id=3 and version = 1;
tagId= 37126   sql= update seat set claimedBy="37126",version=version+1 where id=3 and version = 1;
tagId= 15856   sql= update seat set claimedBy="15856",version=version+1 where id=3 and version = 1;
tagId= 25288   sql= update seat set claimedBy="25288",version=version+1 where id=3 and version = 1;
tagId= 76205   sql= update seat set claimedBy="76205",version=version+1 where id=3 and version = 1;
tagId= 79213   sql= update seat set claimedBy="79213",version=version+1 where id=3 and version = 1;
tagId= 61116   sql= update seat set claimedBy="61116",version=version+1 where id=3 and version = 1;
tagId= 74774   sql= update seat set claimedBy="74774",version=version+1 where id=3 and version = 1;
tagId= 80193   sql= update seat set claimedBy="80193",version=version+1 where id=3 and version = 1;
tagId= 20607   sql= update seat set claimedBy="20607",version=version+1 where id=3 and version = 1;
tagId= 29365   sql= update seat set claimedBy="29365",version=version+1 where id=3 and version = 1;
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
try catch err= Error
    at Object.transaction (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:36084:55)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39634:9)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'StringExpected'
}
prisma:query update seat set claimedBy="66392",version=version+1 where id=3 and version = 1;
try catch err= Error: OptimismLockException
    at prisma.$transaction.timeout (D:\job\test\ohter\gitTest\simple2.js:53:23)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9)
prisma:query update seat set claimedBy="2978",version=version+1 where id=3 and version = 1;
try catch err= PrismaClientKnownRequestError:
Invalid `prisma.executeRaw()` invocation:


  Raw query failed. Code: `1205`. Message: `Lock wait timeout exceeded; try restarting transaction`
    at Object.request (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39045:15)
    at async prisma.$transaction.timeout (D:\job\test\ohter\gitTest\simple2.js:49:29)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'P2010',
  clientVersion: '3.6.0',
  meta: {
    code: '1205',
    message: 'Lock wait timeout exceeded; try restarting transaction'
  }
}
try catch err= PrismaClientKnownRequestError:
Invalid `prisma.executeRaw()` invocation:


  Raw query failed. Code: `1205`. Message: `Lock wait timeout exceeded; try restarting transaction`
    at Object.request (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39045:15)
    at async prisma.$transaction.timeout (D:\job\test\ohter\gitTest\simple2.js:49:29)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'P2010',
  clientVersion: '3.6.0',
  meta: {
    code: '1205',
    message: 'Lock wait timeout exceeded; try restarting transaction'
  }
}
try catch err= PrismaClientKnownRequestError:
Invalid `prisma.executeRaw()` invocation:


  Raw query failed. Code: `1205`. Message: `Lock wait timeout exceeded; try restarting transaction`
    at Object.request (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39045:15)
    at async prisma.$transaction.timeout (D:\job\test\ohter\gitTest\simple2.js:49:29)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'P2010',
  clientVersion: '3.6.0',
  meta: {
    code: '1205',
    message: 'Lock wait timeout exceeded; try restarting transaction'
  }
}
try catch err= PrismaClientKnownRequestError:
Invalid `prisma.executeRaw()` invocation:


  Raw query failed. Code: `1205`. Message: `Lock wait timeout exceeded; try restarting transaction`
    at Object.request (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39045:15)
    at async prisma.$transaction.timeout (D:\job\test\ohter\gitTest\simple2.js:49:29)
    at async PrismaClient._transactionWithCallback (D:\job\test\ohter\gitTest\node_modules\@prisma\client\runtime\index.js:39631:18)
    at async testConcurrent (D:\job\test\ohter\gitTest\simple2.js:46:9) {
  code: 'P2010',
  clientVersion: '3.6.0',
  meta: {
    code: '1205',
    message: 'Lock wait timeout exceeded; try restarting transaction'
  }
}
prisma:query update seat set claimedBy="23312",version=version+1 where id=3 and version = 1;
prisma:query update seat set claimedBy="44178",version=version+1 where id=3 and version = 1;
prisma:query ROLLBACK

```
























***
<!-- # simple.js for updateMany
## step
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

**Thank u for your answer** -->