import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
//注入redux
import store from './store/reduxStore';
import { Provider } from 'react-redux';
//注入路由
import { RouterProvider,createBrowserRouter } from 'react-router-dom'
import routerConfig from './routers'

const router= createBrowserRouter(routerConfig)
// store.dispatch('asset/loadAsset');
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} fallbackElement={<p>路由加载中...</p>} />
    </Provider>
  </React.StrictMode>,
)
