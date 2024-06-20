import { SwapRightOutlined } from "@ant-design/icons";
import { Form, Input, InputNumber, DatePicker, Button, Space, Select, message,Popconfirm } from 'antd';
const { TextArea } = Input;

import dayjs from 'dayjs';
import { runes } from 'runes2';
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectPureList } from '../../store/slices/assetSlice'

export function SaveListTemplate({ type, description, onFinishOuter,onDeleteOuter }) {
    const [form] = Form.useForm();
    const pureList = useSelector(selectPureList)
    const [btnLoading, setBtnLoading] = useState(false)

    const onFinish = (values) => {
        setBtnLoading(true)
        if (values.mainAssetId === values.secondaryAssetId) {
            message.error({
                content: '转入账户和转出账户不能为同一个'
            })
            setBtnLoading(false)
            return;
        }
        // 灵活存期法不需要时间
        if (values.task.startTime) {
            values.task.startTime = values.task.startTime.format('YYYY/MM/DD')
        }
        onFinishOuter({
            type,
            ...values
        })
        setBtnLoading(false)
    }
    return (
        <>
            <div className="SaveModeTag">{description}</div>
            <Form
                name={type}
                form={form}
                autoComplete="off"
                labelCol={{ span: 4 }}
                initialValues={{
                    task: {
                        startTime: dayjs(new Date())
                    }

                }}
                onFinish={onFinish}
                // onValuesChange={onValuesChange}
                style={{ marginTop: "10px" }}
            >
                <Form.Item label="名称">
                    <Space>
                        <Form.Item
                            label="图标"
                            name={["base", "emoji"]}
                            noStyle
                            rules={[
                                {
                                    required: true,
                                    message: '必填',
                                },
                                () => ({
                                    validator(_, value) {
                                        if (!value || runes(value).length === 1) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('超出长度'));
                                    },
                                }),
                            ]}
                        >
                            <Input placeholder="emoji" style={{ width: 60 }} />
                        </Form.Item>
                        <Form.Item label="名称" name={["base", "name"]} noStyle rules={[{ required: true, message: '' }]}>
                            <Input maxLength={15} showCount />
                        </Form.Item>
                    </Space>
                </Form.Item>


                <Form.Item label="备注" name="description" wrapperCol={{ span: 19 }}>
                    <TextArea rows={2} />
                </Form.Item>
                <Form.Item label="存钱任务">
                    <Space>
                        {
                            type === "quota" &&
                            <>
                                <Form.Item name={["task", "repeatCycle"]} noStyle rules={[{ required: true, message: '' }]}>
                                    <Select
                                        style={{ width: 100 }}
                                        options={[
                                            { value: 'day', label: '每天' },
                                            { value: 'week', label: '每周' },
                                            { value: 'month', label: '每月' },
                                            { value: 'year', label: '每年' },
                                        ]}
                                        placeholder="重复周期"
                                    />
                                </Form.Item>
                                <Form.Item name={["task", "repeat"]} noStyle rules={[{ required: true, message: '' }]}>
                                    <InputNumber
                                        min={1}
                                        formatter={positiveInteger}
                                        parser={positiveInteger}
                                        placeholder="重复次数"
                                    />
                                </Form.Item>
                            </>
                        }
                        {
                            type === "flexible" ?
                                <Form.Item name={["task", "targetMoney"]} noStyle rules={[{ required: true, message: '' }]}>
                                    <InputNumber
                                        min={1}
                                        formatter={positiveNumber}
                                        parser={positiveNumber}
                                        placeholder="目标金额"
                                    />
                                </Form.Item>
                                :
                                <>
                                    <Form.Item name={["task", "startTime"]} noStyle rules={[{ required: true, message: '' }]}>
                                        <DatePicker inputReadOnly format="YYYY/MM/DD" allowClear={false} placeholder="起始日期" />
                                    </Form.Item>
                                    <Form.Item name={["task", "startMoney"]} noStyle rules={[{ required: true, message: '' }]}>
                                        <InputNumber
                                            min={type === "day" ? 30 : 1}
                                            formatter={positiveNumber}
                                            parser={positiveNumber}
                                            placeholder="起始金额"
                                        />
                                    </Form.Item>
                                    {
                                        !["month", "day", "quota"].includes(type) && <Form.Item name={["task", "step"]} noStyle rules={[{ required: true, message: '' }]}>
                                            <InputNumber
                                                min={1}
                                                formatter={positiveNumber}
                                                parser={positiveNumber}
                                                placeholder="递增金额"
                                            />
                                        </Form.Item>
                                    }
                                </>

                        }
                    </Space>
                </Form.Item>
                <Form.Item label="操作账户">
                    <Space>
                        <Form.Item name="mainAssetId" noStyle rules={[{ required: true, message: '' }]}>
                            <Select style={{ width: 150 }} placeholder="转出账户">
                                {
                                    pureList.map(asset => (
                                        <Select.Option key={`main${asset.id}`} value={asset.id}>
                                            {asset.rename}
                                            <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>({asset.assetName})</span>
                                        </Select.Option>
                                    ))
                                }

                            </Select>
                        </Form.Item>
                        <SwapRightOutlined />
                        <Form.Item name="secondaryAssetId" noStyle rules={[{ required: true, message: '' }]}>
                            <Select style={{ width: 150 }} placeholder="转入账户">
                                {
                                    pureList.map(asset => (
                                        <Select.Option key={`awcond${asset.id}`} value={asset.id}>
                                            {asset.rename}
                                            <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>({asset.assetName})</span>
                                        </Select.Option>
                                    ))
                                }

                            </Select>
                        </Form.Item>
                    </Space>
                </Form.Item>
                <Form.Item wrapperCol={{ offset: 4 }}>
                    <Space>
                        <Button htmlType="reset" disabled={btnLoading}>
                            重置
                        </Button>
                        <Button type="primary" htmlType="submit" loading={btnLoading}>
                            确定
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </>
    )
}
export function SavePlan({ save,saveIndex, onOuterFinish,onDeleteOuter }) {
    const saveMoney = saveIndex === -1 ? 0 : save.plans[saveIndex].saveMoney;
    const done = saveIndex === -1 ? false : save.plans[saveIndex].done;
    const mainAssetId = done ? save.plans[saveIndex].mainAssetId : save.mainAssetId;
    const secondaryAssetId = done ? save.plans[saveIndex].secondaryAssetId : save.secondaryAssetId;

    const [form] = Form.useForm();
    const pureList = useSelector(selectPureList)
    const onFinish = (values) => {
        onOuterFinish(values);
        form.resetFields();
    }
    const deleteOnePlan = ()=> {
        onDeleteOuter({
            id: save.id,
            billId: save.plans[saveIndex].billId,
            saveIndex
        })
        form.resetFields();
    }
    return (
        <Form
            name="savePlan"
            form={form}
            autoComplete="off"
            labelCol={{ span: 6 }}
            initialValues={{
                mainAssetId,
                secondaryAssetId,
                saveMoney
            }}
            onFinish={onFinish}
            // // onValuesChange={onValuesChange}
            style={{ padding: "10px" }}
        >
            <Form.Item label="金额" name="saveMoney">
                <InputNumber style={{ width: 200 }} disabled={save.type !== "flexible"} />
            </Form.Item>
            <Form.Item label="转出账户" name="mainAssetId" rules={[{ required: true, message: '' }]}>
                <Select style={{ width: 200 }} placeholder="转出账户">
                    {
                        pureList.map(asset => (
                            <Select.Option key={`main${asset.id}`} value={asset.id}>
                                {asset.rename}
                                <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>({asset.assetName})</span>
                            </Select.Option>
                        ))
                    }

                </Select>
            </Form.Item>
            <Form.Item label="转入账户" name="secondaryAssetId" rules={[{ required: true, message: '' }]}>
                <Select style={{ width: 200 }} placeholder="转入账户">
                    {
                        pureList.map(asset => (
                            <Select.Option key={`awcond${asset.id}`} value={asset.id}>
                                {asset.rename}
                                <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>({asset.assetName})</span>
                            </Select.Option>
                        ))
                    }

                </Select>
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 6 }}>
                <Space>
                    {
                        done 
                        ? <Popconfirm
                            title="取消存入"
                            description="确定取消该笔存入(已有转账回滚)?"
                            onConfirm={deleteOnePlan}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button danger>取消存入</Button> 
                        </Popconfirm>
                        : <Button type="primary" htmlType="submit">确定</Button>
                    }
                    
                </Space>
            </Form.Item>
        </Form>
    )
}
//正数
const positiveNumber = (value) => {
    let reg = /(\d+)\.(\d\d).*/;
    return String(value).replace(reg, '$1.$2')
};
//正整数
const positiveInteger = (value) => {
    let reg = /(\d+).*/;
    return String(value).replace(reg, '$1')
};