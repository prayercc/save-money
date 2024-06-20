import { createSlice,nanoid, createAsyncThunk, createEntityAdapter,createSelector } from '@reduxjs/toolkit'
import persistStore from '../index'

//定义实体
const assetAdapter = createEntityAdapter({
    selectId: (asset) => asset.id,
    sortComparer:(a,b) => a.createdAt > b.createdAt
})

const initialState = await createInitialState();
const selectors = createSelectors();
const reducers = createReducers();
const extraActions = createExtraActions();
const extraReducers = createExtraReducers();
const slice = createSlice({
    name: 'asset',
    initialState,
    selectors,
    reducers,
    extraReducers
})
//输出
export const assetReducer = slice.reducer;
export const assetActions = {...slice.actions,...extraActions};
export const { selectEntities,selectById } = assetAdapter.getSelectors(state => state.asset);
export const { selectAssetList,selectBorrowList,selectLentList,selectPureList } = selectors;
//获取初始值
async function createInitialState() {
    const assetList = await persistStore.getItem('assetList');
    if(assetList) return assetAdapter.getInitialState(null,assetList);
    return assetAdapter.getInitialState()
}
//创建查询
function createSelectors(){
    const selectAssetEntities = state => state.asset.entities
    //查询资产列表
    const selectAllList = createSelector(selectAssetEntities,entities => Object.values(entities))
    //纯资产列表
    const selectPureList = createSelector(selectAllList,list => list.filter(item => item.status === "property" && item.assetName !== "借出"))
    //查询资产列表，非借入，借出
    const selectAssetList = createSelector(selectAllList,list => list.filter(item => !["借入","借出"].includes(item.assetName)))
    //借入资产列表
    const selectBorrowList = createSelector(selectAllList,list => list.filter(item => item.assetName == "借入"))
    //借出资产列表
    const selectLentList = createSelector(selectAllList,list => list.filter(item => item.assetName == "借出"))
    return {
        selectAssetList,selectBorrowList,selectLentList,selectPureList
    }
}
//创建同步
function createReducers(){
    //新增+修改资产
    const updateAsset = {
        reducer:(state,action) => {
            assetAdapter.upsertOne(state,action.payload);
        },
        prepare: (initAsset) => {
            return {
                payload: {
                    id: nanoid(),
                    createdAt: Date.now(),
                    ...initAsset
                }
            }
        }
    }
    // 删除资产
    const deleteAsset = assetAdapter.removeOne
    //资产增加额度
    const increaseAssetById = (state,action) => {
        const asset = state.entities[action.payload.id]
        asset.fund.balance += action.payload.amount;
    }
    //减少增加额度
    const decreaseAssetById = (state,action) => {
        const asset = state.entities[action.payload.id]
        asset.fund.balance -= action.payload.amount;
    }
    return {
        deleteAsset,updateAsset,decreaseAssetById,increaseAssetById
    }
    

}
//创建异步
function createExtraActions(){
    return {
        loadLocal: loadLocal(),
        saveLocal: saveLocal()
    }
    //从localforage加载数据
    function loadLocal(){
        return createAsyncThunk(
            'asset/loadAssets',
            async () => {
                const assetList = await persistStore.getItem('assetList');
                return assetList || []
            }
        )
    }
    //向localforage写入数据
    function saveLocal(){
        return createAsyncThunk(
            'asset/saveAssets',
            async (_,{getState}) => {
                const { asset } = getState();
                await persistStore.setItem('assetList',Object.values(asset.entities))
            }
        )
    }
}
//处理异步后序联动
function createExtraReducers(){
    return (builder) => {
        //数据载入
        loadLocal();
        function loadLocal(){
            var { fulfilled } = extraActions.loadLocal;
            builder.addCase(fulfilled,assetAdapter.addMany)
        }
    }
}
