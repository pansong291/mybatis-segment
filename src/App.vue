<template>
  <NConfigProvider :theme="internal.theme" :theme-overrides="internal.themeOverrides">
    <NGlobalStyle />
    <NMessageProvider placement="bottom">
      <Content />
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup>
  import { darkTheme, NConfigProvider, NGlobalStyle, NMessageProvider } from 'naive-ui'
  import { onMounted, reactive } from 'vue'
  import Content from './views/Content.vue'

  const internal = reactive({
    theme: void 0,
    themeOverrides: {
      common: {
        fontFamily:
          'v-mono, Consolas, SFMono-Regular, Menlo, Courier, v-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif, monospace, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
      }
    }
  })

  const setupTheme = () => {
    let dark = true
    if (window.utools) dark = window.utools.isDarkColors()
    internal.theme = dark ? darkTheme : void 0
  }

  onMounted(setupTheme)

  utools.onPluginEnter?.(setupTheme)
</script>

<style lang="scss" scoped></style>
