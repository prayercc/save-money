import assetlist from '../../assets/style/assetlist.module.css'
import { Form, Radio, Input, InputNumber, Switch, Button, Space, Popconfirm, Divider } from 'antd';
import assetJson from '../../assets/img/account/map.json'

import { useSearchParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { selectById, assetActions } from '../../store/slices/assetSlice'
export default function AssetEdit() {
    //获取资产编号
    let [searchParams, setSearchParams] = useSearchParams();
    const assetId = searchParams.get('assetId');
    const asset = useSelector(state => selectById(state, assetId)) || {
        status: 'property',  //property   liabilities 
        assetName: '借记卡',
        hide: false,
        included: true
    }
    const [form] = Form.useForm();
    //资产状况变化
    const statusValue = Form.useWatch('status', form);
    const onValuesChange = (changedValues) => {
        //资产状况变化，修改资产类别当前选定数据
        if (changedValues.status) {
            form.setFieldValue('assetName', null)
        }
    }
    //资产类别：[借记卡,信用卡]和其他的区别
    const assetNameValue = Form.useWatch('assetName', form);
    const getPlaceholder = (assetNameValue) => {
        let placeholder = '';
        switch (assetNameValue) {
            case '信用卡':
            case '花呗':
            case '白条':
                placeholder = '当前欠款';
                break;
            case '借出':
                placeholder = '借出金额';
                break;
            case '借入':
                placeholder = '借入金额';
                break;
            default:
                placeholder = '账户余额';
                break;
        }
        return placeholder
    }
    //修改资产
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const onFinish = (values) => {
        let assetIcon = ''
        if (['借记卡', '信用卡'].includes(assetNameValue)) {
            const currBank = assetJson.bank.find(bank => bank.name === values.rename)
            assetIcon = currBank.icon;
        } else {
            const assetType = assetJson.type.find(type => type.name === values.assetName);
            assetIcon = assetType.icon
        }
        dispatch(assetActions.updateAsset({
            ...asset,//初始值
            ...values,//表单值
            assetIcon,
        }))
        navigate('/assetList')
    }
    //删除资产
    const deleteAsset = () => {
        dispatch(assetActions.deleteAsset(asset.id))
        navigate('/assetList')
    }
    //取消
    const back = ()=> {
        navigate('/assetList')
    }
    return (
        <div className='flexColumn' style={{ padding: '20px' }}>
            <h3 className='whiteColor' style={{ textIndent: 20 }}>{assetId ? '资产编辑' : '资产新增'}</h3>
            <Divider />
            <div className='scroll'>
                <Form
                    name="assetEdit"
                    form={form}
                    autoComplete="off"
                    labelCol={{ span: 3 }}
                    initialValues={asset}
                    onFinish={onFinish}
                    onValuesChange={onValuesChange}
                >
                    <Form.Item label="资产状况" name="status">
                        <Radio.Group>
                            <Radio.Button value="property">资产</Radio.Button>
                            <Radio.Button value="liabilities">负债</Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item label="资产类别" name="assetName" rules={[{ required: true, message: '必选!' }]}>
                        <Radio.Group>
                            {
                                assetJson.type.filter(item => item.type === statusValue).map(type => (
                                    <Radio value={type.name} key={type.icon}>
                                        <CustomerRadio type={type} />
                                    </Radio>
                                ))
                            }
                        </Radio.Group>
                    </Form.Item>
                    {/* 借记卡和信用卡，用户名需要进行银行选择 */}
                    {
                        ['借记卡', '信用卡'].includes(assetNameValue) ?
                            <Form.Item label="所属银行" name="rename" rules={[{ required: true, message: '必选!' }]}>
                                <Radio.Group>
                                    {
                                        assetJson.bank.map(type => (
                                            <Radio value={type.name} key={type.icon}>
                                                <CustomerRadio type={type} />
                                            </Radio>
                                        ))
                                    }
                                </Radio.Group>
                            </Form.Item>
                            :
                            <Form.Item label="账户名" name="rename" wrapperCol={{ span: 6 }} rules={[{ required: true, message: '必填!' }]}>
                                <Input showCount maxLength={10} />
                            </Form.Item>
                    }
                    <Form.Item label="资金">
                        <Space>
                            {
                                ['信用卡', '花呗', '白条'].includes(assetNameValue) && (
                                    <Form.Item name={['fund', 'creditLimit']} noStyle rules={[{ required: true, message: '必填!' }]}>
                                        <InputNumber
                                            addonBefore="￥"
                                            min={0}
                                            formatter={limitDecimalsP}
                                            parser={limitDecimalsP}
                                            placeholder="信用额度"
                                        />
                                    </Form.Item>
                                )
                                
                            }
                            <Form.Item name={['fund', 'balance']} noStyle rules={[{ required: true, message: '必填!' }]}>
                                <InputNumber
                                    addonBefore="￥"
                                    formatter={limitDecimalsP}
                                    parser={limitDecimalsP}
                                    placeholder={getPlaceholder(assetNameValue)}
                                />
                            </Form.Item>
                        </Space>
                    </Form.Item>
                    <Form.Item label="隐藏资产" name="hide" >
                        <Switch />
                    </Form.Item>
                    <Form.Item label="计入总资产" name="included" >
                        <Switch />
                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 3 }}>
                        <Space>
                            {
                                assetId 
                                ?  <Popconfirm
                                        title="删除资产"
                                        description="确定删除该资产?"
                                        onConfirm={deleteAsset}
                                        okText="Yes"
                                        cancelText="No"
                                    >
                                        <Button danger>删除</Button>
                                    </Popconfirm>
                                :  <Button danger onClick={back}>取消</Button>
                            }
                            <Button htmlType="reset">
                                重置
                            </Button>
                            <Button type="primary" htmlType="submit">
                                确定
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>

        </div>
    )
}
const limitDecimalsP = (value) => {
    let reg = /^(\-)*(\d+)\.(\d\d).*$/;
    return String(value).replace(reg, '$1$2.$3')
};
function CustomerRadio({ type }) {
    const getImageUrl = (icon) => {
        return new URL(`../../assets/img/account/${icon}.svg`, import.meta.url).href
    }
    return (
        <div className={assetlist.customerRadioBox}>
            <div className={assetlist.customerRadioImgWrapper}>
                <img src={getImageUrl(type.icon)} alt={type.icon} className='img' />
            </div>
            <div className={assetlist.customerRadioText}>
                <span>{type.name}</span>
            </div>
        </div>
    )
}