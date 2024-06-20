import { createSlice, nanoid, createAsyncThunk, createEntityAdapter, createSelector } from '@reduxjs/toolkit'
import persistStore from '../index'
import dayjs from 'dayjs';
import { billActions } from './billSlice'

//定义实体
const saveAdapter = createEntityAdapter({
    selectId: (save) => save.id,
    sortComparer: (a, b) => a.createdAt > b.createdAt
})

const initialState = await createInitialState();
const selectors = createSelectors();
const reducers = createReducers();
const extraActions = createExtraActions();
const extraReducers = createExtraReducers();
const slice = createSlice({
    name: 'save',
    initialState,
    selectors,
    reducers,
    extraReducers
})
//输出
export const saveReducer = slice.reducer;
export const saveActions = { ...slice.actions, ...extraActions };
export const { selectById } = saveAdapter.getSelectors(state => state.save);
export const { selectSaveList } = selectors;
//获取初始值
async function createInitialState() {
    const assetList = await persistStore.getItem('saveList');
    if (assetList) return saveAdapter.getInitialState(null, assetList);
    return saveAdapter.getInitialState()
}
//创建查询
function createSelectors() {
    const selectSaveEntities = state => state.save.entities;
    const selectSaveList = createSelector(selectSaveEntities, entities => Object.values(entities).sort((a, b) => b.createdAt - a.createdAt))
    return {
        selectSaveEntities,
        selectSaveList
    }
}
//创建同步
function createReducers() {
    //新增+修改计划
    const updateSave = {
        reducer: (state, action) => {
            saveAdapter.upsertOne(state, action.payload);
        },
        prepare: (init) => {
            return {
                payload: {
                    id: nanoid(),
                    createdAt: Date.now(),
                    ...init
                }
            }
        }
    }
    //完成子计划
    const completeOnePlan = (state,action) => {
        const {completeTime,mainAssetId,secondaryAssetId,icon,billId} = action.payload;
        const plan = state.entities[action.payload.id];

        if(plan.type === "flexible") {
            plan.plans.push({
                id: nanoid(),
                completeTime,
                done: true,
                icon,
                mainAssetId,
                secondaryAssetId,
                saveMoney: action.payload.saveMoney,
                time: completeTime,
                billId
            })
        } else {
            let planSection = plan.plans[action.payload.saveIndex];
            planSection.done = true;
            planSection.completeTime = completeTime;
            planSection.mainAssetId = mainAssetId;
            planSection.secondaryAssetId = secondaryAssetId;
            planSection.icon = icon;
            planSection.billId = billId;
        }
        
    }
    //删除计划
    const removeSave = saveAdapter.removeOne
    //取消存入
    const cancellationOne = (state,action) => {
        //获取计划
        const plan = state.entities[action.payload.id];
        if(plan.type === "flexible") {
            //直接删除
            plan.plans.splice(action.payload.saveIndex,1)
        } else {
            let planSection = plan.plans[action.payload.saveIndex];
            planSection.done = false;
        }
    }
    return {
        updateSave,completeOnePlan,removeSave,cancellationOne
    }


}
//创建异步
function createExtraActions() {
    return {
        loadLocal: loadLocal(),
        saveLocal: saveLocal(),
        addSavaAsync: addSavaAsync(),
        completeOnePlanAsync: completeOnePlanAsync(),
        cancellationOneAsync: cancellationOneAsync()
    }
    // 从localforage加载数据
    function loadLocal() {
        return createAsyncThunk(
            'save/loadSaves',
            async () => {
                const saveList = await persistStore.getItem('saveList');
                return saveList || []
            }
        )
    }
    // 向localforage写入数据
    function saveLocal() {
        return createAsyncThunk(
            'save/saveSaves',
            async (_, { getState }) => {
                const { save } = getState();
                await persistStore.setItem('saveList', Object.values(save.entities))
            }
        )
    }
    //新增存钱计划
    function addSavaAsync() {
        return createAsyncThunk(
            'save/addSavaAsync',
            async (action, { dispatch }) => {
                //制定存钱计划
                let plans = [];
                let targetMoney = 0;
                let frequency = '';
                switch (action.type) {
                    case "everyDay":
                        plans = makeEveryDayPlan(action);
                        targetMoney = 365 * action.task.startMoney + (365 * 364 * action.task.step) / 2;
                        frequency = "每一天";
                        break;
                    case "week52":
                        plans = makeWeek52Plan(action);
                        targetMoney = 52 * action.task.startMoney + (52 * 51 * action.task.step) / 2;
                        frequency = "每一周";
                        break;
                    case "day":
                        plans = makeDayPlan(action);
                        targetMoney = 30 * action.task.startMoney + (30 * 29 * -1) / 2;
                        frequency = "每一天";
                        break;
                    case "month":
                        plans = makeMonthPlan(action);
                        targetMoney = 12 * action.task.startMoney;
                        frequency = "每一月";
                        break;
                    case "week":
                        plans = makeWeekPlan(action)
                        targetMoney = 7 * action.task.startMoney + (7 * 6 * action.task.step) / 2;
                        frequency = "每一天";
                        break;
                    case "quota":
                        plans = makeQuotaPlan(action)
                        targetMoney = action.task.repeat * action.task.startMoney;
                        switch (action.repeatCycle) {
                            case "day":
                                frequency = "每一天"
                                break;
                            case "week":
                                frequency = "每一周"
                                break;
                            case "month":
                                frequency = "每一月"
                                break;
                            case "year":
                                frequency = "每一年"
                                break;
                            default:
                                break;
                        }
                        break;
                    case "flexible":
                        plans = [];
                        targetMoney = action.task.targetMoney
                        //targetMoney 初始就拥有
                        break;
                    default:
                        break;
                }
                //新增存钱计划
                dispatch(saveActions.updateSave({
                    targetMoney,
                    plans,
                    frequency,
                    ...action
                }))
            }
        )
    }
    //完成子计划
    function completeOnePlanAsync(){
        return createAsyncThunk(
            'save/completeOnePlanAsync',
            async (action,{dispatch}) => {
                const billId = nanoid()
               try{
                 // 转账
                 dispatch(billActions.addBillAsync({
                    id: billId,
                    type: 'transfer',
                    mainAssetId: action.mainAssetId,
                    secondaryAssetId: action.secondaryAssetId,
                    commission: 0,
                    amount: action.saveMoney,
                    category: "inner",
                    class: "innerTransfer",
                    date: action.completeTime,
                    description: "存钱:"+ action.emoji + action.name,
                    from: 'save'
                }))
                // 子计划更新
                dispatch(saveActions.completeOnePlan({
                    ...action,
                    billId
                }))
               }catch(e) {
                console.log(e)
               }
            }
        )
    }
    //取消子计划
    function cancellationOneAsync(){
        return createAsyncThunk(
            'save/cancellationOne',
            async (action,{dispatch}) => {
                //回滚转账
                dispatch(billActions.removeBillAsync(action.billId))
                //恢复plans数据
                dispatch(saveActions.cancellationOne(action))
            }
        )
    }
}
//处理异步后序联动
function createExtraReducers() {
    return (builder) => {
        // //数据载入
        // loadLocal();
        // function loadLocal(){
        //     var { fulfilled } = extraActions.loadLocal;
        //     builder.addCase(fulfilled,assetAdapter.addMany)
        // }
    }
}


//计划生成
function makeEveryDayPlan(action) {
    let startTime = dayjs(action.task.startTime)
    let startMoney = action.task.startMoney;
    let step = action.task.step;
    let total = startMoney;
    let plans = [];
    for (let i = 0; i < 356; i++) {
        plans.push({
            id: nanoid(),
            time: startTime.add(i, 'day').format('YYYY/MM/DD'),
            saveMoney: startMoney,
            accumulateMoney: total,
            done: false,
            icon: '',
            completeTime: null
        });
        startMoney += step;
        total += startMoney;
    }
    return plans
}
function makeWeek52Plan(action) {
    let startTime = dayjs(action.task.startTime)
    let startMoney = action.task.startMoney;
    let step = action.task.step;
    let total = startMoney;
    let plans = [];
    for (let i = 0; i < 52; i++) {
        plans.push({
            id: nanoid(),
            time: startTime.add(i, 'week').format('YYYY/MM/DD'),
            saveMoney: startMoney,
            accumulateMoney: total,
            done: false,
            icon: '',
            completeTime: null
        });
        startMoney += step;
        total += startMoney;
    }
    return plans
}
function makeDayPlan(action) {
    let startTime = dayjs(action.task.startTime)
    let startMoney = action.task.startMoney;
    let total = startMoney;
    let plans = [];
    for (let i = 0; i < 30; i++) {
        plans.push({
            id: nanoid(),
            time: startTime.add(i, 'day').format('YYYY/MM/DD'),
            saveMoney: startMoney,
            accumulateMoney: total,
            done: false,
            icon: '',
            completeTime: null
        });
        startMoney -= 1;
        total += startMoney;
    }
    return plans
}
function makeMonthPlan(action) {
    let startTime = dayjs(action.task.startTime)
    let startMoney = action.task.startMoney;
    let total = startMoney;
    let plans = [];
    for (let i = 0; i < 12; i++) {
        plans.push({
            id: nanoid(),
            time: startTime.add(i, 'month').format('YYYY/MM/DD'),
            saveMoney: startMoney,
            accumulateMoney: total,
            done: false,
            icon: '',
            completeTime: null
        });
        total += startMoney;
    }
    return plans
}
function makeWeekPlan(action) {
    let startTime = dayjs(action.task.startTime)
    let startMoney = action.task.startMoney;
    let total = startMoney;
    let step = action.task.step;
    let plans = [];
    for (let i = 0; i < 7; i++) {
        plans.push({
            id: nanoid(),
            time: startTime.add(i, 'day').format('YYYY/MM/DD'),
            saveMoney: startMoney,
            accumulateMoney: total,
            done: false,
            icon: '',
            completeTime: null
        });
        startMoney += step;
        total += startMoney;
    }
    return plans
}
function makeQuotaPlan(action) {
    let startTime = dayjs(action.task.startTime)
    let { startMoney, repeatCycle, repeat } = action.task;
    let total = startMoney;
    let plans = [];
    for (let i = 0; i < repeat; i++) {
        plans.push({
            id: nanoid(),
            time: startTime.add(i, repeatCycle).format('YYYY/MM/DD'),
            saveMoney: startMoney,
            accumulateMoney: total,
            done: false,
            icon: '',
            completeTime: null
        });
        total += startMoney;
    }
    return plans
}
