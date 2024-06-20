import { CreditCardOutlined,AccountBookOutlined,BookOutlined } from '@ant-design/icons';
import { ConfigProvider,theme as globalTheme,Layout,Menu} from 'antd'
const { Header, Content } = Layout;

import { Outlet,useNavigate } from 'react-router-dom'
import { useEffect } from 'react';
import { useDispatch } from 'react-redux'
import { persistence } from '../store/reduxStore';
export default function DashBoard(){
    //数据持久化
    const dispatch = useDispatch()
    // useEffect(()=> {
    //     const saveData = persistence(dispatch)
    //     window.addEventListener('beforeunload',saveData);
    //     return () => {
    //         window.removeEventListener('beforeunload',saveData)
    //     }
    // },[])
    //路由导航
    const navigate = useNavigate();
    const menuClick = (e) => {
        navigate(e.key)
    }
    return (
        <ConfigProvider theme={{ algorithm: globalTheme.darkAlgorithm,components}} renderEmpty={renderEmpty}>
            <Layout style={{height: '100%',width: '100%'}}>
                <Header style={{padding: '0 10px'}}>
                    <Menu 
                        mode="horizontal"
                        items={menuItems} 
                        onClick={menuClick}
                        style={{ width: '100%',background: 'transparent'}} 
                    ></Menu>
                </Header>
                <Layout>
                    <Content style={{ position:'relative'}}>
                        <Outlet />
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    )
}
// 菜单配置
const menuItems = [
    {
        label: '账单',
        key: 'billList',
        icon: <BookOutlined />
    },
    {
        label: '资产',
        key: 'assetList',
        icon: <CreditCardOutlined />
    },
    {
        label: '存钱',
        key: 'saveList',
        icon: <AccountBookOutlined />
    }
]
//主题变量
const components = {
    Segmented: {
        itemSelectedColor: '#3992ff'
    }
}
//空状态显示
const renderEmpty = () => (<span style={{fontSize: '12px'}}>暂无数据</span>)