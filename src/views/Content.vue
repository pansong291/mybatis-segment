<template>
  <NSpace vertical class="ms-content">
    <NTabs class="ms-main-tabs" v-model:value="data.inputType" animated type="line" :tabs-padding="16">
      <NTab v-for="tab in constant.tabs.inputType" :key="tab.name" :name="tab.name">{{ tab.tab }}</NTab>
    </NTabs>
    <NSpace class="ph-16" vertical>
      <NSpace v-if="showSeparator" align="center">
        分隔符
        <NInput
          v-model:value="separator"
          placeholder="javascript 常量值"
          :status="internal.separator.status"
          :input-props="constant.inputProps" />
      </NSpace>
      <NInput type="textarea" v-model:value="data.input" placeholder="输入" :input-props="constant.inputProps" />
    </NSpace>
    <NTabs class="ms-main-tabs" v-model:value="data.outputType" animated type="line" :tabs-padding="16">
      <NTab v-for="tab in constant.tabs.outputType" :key="tab.name" :name="tab.name">{{ tab.tab }}</NTab>
    </NTabs>
    <NSpace class="ph-16" vertical>
      <div v-if="showWrapQuote">
        <NCheckbox v-model:checked="data.wrapQuote">反引包裹</NCheckbox>
      </div>
      <NSpace v-if="showTableName" align="center">
        表名
        <NInput v-model:value="data.tableName" placeholder="t" :input-props="constant.inputProps" />
      </NSpace>
      <NSpace v-if="showParamName" align="center">
        参数
        <NInput v-model:value="data.paramName" placeholder="p" :input-props="constant.inputProps" />
      </NSpace>
      <NSpace v-if="showCode" align="center" class="space-code">
        javascript 代码
        <NInput
          type="textarea"
          class="code-area"
          :style="`--code-error-msg:'${internal.code.msg}';--code-error-msg-display:${internal.code.display}`"
          v-model:value="data.code"
          :status="internal.code.status"
          placeholder="function(str) { return str }"
          :input-props="constant.inputProps"
          autosize />
      </NSpace>
      <NInput
        type="textarea"
        :value="output"
        placeholder="输出"
        readonly
        :input-props="constant.inputProps"
        autosize
        @click="copyContent(output)" />
    </NSpace>
  </NSpace>
</template>

<script setup>
  import { NCheckbox, NInput, NSpace, NTab, NTabs, useMessage } from 'naive-ui'
  import { computed, reactive } from 'vue'
  import { camelToSnake, copyContent, myBatisBaseXml, snakeToCamel } from '@/assets/utils'

  window.$message = useMessage()

  const constant = {
    tabs: {
      inputType: [
        { name: 'under', tab: '下划线' },
        { name: 'camel', tab: '驼峰' }
      ],
      outputType: [
        { name: 'base', tab: '基础XML' },
        { name: 'under', tab: '下划线' },
        { name: 'sharp', tab: '#值' },
        { name: 'if-tag', tab: 'if标签' },
        { name: 'result-map', tab: 'resultMap' },
        { name: 'dup-key', tab: 'duplicate key' },
        { name: 'custom', tab: '自定义' }
      ]
    },
    inputProps: {
      spellcheck: false,
      autocomplete: 'off'
    }
  }

  const internal = reactive({
    separator: {
      text: '/\\s*,\\s*/',
      status: 'success'
    },
    code: {
      status: 'success',
      msg: '',
      display: 'none'
    }
  })

  const data = reactive({
    inputType: 'under',
    outputType: 'base',
    input: '',
    separator: /\s*,\s*/,
    wrapQuote: true,
    tableName: '',
    paramName: '',
    code: 'function(str) {\n return str\n}'
  })

  const showSeparator = computed(() => {
    return ['under', 'camel'].indexOf(data.inputType) >= 0
  })

  const showWrapQuote = computed(() => {
    return ['under', 'if-tag', 'dup-key'].indexOf(data.outputType) >= 0
  })

  const showTableName = computed(() => {
    return ['under', 'if-tag'].indexOf(data.outputType) >= 0
  })

  const showParamName = computed(() => {
    return ['sharp', 'if-tag'].indexOf(data.outputType) >= 0
  })

  const showCode = computed(() => {
    return data.outputType === 'custom'
  })

  const separator = computed({
    get: () => {
      return internal.separator.text
    },
    set: (str) => {
      try {
        const fn = new Function(`return (${str})`)
        data.separator = fn.call(void 0)
        internal.separator.status = 'success'
      } catch (e) {
        internal.separator.status = 'error'
        console.error(e)
      }
      internal.separator.text = str
    }
  })

  const splits = computed(() => {
    const text = data.input
    return text.split(data.separator).filter((s) => !!s)
  })

  const under = computed(() => {
    if (data.inputType === 'camel') {
      return splits.value.map((s) => camelToSnake(s))
    }
    return splits.value
  })

  const camel = computed(() => {
    if (data.inputType === 'under') {
      return splits.value.map((s) => snakeToCamel(s))
    }
    return splits.value
  })

  const tablePrefix = computed(() => {
    return data.tableName ? data.tableName + '.' : ''
  })

  const paramPrefix = computed(() => {
    return data.paramName ? data.paramName + '.' : ''
  })

  const getSharp = () => {
    return camel.value.map((s) => `#{${paramPrefix.value}${s}}`).join()
  }

  const getUnder = () => {
    let underArr = under.value
    if (data.wrapQuote) {
      underArr = underArr.map((s) => '`' + s + '`')
    }
    if (tablePrefix.value) {
      underArr = underArr.map((s) => tablePrefix.value + s)
    }
    return underArr.join()
  }

  const getIfTag = () => {
    const camelArr = camel.value
    let underArr = under.value
    if (data.wrapQuote) {
      underArr = underArr.map((s) => '`' + s + '`')
    }
    const ifArr = []
    const prefix = 'and '
    const suffix = ','
    for (let i = 0; i < underArr.length; i++) {
      const par = paramPrefix.value + camelArr[i]
      const col = tablePrefix.value + underArr[i]
      ifArr.push(`<if test="${par} != null">${prefix}${col} = #{${par}}${suffix}</if>`)
    }
    return ifArr.join('\n')
  }

  const getResultMap = () => {
    const camelArr = camel.value
    const underArr = under.value
    const rmArr = []
    for (let i = 0; i < underArr.length; i++) {
      rmArr.push(`<result property="${camelArr[i]}" column="${underArr[i]}"/>`)
    }
    return rmArr.join('\n')
  }

  const getDupKey = () => {
    let underArr = under.value
    if (data.wrapQuote) {
      underArr = underArr.map((s) => '`' + s + '`')
    }
    const dkArr = []
    for (let i = 0; i < underArr.length; i++) {
      dkArr.push(`${underArr[i]}=values(${underArr[i]})`)
    }
    return dkArr.join()
  }

  const getCustom = () => {
    const str = data.input
    const fnCode = data.code
    try {
      const func = new Function(`return ${fnCode}`)()
      if (typeof func !== 'function') throw TypeError('表达式的值必须是一个函数')
      const result = func.call(void 0, str)
      if (typeof result !== 'string') throw EvalError('该函数必须返回一个字符串')
      internal.code.status = 'success'
      internal.code.display = 'none'
      return result
    } catch (e) {
      internal.code.status = 'error'
      internal.code.msg = String(e).replaceAll("'", "\\'")
      internal.code.display = 'block'
      console.error(e)
    }
    return ''
  }

  const output = computed(() => {
    switch (data.outputType) {
      case 'base':
        return myBatisBaseXml
      case 'under':
        return getUnder()
      case 'sharp':
        return getSharp()
      case 'if-tag':
        return getIfTag()
      case 'result-map':
        return getResultMap()
      case 'dup-key':
        return getDupKey()
      case 'custom':
        return getCustom()
    }
  })
</script>

<style lang="scss" scoped>
  .ms-content {
    .n-tabs {
      :deep(.n-tabs-tab-pad) {
        display: none;
      }

      :deep(.n-tabs-tab) {
        padding: 10px 18px;
      }
    }

    .ph-16 {
      padding-left: 16px;
      padding-right: 16px;
    }

    .space-code {
      :deep(> div:last-child) {
        flex-grow: 1;
      }
    }

    .code-area {
      :deep(.n-input__textarea-mirror::after) {
        content: var(--code-error-msg);
        color: #e88080;
        display: var(--code-error-msg-display);
        visibility: visible;
      }
    }
  }
</style>
