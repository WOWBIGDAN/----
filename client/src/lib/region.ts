import { codeToText, regionData } from 'element-china-area-data'

export const regionOptions = regionData

export function padRegionCode(code: string) {
  if (code.length >= 6) return code.slice(0, 6)
  return code.padEnd(6, '0')
}

export function toCascaderCodes(provinceCode: string, cityCode: string, districtCode: string) {
  return [provinceCode.slice(0, 2), cityCode.slice(0, 4), districtCode]
}

export function fromCascaderCodes(codes: string[]) {
  const provinceCode = codes[0] ?? ''
  const cityCode = codes[1] ?? ''
  const districtCode = codes[2] ?? ''
  return {
    provinceCode: padRegionCode(provinceCode),
    province: codeToText[provinceCode] ?? '',
    cityCode: padRegionCode(cityCode),
    city: codeToText[cityCode] ?? '',
    districtCode: padRegionCode(districtCode),
    district: codeToText[districtCode] ?? '',
  }
}
