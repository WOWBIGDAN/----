import { Button, Form, Modal, Radio, Space, Tag, Typography } from 'antd'
import { useState } from 'react'
import { useCreateAddressMutation, useDeleteAddressMutation, useGetAddressesQuery, useReplaceAddressMutation } from '../../api/api'
import type { Address } from '../../api/types'
import { AddressForm, type AddressFormValues } from '../../components/AddressForm'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageState } from '../../components/PageState'
import { formatAddress, formatPhone, toE164 } from '../../lib/format'
import { fromCascaderCodes, toCascaderCodes } from '../../lib/region'
import { useTitle } from '../../lib/useTitle'

export function AddressPage() {
  useTitle('收货地址')
  const addresses = useGetAddressesQuery({ page: 1, pageSize: 50 })
  const [createAddress, createState] = useCreateAddressMutation()
  const [replaceAddress, replaceState] = useReplaceAddressMutation()
  const [deleteAddress] = useDeleteAddressMutation()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Address>()
  const [error, setError] = useState<unknown>(null)
  const [form] = Form.useForm<AddressFormValues>()

  const showCreate = () => {
    setEditing(undefined)
    form.resetFields()
    setOpen(true)
  }

  const showEdit = (address: Address) => {
    setEditing(address)
    form.setFieldsValue({
      recipient: address.recipient,
      phone: formatPhone(address.phone),
      region: toCascaderCodes(address.provinceCode, address.cityCode, address.districtCode),
      detail: address.detail,
      isDefault: address.isDefault,
    })
    setOpen(true)
  }

  const submit = async () => {
    const values = await form.validateFields()
    const region = fromCascaderCodes(values.region)
    const body = {
      recipient: values.recipient.trim(),
      phone: toE164(values.phone),
      ...region,
      detail: values.detail.trim(),
      isDefault: values.isDefault,
    }
    setError(null)
    try {
      if (editing) await replaceAddress({ id: editing.id, body: { ...body, isDefault: values.isDefault, version: editing.version } }).unwrap()
      else await createAddress(body).unwrap()
      setOpen(false)
    } catch (submitError) {
      setError(submitError)
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>收货地址</Typography.Title>
        <Button type="primary" onClick={showCreate}>新增地址</Button>
      </Space>
      <PageState isLoading={addresses.isLoading} error={addresses.error} isEmpty={!addresses.data?.items.length} emptyText="还没有收货地址">
        <Radio.Group style={{ width: '100%' }} value={addresses.data?.items.find((item) => item.isDefault)?.id}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {addresses.data?.items.map((item) => (
              <div key={item.id} style={{ background: '#fff', border: '1px solid #e4eeeb', borderRadius: 12, padding: 16 }}>
                <div>
                  {item.recipient} {formatPhone(item.phone)} {item.isDefault ? <Tag color="green">默认</Tag> : null}
                </div>
                <div>{formatAddress(item)}</div>
                <Space style={{ marginTop: 8 }}>
                  <Button size="small" onClick={() => showEdit(item)}>编辑</Button>
                  <Button
                    size="small"
                    danger
                    onClick={() => {
                      Modal.confirm({
                        title: '删除这个地址？',
                        onOk: () => deleteAddress(item.id).unwrap(),
                      })
                    }}
                  >
                    删除
                  </Button>
                </Space>
              </div>
            ))}
          </Space>
        </Radio.Group>
      </PageState>
      <Modal title={editing ? '编辑地址' : '新增地址'} open={open} onCancel={() => setOpen(false)} onOk={() => void submit()} confirmLoading={createState.isLoading || replaceState.isLoading}>
        <AddressForm form={form} />
        {error ? <ErrorAlert error={error} /> : null}
      </Modal>
    </div>
  )
}
