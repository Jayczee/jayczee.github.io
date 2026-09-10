---
title: 订单为什么会卖超？从防抖、加锁到异步下单的一次完整实验
published: 2025-03-18
description: 写了一个能跑的最小项目，把订单从创建到支付跑通，再依次复现重复下单、库存超卖、同步慢、异步事务乱套的问题，最后给出一个能对账的写法。
category: 开发实践
tags:
  - Java
  - Spring Boot
  - 订单
draft: false
---

## 项目地址

[[Github]order-demo](https://github.com/Jayczee/order-demo)

## 起因

前段时间在做的仓储系统里，出库单和库存对不上。

一种表现是一个出库单建了两遍，库存扣了两次；另一种更难受，库存锁住了，订单却没建出来，运营那边看着库存少了一件，就是找不到对应的单子。等批量创建的入口接上，超卖、接口超时、异步任务卡住又跟着来了。

这几个问题前后折腾了不少时间。现在回头看，它们基本是一条线上的：防抖管得住手抖，管不住并发；加锁把并发按住了，接口又慢得没法看；异步把慢的问题解决了，数据开始乱。修一个冒一个。

所以我把这条线写成了一个能跑的小项目 `order-demo`。里面没连 MySQL，SQL 全是内存里模拟的，但执行顺序、事务边界、库存怎么流转，都是照真实项目的样子写的。

```text
src/main/java/com/jayczee/orderdemo
├── mockdb/          假数据库：内存表、SQL 日志、简化版事务
├── domain/          表结构对应的 record
├── repo/            所有 “SQL” 都集中在这里
├── stage1 ~ stage5  五个阶段各自的下单逻辑
└── benchmark/       同步和异步的耗时对比
```

Java 17 + Spring Boot，`mvn spring-boot:run` 起来打开 `http://localhost:8080`，首页有几个按钮可以手动点；`mvn test` 会把文章里这些问题和数字重新跑一遍。

下面按我当时的踩坑顺序讲。

## 一、先把最普通的下单跑通

一开始的诉求很简单：用户买一件商品，生成一笔订单，库存从「可用」挪到「待处理」。

库存这块，我把一个 SKU 拆成了三份：

| 字段 | 含义 | 什么时候变 |
| --- | --- | --- |
| `available` | 可用库存 | 下单扣减、取消归还 |
| `locked` | 待处理库存 | 下单增加、付款或取消时减少 |
| `sold` | 已售库存 | 付款成功后增加 |

画出来是这样：

![库存的三次搬家](/assets/images/order-demo/stock-flow.svg)

最后那行「可用 + 待处理 + 已售 = 期初库存」看着像废话，但我后面全靠它判断数据有没有乱。这三个数加不回去，基本就可以去查问题了。

库存这一行是个不可变的 record，三次搬家对应三个方法：

```java
// src/main/java/com/jayczee/orderdemo/domain/StockRow.java
public record StockRow(long id, String sku, int available, int locked, int sold, long version) {

    public int total() {
        return available + locked + sold;
    }

    /** 下单：可用 -> 待处理 */
    public StockRow lock(int count) {
        return new StockRow(id, sku, available - count, locked + count, sold, version + 1);
    }

    /** 取消/超时：待处理 -> 可用 */
    public StockRow release(int count) {
        return new StockRow(id, sku, available + count, locked - count, sold, version + 1);
    }

    /** 支付：待处理 -> 已售 */
    public StockRow sell(int count) {
        return new StockRow(id, sku, available, locked - count, sold + count, version + 1);
    }
}
```

第一版的下单逻辑大概长这样。我猜大多数人（包括我）第一反应都是这么写的：

```java
// src/main/java/com/jayczee/orderdemo/stage1/Stage1OrderService.java
public OrderRow create(long userId, String sku, int count) {
    GoodsRow goods = goodsRepository.findBySku(sku).orElseThrow(() -> new BizException("商品不存在：" + sku));

    // 第一步：看看库存够不够
    StockRow stock = stockRepository.findBySku(sku).orElseThrow();
    if (stock.available() < count) {
        throw new BizException("库存不足：可用 " + stock.available() + "，需要 " + count);
    }

    // 第二步：可用 -> 待处理
    stockRepository.lockStockWithoutCheck(sku, count);

    // 第三步：建订单
    long now = clock.now();
    OrderRow order = new OrderRow(db.nextId(), ids.nextOrderNo(), userId, sku, count,
            goods.priceFen() * count, OrderStatus.UNPAID, null, null, now, now);
    orderRepository.insert(order);

    // 第四步：记一条库存流水
    StockRow after = stockRepository.findBySku(sku).orElseThrow();
    stockLogRepository.append(new StockLogRow(db.nextId(), order.orderNo(), sku,
            StockChangeType.LOCK, count, after.available(), after.locked(), after.sold(), now));

    return order;
}
```

先查、再判断、再扣、再建单，看着挺顺。项目里每次数据库操作都会打一条日志，一次下单的 SQL 是这样：

```text
select id, sku, name, price_fen from t_goods where sku = 'SKU-A'
select id, sku, available, locked, sold, version from t_stock where sku = 'SKU-A'
update t_stock set available = available - 1, locked = locked + 1, version = version + 1 where sku = 'SKU-A'
insert into t_order (id, order_no, user_id, sku, count, amount_fen, status, ...) values (...)
select id, sku, available, locked, sold, version from t_stock where sku = 'SKU-A'
insert into t_stock_log (id, order_no, sku, type, count, ...) values (...)
```

一次下单，六次数据库访问。这个数字先放着，讲性能的时候还要用。

（真实项目里还会连着计费、优惠券、地址校验这些东西，一次下单二十几条 SQL 很正常。Demo 里只留了和库存、订单相关的步骤。）

## 二、问题一：手抖点两下，订单变两份

第一版写完，我自己连着点了两下按钮，出事了。测试里写起来就两行：

```java
orderService.create(1L, MockTables.SKU_A, 1);
orderService.create(1L, MockTables.SKU_A, 1);
```

```text
订单数：2
可用库存：98
```

用户明明只想买一件，后台多了两笔订单，库存扣了两次。

### 前端先加个防抖

页面上最直接的解法是防抖，用户停手 300 毫秒之后才真的把请求发出去：

```javascript
let timer = null;

function submitOrder() {
    if (timer) {
        clearTimeout(timer);   // 上一次还没发出去，直接取消掉
    }
    timer = setTimeout(() => {
        timer = null;
        fetch('/api/order', { method: 'POST', body: JSON.stringify(form) });
    }, 300);
}
```

Demo 首页就有这个按钮，点快了会跳一行「防抖生效：这次点击被忽略了」。

问题是防抖只管得住同一个页面上的手抖，下面这几种它一个都挡不住：

- 页面卡住，用户刷新了再点一次；
- 客户端超时重试，同一个请求发出去了两次；
- 脚本直接调接口（我们对接的客户就是这么干的，防抖在他那儿等于不存在）；
- 部署了两个实例，请求落到不同机器上，前端那点状态谁也不认识谁。

所以防抖还是要加，就是别指望它能兜底，真正的防线在服务端。

### 服务端：给每次下单发个请求号

幂等这个词听着挺唬人，说白了就是同一个请求执行一次和执行十次，结果都一样。放到下单上，同一个按钮点出十个请求，最后也只能有一笔订单。

做法是给每次「下单意图」配一个唯一的请求号 `requestKey`，客户端生成，跟着请求一起带上来。服务端拿到请求号先查一遍，这个号是不是已经下过单了。下过单了，直接把原来那笔订单返回去，什么都不做；没下过，正常走流程，落库的时候把请求号一起写进去。

不过光查一遍还不够。两个请求同时进来，可能都查到「没下过单」，然后一起往下走。所以 `t_order.request_key` 上还得有个唯一索引，数据库只允许一个插入成功，另一个会撞唯一索引报错。

```java
// src/main/java/com/jayczee/orderdemo/stage2/Stage2OrderService.java
public OrderRow create(long userId, String sku, int count, String requestKey) {
    Optional<OrderRow> exists = orderRepository.findByRequestKey(requestKey);
    if (exists.isPresent()) {
        return exists.get();
    }

    try {
        return db.inTransaction(() -> doCreate(userId, sku, count, requestKey));
    } catch (DuplicateKeyException e) {
        // 并发下两个请求同时进来，只有一个能插入成功，
        // 另一个会走到这里；事务已经回滚，它扣掉的库存也还回去了
        return orderRepository.findByRequestKey(requestKey)
                .orElseThrow(() -> new BizException("订单已存在，但没查到：" + requestKey));
    }
}
```

这里有个坑我踩过一次：**幂等得和事务一起用**。

撞唯一索引的那个请求，在插入失败之前已经把库存扣掉了。要是没有事务，这笔扣减就留在那儿了，订单一笔，库存扣了两次。开头说的「库存锁着但找不到单子」，就是这么来的。

加上事务，插入失败会把前面扣掉的库存一起回滚。10 个并发请求带着同一个 `requestKey` 打过来：

```text
10 个并发请求带同一个 requestKey：订单 1 笔，可用库存 99，成功返回 10 次
```

十个请求都正常返回了，这是幂等该有的样子；订单只有一笔，库存只动了一次。

### 但幂等管不了超卖

幂等认的是请求号。换个用户、换个请求号，它就不认识了。10 个人各买 2 件，库存只有 10 件：

```text
10 个人各买 2 件（库存 10）：成功 10 单，可用库存 -10，待处理 20
```

10 笔订单，卖出去 20 件，可用库存直接变成负数。

## 三、问题二：并发一上来，库存就卖穿了

第一版和加了幂等的版本，只要没管并发，结果都一样。20 个人同时下单，库存 10 件：

```text
20 个人各买 1 件（库存 10）：成功 20 单，失败 0 单，可用库存 -10，待处理 20
```

20 个人全买到了，仓库里就 10 件货。

### 为什么会被卖穿

问题出在「先查询」和「再扣减」这两步中间。两条线程的时间线大概是这样：

```text
库存 10

线程 A                    线程 B
查库存 -> 10
                          查库存 -> 10
判断 10 >= 1，放行
                          判断 10 >= 1，放行
扣库存 -> 9
                          扣库存 -> 8
建订单（A 的单）
                          建订单（B 的单）
```

两个线程都读到 10，都觉得够，然后各扣各的。这类问题英文里叫 check-then-act——检查的时候是一个状态，真动手的时候早就变了。

我一开始的想法很朴素：加个锁不就完了。锁确实有用，但光有锁还不够，下面会说为什么。

### 办法一：加锁

锁的粒度得挑一下。直接给整个下单流程加一把大锁肯定不会错，但所有用户的订单都串成一队，吞吐没法看；锁得太细又等于没锁。

我用的 key 是「用户 + SKU」：

```java
// src/main/java/com/jayczee/orderdemo/common/StripedLocks.java
public <T> T run(String key, Supplier<T> action) {
    synchronized (locks[Math.floorMod(key.hashCode(), STRIPES)]) {
        return action.get();
    }
}
```

同一个用户买同一件商品，请求老老实实排队；不同用户、不同商品各走各的。

有一点要注意，锁得加在「这次操作针对的那条数据的标识」上，也就是用户 + SKU，别图省事去锁 `this` 或者锁库存对象。另外，这是单机锁，多部署一个实例就失效了，两台机器上的两把锁互相不认识，这时候得换 Redis 那类分布式锁。

### 办法二：把判断和扣减塞进一条 SQL

真正兜底的东西在数据库里。把「够不够」和「减多少」写成一条语句：

```sql
update t_stock
   set available = available - 1,
       locked    = locked + 1,
       version   = version + 1
 where sku = 'SKU-A'
   and available >= 1
```

执行完这条 SQL，数据库会告诉你影响了几行。返回 1 说明扣成功，返回 0 就是 `available >= 1` 没满足，库存一点没动。

代码里就是：

```java
// src/main/java/com/jayczee/orderdemo/repo/StockRepository.java
public int lockStock(String sku, int count) {
    String sql = """
            update t_stock
               set available = available - %d,
                   locked    = locked + %d,
                   version   = version + 1
             where sku = '%s'
               and available >= %d""".formatted(count, count, sku, count);
    return db.update(sql, tables.stock(),
            row -> row.sku().equals(sku) && row.available() >= count,
            row -> row.lock(count));
}
```

调用方只看影响行数：

```java
int affected = stockRepository.lockStock(sku, count);
if (affected == 0) {
    throw new BizException("库存不足");
}
```

好处就是**判断和扣减在数据库里一次做完**，中间没有时间窗可钻。

### 两个都用上

最后两样都留着：

```java
// src/main/java/com/jayczee/orderdemo/stage3/Stage3OrderService.java
return locks.run(userId + ":" + sku, () -> {
    Optional<OrderRow> again = orderRepository.findByRequestKey(requestKey);
    if (again.isPresent()) {
        return again.get();
    }
    return db.inTransaction(() -> doCreate(userId, sku, count, requestKey));
});
```

本地锁让同一个用户、同一件商品的请求排队，少一些无谓的冲突；条件扣减保证数据本身是对的，哪怕多实例部署锁失效了，或者有人绕过锁直接调方法，库存也不会变成负数。

50 个人抢 20 件库存的结果：

```text
50 个人各买 1 件（库存 20）：成功 20 单，失败 30 单，可用库存 0，待处理 20
```

刚好 20 单，剩下 30 个请求老老实实报「库存不足」。三个数加起来还是 20。

### 还剩两个问题没解决

一个是顺序。加锁只保证串行，不保证先来后到：两个请求几乎同时到，谁先拿到锁是操作系统说了算，不是用户先点谁就谁先。

另一个是等。同一个 SKU 的请求本来就该排队，可每个请求都要把整条链路走完，用户就得一直等在那儿。这个放到下一节说。

## 四、问题三：加了锁，用户开始等

回到第一节那六次数据库访问。Demo 里每次访问都有模拟延迟（默认 15 毫秒，跑测试我设成 5 毫秒），一次下单光在数据库上就要 30 到 90 毫秒。

这还只是这个小 Demo。真实项目里一次下单要查用户、查地址、算运费、验优惠券、写订单、写明细、锁库存、记流水，中间还夹着两三个外部接口。用户点完按钮看着转圈的那几秒，基本都花在这儿了。

100 单、20 并发的实测（模拟数据库延迟 5 毫秒）：

```text
[同步下单] 并发 20，共 100 单
用户等待（全部提交完）：1923 ms，约 52 单/秒
成功 100 单，失败 0 单
```

快两秒。可用户要的其实不是「订单已经建好了」，他要的是「收到了，一会儿告诉我结果」。

### 改成异步

于是把下单拆成两段：请求进来，先落一条受理单（`t_order_task`），带上 requestKey，立刻把受理单号返回去；扣库存、建订单、写流水这些活儿，交给后台线程从队列里取着做。

```java
// src/main/java/com/jayczee/orderdemo/stage4/Stage4AsyncService.java
public OrderTaskRow submit(long userId, String sku, int count, String requestKey) {
    OrderTaskRow task = accept(userId, sku, count, requestKey);   // 落受理单
    if (task.status() == TaskStatus.PENDING) {
        gateway.process(task.taskNo());                           // 丢给后台
    }
    return task;
}
```

注意受理单和订单是两张表，requestKey 的唯一性得在受理单这层就拦住，别等建订单的时候才发现重复。

实测对比：

```text
[异步下单] 并发 20，共 100 单
用户等待（全部提交完）：99 ms，约 1010 单/秒
后台处理完：3157 ms，约 32 单/秒
成功 100 单，失败 0 单
```

用户的等待从 1923 毫秒掉到 99 毫秒。

不过有个数字挺反直觉的，我第一次跑出来盯着看了一会儿：后台把 100 单全处理完花了 3157 毫秒，比同步的 1923 还慢。

想想也不奇怪，异步本身就有成本，多了一次受理单的写入和状态更新，而且同一个 SKU 在分片队列里还是串行的。异步没让活儿变少，它只是把用户等待的时间挪到了后台。

所以异步成不成立，看的是用户等不等得起。下单、发通知、生成报表适合这么干；查库存、算价格这种必须当场给答案的，异步没意义。

还有个事容易忘：接口异步了，前端交互也得跟着改。提交完拿到的是受理单号，得给个地方让他查订单到底建好没有，不然用户会以为自己的订单丢了。

## 五、问题四：异步之后，数据更容易脏了

异步这一版在测试环境里又出了几种很难查的问题，我都写成了测试，一个个说。

### 坑一：@Async 自己调自己

第一种是「异步没生效」，用户等待时间一点没变，接口还是慢。

原因不复杂：Spring 的 `@Async` 靠代理实现，同一个类里方法 A 调方法 B，这个调用根本不经过代理，注解写了也白写，代码照旧同步跑。

Demo 里专门留了个反例：

```java
// src/main/java/com/jayczee/orderdemo/stage4/Stage4AsyncService.java
public OrderTaskRow submitBySelfInvocation(long userId, String sku, int count, String requestKey) {
    OrderTaskRow task = accept(userId, sku, count, requestKey);
    if (task.status() == TaskStatus.PENDING) {
        this.processInAsyncThread(task.taskNo());    // this 调用，不走代理
    }
    return taskRepository.findByTaskNo(task.taskNo()).orElseThrow();
}

@Async("orderExecutor")
public void processInAsyncThread(String taskNo) {
    doProcess(taskNo);
}
```

测试跑出来的结果很直白：

```text
self-invocation 返回时任务状态：SUCCESS
此时订单数：1
```

方法返回的时候订单已经建好了——说明它压根就是同步跑完的。

正确写法是把异步方法放到另一个 Bean 里调：

```java
// src/main/java/com/jayczee/orderdemo/stage4/Stage4ProcessGateway.java
@Component
public class Stage4ProcessGateway {

    private final Stage4AsyncService asyncService;

    public Stage4ProcessGateway(@Lazy Stage4AsyncService asyncService) {
        this.asyncService = asyncService;
    }

    @Async("orderExecutor")
    public void process(String taskNo) {
        asyncService.doProcess(taskNo);
    }
}
```

（顺带说一句，这两个 Bean 互相依赖会报循环依赖，加个 `@Lazy` 就破了。我在这上面卡了几分钟，报错信息还挺唬人的。）

### 坑二：异步线程里的事务

这个我觉得是最隐蔽的。

`@Transactional` 是拿 ThreadLocal 存事务信息的，事务绑在当前线程上。业务扔到异步线程里执行，那就是另一个线程了，外面的事务跟它没关系。

更麻烦的是，`@Async` 方法上再标 `@Transactional`，事务是能开，但它和调用方不在一个事务里。调用方把自己的数据提交了，异步那边自己成功或者失败，互相都不知道。

Demo 里没有真的数据库，事务是用 `db.inTransaction(...)` 显式写的（真实项目换成 `@Transactional` 就行），而第 4 节这一版故意没写：

```java
// src/main/java/com/jayczee/orderdemo/stage4/Stage4AsyncService.java
public void doProcess(String taskNo) {
    OrderTaskRow task = taskRepository.findByTaskNo(taskNo).orElseThrow();
    if (task.status() != TaskStatus.PENDING) {
        return;
    }

    long now = clock.now();
    int affected = stockRepository.lockStock(task.sku(), task.count());   // 库存已经动了
    if (affected == 0) {
        taskRepository.markFailed(taskNo, "库存不足", now);
        return;
    }

    if (faultInjector.shouldFail(processCounter.incrementAndGet())) {
        throw new IllegalStateException("模拟下游服务超时");                // 这里抛异常
    }

    orderRepository.insert(order);                                       // 这行还没执行
    ...
}
```

拿故障开关模拟一次「下游服务超时」：

```text
异常之后：可用 99，待处理 1，订单 0 笔，任务状态 PENDING
```

库存锁着 1 件，订单没有，受理单永远停在「处理中」。用户看不到订单，运营看着库存少了一件也查不出来原因，开头那个问题就是这么来的。

### 坑三：异常没人管

刚才那个异常去哪了？日志里有答案：

```text
ERROR --- [order-async-2] .a.i.SimpleAsyncUncaughtExceptionHandler :
Unexpected exception occurred invoking async method: public void ...Stage4ProcessGateway.process(java.lang.String)
java.lang.IllegalStateException: 模拟下游服务超时
```

`@Async` 的 void 方法抛异常，Spring 只会丢给 `SimpleAsyncUncaughtExceptionHandler` 打一行日志。没人回滚，没人重试，也没人通知用户，这条受理单就静静地躺在那儿。

如果方法返回 `Future`，异常还能靠 `future.get()` 捞出来；void 就只能挂个全局处理器。但就算拿到异常，还是得回答一个问题：这条受理单算成功还是失败，库存要不要还回去？

所以异步不是加个 `@Async` 就完事，状态、重试、补偿这些都得配上。这就是最终版要做的事。

## 六、最终版：把状态、顺序、事务和补偿都补上

最终版的整体链路是这样：

![最终版的下单链路](/assets/images/order-demo/order-pipeline.svg)

下面拆开说。

### 1. 先落受理单，再返回

请求进来只干三件事：校验参数、按 requestKey 查一下有没有重复受理、把受理单写进去。

```java
// src/main/java/com/jayczee/orderdemo/stage5/Stage5OrderService.java
public OrderTicket submit(long userId, String sku, int count, String requestKey) {
    goodsRepository.findBySku(sku).orElseThrow(() -> new BizException("商品不存在：" + sku));

    Optional<OrderTaskRow> exists = taskRepository.findByRequestKey(requestKey);
    if (exists.isPresent()) {
        return toTicket(exists.get());     // 幂等：同一个请求只受理一次
    }

    long now = clock.now();
    OrderTaskRow task = new OrderTaskRow(db.nextId(), ids.nextTaskNo(), userId, sku, count,
            requestKey, TaskStatus.PENDING, null, null, 0, now, now);
    try {
        taskRepository.insert(task);
    } catch (DuplicateKeyException e) {
        return toTicket(taskRepository.findByRequestKey(requestKey).orElseThrow());
    }

    enqueue(task.taskNo(), userId, sku);
    return toTicket(task);
}
```

这张受理单其实就是一个本地消息表：先把「我要做什么」记下来，再去动手。系统重启、线程池满了、下游挂了，表还在，能重试。

### 2. 分片队列：同一个用户 + 同一件商品排一条队

顺序问题是在这儿解决的，这个设计我自己挺喜欢。

```java
// 分片：同一个用户 + 同一个 SKU，永远落到同一条队列
private int shardOf(long userId, String sku) {
    return Math.floorMod(Objects.hash(userId, sku), shardExecutors.length);
}

private void enqueue(String taskNo, long userId, String sku) {
    int shard = shardOf(userId, sku);
    shardExecutors[shard].execute(() -> process(taskNo));   // 每个分片只有一个线程
}
```

每个分片就是一个单线程队列。同一个用户买同一件商品，请求必然落在同一条队上，先进先出，处理顺序就是提交顺序；不同用户、不同商品互不影响。

测试里把库存设成 3 件，同一个用户连着提交 10 笔：

```text
提交顺序：[TK...0001, TK...0002, TK...0003, TK...0004, TK...0005,
          TK...0006, TK...0007, TK...0008, TK...0009, TK...0010]
拿到库存的：[TK...0001, TK...0002, TK...0003]
```

先提交的三笔拿到库存，后面七笔失败。这一点加锁那版做不到，它只能保证不超卖，谁先谁后是随机的。

### 3. 四件事放在一个事务里

后台线程真正建单的时候，这四件事得在同一个事务里：

```java
// src/main/java/com/jayczee/orderdemo/stage5/Stage5OrderService.java
db.inTransaction(() -> {
    // 1. 判断 + 扣减，一条 SQL 完成
    int affected = stockRepository.lockStock(task.sku(), task.count());
    if (affected == 0) {
        throw new StockNotEnoughException("库存不足，需要 " + task.count() + " 件");
    }

    // 2. 这里故意留了一个故障开关，方便演示“中途挂掉”
    if (faultInjector.shouldFail(processCounter.incrementAndGet())) {
        throw new IllegalStateException("模拟下游服务超时");
    }

    // 3. 订单和流水
    long now = clock.now();
    orderRepository.insert(order);
    StockRow after = stockRepository.findBySku(task.sku()).orElseThrow();
    stockLogRepository.append(new StockLogRow(db.nextId(), order.orderNo(), task.sku(),
            StockChangeType.LOCK, task.count(), after.available(), after.locked(), after.sold(), now));

    // 4. 受理单标记成功，和上面的数据在同一个事务里
    taskRepository.markSuccess(taskNo, order.orderNo(), now);
    return order;
});
```

**第 4 步最容易被漏掉**：把「订单建好了」和「受理单标记成功」放同一个事务里。分开写的话，中间挂掉就会出现「订单在，受理单还在处理中」，重试的时候又建一单。

还是刚才那个故障开关，在最终版里跑一次，结果完全不一样：

```text
第一次处理失败：任务状态 FAILED，原因 处理失败：模拟下游服务超时，可用 100，待处理 0，订单 0 笔
重试 1 笔之后：任务状态 SUCCESS，订单号 OD20260910000001
```

库存回到 100，待处理 0，订单 0 笔，干干净净。然后定时任务把失败的任务重新排队，重试一次就成了。

### 4. 重试和超时关单

失败的任务记下原因和重试次数，定时任务把还没超过次数的重新丢回队列。有个小细节：库存不足不算系统故障，重试一百次也还是不够，所以这种直接放弃，不浪费功夫。

另一个任务管超时。订单建好了用户一直不付钱，库存就一直锁着。扫一遍超时的待支付订单，关掉，把待处理还回可用：

```text
超时关单 1 笔，取消后：可用 100，待处理 0
```

### 5. 支付：状态改得动才往下走

支付这里用状态做了一次 CAS（Compare And Swap）：先试着把订单从 `UNPAID` 改成 `PAID`，改得动才继续动库存。

```java
// src/main/java/com/jayczee/orderdemo/stage5/Stage5OrderService.java
long now = clock.now();
int affected = orderRepository.markPaid(orderNo, now);
if (affected == 0) {
    if (order.status() == OrderStatus.PAID) {
        return order;   // 重复支付：直接返回，不再动库存
    }
    throw new BizException("订单当前是「" + order.status().label() + "」，不能支付");
}

int sold = stockRepository.sellStock(order.sku(), order.count());
if (sold == 0) {
    throw new BizException("待处理库存不足，数据可能已经乱了");
}
```

支付回调重复到达太常见了，这里靠一句 `where order_no = ? and status = 'UNPAID'` 就挡住：第二次进来影响行数是 0，直接返回已有的订单，库存不会动第二遍。

### 6. 对账

前面那些设计都是尽量别出错。对账要解决的是另一件事：就算出错了，也得让人发现。

```java
// src/main/java/com/jayczee/orderdemo/stage5/ReconcileService.java
private void checkStockLog(List<StockRow> stocks, List<String> problems) {
    for (StockRow stock : stocks) {
        List<StockLogRow> logs = stockLogRepository.listBySku(stock.sku());
        int lockSum = sum(logs, StockChangeType.LOCK);
        int soldSum = sum(logs, StockChangeType.SOLD);
        int releaseSum = sum(logs, StockChangeType.RELEASE);

        int initial = tables.initialTotal(stock.sku());
        int expectedAvailable = initial + releaseSum - lockSum;
        int expectedLocked = lockSum - soldSum - releaseSum;
        int expectedSold = soldSum;

        if (expectedAvailable != stock.available() || expectedLocked != stock.locked()
                || expectedSold != stock.sold()) {
            problems.add("流水对不上：%s 流水算出 可用 %d / 待处理 %d / 已售 %d，库存表里是 可用 %d / 待处理 %d / 已售 %d"
                    .formatted(stock.sku(), expectedAvailable, expectedLocked, expectedSold,
                            stock.available(), stock.locked(), stock.sold()));
        }
    }
}
```

它查的东西不多，就是几个加减法：

- 每个 SKU：可用 + 待处理 + 已售 = 期初库存；
- 库存流水累加起来，正好等于现在的库存分布；
- 每笔订单的流水和它的状态对得上（付过款的得有出售流水，取消了的得有释放流水）；
- 订单金额 = 单价 × 数量；
- 受理单显示成功的，一定找得到对应的订单。

对账不用跑得太勤，数据量大也没必要，但它能兜住那些代码没想到的情况。线上真出问题的时候，最先发现异常的往往不是监控，是财务。

## 七、批量下单跑一遍，账还是对的

前面都是小打小闹，最后来一次大的。

### 300 个人抢 100 件库存

```text
提交 300 单（被拒 0）：成功 100，失败 200，可用 0，待处理 100，已售 0
对账：库存 2 个 SKU，订单 100 笔（待支付 100 / 已支付 0 / 已取消 0 / 失败 0），受理单 300 条
问题：[]
```

卖出的刚好 100 单，多出来的 200 单报库存不足，库存三条线加起来还是 100。

### 一半支付、一半取消

```text
支付 20 笔，取消 20 笔：可用 20，待处理 0，已售 20
对账：库存 2 个 SKU，订单 40 笔（待支付 0 / 已支付 20 / 已取消 20 / 失败 0），受理单 40 条
问题：[]
```

40 件库存分出去，20 件卖掉了，20 件退回来，待处理一件不剩，流水和订单也都对得上。

这两个测试我连着跑了几遍，结果是稳的。前面几个阶段的问题也都写成了测试，`mvn test` 就能把上面这些输出重新跑出来：

```bash
mvn test
```

| 测试类 | 复现的问题 |
| --- | --- |
| `Stage1ProblemTest` | 连点两次出两单；20 人抢 10 件卖超 |
| `Stage2IdempotentTest` | 幂等挡住重复提交，但挡不住超卖 |
| `Stage3ConcurrencyTest` | 加锁 + 条件扣减之后不超卖 |
| `Stage4AsyncTrapTest` | @Async 自调用失效；异步异常留下脏数据 |
| `Stage5ConsistencyTest` | 300 抢 100、部分支付部分取消，对账依然干净 |
| `BenchmarkTest` | 同步和异步的耗时对比 |

## 八、回过头看

把这几步串起来，有几点是我自己踩过才记住的。

顺序别搞反。防抖、加锁、异步、对账，先保证数据对，再想快。我一开始也想过「加个锁不就完了」，可要是没有那条带条件的 update，多实例部署照样超卖；反过来，只加条件扣减不加锁，数据是对的，但同一件商品的请求老打架，用户一直在重试，体验也好不到哪儿去。

幂等得和事务一起想。唯一索引拦得住重复的订单，拦不住已经扣掉的库存，这两件事必须在一个事务里。

异步的代价全在「状态」上。同步方法抛异常，调用方马上就知道；异步任务抛异常，只有日志知道。所以异步的东西一定要有地方查状态、有地方重试、有东西兜底。@Async 那三个坑（自调用、事务不传播、异常没人管）说到底是一件事：这段执行过程得你自己管。

对账也一样。前面所有防护都写在代码里，对账是在数据里检查。代码写错不可怕，可怕的是错了没人知道。

代码地址在开头，注释基本都留着，感兴趣的可以拉下来跑一遍。`MockDatabase` 没什么神秘的，就是个内存 Map，只是每次读写都会假装睡一会儿、打一条 SQL。所以「同步慢、异步快」这个差距是真的，跟我当时盯着日志发呆的那几个小时一样真。

有写错的地方，欢迎联系指正。
