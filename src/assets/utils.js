export const myBatisBaseXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="">

</mapper>
`

export function copyContent(content) {
  if (content) {
    if (window.utools) {
      window.utools.copyText(content)
      window.$message?.success('已复制')
    }
  }
}

export function camelToSnake(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

export function snakeToCamel(str) {
  return str.replace(/_(\w)/g, (all, letter) => {
    return letter.toUpperCase()
  })
}
