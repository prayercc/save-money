// 用于展示账单列表
import { Flex,List,Avatar,Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

import { useSelector } from 'react-redux'
import React,{ useMemo } from 'react'
import billClass from '../../assets/img/billClass/map.json'
import CountTo from 'react-count-to';

export  function BillListTemplate({ billList,deleteBill }) {
    const assetEntities = useSelector(state => state.asset.entities)
    //获取展示文字
    function getFontDescription(item) {
        if(item.secondaryAssetId) {
            return getAssetNameById(item.mainAssetId) +"->"+ getAssetNameById(item.secondaryAssetId)
        } else {
            return getAssetNameById(item.mainAssetId)
        }
    }
    //根据资产id获取展示名称
    function getAssetNameById(id) {
        const asset = assetEntities[id]
        if(asset.assetName === '信用卡') {
            return asset.rename + '信用卡'
        }
        return asset.rename
    }
    //获取分类名称
    const allBillClass = useMemo(() => {
        const temp = new Map();
        for(const group of Object.values(billClass)) {
            for(let category of group) {
                temp.set(category.value,category.label)
                if(category.children) {
                    for(let classs of category.children) {
                        temp.set(category.value +'/'+ classs.value,classs.label)
                    }
                }
            }
        }
        return temp;
    },[])
    return (
        <List
            itemLayout="horizontal"
            dataSource={billList}
            locale="暂无数据"
            renderItem={(item) => (
                <List.Item
                    actions={[
                        // <EditOutlined title="编辑" />,
                        <Popconfirm
                            title="删除账单"
                            description="确定删除条账单?"
                            onConfirm={() => deleteBill(item)}
                            okText="Yes"
                            cancelText="No"
                            placement="left"
                        >
                            <DeleteOutlined title="删除" />
                        </Popconfirm>
                    ]}
                >
                    <List.Item.Meta
                        avatar={<Avatar shape="square" size='large' style={{ backgroundColor: '#fff' }} src={getImageUrl(item.category, item.class)} />}
                        title={allBillClass.get(item.category) + "-" + allBillClass.get(item.category + "/" + item.class)}
                        description={item.description}
                    />
                    <Flex vertical align='end'>
                        <CountTo to={item.amount} speed={500} digits={2} className={`moneyFont ${getFontColor(item)}`} />
                        {
                            item.commission > 0 && <span className='redFont'>手续费:{item.commission}</span>
                        }
                        <span className='greyFont'>{getFontDescription(item)}</span>
                    </Flex>
                </List.Item>
            )}
        />
    )
}

function getFontColor(item) {
    if(item.type === "income" && item.included) {
        return "red"
    } else if(item.type === "expenditure" && item.included) {
        return "green"
    }else {
        return '';
    }
}
const getImageUrl = (category,classs) => {
    return new URL(`../../assets/img/billClass/${category}/${classs}.svg`, import.meta.url).href
}