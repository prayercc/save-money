import { createSlice,nanoid, createAsyncThunk, createEntityAdapter,createSelector } from '@reduxjs/toolkit'
import dayjs from 'dayjs';
import persistStore from '../index'
import { assetActions } from './assetSlice'

//定义实体
const billAdapter = createEntityAdapter({
    selectId : (bill) => bill.id,
    // sortComparer :(a,b) => a.createdAt > b.createdAt ? 1 : -1
})

const initialState = await createInitialState();
const selectors = createSelectors();
const reducers = createReducers();
const extraActions = createExtraActions();
const extraReducers = createExtraReducers();
const slice = createSlice({
    name: 'bill',
    initialState,
    selectors,
    reducers,
    extraReducers
})
//输出
export const billReducer = slice.reducer;
export const billActions = {...slice.actions,...extraActions};
export const { selectEntities,selectById } = billAdapter.getSelectors(state => state.bill);
export const { selectBillsList,selectThreeDays } = selectors
//获取初始值
async function createInitialState() {
    const billList = await persistStore.getItem('billList') || [];
    return billAdapter.getInitialState(null,billList)
}
//创建查询
function createSelectors(){
    //今天
    const today = new Date();
    const todayStr = dayjs(today).format('YYYY/MM/DD')
    //昨天
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = dayjs(yesterday).format('YYYY/MM/DD')
    //前天
    const beforeYesterday = new Date();
    beforeYesterday.setDate(beforeYesterday.getDate() - 2)
    const beforeYesterdayStr = dayjs(beforeYesterday).format('YYYY/MM/DD')
    // 
    // 
    // 
    //获取bill entities
    const selectBillEntities = state => state.bill.entities;
    //倒序
    const selectBillsList = createSelector(selectBillEntities,(entities) => Object.values(entities).sort((a,b) => b.createdAt - a.createdAt))
    //最近三天数据
    const selectThreeDays = createSelector(selectBillsList,(list) => [
        {
            name: '今天',
            time: today,
            list: list.filter(item => item.date == todayStr)
        },
        {
            name: '昨天',
            time: yesterday,
            list: list.filter(item => item.date == yesterdayStr)
        },
        {
            name: '前天',
            time: beforeYesterday,
            list: list.filter(item => item.date == beforeYesterdayStr)
        }
    ])
    return {
        selectBillsList,
        selectThreeDays
    }
}
//创建同步
function createReducers(){
    //新增账单
    const addBill = {
        reducer:(state,action) => {
            billAdapter.addOne(state,action.payload);
        },
        prepare: (initBill) => {
            return {
                payload: {
                    id: nanoid(),
                    createdAt: Date.now(),
                    ...initBill
                }
            }
        }
    }
    //删除账单
    const deleteBill = billAdapter.removeOne
    return {
        deleteBill,addBill
    }
}
//创建异步
function createExtraActions(){
    return {
        loadLocal: loadLocal(),
        saveLocal: saveLocal(),
        addBillAsync: addBillAsync(),
        removeBillAsync: removeBillAsync()
    }
    //从localforage加载数据
    function loadLocal(){
        return createAsyncThunk(
            'bill/loadBills',
            async () => {
                const billList = await persistStore.getItem('billList');
                return billList || []
            }
        )
    }
    //向localforage写入数据
    function saveLocal(){
        return createAsyncThunk(
            'bill/saveBills',
            async (_,{getState}) => {
                const { bill } = getState();
                await persistStore.setItem('billList',Object.values(bill.entities))
            }
        )
    }
    //新增账单以及相关逻辑
    function addBillAsync(){
        return createAsyncThunk(
            'bill/addBillAsync',
            async (action,{dispatch}) => {
                if(action.type === "expenditure"){
                    //支出
                    dispatch(assetActions.decreaseAssetById({
                        id: action.mainAssetId,
                        amount: action.amount
                    }))
                } else if(action.type === "income") {
                    //收入
                    dispatch(assetActions.increaseAssetById({
                        id: action.mainAssetId,
                        amount: action.amount
                    }))
                } else if(action.type === "transfer") {
                    //转账
                    dispatch(assetActions.decreaseAssetById({
                        id: action.mainAssetId,
                        amount: action.amount + action.commission
                    }))
                    dispatch(assetActions.increaseAssetById({
                        id: action.secondaryAssetId,
                        amount: action.amount
                    }))
                } else if(action.type === "circulate") {
                    //借还
                    let mainAssetId = null;
                    let secondaryAssetId = null;
                    //确定转出账户mainAssetId，转入账户secondaryAssetId
                    switch(action.class){
                        //借入和收债都是从a 到 b
                        case "borrow":
                        case "debtCollection":
                            mainAssetId = action.mainAssetId;
                            secondaryAssetId = action.secondaryAssetId;
                            break;
                        //还债和借出都是从b到a
                        case "repayment":
                        case "lend":
                            mainAssetId = action.secondaryAssetId;
                            secondaryAssetId = action.mainAssetId;
                            break;
                        //债务削减，a进账
                        case "debtReduction":
                            secondaryAssetId = action.mainAssetId;
                            break;
                        //坏账损失，a支出
                        case "badDebts":
                            mainAssetId = action.mainAssetId;
                            break;
                        default:
                            break;
                    }
                    if(mainAssetId){
                        dispatch(assetActions.decreaseAssetById({
                            id: mainAssetId,
                            amount: action.amount
                        }))
                    }
                    if(secondaryAssetId) {
                        dispatch(assetActions.increaseAssetById({
                            id: secondaryAssetId,
                            amount: action.amount
                        }))
                    }
                }
                //新增账单
                dispatch(billActions.addBill(action))
            }
        )
    }
    //删除账单以及相关逻辑
    function removeBillAsync(){
        return createAsyncThunk(
            'bill/removeBillAsync',
            async (id,{dispatch,getState}) => {
                const { bill } = getState();
                const currBill = bill.entities[id]
                // 判定账单类型
                if(currBill.type === "expenditure"){
                    //支出
                    dispatch(assetActions.increaseAssetById({
                        id: currBill.mainAssetId,
                        amount: currBill.amount
                    }))
                } else if(currBill.type === "income") {
                    //收入
                    dispatch(assetActions.decreaseAssetById({
                        id: currBill.mainAssetId,
                        amount: currBill.amount
                    }))
                } else if(currBill.type === "transfer") {
                    //转账
                    dispatch(assetActions.increaseAssetById({
                        id: currBill.mainAssetId,
                        amount: currBill.amount + currBill.commission
                    }))
                    dispatch(assetActions.decreaseAssetById({
                        id: currBill.secondaryAssetId,
                        amount: currBill.amount
                    }))
                } else if(currBill.type === "circulate") {
                    //支出账户，收入账户
                    let mainAssetId = null;
                    let secondaryAssetId = null;
                    //借还
                    switch(currBill.class){
                        //借入和收债都是从a 到 b,删除反过来
                        case "borrow":
                        case "debtCollection":
                            mainAssetId = currBill.secondaryAssetId;
                            secondaryAssetId = currBill.mainAssetId;
                            break;
                        //还债和借出都是从b到a,删除反过来
                        case "repayment":
                        case "lend":
                            mainAssetId = currBill.mainAssetId;
                            secondaryAssetId = currBill.secondaryAssetId;
                            break;
                        //债务削减，a进账,删除反过来
                        case "debtReduction":
                            mainAssetId = currBill.mainAssetId;
                            break;
                        //坏账损失，a支出,删除反过来
                        case "badDebts":
                            secondaryAssetId = currBill.mainAssetId;
                            break;
                        default:
                            break;
                    }
                    if(mainAssetId) {
                        dispatch(assetActions.decreaseAssetById({
                            id: mainAssetId,
                            amount: currBill.amount
                        }))
                    }
                    if(secondaryAssetId){
                        dispatch(assetActions.increaseAssetById({
                            id: secondaryAssetId,
                            amount: currBill.amount
                        }))
                    }
                }
                //移除账单
                dispatch(billActions.deleteBill(id))
            }
        )
    }
}
//处理异步后序联动
function createExtraReducers(){
    return (builder) => {
        loadLocal();
        function loadLocal(){
            var { fulfilled } = extraActions.loadLocal;
            builder.addCase(fulfilled,billAdapter.addMany)
        }
    }
}
