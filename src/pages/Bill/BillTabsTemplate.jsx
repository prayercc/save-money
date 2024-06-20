// 记账类型模板
import { Space,Button,Form,message,Avatar,Segmented ,Switch,Radio,Select,InputNumber,Input } from 'antd';
import { useMemo,useState } from 'react';
const { TextArea } = Input;

import billMap from '../../assets/img/billClass/map.json'
import { useSelector } from 'react-redux'
import { selectEntities,selectAssetList,selectBorrowList,selectLentList } from '../../store/slices/assetSlice'
//一般模板
export function NormalTemplate({type,initialValues,onFinishOuter}) {
    //资产列表
    const assetList = useSelector(selectAssetList)
    //form
    const [form] = Form.useForm();
    const categoryValue = Form.useWatch('category',form);
    //计算大类
    const categoryList = useMemo(()=>billMap[type],[type]);
    //计算小类
    const classList = useMemo(() => {
        const currCategroy = billMap[type].find(category => category.value === categoryValue)
        return currCategroy?.children || []
    },[categoryValue]);
    //提交
    const [btnLoading,setBtnLoading] = useState(false)
    const onFinish = (values) => {
        setBtnLoading(true);
        onFinishOuter({...values,type});
        form.resetFields()
        setBtnLoading(false);
    }
    const onValuesChange = (changedValues) => {
        //资产状况变化，修改资产类别当前选定数据
        if (changedValues.category) {
            form.setFieldValue('class', null)
        }
    }
    return (
        <Form 
            name={type}
            form={form} 
            autoComplete="off" 
            labelCol={{ span: 4 }}
            initialValues={initialValues}
            onFinish={onFinish}
            onValuesChange={onValuesChange}
        >
            <Form.Item label="大类" name="category" rules={[{ required: true, message: '请选择!' }]}>
                <Segmented
                    options={categoryList}
                />
            </Form.Item>
            <Form.Item label="小类" name="class" rules={[{ required: true, message: '请选择!' }]}>
                <Radio.Group>
                    {
                        classList.map(classs => (
                            <Radio key={classs.value} value={classs.value}>
                                <Space>
                                    <Avatar size='middle' src={getImageUrl(categoryValue,classs.value)} />
                                    <span style={{fontSize: '13px'}}>{classs.label}</span>
                                </Space>
                            </Radio>
                        ))
                    }
                </Radio.Group>
            </Form.Item>
            <Form.Item label="账户" name="mainAssetId" rules={[{ required: true, message: '请选择!' }]}>
                <Select style={{ width: 220 }}>
                    {
                        assetList.map(asset => (
                            <Select.Option key={asset.id} value={asset.id}>
                                {asset.rename}
                                <span style={{color: 'rgba(255, 255, 255, 0.45)'}}>({asset.assetName})</span>
                            </Select.Option>
                        ))
                    }
                    
                </Select>
            </Form.Item>
            <Form.Item label="金额" name="amount" rules={[{ required: true, message: '请填写!' }]}>
                <InputNumber 
                    addonBefore="￥" 
                    min={0} 
                    formatter={limitDecimalsP}
                    parser={limitDecimalsP}
                />
            </Form.Item>
            <Form.Item label="计入收支" name="included">
                <Switch />
            </Form.Item>
            <Form.Item label="备注" name="description" wrapperCol={{ span: 17}}>
                <TextArea rows={2} />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 4 }}>
                <Space>
                    <Button type="primary" htmlType="submit" loading={btnLoading}>
                        确定
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    )
}
//转账模板
export function TransferTemplate({type,initialValues,onFinishOuter}) {
    //资产列表
    const entities = useSelector(selectEntities)
    const assetList = useSelector(selectAssetList)
    const [form] = Form.useForm();
    const [btnLoading,setBtnLoading] = useState(false)
    const onFinish = (values) => {
        if(values.mainAssetId === values.secondaryAssetId) {
            message.error({
                content: '转入账户和转出账户不能为同一个'
            })
            return;
        }
        setBtnLoading(true);
        const mainAsset = entities[values.mainAssetId];
        const secondaryAsset = entities[values.secondaryAssetId];
        if(secondaryAsset.status === 'liabilities') {
            Object.assign(values,{
                description: '还款',
                category: 'inner',
                class: 'repayment'
            })
        } else if(mainAsset.status === 'liabilities') {
            Object.assign(values,{
                description: '套现',
                category: 'inner',
                class: 'enchashment'
            })
        } else {
            Object.assign(values,{
                description: '内部转账',
                category: 'inner',
                class: 'innerTransfer'
            })
        }
        onFinishOuter({...values,type});
        form.resetFields()
        setBtnLoading(false);
    }
    return (
        <Form 
            name={type}
            form={form} 
            autoComplete="off" 
            initialValues={initialValues}
            labelCol={{ span: 4 }}
            onFinish={onFinish}
        >
            <Form.Item label="转出账户" name="mainAssetId" rules={[{ required: true, message: '请选择!' }]}>
                <Select style={{ width: 220 }}>
                    {
                        assetList.map(asset => (
                            <Select.Option key={asset.id} value={asset.id}>
                                {asset.rename}
                                <span style={{color: 'rgba(255, 255, 255, 0.45)'}}>({asset.assetName})</span>
                            </Select.Option>
                        ))
                    }
                    
                </Select>
            </Form.Item>
            <Form.Item label="转入账户" name="secondaryAssetId" rules={[{ required: true, message: '请选择!' }]}>
                <Select style={{ width: 220 }}>
                    {
                        assetList.map(asset => (
                            <Select.Option key={asset.id} value={asset.id}>
                                {asset.rename}
                                <span style={{color: 'rgba(255, 255, 255, 0.45)'}}>({asset.assetName})</span>
                            </Select.Option>
                        ))
                    }
                    
                </Select>
            </Form.Item>
            <Form.Item label="金额" name="amount" rules={[{ required: true, message: '请填写!' }]}>
                <InputNumber 
                    addonBefore="￥"
                    min={0} 
                    formatter={limitDecimalsP}
                    parser={limitDecimalsP}
                />
            </Form.Item>
            <Form.Item label="手续费" name="commission">
                <InputNumber 
                    addonBefore="￥" 
                    min={0} 
                    formatter={limitDecimalsP}
                    parser={limitDecimalsP}
                />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 4}}>
                <Space>
                    <Button type="primary" htmlType="submit" loading={btnLoading}>
                        确定
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    )
}
//借还模板
export function CirculateTemplate({type,initialValues,onFinishOuter}) {
    //定义表单
    const [form] = Form.useForm();
    const [btnLoading,setBtnLoading] = useState(false)
    const categoryValue = Form.useWatch('category',form);
    const classValue = Form.useWatch('class',form);
    //计算大类
    const categoryList = useMemo(()=>billMap[type],[type]);
    //计算小类
    const classList = useMemo(() => {
        const currCategroy = billMap[type].find(category => category.value === categoryValue)
        return currCategroy?.children || []
    },[categoryValue]);
    //资产列表
    const assetList = useSelector(selectAssetList)
    const borrowList = useSelector(selectBorrowList)
    const lentList = useSelector(selectLentList)
    const onFinish = (values) => {
        setBtnLoading(true);
        // console.log(values)
        onFinishOuter({
            ...values
            ,type
        });
        form.resetFields()
        setBtnLoading(false);
    }
    const onValuesChange = (changedValues) => {
        //资产状况变化，修改资产类别当前选定数据
        if (changedValues.category) {
            form.setFieldValue('class', null)
        }
    }
    return (
        <Form 
            name={type}
            form={form} 
            autoComplete="off" 
            labelCol={{ span: 4 }}
            initialValues={initialValues}
            onFinish={onFinish}
            onValuesChange={onValuesChange}
        >
            <Form.Item label="大类" name="category" rules={[{ required: true, message: '请选择!' }]}>
                <Segmented
                    options={categoryList}
                />
            </Form.Item>
            <Form.Item label="小类" name="class" rules={[{ required: true, message: '请选择!' }]}>
                <Radio.Group>
                    {
                        classList.map(classs => (
                            <Radio key={classs.value} value={classs.value}>
                                <Space>
                                    <Avatar size='middle' src={getImageUrl(categoryValue,classs.value)} />
                                    <span style={{fontSize: '12px'}}>{classs.label}</span>
                                </Space>
                            </Radio>
                        ))
                    }
                </Radio.Group>
            </Form.Item>
            {
                categoryValue === "borrow" ? 
                <Form.Item label="借入账户" name="mainAssetId" rules={[{ required: true, message: '请选择!' }]}>
                    <Select style={{ width: 220 }}>
                        {
                            borrowList.map(asset => (
                                <Select.Option key={asset.id} value={asset.id}>
                                    {asset.rename}
                                    <span style={{color: 'rgba(255, 255, 255, 0.45)'}}>({asset.assetName})</span>
                                </Select.Option>
                            ))
                        }
                        
                    </Select>
                </Form.Item>
                :
                <Form.Item label= "借出账户" name="mainAssetId" rules={[{ required: true, message: '请选择!' }]}>
                    <Select style={{ width: 220 }}>
                        {
                            lentList.map(asset => (
                                <Select.Option key={asset.id} value={asset.id}>
                                    {asset.rename}
                                    <span style={{color: 'rgba(255, 255, 255, 0.45)'}}>({asset.assetName})</span>
                                </Select.Option>
                            ))
                        }
                        
                    </Select>
                </Form.Item>
            }
            {
                !["debtReduction","badDebts"].includes(classValue) &&
                <Form.Item label="资产账户" name="secondaryAssetId" rules={[{ required: true, message: '请选择!' }]}>
                    <Select style={{ width: 220 }}>
                        {
                            assetList.map(asset => (
                                <Select.Option key={asset.id} value={asset.id}>
                                    {asset.rename}
                                    <span style={{color: 'rgba(255, 255, 255, 0.45)'}}>({asset.assetName})</span>
                                </Select.Option>
                            ))
                        }
                        
                    </Select>
                </Form.Item>
            }
            
            <Form.Item label="金额" name="amount" rules={[{ required: true, message: '请填写!' }]}>
                <InputNumber 
                    addonBefore="￥"
                    min={0} 
                    formatter={limitDecimalsP}
                    parser={limitDecimalsP}
                />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 4 }}>
                <Space>
                    <Button type="primary" htmlType="submit" loading={btnLoading}>
                        确定
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    )
}
const limitDecimalsP = (value) => {
    let reg = /^(\-)*(\d+)\.(\d\d).*$/;
    return String(value).replace(reg, '$1$2.$3')
};
const getImageUrl = (category,classs) => {
    return new URL(`../../assets/img/billClass/${category}/${classs}.svg`, import.meta.url).href
}