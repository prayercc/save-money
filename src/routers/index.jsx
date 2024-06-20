// import Home,{action as homeAction,loader as homeLoader} from '../pages/Home'
// import Error from '../pages/Error.jsx'
// import Contact,{loader as contactLoader,action as contactAction} from '../pages/Contact'
// import EditContact,{action as editAction} from '../pages/EditContact'
// import { action as destroyAction} from '../pages/Destroy'
// import Index from '../pages/Index'
// import Other from '../pages/Other'
//配置路由
// const routerConfig = [
//     {
//         id: 'home',
//         path: '/',
//         element: <Home />,
//         errorElement: <Error />,
//         //路由渲染前执行
//         loader: homeLoader,
//         action:homeAction,
//         children: [
//           {
//             id: 'tempWrapper',
//             //一个只有errorElement和children的路由
//             //目的：让内部子路由共享错误处理
//             errorElement: <Error />,
//             children: [
//               {
//                 id: 'index',
//                 index: true,
//                 element: <Index />
//               },
//               {
//                 id: 'contact',
//                 path: "contacts/:contactId",
//                 element: <Contact />,
//                 loader:contactLoader,
//                 action:contactAction
//               },
//               {
//                 id: 'edit',
//                 path: "contacts/:contactId/edit",
//                 element: <EditContact />,
//                 loader: contactLoader,
//                 action: editAction
//               },
//               {
//                 id: 'destroy',
//                 path: "contacts/:contactId/destroy",
//                 action: destroyAction,
//                 errorElement: <div>Oops! There was an error.</div>
//               },
//               {
//                 id: 'other',
//                 path: 'other',
//                 element: <Other/>
//               }
//             ]
//           }
//         ]
//       }
// ]
import DashBoard from "../pages/DashBoard"
import AssetList from "../pages/Asset/AssetList"
  import AssetEdit from "../pages/Asset/AssetEdit"
import BillList from "../pages/Bill/BillList"
import SaveList from "../pages/SaveMoney/SaveList"
import SaveDetail from "../pages/SaveMoney/SaveDetail"
  const routerConfig = [
  {
    id: 'dashboard',
    path: '/',
    element: <DashBoard />,
    children: [
      {
        index: true,
        id: 'billList',
        element: <BillList />
      },
      {
        id: 'billList2',
        path: 'billList',
        element: <BillList />
      },
      {
        id: 'assetListBox',
        path: 'assetList',
        children: [
          {
            index: true,
            id: 'assetList',
            element: <AssetList />
          },
          {
            id: 'assetEdit',
            path: 'edit',
            element: <AssetEdit />
          },
        ]
      },
      {
        id: 'saveListBox',
        path: 'saveList',
        children: [
          {
            id: 'saveList',
            index: true,
            element: <SaveList />
          },
          {
            id: 'saveDetail',
            path: ':saveId/detail',
            element: <SaveDetail />
          }
        ]
      }
    ]
  }
]
export default routerConfig