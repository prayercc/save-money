import { configureStore } from '@reduxjs/toolkit'

import { assetReducer,assetActions } from './slices/assetSlice'
import { billReducer,billActions } from './slices/billSlice'
import { saveReducer,saveActions } from './slices/saveSlice'
//中间件
import logger from 'redux-logger'  //日志

export default configureStore({
    reducer: {
        asset: assetReducer,
        bill: billReducer,
        save: saveReducer
    },
    //日志插件属于中间件
    //建议放在最后一个
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger), 
    devTools: process.env.NODE_ENV !== 'production'
})

//持久化数据
export const persistence = (dispatch) => {
    return () => {
        dispatch(assetActions.saveLocal())
        dispatch(billActions.saveLocal())
        dispatch(saveActions.saveLocal())
    }
}