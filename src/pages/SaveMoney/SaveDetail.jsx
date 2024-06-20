import {  Divider, Card, Flex, Popconfirm, Modal, Tag, Progress } from "antd";
import { DeleteOutlined,DollarOutlined } from "@ant-design/icons";

import { useState, useMemo } from "react"
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from "react-redux";
import { selectById, saveActions } from "../../store/slices/saveSlice";
import { getHasSavedCount, getHasSavedMoney} from "./SaveList";
import dayjs from 'dayjs';
import CountTo from 'react-count-to';
import { SavePlan } from "./SaveListTemplate";
export default function SaveDetail() {
    const { saveId } = useParams()
    const save = useSelector(state => selectById(state, saveId))
    //计算accumulateMoney，仅flexible需要
    let accumulateMoneyList = []
    if(save.type === "flexible" && save.plans.length > 0) {
        let accumulateMoney = 0;
        for(const plan of save.plans) {
            accumulateMoney += plan.saveMoney
            accumulateMoneyList.push(accumulateMoney)
        }
    }
    //计算已经存储金额
    const hasSavedMoney = useMemo(() => {
        return getHasSavedMoney(save.plans)
    }, [save])
    //已经存储金额占比
    const hasSavedRate = parseFloat(((hasSavedMoney / save.targetMoney) * 100).toFixed(2))
    // 存逻辑
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saveIndex, setSaveIndex] = useState(-1)
    const toggleModal = () => {
        setIsModalOpen(flag => !flag)
    }
    const planDate = (index) => {
        setSaveIndex(index);
        toggleModal()
    }
    const dispatch = useDispatch()
    const onFinish = (valus) => {
        dispatch(saveActions.completeOnePlanAsync({
            ...valus,
            ...save.base,
            saveIndex,
            id: save.id,
            icon: parseInt(Math.random() * 11),
            completeTime: dayjs().format('YYYY/MM/DD')
        }))
        toggleModal()
        setSaveIndex(-1)
    }
    const navigate = useNavigate()
    const deleteSavePlan = () => {
        dispatch(saveActions.removeSave(save.id));
        navigate('/saveList')
    }
    const onDeleteOne = (values) => {
        dispatch(saveActions.cancellationOneAsync(values));
        toggleModal();
        setSaveIndex(-1);
    }
    return (
        <div style={{ padding: "20px", height: "100%" }}>
            <Flex vertical>
                <h3 className='whiteColor'>{save.base.emoji}&nbsp;{save.base.name}</h3>
                <Flex vertical gap={5}>
                    <span className="greyFont">{save.description}</span>
                    <Flex wrap="wrap">
                        {
                            save.type !== "flexible" && <Tag color="blue">执行{save.plans.length}次结束</Tag>
                        }
                        {
                            save.frequency && <Tag>{save.frequency}</Tag>
                        }
                        <Tag>已执行{getHasSavedCount(save.plans)}次</Tag>
                        <Tag color="#f50">累计 <CountTo to={hasSavedMoney} speed={500} digits={2} /></Tag>
                        {
                            save.type === "flexible" &&
                            <Tag color="#108ee9" style={{ cursor: "pointer" }} onClick={toggleModal}><DollarOutlined /> 存一笔</Tag>
                        }
                        <Popconfirm
                            title="删除计划"
                            description="确定删除该计划(已有转账不回滚)?"
                            onConfirm={deleteSavePlan}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Tag color="red" style={{ cursor: "pointer" }}><DeleteOutlined /> 删除计划</Tag>
                        </Popconfirm>

                    </Flex>
                </Flex>
                <Progress
                    percent={hasSavedRate}
                    strokeColor='#108ee9'
                    style={{ marginTop: '10px' }}
                />
            </Flex>
            <Divider />
            {/* 计划列表 */}
            <div className='scroll' style={{ height: 'calc(100% - 160px)' }} >
                <Flex gap={15} wrap={'wrap'}>
                    {
                        save.plans.map((plan, index) => (
                            <div
                                key={plan.id}
                                className="planBox"
                                style={makeSavedStyle(plan)}
                                onClick={() => planDate(index)}
                            >
                                <div className="planBoxTitle">{getStrDate(plan.time)}</div>
                                <Flex vertical align="center" gap={2}>
                                    <span>存:{plan.saveMoney}</span>
                                    <span className="greyFont">
                                        累计:
                                        {
                                            plan.accumulateMoney || accumulateMoneyList[index]
                                        }
                                    </span>
                                    <Tag color={plan.done ? '#87d068':'processing'}style={{ alignSelf: "flex-end", fontSize: "10px" }}>
                                        {
                                            plan.done ? getStrDate(plan.completeTime) : '未存入'
                                        }
                                    </Tag>
                                </Flex>
                            </div>
                        ))
                    }
                </Flex>
            </div>
            {/* 弹窗确认 */}
            <Modal
                title="存钱"
                width="400px"
                centered
                open={isModalOpen}
                footer={null}
                onCancel={toggleModal}
            >
                <Card size="small">
                    <SavePlan save={save} saveIndex={saveIndex} onOuterFinish={onFinish} onDeleteOuter={onDeleteOne} />
                </Card>
            </Modal>
        </div>
    )
}

const getStrDate = (dateStr) => {
    const date = dayjs(dateStr)
    return (date.get('month') + 1) + '月' + date.get('date') + '日'
}
const makeSavedStyle = (plan) => {
    if (plan.done) {
        return {
            background: `url(/save/${plan.icon}.svg) left 18px no-repeat,rgba(255, 255, 255, 0.37)`,
            backgroundSize: 'contain'
        }
    } else {
        return {}
    }
}