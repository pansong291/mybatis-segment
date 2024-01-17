<template>
  <NFlex :wrap="false" vertical class="ms-content">
    <NFlex :wrap="false" class="ph-16" vertical>
      <NInput type="textarea" v-model:value="data.input" placeholder="输入" :input-props="constant.inputProps" />
      <NFlex :wrap="false" align="center">
        我已确认上面输入的字段为
        <NSelect style="width: 100px" v-model:value="data.inputType" :options="constant.options.inputType" />
        形式，并且以
        <NInput style="width: 100px"
          v-model:value="separator"
          placeholder="js 常量值"
          :status="internal.separator.status"
          :input-props="constant.inputProps" />
        分隔。
      </NFlex>
    </NFlex>
    <NTabs class="ms-main-tabs" v-model:value="data.outputType" animated type="line" :tabs-padding="16">
      <NTab v-for="tab in constant.options.outputType" :key="tab.name" :name="tab.name">{{ tab.tab }}</NTab>
    </NTabs>
    <NFlex :wrap="false" class="ph-16" vertical>
      <NFlex>
        <NFlex :wrap="false" align="center" v-if="isIfTag">
          <NCheckbox v-model:checked="data.ifTag">if 标签</NCheckbox>
        </NFlex>
        <NFlex :wrap="false" align="center" v-if="showWrapQuote">
          <NCheckbox v-model:checked="data.wrapQuote">反引包裹</NCheckbox>
        </NFlex>
        <NFlex v-if="showTableAlias" :wrap="false" align="center">
          <div class="form-item-label">别名</div>
          <NInput v-model:value="data.tableAlias" placeholder="t" :input-props="constant.inputProps" />
        </NFlex>
        <NFlex v-if="showEntityName" :wrap="false" align="center">
          <div class="form-item-label">实体</div>
          <NInput v-model:value="data.entityName" placeholder="e" :input-props="constant.inputProps" />
        </NFlex>
        <NFlex v-if="isIfTag" :wrap="false" align="center">
          <div class="form-item-label">前缀</div>
          <NInput v-model:value="data.statementPrefix" placeholder="and" :input-props="constant.inputProps" />
        </NFlex>
        <NFlex v-if="isIfTag" :wrap="false" align="center">
          <div class="form-item-label">后缀</div>
          <NInput v-model:value="data.statementSuffix" placeholder="," :input-props="constant.inputProps" />
        </NFlex>
      </NFlex>
      <NFlex v-if="showCode" :wrap="false" align="center">
        <div class="form-item-label">js 代码</div>
        <NInput
          type="textarea"
          class="code-area"
          :style="`--code-error-msg:'${internal.code.msg}';--code-error-msg-display:${internal.code.display}`"
          v-model:value="data.code"
          :status="internal.code.status"
          placeholder="function(str) { return str }"
          :input-props="constant.inputProps"
          autosize />
      </NFlex>
      <NInput
        type="textarea"
        :value="output"
        placeholder="输出"
        readonly
        :input-props="constant.inputProps"
        autosize
        @click="copyContent(output)" />
    </NFlex>
  </NFlex>
</template>

<script setup>
import { NCheckbox, NInput, NFlex, NTab, NTabs, NForm, NFormItem, NSelect, NP, useMessage } from 'naive-ui'
import { computed, reactive } from 'vue'
import { camelToSnake, copyContent, myBatisBaseXml, removeAliasReference, snakeToCamel, unwrapBackQuote } from '@/assets/utils'

window.$message = useMessage()

const constant = {
  options: {
    inputType: [
      { value: 'under', label: '下划线' },
      { value: 'camel', label: '驼峰' }
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
  ifTag: true,
  wrapQuote: true,
  tableAlias: '',
  entityName: '',
  statementPrefix: '',
  statementSuffix: '',
  code: 'function(arr) {\n return arr.join()\n}'
})

const showWrapQuote = computed(() => {
  return ['under', 'if-tag', 'dup-key'].indexOf(data.outputType) >= 0
})

const showTableAlias = computed(() => {
  return ['under', 'if-tag', 'dup-key'].indexOf(data.outputType) >= 0
})

const showEntityName = computed(() => {
  return ['sharp', 'if-tag'].indexOf(data.outputType) >= 0
})

const isIfTag = computed(() => {
  return ['if-tag'].indexOf(data.outputType) >= 0
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
  return data.input.split(data.separator).map(s => removeAliasReference(s)).map(s => unwrapBackQuote(s)).filter((s) => !!s)
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

const aliasPrefix = computed(() => {
  return data.tableAlias ? data.tableAlias + '.' : ''
})

const entityPrefix = computed(() => {
  return data.entityName ? data.entityName + '.' : ''
})

const getSharp = () => {
  return camel.value.map((s) => `#{${entityPrefix.value}${s}}`).join()
}

const getUnder = () => {
  let underArr = under.value
  if (data.wrapQuote) {
    underArr = underArr.map((s) => '`' + s + '`')
  }
  if (aliasPrefix.value) {
    underArr = underArr.map((s) => aliasPrefix.value + s)
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
  const prefix = data.statementPrefix ? `${data.statementPrefix} ` : ''
  const suffix = data.statementSuffix
  for (let i = 0; i < underArr.length; i++) {
    const par = entityPrefix.value + camelArr[i]
    const col = aliasPrefix.value + underArr[i]
    const inner = `${prefix}${col} = #{${par}}${suffix}`
    if (data.ifTag) ifArr.push(`<if test="${par} != null">${inner}</if>`)
    else ifArr.push(inner)
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
  if (aliasPrefix.value) {
    underArr = underArr.map((s) => aliasPrefix.value + s)
  }
  const dkArr = []
  for (let i = 0; i < underArr.length; i++) {
    dkArr.push(`${underArr[i]}=values(${underArr[i]})`)
  }
  return dkArr.join()
}

const getCustom = () => {
  const fnCode = data.code
  try {
    const func = new Function(`return ${fnCode}`)()
    if (typeof func !== 'function') throw TypeError('表达式的值必须是一个函数')
    const result = func.call(void 0, splits.value)
    if (typeof result !== 'string') throw EvalError('该函数必须返回一个字符串')
    internal.code.status = 'success'
    internal.code.display = 'none'
    return result
  } catch (e) {
    internal.code.status = 'error'
    internal.code.msg = String(e).replaceAll('\'', '\\\'')
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

  .form-item-label {
    flex: 1 0 auto;
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
