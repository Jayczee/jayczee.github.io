---
title: 分库分表踩坑记：把 20 万行订单从单库单表搬到 4 个分片
published: 2026-09-10
description: 用一个连着真实 MySQL 8 的项目，把订单表从单库单表迁到两个库四个分片：存量数据真的搬过去，读写真的走分片，再逐个复现自增主键、全路由、深分页、跨片 JOIN、跨片写事务和「动了分片键」这些坑。
category: 开发实践
tags:
  - Java
  - MySQL
  - ShardingSphere
  - 分库分表
draft: false
---

## 项目地址

[[Github]sharding-demo](https://github.com/Jayczee/sharding-demo)

## 起因

前面写过一个 `order-demo`，把下单这件事从防抖、加锁一路讲到异步和对账。那个项目里的数据库是内存里模拟的，因为当时想讲的是代码顺序和事务边界。

分库分表没法这么办。SQL 怎么改写、一条查询落在哪个库、结果怎么归并，全是中间件和数据库之间发生的事，用假数据库演不出来。所以这次老老实实连了一个真实的 MySQL 8.0.40，建了三个库：`sdemo_single` 放迁移前的单表，`sdemo_0`、`sdemo_1` 是分片库。20 万行订单是真的写进去的，迁移是真的在读老表、写新表，文章里每个数字都是这台机器上跑出来的，`mvn test` 能把它们重跑一遍。

连接信息没有写进代码，`sharding.yaml` 里只有 `${DB_HOST}` 这样的占位符，启动时由代码从环境变量替换：

```bash
export SHARDING_DB_HOST=127.0.0.1
export SHARDING_DB_PORT=3306
export SHARDING_DB_USER=root
export SHARDING_DB_PASSWORD=你的密码
```

我连的是一台远程 MySQL，跨公网，所以绝对耗时比本机大，但谁快谁慢、谁多发了 SQL，这些关系是准的。

```text
src/main/java/com/jayczee/shardingdemo
├── admin/      绕过中间件直连物理库（排查数据落在哪全靠它）
├── config/     ShardingSphere 数据源 + 环境变量
├── domain/     订单、明细、库存
├── migration/  全量迁移、增量追平、迁移校验
├── order/      分片路由计算、带基因的订单号
├── repo/       读写分片表的 Repository
├── schema/     建库建表、造存量数据
├── service/    下单、查单、扣库存、消息补偿
└── report/     控制台输出
```

下面按我当时的顺序讲：先把规则配出来、把数据搬过去、把读写跑通，然后一个个碰坑。

## 一、规则还没跑起来，先被依赖绊了一跤

第一版 `pom.xml` 我只引了一个包，觉得文档上写的 `shardingsphere-jdbc` 就是全部：

```xml
<dependency>
    <groupId>org.apache.shardingsphere</groupId>
    <artifactId>shardingsphere-jdbc</artifactId>
    <version>5.5.3</version>
</dependency>
```

`sharding.yaml` 写完，一行代码没跑，启动就报：

```text
Invalid tag: !SHARDING
```

翻译过来是「这个 YAML 标签我不认识」。查了一下才知道，5.5.x 的 `shardingsphere-jdbc` 只是运行核心，分片能力在 `shardingsphere-sharding-core` 里。加上，接着报 `Invalid tag: !BROADCAST`——广播表也是独立模块。等这两个都加上，又来了：

```text
No implementation class load from SPI `ContextManagerBuilder`
```

运行模式（单机内存）也是按需引入的。把这一串补齐之后再启动，报了一个 NPE：

```text
java.lang.NullPointerException
    at org.apache.shardingsphere.infra.database.core.type...StorageUnit:52
```

这回是连接池。YAML 里我写的是 `com.zaxxer.hikari.HikariDataSource` 加 `jdbcUrl`，但 ShardingSphere 不认得这个 url 字段——它需要对应的连接池模块才能解析。最后是 Spring Boot 的依赖管理又插了一刀：它把 `commons-lang3` 压到 3.14，而 ShardingSphere 5.5 用到 3.18 才有的 `Strings`，启动直接 `NoSuchMethodError`。

一共六条，全在 `pom.xml` 里，每条上面都写了注释：

```xml
shardingsphere-sharding-core                    <!-- !SHARDING 规则 -->
shardingsphere-broadcast-core                   <!-- !BROADCAST 规则 -->
shardingsphere-infra-data-source-pool-hikari    <!-- Hikari 连接池 -->
shardingsphere-standalone-mode-core             <!-- 单机模式 -->
shardingsphere-standalone-mode-repository-memory
shardingsphere-authority-simple                 <!-- 权限，单机用全部放行 -->
shardingsphere-parser-sql-engine-mysql          <!-- MySQL 方言解析器 -->
```

外加一条版本覆盖：

```xml
<commons-lang3.version>3.18.0</commons-lang3.version>
```

这一跤没什么技术含量，但值得写在最前面：分库分表还没开始，光是让它跑起来就够折腾半天，而报错信息（`Invalid tag`、SPI、NPE）跟 YAML 里那几行配置看不出任何关系。

## 二、分片规则：一个逻辑表，四个物理分片

规则我写得比较常规：两个库，每个库两张订单表，一共四个分片，按 `user_id` 分。

```yaml
rules:
  - !SHARDING
    tables:
      t_order:
        actualDataNodes: ds_${0..1}.t_order_${0..1}
        databaseStrategy:
          standard:
            shardingColumn: user_id
            shardingAlgorithmName: order_db_inline
        tableStrategy:
          standard:
            shardingColumn: user_id
            shardingAlgorithmName: order_table_inline
        keyGenerateStrategy:
          column: id
          keyGeneratorName: snowflake
    shardingAlgorithms:
      order_db_inline:
        type: INLINE
        props:
          algorithm-expression: ds_${user_id % 2}
      order_table_inline:
        type: INLINE
        props:
          algorithm-expression: t_order_${(user_id % 4) >> 1}
```

两条表达式合起来是这么个意思：

| 表达式 | 作用 |
| --- | --- |
| `ds_${user_id % 2}` | 分片号的最低位决定去哪个库 |
| `t_order_${(user_id % 4) >> 1}` | 次低位决定库里的哪张表 |

![一个逻辑表拆成四个物理分片](/assets/images/sharding-demo/shard-map.svg)

应用这一侧只认识 `t_order` 这一张逻辑表，SQL 里从头到尾没出现过 `t_order_0`、`sdemo_1` 这种名字。中间件在下面拆。

确认这件事最直接的办法是打开 `sql-show`，看它把一条逻辑 SQL 改写成了什么：

```text
Logic SQL: select ... from t_order where user_id = ?
Actual SQL: ds_1 ::: select ... from t_order_0 where user_id = ? ::: [1]
```

一条逻辑 SQL 变成了一条物理 SQL，而且知道去了 `ds_1.t_order_0`。等到没有分片键的时候，同一行日志会变成：

```text
Logic SQL: select ... from t_order where order_no = ?
Actual SQL: ds_0 ::: select ... from t_order_0 where order_no = ? UNION ALL select ... from t_order_1 where order_no = ?
Actual SQL: ds_1 ::: select ... from t_order_0 where order_no = ? UNION ALL select ... from t_order_1 where order_no = ?
```

后面对付各种问题，靠的就是盯着这两行日志。它比任何文档都直接。

## 三、先把单库单表的基线量出来

迁移之前得先知道「疼在哪」，不然改完之后没法比较。单表里造 20 万行订单：

```java
// src/main/java/com/jayczee/shardingdemo/schema/DemoDataSeeder.java
public long ensureSingleTableSeed(int rows) {
    long existing = countSingleTable();
    if (existing >= rows) {
        return existing;         // 跑过一次就不再造，接着往后补
    }
    ...
    for (long id = existing + 1; id <= rows; id++) {
        batch.add(new Object[]{
                id,
                "SO-LEGACY-%09d".formatted(id),
                (id % 10_000) + 1,     // 1 万个用户轮流下单，分片之后每个片差不多大
                "SKU-%02d".formatted(id % 50),
                ...});
    }
}
```

20 万行时的实测：

```text
========== 第一阶段：单库单表，先量一量这张表到底哪里疼 ==========
存量订单：200,002 行
表体积：数据 19.5 MB，索引 21.6 MB，合计 41.1 MB
select count(*)：100 ms
翻到第 1 页：8 ms；翻到最后一页（offset 199,982）：168 ms
给这张表加一个普通索引：1726 ms（200,002 行；真实项目里是千万行，DDL 要以小时计）
```

几个数字的感受：`count(*)` 一百毫秒，翻到最后一页只比第一页慢二十倍，加个索引一秒七。都还没到「必须分库分表」的程度。

这就是我想先说清楚的一件事：20 万行的表，分不分片其实无所谓。我这里造 20 万行只是为了在一台机器上把流程跑通、把差异放大到能看见。真到了几千万行，上面这几行会变成 `count(*)` 几十秒、深分页超时、加索引锁表几小时——分库分表要解决的是那个量级的问题，不是这个量级。

顺带说个小的：表体积那一行第一次跑出来是 `数据 0.0 MB`。InnoDB 的 `information_schema` 统计是估算值，刚写完的表没刷新过。代码里补了一句 `analyze table` 才拿到真实数字：

```java
public TableStat tableStat(String database, String table) {
    // InnoDB 的统计信息是估算值，刚写完的表不 analyze 会一直显示 0
    admin.execute("analyze table " + database + "." + table);
    ...
}
```

## 四、把存量数据真的搬到分片表里

迁移这一步我没走中间件的工具，直接在代码里写了一遍。原因很简单：迁移的每一步出问题都要能查、能重跑，自己写一遍比配一个工具更清楚。

![存量数据怎么搬过去](/assets/images/sharding-demo/migration-flow.svg)

做法是按主键顺序分批读老表，按分片键算出目标分片，同一批里按分片分组，再批量写进去：

```java
// src/main/java/com/jayczee/shardingdemo/migration/FullMigrator.java
public MigrationReport migrateFully(int batchSize, long maxRows, boolean verbose) {
    long lastId = 0;
    while (migrated < maxRows) {
        List<OrderRecord> rows = admin.query(
                "select ... from sdemo_single.t_order where id > ? order by id limit ?",
                OrderRowMapper.INSTANCE, lastId, limit);
        if (rows.isEmpty()) {
            break;
        }
        insertGroupedByShard(rows);
        lastId = rows.get(rows.size() - 1).id();   // 水位，中断了从这儿接着来
        migrated += rows.size();
    }
}

private void insertGroupedByShard(List<OrderRecord> rows) {
    Map<String, List<OrderRecord>> byNode = new LinkedHashMap<>();
    for (OrderRecord row : rows) {
        byNode.computeIfAbsent(ShardRouter.nodeOf(row.userId()), key -> new ArrayList<>()).add(row);
    }
    for (List<OrderRecord> group : byNode.values()) {
        sharding.batchUpdate("insert into t_order (id, order_no, ...) values (?, ?, ...)", group, ...);
    }
}
```

按分片分组再写，是因为一批数据可能同时落在四个分片上。先分好组，每一组写下去才是一条完整的批量插入；混着写，中间件得自己拆，拆完还可能是逐条执行。

主键保留老表的值，这样迁移可以随时中断、重跑，重跑时不会插出重复数据。

20 万行的结果：

```text
========== 第二阶段：把存量数据真的搬到分片表里 ==========
  已迁移 20000 行，用时 8521 ms，约 2347 行/秒
  ...
  已迁移 200000 行，用时 70926 ms，约 2819 行/秒
全量迁移完成：200,002 行，201 批，耗时 70,979 ms，约 2,817 行/秒
  sdemo_0.t_order_0      50,000 行
  sdemo_0.t_order_1      50,001 行
  sdemo_1.t_order_0      50,000 行
  sdemo_1.t_order_1      50,001 行
校验：单表 200,002 行 / 合计 10,199,935,000 分；分片 200,002 行 / 合计 10,199,935,000 分；问题 []
```

71 秒搬完 20 万行，跨公网大约 2800 行/秒。四个分片各 5 万行，说明造数时那个 `(id % 10_000) + 1` 的用户分布是均匀的——如果分片键选得不好，这一步就会看出来：某个片特别满，另一个片空着。

这一步我还留了一手：迁移跑完之后，不是看一眼数量对不对就完事，而是把「四个分片加起来」和「老表」逐项比：

```java
long singleCount = admin.queryForObject("select count(*) from sdemo_single.t_order", Long.class);
long[] sharded = sharding.queryForObject("select count(*), sum(amount_fen) from t_order",
        (rs, rowNum) -> new long[]{rs.getLong(1), rs.getLong(2)});
if (singleCount != shardedCount) {
    problems.add("总行数不一致：单表 %d，分片 %d".formatted(singleCount, shardedCount));
}
if (singleSum != shardedSum) {
    problems.add("金额合计不一致：单表 %d，分片 %d".formatted(singleSum, shardedSum));
}
```

行数、金额合计、逐分片相加、再随机抽几笔按主键两边对比字段。`sum(amount_fen)` 归并出来是 10,199,935,000 分，跟单表一模一样。

### 迁移期间老表还在写

真实迁移不可能挑一个「没人下单」的凌晨把表锁了搬。老表一边被搬，一边还在产生新数据，所以搬完之后得追平这段增量。Demo 里的做法是记一个水位时间，然后轮询 `update_time`：

```java
/** 增量追平：把迁移开始之后老表里新增/变更的订单搬过来（生产上一般用 binlog）。 */
public int catchUp(Timestamp from, int batchSize) {
    List<OrderRecord> rows = admin.query(
            "select ... from sdemo_single.t_order where update_time > ? order by update_time limit ?", ...);
    for (OrderRecord row : rows) {
        int updated = sharding.update("update t_order set ... where id = ? and user_id = ?", ...);
        if (updated == 0) {
            insertGroupedByShard(List.of(row));    // 还没搬过来的，补一条
        }
    }
    return rows.size();
}
```

```text
迁移期间老表又来了 8 笔单，增量追平后再次校验：[]
```

这个方法在生产里跑不动——`update_time > ?` 这种查询在老表上扫不了索引，量一大就是全表。真实项目一般用 binlog（比如 Canal、Flink CDC）或者双写。我在这里留它，是因为它把一个坑暴露得很清楚：**水位时间如果取错了，增量就会漏行**。

我就漏了。第一版用的是 `serverTimezone=Asia/Shanghai`，写进去的时间和 Java 侧读出来的差了几个小时，`update_time > ?` 捞不到刚写的那几行，校验一直报「总行数不一致」。原因不是代码写错，是这台 MySQL 的 `@@system_time_zone` 是 UTC，而 JDBC 那串参数只在客户端假装换了个时区。最后换成 `connectionTimeZone` 才对齐：

```text
jdbc:mysql://host:3306/sdemo_0?...&connectionTimeZone=Asia/Shanghai&forceConnectionTimeZoneToSession=true
```

这类问题排查起来最费时间：SQL 单独跑是对的，数据单独看也是对的，只有把两边拼在一起才错，而且错得还不稳定。

## 五、分片读写跑通

到这一步，`t_order` 已经是一个正经的分片表了。写一笔订单，走的是完整的一条链路：订单、明细、消息表三张表都按 `user_id` 分片，一次事务提交在同一个库里：

```java
// src/main/java/com/jayczee/shardingdemo/service/OrderService.java
@Transactional
public OrderRecord placeOrder(long userId, String sku, int count) {
    String orderNo = orderNoGenerator.next(userId);
    long amount = PRICE_FEN * count;
    orderRepository.insertWithGeneratedId(orderNo, userId, sku, count, amount, "UNPAID");
    OrderRecord order = orderRepository.findByUserAndOrderNo(userId, orderNo).orElseThrow();
    orderItemRepository.insert(orderNo, order.id(), userId, sku, count, PRICE_FEN);
    outboxRepository.append(orderNo, userId, sku, count);
    return order;
}
```

它跑了四个用户，四个不同的分片：

```text
========== 第三阶段：一次写入到底落在哪个分片 ==========
用户 900101 下单 -> sdemo_1.t_order_0，订单号 SO2026091018204010008
用户 900102 下单 -> sdemo_0.t_order_1，订单号 SO2026091018204020009
用户 900103 下单 -> sdemo_1.t_order_1，订单号 SO2026091018204030010
用户 900104 下单 -> sdemo_0.t_order_0，订单号 SO2026091018204000011
直连物理库确认（不看 ShardingSphere 的日志，看真实数据）：
  sdemo_1.t_order_0    -> [{id=1304873309044740096, order_no=SO2026091018204010008, user_id=900101}]
  sdemo_0.t_order_1    -> [{id=1304873309359312897, order_no=SO2026091018204020009, user_id=900102}]
  sdemo_1.t_order_1    -> [{id=1304873309812297728, order_no=SO2026091018204030010, user_id=900103}]
  sdemo_0.t_order_0    -> [{id=1304873310193979393, order_no=SO2026091018204000011, user_id=900104}]
```

「直连物理库确认」这一步在 Demo 里是个单独的类，绕过 ShardingSphere，直接连 `sdemo_0`、`sdemo_1` 去查。日志说它去了哪个分片，和物理表里真有一行，是两件事，我习惯都看一眼：

```java
// src/main/java/com/jayczee/shardingdemo/admin/PhysicalInspector.java
/** 绕过 ShardingSphere，直接连物理库看数据。排查「数据到底落在哪个分片」时，靠的就是这一手。 */
```

读也一样。按分片键查，一条 SQL 落一个分片：

```text
按 user_id 查订单（走分片键）：
  [OrderRecord[id=1304873309044740096, orderNo=SO2026091018204010008, userId=900101, ...]]
```

到这里为止，分库分表看起来就是「配置写对，然后一切照旧」。后面全是这个想法带来的后果。

## 六、坑一：分片表上的自增主键会撞车

第一版我图省事，主键用的还是自增：

```sql
create table t_order_1 (
    id bigint not null auto_increment,
    ...
)
```

两个用户各下一单，一个落在 `sdemo_0.t_order_auto_1`，一个落在 `sdemo_1.t_order_auto_0`，各自的自增计数器从 1 开始，于是两张物理表里都出现了 id=1：

```text
  sdemo_0.t_order_auto_1 [{id=1, order_no=SO-AUTO-2, user_id=2}]
  sdemo_1.t_order_auto_0 [{id=1, order_no=SO-AUTO-1, user_id=1}]
按主键查：select * from t_order_auto where id = 1 -> 2 条
```

单库里主键唯一，是数据库保证的。拆成四张表之后，「唯一」这件事没人保证了，四个自增计数器各数各的。按主键查回来两条不同的订单，`update ... where id = ?` 会改到哪一条，只能看它路由到哪个分片。

解法就是别用自增，主键在写入之前生成好。配置里加一段：

```yaml
keyGenerateStrategy:
  column: id
  keyGeneratorName: snowflake
```

```text
========== 第三阶段（解）：换成雪花算法生成主键 ==========
生成的 id：1304873308512063489（19 位，高位是时间戳，所以整体递增）
高位时间戳还原：2026-09-10T10:20:40.123Z（41 位时间戳 + 10 位 workerId + 12 位序列号）
```

雪花主键整体递增，对 B+ 树友好，插入不会到处裂页。代价是它只有 64 位里的一部分用来放时间，理论上七十年后会用完；另外 workerId 得自己管，同一个 workerId 的两台机器同时启动会撞——这个坑在生产上比自增主键还隐蔽，因为它只在重启、扩容的时候才出现。

## 七、坑二：没有分片键的查询，等于把四个分片都查一遍

订单建好之后，客服拿到的是一串订单号，不是 `user_id`。于是就有了这个查询：

```sql
select * from t_order where order_no = 'SO2026091018141200002'
```

`order_no` 不是分片键，中间件不知道去哪找，只能四个分片全问一遍，再把结果合并：

```text
Logic SQL: select ... from t_order where order_no = ?
Actual SQL: ds_0 ::: select ... from t_order_0 where order_no = ? UNION ALL select ... from t_order_1 where order_no = ?
Actual SQL: ds_1 ::: select ... from t_order_0 where order_no = ? UNION ALL select ... from t_order_1 where order_no = ?
```

一次查询变成两条 SQL、四个物理表。实测：

```text
========== 第四阶段：没有分片键的查询 ==========
按 user_id 查（单分片）：14 ms
按 order_no 查、不带基因（全路由）：30 ms
按 order_no 查、从订单号解出基因 + Hint（单分片）：12 ms
```

我得承认，这几个数字我不太敢下结论。跑了几次，按 `user_id` 查从 14 ms 到 33 ms 都有过，全路由从 10 ms 到 40 ms，Hint 稳定在十毫秒上下，抖动比差距还大——跨公网的 RTT 把这几十毫秒的小查询完全盖住了。并发那组（16 个线程各查 20 次）也一样：

```text
  带基因 + Hint（钉在一个分片）：971 ms，失败 0 次
  不带基因（ds_0、ds_1 各一条 UNION ALL，结果在内存里合并）：886 ms，失败 0 次
```

全路由反而快一点，因为两个分片各 5 个连接的池子是瓶颈，单次查询省下来的那点时间被线程排队吃掉了。

那全路由到底贵在哪？贵在它占的连接数。一条逻辑 SQL 要同时占用 `ds_0`、`ds_1` 各一个连接，QPS 一高，连接池先被打满，后面排队的请求全线变慢。这个代价在压测里才会露出来，在我这台远程机器的小并发下反而不明显。

### 把分片键塞进订单号

既然客服手上只有订单号，那就把分片信息编进订单号里：

```java
// src/main/java/com/jayczee/shardingdemo/order/OrderNoGenerator.java
/**
 * 订单号 = SO + 时间(14) + 分片基因(1) + 序列(4)。
 *
 * 为什么要塞一个分片基因：客服/运营只有订单号，没有 user_id，
 * 想在分片库上按订单号查单笔订单，得从订单号里把分片位解出来。
 */
public String next(long userId) {
    String time = LocalDateTime.now().format(TIME);
    int gene = ShardRouter.geneOf(userId);      // user_id % 4
    int seq = Math.floorMod(sequence.getAndIncrement(), 10_000);
    return "SO%s%d%04d".formatted(time, gene, seq);
}
```

查的时候把基因解出来，用 Hint 直接钉到那一个分片上：

```java
// src/main/java/com/jayczee/shardingdemo/repo/OrderRepository.java
/** 有分片基因：用 Hint 把查询钉在分片基因对应的那一个分片上。 */
public List<OrderRecord> findByOrderNoWithHint(String orderNo, int gene) {
    try (HintManager hintManager = HintManager.getInstance()) {
        hintManager.addDatabaseShardingValue("t_order", gene);
        hintManager.addTableShardingValue("t_order", gene);
        return jdbc.query("select " + COLUMNS + " from t_order where order_no = ?", MAPPER, orderNo);
    }
}
```

`SO2026091018141200002` 里第 17 位那个 `0` 就是基因，`geneOf` 把它解出来，查询从「两条 SQL、四个分片」变回「一条 SQL、一个分片」。

Hint 还有个容易被忽略的地方：它能生效的前提是你自己知道该去哪个分片。我一开始想用它做 `update`，写法是 `update t_order set status = ? where order_no = ?` 加个 Hint，结果不生效——因为 SQL 里没有分片键，中间件在 Hint 之外还要靠解析 SQL 拿分片条件。把条件补上才行：

```java
jdbc.update("update t_order_event set status = 'DONE', update_time = now(3) where user_id = ? and id = ?", userId, id);
```

## 八、坑三：跨分片的分页

业务后台的列表页总是要分页的，而分页里最常见的写法是 `limit 20 offset N`。在单表上这没什么，在分片表上就变成了每个分片都 `limit 20 offset N`，然后归并排序：

```java
public List<Long> pageIdsByIdDesc(int offset, int size) {
    return jdbc.queryForList("select id from t_order order by id desc limit ? offset ?", Long.class, size, offset);
}
```

```text
========== 第五阶段：跨分片分页 ==========
单库单表：第一页 12 ms，最后一页（offset 199984）126 ms
四个分片：第一页 95 ms，最后一页（offset 199984）794 ms
换成游标分页（where id < 上一页最后一个 id）：73 ms
如果是按 user_id 查自己的订单（只用查一个分片）：17 ms
```

几件事：

- 第一页慢，是因为四个分片要各查一次，再在内存里排序取前 20 条。单表 12 毫秒的事，分片之后 95 毫秒，八倍；
- 深分页更贵，794 毫秒。`offset` 越大，每个分片都要多丢一批数据，然后才发现自己不需要；
- 游标分页（`where id < ?`）回到 73 毫秒，因为它不需要「跳过」——这是分片表上最该用的翻页方式；
- 如果分页条件是「某个用户的订单」，那 17 毫秒就回来了，因为查询只用去一个分片。

所以后台列表页的排序和筛选条件，最后还是要落到分片键上。做不到的话，游标分页是退而求其次的选择，实在不行就得把这份列表单独做一张宽表或者丢到 ES 里。

## 九、坑四：跨分片的 JOIN

订单和明细是两张表，都按 `user_id` 分片，用同样的表达式。这种关系在 ShardingSphere 里叫绑定表：

```yaml
bindingTables:
  - t_order,t_order_item
```

配了绑定表之后，两张表的同一个分片键进同一个分片，「订单 JOIN 明细」就不会变成笛卡尔积。我一开始以为配完就万事大吉，实测才发现这里面还有一层。

先是一个跟分片没关系、但只有接上中间件才会遇到的报错：

```text
========== 第六阶段：跨分片 JOIN ==========
订单 + 明细（绑定表，分片键相同）：
  concat 里带数字列，解析失败 -> At line 0, column 0: No match found for function signature concat(<CHARACTER>, <CHARACTER>, <CHARACTER>, <CHARACTER>, <NUMERIC>)
  数字列取回 Java 再拼：[SO2026091018154200000 / SKU-05 x2, SO2026091018154400001 / SKU-05 x2, ...]
```

```sql
select concat(o.order_no, ' / ', i.sku, ' x', i.count)
from t_order o join t_order_item i on o.order_no = i.order_no
where o.user_id = ?
```

`concat` 的最后一个参数是 `int`，中间件拦下了这条 SQL，说找不到 `concat(<CHARACTER>, <CHARACTER>, <CHARACTER>, <CHARACTER>, <NUMERIC>)` 这个函数签名。我把数字列改成取回 Java 再拼就好了。同一份 SQL 直接拿到 MySQL 上跑是没问题的——**SQL 穿过中间件的时候会被重新解析一次，解析器的宽容度和数据库本身不一样**，字符串函数、日期函数、自定义函数都容易在这里踩到。

如果就这样，绑定表算是有用。但默认配置下还有第二层：我打开 SQL Federation（跨库查询的内存计算）时，这条 JOIN 没走绑定表，而是被交给了 Federation 引擎：

```text
EnumerableScan(table=[[logic_db, t_order]], sql=[SELECT * FROM `logic_db`.`t_order` WHERE `user_id` = ?])
EnumerableScan(table=[[logic_db, t_order_item]], sql=[SELECT * FROM `logic_db`.`t_order_item`])
```

注意第二行：明细表那一侧没有 `where`，整张表都要拉出来。我这个 Demo 里 `t_order_item` 只有 9 行（迁移那一步只搬了订单表，明细是后来下单时写进去的），所以看不出代价；真实项目里明细和订单是一个量级，这一下就是把所有分片上的明细全扫一遍，再在内存里和订单表做 hash join。

关掉 Federation 再跑同一条查询，它才会老老实实按绑定表路由到一个分片：

```text
Actual SQL: ds_0 ::: select o.order_no, i.sku, i.count from t_order_0 o join t_order_item_0 i on ...
```

所以绑定表能不能省事，取决于这条查询是被路由改写掉，还是被交给 Federation 引擎去算。这个边界我没能一眼看出来，是盯着执行计划才发现的。

### 两张表的分片键不一样

换一组更麻烦的：库存表 `t_stock` 按 `sku` 分片（同一个 SKU 的库存必须在一个库里，不然扣减要跨库），订单按 `user_id` 分片。这两条线没关系，于是 `t_order JOIN t_stock` 就是一次真正的跨分片 JOIN。

```text
========== 第六阶段（坑）：分片键不同的两张表 JOIN ==========
订单在 sdemo_0.t_order_0（按 user_id），SKU-05 的库存在 sdemo_1.t_stock（按 sku）
sqlFederation = true（环境变量 SHARDING_SQL_FEDERATION_ENABLED 控制）
  查到 1 行：[{order_no=SO2026091018191600000, sku=SKU-05, available=1000}]
  耗时 648 ms
```

开了 Federation 能查到，但 648 毫秒。这条查询只返回一行，执行计划里两边也都带上了过滤条件，说明时间大部分花在 Federation 的解析和规划上（它得先把整条 SQL 变成执行计划，再在内存里 join），而且跨库之后用不上数据库自己的索引。把 Federation 关掉，同一条 SQL 直接失败：

```text
sqlFederation = false
  查询失败 -> Table 'sdemo_1.t_order' doesn't exist
  耗时 138 ms
```

这条报错挺有意思：`sdemo_1` 库里确实没有 `t_order` 这张表（它只有 `t_order_0`、`t_order_1`），说明中间件把订单表的原样名字拿到了另一个库上去执行。它提示的其实是路由没算明白，只不过报出来的信息是表不存在。

试过这一组之后，我对「分片键怎么选」有了具体的感受：订单和库存这两张表，只要业务上真的有 JOIN 或者事务上的关系，分片键就得往一个方向靠。靠不上的地方（比如这里按 SKU 查库存、按用户查订单），就得接受它是两条线，用别的方式把数据凑到一起，而不是指望中间件帮你算。

### 广播表：两边都要用的小表

字典表是个例外。它数据量小、改动少、到处都要 JOIN，这种表配成广播表：

```yaml
  - !BROADCAST
    tables:
      - t_dict
```

写一条，每个库里都有一份：

```text
广播表写入（每个库都写一份）：
Actual SQL: ds_1 ::: insert into t_dict ... ::: [join-demo, 广播表演示]
Actual SQL: ds_0 ::: insert into t_dict ... ::: [join-demo, 广播表演示]
  sdemo_0.t_dict -> [{dict_key=join-demo, dict_value=广播表演示}]
  sdemo_1.t_dict -> [{dict_key=join-demo, dict_value=广播表演示}]
```

代价是每次写都要写 N 个库。数据量大了、写得频繁了就不合适。它适合的是那种一年改两次、天天被 JOIN 的表。

## 十、坑五：一个事务跨两个库，会写完一半

最麻烦的一类问题出现在写操作上。下单要同时做两件事：给用户建订单（按 `user_id` 分片），扣库存（按 `sku` 分片）。这两件事天然落在不同的库。

我先写了个错得最典型的版本，两段分别提交：

```java
OrderRecord order = orderService.createOrderOnly(userId, "SKU-07", 2);   // 订单先提交了
boolean locked = orderService.lockStock("SKU-07", 2);                   // 库存在另一个库
```

```text
========== 第七阶段（坑）：跨分片写，两段提交 ==========
订单已经提交：SO2026091018203810005
库存扣减：失败（库存不足）
两边对不上：订单在，库存没动。用户看到订单，仓库没扣货
```

这是最难受的一类脏数据：用户那边一切正常，仓库那边账不对，而且没有任何报错——因为两段代码各自都成功了。

### 放进一个事务里

那把它们塞进同一个事务呢？

```java
// src/main/java/com/jayczee/shardingdemo/service/OrderService.java
/** 演示用：跨分片的一个事务里，订单和库存一起写。 */
@Transactional
public OrderRecord createOrderWithStockInOneTransaction(long userId, String sku, int count) {
    OrderRecord order = createOrderOnly(userId, sku, count);
    if (!lockStock(sku, count)) {
        throw new IllegalStateException("库存不足：" + sku);
    }
    return order;
}
```

```text
========== 第七阶段（解）：把两个写放进同一个逻辑事务 ==========
库存扣减抛异常：库存不足：SKU-08
订单数：200006 -> 200006（异常回滚，订单没有留下来）
```

回滚是对的，订单没留下。但这个正确性是有代价的：ShardingSphere 在这里用的是两阶段提交（XA），要协调多个数据源的事务，期间要锁资源、要写日志，性能和可用性都比单库事务差一截。在我这个 Demo 里它看起来很好用，是因为我只有两个库、没有真实并发，也没模拟协调者挂掉。

### 换成本地消息表

真实项目里我选的是另一条路：让需要一起成功的东西落在同一个分片里，剩下的用消息表补偿。

订单表和消息表用同一个分片键，同一个事务里一次写进去：

```java
@Transactional
public OrderRecord placeOrder(long userId, String sku, int count) {
    String orderNo = orderNoGenerator.next(userId);
    orderRepository.insertWithGeneratedId(orderNo, userId, sku, count, amount, "UNPAID");
    OrderRecord order = orderRepository.findByUserAndOrderNo(userId, orderNo).orElseThrow();
    orderItemRepository.insert(orderNo, order.id(), userId, sku, count, PRICE_FEN);
    outboxRepository.append(orderNo, userId, sku, count);      // 消息和订单在同一个分片
    return order;
}

/** 后台任务：把待处理消息里的库存扣掉，失败就重试。 */
public int processStockEvents(int limit) {
    for (Map<String, Object> event : outboxRepository.listPending(limit)) {
        long id = ((Number) event.get("id")).longValue();
        long userId = ((Number) event.get("user_id")).longValue();
        String sku = (String) event.get("sku");
        int count = ((Number) event.get("count")).intValue();
        int retryCount = ((Number) event.get("retry_count")).intValue();
        if (lockStock(sku, count)) {
            outboxRepository.markDone(userId, id);
        } else {
            outboxRepository.markFailed(userId, id, retryCount + 1);
        }
    }
}
```

订单和消息在同一个库的一个事务里落盘，所以「订单存在」和「有一条待扣库存的消息」这两件事不会只发生一半。库存扣减交给后台任务，失败了就重试：

```text
========== 第七阶段（最终版）：同分片消息表 + 补偿重试 ==========
下单成功：SO2026091018203930006（订单、明细、消息在同一个分片里一次提交）
待处理消息：3 条
第一次扣库存失败，消息还在等重试：PENDING 1 条
  库存：[{sku=SKU-09, available=0, locked=0}]
补上库存后重试：PENDING 0 条
  库存：[{sku=SKU-09, available=98, locked=2}]
```

代价很直白：下单成功的时候库存还没扣，中间有一段时间数据是「不对」的，靠重试把它追平。所以这套东西必须配三样：消息表要有状态可查（PENDING / DONE / FAILED）、重试次数要封顶（不然死循环）、库存扣减本身要幂等（重试两次不能扣两次）。

还有一个细节：后台扫消息表的那个查询没有分片键，注定是全路由。所以这类任务要限流、错峰，别在大促的时候跟主流程抢连接。

## 十一、坑六：动了分片键的 update

这个问题出现的时候很直觉，解决起来很别扭。

需求是「把订单从 A 用户转到 B 用户」（或者更常见的：数据修错了个 user_id，要改回去）。第一反应就是：

```java
jdbc.update("update t_order set user_id = ?, update_time = now(3) where id = ?", newUserId, id);
```

```text
订单 SO2026091018204000012 落在 sdemo_0.t_order_0
通过 ShardingSphere 更新分片键：被拦住了 -> PreparedStatementCallback; SQL [update t_order set user_id = ?, update_time = now(3) where id = ?]; Can not update sharding value for table 't_order'.
```

中间件直接拦下了。这个拦截是对的：这条更新的条件里只有 `id`，没有分片键，路由到哪个分片都不确定，万一改了分片键，还得把整行从旧分片搬到新分片，那是一次「删除 + 插入」，中间件不做这种事。

那绕过中间件，直接在主库上改呢？一个 DBA 手工修数据、一个老系统的双写任务、一个离线脚本，都可能这么干。结果是这行数据在分片体系里消失了：

```text
绕过中间件、直接 update 物理表之后再查：
  用新 user_id=4097 查（sdemo_1.t_order_0）：找不到
  用老 user_id=4096 查（sdemo_0.t_order_0）：找不到
  按主键全路由查：[{id=1304873311431299072, order_no=SO2026091018204000012, user_id=4097}]
  直连老分片看：[{id=1304873311431299072, order_no=SO2026091018204000012, user_id=4097}]
```

数据行实际躺在 `sdemo_0.t_order_0`（老分片），但 `user_id` 已经改成了 4097。于是：

- 按新的 `user_id=4097` 查，路由去 `sdemo_1.t_order_0`，那里没有这行；
- 按老的 `user_id=4096` 查，路由去 `sdemo_0.t_order_0`，但 SQL 里带了 `where user_id = 4096`，数据库自己把它过滤掉了；
- 只有不带分片键的全路由查询，把四个分片都扫一遍才捞得出来。

这大概是分库分表里最难排查的一类问题：数据没丢，物理上明明在，业务上就是查不到，日志里也不报错。正确做法只有一条——**改分片键要走「读出来、删掉、按新键重新插入」的迁移流程**，而不是一条 `update`。真要允许在线改，就得自己实现一套搬数据的逻辑，这也是为什么很多公司的规范里直接写「分片键一旦写入不允许修改」。

## 十二、坑七：聚合函数被中间件吃掉了

这个是最后才发现的，因为它不报错，只是结果不对。

后台报表要统计总金额，我顺手写了个 `coalesce` 兜底：

```sql
select coalesce(sum(amount_fen), 0) from t_order
```

```text
  select count(*) from t_order -> [{count(*)=200005}]
  select sum(amount_fen) from t_order -> [{sum(amount_fen)=10199938000}]
  select coalesce(sum(amount_fen), 0) from t_order -> [{coalesce(sum(amount_fen), 0)=2599973000}, {coalesce(sum(amount_fen), 0)=2600023000}, {coalesce(sum(amount_fen), 0)=2499934000}, {coalesce(sum(amount_fen), 0)=2500008000}]
  select status, count(*) from t_order group by status -> [{status=CANCELED, count(*)=20000}, {status=PAID, count(*)=59999}, {status=UNPAID, count(*)=120006}]
```

一行变四行。中间件只认得两层结构里的 `sum`，外面套的 `coalesce` 它不当作聚合函数，于是每个分片算自己的 `sum`，再把四行原样返回——四行加起来正好是对的，但业务代码拿到的是一个四行的结果集，取第一行就少算了四分之三。

去掉 `coalesce`，写裸的 `sum(amount_fen)` 就正常归并了。`group by` 也没问题，`status` 三个分组的值加起来正好是总行数。

这件事的教训跟 SQL 兼容性那个坑是同一类：**中间件对 SQL 的识别能力，比数据库本身窄**。聚合函数外面套一层别的函数、`select` 里塞自定义函数、`union` 里混不同的排序，都属于「数据库能跑、中间件不一定」。迁移的时候这类 SQL 不会报错，只会悄悄给你一个错的结果，报表上少了几千块，可能要等到月底对账才发现。

## 十三、扩容：分片数改一次要搬多少数据

分片键的表达式里写死了取模的底数（`user_id % 4`），这个数字一旦定下来，想改就得搬数据。到底搬多少，跑一下就知道：

```text
========== 第九阶段：扩容时要搬多少数据 ==========
拿现有 200,002 条订单的 user_id 算一遍：
  4 片 -> 8 片（双倍扩容，user_id % 8）：搬走 100,000 / 200,002（50%）
  4 片 -> 4+1=5 片（直接改分片数，user_id % 5）：搬走 160,000 / 200,002（80%）
  4 片 -> 16 片（user_id % 16）：搬走 150,000 / 200,002（75%）
```

- 4 片扩到 8 片，一半数据要动。原因是取模的底数翻倍之后，原来落在一个片上的用户会被重新分成两拨：比如原来 `user_id % 4 = 0` 的那批人，一半留在第 0 片，另一半变成第 4 片；
- 4 片扩到 16 片，四分之三要动；
- 最贵的是 4 片直接加到 5 片，80% 的数据要搬——因为 `% 4` 和 `% 5` 几乎没有任何对应关系，等于全部重算。

所以扩容一般按倍数来（4 → 8 → 16），一次搬一半。要是业务量真的能撑到那一天，更省事的做法是一开始就多分（比如 32 片），哪怕初期每个片都是空的，也比日后搬数据便宜。这个计算在 Demo 里就是一个取模的循环，跑起来不到一秒，但它决定了未来某一天要不要停机搬数据。

## 十四、回过头看

做完这轮，有几件事跟我一开始的预期不一样。

**分片键比中间件重要**。我一开始把注意力放在「怎么配 ShardingSphere」上，后来发现配错的地方都能改，真正难改的是分片键选得不好：按 `user_id` 分订单、按 `sku` 分库存，两条线没关系，JOIN 和事务就都别扭。选分片键的时候要问的不是「这个字段均匀吗」，而是「后面所有的查询和写入，是不是都能带着它」。

**「能查到」和「查得快」是两件事**。全路由能查到，Federation 也能查到，跨分片的事务也能回滚，功能上都是通的。但每一条都有代价：多占连接、全量拉数据、两阶段提交。功能验证通过不代表这个设计能用，得看它在高并发下占了多少资源。

**中间件是个比数据库更挑剔的解析器**。`coalesce(sum(...))` 返回四行、`concat` 里带数字报函数签名不匹配、跨库 JOIN 报「表不存在」——这三个问题的共同点是，SQL 本身在 MySQL 上完全合法。所有穿过中间件的 SQL，都得按中间件的规则再验一遍，尤其是那些平时不太写、从别处复制来的复杂 SQL。

**存量迁移是个独立的工程**。写代码迁数据不难，难的是保证它对：水位怎么记、增量怎么追、怎么校验、断了怎么重跑。我在这上面花的时间比配置分片规则多得多，那个时区问题更是查了半天。真实项目里这一段通常还要配双写开关、灰度切读，比 Demo 复杂一个量级。

最后，分库分表到底该不该做，这几天我的感受是：先别做。Demo 里 20 万行的 `count(*)` 是 100 毫秒，加个索引 1.7 秒，我一开始的目标（把几千万行的表变快）和分库分表能解决的问题之间，还隔着索引优化、读写分离、归档冷数据、缓存这几步。这些手段能撑到几千万行，而且改错了能退回来。分库分表一旦上了，分片键、路由规则、跨片查询这些东西就跟着项目一辈子，退回去要搬一次全量数据。

真到了必须分的时候，上面这些坑一个都躲不过。所以我把它们写成了一个能跑的项目，`mvn test` 会把每个阶段重新跑一遍，日志里该有的 SQL 和数字都在。

有写错的地方，欢迎联系指正。
