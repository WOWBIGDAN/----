import { Cascader, Form, Input, Switch } from 'antd'
import type { FormInstance } from 'antd'
import { regionOptions } from '../lib/region'

export interface AddressFormValues {
  recipient: string
  phone: string
  region: string[]
  detail: string
  isDefault: boolean
}

export function AddressForm({ form }: { form: FormInstance<AddressFormValues> }) {
  return (
    <Form form={form} layout="vertical" initialValues={{ isDefault: false, region: [] }}>
      <Form.Item name="recipient" label="收件人" rules={[{ required: true, max: 32, message: '请填写收件人' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="phone" label="手机号" rules={[{ required: true, pattern: /^1\d{10}$/, message: '请输入 11 位手机号' }]}>
        <Input maxLength={11} />
      </Form.Item>
      <Form.Item name="region" label="所在地区" rules={[{ required: true, type: 'array', min: 3, message: '请选择省市区' }]}>
        <Cascader options={regionOptions} placeholder="请选择省 / 市 / 区" />
      </Form.Item>
      <Form.Item name="detail" label="详细地址" rules={[{ required: true, max: 200, message: '请填写详细地址' }]}>
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item name="isDefault" label="设为默认地址" valuePropName="checked">
        <Switch />
      </Form.Item>
    </Form>
  )
}
