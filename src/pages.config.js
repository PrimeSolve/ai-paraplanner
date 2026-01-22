import Home from './pages/Home';
import FactFindStart from './pages/FactFindStart';
import FactFindStep1 from './pages/FactFindStep1';
import AdminDashboard from './pages/AdminDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "FactFindStart": FactFindStart,
    "FactFindStep1": FactFindStep1,
    "AdminDashboard": AdminDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};