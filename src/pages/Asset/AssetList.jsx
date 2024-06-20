
//样式，ui
import assetlist from '../../assets/style/assetlist.module.css'
import { Divider,Flex,Button } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined,PlusCircleOutlined } from '@ant-design/icons';
//核心
import { useState,useMemo } from 'react';
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectEntities } from '../../store/slices/assetSlice'
import CountTo from 'react-count-to';

export default function AssetList(){
    const assetEntities = useSelector(selectEntities)
    const assetList = useMemo(()=>{
        return Object.values(assetEntities)
    },[assetEntities])
    //计算总资产
    const allAssets = useMemo(() => {
        return assetList.reduce((prev,curr) => {
            //资产+计入资产
            if(curr.status === 'property' && curr.included) {
                return prev + curr.fund.balance
            } else {
                return prev
            }
        },0)
    },assetList)
    //计算总负债
    const allLiabilities = useMemo(() => {
        return assetList.reduce((prev,curr) => {
            //负债+计入资产
            if(curr.status === 'liabilities' && curr.included) {
                return prev + curr.fund.balance
            } else {
                return prev
            }
        },0)
    },assetList)
    //计算净资产
    const netAssets = useMemo(() => {
        return allAssets + allLiabilities
    },[allAssets,allLiabilities])
    //展示金额数据
    const [eyeStatus,setEyestatus] = useState(false)
    const changeStatus = () => {
        setEyestatus(status => !status)
    }
    
    return (
        <div className='flexColumn'>
            <div className={assetlist.assetTop}>
                <StatisticTitle title="净资产(元)" eyeStatus={eyeStatus} changeStatus={changeStatus}></StatisticTitle>
                <ShowMoney eyeStatus={eyeStatus} value={netAssets}></ShowMoney>
                <Flex align="center" gap={20}>
                    <Flex gap={10}>
                        <span>总资产</span>
                        <span className='red'>
                            <ShowMoney eyeStatus={eyeStatus} value={allAssets}></ShowMoney>
                        </span>
                    </Flex>
                    <Flex gap={10}>
                        <span>总负债</span>
                        <span className='green'>
                            <ShowMoney eyeStatus={eyeStatus} value={allLiabilities}></ShowMoney>
                        </span>
                    </Flex>
                    <Link to="edit">
                        <Button  type="dashed" icon={<PlusCircleOutlined />}>新增</Button>
                    </Link>
                </Flex>
                
            </div>
            <Divider />
            <div className='scroll' style={{padding: '0 20px'}}>
                <Flex gap={15} wrap={'wrap'}>
                    {
                        assetList.map(_ => (
                            <Link key={_.id} to={`edit?assetId=${_.id}`}>
                                <div className={assetlist.card}>
                                    <div className={assetlist.cardImgBox}>
                                        <img className={ assetlist.cardImg } src={getImageUrl(_.assetIcon)} alt={_.assetIcon} />
                                    </div>
                                    <div className={assetlist.cardMsg}>
                                        <span>{_.rename}</span>
                                        <Divider type="vertical" />
                                        <span className={assetlist.cardMsgType}>{_.assetName}</span>
                                        <span className={assetlist.cardMsgBalance}>
                                            <ShowMoney eyeStatus={eyeStatus} value={_.fund.balance} status={_.status}></ShowMoney>
                                        </span>
                                    </div>
                                    {
                                        !_.included && <span className={assetlist.tag} >未计入</span>
                                    }
                                </div>
                            </Link>
                        ))
                    }
                </Flex>
            </div>
        </div>
    )
}
const getImageUrl = (icon) => {
    return new URL(`../../assets/img/account/${icon}.svg`, import.meta.url).href
}
function StatisticTitle({title,eyeStatus,changeStatus}) {
    console.log('StatisticTitle组件刷新')
    return (
        <Flex align="center" gap={10}>
            <span>{title}</span>
            <Button type="link" icon={eyeStatus ? <EyeOutlined /> : <EyeInvisibleOutlined />} onClick={changeStatus}></Button>
        </Flex>
    )
}
function ShowMoney({eyeStatus,value}) {
    return eyeStatus ? <CountTo to={value} speed={500} digits={2} />: '******'
}