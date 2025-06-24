---
title: 定义 Vue 子组件双向绑定的属性的语法糖 - defineModel
isOriginal: true
star: true
category:
  - Code
tag:
  - vue
order: 3
---

## 🚀 传统做法示例

假设有一个子组件 `ChildComponent.vue`，需要向父组件暴露两个属性 `props1` 和 `props2`，并实现双向绑定：

```vue
<!-- ChildComponent.vue -->
<template>
  <div>...</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  props1: string | number;
  props2: boolean;
}>();

const emit = defineEmits(['update:props1', 'update:props2']);

const localProp1 = computed({
  get: () => props.props1,
  set: (val) => {
    emit('update:props1', val);
  },
});

const localProp2 = computed({
  get: () => props.props2,
  set: (val) => {
    emit('update:props2', val);
  },
});
</script>
```

### 👨‍👩‍👧 父组件写法

父组件通过 `v-model` 修饰符绑定多个属性：

```vue
<template>
  <ChildComponent v-model:props1="xxx1" v-model:props2="xxx2" />
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';

const xxx1 = shallowRef<string>('');
const xxx2 = shallowRef<boolean>(false);
</script>
```

代码略显冗长，不够简洁。

---

## ✨ Vue 3.4+ 的 `defineModel` 语法糖

Vue 3.4 版本新增了 `defineModel`，用于简化子组件中暴露的双向绑定属性定义。通过 `defineModel`可以直接声明双向绑定的 props。

`ChildComponent.vue`可以改为以下写法：

```vue
<!-- ChildComponent.vue -->
<template>
  <div>...</div>
</template>

<script setup lang="ts">
const props1 = defineModel<string>('props1');
const props2 = defineModel<boolean>('props2');

// 这里 props1 和 props2 是响应式的，直接使用即可
</script>
```

Vue 会自动帮我们处理 `props` 和 `update:XXX` 事件的定义，并可直接使用 `props1`、`props2` 变量。

### 🎯 父组件绑定更简洁

- 如果只有一个需要双向绑定的属性，父组件可以直接写：

```vue
<ChildComponent v-model="xxx" />
```

- 多个属性时，仍可使用命名修饰符：

```vue
<ChildComponent v-model:props1="xxx1" v-model:props2="xxx2" />
```

---

## 🔗 参考链接

- [Vue 官方文档：v-model](https://vuejs.org/guide/components/v-model.html)