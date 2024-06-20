import { Space, Divider, Flex, Card, Tabs, Button, Switch, DatePicker, message, Affix } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';

import React, { useState,useCallback,useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { billActions, selectThreeDays } from '../../store/slices/billSlice'
import { NormalTemplate, TransferTemplate, CirculateTemplate } from './BillTabsTemplate'
import { BillListTemplate } from './BillListTemplate'
import dayjs from 'dayjs';
import CountTo from 'react-count-to';
import Model from '../../components/ModelCus';
import { useMemo } from 'react';



export default function BillList() {
    //账单列表
    const billList = useSelector(selectThreeDays);   
    //弹窗控制
    const [isModalOpen, setIsModalOpen] = useState(false);
    const toggleModal = () => {
        setIsModalOpen(flag => !flag)
    }
    //时间
    const [date, setDate] = useState(dayjs(new Date()));
    const dateChange = useCallback((date, dateStr) => {
        setDate(d => d = date)
    },[])
    //统一处理表单
    const titleRef = useRef();
    const dispatch = useDispatch();
    const onFinishOuter = (values) => {
        dispatch(billActions.addBillAsync({
            ...values,
            from: 'normal',
            date: date.format('YYYY/MM/DD')
        }))
        toggleModal()
    }
    const deleteBill = (bill) => {
        if (bill.from === "normal") {
            dispatch(billActions.removeBillAsync(bill.id))
        } else {
            message.warning({
                content: '存钱记录,需在相关页面取消该记录！'
            })
        }
    }
    const billTabsItems = [
        {
            key: 'expenditure',
            label: '支出',
            children: <NormalTemplate type="expenditure" initialValues={initialValues['expenditure']} onFinishOuter={onFinishOuter} />
        },
        {
            key: 'income',
            label: '收入',
            children: <NormalTemplate type="income" initialValues={initialValues['income']} onFinishOuter={onFinishOuter} />
        },
        {
            key: 'transfer',
            label: '转账',
            children: <TransferTemplate type="transfer" initialValues={initialValues['transfer']} onFinishOuter={onFinishOuter} />
        },
        {
            key: 'circulate',
            label: '借还',
            children: <CirculateTemplate type="circulate" initialValues={initialValues['circulate']} onFinishOuter={onFinishOuter} />
        }
    ]
    return (
        <div style={{ padding: '20px', height: '100%' }}>
            <Flex vertical style={{ height: '100%' }} className="scroll">
                {
                    billList.map(bills => (
                        <div key={bills.name}>
                            <Flex justify="space-between">
                                <Space style={{ color: 'rgba(255, 255, 255, 0.65)', fontFamily: 'AliMedium' }}>
                                    <span>{bills.name}</span>
                                    <span>{getWeekName(bills.time)}</span>
                                </Space>
                                <Space size="large">
                                    <span className='red'>收:<CountTo to={getSumByType('income', bills.list)} speed={500} digits={2} /></span>
                                    <span className='green'>支:<CountTo to={getSumByType('expenditure', bills.list)} speed={500} digits={2} /></span>
                                </Space>
                            </Flex>
                            <Divider />
                            <BillListTemplate billList={bills.list} deleteBill={deleteBill} />
                        </div>
                    ))
                }
            </Flex>
            <Affix style={{ position: 'absolute', bottom: '20px', right: '20px' }}>
                <Button type="primary" icon={<PlusCircleOutlined />} onClick={toggleModal}>记一笔</Button>
            </Affix>
            {/* 记一笔 */}
            <Model 
                open={isModalOpen} 
                // title={<ModalTitle ref={titleRef}/>}
            >
                {/* <Flex align='center' justify='space-between'>
                    
                    <Button type="primary">确定</Button>
                </Flex> */}
                <Tabs size='small' items={billTabsItems} tabBarExtraContent={<DatePicker size="small" onChange={dateChange} format="YYYY/MM/DD" allowClear={false} value={date} variant="filled" />} />
            </Model>
            {/* <Modal
                title={<ModalTitle title={null} date={date} dateChange={dateChange} />}
                width="550px"
                open={isModalOpen}
                footer={null}
                style={{ bottom: 0}}
                onCancel={toggleModal}
            >
                <Card size='small'>
                    <Tabs size='small' defaultActiveKey="expenditure" items={billTabsItems} />
                </Card>
            </Modal> */}
        </div>
    )
}
//获取收入,支出
function getSumByType(type, list) {
    return list.filter(item => item.type === type && item.included).reduce((prev, cur) => prev + cur.amount, 0)
}
//获取周几
function getWeekName(time) {
    const weekLst = ['星期天', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return weekLst[time.getDay()]
}
//各个form的初始值定义
const initialValues = {
    expenditure: {
        category: 'food',
        class: 'breakfast',
        amount: 0,
        included: true
    },
    income: {
        category: 'income',
        class: 'salary',
        amount: 0,
        included: true
    },
    transfer: {
        commission: 0
    },
    circulate: {
        category: 'borrow',
        class: 'borrow'
    }
}

