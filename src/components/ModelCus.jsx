// 自定义弹窗
import { useEffect } from 'react'
import ReactDOM from 'react-dom'
export default function Model({ open, children }) {
    const root = document.getElementById('root');
    const el = document.createElement('div');
    useEffect(()=> {
        root.appendChild(el)
        return () => {
            root.removeChild(el)
        }
    },[children])
    return ReactDOM.createPortal(
        (
            <div className="modelShadow" style={{ display: open ? 'block' : 'none' }}>
                <div className='modelContainer'>
                    { children }
                </div>
            </div>
        ), 
        el
    )
}