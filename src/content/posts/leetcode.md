---
title: LeetCode 面试经典 150 题题解
published: 2025-02-25
updated: 2026-05-27
description: 精选 LeetCode 面试经典 150 题核心题解合集，涵盖数组、双指针、滑动窗口、贪心与动态规划等核心考点，包含详细解题思路与 Java 代码实现。题目与题解分离，支持折叠展开阅读。
category: 算法题解
tags:
  - LeetCode
  - 算法
  - Java
  - 双指针
  - 动态规划
  - 滑动窗口
draft: false
---

> 本文系统整理了 **LeetCode 面试经典 150 题**（Top Interview 150）的核心题解，包含原题链接、题目描述、边界示例、解题思路与标准 Java 代码实现。
> 
> 💡 **阅读指南**：为方便自测与独立思考，每一题的题解思路与代码**默认折叠隐藏**。你可以通过右侧目录快速跳转至对应题目，阅读题意与示例后，点击「💡 查看题解与代码实现」展开对照学习。

---

## 01. LeetCode 88：合并两个有序数组

#### 🔗 原题链接

[合并两个有序数组](https://leetcode.cn/problems/merge-sorted-array/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📝 合并两个有序数组

给定两个按 **非递减顺序** 排列的整数数组 `nums1` 和 `nums2`，另有两个整数 `m` 和 `n`，分别表示 `nums1` 和 `nums2` 中的元素数目。

请你 **合并** `nums2` 到 `nums1` 中，使合并后的数组同样按 **非递减顺序** 排列。

> **注意：** 最终，合并后数组不应由函数返回，而是存储在数组 `nums1` 中。为了应对这种情况，`nums1` 的初始长度为 `m + n`，其中前 `m` 个元素表示应合并的元素，后 `n` 个元素为 0，应忽略。`nums2` 的长度为 `n`。

#### 📊 示例

##### 示例 1

**输入：**

```plaintext
nums1 = [1, 2, 3, 0, 0, 0], m = 3
nums2 = [2, 5, 6], n = 3
```

**输出：**

```plaintext
[1, 2, 2, 3, 5, 6]
```

**解释：** 需要合并 `[1, 2, 3]` 和 `[2, 5, 6]`。合并结果是 `[1, 2, 2, 3, 5, 6]`，其中斜体加粗标注的为 `nums1` 中的元素。

##### 示例 2

**输入：**

```plaintext
nums1 = [1], m = 1
nums2 = [], n = 0
```

**输出：**

```plaintext
[1]
```

**解释：** 需要合并 `[1]` 和 `[]`。合并结果是 `[1]`。

##### 示例 3

**输入：**

```plaintext
nums1 = [0], m = 0
nums2 = [1], n = 1
```

**输出：**

```plaintext
[1]
```

**解释：** 需要合并的数组是 `[]` 和 `[1]`。合并结果是 `[1]`。注意，因为 `m = 0`，所以 `nums1` 中没有元素。`nums1` 中仅存的 0 仅仅是为了确保合并结果可以顺利存放到 `nums1` 中。

#### 🔍 提示

- `nums1.length == m + n`
- `nums2.length == n`
- `0 <= m, n <= 200`
- `1 <= m + n <= 200`
- `-10^9 <= nums1[i], nums2[j] <= 10^9`

#### 🚀 进阶

你可以设计实现一个时间复杂度为 O(m + n) 的算法解决此问题吗？

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💡 思路

l为`nums1`的有效元素末尾，r为`nums2`有效元素末尾，cur为`nums1`整个数组的末尾。当`nums1`和`nums2`都有元素时，即`l>=0`且`r>=0`时，比较`nums1[l]`和`nums2[r]`的大小，将其更大值放入`nums1[cur]`。并移动相关指针。当`nums1`没有元素，但`nums2`还有时，直接将`nums2`剩余元素放入`nums1`中`cur`及`cur`之前的位置。当`nums1`剩余元素，`nums2`没元素时，此时排序已经完成，直接不处理，返回即可。

#### 💻 代码实现

```java
public void merge(int[] nums1, int m, int[] nums2, int n) {
    int l = m - 1, r = n - 1, cur = m + n - 1;
    while (l >=0 && r >= 0) {
        if (nums1[l] >= nums2[r]) {
            nums1[cur] = nums1[l];
            l--;
        } else {
            nums1[cur] = nums2[r];
            r--;
        }
        cur--;
    }
    while(r>=0){
        nums1[cur] = nums2[r];
        r--;
        cur--;
    }
}
```

</details>

---

## 02. LeetCode 27：移除元素

#### 🔗 相关链接

[移除元素](https://leetcode.cn/problems/remove-element/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 题目描述

给定一个数组 `nums` 和一个值 `val`，需要 **原地** 移除所有数值等于 `val` 的元素。元素的顺序可能发生改变。然后返回 `nums` 中与 `val` 不同的元素的数量。

假设 `nums` 中不等于 `val` 的元素数量为 `k`，需要执行以下操作：

1. 更改 `nums` 数组，使 `nums` 的前 `k` 个元素包含不等于 `val` 的元素。
2. `nums` 的其余元素和 `nums` 的大小并不重要。
3. 返回 `k`。

#### 🧪 用户评测

评测机将使用以下代码测试解决方案：

```java
int[] nums = [...]; // 输入数组
int val = ...; // 要移除的值
int[] expectedNums = [...]; // 长度正确的预期答案。
// 它以不等于 val 的值排序。

int k = removeElement(nums, val); // 调用你的实现

assert k == expectedNums.length;
sort(nums, 0, k); // 排序 nums 的前 k 个元素
for (int i = 0; i < actualLength; i++) {
    assert nums[i] == expectedNums[i];
}
```

如果所有的断言都通过，解决方案将会通过。

#### 📊 示例

##### 示例 1

**输入：**

```plaintext
nums = [3,2,2,3], val = 3
```

**输出：**

```plaintext
2, nums = [2,2,,]
```

**解释：** 
函数应返回 `k = 2`，并且 `nums` 中的前两个元素均为 `2`。返回的 `k` 个元素之外留下的内容并不重要（因此它们并不计入评测）。

##### 示例 2

**输入：**

```plaintext
nums = [0,1,2,2,3,0,4,2], val = 2
```

**输出：**

```plaintext
5, nums = [0,1,4,0,3,,]
```

**解释：** 
函数应返回 `k = 5`，并且 `nums` 中的前五个元素为 `0,1,4,0,3`。注意这五个元素可以任意顺序返回。返回的 `k` 个元素之外留下的内容并不重要（因此它们并不计入评测）。

#### 📝 提示

- `0 <= nums.length <= 100`
- `0 <= nums[i] <= 50`
- `0 <= val <= 100`

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💡 思路

使用快慢指针，两个指针都从头部开始遍历，慢指针指向当前位置，快指针指向扫描位置。快指针循环向前移动并比较当前位置的值是否等于移除值，若是则跳过，若不是则把当前位置值设置为扫描值，并把有效长度 +1。

#### 💻 代码实现

```java
int slow = 0;
int fast = 0;
int length = 0;
while (fast < nums.length) {
    if (nums[fast] != val) {
        nums[slow] = nums[fast];
        length++;
        slow++;
    }
    fast++;
}
return length;
```

</details>

---

## 03. LeetCode 26：移除有序数组中的重复项

#### 🔗 相关链接

[移除有序数组中的重复项](https://leetcode.cn/problems/remove-duplicates-from-sorted-array/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 题目描述

给定一个 **非严格递增排列** 的数组 `nums`，需要 **原地** 删除重复出现的元素，使每个元素只出现一次，返回删除后数组的新长度。元素的相对顺序应该保持一致。然后返回 `nums` 中唯一元素的个数。

考虑 `nums` 的唯一元素的数量为 `k`，需要执行以下操作：

1. 更改数组 `nums`，使 `nums` 的前 `k` 个元素包含唯一元素，并按照它们最初在 `nums` 中出现的顺序排列。
2. `nums` 的其余元素与 `nums` 的大小不重要。
3. 返回 `k`。

#### 🧪 判题标准

系统会用下面的代码来测试题解：

```java
int[] nums = [...]; // 输入数组
int[] expectedNums = [...]; // 长度正确的期望答案

int k = removeDuplicates(nums); // 调用

assert k == expectedNums.length;
for (int i = 0; i < k; i++) {
    assert nums[i] == expectedNums[i];
}
```

如果所有的断言都通过，那么题解将会通过。

#### 📊 示例

##### 示例 1

**输入：**

```plaintext
nums = [1,1,2]
```

**输出：**

```plaintext
2, nums = [1,2,_]
```

**解释：** 
函数应返回新的长度 `2`，并且原数组 `nums` 的前两个元素被修改为 `1, 2`。不需要考虑数组中超出新长度后面的元素。

##### 示例 2

**输入：**

```plaintext
nums = [0,0,1,1,1,2,2,3,3,4]
```

**输出：**

```plaintext
5, nums = [0,1,2,3,4]
```

**解释：** 
函数应返回新的长度 `5`，并且原数组 `nums` 的前五个元素被修改为 `0, 1, 2, 3, 4`。不需要考虑数组中超出新长度后面的元素。

#### 📝 提示

- `1 <= nums.length <= 3 * 10^4`
- `-10^4 <= nums[i] <= 10^4`
- `nums` 已按 **非严格递增** 排列

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💡 思路

相较于[027 移除元素](#02-leetcode-27移除元素)，该题需要删除有序数组中的重复项，即要删除的元素是动态的，我们可以开辟一个数组，记录某值在之前的记录中是否出现过。其他的思路仍然像[027 移除元素](#02-leetcode-27移除元素)一样。

#### 💻 代码实现

```java
public int removeDuplicates(int[] nums) {
        if (nums.length == 1) {
            return 1;
        }
        boolean[] flag = new boolean[20001];
        int scanIndex = 0;
        int currentIndex = 0;
        int length = 0;
        while (scanIndex < nums.length) {
            if (!flag[nums[scanIndex] + 10000]) {
                nums[currentIndex] = nums[scanIndex];
                flag[nums[scanIndex] + 10000] = true;
                length++;
                currentIndex++;
            }
            scanIndex++;
        }
        return length;
    }
```

</details>

---

## 04. LeetCode 80：移除有序数组中的重复项 II

#### 🔗 相关链接

[移除有序数组中的重复项 II](https://leetcode.cn/problems/remove-duplicates-from-sorted-array-ii/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 题目描述

给定一个有序数组 `nums`，需要 **原地** 删除重复出现的元素，使得出现次数超过两次的元素只出现两次，返回删除后数组的新长度。不要使用额外的数组空间，必须在 **原地** 修改输入数组，并在使用 O(1) 额外空间的条件下完成。

##### 说明

为什么返回数值是整数，但输出的答案是数组呢？

请注意，输入数组是以「引用」方式传递的，这意味着在函数里修改输入数组对于调用者是可见的。

可以想象内部操作如下：

```java
// nums 是以“引用”方式传递的。也就是说，不对实参做任何拷贝
int len = removeDuplicates(nums);

// 在函数里修改输入数组对于调用者是可见的。
// 根据你的函数返回的长度, 它会打印出数组中该长度范围内的所有元素。
for (int i = 0; i < len; i++) {
    print(nums[i]);
}
```

#### 📊 示例

##### 示例 1

**输入：**

```plaintext
nums = [1,1,1,2,2,3]
```

**输出：**

```plaintext
5, nums = [1,1,2,2,3]
```

**解释：** 
函数应返回新长度 `length = 5`，并且原数组的前五个元素被修改为 `1, 1, 2, 2, 3`。不需要考虑数组中超出新长度后面的元素。

##### 示例 2

**输入：**

```plaintext
nums = [0,0,1,1,1,1,2,3,3]
```

**输出：**

```plaintext
7, nums = [0,0,1,1,2,3,3]
```

**解释：** 
函数应返回新长度 `length = 7`，并且原数组的前七个元素被修改为 `0, 0, 1, 1, 2, 3, 3`。不需要考虑数组中超出新长度后面的元素。

#### 📝 提示

- `1 <= nums.length <= 3 * 10^4`
- `-10^4 <= nums[i] <= 10^4`
- `nums` 已按升序排列

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💡 思路

对比[026 移除有序数组中的重复项](#03-leetcode-26移除有序数组中的重复项)，该题难度上升在不能开辟额外的数组保存某个值是否达到删除的条件。根据题目，每个数字最多可以出现两次，即需要满足条件 `nums[i] == nums[i-1] == nums[i-2]` (i >= 2)。

使用 `while` 循环和快慢指针遍历数组，初始化 `slow` 和 `fast` 为 2（数组长度小于 2 的条件不需要比较，可以直接返回）并比较 `nums[slow-2]` 与 `nums[fast]`，若不同则直接赋值。

`nums[slow-2]` 表示已经被确定需要保留的值，即刚开始 `slow` 和 `fast` 都为 2 时，`0`（`slow-2`）为第一个确定需要保留的元素。若 `nums[slow-2]` 与 `nums[slow-1]` 相同，则 `nums[slow]` 不需要被保留。

:::tip[提示]
**LeetCode官方定义**  
我们定义两个指针 `slow` 和 `fast` 分别为慢指针和快指针，其中慢指针表示处理出的数组的长度，快指针表示已经检查过的数组的长度，即 `nums[fast]` 表示待检查的第一个元素，`nums[slow−1]` 为上一个应该被保留的元素所移动到的指定位置。

因为本题要求相同元素最多出现两次而非一次，所以我们需要检查上上个应该被保留的元素 `nums[slow−2]` 是否和当前待检查元素 `nums[fast]` 相同。当且仅当 `nums[slow−2]=nums[fast]` 时，当前待检查元素 `nums[fast]` 不应该被保留（因为此时必然有 `nums[slow−2]=nums[slow−1]=nums[fast]`）。最后，`slow` 即为处理好的数组的长度。
:::

#### 💻 代码实现

```java
public int removeDuplicates(int[] nums) {
        if (nums.length <= 2) {
            return nums.length;
        }
        int slow = 2, fast = 2;
        while (fast < nums.length) {
            if (nums[slow - 2] != nums[fast]) {
                nums[slow] = nums[fast];
                slow++;
            }
            fast++;
        }
        return slow;
    }
```

</details>

---

## 05. LeetCode 169：多数元素

#### 🔗 相关链接

[多数元素](https://leetcode.cn/problems/majority-element/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 题目描述

给定一个大小为 `n` 的数组 `nums`，返回其中的多数元素。多数元素是指在数组中出现次数 **大于 ⌊ n/2 ⌋** 的元素。

可以假设数组是非空的，并且给定的数组总是存在多数元素。

#### 📊 示例

##### 示例 1

**输入：**

```plaintext
nums = [3,2,3]
```

**输出：**

```plaintext
3
```

##### 示例 2

**输入：**

```plaintext
nums = [2,2,1,1,1,2,2]
```

**输出：**

```plaintext
2
```

#### 📝 提示

- `n == nums.length`
- `1 <= n <= 5 * 10^4`
- `-10^9 <= nums[i] <= 10^9`

#### 🚀 进阶

尝试设计时间复杂度为 O(n)、空间复杂度为 O(1) 的算法解决此问题。

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💡 思路

##### Boyer-Moore 投票算法

引用题解评论区某个老哥的描述：

“同归于尽消杀法”：

由于多数超过50%，比如100个数，那么多数至少51个，剩下少数是49个。

第一个到来的士兵，直接插上自己阵营的旗帜占领这块高地，此时领主 `winner` 就是这个阵营的人，现存兵力 `count = 1`。

如果新来的士兵和前一个士兵是同一阵营，则集合起来占领高地，领主不变，`winner` 依然是当前这个士兵所属阵营，现存兵力 `count++`；

如果新来到的士兵不是同一阵营，则前方阵营派一个士兵和它同归于尽。此时前方阵营兵力 `count--`。（即使双方都死光，这块高地的旗帜 `winner` 依然不变，因为已经没有活着的士兵可以去换上自己的新旗帜）

当下一个士兵到来，发现前方阵营已经没有兵力，新士兵就成了领主，`winner` 变成这个士兵所属阵营的旗帜，现存兵力 `count++`。

就这样各路军阀一直以这种以一敌一同归于尽的方式厮杀下去，直到少数阵营都死光，那么最后剩下的几个必然属于多数阵营，`winner` 就是多数阵营。（多数阵营 51个，少数阵营只有49个，死剩下的2个就是多数阵营的人）

#### 💻 代码实现

```java
public int majorityElement(int[] nums) {
        int cur = 0, count = 0;
        for (int num: nums){
            if (count == 0){
                cur = num;
                count = 1;
            }else if (count > 0 && cur == num){
                count++;
            }else if (count > 0){
                count--;
            }
        }
        return cur;
    }
```

</details>

---

## 06. LeetCode 189：轮转数组

#### 原题链接

[轮转数组](https://leetcode.cn/problems/rotate-array/description/?envType=study-plan-v2&envId=top-interview-150)

#### 问题描述

给定一个整数数组 `nums`，将数组中的元素向右轮转 `k` 个位置，其中 `k` 是非负数。

#### 示例

##### 示例 1

**输入:** 
```plaintext
nums = [1,2,3,4,5,6,7], k = 3
```
**输出:** 
```plaintext
[5,6,7,1,2,3,4]
```
**解释:**
- 向右轮转 1 步: `[7,1,2,3,4,5,6]`
- 向右轮转 2 步: `[6,7,1,2,3,4,5]`
- 向右轮转 3 步: `[5,6,7,1,2,3,4]`

##### 示例 2

**输入:** 
```plaintext
nums = [-1,-100,3,99], k = 2
```
**输出:** 
```plaintext
[3,99,-1,-100]
```
**解释:** 
- 向右轮转 1 步: `[99,-1,-100,3]`
- 向右轮转 2 步: `[3,99,-1,-100]`

#### 提示

- `1 <= nums.length <= 10^5`
- `-2^31 <= nums[i] <= 2^31 - 1`
- `0 <= k <= 10^5`

#### 进阶

尽可能想出更多的解决方案，至少有三种不同的方法可以解决这个问题。你可以使用空间复杂度为 O(1) 的原地算法解决这个问题吗？

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 思路

1. 开辟额外数组空间,复制原数组，再将新数组中的元素放置到原数组下标+k的位置，超出长度从头开始计算。
2. 环状替换，把第n个元素替换到n + k mod nums.length的位置，再将原来（n + k） mod nums.length替换到 （n + k + k）mod nums.length的位置，持续循环。每次替换完回到最初的n时，需要手动将n + 1(通过循环实现)，直到已替换的长度length == nums.length。
3. 数组翻转，先翻转整个数组，再翻转[0,k-1]和[k, nums.length -1]，k = nums.length % k。

#### 代码实现

1. 开辟额外数组空间

```java
public void rotate(int[] nums, int k) {
    int[] arr = Arrays.copyOf(nums, nums.length);
    for (int i = 0 ; i< arr.length;i++){
        int index = i + k >= nums.length? (i + k) % nums.length : i + k;
        nums[index] = arr[i];
    }
}
```

2. 环状替换

```java
public void rotate(int[] nums, int k) {
    int length = 0;
    for (int startLeft = 0; length < nums.length; startLeft++){
        int left = startLeft;
        int right = (left + k) % nums.length;
        int tmp1 = nums[left];
        int tmp2 = nums[right];
        do {
            nums[right] = tmp1;
            tmp1=tmp2;
            left = right;
            right = (left + k) % nums.length;
            tmp2 = nums[right];
            length ++;
        }while(left != startLeft);
    }
}
```

3. 数组反转

```java
public void rotate(int[] nums, int k) {
    int actualK = k % nums.length;
        if (k == 0){
            return;
        }
        reverse(nums,0,nums.length - 1);
        reverse(nums, 0, actualK - 1);
        reverse(nums, actualK, nums.length - 1);
    }

    void reverse(int[] nums, int start, int end) {
        while (start < end) {
            int temp = nums[start];
            nums[start] = nums[end];
            nums[end] = temp;
            start++;
            end--;
        }
    }
```

</details>

---

## 07. LeetCode 121：买卖股票的最佳时机

#### 🔗 相关链接

[买卖股票的最佳时机](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 题目描述

给定一个数组 `prices`，它的第 `i` 个元素 `prices[i]` 表示一支给定股票第 `i` 天的价格。

你只能选择某一天买入这只股票，并选择在未来的某一个不同的日子卖出该股票。设计一个算法来计算你所能获取的最大利润。

返回你可以从这笔交易中获取的最大利润。如果你不能获取任何利润，返回 0 。

#### 📊 示例

##### 示例 1

**输入：** 
```plaintext
[7,1,5,3,6,4]
```
**输出：** 
```plaintext
5
```
**解释：** 
在第 2 天（股票价格 = 1）的时候买入，在第 5 天（股票价格 = 6）的时候卖出，最大利润 = 6 - 1 = 5 。  
注意利润不能是 7 - 1 = 6，因为卖出价格需要大于买入价格；同时，你不能在买入前卖出股票。

##### 示例 2

**输入：** 
```plaintext
prices = [7,6,4,3,1]
```
**输出：** 
```plaintext
0
```
**解释：** 
在这种情况下，没有交易完成，所以最大利润为 0。

#### 📝 提示

- `1 <= prices.length <= 10^5`
- `0 <= prices[i] <= 10^4`

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💡 思路

遍历一遍数组，维护一个历史最低价格，每趟循环计算当前价格减历史最低价格的盈利，若大于之前得出max，则赋值给max。

#### 💻 代码实现

```java
public int maxProfit(int[] prices) {
    if (prices.length == 1) {
        return 0;
    }
    int min = prices[0];
    int max = 0;
    for (int price : prices) {
        if (min > price) {
            min = price;
        }
        max = Math.max(price - min, max);
    }
    return max;
}
```

</details>

---

## 08. LeetCode 122：买卖股票的最佳时机 II

#### 🔗 相关链接

[买卖股票的最佳时机 II](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-ii/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 股票交易最大利润

给定一个整数数组 `prices`，其中 `prices[i]` 表示某支股票第 `i` 天的价格。在每一天，可以决定是否购买和/或出售股票。注意，在任何时候最多只能持有一股股票，也可以选择在同一天买入并出售。

#### 🎯 目标

返回能够获得的最大利润。

#### 📊 示例

##### 示例 1

**输入：**
```plaintext
prices = [7,1,5,3,6,4]
```
**输出：**
```plaintext
7
```
**解释：**
- 在第 2 天（股票价格 = 1）时买入，在第 3 天（股票价格 = 5）时卖出，获得利润 = 5 - 1 = 4。
- 随后，在第 4 天（股票价格 = 3）时买入，在第 5 天（股票价格 = 6）时卖出，获得利润 = 6 - 3 = 3。
- 最大总利润为 4 + 3 = 7。

##### 示例 2

**输入：**
```plaintext
prices = [1,2,3,4,5]
```
**输出：**
```plaintext
4
```
**解释：**
- 在第 1 天（股票价格 = 1）时买入，在第 5 天（股票价格 = 5）时卖出，获得利润 = 5 - 1 = 4。
- 最大总利润为 4。

##### 示例 3

**输入：**
```plaintext
prices = [7,6,4,3,1]
```
**输出：**
```plaintext
0
```
**解释：**
- 在这种情况下，无法获得正利润，因此不参与交易可以获得最大利润，最大利润为 0。

#### 📝 提示

- `1 <= prices.length <= 3 * 10^4`
- `0 <= prices[i] <= 10^4`

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💡 思路

##### 动态规划

由于在任何时候最多只能持有一种股票，那么在第n天交易结束时具有不持有股票和持有股票两种状态，即 `dp[n][0]` 和 `dp[n][1]`。 n从0开始计算。

不持有股票时，截止第n天所能获得的最大利润需要参考前一天的状态：
- 若前一天 `n-1` 持有股票，第n天无股票，则为卖出股票，则 `dp[n][0] = dp[n-1][1] + price[n]`；
- 若前一天 `n-1` 不持有股票，第n天无股票，则为无操作，此时截止第n天所获的利润与第n-1天相同，即 `dp[n][0] = dp[n-1][0]`。

持有股票时：
- 若前一天 `n-1` 持有股票，第n天持有股票，则为无操作，则 `dp[n][1] = dp[n-1][1]`；
- 若前一天 `n-1` 不持有股票，第n天不持有股票，则为买入股票，则 `dp[n][1] = dp[n-1][0] - price[n]`。

综上：
- `dp[n][0] = max(dp[n-1][1] + price[n], dp[n-1][0])`
- `dp[n][1] = max(dp[n-1][0] - price[n], dp[n-1][1])`

算出最后一天的 `dp[n][0]` 即可。

根据定义：`dp[0][0] = 0, dp[0][1] = -price[0]`。

##### 贪心

由于交易次数不受限，所以计算每一个 `price[i] - price[i-1] > 0` 的总和即可。

#### 💻 代码实现

##### 动态规划

```java
public int maxProfit(int[] prices) {
    int[][] dp = new int[prices.length][2];
    for (int i = 0; i < prices.length; i++) {
        if (i == 0) {
            dp[i][0] = 0;
            dp[i][1] = -prices[i];
        } else {
            dp[i][0] = Math.max(dp[i-1][0], dp[i-1][1] + prices[i]);
            dp[i][1] = Math.max(dp[i-1][0] - prices[i], dp[i-1][1]);
        }
    }
    return dp[prices.length - 1][0];
}
```

##### 贪心

```java
public int maxProfit(int[] prices) {
    int sum = 0;
    for (int i = 1; i < prices.length; i++) {
        int res = prices[i] - prices[i - 1];
        if (res > 0) {
            sum += res;
        }
    }
    return sum;
}
```

</details>

---

## 09. LeetCode 55：跳跃游戏

#### 🔗 相关链接

[跳跃游戏](https://leetcode.cn/problems/jump-game/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 题目描述

给定一个非负整数数组 `nums`，最初位于数组的第一个下标。数组中的每个元素代表在该位置可以跳跃的最大长度。

#### 🎯 目标

判断是否能够到达最后一个下标。如果可以，返回 `true`；否则，返回 `false`。

#### 📊 示例

##### 示例 1

**输入：**
```plaintext
nums = [2, 3, 1, 1, 4]
```
**输出：**
```plaintext
true
```
**解释：** 
可以先跳 1 步，从下标 0 到达下标 1，然后再从下标 1 跳 3 步到达最后一个下标。

---

##### 示例 2

**输入：**
```plaintext
nums = [3, 2, 1, 0, 4]
```
**输出：**
```plaintext
false
```
**解释：** 
无论怎样，总会到达下标为 3 的位置。但该下标的最大跳跃长度是 0，因此永远不可能到达最后一个下标。

#### 📝 提示

- `1 <= nums.length <= 10^4`
- `0 <= nums[i] <= 10^5`

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💡 思路

##### 贪心

维护一个与 `nums` 等长的布尔数组，表示每个元素是否可达。遍历一遍 `nums`，根据 `nums` 的值将对应布尔数组的区间更新为 `true`，遍历完成后返回布尔数组最后一个元素的值。若中间可更新区间超过了数组长度末尾，则直接返回 `true`。

#### 💻 代码实现

```java
public boolean canJump(int[] nums) {
    boolean[] arr = new boolean[nums.length];
    arr[0] = true;
    for (int i = 0; i < nums.length; i++) {
        if (!arr[i]) {
            continue;
        }
        int range = nums[i];
        if (i + range >= nums.length - 1) {
            return true;
        }
        for (int j = i; j <= Math.min(i + range, nums.length - 1); j++) {
            arr[j] = true;
        }
    }
    return arr[nums.length - 1];
}
```

</details>

---

## 10. LeetCode 45：跳跃游戏 II

#### 🔗 相关链接

[跳跃游戏 II](https://leetcode.cn/problems/jump-game-ii/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 题目描述

给定一个长度为 `n` 的 0 索引整数数组 `nums`。初始位置为 `nums[0]`。

每个元素 `nums[i]` 表示从索引 `i` 向后跳转的最大长度。换句话说，如果在 `nums[i]` 处，可以跳转到任意 `nums[i + j]` 处，条件如下：

- \(0 \leq j \leq nums[i]\)
- \(i + j < n\)

#### 🎯 目标

返回到达 `nums[n - 1]` 的最小跳跃次数。生成的测试用例可以到达 `nums[n - 1]`。

#### 📊 示例

##### 示例 1

**输入：**
```plaintext
nums = [2, 3, 1, 1, 4]
```
**输出：**
```plaintext
2
```
**解释：** 
跳到最后一个位置的最小跳跃数是 2。
从下标为 0 跳到下标为 1 的位置，跳 1 步，然后跳 3 步到达数组的最后一个位置。

---

##### 示例 2

**输入：**
```plaintext
nums = [2, 3, 0, 1, 4]
```
**输出：**
```plaintext
2
```

#### 📝 提示

- `1 <= nums.length <= 10^4`
- `0 <= nums[i] <= 1000`

**注意**：题目保证可以到达 `nums[n-1]`。

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💡 思路

和[跳跃游戏](#09-leetcode-55跳跃游戏)思路类似，只不过维护一个是否可到达的数组改为维护一个到达此处需要的最少步数的数组。

#### 💻 代码实现

```java
public int jump(int[] nums) {
    if (nums.length == 1) {
        return 0;
    }
    int[] steps = new int[nums.length];
    Arrays.fill(steps, 10001);
    steps[0] = 0;
    for (int i = 0; i < nums.length; i++) {
        int range = nums[i];
        if (i + range >= nums.length - 1) {
            return steps[i] + 1;
        }
        for (int j = i + 1; j <= Math.min(i + range, nums.length - 1); j++) {
            if (steps[j] > steps[i] + 1) {
                steps[j] = steps[i] + 1;
            }
        }
    }
    return steps[nums.length - 1];
}
```

</details>

---

## 11. LeetCode 274：H指数

#### 相关链接

[LeetCode 274 H指数](https://leetcode.cn/problems/h-index/description/?envType=study-plan-v2&envId=top-interview-150)

#### 题目描述

给定一个整数数组 `citations`，其中 `citations[i]` 表示研究者的第 i 篇论文被引用的次数。需要计算并返回该研究者的 h 指数。

#### H 指数定义

根据维基百科上的定义，h 代表“高引用次数”。一名科研人员的 h 指数是指他（她）至少发表了 h 篇论文，并且至少有 h 篇论文被引用次数大于等于 h。如果 h 有多种可能的值，h 指数是其中最大的那个。

#### 示例

##### 示例 1

- **输入**: `citations = [3, 0, 6, 1, 5]`
- **输出**: `3`  
  **解释**: 给定数组表示研究者总共有 5 篇论文，每篇论文相应的被引用了 3, 0, 6, 1, 5 次。由于研究者有 3 篇论文每篇至少被引用了 3 次，其余两篇论文每篇被引用不多于 3 次，所以她的 h 指数是 3。

##### 示例 2

- **输入**: `citations = [1, 3, 1]`
- **输出**: `1`

#### 提示

- `n == citations.length`
- `1 <= n <= 5000`
- `0 <= citations[i] <= 1000`

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 思路

1. 由于数组元素最大值为 1000，从后向前循环遍历数组，每趟计算是否存在大于等于 i 的数字 i 个。
2. 二分查找：设查找范围的初始左边界 `left` 为 0，初始右边界 `right` 为 n。每次在查找范围内取中点 `mid`，同时扫描整个数组，判断是否至少有 `mid` 个数大于 `mid`。如果有，说明要寻找的 h 在搜索区间的右边，反之则在左边。

#### 代码实现

##### 方法 1: 线性扫描

```java
public int hIndex(int[] citations) {
    for (int i = 1000; i >= 0; i--) {
        int finalI = i;
        int res = (int) Arrays.stream(citations).filter(num -> num >= finalI).count();
        if (res >= finalI) {
            return i;
        }
    }
    return 0;
}
```

##### 方法 2: 二分查找

```java
public int hIndex(int[] citations) {
    int left = 0, right = citations.length;
    while (left < right) {
        int mid = (left + right + 1) >> 1;
        int times = 0;
        for (int citation : citations) {
            if (citation >= mid) {
                times++;
            }
        }
        if (times >= mid) {
            left = mid;
        } else {
            right = mid - 1;
        }
    }
    return left;
}
```

</details>

---

## 12. LeetCode 380：O(1)时间插入、删除和获取随机元素

#### 相关链接

[LeetCode 380 O(1)时间插入、删除和获取随机元素](https://leetcode.cn/problems/insert-delete-getrandom-o1/description/?envType=study-plan-v2&envId=top-interview-150)

#### 描述

设计一个 `RandomizedSet` 类，支持以下操作：

- `RandomizedSet()` 初始化 `RandomizedSet` 对象。
- `bool insert(int val)` 当元素 `val` 不存在时，向集合中插入该项，并返回 `true`；否则，返回 `false`。
- `bool remove(int val)` 当元素 `val` 存在时，从集合中移除该项，并返回 `true`；否则，返回 `false`。
- `int getRandom()` 随机返回现有集合中的一项（测试用例保证调用此方法时集合中至少存在一个元素）。每个元素应该有相同的概率被返回。

必须实现类的所有函数，并满足每个函数的平均时间复杂度为 O(1)。

#### 示例

##### 输入

```plaintext
["RandomizedSet", "insert", "remove", "insert", "getRandom", "remove", "insert", "getRandom"]
[[], [1], [2], [2], [], [1], [2], []]
```

##### 输出

```plaintext
[null, true, false, true, 2, true, false, 2]
```

##### 解释

```plaintext
RandomizedSet randomizedSet = new RandomizedSet();
randomizedSet.insert(1); // 向集合中插入 1 。返回 true 表示 1 被成功地插入。
randomizedSet.remove(2); // 返回 false ，表示集合中不存在 2 。
randomizedSet.insert(2); // 向集合中插入 2 。返回 true 。集合现在包含 [1,2] 。
randomizedSet.getRandom(); // getRandom 应随机返回 1 或 2 。
randomizedSet.remove(1); // 从集合中移除 1 ，返回 true 。集合现在包含 [2] 。
randomizedSet.insert(2); // 2 已在集合中，所以返回 false 。
randomizedSet.getRandom(); // 由于 2 是集合中唯一的数字，getRandom 总是返回 2 。
```

#### 提示

- `-231 <= val <= 231 - 1`
- 最多调用 `insert`、`remove` 和 `getRandom` 函数 `2 * 10^5` 次
- 在调用 `getRandom` 方法时，数据结构中至少存在一个元素。

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 思路

用一个 `Map` 存储已有的值（key）和其在 `Stack` 中的下标（value）。
添加时记录当前最后的下标（index）。
删除时查找其下标，与 `Stack` 最后的元素交换，然后通过 `pop` 直接删除元素，`index--`。
随机通过 `Random` 类，传入 `Stack` 的 `size` 进行随机取数。

#### 代码实现

```java
class RandomizedSet {
    private final Map<Integer, Integer> valMap = new HashMap<>();
    private List<Integer> stack = new ArrayList<>();
    private Random random = new Random();

    public RandomizedSet() {
    }

    public boolean insert(int val) {
        if (valMap.containsKey(val)) {
            return false;
        } else {
            stack.add(val);
            valMap.put(val, stack.size() - 1);
            return true;
        }
    }

    public boolean remove(int val) {
        if (valMap.containsKey(val)) {
            int deletedIndex = valMap.get(val);
            int lastElement = stack.get(stack.size() - 1);
            stack.set(deletedIndex, lastElement);
            valMap.put(lastElement, deletedIndex);
            stack.remove(stack.size() - 1);
            valMap.remove(val);
            return true;
        } else {
            return false;
        }
    }

    public int getRandom() {
        return stack.get(random.nextInt(stack.size()));
    }
}
```

</details>

---

## 13. LeetCode 238：除自身以外数组的乘积

#### 📚 相关链接

[LeetCode 238: 除自身以外数组的乘积](https://leetcode.cn/problems/product-of-array-except-self/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📝 题目描述

给定一个整数数组 `nums`，返回数组 `answer`，其中 `answer[i]` 等于 `nums` 中除 `nums[i]` 之外其余各元素的乘积。

**要求：**  
- 不要使用除法，且在 O(n) 时间复杂度内完成此题。

#### 💡 示例

##### 示例 1
**输入:**  
```plaintext
nums = [1, 2, 3, 4]
```
**输出:**  
```plaintext
[24, 12, 8, 6]
```

##### 示例 2
**输入:**  
```plaintext
nums = [-1, 1, 0, -3, 3]
```
**输出:**  
```plaintext
[0, 0, 9, 0, 0]
```

#### ⚠️ 提示
- `2 <= nums.length <= 10^5`
- `-30 <= nums[i] <= 30`
- 输入保证数组 `answer[i]` 在 32 位整数范围内

#### 🔍 进阶
可以在 O(1) 的额外空间复杂度内完成这个题目吗？（出于对空间复杂度分析的目的，输出数组不被视为额外空间。）

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

1. 维护两个数组，一个 `prefix` 一个 `suffix`，使用两个循环填充这两个数组：

   - `prefix[i]` 为第 `i` 个元素之前的所有元素的乘积
   - `suffix[i]` 为第 `i` 个元素之后的所有元素的乘积

   因此，`ans[i] = prefix[i] * suffix[i]`。

2. 进阶实现

   由于输出数组不算额外空间，所以先将 `prefix` 放进 `ans`，再把 `suffix` 乘到 `ans` 上。

#### 💻 代码实现

##### 1. 维护两个数组

```java
public int[] productExceptSelf(int[] nums) {
    if (nums.length == 2) {
        return new int[]{nums[1], nums[0]};
    }

    int[] ans = new int[nums.length];
    int[] pre = new int[nums.length];
    int[] suf = new int[nums.length];

    for (int i = 0; i < nums.length; i++) {
        if (i == 0) {
            pre[i] = 1;
        } else {
            pre[i] = pre[i - 1] * nums[i - 1];
        }
    }

    for (int i = nums.length - 1; i >= 0; i--) {
        if (i == nums.length - 1) {
            suf[i] = 1;
        } else {
            suf[i] = suf[i + 1] * nums[i + 1];
        }
    }

    for (int i = 0; i < nums.length; i++) {
        ans[i] = pre[i] * suf[i];
    }

    return ans;
}
```

##### 2. 动态维护 `suffix` 和 `prefix`

```java
public int[] productExceptSelf(int[] nums) {
    if (nums.length == 2) {
        return new int[]{nums[1], nums[0]};
    }

    int[] ans = new int[nums.length];

    for (int i = 0; i < nums.length; i++) {
        if (i == 0) {
            ans[i] = 1;
        } else {
            ans[i] = ans[i - 1] * nums[i - 1];
        }
    }

    int R = 1;
    for (int i = nums.length - 1; i >= 0; i--) {
        ans[i] *= R;
        R *= nums[i];
    }

    return ans;
}
```

</details>

---

## 14. LeetCode 134：加油站

#### 🚀 相关链接

[LeetCode 134 - 加油站](https://leetcode.cn/problems/gas-station/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

在一条环路上有 `n` 个加油站，其中第 `i` 个加油站有汽油 `gas[i]` 升。

你有一辆油箱容量无限的汽车，从第 `i` 个加油站开往第 `i+1` 个加油站需要消耗汽油 `cost[i]` 升。你从其中的一个加油站出发，开始时油箱为空。

给定两个整数数组 `gas` 和 `cost`，如果可以按顺序绕环路行驶一周，则返回出发时加油站的编号，否则返回 `-1`。如果存在解，则保证它是唯一的。

#### 💡 示例

##### 示例 1
**输入:**  
```plaintext
gas = [1,2,3,4,5], cost = [3,4,5,1,2]
```
**输出:**  
```plaintext
3
```
**解释:**  
从 3 号加油站（索引为 3 处）出发，可获得 4 升汽油。此时油箱有 = 0 + 4 = 4 升汽油  
开往 4 号加油站，此时油箱有 4 - 1 + 5 = 8 升汽油  
开往 0 号加油站，此时油箱有 8 - 2 + 1 = 7 升汽油  
开往 1 号加油站，此时油箱有 7 - 3 + 2 = 6 升汽油  
开往 2 号加油站，此时油箱有 6 - 4 + 3 = 5 升汽油  
开往 3 号加油站，你需要消耗 5 升汽油，正好足够你返回到 3 号加油站。  
因此，3 可为起始索引。

##### 示例 2
**输入:**  
```plaintext
gas = [2,3,4], cost = [3,4,3]
```
**输出:**  
```plaintext
-1
```
**解释:**  
你不能从 0 号或 1 号加油站出发，因为没有足够的汽油可以让你行驶到下一个加油站。  
我们从 2 号加油站出发，可以获得 4 升汽油。此时油箱有 = 0 + 4 = 4 升汽油  
开往 0 号加油站，此时油箱有 4 - 3 + 2 = 3 升汽油  
开往 1 号加油站，此时油箱有 3 - 3 + 3 = 3 升汽油  
你无法返回 2 号加油站，因为返程需要消耗 4 升汽油，但是你的油箱只有 3 升汽油。  
因此，无论怎样，你都不可能绕环路行驶一周。

#### 📝 提示
- `gas.length == n`
- `cost.length == n`
- `1 <= n <= 10^5`
- `0 <= gas[i], cost[i] <= 10^4`

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路
贪心，从头开始遍历每个加油站是否可以走完一轮，若当前加油站走到某个加油站后不能继续往前走时，从停下的加油站继续遍历。  
使用两个循环，外层循环计数 `i`，最大为数组长度 `n`，维护从 `i` 开始总油量 `sumOfGas` 和总消耗 `sumOfCost`；  
内部循环从 `i` 开始，访问 `(i + cur) % n` 下标的元素，更新 `sumOfGas` 和 `sumOfCost`。若前者小于后者，则从 `i` 加油站出发不能走完一趟，从 `i + cur` 开始新一趟循环。

#### 💻 代码实现

```java
public int canCompleteCircuit(int[] gas, int[] cost) {
        int i = 0, n = gas.length;
        while (i < n) {
            int cur = 0;
            int sumOfGas = 0, sumOfCost = 0;
            while (cur < n) {
                int pos = (i + cur) % n;
                sumOfGas += gas[pos];
                sumOfCost += cost[pos];
                if (sumOfGas < sumOfCost) {
                    i += cur;
                    break;
                }
                cur++;
            }
            if (cur == n) {
                return i;
            }
            i++;
        }
        return -1;
    }
```

</details>

---

## 15. LeetCode 135：分发糖果

#### 🚀 相关链接

[LeetCode 135 - 分发糖果](https://leetcode.cn/problems/candy/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

有 `n` 个孩子站成一排。给你一个整数数组 `ratings` 表示每个孩子的评分。你需要按照以下要求，给这些孩子分发糖果：

1. 每个孩子至少分配到 1 个糖果。
2. 相邻两个孩子中，评分更高的孩子会获得更多的糖果。

请你给每个孩子分发糖果，计算并返回需要准备的 **最少糖果数目**。

#### 💡 示例

- **输入**: `ratings = [1,0,2]`
- **输出**: `5`
- **解释**: 你可以分别给第一个、第二个、第三个孩子分发 `2`、`1`、`2` 颗糖果。

##### 示例 2

- **输入**: `ratings = [1,2,2]`
- **输出**: `4`
- **解释**: 你可以分别给第一个、第二个、第三个孩子分发 `1`、`2`、`1` 颗糖果。第三个孩子只得到 `1` 颗糖果，这满足题面中的两个条件。

#### 📝 提示
- `n == ratings.length`
- `1 <= n <= 2 * 10^4`
- `0 <= ratings[i] <= 2 * 10^4`

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

1. 两次遍历。

根据`相邻两个孩子中，评分更高的孩子会获得更多的糖果。`拆分为`左规则`和`右规则`。

- 左规则：当 ratings[i−1] < ratings[i] 时，i 号学生的糖果数量将比 i−1 号孩子的糖果数量多。

- 右规则：当 ratings[i] > ratings[i+1] 时，i 号学生的糖果数量将比 i+1 号孩子的糖果数量多。

先遍历一次数组，计算出满足左规则时，每个孩子分到的最少糖果数量。然后再遍历一次，计算满足右规则时，每个孩子需要分到的最少糖果数量，则位置i的孩子分到的糖果数量为min(left[i],right[i])。

2. 常数空间遍历。
将ratings分为升序序列和降序序列，遵循以下规则：
- 如果当前孩子比前一个孩子评分高，则认为当前处于升序序列中，分发的糖果比前一个孩子多1个。
- 否则就认为当前在降序序列中，直接给当前孩子分1个糖果，同时记录当前降序序列长度，降序序列中前面每个孩子都要再+1个糖果。（即总糖果数加一个降序序列长度）

#### 💻 代码实现

1. 两次遍历

```java
    public int candy(int[] ratings) {
        int[] left = new int[ratings.length];
        for (int i = 0; i < ratings.length; i++) {
            if (i > 0 && ratings[i] > ratings[i - 1]) {
                left[i] = left[i - 1] + 1;
            } else {
                left[i] = 1;
            }
        }
        int right = 0, sum = 0;
        for (int i = ratings.length - 1; i >= 0; i--) {
            if (i < ratings.length - 1 && ratings[i] > ratings[i + 1]) {
                right++;
            } else {
                right = 1;
            }
            sum += Math.max(left[i], right);
        }
        return sum;
    }
```

2. 常数空间遍历

```java
    public int candy(int[] ratings) {
        int cur = 1, pre = 1, incLen = 1, decLen = 0, sum = 1;
        while(cur < ratings.length){
            if (ratings[cur] >= ratings[cur -1]){
                pre = ratings[cur] == ratings[cur - 1]? 1 : pre + 1;
                sum+=pre;
                incLen = pre;
                decLen = 0;
            }else if (ratings[cur] < ratings[cur -1]){
                pre = 1;
                decLen++;
                if (decLen == incLen){
                    decLen++;
                }
                sum+=decLen;
            }
            cur++;
        }
        return sum;
    }
```

</details>

---

## 16. LeetCode 42：接雨水

#### 🚀 相关链接

[LeetCode 042 - 接雨水](https://leetcode.cn/problems/trapping-rain-water/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

给定 `n` 个非负整数表示每个宽度为 `1` 的柱子的高度图，计算按此排列的柱子，下雨之后能接多少雨水。

#### 💡 示例

- **输入**: `height = [0,1,0,2,1,0,1,3,2,1,2,1]`
- **输出**: `6`
- **解释**: 上面是由数组 `[0,1,0,2,1,0,1,3,2,1,2,1]` 表示的高度图，在这种情况下，可以接 `6` 个单位的雨水（蓝色部分表示雨水）。

##### 示例 2

- **输入**: `height = [4,2,0,3,2,5]`
- **输出**: `9`

#### 📝 提示
- `n == height.length`
- `1 <= n <= 2 * 10^4`
- `0 <= height[i] <= 10^5`

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

1. **双指针法**：
   - 使用两个数组 `leftMax` 和 `rightMax` 分别记录每个位置的左边最大高度和右边最大高度。
   - 对于每个位置，能接的雨水量等于 `min(leftMax[i], rightMax[i]) - height[i]`。
   - 最终将所有位置的雨水量累加即为结果。

#### 💻 代码实现

```java
public int trap(int[] height) {
    int len = height.length;
    int[] leftMax = new int[height.length];
    int[] rightMax = new int[height.length];
    leftMax[0] = height[0];
    rightMax[len - 1] = height[len - 1];
    int sum = 0;
    for (int i = 1; i < len; i++) {
        leftMax[i] = Math.max(leftMax[i - 1], height[i]);
    }
    for (int i = len - 2; i >= 0; i--) {
        rightMax[i] = Math.max(rightMax[i + 1], height[i]);
    }
    for (int i = 1; i < len-1; i++) {
        sum += Math.min(leftMax[i], rightMax[i]) - height[i];
    }
    return sum;
}
```

</details>

---

## 17. LeetCode 13：罗马数字转整数

#### 🚀 相关链接

[LeetCode 013 - 罗马数字转整数](https://leetcode.cn/problems/roman-to-integer/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

罗马数字包含以下七种字符: `I`, `V`, `X`, `L`, `C`, `D` 和 `M`。

| 字符 | 数值 |
|------|-----|
| I    | 1   |
| V    | 5   |
| X    | 10  |
| L    | 50  |
| C    | 100 |
| D    | 500 |
| M    | 1000 |

例如，罗马数字 `2` 写做 `II`，即为两个并列的 `1`。`12` 写做 `XII`，即为 `X + II`。`27` 写做 `XXVII`, 即为 `XX + V + II`。

通常情况下，罗马数字中小的数字在大的数字的右边。但也存在特例，例如 `4` 不写做 `IIII`，而是 `IV`。数字 `1` 在数字 `5` 的左边，所表示的数等于大数 `5` 减小数 `1` 得到的数值 `4`。同样地，数字 `9` 表示为 `IX`。这个特殊的规则只适用于以下六种情况：

- `I` 可以放在 `V` (5) 和 `X` (10) 的左边，来表示 `4` 和 `9`。
- `X` 可以放在 `L` (50) 和 `C` (100) 的左边，来表示 `40` 和 `90`。
- `C` 可以放在 `D` (500) 和 `M` (1000) 的左边，来表示 `400` 和 `900`。

给定一个罗马数字，将其转换成整数。

#### 💡 示例

##### 示例 1

- **输入**: `s = "III"`
- **输出**: `3`

##### 示例 2

- **输入**: `s = "IV"`
- **输出**: `4`

##### 示例 3

- **输入**: `s = "IX"`
- **输出**: `9`

##### 示例 4

- **输入**: `s = "LVIII"`
- **输出**: `58`
- **解释**: `L = 50`, `V = 5`, `III = 3`.

##### 示例 5

- **输入**: `s = "MCMXCIV"`
- **输出**: `1994`
- **解释**: `M = 1000`, `CM = 900`, `XC = 90`, `IV = 4`.

#### 📝 提示

- `1 <= s.length <= 15`
- `s` 仅含字符 `('I', 'V', 'X', 'L', 'C', 'D', 'M')`
- 题目数据保证 `s` 是一个有效的罗马数字，且表示整数在范围 `[1, 3999]` 内
- 题目所给测试用例皆符合罗马数字书写规则，不会出现跨位等情况。
- `IL` 和 `IM` 这样的例子并不符合题目要求，`49` 应该写作 `XLIX`，`999` 应该写作 `CMXCIX`。

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

1. 使用哈希表存储每个罗马字符对应的整数值。
2. 遍历字符串 `s`，如果当前字符比下一个字符小，则将当前字符的值减去，否则加上当前字符的值。最后将结果累加即可。

#### 💻 代码实现

```java
public int romanToInt(String s) {
    final Map<Character, Integer> map = Map.of(
            'I', 1,
            'V', 5,
            'X', 10,
            'L', 50,
            'C', 100,
            'D', 500,
            'M', 1000
    );
    int res = 0;
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        int cVal = map.get(c);
        if (i + 1 < s.length()) {
            char nextC = s.charAt(i + 1);
            if (map.get(nextC) > cVal) {
                res -= cVal;
            } else {
                res += cVal;
            }
        } else {
            res += cVal;
        }
    }
    return res;
}
```

</details>

---

## 18. LeetCode 12：整数转罗马数字

#### 🚀 相关链接

[LeetCode 012 - 整数转罗马数字](https://leetcode.cn/problems/integer-to-roman/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

罗马数字通过七个不同的符号来代表不同的数值：

| 符号 | 值   |
|-----|------|
| I   | 1    |
| V   | 5    |
| X   | 10   |
| L   | 50   |
| C   | 100  |
| D   | 500  |
| M   | 1000 |

罗马数字的转换规则如下：

1. 如果该值不是以 4 或 9 开头，选择可以从输入中减去的最大值的符号，将该符号附加到结果，减去其值，然后将其余部分转换为罗马数字。
2. 如果该值以 4 或 9 开头，使用 **减法形式**，表示从以下符号中减去一个符号。例如，4 是 5 (V) 减 1 (I): IV，9 是 10 (X) 减 1 (I): IX。仅使用以下减法形式：4 (IV)，9 (IX)，40 (XL)，90 (XC)，400 (CD) 和 900 (CM)。
3. 只有 10 的次方（I, X, C, M）最多可以连续附加 3 次以代表 10 的倍数。你不能多次附加 5 (V)，50 (L) 或 500 (D)。如果需要将符号附加 4 次，请使用 **减法形式**。

给定一个整数，将其转换为罗马数字。

#### 💡 示例

##### 示例 1

- **输入**: `num = 3749`
- **输出**: `"MMMDCCXLIX"`
- **解释**: 
  - 3000 = MMM （1000 (M) + 1000 (M) + 1000 (M)）
  - 700 = DCC （500 (D) + 100 (C) + 100 (C)）
  - 40 = XL （50 (L) 减 10 (X)）
  - 9 = IX （10 (X) 减 1 (I)）

##### 示例 2

- **输入**: `num = 58`
- **输出**: `"LVIII"`
- **解释**: 
  - 50 = L
  - 8 = VIII

##### 示例 3

- **输入**: `num = 1994`
- **输入**: `"MCMXCIV"`
- **解释**: 
  - 1000 = M
  - 900 = CM
  - 90 = XC
  - 4 = IV

#### 📝 提示

- `1 <= num <= 3999`

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

将整数从大到小依次减去最大的可表示罗马数字对应的值，直到整数减为 0。

#### 💻 代码实现

```java
public String intToRoman(int num) {
    int[] values = {1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1};
    String[] symbols = {"M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"};

    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < values.length; i++) {
        int value = values[i];
        String symbol = symbols[i];
        while (num >= value) {
            num -= value;
            sb.append(symbol);
        }
    }
    return sb.toString();
}
```

</details>

---

## 19. LeetCode 58：最后一个单词的长度

#### 🚀 相关链接

[LeetCode 058 - 最后一个单词的长度](https://leetcode.cn/problems/length-of-last-word/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

给你一个字符串 `s`，由若干单词组成，单词前后用一些空格字符隔开。返回字符串中 **最后一个** 单词的长度。

**单词** 是指仅由字母组成、不包含任何空格字符的最大子字符串。

#### 💡 示例

##### 示例 1

- **输入**: `s = "Hello World"`
- **输出**: `5`
- **解释**: 最后一个单词是“World”，长度为 5。

##### 示例 2

- **输入**: `s = "   fly me   to   the moon  "`
- **输出**: `4`
- **解释**: 最后一个单词是“moon”，长度为 4。

##### 示例 3

- **输入**: `s = "luffy is still joyboy"`
- **输出**: `6`
- **解释**: 最后一个单词是“joyboy”，长度为 6。

#### 📝 提示

- `1 <= s.length <= 10^4`
- `s` 仅有英文字母和空格 `' '` 组成
- `s` 中至少存在一个单词

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

从字符串的末尾开始遍历，找到最后一个单词的开头和结尾，计算其长度。

1. 初始化一个标志位 `flag` 为 `false`，用于判断是否进入了最后一个单词。
2. 从字符串的最后一个字符开始，向前遍历：
   - 如果当前字符不是空格，且 `flag` 为 `false`，则进入最后一个单词，并设置 `flag` 为 `true`，同时初始化长度为 1。
   - 如果当前字符不是空格，且 `flag` 为 `true`，则长度加 1。
   - 如果当前字符是空格，且 `flag` 为 `true`，则返回当前计算的长度。
3. 如果遍历结束后仍未返回，则返回当前计算的长度。

#### 💻 代码实现

```java
public int lengthOfLastWord(String s) {
    int len = s.length();
    boolean flag = false;
    int res = 0;
    for (int i = len - 1; i >= 0; i--) {
        char c = s.charAt(i);
        if (!flag && c != ' ') {
            flag = true;
            res = 1;
        } else if (flag && c != ' ') {
            res++;
        } else if (flag) {
            return res;
        }
    }
    return res;
}
```

</details>

---

## 20. LeetCode 14：最长公共前缀

#### 🚀 相关链接

[LeetCode 14 - 最长公共前缀](https://leetcode.cn/problems/longest-common-prefix/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

编写一个函数来查找字符串数组中的最长公共前缀。

如果不存在公共前缀，返回空字符串 `""`。

#### 💡 示例

##### 示例 1

- **输入**: `strs = ["flower","flow","flight"]`
- **输出**: `"fl"`

##### 示例 2

- **输入**: `strs = ["dog","racecar","car"]`
- **输出**: `""`
- **解释**: 输入不存在公共前缀。

#### 📝 提示

1. `1 <= strs.length <= 200`
2. `0 <= strs[i].length <= 200`
3. `strs[i]` 如果非空，则仅由小写英文字母组成

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

通过将字符串数组排序，比较第一个和最后一个字符串的公共前缀，这样可以减少比较的次数，提高效率。

#### 💻 代码实现

```java
public String longestCommonPrefix(String[] strs) {
        if (strs.length == 1) {
            return strs[0];
        }
        List<String> list = Arrays.stream(strs).sorted().toList();
        String s1 = list.getFirst();
        String s2 = list.getLast();

        for (int i = 0; i < s1.length(); i++) {
            String subStr1 = s1.substring(0, i + 1);
            if (!s2.startsWith(subStr1)) {
                return s1.substring(0, i);
            }
        }
        return s1;
    }
```

</details>

---

## 21. LeetCode 151：反转字符串中的单词

#### 🚀 相关链接

[LeetCode 151 - 反转字符串中的单词](https://leetcode.cn/problems/reverse-words-in-a-string/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

给你一个字符串 `s` ，请你反转字符串中 **单词** 的顺序。

**单词** 是由非空格字符组成的字符串。`s` 中使用至少一个空格将字符串中的 **单词** 分隔开。

返回 **单词** 顺序颠倒且 **单词** 之间用单个空格连接的结果字符串。

**注意**：输入字符串 `s` 中可能会存在前导空格、尾随空格或者单词间的多个空格。返回的结果字符串中，单词间应当仅用单个空格分隔，且不包含任何额外的空格。

#### 💡 示例

- **输入**: `s = "the sky is blue"`
- **输出**: `"blue is sky the"`

##### 示例 2

- **输入**: `s = "  hello world  "`
- **输出**: `"world hello"`
- **解释**: 反转后的字符串中不能存在前导空格和尾随空格。

##### 示例 3

- **输入**: `s = "a good   example"`
- **输出**: `"example good a"`
- **解释**: 如果两个单词间有多余的空格，反转后的字符串需要将单词间的空格减少到仅有一个。

#### 📝 提示

- `1 <= s.length <= 10^4`
- `s` 包含英文大小写字母、数字和空格 `' '`
- `s` 中 **至少存在一个** 单词

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

1. 去除字符串的前导和尾随空格。
2. 反转整个字符串。
3. 反转每个单词，并去除多余的空格。

#### 💻 代码实现

```java
public String reverseWords(String s) {
    StringBuilder sb = new StringBuilder(s.trim());
    if (sb.indexOf(" ") == -1) {
        return sb.toString();
    }
    sb.reverse();
    int start = 0;
    for (int i = 0; i < sb.length(); i++) {
        if (sb.charAt(i) == ' ') {
            while (sb.charAt(i + 1) == ' ') {
                sb.deleteCharAt(i + 1);
            }
            reverse(sb, start, i - 1);
            start = i + 1;
        }
    }
    if (start < sb.length() - 1) {
        reverse(sb, start, sb.length() - 1);
    }

    return sb.toString();
}

public void reverse(StringBuilder sb, int start, int end) {
    while (start < end) {
        char temp = sb.charAt(start);
        sb.setCharAt(start, sb.charAt(end));
        sb.setCharAt(end, temp);
        start++;
        end--;
    }
}
```

</details>

---

## 22. LeetCode 6：Z 字形变换

#### 🚀 相关链接

[LeetCode 6 - Z 字形变换](https://leetcode.cn/problems/zigzag-conversion/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

将一个给定字符串 `s` 根据给定的行数 `numRows`，以从上往下、从左到右进行 Z 字形排列。

比如输入字符串为 `"PAYPALISHIRING"` 行数为 `3` 时，排列如下：

```text
P   A   H   N
A P L S I I G
Y   I   R
```

之后，你的输出需要从左往右逐行读取，产生出一个新的字符串，比如：`"PAHNAPLSIIGYIR"`。

请你实现这个将字符串进行指定行数变换的函数：

```java
string convert(string s, int numRows);
```

#### 💡 示例

##### 示例 1

- **输入**: `s = "PAYPALISHIRING"`, `numRows = 3`
- **输出**: `"PAHNAPLSIIGYIR"`
- **解释**: 
  ```text
  P   A   H   N
  A P L S I I G
  Y   I   R
  ```

##### 示例 2

- **输入**: `s = "PAYPALISHIRING"`, `numRows = 4`
- **输出**: `"PINALSIGYAHRPI"`
- **解释**: 
  ```text
  P     I    N
  A   L S  I G
  Y A   H R
  P     I
  ```

##### 示例 3

- **输入**: `s = "A"`, `numRows = 1`
- **输出**: `"A"`

#### 📝 提示
- `1 <= s.length <= 1000`
- `s` 由英文字母（小写和大写）、`','` 和 `'.'` 组成
- `1 <= numRows <= 1000`

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

**模拟法**：使用一个列表来存储每一行的字符串，然后按照 Z 字形排列的顺序将字符添加到对应的行中。最后将每一行的字符串拼接起来即可。使用一个flag来表示当前顺序是向下移动还是向上移动。

#### 💻 代码实现

```java
public String convert(String s, int numRows) {
    if (numRows == 1) return s;
    final List<StringBuilder> sbList = new ArrayList<>();
    for (int i = 0; i < numRows; i++) {
        sbList.add(new StringBuilder());
    }
    int flag = 1;
    int currentRow = 0;
    for (int i = 0; i < s.length(); i++) {
        sbList.get(currentRow).append(s.charAt(i));
        if (currentRow == 0) {
            flag = 1;
        } else if (currentRow == numRows - 1) {
            flag = -1;
        }
        currentRow += flag;
    }
    StringBuilder totalBuilder = new StringBuilder();
    for (StringBuilder sb : sbList) {
        totalBuilder.append(sb);
    }
    return totalBuilder.toString();
}
```

</details>

---

## 23. LeetCode 28：找出字符串中第一个匹配项的下标

#### 🚀 相关链接

[LeetCode 28 - 找出字符串中第一个匹配项的下标](https://leetcode.cn/problems/find-the-index-of-the-first-occurrence-in-a-string/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

给你两个字符串 `haystack` 和 `needle` ，请你在 `haystack` 字符串中找出 `needle` 字符串的第一个匹配项的下标（下标从 0 开始）。如果 `needle` 不是 `haystack` 的一部分，则返回 `-1`。

#### 💡 示例

##### 示例 1

- **输入**: `haystack = "sadbutsad", needle = "sad"`
- **输出**: `0`
- **解释**: `"sad"` 在下标 `0` 和 `6` 处匹配。第一个匹配项的下标是 `0`，所以返回 `0`。

##### 示例 2

- **输入**: `haystack = "leetcode", needle = "leeto"`
- **输出**: `-1`
- **解释**: `"leeto"` 没有在 `"leetcode"` 中出现，所以返回 `-1`。

#### 📝 提示

- `1 <= haystack.length, needle.length <= 10^4`
- `haystack` 和 `needle` 仅由小写英文字符组成

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

##### 1. KMP算法

KMP算法是一种用于字符串匹配的经典算法，其核心思想是通过构建部分的匹配表（next数组），在匹配失败时能够跳过一部分字符，从而提高匹配效率。具体思路如下：

1. **构建next数组**：计算模式串（needle）的next数组，next数组的每个元素表示在当前字符匹配失败时，模式串中下一个字符的位置。
2. **使用next数组进行匹配**：在匹配过程中，如果当前字符匹配失败，则根据next数组的值移动模式串的位置，而不是直接移动主串的位置。

##### 2. Sunday算法

Sunday算法是一种更高效的字符串匹配算法，其核心思想是通过对模式串和主串的字符进行比较，并根据最后一次匹配失败的位置来决定下一步的移动距离。具体思路如下：

1. **预处理偏移表**：计算模式串中每个字符在模式串中的位置，并为每个字符生成一个偏移量。
2. **匹配过程中使用偏移表**：在匹配失败时，根据主串中下一个字符的位置来决定模式串的移动距离。

#### 💻 代码实现

##### KMP算法

```java
public int strStr(String haystack, String needle) {
    int[] next = buildNextArr(needle);

    int i = 0, j = 0;

    while (i < haystack.length() && j < needle.length()) {
        if (haystack.charAt(i) == needle.charAt(j)) {
            i++;
            j++;
        } else if (j == 0) {
            i++;
        } else {
            j = next[j - 1];
        }
    }

    if (j == needle.length()) {
        return i - j;
    } else {
        return -1;
    }
}

private int[] buildNextArr(String pattern) {
    int len = pattern.length();
    int[] next = new int[len];
    next[0] = 0;
    for (int i = 1, j = 0; i < len; i++) {
        while (j > 0 && pattern.charAt(i) != pattern.charAt(j)) {
            j = next[j - 1];
        }
        if (pattern.charAt(i) == pattern.charAt(j)) {
            j++;
        }
        next[i] = j;
    }
    return next;
}
```

##### Sunday算法

```java
public int strStr(String haystack, String needle) {
    int scanIndex = 0, hayStackIndex = 0, needleIndex = 0, hayLen = haystack.length(), needleLen = needle.length();
    Map<Character, Integer> offsetMap = new HashMap<>();
    for (int i = 0; i < needleLen; i++) {
        offsetMap.put(needle.charAt(i), needle.length() - i);
    }
    while (scanIndex + needleLen <= hayLen) {
        hayStackIndex = scanIndex;
        needleIndex = 0;
        // 字符匹配时，两个指针持续向后移动
        while (hayStackIndex < hayLen && needleIndex < needleLen && haystack.charAt(hayStackIndex) == needle.charAt(needleIndex)) {
            hayStackIndex++;
            needleIndex++;
        }
        // 跳出循环时，检查情况
        if (needleIndex == needleLen) { //若模式串扫描完了，说明全匹配，返回起始index
            return scanIndex;
        } else { //否则进行偏移
            if (scanIndex + needleLen >= hayLen) { //超出边界
                return -1;
            }
            boolean flag = false;
            char nextChar = haystack.charAt(scanIndex + needleLen);
            for (int i = 0; i < needleLen; i++) { //若下一个字符存在于模式串中
                if (needle.charAt(i) == nextChar) {
                    scanIndex += offsetMap.get(nextChar);
                    flag = true;
                    break;
                }
            }
            //否则偏移量为needleLen + 1
            if (!flag) {
                scanIndex += needleLen;
            }
        }
    }
    return -1;
}
```

</details>

---

## 24. LeetCode 68：文本左右对齐

#### 🚀 相关链接

[LeetCode 68 - 文本左右对齐](https://leetcode.cn/problems/text-justification/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

给定一个单词数组 `words` 和一个长度 `maxWidth`，重新排版单词，使其成为每行恰好有 `maxWidth` 个字符，且左右两端对齐的文本。

你应该使用 **“贪心算法”** 来放置给定的单词；也就是说，尽可能多地往每行中放置单词。必要时可用空格 `' '` 填充，使得每行恰好有 `maxWidth` 个字符。

要求尽可能均匀分配单词间的空格数量。如果某一行单词间的空格不能均匀分配，则左侧放置的空格数要多于右侧的空格数。

文本的最后一行应为左对齐，且单词之间不插入额外的空格。

#### 💡 示例

##### 示例 1

- **输入**: `words = ["This", "is", "an", "example", "of", "text", "justification."]`, `maxWidth = 16`
- **输出**:
  ```text
  [
     "This    is    an",
     "example  of text",
     "justification.  "
  ]
  ```

##### 示例 2

- **输入**: `words = ["What","must","be","acknowledgment","shall","be"]`, `maxWidth = 16`
- **输出**:
  ```text
  [
    "What   must   be",
    "acknowledgment  ",
    "shall be        "
  ]
  ```

##### 示例 3

- **输入**: `words = ["Science","is","what","we","understand","well","enough","to","explain","to","a","computer.","Art","is","everything","else","we","do"]`, `maxWidth = 20`
- **输出**:
  ```text
  [
    "Science  is  what we",
    "understand      well",
    "enough to explain to",
    "a  computer.  Art is",
    "everything  else  we",
    "do                  "
  ]
  ```

#### 📝 提示
- `1 <= words.length <= 300`
- `1 <= words[i].length <= 20`
- `words[i]` 由小写英文字母和符号组成
- `1 <= maxWidth <= 100`
- `words[i].length <= maxWidth`

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

1. **贪心算法**：尽可能多地往每行中放置单词，直到无法再放置下一个单词为止。
2. **均匀分配空格**：对于非最后一行，尽可能均匀分配单词间的空格数量，如果无法均匀分配，则左侧的空格数要多于右侧的空格数。
3. **最后一行左对齐**：对于最后一行，单词之间不插入额外的空格，直接在右侧填充空格以满足 `maxWidth` 的要求。

#### 💻 代码实现

```java
public List<String> fullJustify(String[] words, int maxWidth) {
    List<String> res = new ArrayList<>();
    int i = 0;
    StringBuilder sb = new StringBuilder();
    while(i < words.length){
        String word = words[i];
        if (sb.isEmpty()){
            if (maxWidth >= word.length()){
                sb.append(word);
                i++;
            }
        }else{
            if (maxWidth >= sb.length() + word.length() + 1){
                sb.append(" ").append(word);
                i++;
            }else{
                res.add(sb.toString());
                sb = new StringBuilder();
            }
        }
        if (i >= words.length){
            res.add(sb.toString());
        }
    }
    for (int j = 0; j < res.size(); j++) {
        String s = res.get(j);
        if (j == res.size() - 1 && s.length() < maxWidth){
            res.set(j, s + " ".repeat(maxWidth - s.length()));
        }else if (j < res.size() - 1){
            if (s.length() < maxWidth){
                res.set(j, adjustSpaces(s, maxWidth));
            }
        }
    }
    return res;
}

public String adjustSpaces(String s, int maxWidth) {
    String[] words = s.split(" ");
    int wordCount = words.length;

    if (wordCount == 1) {
        StringBuilder single = new StringBuilder(words[0]);
        while (single.length() < maxWidth) {
            single.append(' ');
        }
        return single.toString();
    }

    int sumWordLengths = 0;
    for (String w : words) {
        sumWordLengths += w.length();
    }

    int totalSpaces = maxWidth - sumWordLengths;
    int gaps = wordCount - 1;

    int extraPerGap = totalSpaces / gaps;
    int remainder = totalSpaces % gaps;

    StringBuilder result = new StringBuilder();
    for (int i = 0; i < gaps; i++) {
        result.append(words[i]);
        int spacesToAdd = extraPerGap;
        if (i < remainder) {
            spacesToAdd++;
        }
        for (int k = 0; k < spacesToAdd; k++) {
            result.append(' ');
        }
    }
    result.append(words[gaps]);

    return result.toString();
}
```

</details>

---

## 25. LeetCode 125：验证回文串

#### 🚀 相关链接

[LeetCode 125 - 验证回文串](https://leetcode.cn/problems/valid-palindrome/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

如果在将所有大写字符转换为小写字符、并移除所有非字母数字字符之后，短语正着读和反着读都一样。则可以认为该短语是一个 **回文串** 。

字母和数字都属于字母数字字符。

给你一个字符串 `s`，如果它是 **回文串**，返回 `true` ；否则，返回 `false`。

#### 💡 示例

##### 示例 1

- **输入**: `s = "A man, a plan, a canal: Panama"`
- **输出**: `true`
- **解释**: `"amanaplanacanalpanama"` 是回文串。

##### 示例 2

- **输入**: `s = "race a car"`
- **输出**: `false`
- **解释**: `"raceacar"` 不是回文串。

##### 示例 3

- **输入**: `s = " "`
- **输出**: `true`
- **解释**: 在移除非字母数字字符之后，`s` 是一个空字符串 `""` 。由于空字符串正着反着读都一样，所以是回文串。

#### 📝 提示

- `1 <= s.length <= 2 * 10^5`
- `s` 仅由可打印的 ASCII 字符组成

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

1. **预处理字符串**：首先移除所有非字母数字字符，并将所有大写字符转换为小写字符。
2. **双指针验证**：使用双指针从字符串的两端向中间移动，逐一比较字符是否相同。如果有任何一对字符不相同，则返回 `false`；如果所有字符都相同，则返回 `true`。

#### 💻 代码实现

```java
public boolean isPalindrome(String s) {
    s = s.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
    int left = 0, right = s.length() - 1;
    while (left < right) {
        if (s.charAt(left) != s.charAt(right)) {
            return false;
        } else {
            left++;
            right--;
        }
    }
    return true;
}
```

</details>

---

## 26. LeetCode 392：判断子序列

#### 🚀 相关链接

[LeetCode 392 - 判断子序列](https://leetcode.cn/problems/is-subsequence/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

给定字符串 `s` 和 `t` ，判断 `s` 是否为 `t` 的子序列。

字符串的一个子序列是原始字符串删除一些（也可以不删除）字符而不改变剩余字符相对位置形成的新字符串。（例如，"ace"是"abcde"的一个子序列，而"aec"不是）。

**进阶**：

如果有大量输入的 `S`，称作 `S1, S2, .., Sk` 其中 `k >= 10亿`，你需要依次检查它们是否为 `T` 的子序列。在这种情况下，你会怎样改变代码？

**致谢**：

特别感谢 @pbrother 添加此问题并且创建所有测试用例。

#### 💡 示例

- **输入**: `s = "abc", t = "ahbgdc"`
- **输出**: `true`
- **解释**: `"abc"` 是 `"ahbgdc"` 的子序列。

##### 示例 2

- **输入**: `s = "axc", t = "ahbgdc"`
- **输出**: `false`
- **解释**: `"axc"` 不是 `"ahbgdc"` 的子序列。

#### 📝 提示
- `0 <= s.length <= 100`
- `0 <= t.length <= 10^4`
- 两个字符串都只由小写字符组成。

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

1. **双指针**：
   - 使用两个指针分别遍历 `s` 和 `t`，如果 `s` 的当前字符与 `t` 的当前字符匹配，则移动 `s` 的指针；否则只移动 `t` 的指针。
   - 如果遍历完 `s`，则 `s` 是 `t` 的子序列。

2. **动态规划**（适用于进阶问题）：
   - 预处理 `t`，构建一个二维数组 `dp`，其中 `dp[i][j]` 表示在 `t` 的第 `i` 个位置之后，字符 `j` 出现的位置。
   - 使用该数组快速判断 `s` 是否为 `t` 的子序列。

#### 💻 代码实现

```java
public boolean isSubsequence(String s, String t) {
    int[][] arr = new int[t.length() + 1][26];

    for (int i = 0; i < 26; i++) {
        arr[t.length()][i] = -1;
    }
    for (int i = t.length() - 1; i >= 0; i--) {
        int charIndex = t.charAt(i) - 97;
        arr[i][charIndex] = i;
        for (int j = 0; j < 26; j++) {
            if (charIndex == j) {
                arr[i][j] = i;
            } else {
                arr[i][j] = arr[i + 1][j];
            }
        }
    }

    int currentPos = 0;
    for (int i = 0; i < s.length(); i++) {
        int charIndex = s.charAt(i) - 97;
        int nextPos = arr[currentPos][charIndex];
        if (nextPos == -1) {
            return false;
        } else {
            currentPos = nextPos + 1;
        }
    }

    return true;
}
```

</details>

---

## 27. LeetCode 167：两数之和 II - 输入有序数组

#### 🚀 相关链接

[LeetCode 167 - 两数之和 II - 输入有序数组](https://leetcode.cn/problems/two-sum-ii-input-array-is-sorted/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

给你一个下标从 `1` 开始的整数数组 `numbers`，该数组已按 **非递减顺序排列**，请你从数组中找出满足相加之和等于目标数 `target` 的两个数。如果设这两个数分别是 `numbers[index1]` 和 `numbers[index2]`，则 `1 <= index1 < index2 <= numbers.length`。

以长度为 `2` 的整数数组 `[index1, index2]` 的形式返回这两个整数的下标 `index1` 和 `index2`。

你可以假设每个输入 **只对应唯一的答案**，而且你 **不可以** 重复使用相同的元素。

你所设计的解决方案必须只使用常量级的额外空间。

#### 💡 示例

##### 示例 1
- **输入**: `numbers = [2,7,11,15], target = 9`
- **输出**: `[1,2]`
- **解释**: `2` 与 `7` 之和等于目标数 `9`。因此 `index1 = 1`, `index2 = 2`。返回 `[1, 2]`。

##### 示例 2
- **输入**: `numbers = [2,3,4], target = 6`
- **输出**: `[1,3]`
- **解释**: `2` 与 `4` 之和等于目标数 `6`。因此 `index1 = 1`, `index2 = 3`。返回 `[1, 3]`。

##### 示例 3
- **输入**: `numbers = [-1,0], target = -1`
- **输出**: `[1,2]`
- **解释**: `-1` 与 `0` 之和等于目标数 `-1`。因此 `index1 = 1`, `index2 = 2`。返回 `[1, 2]`。

#### 📝 提示
- `2 <= numbers.length <= 3 * 10^4`
- `-1000 <= numbers[i] <= 1000`
- `numbers` 按 **非递减顺序** 排列
- `-1000 <= target <= 1000`
- **仅存在一个有效答案**

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

由于数组已经是有序的，可以使用双指针的方法来解决这个问题。具体思路如下：

1. 初始化两个指针，一个指向数组的起始位置（`left`），另一个指向数组的末尾（`right`）。
2. 计算两个指针所指元素的之和。
3. 如果和大于 `target`，则将 `right` 指针向左移动。
4. 如果和小于 `target`，则将 `left` 指针向右移动。
5. 如果和等于 `target`，则返回这两个指针的位置。

#### 💻 代码实现

```java
public int[] twoSum(int[] numbers, int target) {
    int left = 0, right = numbers.length - 1;
    while (left < right) {
        int sum = numbers[left] + numbers[right];
        if (sum > target) {
            right--;
        } else if (sum < target) {
            left++;
        } else {
            return new int[]{left + 1, right + 1};
        }
    }
    return new int[]{left + 1, right + 1};
}
```

</details>

---

## 28. LeetCode 11：盛最多水的容器

#### 🚀 相关链接

[LeetCode 11 - 盛最多水的容器](https://leetcode.cn/problems/container-with-most-water/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

给定一个长度为 `n` 的整数数组 `height`。有 `n` 条垂线，第 `i` 条线的两个端点是 `(i, 0)` 和 `(i, height[i])`。

找出其中的两条线，使得它们与 `x` 轴共同构成的容器可以容纳最多的水。

返回容器可以储存的最大水量。

**说明**：你不能倾斜容器。

#### 💡 示例

##### 示例 1

- **输入**: `[1,8,6,2,5,4,8,3,7]`
- **输出**: `49`
- **解释**: 图中垂直线代表输入数组 `[1,8,6,2,5,4,8,3,7]`。在此情况下，容器能够容纳水（表示为蓝色部分）的最大值为 `49`。

##### 示例 2

- **输入**: `height = [1,1]`
- **输出**: `1`

#### 📝 提示

- `n == height.length`
- `2 <= n <= 10^5`
- `0 <= height[i] <= 10^4`

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

使用**双指针**的方法来解决该问题。初始时，双指针分别指向数组的左右两端。计算当前双指针所指向的线构成的容器的面积，并更新最大面积。然后，将较短的那条线的指针向中间移动，继续计算面积，直到两个指针相遇。

#### 💻 代码实现

```java
public int maxArea(int[] height) {
    int i = 0, j = height.length - 1;
    int area = 0;
    while (i < j) {
        int tmpArea = Math.min(height[i], height[j]) * (j - i);
        if (tmpArea > area) {
            area = tmpArea;
        }
        if (height[i] < height[j]) {
            i++;
        } else {
            j--;
        }
    }
    return area;
}
```

</details>

---

## 29. LeetCode 15：三数之和

#### 🚀 相关链接

[LeetCode 15 - 三数之和](https://leetcode.cn/problems/3sum/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

给你一个整数数组 `nums`，判断是否存在三元组 `[nums[i], nums[j], nums[k]]` 满足 `i != j`、`i != k` 且 `j != k`，同时还满足 `nums[i] + nums[j] + nums[k] == 0`。请你返回所有和为 `0` 且不重复的三元组。

**注意**：答案中不可以包含重复的三元组。

#### 💡 示例

##### 示例 1

- **输入**: `nums = [-1,0,1,2,-1,-4]`
- **输出**: `[[-1,-1,2],[-1,0,1]]`
- **解释**:
  - `nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0`。
  - `nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0`。
  - `nums[0] + nums[3] + nums[4] = (-1) + 2 + (-1) = 0`。
  - 不同的三元组是 `[-1,0,1]` 和 `[-1,-1,2]`。
  - 注意，输出的顺序和三元组的顺序并不重要。

##### 示例 2

- **输入**: `nums = [0,1,1]`
- **输出**: `[]`
- **解释**: 唯一可能的三元组和不为 `0`。

##### 示例 3

- **输入**: `nums = [0,0,0]`
- **输出**: `[[0,0,0]]`
- **解释**: 唯一可能的三元组和为 `0`。

#### 📝 提示

- `3 <= nums.length <= 3000`
- `-10^5 <= nums[i] <= 10^5`

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

1. **排序**：首先对数组进行排序，便于后续操作。
2. **双指针**：遍历数组，对于每个元素 `nums[i]`，使用双指针 `l` 和 `r` 分别指向 `i+1` 和 `nums.length-1`，寻找满足 `nums[i] + nums[l] + nums[r] == 0` 的三元组。
3. **去重**：为了避免重复的三元组，当 `nums[i] == nums[i-1]` 时，跳过当前元素。同时，在找到满足条件的三元组后，移动指针 `l` 和 `r` 时也需跳过重复元素。

#### 💻 代码实现

```java
public List<List<Integer>> threeSum(int[] nums) {
    Set<List<Integer>> set = new HashSet<>();
    Arrays.sort(nums);
    for (int i = 0; i < nums.length; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) {
            continue;
        }
        int diff = -nums[i];
        int l = i + 1, r = nums.length - 1;
        while (l < r) {
            int sum = nums[l] + nums[r];
            if (sum > diff) {
                r--;
            } else if (sum < diff) {
                l++;
            } else {
                set.add(Arrays.asList(nums[i], nums[l], nums[r]));
                l++;
                r--;
            }
        }
    }
    return set.stream().toList();
}
```

</details>

---

## 30. LeetCode 209：长度最小的子数组

#### 🚀 相关链接

[LeetCode 209 - 长度最小的子数组](https://leetcode.cn/problems/minimum-size-subarray-sum/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

给定一个含有 `n` 个正整数的数组和一个正整数 `target`。

找出该数组中满足其总和大于等于 `target` 的长度最小的 **子数组** `[numsl, numsl+1, ..., numsr-1, numsr]`，并返回其长度。如果不存在符合条件的子数组，返回 `0`。

#### 💡 示例

- **输入**: `target = 7, nums = [2,3,1,2,4,3]`
- **输出**: `2`
- **解释**: 子数组 `[4,3]` 是该条件下的长度最小的子数组。

##### 示例 2

- **输入**: `target = 4, nums = [1,4,4]`
- **输出**: `1`

##### 示例 3

- **输入**: `target = 11, nums = [1,1,1,1,1,1,1,1]`
- **输出**: `0`

#### 📝 提示

- `1 <= target <= 10^9`
- `1 <= nums.length <= 10^5`
- `1 <= nums[i] <= 10^4`

##### 进阶

如果你已经实现 `O(n)` 时间复杂度的解法，请尝试设计一个 `O(n log(n))` 时间复杂度的解法。

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

1. **暴力解法**：
   - 使用双重循环枚举所有可能的子数组，计算子数组的和，并记录最小的长度。
   - 时间复杂度：`O(n^2)`，在LeetCode中会超时。

2. **前缀和 + 二分查找**：
   - 先计算数组的前缀和数组 `sums`。
   - 对于每个位置 `i`，使用二分查找找到第一个满足 `sums[j] - sums[i-1] >= target` 的 `j`，并更新最小长度。
   - 时间复杂度：`O(n log(n))`。

3. **滑动窗口**：
   - 维护一个窗口 `[start, end]`，计算窗口内的和 `sum`。
   - 如果 `sum >= target`，更新最小长度，并尝试缩小窗口（`start++`）。
   - 如果 `sum < target`，扩大窗口（`end++`）。
   - 时间复杂度：`O(n)`。

#### 💻 代码实现

1. **暴力解法**（超时）

```java
public int minSubArrayLen(int target, int[] nums) {
    int ans = Integer.MAX_VALUE;
    for (int i = 0; i < nums.length; i++) {
        int sum = 0;
        for (int j = 1; j <= ans && j + i - 1 < nums.length; j++) {
            sum += nums[i + j - 1];
            if (sum >= target) {
                ans = j;
            }
        }
    }
    return ans == Integer.MAX_VALUE ? 0 : ans;
}
```

2. **前缀和 + 二分查找**

```java
public int minSubArrayLen(int target, int[] nums) {
    int ans = Integer.MAX_VALUE;
    int[] sums = new int[nums.length + 1];
    sums[0] = 0;
    for (int i = 1; i <= nums.length; i++) {
        sums[i] = sums[i - 1] + nums[i - 1];
    }
    for (int i = 1; i <= nums.length; i++) {
        int bound = Arrays.binarySearch(sums, sums[i - 1] + target);
        if (bound < 0) {
            bound = -bound - 1; // Arrays.binarySearch特性
        }
        if (bound <= nums.length) {
            ans = Math.min(ans, bound - (i - 1));
        }
    }
    return ans == Integer.MAX_VALUE ? 0 : ans;
}
```

3. **滑动窗口**

```java
public int lengthOfLongestSubstring(String s) {
        List<Character> list = new ArrayList<>();
        int l = 0, r= 0, ans = 0;
        while(l <= r && r< s.length()){
            if (l == r){
                list.add(s.charAt(l));
                ans = Math.max(ans, list.size());
                r++;
            }else{
                Character c = s.charAt(r);
                if (list.contains(c)){
                    list.removeFirst();
                    l++;
                }else{
                    list.add(s.charAt(r));
                    ans = Math.max(ans, list.size());
                    r++;
                }
            }

        }
        return ans;
    }
```

</details>

---

## 31. LeetCode 3：无重复字符的最长子串

#### 🚀 相关链接

[LeetCode 3 - 无重复字符的最长子串](https://leetcode.cn/problems/longest-substring-without-repeating-characters/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

给定一个字符串 `s` ，请你找出其中不含有重复字符的 **最长** 子串的长度。

#### 💡 示例

##### 示例 1

- **输入**: `s = "abcabcbb"`
- **输出**: `3`
- **解释**: 因为无重复字符的最长子串是 `"abc"`，所以其长度为 `3`。

##### 示例 2

- **输入**: `s = "bbbbb"`
- **输出**: `1`
- **解释**: 因为无重复字符的最长子串是 `"b"`，所以其长度为 `1`。

##### 示例 3

- **输入**: `s = "pwwkew"`
- **输出**: `3`
- **解释**: 因为无重复字符的最长子串是 `"wke"`，所以其长度为 `3`。
  
  请注意，你的答案必须是 **子串** 的长度，`"pwke"` 是一个子序列，不是子串。

#### 📝 提示

- `0 <= s.length <= 5 * 10^4`
- `s` 由英文字母、数字、符号和空格组成

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

使用 **滑动窗口** 的思想来解决这个问题：

1. 维护一个窗口，窗口的左边界和右边界分别用 `l` 和 `r` 表示。
2. 使用一个列表 `list` 来存储当前窗口中的字符。
3. 遍历字符串 `s`，如果当前字符 `s[r]` 不在 `list` 中，则将其加入 `list` 并扩展右边界 `r`。
4. 如果当前字符 `s[r]` 已经在 `list` 中，则移除 `list` 中的第一个字符并收缩左边界 `l`。
5. 在每次扩展或收缩窗口时，记录窗口的最大长度。

#### 💻 代码实现

```java
public int lengthOfLongestSubstring(String s) {
    List<Character> list = new ArrayList<>();
    int l = 0, r = 0, ans = 0;
    while (l <= r && r < s.length()) {
        if (l == r) {
            list.add(s.charAt(l));
            ans = Math.max(ans, list.size());
            r++;
        } else {
            Character c = s.charAt(r);
            if (list.contains(c)) {
                list.removeFirst();
                l++;
            } else {
                list.add(s.charAt(r));
                ans = Math.max(ans, list.size());
                r++;
            }
        }
    }
    return ans;
}
```

</details>

---

## 32. LeetCode 30：串联所有单词的子串

#### 🚀 相关链接

[LeetCode 30 - 串联所有单词的子串](https://leetcode.cn/problems/substring-with-concatenation-of-all-words/description/?envType=study-plan-v2&envId=top-interview-150)

#### 📜 描述

给定一个字符串 `s` 和一个字符串数组 `words`。`words` 中所有字符串 **长度相同**。

`s` 中的 **串联子串** 是指一个包含 `words` 中所有字符串以任意顺序排列连接起来的子串。

#### 💡 示例

##### 示例 1

- **输入**: `s = "barfoothefoobarman"`, `words = ["foo","bar"]`
- **输出**: `[0,9]`
- **解释**: 
  - 子串 `"barfoo"` 开始位置是 `0`。它是 `words` 中以 `["bar","foo"]` 顺序排列的连接。
  - 子串 `"foobar"` 开始位置是 `9`。它是 `words` 中以 `["foo","bar"]` 顺序排列的连接。

##### 示例 2

- **输入**: `s = "wordgoodgoodgoodbestword"`, `words = ["word","good","best","word"]`
- **输出**: `[]`
- **解释**: 没有符合条件的子串。

##### 示例 3

- **输入**: `s = "barfoofoobarthefoobarman"`, `words = ["bar","foo","the"]`
- **输出**: `[6,9,12]`
- **解释**: 
  - 子串 `"foobarthe"` 开始位置是 `6`。
  - 子串 `"barthefoo"` 开始位置是 `9`。
  - 子串 `"thefoobar"` 开始位置是 `12`。

#### 📝 提示

- `1 <= s.length <= 10^4`
- `1 <= words.length <= 5000`
- `1 <= words[i].length <= 30`
- `words[i]` 和 `s` 由小写英文字母组成

<details class="solution-details">
<summary>💡 查看题解与代码实现</summary>

#### 💭 思路

##### 方法一：滑动窗口 + 哈希表

1. **预处理**：
   - 计算每个单词的长度 `wordLen` 和所有单词连接后的总长度 `groupLen`。
   - 如果 `s` 的长度小于 `groupLen`，直接返回空列表。

2. **滑动窗口**：
   - 使用滑动窗口在 `s` 上滑动，窗口大小为 `groupLen`。
   - 对于每个窗口，统计窗口内单词出现的频率，并与 `words` 的频率进行比较。
   - 具体实现为使用一个哈希表，key为单词，用words数组进行初始化，words数组每出现一次就减1，窗口内出现一次就加1，若该窗口使hashmap中的值全为0，则该窗口起始位置为1个答案。

#### 💻 代码实现

```java
public List<Integer> findSubstring(String s, String[] words) {
    int wordLen = words[0].length();
    int groupLen = wordLen * words.length;
    if (s.length() < groupLen) {
        return Collections.emptyList();
    }
    List<Integer> ans = new ArrayList<>();
    for (int i = 0; i < wordLen; i++) {
        Map<String, Integer> map = new HashMap<>();
        for (String word : words) {
            int val = map.getOrDefault(word, 0);
            map.put(word, val - 1);
        }
        int left = i, r = left + groupLen - 1;
        while (r < s.length()) {
            String subStr = s.substring(left, r + 1);
            if (left == i) {
                for (int j = 0; j < subStr.length(); j += wordLen) {
                    String word = subStr.substring(j, j + wordLen);
                    if (map.containsKey(word)) {
                        map.put(word, map.get(word) + 1);
                    }
                }
            } else {
                String formerWord = s.substring(left - wordLen, left);
                String newWord = s.substring(left + groupLen - wordLen, left + groupLen);
                if (map.containsKey(formerWord)) {
                    map.put(formerWord, map.get(formerWord) - 1);
                }
                if (map.containsKey(newWord)) {
                    map.put(newWord, map.get(newWord) + 1);
                }
            }
            if (map.values().stream().allMatch(v -> v == 0)) {
                ans.add(left);
            }
            left += wordLen;
            r = left + groupLen - 1;
        }
    }
    return ans;
}
```

</details>

---

