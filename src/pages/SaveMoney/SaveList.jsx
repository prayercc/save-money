import { Space, Divider, Card, Flex, Tabs, Button, Modal, Tag, Avatar } from "antd";
import { PlusCircleOutlined } from "@ant-design/icons";

import { useState, useCallback } from "react"
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import CountTo from 'react-count-to';

import { SaveListTemplate } from "./SaveListTemplate";
import { saveActions, selectSaveList } from "../../store/slices/saveSlice";
import { useMemo } from "react";


export default function SaveList() {
    //计划类型
    const [filterType, setFilter] = useState(true);
    const changeType = (type) => {
        setFilter(type)
    }
    //列表
    const saveList = useSelector(selectSaveList);
    const saveListComplete = useMemo(()=> {
        const list = []
        for(const plan of saveList) {
            const saveMoney = getHasSavedMoney(plan.plans);
            list.push({
                ...plan,
                saveMoney
            })
        }
        return list
    },[saveList])
    // const getDisplayList = useCallback(()=>{
    //     if(setFilter === "progressing") {
    //         return saveListComplete.filter(_ => _.targetMoney !== _.saveMoney)
    //     } else {
    //         return saveListComplete.filter(_ => _.targetMoney === _.saveMoney)
    //     }
    // },[saveListComplete,setFilter])
    //弹窗
    const [isModalOpen, setIsModalOpen] = useState(false);
    const toggleModal = () => {
        setIsModalOpen(flag => !flag)
    }
    const dispatch = useDispatch()
    const onFinishOuter = useCallback((saves) => {
        dispatch(saveActions.addSavaAsync(saves))
        toggleModal()
    }, [])
    const saveTabsItems = [
        {
            key: "everyDay",
            label: "365天存钱法",
            children: <SaveListTemplate
                type="everyDay"
                onFinishOuter={onFinishOuter}
                description="🐱‍👤第一天存1元，第二天2元，以此类推，每次递增1元，第365天存365元。1年下来能✔66795元。"
            />
        },
        {
            key: "week52",
            label: "52周存钱法",
            children: <SaveListTemplate
                type="week52"
                onFinishOuter={onFinishOuter}
                description="🐱‍🏍每周存一笔钱。第一周存10元，第二周存20元，以此类推，第52周存520元。52周刚好是一年，一年可以✔13780元。"
            />
        },
        {
            key: "day",
            label: "30天倒数存钱法",
            children: <SaveListTemplate
                type="day"
                onFinishOuter={onFinishOuter}
                description="🐱‍💻每🈷1号存30元，2号存29元，依次递减，到30号存1元。每月可以✔465元。"
            />
        },
        {
            key: "month",
            label: "12月定额存钱法",
            children: <SaveListTemplate
                type="month"
                onFinishOuter={onFinishOuter}
                description="🐱‍🐉全年12月，每月定期存储一定金额。"
            />
        },
        {
            key: "week",
            label: "星期存钱法",
            children: <SaveListTemplate
                type="week"
                onFinishOuter={onFinishOuter}
                description="🐱‍👓星期一存10元，星期二存20元，依次递增到星期天存70元，每周可✔280元。"
            />
        },
        {
            key: "quota",
            label: "定额存钱法",
            children: <SaveListTemplate
                type="quota"
                onFinishOuter={onFinishOuter}
                description="🐱‍🚀每次存入固定金额，账户可以是理财产品，存单是等。"
            />
        },
        {
            key: "flexible",
            label: "灵活存钱法",
            children: <SaveListTemplate
                type="flexible"
                onFinishOuter={onFinishOuter}
                description="✨灵活存钱法不需要设置很多，只需要一个目标🗡、目标金额就可以开始存钱。"
            />
        }
    ]
    //获取模式名称
    const getModelNameByKey = useCallback((key) => {
        const tab = saveTabsItems.find(tab => tab.key === key)
        return tab.label
    }, [])
    return (
        <div style={{ padding: "20px", height: "100%" }} className="flexColumn">
            <Space size="large">
                <h3 style={{ textIndent: 20 }}>
                    <span className={`pointer ${filterType ? "whiteColor" : "greyFont"}`} onClick={() => changeType(true)}>进行中</span>
                    <Divider type="vertical" />
                    <span className={`pointer ${filterType ? "greyFont" : "whiteColor" }`} onClick={() => changeType(false)}>归档</span>
                </h3>
                <Button type="dashed" icon={<PlusCircleOutlined />} onClick={toggleModal}>添加</Button>
            </Space>
            <Divider />
            {/* 计划列表 */}
            <div className='scroll' style={{ padding: '0 20px' }}>
                <Flex gap={15} wrap={'wrap'}>
                    {
                        saveListComplete.filter(_ => (filterType && _.saveMoney < _.targetMoney) || (!filterType && _.saveMoney >= _.targetMoney)).map(save => (
                            <Link key={save.id} to={`${save.id}/detail`}>
                                <div className="saveBox">
                                    <div className="saveBoxTitle">{getModelNameByKey(save.type)}</div>
                                    <div className="saveBoxContainer">
                                        <Flex justify="space-between" align="center" gap={10}>
                                            <Avatar shape="square" size={52} style={{ fontSize: "40px" }}>{save.base.emoji}</Avatar>
                                            <Flex vertical gap={8}>
                                                <span>{save.base.name}</span>
                                                <div>
                                                    {
                                                        save.type === "flexible" 
                                                        ? <Tag color="#87d068" bordered={false}>灵活模式</Tag>
                                                        : <Tag color="#108ee9" bordered={false}>定额模式</Tag>
                                                    }
                                                </div>
                                            </Flex>
                                            <Flex vertical gap={8} flex={1} align="flex-end">
                                                <CountTo to={save.targetMoney} speed={500} digits={2} />
                                                <span className="greyFont">
                                                    已存入:
                                                    <CountTo to={save.saveMoney} speed={500} digits={2} />
                                                </span>
                                            </Flex>
                                        </Flex>
                                    </div>
                                    <div>
                                        {
                                            save.type !== "flexible" &&  <Tag color="blue">执行{save.plans.length}次结束</Tag>
                                        }
                                        {
                                            save.frequency && <Tag>{save.frequency}</Tag>
                                        }
                                        
                                        <Tag>已执行{getHasSavedCount(save.plans)}次</Tag>
                                    </div>
                                </div>
                            </Link>
                        ))
                    }
                </Flex>
            </div>
            {/* 添加存钱计划 */}
            <Modal
                title="添加存钱计划"
                width="650px"
                open={isModalOpen}
                footer={null}
                onCancel={toggleModal}
            >
                <Card size="small">
                    <Tabs defaultActiveKey="expenditure" items={saveTabsItems} />
                </Card>
            </Modal>
        </div>
    )
}


//获取模式已存入金额
export const getHasSavedMoney = (plans) => {
    if (!plans || plans.length === 0) {
        return 0
    }
    return plans.filter(plan => plan.done).reduce((prev, curr) => prev + curr.saveMoney, 0)
}
export const getHasSavedCount = (plans) => {
    if (!plans) {
        return 0
    }
    return plans.filter(plan => plan.done).length
}